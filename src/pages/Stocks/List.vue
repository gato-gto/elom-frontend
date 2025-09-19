<template>
  <div class="list-container">
    <!-- Header -->
    <ListHeader
      title="Остатки"
      subtitle="Просмотр остатков материалов по объектам"
      icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      :show-create="false"
      :show-stats="true"
      :total-count="count"
      :filtered-count="rows.length"
    />

    <!-- Filters -->
    <FilterPanel
      :columns="3"
      :loading="loading"
      @reset="resetFilters"
    >
      <FilterField
        v-model="filters.date_after"
        type="date"
        label="Дата с"
      />
      
      <FilterField
        v-model="filters.date_before"
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
        v-model="filters.material"
        type="select"
        label="Материал"
        :options="materialOptions"
      />
      
      <FilterField
        v-model="filters.responsible"
        type="select"
        label="Ответственный"
        :options="employeeOptions"
      />
    </FilterPanel>

    <!-- Table -->
    <div class="list-content" :class="{ 'relative': loading }">
      <!-- Loading Overlay -->
      <LoadingSpinner 
        v-if="loading && rows.length === 0"
        size="lg"
        variant="primary"
        text="Загрузка остатков..."
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
          <th @click="handleSort('id')" class="cursor-pointer hover:bg-gray-50">
            ID
            <span v-if="sortBy === 'id'" class="ml-1">
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </span>
          </th>
          <th @click="handleSort('date')" class="cursor-pointer hover:bg-gray-50">
            Дата
            <span v-if="sortBy === 'date'" class="ml-1">
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </span>
          </th>
          <th>Объект</th>
          <th>Материал</th>
          <th class="text-right">Факт. остаток</th>
            <th class="text-right">Закуплено</th>
            <th class="text-right">Списано</th>
          <th>Ответственный</th>
        </tr>
        </thead>
        
        <!-- Skeleton Loading -->
        <TableSkeleton 
          v-if="loading && rows.length === 0"
          :rows="pageSize"
          :columns="8"
        />
        
        <!-- Actual Data -->
        <tbody v-else>
        <tr v-for="s in rows" :key="s.id" class="table-row">
          <td>{{ s.id }}</td>
            <td>{{ formatDate(s.date) }}</td>
          <td>{{ objectName(s.object) ?? s.object }}</td>
          <td>{{ materialName(s.material) ?? s.material }}</td>
            <td class="text-right">
              <SmartUnitValue 
                v-if="s.smart_quantity" 
                :smart-quantity="s.smart_quantity" 
                :show-original="true"
                class-name="font-mono text-sm"
              />
              <SmartUnitValue 
                v-else
                :value="parseFloat(s.quantity)" 
                :unit="s.unit_code"
                :show-original="false"
                class-name="font-mono text-sm"
              />
            </td>
            <td class="text-right">
              <SmartUnitValue 
                v-if="s.smart_purchased_qty" 
                :smart-quantity="s.smart_purchased_qty" 
                :show-original="true"
                class-name="font-mono text-sm"
              />
              <SmartUnitValue 
                v-else
                :value="parseFloat(s.purchased_qty)" 
                :unit="s.unit_code"
                :show-original="false"
                class-name="font-mono text-sm"
              />
            </td>
            <td class="text-right">
              <SmartUnitValue 
                v-if="s.smart_write_off_qty" 
                :smart-quantity="s.smart_write_off_qty" 
                :show-original="true"
                class-name="font-mono text-sm"
              />
              <SmartUnitValue 
                v-else
                :value="parseFloat(s.write_off_qty)" 
                :unit="s.unit_code"
                :show-original="false"
                class-name="font-mono text-sm"
              />
            </td>
          <td>{{ responsibleName(s.responsible) ?? '—' }}</td>
        </tr>
        <tr v-if="!loading && rows.length === 0">
            <td colspan="8" class="text-center text-gray-500 py-8">
              <div class="flex flex-col items-center gap-2">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span class="text-sm">Нет остатков</span>
              </div>
            </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <ModernPagination
      :current-page="page"
      :total-pages="Math.ceil(count / pageSize)"
      :total-items="count"
      :page-size="pageSize"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {PageResponse, StockSnapshot, StockListFilters, SiteObject, Material, Employee} from '@/api/types'
