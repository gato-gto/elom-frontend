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
        v-model="objectId"
        type="select"
        label="Объект"
        :options="objectOptions"
      />
    </FilterPanel>

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
            <th @click="handleSort('material_name')" class="cursor-pointer hover:bg-gray-50">
              Материал
              <span v-if="sortBy === 'material_name'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('unit_code')" class="cursor-pointer hover:bg-gray-50">
              Ед.
              <span v-if="sortBy === 'unit_code'" class="ml-1">
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
        
        <!-- Skeleton Loading -->
        <TableSkeleton 
          v-if="loading && rows.length === 0"
          :rows="pageSize"
          :columns="4"
        />
        
        <!-- Actual Data -->
        <tbody v-else>
        <tr v-for="r in rows" :key="r.material_id" class="table-row">
          <td>{{ r.material_name ?? '—' }}</td>
          <td>{{ r.unit ?? '—' }}</td>
          <td class="text-right">{{ formatCurrency(r.amount_total) }}</td>
          <td class="text-right">{{ r.rows ?? '—' }}</td>
        </tr>
        <tr v-if="!loading && rows.length === 0">
          <td colspan="4" class="text-center text-gray-500 py-8">
            <div class="flex flex-col items-center gap-2 empty-state">
              <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span class="text-sm">Нет данных по материалам</span>
            </div>
          </td>
        </tr>
        </tbody>
        <tfoot v-if="total">
        <tr>
          <th>Итого</th>
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
import {ref, computed, onMounted, watch} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {SiteObject, PageResponse, MaterialReportRow, MaterialReportResponse, ReportByMaterialQuery} from '@/api/types'
import {formatCurrency} from '@/utils/formatters'
import { debounce } from '@/utils/debounce'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'
import ModernPagination from '@/components/ModernPagination.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'

type ReportRow = {
  material_id: number
  material_name: string
  unit: string
  qty_total: number | null
  amount_total: number
  rows: number
}

type ReportResponse = { 
  rows: ReportRow[]
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

async function loadObjects() {
  const {data} = await api.get<PageResponse<SiteObject>>(endpoints.objects.list + buildQuery({page_size: 1000}))
  objects.value = data.results
}

async function load() {
  loading.value = true
  try {
    // Создаем запрос только с заданными параметрами
    const query: ReportByMaterialQuery = {}
    
    if (dateFrom.value) query.date_from = dateFrom.value
    if (dateTo.value) query.date_to = dateTo.value
    if (objectId.value) query.object = [objectId.value]
    
    // Добавляем пагинацию
    query.page = currentPage.value
    query.page_size = pageSize.value
    
    // Добавляем сортировку если задана
    if (sortBy.value) {
      query.ordering = sortOrder.value === 'desc' ? `-${sortBy.value}` : sortBy.value
    }
    
    const q = buildQuery(query)
    const {data} = await api.get<MaterialReportResponse>(endpoints.reports.byMaterial + q)
    
    if (data && data.rows) {
      rows.value = data.rows
      totalItems.value = data.rows.length
      total.value = data.rows.reduce((sum, r) => sum + r.amount_total, 0)
    } else {
      rows.value = []
      totalItems.value = 0
      total.value = null
    }
  } catch (error) {
    console.error('Ошибка загрузки отчета по материалам:', error)
    rows.value = []
    total.value = null
  } finally {
    loading.value = false
  }
}

const xlsxUrl = computed(() => {
  const query: ReportByMaterialQuery = { export: 'xlsx' }
  
  if (dateFrom.value) query.date_from = dateFrom.value
  if (dateTo.value) query.date_to = dateTo.value
  if (objectId.value) query.object = [objectId.value]
  
  const q = buildQuery(query)
  return endpoints.reports.byMaterial + q
})
const pdfUrl = computed(() => {
  const query: ReportByMaterialQuery = { export: 'pdf' }
  
  if (dateFrom.value) query.date_from = dateFrom.value
  if (dateTo.value) query.date_to = dateTo.value
  if (objectId.value) query.object = [objectId.value]
  
  const q = buildQuery(query)
  return endpoints.reports.byMaterial + q
})

const objectOptions = computed(() => [
  { value: '', label: 'Все объекты' },
  ...objects.value.map(obj => ({ value: obj.id, label: obj.name }))
])

function resetFilters() {
  dateFrom.value = undefined
  dateTo.value = undefined
  objectId.value = undefined
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
  debouncedLoad()
})

onMounted(async () => {
  await loadObjects()
  await load()
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>

