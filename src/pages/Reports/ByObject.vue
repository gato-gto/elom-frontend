<template>
  <div class="list-container">
    <!-- Header -->
    <ListHeader
      title="Отчёт по объектам"
      subtitle="Анализ закупок по объектам и ответственным"
      icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
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

      <table class="modern-table">
        <thead>
          <tr>
            <th @click="handleSort('object_name')" class="cursor-pointer hover:bg-gray-50">
              Объект
              <span v-if="sortBy === 'object_name'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('purchases')" class="cursor-pointer hover:bg-gray-50 text-right">
              Кол-во закупок
              <span v-if="sortBy === 'purchases'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('total_amount')" class="cursor-pointer hover:bg-gray-50 text-right">
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
          <tr v-for="r in rows" :key="r.object_id" class="table-row">
            <td>{{ r.object_name ?? '—' }}</td>
            <td class="text-right">{{ r.purchases ?? '—' }}</td>
            <td class="text-right">{{ formatCurrency(r.total_amount) }}</td>
          </tr>
          <tr v-if="!loading && rows.length === 0">
            <td colspan="3" class="text-center text-gray-500 py-8">
              <div class="flex flex-col items-center gap-2 empty-state">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span class="text-sm">Нет данных по объектам</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
import {formatDate, formatCurrency, formatNumber} from '@/utils/formatters'
import { debounce } from '@/utils/debounce'
import { ErrorHandlers } from '@/utils/errorHandler'
import { createBarChartConfig, getColor, getChartHeight, formatCurrencyTooltip, truncateLabel } from '@/utils/chartUtils'
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

const objMap = computed(() => new Map(objects.value.map((o: SiteObject) => [o.id, o.name])))
const matMap = computed(() => new Map(materials.value.map(m => [m.id, m.name])))

function objectName(id?: number) {
  return id ? objMap.value.get(id) : undefined
}

function materialName(id?: number) {
  return id ? matMap.value.get(id) : undefined
}

const isPaginated = computed(() => count.value > rows.value.length)

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
  const [{data: od}, {data: ed}, {data: md}] = await Promise.all([
    api.get<PageResponse<SiteObject>>(endpoints.objects.list + buildQuery({page_size: 1000, ordering: 'name'})),
    api.get<PageResponse<Employee>>(endpoints.employees.list + buildQuery({page_size: 1000, ordering: 'username'})),
    api.get<PageResponse<Material>>(endpoints.materials.list + buildQuery({page_size: 1000, ordering: 'name'})),
  ])
  objects.value = od.results
  employees.value = ed.results
  materials.value = md.results
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
      
      // Update chart after data is loaded
      nextTick(() => {
        updateChart()
      })
    } else {
      rows.value = []
      totalItems.value = 0
    }
  } catch (error) {
    ErrorHandlers.dataLoading(error)
    rows.value = []
    count.value = 0
  } finally {
    loading.value = false
  }
}

function reload(p = currentPage.value) {
  currentPage.value = p;
  fetchReport()
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

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

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
  (newRows, oldRows) => {
    // Обновляем график только если данные действительно изменились
    if (newRows.length !== oldRows?.length || JSON.stringify(newRows) !== JSON.stringify(oldRows)) {
      nextTick(() => {
        updateChart()
      })
    }
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
  const purchases = sortedRows.map(row => Number(row.purchases) || 0)

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
  if (rows.value.length === 0) return undefined
  
  const totalAmount = rows.value.reduce((sum, row) => sum + row.total_amount, 0)
  const totalPurchases = rows.value.reduce((sum, row) => sum + (row.purchases || 0), 0)
  const avgAmount = totalAmount / rows.value.length
  
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

