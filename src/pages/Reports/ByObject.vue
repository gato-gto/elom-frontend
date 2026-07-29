<template>
  <div class="list-container">
    <!-- Header -->
    <ListHeader
      title="Отчёт по объектам"
      subtitle="Анализ закупок по объектам и ответственным"
      icon="chart"
      :show-create="false"
      :show-stats="true"
      :total-count="rows.length"
      :filtered-count="rows.length"
    >
      <template #actions>
        <ExportButton 
          :data="rows"
          filename="objects_report"
          :loading="loading"
          @export="handleExport"
        />
      </template>
    </ListHeader>

    <!-- Filters -->
    <FilterPanel
      :columns="4"
      :loading="loading"
      @reset="resetFilters"
    >
      <FilterField
        v-model="filters.date_from"
        type="date"
        label="Дата с"
      />
      
      <FilterField
        v-model="filters.date_to"
        type="date"
        label="Дата по"
      />
      
      <FilterField
        v-model="filters.object"
        type="select"
        label="Объект"
        :options="objectOptions"
      />
      
      <FilterField
        v-model="filters.responsible"
        type="select"
        label="Ответственный"
        :options="employeeOptions"
      />
    </FilterPanel>

    <!-- Chart Section -->
    <div v-if="rows.length > 0" class="chart-section mb-6">
      <ChartContainer
        ref="chartContainer"
        title="Сравнение объектов по закупкам"
        subtitle="График показывает сумму закупок по каждому объекту"
        :loading="loading"
        :has-data="rows.length > 0"
        :chart-height="getChartHeight(rows.length)"
        :legend-items="chartLegendItems"
        :stats="chartStats"
        :last-updated="new Date().toISOString()"
        @download="handleChartDownload"
      />
    </div>

    <!-- Table -->
    <div class="list-content" :class="{ 'relative': loading }">
      <!-- Loading Overlay -->
      <LoadingSpinner 
        v-if="loading && rows.length === 0"
        size="lg"
        variant="primary"
        text="Загрузка отчета по объектам..."
        :overlay="false"
      />
      
      <!-- Loading Skeleton for existing data -->
      <div v-if="loading && rows.length > 0" class="loading-overlay">
        <LoadingSpinner 
          size="md"
          variant="primary"
          text="Обновление данных..."
          :overlay="true"
        />
      </div>

      <div class="overflow-x-auto"><table class="modern-table">
        <thead>
          <tr>
            <th @click="handleSort('object_name')" class="cursor-pointer hover:bg-base-200">
              Объект
              <span v-if="sortBy === 'object_name'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('purchases')" class="cursor-pointer hover:bg-base-200 text-right">
              Кол-во закупок
              <span v-if="sortBy === 'purchases'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('total_amount')" class="cursor-pointer hover:bg-base-200 text-right">
              Сумма
              <span v-if="sortBy === 'total_amount'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
          </tr>
        </thead>
        
        <!-- Skeleton Loading -->
        <TableSkeleton 
          v-if="loading && rows.length === 0"
          :rows="5"
          :columns="3"
        />
        
        <!-- Actual Data -->
        <tbody v-else>
          <tr v-for="r in rows" :key="r.object_id" >
            <td>{{ r.object_name ?? '—' }}</td>
            <td class="text-right">{{ r.purchases ?? '—' }}</td>
            <td class="text-right">{{ formatCurrency(r.total_amount) }}</td>
          </tr>
          <tr v-if="!loading && rows.length === 0">
            <td colspan="3" class="text-center text-muted py-8">
              <div class="flex flex-col items-center gap-2 empty-state">
                <svg class="w-12 h-12 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span class="text-sm">Нет данных по объектам</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table></div>
    </div>

    <!-- Pagination -->
    <ModernPagination
      v-if="rows.length > 0"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="totalItems"
      :page-size="pageSize"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch, nextTick} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {PageResponse, ReportByObjectQuery, SiteObject, Employee, Material, ObjectReportRow, ObjectReportResponse} from '@/api/types'
import {formatCurrency} from '@/utils/formatters'
import { debounce } from '@/utils/debounce'
import { ErrorHandlers } from '@/utils/errorHandler'
import { createBarChartConfig, getColor, getChartHeight, truncateLabel } from '@/utils/chartUtils'
import { exportToCSV, exportToExcel, exportToPDF } from '@/composables/useExport'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'
import ModernPagination from '@/components/ModernPagination.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'
import ChartContainer from '@/components/ChartContainer.vue'
import ExportButton from '@/components/ExportButton.vue'

