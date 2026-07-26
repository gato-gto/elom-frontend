<template>
  <div class="list-container">
    <!-- GenericList Component -->
    <GenericList
      :store="objectsStore"
      :config="listConfig"
      @create="openCreate"
      @action="handleAction"
      @export="handleExport"
    >
      <!-- Custom column for address -->
      <template #column-address="{ item, value }">
        <span v-if="value">{{ value }}</span>
        <span v-else class="text-subtle">—</span>
      </template>

      <!-- Custom column for date_start -->
      <template #column-date_start="{ item, value }">
        <span v-if="value">{{ formatDate(value) }}</span>
        <span v-else class="text-subtle">—</span>
      </template>

      <!-- Custom column for date_end -->
      <template #column-date_end="{ item, value }">
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
      <template #column-is_active="{ item, value }">
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
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/export'
import { useObjectsStore, fetchResponsibles } from '@/stores/objects'
import { usePermissions } from '@/composables/usePermissions'
import { useUiStore } from '@/stores/ui'
import Modal from '@/components/Modal.vue'
import ObjectForm from './ObjectForm.vue'
import GenericList from '@/components/GenericList.vue'
import ObjectCard from '@/components/cards/ObjectCard.vue'

// Stores
const router = useRouter()
const objectsStore = useObjectsStore()
const ui = useUiStore()

// Error handling
const { handleLoadingError, handleDeleteError } = useErrorHandler()

// State
const modalOpen = ref(false)
const current = ref<SiteObject | null>(null)

// ✅ RBAC: используем permissions
const { can, canExportReports } = usePermissions()

// Computed
const canEdit = computed(() => can('objects', 'edit'))

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
  subtitle: 'Управление строительными объектами и их характеристиками',
  icon: 'M3 21h18v-2H3v2zM5 10h14V8H5v2zm0-4h14V4H5v2z',
  showCreate: canEdit.value,
  createText: 'Добавить объект',
  canCreate: canEdit.value,
  showStats: true,
  exportable: canExportReports.value, // ✅ RBAC: контроль экспорта через permissions
  exportFilename: 'objects',
  exportUrl: '/api/v1/common/objects/',
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
      key: 'delete',
      label: 'Удалить',
      class: 'btn-error',
      disabled: (item: SiteObject) => !canEdit.value || !item.is_active,
      confirm: (item: SiteObject) =>
        `Удалить объект "${item.name}"? Если у объекта есть связанные записи (закупки, списания), он будет деактивирован.`
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

async function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    const data = objectsStore.items
    const filename = `objects_${new Date().toISOString().split('T')[0]}`

    switch (format) {
      case 'csv':
        exportToCSV(data, filename)
        break
      case 'excel':
        exportToExcel(data, filename)
        break
      case 'pdf':
        exportToPDF(data, filename)
        break
    }
  } catch (error) {
    await handleLoadingError(error, 'objects')
  }
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
  }
}

async function handleDelete(object: SiteObject) {
  const confirmMessage =
    `Удалить объект "${object.name}"?\n\nЕсли у объекта есть связанные записи (закупки, списания), он будет деактивирован.`
  if (!confirm(confirmMessage)) {return}

  try {
    const response = await objectsStore.remove(object.id)

    if (response && (response as any).action === 'deactivated') {
      ui.toast({
        type: 'info',
        text: `Объект "${object.name}" деактивирован (имеет связанные записи)`
      })
    } else {
      ui.toast({ type: 'success', text: `Объект "${object.name}" удален` })
    }

    await objectsStore.fetchList()
  } catch (error) {
    await handleDeleteError(error, 'object', object.id)
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
