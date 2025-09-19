<template>
  <div class="list-container">
    <!-- Header -->
    <ListHeader
      title="Отчёт по ответственным"
      subtitle="Анализ закупок по ответственным лицам"
      icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
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

    <!-- Table -->
    <div class="list-content">
      <table class="modern-table">
        <thead>
          <tr>
            <th @click="handleSort('responsible_name')" class="cursor-pointer hover:bg-gray-50">
              Ответственный
              <span v-if="sortBy === 'responsible_name'" class="ml-1">
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
        <tr v-for="r in rows" :key="r.responsible_id">
          <td>{{ r.responsible_name }}</td>
          <td class="text-right">{{ formatCurrency(r.total_amount) }}</td>
          <td class="text-right">{{ r.purchases ?? '—' }}</td>
        </tr>
        <tr v-if="!loading && rows.length===0">
          <td colspan="3" class="text-center text-gray-700-60">Нет данных</td>
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
import {ref, computed, onMounted, watch} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import {formatCurrency} from '@/utils/formatters'
import { debounce } from '@/utils/debounce'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'
import type { ResponsibleReportRow, ResponsibleReportResponse, ReportByResponsibleQuery } from '@/api/types'

const dateFrom = ref<string | undefined>()
const dateTo = ref<string | undefined>()
const rows = ref<ResponsibleReportRow[]>([])
const total = ref<number | null>(null)

// Sorting
const sortBy = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    // Создаем запрос только с заданными параметрами
    const query: ReportByResponsibleQuery = {}
    
    if (dateFrom.value) query.date_from = dateFrom.value
    if (dateTo.value) query.date_to = dateTo.value
    
    // Добавляем сортировку если задана
    if (sortBy.value) {
      query.ordering = sortOrder.value === 'desc' ? `-${sortBy.value}` : sortBy.value
    }
    
    const q = buildQuery(query)
    const {data} = await api.get<ResponsibleReportResponse>(endpoints.reports.byResponsible + q)
    
    if (data && data.rows) {
      rows.value = data.rows
      total.value = data.rows.reduce((sum, r) => sum + r.total_amount, 0)
    } else {
      rows.value = []
      total.value = null
    }
  } catch (error) {
    console.error('Ошибка загрузки отчета по ответственным:', error)
    rows.value = []
    total.value = null
  } finally {
    loading.value = false
  }
}

const xlsxUrl = computed(() => {
  const query: ReportByResponsibleQuery = { export: 'xlsx' }
  
  if (dateFrom.value) query.date_from = dateFrom.value
  if (dateTo.value) query.date_to = dateTo.value
  
  const q = buildQuery(query)
  return endpoints.reports.byResponsible + q
})
const pdfUrl = computed(() => {
  const query: ReportByResponsibleQuery = { export: 'pdf' }
  
  if (dateFrom.value) query.date_from = dateFrom.value
  if (dateTo.value) query.date_to = dateTo.value
  
  const q = buildQuery(query)
  return endpoints.reports.byResponsible + q
})

function resetFilters() {
  dateFrom.value = undefined
  dateTo.value = undefined
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
watch([dateFrom, dateTo], () => {
  debouncedLoad()
})

onMounted(load)
</script>

