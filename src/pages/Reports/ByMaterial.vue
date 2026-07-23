<template>
  <div class="list-container">
    <!-- Header -->
    <ListHeader
      title="Отчёт по материалам"
      subtitle="Анализ закупок по материалам и объектам"
      icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      :show-create="false"
      :show-stats="true"
      :total-count="rows.length"
      :filtered-count="rows.length"
    >
      <template #actions>
        <ExportButton 
          :data="rows"
          filename="materials_report"
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
        v-model="objectId"
        type="select"
        label="Объект"
        :options="objectOptions"
      />
    </FilterPanel>

    <!-- Chart Section -->
    <div v-if="rows.length > 0" class="chart-section mb-6">
      <ChartContainer
        ref="chartContainer"
        title="Доли материалов в закупках"
        subtitle="Круговая диаграмма показывает распределение сумм по материалам"
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
        text="Загрузка отчета по материалам..."
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
            <th @click="handleSort('material_name')" class="cursor-pointer hover:bg-base-200">
              Материал
              <span v-if="sortBy === 'material_name'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('unit')" class="cursor-pointer hover:bg-base-200">
              Ед.
              <span v-if="sortBy === 'unit'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('total_amount')" class="cursor-pointer hover:bg-base-200 text-right">
              Сумма
              <span v-if="sortBy === 'total_amount'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('rows')" class="cursor-pointer hover:bg-base-200 text-right">
              Позиций
              <span v-if="sortBy === 'rows'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
          </tr>
        </thead>
        
        <!-- Skeleton Loading -->
        <TableSkeleton 
          v-if="loading && rows.length === 0"
          :rows="5"
          :columns="4"
        />
        
        <!-- Actual Data -->
        <tbody v-else>
        <tr v-for="r in rows" :key="r.material_id">
          <td>{{ r.material_name ?? '—' }}</td>
          <td>{{ r.unit ?? '—' }}</td>
          <td class="text-right">{{ formatCurrency(r.amount_total) }}</td>
          <td class="text-right">{{ r.rows ?? '—' }}</td>
        </tr>
        <tr v-if="!loading && rows.length === 0">
          <td colspan="4" class="text-center text-muted py-8">
            <div class="flex flex-col items-center gap-2 empty-state">
              <svg class="w-12 h-12 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span class="text-sm">Нет данных по материалам</span>
            </div>
          </td>
        </tr>
        </tbody>
        <tfoot v-if="total">
        <tr>
          <th>Итого (стр.)</th>
          <th/>
          <th class="text-right">{{ formatCurrency(total) }}</th>
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
import {ref, computed, onMounted, watch, nextTick} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {SiteObject, PageResponse, MaterialReportRow, MaterialReportResponse, ReportByMaterialQuery} from '@/api/types'
import {formatCurrency} from '@/utils/formatters'
import { debounce } from '@/utils/debounce'
import { ErrorHandlers } from '@/utils/errorHandler'
import { createDoughnutChartConfig, getColors, getChartHeight, formatCurrencyTooltip, truncateLabel } from '@/utils/chartUtils'
import { exportToCSV, exportToExcel, exportToPDF, downloadFile } from '@/utils/export'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'
import ModernPagination from '@/components/ModernPagination.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'
import ExportButton from '@/components/ExportButton.vue'
import ChartContainer from '@/components/ChartContainer.vue'



type ReportResponse = { 
  rows: MaterialReportRow[]
  total_amount?: number 
}

const dateFrom = ref<string | undefined>()
const dateTo = ref<string | undefined>()
const objectId = ref<number | undefined>()
const rows = ref<MaterialReportRow[]>([])
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

const objects = ref<SiteObject[]>([])

// Chart
const chartContainer = ref<InstanceType<typeof ChartContainer>>()

async function loadObjects() {
  const {data} = await api.get<PageResponse<SiteObject>>(endpoints.objects.list + buildQuery({page_size: 1000}))
  objects.value = data.results
}

