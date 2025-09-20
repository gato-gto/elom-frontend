<template>
  <div class="list-container">
    <!-- Header -->
    <ListHeader
      title="Архив периодов"
      subtitle="Управление закрытыми периодами по объектам"
      icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      :show-create="true"
      create-text="Закрыть период"
      :can-create="true"
      :loading="loading"
      :show-stats="true"
      :total-count="count"
      :filtered-count="rows.length"
      @create="openCloseModal"
    />

    <!-- Filters -->
    <FilterPanel
      :columns="2"
      :loading="loading"
      @reset="resetFilters"
    >
      <FilterField
        v-model="month"
        type="month"
        label="Месяц"
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
        text="Загрузка архива..."
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
            <th @click="handleSort('month')" class="cursor-pointer hover:bg-gray-50">
              Месяц
              <span v-if="sortBy === 'month'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th>Объект</th>
            <th>Закрыто</th>
            <th>Кем закрыто</th>
            <th>Статус</th>
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
            <td>{{ p.month }}</td>
            <td>{{ p.object_name ?? p.object }}</td>
            <td>{{ formatDateTime(p.closed_at) }}</td>
            <td>{{ p.closed_by_name ?? '—' }}</td>
            <td>
              <span class="badge" :class="getStatusClass(p.is_closed)">
                {{ getStatusText(p.is_closed) }}
              </span>
            </td>
            <td class="text-right">
              <button
                class="btn btn-xs btn-warning"
                :disabled="busyId===p.id || !p.is_closed"
                @click="reopen(p)"
              >
                Открыть
              </button>
            </td>
          </tr>
          <tr v-if="!loading && rows.length === 0">
            <td colspan="7" class="text-center text-gray-500 py-8">
              <div class="flex flex-col items-center gap-2">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V8zM5 8a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V8z" />
                </svg>
                <span class="text-sm">Нет архивных записей</span>
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

    <!-- Модалка закрытия периода -->
    <dialog ref="dlg" class="modal">
      <div class="modal-box w-11/12 max-w-md">
        <h3 class="font-bold text-lg mb-4">Закрыть период</h3>
        
        <form class="grid gap-4" @submit.prevent="closePeriod">
          <div class="form-control">
            <label class="label" for="dlg-month">
              <span class="label-text font-medium">Месяц</span>
              <span class="label-text-alt text-error">*</span>
            </label>
            <input 
              id="dlg-month" 
              v-model="closeMonth" 
              type="month" 
              class="input input-bordered"
              required
            />
          </div>
          
          <div class="form-control">
            <label class="label" for="dlg-object">
              <span class="label-text font-medium">Объект</span>
              <span class="label-text-alt text-error">*</span>
            </label>
            <select 
              id="dlg-object" 
              v-model.number="closeObjectId" 
              class="select select-bordered"
              required
            >
              <option :value="undefined" disabled>Выберите объект</option>
              <option v-for="o in objects" :key="o.id" :value="o.id">{{ o.name }}</option>
            </select>
          </div>
          
          <div class="modal-action">
            <button type="button" class="btn btn-ghost" @click="closeDialog">
              Отмена
            </button>
            <button 
              type="submit" 
              class="btn btn-primary" 
              :disabled="closing || !canClose"
            >
              <svg v-if="closing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ closing ? 'Закрываем…' : 'Закрыть период' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import {computed, ref, onMounted, watch} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {
  PageResponse,
  ArchivePeriod,
  ArchivePeriodRequest,
  ArchiveListQuery,
  SiteObject,
} from '@/api/types'
import {formatDateTime, getStatusClass, getStatusText} from '@/utils/formatters'
import {debounce} from '@/utils/debounce'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'
import ModernPagination from '@/components/ModernPagination.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'

type Query = Record<string, string | number | boolean | (string | number)[] | null | undefined>

const rows = ref<ArchivePeriod[]>([])
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
  // Archive doesn't have ordering in current implementation, but we can add it to API call
  reload(1)
}
const busyId = ref<number | null>(null)

const month = ref<string | undefined>(new Date().toISOString().slice(0, 7)) // YYYY-MM
const objectId = ref<number | undefined>()
const objects = ref<SiteObject[]>([])

// Computed options for filters
const objectOptions = computed(() => [
  { value: undefined, label: 'Все' },
  ...objects.value.map(o => ({ value: o.id, label: o.name }))
])

async function loadRefs() {
  const {data} = await api.get<PageResponse<SiteObject>>(endpoints.objects.list + buildQuery({page_size: 1000, ordering: 'name'}))
  objects.value = data.results
}

async function fetchList() {
  loading.value = true
  try {
    const q: ArchiveListQuery & { page: number; page_size: number } = {
      page: page.value,
      page_size: pageSize.value,
      month: month.value,
      object: objectId.value,
    }
    const {data} = await api.get<PageResponse<ArchivePeriod>>(endpoints.archive.periods.list + buildQuery(q as unknown as Query))
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
  month.value = new Date().toISOString().slice(0, 7)
  objectId.value = undefined
  reload(1)
}

// --- Закрытие/открытие периодов ---
const dlg = ref<HTMLDialogElement | null>(null)
const closeMonth = ref<string | null>(null) // YYYY-MM
const closeObjectId = ref<number | undefined>(undefined)
const closing = ref(false)
const canClose = computed(() => !!closeMonth.value && !!closeObjectId.value)

function openCloseModal() {
  closeMonth.value = month.value ?? new Date().toISOString().slice(0, 7)
  closeObjectId.value = objectId.value
  dlg.value?.showModal()
}

function closeDialog() {
  dlg.value?.close()
}

async function closePeriod() {
  if (!canClose.value) return
  closing.value = true
  try {
    const payload: ArchivePeriodRequest = {month: closeMonth.value!, object: closeObjectId.value!}
    await api.post(endpoints.archive.close, payload)
    closeDialog()
    await fetchList()
  } finally {
    closing.value = false
  }
}

async function reopen(p: ArchivePeriod) {
  if (!p.is_closed) return
  if (!confirm(`Открыть период ${p.month} по объекту "${p.object_name ?? p.object}"?`)) return
  busyId.value = p.id
  try {
    // По спецификации ReopenRequest = {month, object}
    await api.post(endpoints.archive.reopen, {month: p.month, object: p.object})
    await fetchList()
  } finally {
    busyId.value = null
  }
}

// Watcher для автоматического поиска при изменении фильтров
watch(
  () => [month.value, objectId.value],
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
  await loadRefs()
  await fetchList()
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>