const rows = ref<ObjectReportRow[]>([])
// F-721: агрегат по ВСЕМУ отфильтрованному отчёту (BE grand_total) — сводка не должна считаться reduce'ом по странице.
const grandTotal = ref<{ total_amount: number; purchases: number; rows_count: number; avg_amount: number } | null>(null)
const loading = ref(false)
const count = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)
const totalItems = ref(0)
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

const filters = ref<ReportByObjectQuery>({date_from: undefined, date_to: undefined, object: undefined, responsible: undefined})

// Sorting
const sortBy = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

const objects = ref<SiteObject[]>([])
const employees = ref<Employee[]>([])
const materials = ref<Material[]>([])

// Chart
const chartContainer = ref<InstanceType<typeof ChartContainer>>()

// Filter options
const objectOptions = computed(() => [
  { value: '', label: 'Все объекты' },
  ...objects.value.map((obj: SiteObject) => ({ value: obj.id, label: obj.name }))
])

const employeeOptions = computed(() => [
  { value: '', label: 'Все ответственные' },
  ...employees.value.map((emp: Employee) => ({ 
    value: emp.id, 
    label: `${emp.first_name || emp.username} ${emp.last_name || ''}`.trim()
  }))
])

async function loadRefs() {
  // F-886: сбой справочников НЕ должен ронять отчёт. Раньше reject в Promise.all прерывал onMounted
  // до fetchReport → отчёт показывал «Нет данных» БЕЗ ошибки (класс F-552, напр. 403 на /employees).
  // Тост + продолжаем; фильтры-выпадашки просто будут пустыми, а сам отчёт загрузится.
  try {
    const [{data: od}, {data: ed}, {data: md}] = await Promise.all([
      api.get<PageResponse<SiteObject>>(endpoints.objects.list + buildQuery({page_size: 1000, ordering: 'name'})),
      api.get<PageResponse<Employee>>(endpoints.employees.list + buildQuery({page_size: 1000, ordering: 'username'})),
      api.get<PageResponse<Material>>(endpoints.materials.list + buildQuery({page_size: 1000, ordering: 'name'})),
    ])
    objects.value = od.results
    employees.value = ed.results
    materials.value = md.results
  } catch (error) {
    ErrorHandlers.dataLoading(error)
  }
}

async function fetchReport() {
  loading.value = true
  try {
    // Создаем запрос только с заданными параметрами
    const query: ReportByObjectQuery = {}
    
    if (filters.value.date_from) { query.date_from = filters.value.date_from }
    if (filters.value.date_to) { query.date_to = filters.value.date_to }
    if (filters.value.object && String(filters.value.object) !== '') { query.object = [Number(filters.value.object)] }
    if (filters.value.responsible && String(filters.value.responsible) !== '') { query.responsible = Number(filters.value.responsible) }
    
    // Добавляем пагинацию
    query.page = currentPage.value
    query.page_size = pageSize.value
    
    // Добавляем сортировку если задана
    if (sortBy.value) {
      query.ordering = sortOrder.value === 'desc' ? `-${sortBy.value}` : sortBy.value
    }
    
    const q = buildQuery(query)
    const {data} = await api.get<ObjectReportResponse>(endpoints.reports.byObject + q)
    
    if (data && data.results) {
      rows.value = data.results
      totalItems.value = data.count
      grandTotal.value = data.grand_total || null  // F-721

      // F-570: график рисует единственный watch(rows) ниже; двойной вызов создавал
      // график дважды за тик (гонка уничтожения → ctx.save на null). См. ByPeriod.
    } else {
      rows.value = []
      totalItems.value = 0
      grandTotal.value = null
    }
  } catch (error) {
    ErrorHandlers.dataLoading(error)
    rows.value = []
    count.value = 0
  } finally {
    loading.value = false
  }
}

async function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    const data = rows.value
    const filename = `objects_report_${new Date().toISOString().split('T')[0]}`

    const headers = ['Объект', 'Кол-во закупок', 'Сумма']
    const formattedData = data.map(item => ({
      'Объект': item.object_name || '',
      'Кол-во закупок': item.purchases || 0,
      'Сумма': item.total_amount
    }))

    switch (format) {
      case 'csv':
        exportToCSV(formattedData, filename, { headers })
        break
      case 'excel':
        exportToExcel(formattedData, filename, { headers })
        break
      case 'pdf':
        exportToPDF(formattedData, filename, { headers })
        break
    }
  } catch (error) {
    ErrorHandlers.dataLoading(error)
  }
}

