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
        <a class="action-btn action-btn-outline" :href="exportUrl" target="_blank" rel="noreferrer">
          <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Экспорт .xlsx
        </a>
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

    <!-- Table -->
    <div class="list-content">
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
        <tbody>
          <tr v-for="r in rows" :key="r.object_id">
            <td>{{ r.object_name ?? '—' }}</td>
            <td class="text-right">{{ r.purchases ?? '—' }}</td>
            <td class="text-right">{{ formatCurrency(r.total_amount) }}</td>
          </tr>
          <tr v-if="!loading && rows.length===0">
            <td colspan="3" class="text-center text-gray-500">Нет данных</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="modern-pagination" v-if="isPaginated">
      <button class="pagination-btn" :disabled="page <= 1" @click="reload(1)">«</button>
      <button class="pagination-btn" :disabled="page <= 1" @click="reload(page - 1)">Назад</button>
      <span class="pagination-info">Стр. {{ page }}</span>
      <button class="pagination-btn" :disabled="page * pageSize >= count" @click="reload(page + 1)">Вперёд</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {PageResponse, ReportByObjectQuery, SiteObject, Employee, Material, ObjectReportRow, ObjectReportResponse} from '@/api/types'
import {formatDate, formatCurrency, formatNumber} from '@/utils/formatters'
import { debounce } from '@/utils/debounce'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'

const rows = ref<ObjectReportRow[]>([])
const loading = ref(false)
const count = ref(0)
const page = ref(1)
const pageSize = 50

const filters = ref<ReportByObjectQuery>({date_from: undefined, date_to: undefined, object: undefined, responsible: undefined})

// Sorting
const sortBy = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

const objects = ref<SiteObject[]>([])
const employees = ref<Employee[]>([])
const materials = ref<Material[]>([])

const objMap = computed(() => new Map(objects.value.map(o => [o.id, o.name])))
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
  ...objects.value.map(obj => ({ value: obj.id, label: obj.name }))
])

const employeeOptions = computed(() => [
  { value: '', label: 'Все ответственные' },
  ...employees.value.map(emp => ({ 
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
    
    if (filters.value.date_from) query.date_from = filters.value.date_from
    if (filters.value.date_to) query.date_to = filters.value.date_to
    if (filters.value.object && filters.value.object.length > 0) query.object = filters.value.object
    if (filters.value.responsible) query.responsible = filters.value.responsible
    
    // Добавляем сортировку если задана
    if (sortBy.value) {
      query.ordering = sortOrder.value === 'desc' ? `-${sortBy.value}` : sortBy.value
    }
    
    const q = buildQuery(query)
    const {data} = await api.get<ObjectReportResponse>(endpoints.reports.byObject + q)
    
    if (data && data.rows) {
      rows.value = data.rows
      count.value = data.rows.length
    } else {
      rows.value = []
      count.value = 0
    }
  } catch (error) {
    console.error('Ошибка загрузки отчета по объектам:', error)
    rows.value = []
    count.value = 0
  } finally {
    loading.value = false
  }
}

function reload(p = page.value) {
  page.value = p;
  fetchReport()
}

const exportUrl = computed(() => {
  // Создаем запрос только с заданными параметрами
  const query: ReportByObjectQuery = { export: 'xlsx' }
  
  if (filters.value.date_from) query.date_from = filters.value.date_from
  if (filters.value.date_to) query.date_to = filters.value.date_to
  if (filters.value.object && filters.value.object.length > 0) query.object = filters.value.object
  if (filters.value.responsible) query.responsible = filters.value.responsible
  
  const q = buildQuery(query)
  return endpoints.reports.byObject + q
})

function resetFilters() {
  filters.value = { date_from: undefined, date_to: undefined, object: undefined, responsible: undefined }
  page.value = 1
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
  page.value = 1
  fetchReport()
}, 500)

// Watcher для автоматического поиска при изменении фильтров
watch(
  () => filters.value,
  () => {
    debouncedFetch()
  },
  { deep: true }
)

onMounted(async () => {
  await loadRefs();
  await fetchReport()
})
</script>

