<template>
  <div class="list-container">
    <!-- GenericList Component -->
    <GenericList
      :store="purchasesStore"
      :config="listConfig"
      @create="openCreateModal"
      @action="handleAction"
      @export="handleExport"
    >
      <!-- Custom column for purchase number with status -->
      <template #column-purchase_no="{ item, value }">
        <div class="flex items-center gap-2">
          <span class="font-medium">{{ value || '#' + item.id }}</span>
          <span v-if="item.is_archived" class="badge badge-warning badge-xs">Архив</span>
        </div>
      </template>

      <!-- Custom column for responsible with name lookup -->
      <template #column-responsible="{ item, value }">
        <span>{{ item.responsible_name || responsibleName(item.responsible) || '—' }}</span>
      </template>
    </GenericList>

    <!-- Modal for creating/editing purchase -->
    <Modal v-model="modalOpen" :title="modalTitle" size="6xl" :closable="true">
      <PurchaseForm 
        :initial="editingPurchase" 
        @saved="onPurchaseSaved" 
        @cancel="modalOpen = false" 
      />
    </Modal>

    <!-- Modal for viewing purchase -->
    <Modal v-model="viewModalOpen" title="Просмотр закупки" size="6xl" :closable="true">
      <PurchaseInfo 
        :purchase="viewingPurchase" 
        @close="viewModalOpen = false" 
      />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Purchase, SiteObject, Employee } from '@/api/types'
import type { GenericListConfig } from '@/types/generic'
import { formatDate } from '@/utils/formatters'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/export'
import Modal from '@/components/Modal.vue'
import PurchaseForm from './PurchaseForm.vue'
import PurchaseInfo from './PurchaseInfo.vue'
import GenericList from '@/components/GenericList.vue'
import PurchaseCard from '@/components/cards/PurchaseCard.vue'
import { usePurchasesStore, approvePurchase, rejectPurchase } from '@/stores/purchases'
import { useObjectsStore } from '@/stores/objects'
import { useEmployeesStore } from '@/stores/employees'
import { useAuthStore } from '@/stores/auth'
import { useNotifications } from '@/composables/useNotifications'

// Stores
const purchasesStore = usePurchasesStore()
const objectsStore = useObjectsStore()
const employeesStore = useEmployeesStore()
const authStore = useAuthStore()
const { showSuccess, showError } = useNotifications()

// Check if requester
const isRequester = computed(() => authStore.me?.role === 'requester')
const canApprove = computed(() => {
  const role = authStore.me?.role
  return role === 'admin' || role === 'manager' || role === 'warehouse'
})

// Error handling
const { handleLoadingError, handleDeleteError } = useErrorHandler()

// Modal state
const modalOpen = ref(false)
const editingPurchase = ref<Purchase | null>(null)
const viewModalOpen = ref(false)
const viewingPurchase = ref<Purchase | null>(null)

// Computed properties
const modalTitle = computed(() => {
  if (isRequester.value) {
    return editingPurchase.value ? 'Редактировать заявку' : 'Новая заявка'
  }
  return editingPurchase.value ? 'Редактировать закупку' : 'Новая закупка'
})

// Filter options
const objectOptions = computed(() => [
  { value: '', label: 'Все объекты' },
  ...objectsStore.selectOptions
])

const employeeOptions = computed(() => [
  { value: '', label: 'Все ответственные' },
  ...employeesStore.selectOptions
])

const statusOptions = computed(() => [
  { value: '', label: 'Все статусы' },
  { value: 'false', label: 'Активные' },
  { value: 'true', label: 'Архивные' }
])

