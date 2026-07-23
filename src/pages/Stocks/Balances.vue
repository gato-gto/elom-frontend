<template>
  <div class="list-container">
    <!-- GenericList Component -->
    <GenericList
      :store="balancesStore"
      :config="listConfig"
      @export="handleExport"
    >
      <template #header-actions>
        <ExportButton 
          :data="balancesStore.items"
          filename="balances"
          :loading="balancesStore.loading"
          @export="handleExport"
        />
      </template>
      <!-- Custom column for object name with expand button -->
      <template #column-object_name="{ item, value }">
        <div class="flex items-center gap-2">
          <button 
            @click="toggleExpanded(item.object_id)"
            class="btn btn-ghost btn-xs p-1"
            :class="{ 'rotate-90': expandedRows.has(item.object_id) }"
          >
            <svg class="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div class="flex flex-col">
            <span class="font-medium text-base-content">{{ value }}</span>
            <span class="text-sm text-muted">{{ item.object_address }}</span>
          </div>
        </div>
      </template>

      <!-- Custom column for total materials -->
      <template #column-total_materials="{ item, value }">
        <div class="text-center">
          <span class="font-semibold text-info font-mono">
            {{ value }}
          </span>
        </div>
      </template>

      <!-- Custom column for total balance -->
      <template #column-total_balance="{ item }">
        <div class="text-right">
          <span class="font-semibold text-success font-mono">
            {{ formatQuantity(calculateTotalBalance(item.materials)) }}
          </span>
        </div>
      </template>

      <!-- Expanded materials rows -->
      <template #row-expanded="{ item }">
        <tr v-if="expandedRows.has(item.object_id)" class="bg-base-200">
          <td colspan="3" class="p-0">
            <div class="p-4">
              <h4 class="font-medium text-base-content mb-3">Материалы объекта</h4>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-base-300">
                      <th 
                        class="text-left py-2 px-3 font-medium text-muted cursor-pointer hover:bg-base-200"
                        @click="handleMaterialsSort('material_name')"
                      >
                        Материал
                        <span v-if="materialsSortBy === 'material_name'" class="ml-1">
                          {{ materialsSortOrder === 'asc' ? '↑' : '↓' }}
                        </span>
                      </th>
                      <th 
                        class="text-right py-2 px-3 font-medium text-muted cursor-pointer hover:bg-base-200"
                        @click="handleMaterialsSort('current_balance')"
                      >
                        Остаток
                        <span v-if="materialsSortBy === 'current_balance'" class="ml-1">
                          {{ materialsSortOrder === 'asc' ? '↑' : '↓' }}
                        </span>
                      </th>
                      <th 
                        class="text-right py-2 px-3 font-medium text-muted cursor-pointer hover:bg-base-200"
                        @click="handleMaterialsSort('total_purchased')"
                      >
                        Приход
                        <span v-if="materialsSortBy === 'total_purchased'" class="ml-1">
                          {{ materialsSortOrder === 'asc' ? '↑' : '↓' }}
                        </span>
                      </th>
                      <th 
                        class="text-right py-2 px-3 font-medium text-muted cursor-pointer hover:bg-base-200"
                        @click="handleMaterialsSort('total_written_off')"
                      >
                        Расход
                        <span v-if="materialsSortBy === 'total_written_off'" class="ml-1">
                          {{ materialsSortOrder === 'asc' ? '↑' : '↓' }}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="material in sortMaterials(item.materials)" :key="material.material_id" class="border-b border-base-300">
                      <td class="py-2 px-3">
                        <div class="flex flex-col">
                          <span class="font-medium text-base-content">{{ material.material_name }}</span>
                          <span class="text-xs text-muted">{{ material.unit_code }}</span>
                        </div>
                      </td>
                      <td class="py-2 px-3 text-right">
                        <span class="font-semibold text-success font-mono">
                          {{ formatQuantity(material.current_balance) }} {{ material.unit_code }}
                        </span>
                      </td>
                      <td class="py-2 px-3 text-right">
                        <span class="font-semibold text-info font-mono">
                          {{ formatQuantity(material.total_purchased) }} {{ material.unit_code }}
                        </span>
                      </td>
                      <td class="py-2 px-3 text-right">
                        <span class="font-semibold text-error font-mono">
                          {{ formatQuantity(material.total_written_off) }} {{ material.unit_code }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      </template>
    </GenericList>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { formatNumberClean } from '@/utils/formatters'
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/export'
import { useUiStore } from '@/stores/ui'
import { useObjectsStore } from '@/stores/objects'
import { useBalancesStore, fetchBalancesList, setBalancesFilters, resetBalancesFilters, getBalancesFilters } from '@/stores/balances'
import type { GenericListConfig } from '@/types/generic'
import type { MaterialBalance, ObjectBalance } from '@/api/types/stocks'
import GenericList from '@/components/GenericList.vue'
import ExportButton from '@/components/ExportButton.vue'
import BalanceCard from '@/components/cards/BalanceCard.vue'

// Router
const route = useRoute()

// Stores
const ui = useUiStore()
const objectsStore = useObjectsStore()
const balancesStore = useBalancesStore()
// Error handling
const { handleLoadingError } = useErrorHandler()

// Инициализируем filters из extendedFilters
const extendedFilters = getBalancesFilters()
balancesStore.filters = {
  ...extendedFilters.value,
  ordering: 'object_name'
}

// F-068: GenericList дёргает store.setFilters/setPage/setPageSize/fetchList, а их
// базовые версии бьют в агрегатный /stock/snapshots/by-objects/ (возвращает
// {objects:[]}, а не {results,count}) → таблица ОЧИЩАЛАСЬ при любом фильтре/
// сортировке/пагинации. Перенаправляем эти методы в кастомный агрегатный
// загрузчик (эндпоинт не пагинируется — отдаёт все объекты сразу).
balancesStore.fetchList = (async (params?: Record<string, unknown>) => {
  await fetchBalancesList(params as never)
  return balancesStore.items
}) as typeof balancesStore.fetchList
balancesStore.setFilters = (async (f: Record<string, unknown>) => {
  await setBalancesFilters(f)
}) as typeof balancesStore.setFilters
balancesStore.resetFilters = (async () => {
  await resetBalancesFilters()
}) as typeof balancesStore.resetFilters
balancesStore.setPage = (async () => { /* агрегат отдаёт всё сразу */ }) as typeof balancesStore.setPage
balancesStore.setPageSize = (async () => {}) as typeof balancesStore.setPageSize

// State for expanded rows
const expandedRows = ref<Set<number>>(new Set())

// State for materials sorting
const materialsSortBy = ref<string>('material_name')
const materialsSortOrder = ref<'asc' | 'desc'>('asc')

// GenericList configuration
const listConfig = computed<GenericListConfig<ObjectBalance>>(() => ({
  title: 'Остатки по объектам',
  subtitle: 'Текущие остатки материалов по объектам',
  icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  showCreate: false,
  showStats: true,
  exportable: false,
  loadingText: 'Загрузка остатков...',
  emptyText: 'Нет остатков',
  emptyTitle: 'Нет остатков',
  emptySubtitle: 'На выбранную дату остатков не найдено',
  filterColumns: 3,
  columns: [
    { key: 'object_name', label: 'Объект', sortable: true },
    { key: 'total_materials', label: 'Материалов', sortable: true },
    { key: 'total_balance', label: 'Общий остаток', sortable: false }
  ],
  filters: [
    // F-220: removed the dead 'search' text filter — the by-objects aggregate endpoint only accepts
    // object_id + date, so search was never sent and typing did nothing.
    {
      key: 'object',
      type: 'select',
      label: 'Объект',
      options: [
        { value: '', label: 'Все объекты' },
        ...objectsStore.items.map((obj: any) => ({ value: obj.id, label: obj.name }))
      ]
    },
    {
      key: 'date',
      type: 'date',
      label: 'Дата'
    }
  ],
  mobileCardComponent: BalanceCard,
  mobileCardProp: 'balance',
  defaultSort: 'object_name',
  defaultSortOrder: 'asc'
}))

// Methods
function formatQuantity(quantity: string): string {
  return formatNumberClean(quantity)
}

function toggleExpanded(objectId: number) {
  if (expandedRows.value.has(objectId)) {
    expandedRows.value.delete(objectId)
  } else {
    expandedRows.value.add(objectId)
  }
}

function calculateTotalBalance(materials: MaterialBalance[]): string {
  const total = materials.reduce((sum, material) => {
    return sum + parseFloat(material.current_balance || '0')
  }, 0)
  return total.toString()
}

// Sort materials function
function sortMaterials(materials: MaterialBalance[]): MaterialBalance[] {
  return [...materials].sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (materialsSortBy.value) {
      case 'material_name':
        aValue = a.material_name.toLowerCase()
        bValue = b.material_name.toLowerCase()
        break
      case 'current_balance':
        aValue = parseFloat(a.current_balance || '0')
        bValue = parseFloat(b.current_balance || '0')
        break
      case 'total_purchased':
        aValue = parseFloat(a.total_purchased || '0')
        bValue = parseFloat(b.total_purchased || '0')
        break
      case 'total_written_off':
        aValue = parseFloat(a.total_written_off || '0')
        bValue = parseFloat(b.total_written_off || '0')
        break
      default:
        return 0
    }
    
    if (aValue < bValue) {return materialsSortOrder.value === 'asc' ? -1 : 1}
    if (aValue > bValue) {return materialsSortOrder.value === 'asc' ? 1 : -1}
    return 0
  })
}

