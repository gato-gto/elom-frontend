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
        <a class="action-btn action-btn-outline" :href="xlsxUrl" target="_blank" rel="noreferrer">
          <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Экспорт .xlsx
        </a>
        <a class="action-btn action-btn-outline" :href="pdfUrl" target="_blank" rel="noreferrer">
          <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          PDF
        </a>
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

    <!-- Table -->
    <div class="list-content">
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
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.period">
            <td>{{ formatDate(r.period) }}</td>
            <td class="text-right">{{ formatCurrency(r.total_amount) }}</td>
            <td class="text-right">{{ r.purchases ?? '—' }}</td>
          </tr>
          <tr v-if="!loading && rows.length === 0">
            <td colspan="3" class="text-center text-gray-500">Нет данных</td>
          </tr>
        </tbody>
        <tfoot v-if="total">
          <tr>
            <th>Итого</th>
            <th class="text-right">{{ formatCurrency(total) }}</th>
            <th/>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/api/client'
import endpoints, { buildQuery } from '@/api/endpoints'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { debounce } from '@/utils/debounce'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'
import type { PeriodReportRow, PeriodReportResponse, ReportByPeriodQuery } from '@/api/types'

const dateFrom = ref<string | undefined>()
const dateTo = ref<string | undefined>()
const period = ref<'day' | 'month'>('month')
const rows = ref<PeriodReportRow[]>([])
const total = ref<number | null>(null)

// Sorting
const sortBy = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    // Создаем запрос только с заданными параметрами
    const query: ReportByPeriodQuery = {}
    
    if (dateFrom.value) query.date_from = dateFrom.value
    if (dateTo.value) query.date_to = dateTo.value
    if (period.value) query.period = period.value
    
    // Добавляем сортировку если задана
    if (sortBy.value) {
      query.ordering = sortOrder.value === 'desc' ? `-${sortBy.value}` : sortBy.value
    }
    
    const q = buildQuery(query)
    const { data } = await api.get<PeriodReportResponse>(endpoints.reports.byPeriod + q)
    
    if (data && data.rows) {
      rows.value = data.rows
      // Вычисляем общую сумму
      total.value = data.rows.reduce((sum, row) => sum + row.total_amount, 0)
    } else {
      rows.value = []
      total.value = null
    }
  } catch (error) {
    console.error('Ошибка загрузки отчета по периодам:', error)
    rows.value = []
    total.value = null
  } finally {
    loading.value = false
  }
}

const xlsxUrl = computed(() => {
  const query: ReportByPeriodQuery = { export: 'xlsx' }
  
  if (dateFrom.value) query.date_from = dateFrom.value
  if (dateTo.value) query.date_to = dateTo.value
  if (period.value) query.period = period.value
  
  const q = buildQuery(query)
  return endpoints.reports.byPeriod + q
})
const pdfUrl = computed(() => {
  const query: ReportByPeriodQuery = { export: 'pdf' }
  
  if (dateFrom.value) query.date_from = dateFrom.value
  if (dateTo.value) query.date_to = dateTo.value
  if (period.value) query.period = period.value
  
  const q = buildQuery(query)
  return endpoints.reports.byPeriod + q
})

function resetFilters() {
  dateFrom.value = undefined
  dateTo.value = undefined
  period.value = 'month'
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

onMounted(load)
</script>

