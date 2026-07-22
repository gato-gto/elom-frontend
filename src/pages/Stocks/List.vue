<template>
  <div class="list-container">
    <!-- GenericList Component — /stocks is READ-ONLY (F-213): the snapshot ledger is derived,
         not hand-edited. Recording consumption lives on /writeoffs («Новое списание» / «По остатку»). -->
    <GenericList
      :store="stockSnapshotsStore"
      :config="listConfig"
      @export="handleExport"
    >
      <!-- Custom column for object name -->
      <template #column-object="{ item, value }">
        <span>{{ objectName(value) ?? value }}</span>
      </template>

      <!-- Custom column for material name -->
      <template #column-material="{ item, value }">
        <span>{{ materialName(value) ?? value }}</span>
      </template>

      <!-- Custom column for quantity with SmartUnitValue -->
      <template #column-quantity_signed="{ item, value }">
        <div class="text-right">
          <SmartUnitValue 
            v-if="item.smart_quantity" 
            :smart-quantity="item.smart_quantity" 
            :show-original="true"
            :class-name="parseFloat(value) >= 0 ? 'font-mono text-sm text-green-600' : 'font-mono text-sm text-red-600'"
          />
          <span 
            v-else
            :class="parseFloat(value) >= 0 ? 'font-mono text-sm text-green-600' : 'font-mono text-sm text-red-600'"
          >
            {{ parseFloat(value) >= 0 ? '+' : '' }}{{ formatNumberClean(value) }} {{ item.unit_code }}
          </span>
        </div>
      </template>

      <!-- Custom column for type (Приход/Расход) -->
      <template #column-type="{ item, value }">
        <span 
          :class="parseFloat(item.quantity_signed) >= 0 ? 'badge badge-success badge-xs' : 'badge badge-error badge-xs'"
        >
          {{ parseFloat(item.quantity_signed) >= 0 ? 'Приход' : 'Расход' }}
        </span>
      </template>

      <!-- Custom column for stage -->
      <template #column-stage="{ item, value }">
        <span class="badge badge-outline badge-xs">
          {{ getStageDisplayName(value) }}
        </span>
      </template>

      <!-- Custom column for source -->
      <template #column-source="{ item, value }">
        <span class="text-xs text-base-content/70">
          {{ item.source_description || `${getSourceTypeDisplayName(item.source_type)} #${item.source_id}` }}
        </span>
      </template>

      <!-- Custom column for responsible -->
      <template #column-responsible="{ item, value }">
        <span>{{ responsibleName(value) ?? '—' }}</span>
      </template>
    </GenericList>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { StockSnapshot, SiteObject, Material, Employee } from '@/api/types'
import type { GenericListConfig } from '@/types/generic'
import { formatDate, formatNumberClean } from '@/utils/formatters'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/export'
import { useStockSnapshotsStore } from '@/stores/stockSnapshots'
import { useObjectsStore } from '@/stores/objects'
import { useMaterialsStore } from '@/stores/materials'
import { useEmployeesStore } from '@/stores/employees'
import { usePermissions } from '@/composables/usePermissions'
import { useUiStore } from '@/stores/ui'
import GenericList from '@/components/GenericList.vue'
import SmartUnitValue from '@/components/SmartUnitValue.vue'
import StockCard from '@/components/cards/StockCard.vue'

// Stores
const stockSnapshotsStore = useStockSnapshotsStore()
const objectsStore = useObjectsStore()
const materialsStore = useMaterialsStore()
const employeesStore = useEmployeesStore()
const ui = useUiStore()

// Error handling
const { handleLoadingError } = useErrorHandler()

// ✅ RBAC: используем permissions (только экспорт — страница только для чтения)
const { canExportReports } = usePermissions()

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

const stageOptions = computed(() => [
  { value: '', label: 'Все этапы' },
  { value: 'acceptance', label: 'Приемка' },
  { value: 'request', label: 'Заявка' },
  { value: 'delivery_fixed', label: 'Доставка' },
  { value: 'post_rough', label: 'После черновых' },
  { value: 'handover', label: 'Сдача' }
])