// Handle materials sorting
function handleMaterialsSort(key: string) {
  if (materialsSortBy.value === key) {
    materialsSortOrder.value = materialsSortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    materialsSortBy.value = key
    materialsSortOrder.value = 'asc'
  }
}

async function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    const data = balancesStore.items

    const filename = `balances_${new Date().toISOString().split('T')[0]}`

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
    await handleLoadingError(error, 'balances')
  }
}

// Lifecycle
onMounted(async () => {
  try {
    // Load objects for filter options
    await objectsStore.fetchList({ page_size: 1000, ordering: 'name' } as any)
    
    // Apply query parameters from URL if present
    const queryObject = route.query.object
    if (queryObject) {
      // setBalancesFilters already calls fetchBalancesList, so we don't need to call it again
      await setBalancesFilters({ object: String(queryObject) })
    } else {
      // Load balances without filter
      await fetchBalancesList()
    }
    
  } catch (error) {
    await handleLoadingError(error, 'balances')
  }
})
</script>

<style scoped>
.rotate-90 {
  transform: rotate(90deg);
}

/* Стили для сортировки материалов */
th.cursor-pointer {
  transition: background-color 0.2s ease;
}

th.cursor-pointer:hover {
  background-color: hsl(var(--bc) / 0.05);
}

/* Индикаторы сортировки */
th span {
  font-size: 0.875rem;
  color: hsl(var(--tx-3));
}
</style>