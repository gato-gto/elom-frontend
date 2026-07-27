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
          <!-- F-271/D-019: завершена, но фото-отчёт не приложен -->
          <span
            v-if="item.status === 'completed' && item.has_report_photos === false"
            class="badge badge-warning badge-xs"
            title="Закупка завершена без фото-отчёта"
          >нет фото</span>
          <!-- F-621/D-012: «новая» закупка датой в закрытом периоде — одобрить (завершить) нельзя -->
          <span
            v-if="item.status === 'new' && item.is_period_closed"
            class="badge badge-error badge-xs"
            title="Период закрыт — нельзя одобрить закупку задним числом"
          >период закрыт</span>
        </div>
      </template>

      <!-- Custom column for responsible with name lookup -->
      <template #column-responsible="{ item }">
        <span>{{ item.responsible_name || responsibleName(item.responsible) || '—' }}</span>
      </template>

      <!-- F-316: автор записи. Пусто = автор неизвестен (историческая запись/импорт),
           показываем это честно, а не подставляем ответственного. -->
      <template #column-created_by__username="{ item }">
        <span v-if="item.created_by_name">{{ item.created_by_name }}</span>
        <span v-else class="text-xs opacity-60" title="не задано">НЗ</span>
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

    <!-- F-616: одобрение с опциональным фото-отчётом -->
    <Modal
      v-model="approveModalOpen"
      title="Одобрить закупку"
      size="lg"
      :closable="!approveSubmitting"
      @close="closeApproveModal"
    >
      <div class="space-y-4">
        <p class="text-sm">
          Одобрение переведёт закупку
          <span class="font-medium">{{ approvingPurchase?.purchase_no || ('#' + approvingPurchase?.id) }}</span>
          в статус «Выполнено». При желании приложите фото-отчёт (доказательство закупки) — это необязательно.
        </p>

        <div>
          <label class="block text-sm font-medium mb-1">Фото-отчёт (необязательно)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            class="file-input file-input-bordered file-input-sm w-full"
            :disabled="approveSubmitting"
            @change="onApproveFilesChange"
          />
        </div>

        <div v-if="approveItems.length" class="grid grid-cols-3 sm:grid-cols-4 gap-3">
          <div v-for="(item, index) in approveItems" :key="index" class="relative">
            <img :src="item.url" :alt="`Фото-отчёт ${index + 1}`" class="w-full h-20 object-cover rounded-lg border" />
            <button
              type="button"
              class="absolute top-1 right-1 btn btn-error btn-xs btn-circle"
              :disabled="approveSubmitting"
              aria-label="Убрать фото"
              @click="removeApproveItem(index)"
            >✕</button>
          </div>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn btn-ghost btn-sm" :disabled="approveSubmitting" @click="closeApproveModal">
          Отмена
        </button>
        <button type="button" class="btn btn-success btn-sm" :disabled="approveSubmitting" @click="confirmApprove">
          <span v-if="approveSubmitting" class="loading loading-spinner loading-xs"></span>
          {{ approveItems.length ? 'Одобрить с фото' : 'Одобрить' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useEditQuery } from '@/composables/useEditQuery'
import type { Purchase, Employee } from '@/api/types'
import { formatDate } from '@/utils/formatters'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/export'
import Modal from '@/components/Modal.vue'
import PurchaseForm from './PurchaseForm.vue'
import PurchaseInfo from './PurchaseInfo.vue'
import GenericList from '@/components/GenericList.vue'
import PurchaseCard from '@/components/cards/PurchaseCard.vue'
import { usePurchasesStore, approvePurchaseWithReport, rejectPurchase } from '@/stores/purchases'
import { useObjectsStore } from '@/stores/objects'
import { useEmployeesStore } from '@/stores/employees'
import { useAuthStore } from '@/stores/auth'
import { useNotifications } from '@/composables/useNotifications'
import { usePermissions } from '@/composables/usePermissions'

// Stores
const purchasesStore = usePurchasesStore()
const objectsStore = useObjectsStore()
const employeesStore = useEmployeesStore()
const authStore = useAuthStore()
const { showSuccess, showError } = useNotifications()

// ✅ RBAC: проверяем разрешения вместо ролей
const { canCreateRequests, canApprovePurchases, canExportReports } = usePermissions()

// isRequester = может создавать заявки, но не одобрять
const isRequester = computed(() => canCreateRequests.value)
// canApprove = может одобрять закупки
const canApprove = computed(() => canApprovePurchases.value)

// Error handling
const { handleLoadingError, handleDeleteError } = useErrorHandler()

// Modal state
const modalOpen = ref(false)
const editingPurchase = ref<Purchase | null>(null)
const viewModalOpen = ref(false)
const viewingPurchase = ref<Purchase | null>(null)

// F-616: диалог «Одобрить» с опциональным фото-отчётом. approveItems держит File + его
// object-URL для превью (URL освобождаем при удалении/закрытии, чтобы не течь памятью).
const approveModalOpen = ref(false)
const approvingPurchase = ref<Purchase | null>(null)
const approveItems = ref<{ file: File; url: string }[]>([])
const approveSubmitting = ref(false)

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
  canCreate: canCreateRequests.value || canApprovePurchases.value, // может создавать заявки или закупки
  // F-517: кнопка создания видна при ЛЮБОМ из прав — иначе GenericList проверял только
  // purchases.create (ресурсный дефолт) и прятал кнопку у заявителя с purchases.create_request.
  // Бэкенд POST принимает оба (PurchasesPermission). purchases.create покрывает менеджеров/
  // одобряющих (у них есть create), create_request — заявителя.
  createPermissionAny: ['purchases.create', 'purchases.create_request'],
  showStats: true,
  exportable: canExportReports.value, // ✅ RBAC: контроль экспорта через permissions
  exportFilename: 'purchases',
  exportUrl: '/api/v1/purchases/',
  loadingText: 'Загрузка закупок...',
  emptyText: 'Нет закупок',
  emptyTitle: 'Нет закупок',
  emptySubtitle: 'Создайте первую закупку для начала работы',
  filterColumns: 4,
  columns: [
    { key: 'date', label: 'Дата', sortable: true, formatter: (value: any) => formatDate(value) },
    { key: 'purchase_no', label: '№ закупки', sortable: true },
    { key: 'object__name', label: 'Объект', sortable: true, displayKey: 'object_name' }, // Используем object__name для сортировки, но отображаем object_name
    { key: 'supplier__name', label: 'Поставщик', sortable: true, displayKey: 'supplier_name' }, // Используем supplier__name для сортировки, но отображаем supplier_name
    { key: 'responsible__id', label: 'Ответственный', sortable: true, displayKey: 'responsible_name' }, // Используем responsible__id для сортировки, но отображаем responsible_name
    // F-316: кто ВНЁС запись — это не «Ответственный». Сортировка реальная:
    // created_by__username добавлен в ordering_fields на бэке (иначе была бы мёртвая сортировка).
    { key: 'created_by__username', label: 'Внёс', sortable: true, displayKey: 'created_by_name' },
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
  // ✅ RBAC: Указываем ресурс для автоматического определения permissions
  resource: 'purchases',
  actions: [
    {
      key: 'view',
      label: 'Просмотр',
      class: 'btn-outline btn-sm',
      // ✅ RBAC: Permission определяется автоматически как 'purchases.view'
    },
    {
      key: 'edit',
      label: isRequester.value ? 'Редактировать заявку' : 'Редактировать',
      class: 'btn-primary btn-sm',
      // ✅ RBAC: Permission определяется автоматически как 'purchases.edit'
      // Проверка scope-based (purchases.edit_own) выполняется автоматически
      visible: (item: Purchase) => {
        // Requester может редактировать только свои заявки со статусом 'new'
        if (isRequester.value) {
          return item.status === 'new' && item.responsible === authStore.me?.id
        }
        // Для остальных: проверка прав выполняется автоматически через permissions
        // (purchases.edit или purchases.edit_own + принадлежность объекта)
        return true
      }
    },
    ...(canApprove.value ? [
      {
        key: 'approve',
        label: 'Одобрить',
        class: 'btn-success btn-sm',
        permission: 'purchases.approve', // ✅ RBAC: Явное указание permission
        visible: (item: Purchase) => item.status === 'new',
        // F-621/D-012: одобрение завершает закупку → запись в журнал. В закрытый период это
        // запрещено бэком (F-619, 400). Гасим кнопку заранее — рядом бейдж «период закрыт».
        disabled: (item: Purchase) => item.is_period_closed === true
      },
      {
        key: 'reject',
        label: 'Отклонить',
        class: 'btn-error btn-sm',
        permission: 'purchases.reject', // ✅ RBAC: Явное указание permission
        visible: (item: Purchase) => item.status === 'new'
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
      openApproveModal(item)
      break
    case 'reject':
      await handleReject(item)
      break
  }
}

// F-616: одобрение через диалог с опциональным фото-отчётом. Открытие — только подготовка
// состояния; сама загрузка+одобрение в confirmApprove.
function openApproveModal(purchase: Purchase) {
  approvingPurchase.value = purchase
  resetApproveFiles()
  approveModalOpen.value = true
}

function onApproveFilesChange(e: Event) {
  const input = e.target as HTMLInputElement
  for (const file of Array.from(input.files || [])) {
    approveItems.value.push({ file, url: URL.createObjectURL(file) })
  }
  input.value = '' // позволяем выбрать тот же файл повторно после удаления
}

function removeApproveItem(index: number) {
  const [removed] = approveItems.value.splice(index, 1)
  if (removed) { URL.revokeObjectURL(removed.url) }
}

function resetApproveFiles() {
  approveItems.value.forEach(i => URL.revokeObjectURL(i.url))
  approveItems.value = []
}

function closeApproveModal() {
  approveModalOpen.value = false
  approvingPurchase.value = null
  resetApproveFiles()
}

async function confirmApprove() {
  const purchase = approvingPurchase.value
  if (!purchase || approveSubmitting.value) { return }
  approveSubmitting.value = true
  const hadPhotos = approveItems.value.length > 0
  try {
    // Фото-отчёт (опционально) грузится ДО одобрения; при сбое загрузки одобрение не произойдёт.
    // M3 (FE-hunt): каждый успешно загруженный файл убираем из списка — ретрай после сбоя не
    // зальёт уже сохранённые повторно (иначе дубли PurchasePhoto без серверного unique).
    await approvePurchaseWithReport(purchase.id, approveItems.value.map(i => i.file), (file) => {
      const idx = approveItems.value.findIndex(i => i.file === file)
      if (idx >= 0) { removeApproveItem(idx) }
    })
  } catch (error: any) {
    const { parseApiError } = await import('@/utils/errorHandler')
    showError(parseApiError(error).detail)
    return
  } finally {
    approveSubmitting.value = false
  }
  // L3 (FE-hunt): approve уже прошёл (200) — сбой рефреша списка НЕ должен выдаваться за сбой
  // одобрения (иначе тост «Ошибка» ПОСЛЕ «Заявка одобрена»). Рефреш вынесен за approve-try.
  showSuccess(hadPhotos ? 'Заявка одобрена, фото-отчёт приложен' : 'Заявка успешно одобрена')
  closeApproveModal()
  await purchasesStore.fetchList().catch(() => {})
}

async function handleReject(purchase: Purchase) {
  const reason = prompt('Причина отклонения (необязательно):')
  try {
    await rejectPurchase(purchase.id, reason || undefined)
  } catch (error: any) {
    const { parseApiError } = await import('@/utils/errorHandler')
    showError(parseApiError(error).detail)
    return
  }
  // L3 (FE-hunt): отклонение прошло — сбой рефреша не выдаём за сбой отклонения.
  showSuccess('Заявка успешно отклонена')
  await purchasesStore.fetchList().catch(() => {})
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

// F-507: единый механизм открытия модалки по ?edit=:id (см. F-505)
useEditQuery(purchasesStore, openEditModal)
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>

