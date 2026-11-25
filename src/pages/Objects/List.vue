<template>
  <div class="list-container">
    <!-- GenericList Component -->
    <GenericList
      :store="objectsStore"
      :config="listConfig"
      @create="openCreate"
      @action="handleAction"
    >
      <!-- Custom column for address -->
      <template #column-address="{ value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-subtle">—</span>
      </template>

      <!-- Custom column for date_start -->
      <template #column-date_start="{ value }">
        <span v-if="value">{{ formatDate(value) }}</span>
        <span v-else class="text-subtle">—</span>
      </template>

      <!-- Custom column for date_end -->
      <template #column-date_end="{ value }">
        <span v-if="value">{{ formatDate(value) }}</span>
        <span v-else class="text-subtle">—</span>
      </template>

      <!-- Custom column for responsible -->
      <template #column-responsible="{ item, value }">
        <span v-if="value && item.responsible_name">{{ item.responsible_name }}</span>
        <span v-else-if="value">{{ getResponsibleName(value) || `ID: ${value}` }}</span>
        <span v-else class="text-subtle">—</span>
      </template>

      <!-- Custom column for is_active -->
      <template #column-is_active="{ value }">
        <div class="badge" :class="value ? 'badge-success' : 'badge-error'">
          {{ value ? 'Активный' : 'Неактивный' }}
        </div>
      </template>
    </GenericList>

    <!-- Modal -->
    <Modal v-model="modalOpen" :title="modalTitle" size="lg" :closable="true">
      <ObjectForm :initial="current" @saved="onSaved" @cancel="modalOpen=false" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { SiteObject } from '@/api/types'
import type { GenericListConfig } from '@/types/generic'
import { formatDate } from '@/utils/formatters'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useObjectsStore, fetchResponsibles } from '@/stores/objects'
import { usePermissions } from '@/composables/usePermissions'
import { useEditQuery } from '@/composables/useEditQuery'
import { useUiStore } from '@/stores/ui'
import Modal from '@/components/Modal.vue'
import ObjectForm from './ObjectForm.vue'
import GenericList from '@/components/GenericList.vue'
import ObjectCard from '@/components/cards/ObjectCard.vue'
import { useAuthStore } from '@/stores/auth'
import { parseApiError } from '@/utils/errorHandler'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'

// Stores
const router = useRouter()
const objectsStore = useObjectsStore()
const authStore = useAuthStore()
const ui = useUiStore()
// F-592: ?edit=<id> открывает форму редактирования (как на Purchases/Materials/… — паритет диплинков).
useEditQuery(objectsStore, openEdit)

// Error handling
const { handleLoadingError, handleDeleteError } = useErrorHandler()

// State
const modalOpen = ref(false)
const current = ref<SiteObject | null>(null)

// ✅ RBAC: используем permissions
const { can, canExportReports } = usePermissions()

// Computed
const canEdit = computed(() => can('objects', 'edit'))
const canCreate = computed(() => can('objects', 'create'))  // F-877: create-кнопка гейтилась по .edit (fail-open, класс F-872/F-863)

const modalTitle = computed(() => {
  return current.value ? 'Редактировать объект' : 'Добавить объект'
})

// Filter options
const statusOptions = computed(() => [
  { value: '', label: 'Все статусы' },
  { value: 'true', label: 'Активные' },
  { value: 'false', label: 'Неактивные' }
])

// State for responsibles (это EmployeeProfile.id с бэка)
const responsibles = ref<Array<{ id: number; name: string; objects_count: number }>>([])

const responsibleOptions = computed(() => [
  { value: '', label: 'Все ответственные' },
  ...responsibles.value.map(resp => ({
    value: resp.id,
    label: `${resp.name} (${resp.objects_count})`
  }))
])

