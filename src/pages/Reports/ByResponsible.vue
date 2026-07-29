<template>
  <div class="list-container">
    <!-- Header -->
    <ListHeader
      title="Отчёт по ответственным"
      subtitle="Анализ закупок по ответственным лицам"
      icon="chart"
      :show-create="false"
      :show-stats="true"
      :total-count="rows.length"
      :filtered-count="rows.length"
    >
      <template #actions>
        <ExportButton 
          :data="rows"
          filename="responsible_report"
          :loading="loading"
          @export="handleExport"
        />
      </template>
    </ListHeader>

    <!-- Filters -->
    <FilterPanel
      :columns="2"
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
    </FilterPanel>

    <!-- Chart Section -->
    <div v-if="rows.length > 0" class="chart-section mb-6">
      <ChartContainer
        ref="chartContainer"
        title="Рейтинг ответственных по закупкам"
        subtitle="Горизонтальная диаграмма показывает сумму закупок по каждому ответственному"
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
        text="Загрузка отчета по ответственным..."
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
            <th @click="handleSort('responsible_name')" class="cursor-pointer hover:bg-base-200">
              Ответственный
              <span v-if="sortBy === 'responsible_name'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('total_amount')" class="cursor-pointer hover:bg-base-200 text-right">
              Сумма
              <span v-if="sortBy === 'total_amount'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('purchases')" class="cursor-pointer hover:bg-base-200 text-right">
              Кол-во закупок
              <span v-if="sortBy === 'purchases'" class="ml-1">
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
        <tr v-for="r in rows" :key="r.responsible_id" >
          <td>{{ r.responsible_name }}</td>
          <td class="text-right">{{ formatCurrency(r.total_amount) }}</td>
          <td class="text-right">{{ r.purchases ?? '—' }}</td>
        </tr>
        <tr v-if="!loading && rows.length === 0">
          <td colspan="3" class="text-center text-muted py-8">
            <div class="flex flex-col items-center gap-2 empty-state">
              <svg class="w-12 h-12 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="text-sm">Нет данных по ответственным</span>
            </div>
          </td>
        </tr>
        </tbody>
        <tfoot v-if="total">
        <tr>
          <th>Итого (стр.)</th>
          <th class="text-right">{{ formatCurrency(total) }}</th>
          <th/>
        </tr>
        </tfoot>
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
import {ref, computed, onMounted, watch, nextTick} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import {formatCurrency} from '@/utils/formatters'
import { debounce } from '@/utils/debounce'
import { ErrorHandlers } from '@/utils/errorHandler'
import { createHorizontalBarChartConfig, getColor, getChartHeight, truncateLabel } from '@/utils/chartUtils'
import { exportToCSV, exportToExcel, exportToPDF } from '@/composables/useExport'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'
import ModernPagination from '@/components/ModernPagination.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'
import ExportButton from '@/components/ExportButton.vue'
import ChartContainer from '@/components/ChartContainer.vue'
import type { ResponsibleReportRow, ResponsibleReportResponse, ReportByResponsibleQuery } from '@/api/types'

const dateFrom = ref<string | undefined>()
const dateTo = ref<string | undefined>()
const rows = ref<ResponsibleReportRow[]>([])
const total = ref<number | null>(null)
// F-721: агрегат по ВСЕМУ отфильтрованному отчёту (BE grand_total) — итог/сводка не считаются reduce'ом по странице.
const grandTotal = ref<{ total_amount: number; purchases: number; rows_count: number; avg_amount: number } | null>(null)

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
    const query: ReportByResponsibleQuery = {}
    
    if (dateFrom.value) { query.date_from = dateFrom.value }
    if (dateTo.value) { query.date_to = dateTo.value }
    
    // Добавляем пагинацию
    query.page = currentPage.value
    query.page_size = pageSize.value
    
    // Добавляем сортировку если задана
    if (sortBy.value) {
      query.ordering = sortOrder.value === 'desc' ? `-${sortBy.value}` : sortBy.value
    }
    
    const q = buildQuery(query)
    const {data} = await api.get<ResponsibleReportResponse>(endpoints.reports.byResponsible + q)
    
    if (data && data.results) {
      rows.value = data.results
      // F-721: grand_total (по ВСЕМУ отчёту) — для сводки-карточек (chartStats). tfoot «Итого (стр.)» —
      // подытог ТЕКУЩЕЙ страницы, поэтому total оставляем reduce'ом по странице (метка честна).
      grandTotal.value = data.grand_total || null
      total.value = data.results.reduce((sum: number, r: ResponsibleReportRow) => sum + r.total_amount, 0)

      // F-570: график рисует единственный watch(rows) ниже; двойной вызов создавал
      // график дважды за тик (гонка уничтожения → ctx.save на null). См. ByPeriod.
    } else {
      rows.value = []
      total.value = null
      grandTotal.value = null
    }
  } catch (error) {
    ErrorHandlers.dataLoading(error)
    rows.value = []
    total.value = null
    grandTotal.value = null
  } finally {
    loading.value = false
  }
}

async function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    // F-902 + F-908: экспорт ВСЕГО отфильтрованного отчёта (page_size=1000 — потолок BE) + РУССКИЕ
    // колонки. Раньше exportToCSV(rows.value) без маппинга → сырые объекты (первая колонка — голый id,
    // англ. заголовки) И только текущая страница.
    const eq: ReportByResponsibleQuery = {}
    if (dateFrom.value) { eq.date_from = dateFrom.value }
    if (dateTo.value) { eq.date_to = dateTo.value }
    ;(eq as any).page_size = 1000
    const { data: full } = await api.get<ResponsibleReportResponse>(endpoints.reports.byResponsible + buildQuery(eq))
    const rowsAll = full.results || []
    const filename = `responsible_report_${new Date().toISOString().split('T')[0]}`

    const headers = ['Ответственный', 'Сумма', 'Кол-во закупок']
    const formattedData = rowsAll.map(item => ({
      'Ответственный': item.responsible_name || '',
      'Сумма': item.total_amount,
      'Кол-во закупок': item.purchases || 0
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

    // ui.toast({ type: 'success', text: `Экспорт в ${format.toUpperCase()} выполнен` })
  } catch (error) {
    ErrorHandlers.dataLoading(error)
  }
}

// Export functions removed - using centralized useExport composable

function resetFilters() {
  dateFrom.value = undefined
  dateTo.value = undefined
  currentPage.value = 1  // F-073
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
  
  currentPage.value = 1  // F-073
  // Сортировка происходит на сервере
  load()
}

// Debounced функция для автоматического поиска
const debouncedLoad = debounce(() => {
  load()
}, 500)

// Watcher для автоматического поиска при изменении фильтров
watch([dateFrom, dateTo], () => {
  currentPage.value = 1  // F-073
  debouncedLoad()
})

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
  
  const labels = sortedRows.map(row => truncateLabel(row.responsible_name || 'Неизвестный ответственный', 25))
  const amounts = sortedRows.map(row => Number(row.total_amount) || 0)

  const config = createHorizontalBarChartConfig({
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
    type: 'horizontalBar'
  }, {
    plugins: {
      tooltip: {
        callbacks: {
          afterLabel: (context: any) => {
            const index = context.dataIndex
            const row = sortedRows[index]
            return [
              `Закупок: ${row.purchases || 0}`,
              `Уникальных объектов: ${row.unique_objects || 0}`,
              `Уникальных материалов: ${row.unique_materials || 0}`
            ]
          }
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

onMounted(load)
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>

