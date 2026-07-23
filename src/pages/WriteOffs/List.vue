<template>
  <div class="list-container">
    <!-- GenericList Component -->
    <GenericList
      :store="writeOffsStore"
      :config="listConfig"
      @create="openCreate"
      @action="handleAction"
      @export="handleExport"
    >
      <!-- Inventory-count entry point (F-213): enter the actual remaining balance,
           backend computes расход = книжный остаток − факт and records the write-off. -->
      <template #header-actions>
        <button
          v-if="canCreate"
          @click="byBalanceOpen = true"
          class="btn btn-sm btn-outline"
          title="Инвентаризация: введите фактический остаток на объекте — система вычислит расход (книжный − факт) и оформит списание на разницу"
        >
          По остатку
        </button>
      </template>

      <!-- Custom column for object name -->
      <template #column-object="{ item, value }">
        <span>{{ objectName(value) ?? value }}</span>
      </template>

      <!-- Custom column for material name -->
      <template #column-material="{ item, value }">
        <span>{{ materialName(value) ?? value }}</span>
      </template>

      <!-- Custom column for quantity with SmartUnitValue -->
      <template #column-quantity="{ item, value }">
        <div class="text-right">
          <SmartUnitValue 
            v-if="item.smart_quantity" 
            :smart-quantity="item.smart_quantity" 
            :show-original="true"
            class-name="font-mono text-sm text-red-600"
          />
          <span v-else class="font-mono text-sm text-red-600">
            {{ formatNumberClean(value) }} {{ item.unit_code }}
          </span>
        </div>
      </template>

      <!-- Custom column for current balance -->
      <template #column-current_balance="{ item, value }">
        <div class="text-right">
          <span class="font-mono text-sm text-muted">
            {{ formatNumberClean(value) }} {{ item.unit_code }}
          </span>
        </div>
      </template>

      <!-- Custom column for responsible -->
      <template #column-responsible="{ item, value }">
        <span>{{ responsibleName(value) ?? '—' }}</span>
      </template>

    </GenericList>

    <!-- WriteOffForm Modal -->
    <WriteOffForm
      :is-open="modalOpen"
      :initial="editingWriteOff"
      @close="modalOpen = false"
      @success="onWriteOffSaved"
    />

    <!-- Inventory-count modal (F-213 / D-015): «Внести остатки» → from-balance write-off -->
    <WriteOffByBalanceForm
      :is-open="byBalanceOpen"
      @close="byBalanceOpen = false"
      @success="onByBalanceSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { WriteOff, SiteObject, Material, Employee } from '@/api/types'
import type { GenericListConfig } from '@/types/generic'
import { formatDate, formatNumberClean } from '@/utils/formatters'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/export'
import { useWriteOffsStore } from '@/stores/writeOffs'
import { useObjectsStore } from '@/stores/objects'
import { useMaterialsStore } from '@/stores/materials'
import { useEmployeesStore } from '@/stores/employees'
import WriteOffForm from './WriteOffForm.vue'
import WriteOffByBalanceForm from './WriteOffByBalanceForm.vue'
import GenericList from '@/components/GenericList.vue'
import SmartUnitValue from '@/components/SmartUnitValue.vue'
import WriteOffCard from '@/components/cards/WriteOffCard.vue'
import { usePermissions } from '@/composables/usePermissions'

// ✅ RBAC: проверка через permissions
const { can, canExportReports } = usePermissions()
const canCreate = computed(() => can('writeoffs', 'create'))

// Stores
const writeOffsStore = useWriteOffsStore()
const objectsStore = useObjectsStore()
const materialsStore = useMaterialsStore()
const employeesStore = useEmployeesStore()

// Error handling
const { handleLoadingError } = useErrorHandler()

// Modal state
const modalOpen = ref(false)
const editingWriteOff = ref<WriteOff | null>(null)
// Inventory-count ("По остатку") modal — F-213
const byBalanceOpen = ref(false)

// Computed properties
const modalTitle = computed(() => {
  return editingWriteOff.value ? 'Редактировать списание' : 'Новое списание'
})

// Computed для справочников
const objects = computed(() => objectsStore.items)
const materials = computed(() => materialsStore.items)
const employees = computed(() => employeesStore.items)

// Filter options
const objectOptions = computed(() => [
  { value: '', label: 'Все объекты' },
  ...objects.value.map((o: SiteObject) => ({ value: o.id, label: o.name }))
])

const materialOptions = computed(() => [
  { value: '', label: 'Все материалы' },
  ...materials.value.map((m: Material) => ({ value: m.id, label: m.name }))
])

const employeeOptions = computed(() => [
  { value: '', label: 'Все ответственные' },
  ...employees.value.map((e: Employee) => ({ 
    value: e.id, 
    label: `${e.first_name || e.username} ${e.last_name || ''}`.trim()
  }))
])