// GenericList configuration
const listConfig = computed<GenericListConfig<SiteObject>>(() => ({
  title: 'Объекты',
  icon: 'M3 21h18v-2H3v2zM5 10h14V8H5v2zm0-4h14V4H5v2z',
  showCreate: canCreate.value,
  createText: 'Добавить объект',
  canCreate: canCreate.value,
  showStats: true,
  exportable: canExportReports.value, // ✅ RBAC: контроль экспорта через permissions
  exportFilename: 'objects',
  exportUrl: '/api/v1/objects/', // F-626: было /common/objects/ → 404
  loadingText: 'Загрузка объектов...',
  emptyText: 'Нет объектов',
  emptyTitle: 'Нет объектов',
  emptySubtitle: 'Создайте первый объект для начала работы',
  filterColumns: 4,
  columns: [
    { key: 'name', label: 'Название', sortable: true },
    { key: 'address', label: 'Адрес', sortable: true },
    { key: 'responsible', label: 'Ответственный', sortable: true },
    { key: 'date_start', label: 'Дата начала', sortable: true },
    { key: 'date_end', label: 'Дата окончания', sortable: true },
    { key: 'is_active', label: 'Активность', sortable: true }
  ],
  filters: [
    {
      key: 'name',
      type: 'text',
      label: 'Название',
      placeholder: 'Название объекта'
    },
    {
      key: 'responsible',
      type: 'select',
      label: 'Ответственный',
      options: responsibleOptions.value
    },
    {
      key: 'is_active',
      type: 'select',
      label: 'Статус',
      options: statusOptions.value
    }
  ],
  actions: [
    {
      key: 'view',
      label: 'Открыть',
      class: 'btn-outline'
    },
    {
      key: 'edit',
      label: 'Редактировать',
      class: 'btn-outline',
      disabled: () => !canEdit.value
    },
    {
      // F-1107 (ответ владельца 3): архив — явным действием (раньше «Удалить» архивировал молча, B13)
      key: 'archive',
      label: 'В архив',
      permission: 'objects.delete',
      visible: (item: SiteObject) => item.is_active
    },
    {
      key: 'unarchive',
      label: 'Вернуть из архива',
      permission: 'objects.delete',
      visible: (item: SiteObject) => !item.is_active
    },
    {
      key: 'delete',
      label: 'Удалить',
      class: 'btn-error',
      permission: 'objects.delete', // F-863 (perm-audit): гейт по DELETE-праву (было !canEdit = EDIT → fail-open)
      disabled: (item: SiteObject) => !item.is_active,
      confirm: (item: SiteObject) => deleteQuestion(item)
    },
    {
      // F-1107: тестовый объект со всеми документами — только администратор и только из архива
      key: 'purge',
      label: 'Удалить с документами',
      class: 'btn-error btn-outline',
      visible: (item: SiteObject) => !item.is_active && authStore.me?.is_superuser === true
    }
  ],
  mobileCardComponent: ObjectCard,
  mobileCardProp: 'object',
  defaultSort: 'name',
  defaultSortOrder: 'asc'
}))

// Methods
function getResponsibleName(responsibleId: number): string | null {
  const responsible = responsibles.value.find(resp => resp.id === responsibleId)
  return responsible ? responsible.name : null
}

function openCreate() {
  current.value = null
  modalOpen.value = true
}

function openEdit(object: SiteObject) {
  current.value = object
  modalOpen.value = true
}

async function handleAction(action: string, item: SiteObject) {
  switch (action) {
    case 'view':
      router.push({ name: 'ObjectInfo', params: { id: item.id } })
      break
    case 'edit':
      openEdit(item)
      break
    case 'delete':
      await handleDelete(item)
      break
    case 'archive':
      await setActive(item, false)
      break
    case 'unarchive':
      await setActive(item, true)
      break
    case 'purge':
      await handlePurge(item)
      break
  }
}

// F-1107 (ответ владельца 3): «Удалить» — только для объекта без документов; с документами сервер отвечает
// «отправьте в архив» (400, текст показывает handleDeleteError)
function deleteQuestion(item: SiteObject): string {
  return `Удалить объект «${item.name}»? Объект с документами удалить нельзя — его отправляют в архив.`
}

async function handleDelete(object: SiteObject) {
  if (!confirm(deleteQuestion(object))) {return}
  try {
    await objectsStore.remove(object.id)
    ui.toast({ type: 'success', text: `Объект «${object.name}» удалён` })
    await objectsStore.fetchList()
  } catch (error) {
    await handleDeleteError(error, 'object', object.id)
  }
}

async function setActive(object: SiteObject, active: boolean) {
  const question = active
    ? `Вернуть объект «${object.name}» из архива?`
    : `Отправить объект «${object.name}» в архив? Его документы сохранятся, новые операции по нему вносить не будут.`
  if (!confirm(question)) {return}
  try {
    await objectsStore.update(object.id, { is_active: active })
    ui.toast({ type: 'success', text: active ? 'Объект возвращён из архива' : 'Объект в архиве' })
    await objectsStore.fetchList()
  } catch (error) {
    ui.toast({ type: 'error', text: parseApiError(error).detail })
  }
}

async function handlePurge(object: SiteObject) {
  const typed = prompt(`Удалить «${object.name}» со всеми закупками, списаниями и движениями? Это нельзя отменить. `
    + 'Для подтверждения введите название объекта точно:')
  if (typed === null) {return}
  // F-1111 (ревью): как на сервере — без ловушек клавиатуры iOS (заглавная буква, «умные» кавычки, пробел в конце)
  const norm = (t: string) => t.normalize('NFKC').replace(/[«»“”„‟"']/g, '"').replace(/\s+/g, ' ').trim().toLowerCase()
  if (norm(typed) !== norm(object.name)) {
    ui.toast({ type: 'error', text: 'Название введено неточно — ничего не удалено' })
    return
  }
  try {
    await api.post(endpoints.objects.purge(object.id), { confirm_name: typed })
    ui.toast({ type: 'success', text: `Объект «${object.name}» удалён со всеми документами` })
    await objectsStore.fetchList()
  } catch (error) {
    ui.toast({ type: 'error', text: parseApiError(error).detail })
  }
}

async function onSaved() {
  modalOpen.value = false
  ui.toast({ type: 'success', text: 'Объект сохранен' })
  await objectsStore.fetchList()
}

// Lifecycle
onMounted(async () => {
  try {
    // ВАЖНО: это правильные id (EmployeeProfile.id), а не User.id
    responsibles.value = await fetchResponsibles()
    await objectsStore.fetchList()
  } catch (error) {
    await handleLoadingError(error, 'objects')
  }
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>