async function load() {
  loading.value = true
  try {
    // Создаем запрос только с заданными параметрами
    const query: ReportByMaterialQuery = {}
    
    if (dateFrom.value) { query.date_from = dateFrom.value }
    if (dateTo.value) { query.date_to = dateTo.value }
    if (objectId.value && String(objectId.value) !== '') { query.object = [Number(objectId.value)] }
    
    // Добавляем пагинацию
    query.page = currentPage.value
    query.page_size = pageSize.value
    
    // Добавляем сортировку если задана
    if (sortBy.value) {
      query.ordering = sortOrder.value === 'desc' ? `-${sortBy.value}` : sortBy.value
    }
    
    const q = buildQuery(query)
    const {data} = await api.get<MaterialReportResponse>(endpoints.reports.byMaterial + q)
    
    if (data && data.results) {
      // Обрабатываем данные и заменяем null значения
      rows.value = data.results.map((r: MaterialReportRow) => ({
        ...r,
        material_name: r.material_name || 'Неизвестный материал',
        unit: r.unit || '—',
        amount_total: r.amount_total || 0,
        rows: r.rows || 0
      }))
      total.value = rows.value.reduce((sum: number, r: MaterialReportRow) => sum + r.amount_total, 0)
      
      // Update chart after data is loaded
      nextTick(() => {
        updateChart()
      })
    } else {
      rows.value = []
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
    const filename = `materials_report_${new Date().toISOString().split('T')[0]}`

    const headers = ['Материал', 'Единица', 'Сумма', 'Кол-во закупок']
    const formattedData = data.map(item => ({
      'Материал': item.material_name || '',
      'Единица': item.unit || '',
      'Сумма': item.amount_total,
      'Кол-во закупок': item.rows || 0
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

    // ui.toast({ type: 'success', text: `Экспорт в ${format.toUpperCase()} выполнен` })
  } catch (error) {
    ErrorHandlers.dataLoading(error)
  }
}

// Функции экспорта уже импортированы из utils/export

const objectOptions = computed(() => [
  { value: '', label: 'Все объекты' },
  ...objects.value.map((obj: SiteObject) => ({ value: obj.id, label: obj.name }))
])

function resetFilters() {
  dateFrom.value = undefined
  dateTo.value = undefined
  objectId.value = undefined
  currentPage.value = 1  // F-073
}

function handleSort(key: string) {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
  
  currentPage.value = 1  // F-073
  // Сортировка происходит на сервере
  load()
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

// Debounced функция для автоматического поиска
const debouncedLoad = debounce(() => {
  load()
}, 500)

// Watcher для автоматического поиска при изменении фильтров
watch([dateFrom, dateTo, objectId], () => {
  currentPage.value = 1  // F-073
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

  // Sort by amount_total descending and take top 10 for better visualization
  const sortedRows = [...rows.value]
    .sort((a, b) => b.amount_total - a.amount_total)
    .slice(0, 10)
  
  const labels = sortedRows.map(row => truncateLabel(row.material_name || 'Неизвестный материал', 20))
  const amounts = sortedRows.map(row => Number(row.amount_total) || 0)
  
  const isDark = document.documentElement.classList.contains('dark')
  const colors = getColors(isDark)

  const config = createDoughnutChartConfig({
    labels,
    datasets: [
      {
        label: 'Сумма закупок',
        data: amounts,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ],
    type: 'doughnut'
  }, {
    plugins: {
      tooltip: {
        callbacks: {
          afterLabel: (context: any) => {
            const index = context.dataIndex
            const row = sortedRows[index]
            return [
              `Закупок: ${row.rows || 0}`,
              `Средняя цена: ${formatCurrency(row.avg_price || 0)}`,
              `Мин. цена: ${formatCurrency(row.min_price || 0)}`,
              `Макс. цена: ${formatCurrency(row.max_price || 0)}`
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

const chartLegendItems = computed(() => {
  if (rows.value.length === 0) {return []}
  
  const sortedRows = [...rows.value]
    .sort((a, b) => b.amount_total - a.amount_total)
    .slice(0, 10)
  
  const isDark = document.documentElement.classList.contains('dark')
  const colors = getColors(isDark)
  
  return sortedRows.map((row, index) => ({
    label: truncateLabel(row.material_name || 'Неизвестный материал', 20),
    color: colors[index % colors.length]
  }))
})

const chartStats = computed(() => {
  if (rows.value.length === 0) {return undefined}
  
  const totalAmount = rows.value.reduce((sum, row) => sum + row.amount_total, 0)
  const totalPurchases = rows.value.reduce((sum, row) => sum + (row.rows || 0), 0)
  const uniqueMaterials = rows.value.length
  
  return {
    totalAmount: {
      label: 'Общая сумма',
      value: formatCurrency(totalAmount)
    },
    totalPurchases: {
      label: 'Всего закупок',
      value: totalPurchases.toString()
    },
    uniqueMaterials: {
      label: 'Уникальных материалов',
      value: uniqueMaterials.toString()
    }
  }
})

function handleChartDownload() {
  console.log('Chart download requested')
}

onMounted(async () => {
  await loadObjects()
  await load()
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>