// Export functions removed - using centralized useExport composable

function resetFilters() {
  filters.value = { date_from: undefined, date_to: undefined, object: undefined, responsible: undefined }
  currentPage.value = 1
}

function handleSort(key: string) {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
  
  // Сортировка происходит на сервере
  fetchReport()
}

// Debounced функция для автоматического поиска
const debouncedFetch = debounce(() => {
  currentPage.value = 1
  fetchReport()
}, 500)

// Watcher для автоматического поиска при изменении фильтров
function handlePageChange(newPage: number) {
  currentPage.value = newPage
  fetchReport()
}

function handlePageSizeChange(newSize: number) {
  pageSize.value = newSize
  currentPage.value = 1
  fetchReport()
}

watch(
  () => filters.value,
  () => {
    debouncedFetch()
  },
  { deep: true }
)

// Watcher для обновления графика при изменении данных
watch(
  () => rows.value,
  () => {
    // F-570b: без guard'а равенства — canvas пере-монтируется при loading-тоггле, chartInstance
    // держит старый снятый canvas; пропуск перерисовки на идентичных данных оставил бы пустой
    // график. Один триггер на загрузку — двойного создания нет. (См. ByPeriod.)
    nextTick(() => {
      updateChart()
    })
  },
  { deep: true }
)

// Chart functions
function updateChart() {
  if (!chartContainer.value || rows.value.length === 0) {
    // Destroy chart if no data
    if (chartContainer.value) {
      chartContainer.value.destroyChart()
    }
    return
  }

  // Sort by total_amount descending for better visualization
  const sortedRows = [...rows.value].sort((a, b) => b.total_amount - a.total_amount)
  
  const labels = sortedRows.map(row => truncateLabel(row.object_name || 'Неизвестный объект', 15))
  const amounts = sortedRows.map(row => Number(row.total_amount) || 0)

  const config = createBarChartConfig({
    labels,
    datasets: [
      {
        label: 'Сумма закупок',
        data: amounts,
        backgroundColor: getColor(0) + '80',
        borderColor: getColor(0),
        borderWidth: 1
      }
    ],
    type: 'bar'
  }, {
    plugins: {
      tooltip: {
        callbacks: {
          afterLabel: (context: any) => {
            const index = context.dataIndex
            const row = sortedRows[index]
            return [
              `Закупок: ${row.purchases || 0}`,
              `Уникальных материалов: ${row.unique_materials || 0}`,
              `Ответственных: ${row.unique_responsibles || 0}`
            ]
          }
        }
      }
    }
  })

  try {
    chartContainer.value.createChart(config)
  } catch (error) {
    // eslint-disable-next-line no-console
    if (typeof console !== 'undefined' && console.error) { console.error('Error creating chart:', error) }
  }
}

const chartLegendItems = computed(() => [
  { label: 'Сумма закупок', color: getColor(0) }
])

const chartStats = computed(() => {
  if (rows.value.length === 0) {return undefined}
  
  // F-721: сводка по ВСЕМУ отфильтрованному отчёту из BE grand_total; reduce по странице — fallback.
  const gt = grandTotal.value
  const totalAmount = gt ? gt.total_amount : rows.value.reduce((sum, row) => sum + row.total_amount, 0)
  const totalPurchases = gt ? gt.purchases : rows.value.reduce((sum, row) => sum + (row.purchases || 0), 0)
  const uniqueCount = gt ? gt.rows_count : rows.value.length
  const avgAmount = uniqueCount ? totalAmount / uniqueCount : 0
  
  return {
    totalAmount: {
      label: 'Общая сумма',
      value: formatCurrency(totalAmount)
    },
    totalPurchases: {
      label: 'Всего закупок',
      value: totalPurchases.toString()
    },
    avgAmount: {
      label: 'Средняя сумма',
      value: formatCurrency(avgAmount)
    }
  }
})

function handleChartDownload() {
  console.log('Chart download requested')
}

onMounted(async () => {
  await loadRefs();
  await fetchReport()
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>