import {formatDate, formatNumber} from '@/utils/formatters'
import {debounce} from '@/utils/debounce'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'
import ModernPagination from '@/components/ModernPagination.vue'
import SmartUnitValue from '@/components/SmartUnitValue.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'

type Query = Record<string, string | number | boolean | (string | number)[] | null | undefined>

const rows = ref<StockSnapshot[]>([])
const count = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

// Debounced функция для поиска
const debouncedSearch = debounce(() => {
  reload(1)
}, 500)

// Sorting
const sortBy = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

function handleSort(key: string) {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
  
  const ordering = sortOrder.value === 'desc' ? `-${key}` : key
  // Stocks doesn't have ordering in filters, so we'll add it to the API call directly
  reload(1)
}

const filters = ref<StockListFilters>({
  date_after: undefined, date_before: undefined, object: undefined, material: undefined, responsible: undefined,
})

const objects = ref<SiteObject[]>([])
const materials = ref<Material[]>([])
const employees = ref<Employee[]>([])

// Computed options for filters
const objectOptions = computed(() => [
  { value: undefined, label: 'Все' },
  ...objects.value.map(o => ({ value: o.id, label: o.name }))
])

const materialOptions = computed(() => [
  { value: undefined, label: 'Все' },
  ...materials.value.map(m => ({ value: m.id, label: m.name }))
])

const employeeOptions = computed(() => [
  { value: undefined, label: 'Все' },
  ...employees.value.map(e => ({ 
    value: e.id, 
    label: `${e.first_name || e.username} ${e.last_name || ''}`.trim()
  }))
])

const oMap = computed(() => new Map(objects.value.map(o => [o.id, o.name])))
const mMap = computed(() => new Map(materials.value.map(m => [m.id, m.name])))
const eMap = computed(() => new Map(employees.value.map(e => [e.id, `${e.first_name || e.username}${e.last_name ? ' ' + e.last_name : ''}`])))

function objectName(id?: number) {
  return id ? oMap.value.get(id) : undefined
}

function materialName(id?: number) {
  return id ? mMap.value.get(id) : undefined
}

function responsibleName(id: number | null | undefined) {
  return id ? eMap.value.get(id) : undefined
}

async function loadRefs() {
  const [od, md, ed] = await Promise.all([
    api.get<PageResponse<SiteObject>>(endpoints.objects.list + buildQuery({page_size: 1000, ordering: 'name'})),
    api.get<PageResponse<Material>>(endpoints.materials.list + buildQuery({page_size: 1000, ordering: 'name'})),
    api.get<PageResponse<Employee>>(endpoints.employees.list + buildQuery({page_size: 1000, ordering: 'username'})),
  ])
  objects.value = od.data.results
  materials.value = md.data.results
  employees.value = ed.data.results
  
  // Отладка: показываем загруженных сотрудников
  console.log('Loaded employees for stocks:', employees.value.length, employees.value.map(e => ({id: e.id, name: `${e.first_name || e.username} ${e.last_name || ''}`.trim()})))
}

async function fetchList() {
  loading.value = true
  try {
    // Очищаем undefined значения перед отправкой
    const cleanFilters = Object.entries(filters.value).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, any>)
    
    const q = {...cleanFilters, page: page.value, page_size: pageSize}
    // Отладка: показываем, что отправляется в запросе
    console.log('Stocks filters (cleaned):', q)
    const {data} = await api.get<PageResponse<StockSnapshot>>(endpoints.stockSnapshots.list + buildQuery(q as unknown as Query))
    rows.value = data.results
    count.value = data.count
  } finally {
    loading.value = false
  }
}

function reload(p = page.value) {
  page.value = p;
  fetchList()
}

function resetFilters() {
  filters.value = {
    date_after: undefined, 
    date_before: undefined, 
    object: undefined, 
    material: undefined, 
    responsible: undefined
  }
  reload(1)
}

// Watcher для автоматического поиска при изменении фильтров
watch(
  () => filters.value,
  () => {
    page.value = 1
    debouncedSearch()
  },
  { deep: true }
)

function handlePageChange(newPage: number) {
  page.value = newPage
  fetchList()
}

function handlePageSizeChange(newSize: number) {
  pageSize.value = newSize
  page.value = 1
  fetchList()
}

onMounted(async () => {
  await loadRefs();
  await fetchList()
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>

