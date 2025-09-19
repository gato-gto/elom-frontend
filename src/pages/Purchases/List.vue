<template>
  <div class="list-container">
    <!-- Header -->
    <ListHeader
      title="Закупки"
      subtitle="Управление закупками материалов и поставщиками"
      icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      :show-create="true"
      create-text="Новая закупка"
      :can-create="true"
      :loading="loading"
      :show-stats="true"
      :total-count="count"
      :filtered-count="rows.length"
      @create="openCreateModal"
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
      
      <FilterField
        v-model="filters.is_archived"
        type="select"
        label="Статус"
        :options="statusOptions"
      />
      
    </FilterPanel>

    <!-- Table -->
    <div class="list-content" :class="{ 'relative': loading }">
      <!-- Loading Overlay -->
      <LoadingSpinner 
        v-if="loading && rows.length === 0"
        size="lg"
        variant="primary"
        text="Загрузка закупок..."
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
            <th>Поставщик</th>
            <th>Ответственный</th>
            <th class="text-right">Позиций</th>
            <th class="text-right">Действия</th>
          </tr>
        </thead>
        
        <!-- Skeleton Loading -->
        <TableSkeleton 
          v-if="loading && rows.length === 0"
          :rows="pageSize"
          :columns="7"
        />
        
        <!-- Actual Data -->
        <tbody v-else>
          <tr v-for="p in rows" :key="p.id" class="table-row">
            <td>{{ p.id }}</td>
            <td>{{ formatDate(p.date) }}</td>
            <td>{{ p.object_name || '—' }}</td>
            <td>{{ p.supplier || '—' }}</td>
            <td>{{ p.responsible_name || '—' }}</td>
            <td class="text-right">{{ p.items?.length ?? 0 }}</td>
            <td class="text-right">
              <div class="flex gap-1 justify-end">
                <span v-if="p.is_archived" class="badge badge-warning badge-xs">Архив</span>
                <RouterLink class="btn btn-xs btn-outline" :to="`/purchases/${p.id}/edit`">Открыть</RouterLink>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && rows.length===0">
            <td colspan="7" class="text-center text-gray-500 py-8">
              <div class="flex flex-col items-center gap-2 empty-state">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="text-sm">Нет закупок</span>
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

    <!-- Modal for creating new purchase -->
    <Modal v-model="modalOpen" :title="'Новая закупка'" size="6xl" :closable="true">
      <PurchaseForm @saved="onPurchaseSaved" @cancel="modalOpen = false" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {PageResponse, Purchase, PurchaseListFilters, PurchaseExportQuery, SiteObject, Employee, Material} from '@/api/types'
import {formatDate, formatCurrency, getStatusClass, getStatusText} from '@/utils/formatters'
import {debounce} from '@/utils/debounce'
import Modal from '@/components/Modal.vue'
import PurchaseForm from './PurchaseForm.vue'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'
import ModernPagination from '@/components/ModernPagination.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'

type Query = Record<string, string | number | boolean | (string | number)[] | null | undefined>

const rows = ref<Purchase[]>([])
const count = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const modalOpen = ref(false)

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
  filters.value.ordering = ordering
  reload(1)
}

const filters = ref<PurchaseListFilters>({
  date_after: undefined, 
  date_before: undefined, 
  object: undefined, 
  material: undefined,
  responsible: undefined, 
  is_archived: undefined,
  ordering: '-date',
})

const objects = ref<SiteObject[]>([])
const employees = ref<Employee[]>([])
const materials = ref<Material[]>([])

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

const statusOptions = computed(() => [
  { value: undefined, label: 'Все' },
  { value: false, label: 'Активные' },
  { value: true, label: 'Архивные' }
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

async function fetchList() {
  loading.value = true
  try {
    const q: PurchaseListFilters & { page: number; page_size: number } = {...filters.value, page: page.value, page_size: pageSize.value}
    const {data} = await api.get<PageResponse<Purchase>>(endpoints.purchases.list + buildQuery(q as unknown as Query))
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

function openCreateModal() {
  modalOpen.value = true
}

function onPurchaseSaved() {
  modalOpen.value = false
  // Reload the list to show the new purchase
  fetchList()
}

function resetFilters() {
  filters.value = {
    date_after: undefined, 
    date_before: undefined, 
    object: undefined, 
    material: undefined,
    responsible: undefined, 
    is_archived: undefined,
    ordering: '-date',
  }
  reload(1)
}

// Debounced функция для поиска
const debouncedSearch = debounce(() => {
  reload(1)
}, 500)

const exportUrl = computed(() => {
  const q: PurchaseExportQuery = {...filters.value, export: 'xlsx'} as PurchaseExportQuery
  return endpoints.purchases.list + buildQuery(q as unknown as Query)
})

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

