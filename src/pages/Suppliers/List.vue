<template>
  <div class="list-container">
    <!-- GenericList Component -->
    <GenericList
      :store="suppliersStore"
      :config="listConfig"
      @create="openCreate"
      @action="handleAction"
      @export="handleExport"
    >
      <!-- Custom column for supplier name with status -->
      <template #column-name="{ item, value }">
        <div class="flex items-center gap-3">
          <div>
            <div class="font-medium text-base-content">{{ value }}</div>
            <div class="text-sm text-muted">
              <span class="badge" :class="item.is_active ? 'badge-success badge-xs' : 'badge-error badge-xs'">
                {{ item.is_active ? 'Активен' : 'Неактивен' }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </GenericList>

    <!-- Supplier Form Modal -->
    <Modal v-model="modalOpen" :title="current ? 'Редактировать поставщика' : 'Новый поставщик'" size="3xl">
      <SupplierForm 
        :initial="current" 
        @saved="onSaved" 
        @cancel="modalOpen = false"
      />
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal
      v-model="showDeleteModal"
      title="Подтверждение удаления"
    >
      <div class="p-6">
        <p class="text-muted mb-4">
          Вы уверены, что хотите удалить поставщика 
          <strong>{{ deletingSupplier?.name }}</strong>?
        </p>
        <p class="text-sm text-muted mb-6">
          Это действие нельзя отменить. Удалить можно только поставщика без связанных закупок.
        </p>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost" @click="showDeleteModal = false">
            Отмена
          </button>
          <button 
            class="btn btn-error" 
            :class="{ 'loading': deleting }"
            @click="handleDelete"
          >
            <svg v-if="!deleting" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            {{ deleting ? 'Удаление...' : 'Удалить' }}
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { PurchaseSupplier } from '@/api/types'
import type { GenericListConfig } from '@/types/generic'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/export'
import SupplierForm from './SupplierForm.vue'
import { usePermissions } from '@/composables/usePermissions'
import { useEditQuery } from '@/composables/useEditQuery'
import { useSuppliersStore } from '@/stores/suppliers'
import { useUiStore } from '@/stores/ui'
import Modal from '@/components/Modal.vue'
import GenericList from '@/components/GenericList.vue'
import SupplierCard from '@/components/cards/SupplierCard.vue'

// Stores
const suppliersStore = useSuppliersStore()
const ui = useUiStore()

// Error handling
const { handleLoadingError, handleDeleteError } = useErrorHandler()

// State
const modalOpen = ref(false)
const current = ref<PurchaseSupplier | null>(null)
const showDeleteModal = ref(false)
const deletingSupplier = ref<PurchaseSupplier | null>(null)
const deleting = ref(false)

// ✅ RBAC: проверка через permissions
const { can, canExportReports } = usePermissions()
const canEdit = computed(() => can('suppliers', 'edit'))
const canDelete = computed(() => can('suppliers', 'delete'))

// Filter options
const statusFilterOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'true', label: 'Активные' },
  { value: 'false', label: 'Неактивные' }
]

const orderingOptions = [
  { value: 'name', label: 'По названию (А-Я)' },
  { value: '-name', label: 'По названию (Я-А)' },
  { value: 'contact_person', label: 'По контактному лицу' },
  { value: 'created_at', label: 'По дате создания' },
  { value: '-created_at', label: 'По дате создания (новые)' }
]

// GenericList configuration
const listConfig = computed<GenericListConfig<PurchaseSupplier>>(() => ({
  title: 'Поставщики',
  subtitle: 'Управление поставщиками материалов и услуг',
  icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  showCreate: canEdit.value,
  createText: 'Добавить поставщика',
  canCreate: canEdit.value,
  showStats: true,
  exportable: canExportReports.value, // ✅ RBAC: контроль экспорта через permissions
  exportFilename: 'suppliers',
  loadingText: 'Загрузка поставщиков...',
  emptyText: 'Нет поставщиков',
  emptyTitle: 'Нет поставщиков',
  emptySubtitle: 'Создайте первого поставщика для начала работы',
  filterColumns: 3,
  columns: [
    { key: 'name', label: 'Название', sortable: true },
    { key: 'contact_person', label: 'Контактное лицо', sortable: true },
    { key: 'phone', label: 'Телефон', sortable: true },
    { key: 'email', label: 'Email', sortable: true }
  ],
  filters: [
    {
      key: 'search',
      type: 'text',
      label: 'Поиск',
      placeholder: 'Название, контактное лицо'
    },
    {
      key: 'is_active',
      type: 'select',
      label: 'Статус',
      options: statusFilterOptions
    },
    {
      key: 'ordering',
      type: 'select',
      label: 'Сортировка',
      options: orderingOptions
    }
  ],
  actions: [
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
      disabled: () => !canDelete.value,
      confirm: (item: PurchaseSupplier) => `Удалить поставщика "${item.name}"?`
    }
  ],
  mobileCardComponent: SupplierCard,
  mobileCardProp: 'supplier',
  defaultSort: 'name',
  defaultSortOrder: 'asc'
}))

// Methods
function openCreate() {
  current.value = null
  modalOpen.value = true
}

function openEdit(supplier: PurchaseSupplier) {
  current.value = supplier
  modalOpen.value = true
}

function confirmDelete(supplier: PurchaseSupplier) {
  deletingSupplier.value = supplier
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!deletingSupplier.value) {return}
  
  deleting.value = true
  try {
    await suppliersStore.remove(deletingSupplier.value.id)
    ui.toast({ type: 'success', text: 'Поставщик удален' })
    showDeleteModal.value = false
    deletingSupplier.value = null
  } catch (error) {
    await handleDeleteError(error, 'supplier', deletingSupplier.value?.id)
  } finally {
    deleting.value = false
  }
}

async function onSaved() {
  modalOpen.value = false
  current.value = null
  await suppliersStore.fetchList()
  ui.toast({ type: 'success', text: 'Поставщик сохранен' })
}

async function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    const data = suppliersStore.items
    const filename = `suppliers_${new Date().toISOString().split('T')[0]}`

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
    await handleLoadingError(error, 'suppliers')
  }
}

async function handleAction(action: string, item: PurchaseSupplier) {
  switch (action) {
    case 'edit':
      openEdit(item)
      break
    case 'delete':
      confirmDelete(item)
      break
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await suppliersStore.fetchList()
  } catch (error) {
    await handleLoadingError(error, 'suppliers')
  }
})

// F-507: /:id/edit ведёт сюда с ?edit=:id — открываем модалку уже с записью
// (форма получает данные только через :initial, роутом рендерилась пустой — см. F-505).
useEditQuery(suppliersStore, openEdit)
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>