// GenericList configuration
const listConfig = computed(() => ({
  title: isRequester.value ? 'Мои заявки' : 'Закупки',
  subtitle: isRequester.value 
    ? 'Создание и управление заявками на материалы'
    : 'Управление закупками материалов и поставщиками',
  icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  showCreate: true,
  createText: isRequester.value ? 'Новая заявка' : 'Новая закупка',
  canCreate: true,
  showStats: true,
  exportable: true,
  exportFilename: 'purchases',
  exportUrl: '/api/v1/purchases/',
  loadingText: 'Загрузка закупок...',
  emptyText: 'Нет закупок',
  emptyTitle: 'Нет закупок',
  emptySubtitle: 'Создайте первую закупку для начала работы',
  filterColumns: 4,
  columns: [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'date', label: 'Дата', sortable: true, formatter: (value: any) => formatDate(value) },
    { key: 'purchase_no', label: '№ закупки', sortable: true },
    { key: 'object__name', label: 'Объект', sortable: true, displayKey: 'object_name' }, // Используем object__name для сортировки, но отображаем object_name
    { key: 'supplier__name', label: 'Поставщик', sortable: true, displayKey: 'supplier_name' }, // Используем supplier__name для сортировки, но отображаем supplier_name
    { key: 'responsible__id', label: 'Ответственный', sortable: true, displayKey: 'responsible_name' }, // Используем responsible__id для сортировки, но отображаем responsible_name
    { key: 'items', label: 'Позиций', sortable: false, formatter: (value: any) => value?.length ?? 0 }
  ],
  filters: [
    {
      key: 'date_after',
      type: 'date' as const,
      label: 'Дата с'
    },
    {
      key: 'date_before',
      type: 'date' as const,
      label: 'Дата по'
    },
    {
      key: 'object',
      type: 'select' as const,
      label: 'Объект',
      options: objectOptions.value
    },
    ...(isRequester.value ? [] : [
      {
        key: 'responsible',
        type: 'select' as const,
        label: 'Ответственный',
        options: employeeOptions.value
      },
      {
        key: 'is_archived',
        type: 'select' as const,
        label: 'Статус',
        options: statusOptions.value
      }
    ]),
    ...(isRequester.value ? [] : [
      {
        key: 'status',
        type: 'select' as const,
        label: 'Статус закупки',
        options: [
          { value: '', label: 'Все статусы' },
          { value: 'new', label: 'Новая (заявка)' },
          { value: 'completed', label: 'Выполнено' },
          { value: 'cancelled', label: 'Отменена' }
        ]
      }
    ])
  ] as any,
  defaultFilters: isRequester.value ? { status: 'new' } : {},
  actions: [
    {
      key: 'view',
      label: 'Просмотр',
      class: 'btn-outline btn-sm',
      shortLabel: '👁️'
    },
    {
      key: 'edit',
      label: isRequester.value ? 'Редактировать заявку' : 'Редактировать',
      class: 'btn-primary btn-sm',
      shortLabel: '✏️',
      show: (item: Purchase) => {
        // Requester может редактировать только свои заявки со статусом 'new'
        if (isRequester.value) {
          return item.status === 'new' && item.responsible === authStore.me?.id
        }
        return true
      }
    },
    ...(canApprove.value ? [
      {
        key: 'approve',
        label: 'Одобрить',
        class: 'btn-success btn-sm',
        shortLabel: '✅',
        show: (item: Purchase) => item.status === 'new',
        requireConfirm: true,
        confirmMessage: 'Вы уверены, что хотите одобрить эту заявку?'
      },
      {
        key: 'reject',
        label: 'Отклонить',
        class: 'btn-error btn-sm',
        shortLabel: '❌',
        show: (item: Purchase) => item.status === 'new',
        requireConfirm: true,
        confirmMessage: 'Вы уверены, что хотите отклонить эту заявку?'
      }
    ] : [])
  ],
  mobileCardComponent: PurchaseCard,
  mobileCardProp: 'purchase',
  defaultSort: 'date',
  defaultSortOrder: 'desc' as const
}))

// Methods
function openCreateModal() {
  editingPurchase.value = null
  modalOpen.value = true
}

function openEditModal(purchase: Purchase) {
  editingPurchase.value = purchase
  modalOpen.value = true
}

function openViewModal(purchase: Purchase) {
  viewingPurchase.value = purchase
  viewModalOpen.value = true
}

function onPurchaseSaved() {
  modalOpen.value = false
  editingPurchase.value = null
  purchasesStore.fetchList()
}

function responsibleName(id: number): string {
  const employee = employeesStore.items.find((e: Employee) => e.id === id)
  return employee ? `${employee.first_name || employee.username} ${employee.last_name || ''}`.trim() : '—'
}

async function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    const data = purchasesStore.items
    const filename = `purchases_${new Date().toISOString().split('T')[0]}`

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
    await handleLoadingError(error, 'purchases')
  }
}

async function handleAction(action: string, item: Purchase) {
  switch (action) {
    case 'view':
      openViewModal(item)
      break
    case 'edit':
      openEditModal(item)
      break
    case 'delete':
      await handleDelete(item)
      break
    case 'approve':
      await handleApprove(item)
      break
    case 'reject':
      await handleReject(item)
      break
  }
}

async function handleApprove(purchase: Purchase) {
  try {
    await approvePurchase(purchase.id)
    showSuccess('Заявка успешно одобрена')
    await purchasesStore.fetchList()
  } catch (error: any) {
    showError(error?.response?.data?.detail || 'Ошибка одобрения заявки')
  }
}

async function handleReject(purchase: Purchase) {
  const reason = prompt('Причина отклонения (необязательно):')
  try {
    await rejectPurchase(purchase.id, reason || undefined)
    showSuccess('Заявка успешно отклонена')
    await purchasesStore.fetchList()
  } catch (error: any) {
    showError(error?.response?.data?.detail || 'Ошибка отклонения заявки')
  }
}

async function handleDelete(purchase: Purchase) {
  if (!confirm(`Удалить закупку "${purchase.purchase_no || '#' + purchase.id}"?`)) {return}
  
  try {
    await purchasesStore.remove(purchase.id)
  } catch (error) {
    await handleDeleteError(error, 'purchase', purchase.id)
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      purchasesStore.fetchList(),
      objectsStore.fetchList(),
      employeesStore.fetchList()
    ])
  } catch (error) {
    await handleLoadingError(error, 'purchases')
  }
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>

