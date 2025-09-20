<template>
  <div class="list-container">
    <!-- Header -->
    <ListHeader
      title="Отчёт по периодам"
      subtitle="Анализ закупок по временным периодам"
      icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      :show-create="false"
      :show-stats="true"
      :total-count="rows.length"
      :filtered-count="rows.length"
    >
      <template #actions>
        <ExportButton 
          :data="rows"
          filename="periods_report"
          :loading="loading"
          @export="handleExport"
        />
      </template>
    </ListHeader>

    <!-- Filters -->
    <FilterPanel
      :columns="3"
      :loading="loading"
      @reset="resetFilters"
    >
      <FilterField
        v-model="dateFrom"
        type="date"
        label="Дата с"
      />
      
      <FilterField
        v-model="dateTo"
        type="date"
        label="Дата по"
      />
      
      <FilterField
        v-model="period"
        type="select"
        label="Период"
        :options="[
          { value: 'month', label: 'По месяцам' },
          { value: 'day', label: 'По дням' }
        ]"
      />
    </FilterPanel>

    <!-- Chart Section -->
    <div v-if="rows.length > 0" class="chart-section mb-6">
      <ChartContainer
        ref="chartContainer"
        title="Динамика закупок по периодам"
        subtitle="График показывает изменение суммы закупок во времени"
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
        text="Загрузка отчета по периодам..."
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
            <th @click="handleSort('period')" class="cursor-pointer hover:bg-gray-50">
              Месяц
              <span v-if="sortBy === 'period'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('total_amount')" class="cursor-pointer hover:bg-gray-50 text-right">
              Сумма
              <span v-if="sortBy === 'total_amount'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('purchases')" class="cursor-pointer hover:bg-gray-50 text-right">
              Кол-во закупок
              <span v-if="sortBy === 'purchases'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('avg_amount')" class="cursor-pointer hover:bg-gray-50 text-right">
              Средняя сумма
              <span v-if="sortBy === 'avg_amount'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('unique_objects')" class="cursor-pointer hover:bg-gray-50 text-right">
              Объектов
              <span v-if="sortBy === 'unique_objects'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
          </tr>
        </thead>
        
        <!-- Skeleton Loading -->
        <TableSkeleton 
          v-if="loading && rows.length === 0"
          :rows="5"
          :columns="5"
        />
        
        <!-- Actual Data -->
        <tbody v-else>
          <tr v-for="r in rows" :key="r.period" class="table-row">
            <td>{{ formatDate(r.period) }}</td>
            <td class="text-right">{{ formatCurrency(r.total_amount) }}</td>
            <td class="text-right">{{ r.purchases ?? '—' }}</td>
            <td class="text-right">{{ r.avg_amount ? formatCurrency(r.avg_amount) : '—' }}</td>
            <td class="text-right">{{ r.unique_objects ?? '—' }}</td>
          </tr>
          <tr v-if="!loading && rows.length === 0">
            <td colspan="5" class="text-center text-gray-500 py-8">
              <div class="flex flex-col items-center gap-2 empty-state">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="text-sm">Нет данных по периодам</span>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot v-if="total">
          <tr>
            <th>Итого</th>
            <th class="text-right">{{ formatCurrency(total) }}</th>
            <th/>
            <th/>
            <th/>
          </tr>
        </tfoot>
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import api from '@/api/client'
import endpoints, { buildQuery } from '@/api/endpoints'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { debounce } from '@/utils/debounce'
import { ErrorHandlers } from '@/utils/errorHandler'
import { createLineChartConfig, getColor, getChartHeight, formatCurrencyTooltip } from '@/utils/chartUtils'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'
import ModernPagination from '@/components/ModernPagination.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'
import ChartContainer from '@/components/ChartContainer.vue'
import ExportButton from '@/components/ExportButton.vue'
import type { PeriodReportRow, PeriodReportResponse, ReportByPeriodQuery } from '@/api/types'

const dateFrom = ref<string | undefined>()
const dateTo = ref<string | undefined>()
const period = ref<'day' | 'month'>('month')
const rows = ref<PeriodReportRow[]>([])
const total = ref<number | null>(null)

// Pagination
const currentPage = ref(1)
const pageSize = ref(20)
const totalItems = ref(0)
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

// Sorting
const sortBy = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')
const loading = ref(false)

// Chart
const chartContainer = ref<InstanceType<typeof ChartContainer>>()