const sourceTypeOptions = computed(() => [
  { value: '', label: 'Все источники' },
  { value: 'purchase_item', label: 'Закупка' },
  { value: 'writeoff', label: 'Списание' }
])

const responsibleOptions = computed(() => [
  { value: '', label: 'Все ответственные' },
  ...employees.value.map((e: Employee) => ({ 
    value: e.id, 
    label: `${e.first_name || e.username} ${e.last_name || ''}`.trim()
  }))
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

function getSourceTypeDisplayName(sourceType: string) {
  const sourceTypeNames: Record<string, string> = {
    'purchase_item': 'Закупка',
    'writeoff': 'Списание'
  }
  return sourceTypeNames[sourceType] || sourceType
}

// GenericList configuration
const listConfig = computed<GenericListConfig<StockSnapshot>>(() => ({
  title: 'Остатки',
  subtitle: 'Журнал движения остатков по объектам (только просмотр). Списания — на странице «Списания».',
  icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  showCreate: false,
  canCreate: false,
  showStats: true,
  exportable: canExportReports.value, // ✅ RBAC: контроль экспорта через permissions
  exportFilename: 'stocks',
  exportUrl: '/api/v1/stock/snapshots/',
  loadingText: 'Загрузка остатков...',
  emptyText: 'Нет внесений остатков',
  emptyTitle: 'Нет внесений остатков',
  emptySubtitle: 'Внесите первые остатки для начала работы',
  filterColumns: 4,
  columns: [
    { key: 'id', label: 'ID', sortable: false },
    { key: 'date', label: 'Дата', sortable: true, formatter: (value) => formatDate(value) },
    { key: 'object', label: 'Объект', sortable: false },
    { key: 'material', label: 'Материал', sortable: false },
    { key: 'quantity_signed', label: 'Количество', sortable: false },
    { key: 'type', label: 'Тип', sortable: false },
    { key: 'stage', label: 'Этап', sortable: false },
    { key: 'source', label: 'Источник', sortable: false },
    { key: 'responsible', label: 'Ответственный', sortable: false }
  ],
  filters: [
    {
      key: 'search',
      type: 'text',
      label: 'Поиск',
      placeholder: 'Поиск по материалам, объектам...'
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
      label: 'Этап работ',
      options: stageOptions.value
    },
    {
      key: 'source_type',
      type: 'select',
      label: 'Тип источника',
      options: sourceTypeOptions.value
    },
    {
      key: 'responsible',
      type: 'select',
      label: 'Ответственный',
      options: responsibleOptions.value
    },
    {
      key: 'date_from',
      type: 'date',
      label: 'Дата от'
    },
    {
      key: 'date_to',
      type: 'date',
      label: 'Дата до'
    },
    {
      key: 'is_archived',
      type: 'select',
      label: 'Архив',
      options: [
        { value: '', label: 'Все' },
        { value: 'false', label: 'Активные' },
        { value: 'true', label: 'Архивные' }
      ]
    }
  ],
  mobileCardComponent: StockCard,
  mobileCardProp: 'stock',
  defaultSort: 'date',
  defaultSortOrder: 'desc'
}))

// Methods
async function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    const data = stockSnapshotsStore.items
    const filename = `stocks_${new Date().toISOString().split('T')[0]}`

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

    ui.toast({ type: 'success', text: `Экспорт в ${format.toUpperCase()} выполнен` })
  } catch (error) {
    await handleLoadingError(error, 'stocks')
  }
}

// Функции экспорта удалены - используются импортированные из @/utils/export

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      objectsStore.fetchList({ page_size: 1000, ordering: 'name' } as any),
      materialsStore.fetchList({ page_size: 1000, ordering: 'name' } as any),
      employeesStore.fetchList({ page_size: 1000, ordering: 'username' } as any),
      stockSnapshotsStore.fetchList()
    ])
  } catch (error) {
    await handleLoadingError(error, 'stocks')
  }
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>