const stageOptions = computed(() => [
  { value: '', label: 'Все этапы' },
  { value: 'acceptance', label: 'Приемка' },
  { value: 'request', label: 'Заявка' },
  { value: 'delivery_fixed', label: 'Доставка' },
  { value: 'post_rough', label: 'После черновых' },
  { value: 'handover', label: 'Сдача' }
])

// Maps for name lookups
const oMap = computed(() => new Map(objects.value.map((o: SiteObject) => [o.id, o.name])))
const mMap = computed(() => new Map(materials.value.map((m: Material) => [m.id, m.name])))
const eMap = computed(() => new Map(employees.value.map((e: Employee) => [e.id, `${e.first_name || e.username}${e.last_name ? ' ' + e.last_name : ''}`])))

// Helper functions
function objectName(id?: number) {
  return id ? oMap.value.get(id) : undefined
}

function materialName(id?: number) {
  return id ? mMap.value.get(id) : undefined
}

function responsibleName(id: number | null | undefined) {
  return id ? eMap.value.get(id) : undefined
}

function getStageDisplayName(stage: string) {
  const stageNames: Record<string, string> = {
    'acceptance': 'Приемка',
    'request': 'Заявка',
    'delivery_fixed': 'Доставка',
    'post_rough': 'После черновых',
    'handover': 'Сдача'
  }
  return stageNames[stage] || stage
}

// GenericList configuration
const listConfig = computed<GenericListConfig<WriteOff>>(() => ({
  title: 'Списания',
  subtitle: 'Управление списаниями материалов',
  icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  showCreate: true,
  createText: 'Новое списание',
  canCreate: canCreate.value,
  showStats: true,
  exportable: canExportReports.value, // ✅ RBAC: контроль экспорта через permissions
  exportFilename: 'writeoffs',
  exportUrl: '/api/v1/stock/writeoffs/',
  loadingText: 'Загрузка списаний...',
  emptyText: 'Нет списаний',
  emptyTitle: 'Нет списаний',
  emptySubtitle: 'Создайте первое списание для начала работы',
  filterColumns: 4,
  columns: [
    { key: 'id', label: 'ID', sortable: false },
    { key: 'date', label: 'Дата', sortable: true, formatter: (value) => formatDate(value) },
    { key: 'object', label: 'Объект', sortable: false },
    { key: 'material', label: 'Материал', sortable: false },
    { key: 'quantity', label: 'Количество', sortable: false },
    { key: 'current_balance', label: 'Остаток', sortable: false },
    { key: 'responsible', label: 'Ответственный', sortable: false },
  ],
  filters: [
    {
      key: 'date_from',
      type: 'date',
      label: 'Дата с'
    },
    {
      key: 'date_to',
      type: 'date',
      label: 'Дата по'
    },
    {
      key: 'object',
      type: 'select',
      label: 'Объект',
      options: objectOptions.value
    },
    {
      key: 'material',
      type: 'select',
      label: 'Материал',
      options: materialOptions.value
    },
    {
      key: 'stage',
      type: 'select',
      label: 'Этап',
      options: stageOptions.value
    },
    {
      key: 'responsible',
      type: 'select',
      label: 'Ответственный',
      options: employeeOptions.value
    }
  ],
  actions: [
    {
      key: 'edit',
      label: 'Редактировать',
      class: 'btn-outline'
    }
  ],
  mobileCardComponent: WriteOffCard,
  mobileCardProp: 'writeOff',
  defaultSort: 'date',
  defaultSortOrder: 'desc'
}))

// Methods
function openCreate() {
  editingWriteOff.value = null
  modalOpen.value = true
}

function openEdit(writeOff: WriteOff) {
  editingWriteOff.value = writeOff
  modalOpen.value = true
}

function onWriteOffSaved() {
  modalOpen.value = false
  editingWriteOff.value = null
  writeOffsStore.fetchList()
}

// Inventory count recorded (from-balance) → close and refresh the ledger view
function onByBalanceSaved() {
  byBalanceOpen.value = false
  writeOffsStore.fetchList()
}

async function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    const data = writeOffsStore.items
    const filename = `writeoffs_${new Date().toISOString().split('T')[0]}`

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
    await handleLoadingError(error, 'writeoffs')
  }
}

async function handleAction(action: string, item: WriteOff) {
  switch (action) {
    case 'edit':
      openEdit(item)
      break
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      writeOffsStore.fetchList(),
      objectsStore.fetchList({ page_size: 1000, ordering: 'name' , is_active: true} as any),
      materialsStore.fetchList({ page_size: 1000, ordering: 'name' } as any),
      employeesStore.fetchList({ page_size: 1000, ordering: 'username' } as any)
    ])
  } catch (error) {
    await handleLoadingError(error, 'writeoffs')
  }
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>