async function load() {
  loading.value = true
  try {
    // Создаем запрос только с заданными параметрами
    const query: ReportByPeriodQuery = {}
    
    if (dateFrom.value) { query.date_from = dateFrom.value }
    if (dateTo.value) { query.date_to = dateTo.value }
    if (period.value) { query.period = period.value }
    
    // Добавляем пагинацию
    query.page = currentPage.value
    query.page_size = pageSize.value
    
    // Добавляем сортировку если задана
    if (sortBy.value) {
      query.ordering = sortOrder.value === 'desc' ? `-${sortBy.value}` : sortBy.value
    }
    
    const q = buildQuery(query)
    const { data } = await api.get<PeriodReportResponse>(endpoints.reports.byPeriod + q)
    
    if (data && data.results) {
      // Обрабатываем данные и проверяем корректность сумм
      rows.value = data.results.map((row: PeriodReportRow) => ({
        ...row,
        total_amount: row.total_amount || 0,
        purchases: row.purchases || 0,
        unique_objects: row.unique_objects || 0,
        unique_materials: row.unique_materials || 0,
        unique_responsibles: row.unique_responsibles || 0,
        avg_amount: row.avg_amount || 0
      }))
      totalItems.value = data.count
      // Вычисляем общую сумму
      total.value = rows.value.reduce((sum: number, row: PeriodReportRow) => sum + row.total_amount, 0)
      
      // Update chart after data is loaded
      nextTick(() => {
        updateChart()
      })
    } else {
      rows.value = []
      totalItems.value = 0
      total.value = null
    }
  } catch (error) {
    ErrorHandlers.dataLoading(error)
    rows.value = []
    total.value = null
  } finally {
    loading.value = false
  }
}

async function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    const data = rows.value
    const filename = `periods_report_${new Date().toISOString().split('T')[0]}`

    const headers = ['Месяц', 'Сумма', 'Кол-во закупок', 'Средняя сумма', 'Объектов']
    const formattedData = data.map(item => ({
      'Месяц': formatDate(item.period),
      'Сумма': item.total_amount,
      'Кол-во закупок': item.purchases || 0,
      'Средняя сумма': item.avg_amount || 0,
      'Объектов': item.unique_objects || 0
    }))

    switch (format) {
      case 'csv':
        exportToCSV(formattedData, filename, headers)
        break
      case 'excel':
        exportToExcel(formattedData, filename, headers)
        break
      case 'pdf':
        exportToPDF(formattedData, filename, headers)
        break
    }
  } catch (error) {
    ErrorHandlers.dataLoading(error)
  }
}

function exportToCSV(data: any[], filename: string, headers: string[]) {
  const rows = data.map(item => headers.map(header => item[header] || ''))
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')

  downloadFile(csvContent, `${filename}.csv`, 'text/csv')
}

function exportToExcel(data: any[], filename: string, headers: string[]) {
  // For now, export as CSV with .xlsx extension
  exportToCSV(data, filename.replace('.xlsx', ''), headers)
}

function exportToPDF(data: any[], filename: string, headers: string[]) {
  // For now, show info message
  console.log('PDF export not implemented yet')
}

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
  dateFrom.value = undefined
  dateTo.value = undefined
  period.value = 'month'
}

function handlePageChange(newPage: number) {
  currentPage.value = newPage
  load()
}

function handlePageSizeChange(newSize: number) {
  pageSize.value = newSize
  currentPage.value = 1
  load()
}

function handleSort(key: string) {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
  
  // Сортировка происходит на сервере
  load()
}

// Debounced функция для автоматического поиска
const debouncedLoad = debounce(() => {
  load()
}, 500)

// Watcher для автоматического поиска при изменении фильтров
watch([dateFrom, dateTo, period], () => {
  debouncedLoad()
})

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

  // Validate data
  if (!Array.isArray(rows.value) || rows.value.length === 0) {
    console.warn('No data available for chart')
    return
  }

  const labels = rows.value.map(row => {
    const date = new Date(row.period)
    return period.value === 'month' 
      ? date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })
      : date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  })

  const amounts = rows.value.map(row => Number(row.total_amount) || 0)
  const purchases = rows.value.map(row => Number(row.purchases) || 0)

  // Validate that we have valid data
  if (amounts.every(amount => amount === 0) && purchases.every(purchase => purchase === 0)) {
    console.warn('All chart data is zero')
    return
  }

  const config = createLineChartConfig({
    labels,
    datasets: [
      {
        label: 'Сумма закупок',
        data: amounts,
        borderColor: getColor(0),
        backgroundColor: getColor(0) + '20',
        fill: true,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Количество закупок',
        data: purchases,
        borderColor: getColor(1),
        backgroundColor: getColor(1) + '20',
        fill: false,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ],
    type: 'line'
  }, {
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: {
          callback: (value: any) => formatCurrencyTooltip(Number(value))
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: (value: any) => new Intl.NumberFormat('ru-RU').format(Number(value))
        }
      }
    }
  })

  try {
    chartContainer.value.createChart(config)
  } catch (error) {
    console.error('Error creating chart:', error)
  }
}

const chartLegendItems = computed(() => [
  { label: 'Сумма закупок', color: getColor(0) },
  { label: 'Количество закупок', color: getColor(1) }
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

onMounted(load)
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>

