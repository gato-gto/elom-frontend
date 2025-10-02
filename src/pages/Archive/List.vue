<template>
  <div class="list-container">
    <!-- GenericList Component -->
    <GenericList
      :store="archiveStore"
      :config="listConfig"
      @create="openCloseModal"
      @action="handleAction"
      @export="handleExport"
    >
      <!-- Custom column for object name -->
      <template #column-object_name="{ item, value }">
        <span>{{ value ?? item.object }}</span>
      </template>

      <!-- Custom column for closed_at -->
      <template #column-closed_at="{ item, value }">
        <span>{{ formatDateTime(value) }}</span>
      </template>

      <!-- Custom column for closed_by_name -->
      <template #column-closed_by_name="{ item, value }">
        <span>{{ value ?? '—' }}</span>
      </template>

      <!-- Custom column for is_closed status -->
      <template #column-is_closed="{ item, value }">
        <span class="badge" :class="getStatusClass(value)">
          {{ getStatusText(value) }}
        </span>
      </template>

      <!-- Custom column for reopen action -->
      <template #column-actions="{ item }">
        <button
          class="btn btn-xs btn-warning"
          :disabled="busyId === item.id || !item.is_closed"
          @click="reopen(item)"
        >
          Открыть
        </button>
      </template>
    </GenericList>

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
import { computed, ref, onMounted, reactive } from 'vue'
import api from '@/api/client'
import endpoints, { buildQuery } from '@/api/endpoints'
import type {
  PageResponse,
  ArchivePeriod,
  ArchivePeriodRequest,
  ArchiveListQuery,
  SiteObject,
} from '@/api/types'
import type { GenericListConfig } from '@/types/generic'
import { formatDateTime, getStatusClass, getStatusText } from '@/utils/formatters'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { exportToCSV, exportToExcel, exportToPDF } from '@/composables/useExport'
import GenericList from '@/components/GenericList.vue'

type Query = Record<string, string | number | boolean | (string | number)[] | null | undefined>

// Error handling
const { handleLoadingError } = useErrorHandler()

// State
const rows = ref<ArchivePeriod[]>([])
const count = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const busyId = ref<number | null>(null)

// Filters
const filters = reactive({
  month: new Date().toISOString().slice(0, 7), // YYYY-MM
  object: undefined as number | undefined
})

const objects = ref<SiteObject[]>([])

// Store-like interface for GenericList
const archiveStore = {
  items: rows,
  loading,
  error: ref<string | null>(null),
  pagination: computed(() => ({
    count: count.value,
    page: page.value,
    pageSize: pageSize.value,
    next: null,
    previous: null
  })),
  filters,
  fetchList: async () => {
    loading.value = true
    try {
      const q: ArchiveListQuery & { page: number; page_size: number } = {
        page: page.value,
        page_size: pageSize.value,
        month: filters.month,
        object: filters.object,
      }
      const { data } = await api.get<PageResponse<ArchivePeriod>>(endpoints.archive.periods.list + buildQuery(q as unknown as Query))
      rows.value = data.results
      count.value = data.count
    } catch (error) {
      await handleLoadingError(error, 'archive')
    } finally {
      loading.value = false
    }
  },
  setPage: (newPage: number) => {
    page.value = newPage
  },
  setPageSize: async (newSize: number) => {
    pageSize.value = newSize
    page.value = 1
  },
  setFilters: (newFilters: Partial<typeof filters>) => {
    Object.assign(filters, newFilters)
    page.value = 1
  },
  resetFilters: () => {
    filters.month = new Date().toISOString().slice(0, 7)
    filters.object = undefined
    page.value = 1
  },
  clearError: () => {
    // No error handling in this component
  }
}

// Filter options
const objectOptions = computed(() => [
  { value: '', label: 'Все объекты' },
  ...objects.value.map(o => ({ value: o.id, label: o.name }))
])

// GenericList configuration
const listConfig = computed<GenericListConfig<ArchivePeriod>>(() => ({
  title: 'Архив периодов',
  subtitle: 'Управление закрытыми периодами по объектам',
  icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  showCreate: true,
  createText: 'Закрыть период',
  canCreate: true,
  showStats: true,
  exportable: true,
  exportFilename: 'archive',
  exportUrl: '/api/v1/stock/archive/periods/',
  loadingText: 'Загрузка архива...',
  emptyText: 'Нет архивных записей',
  emptyTitle: 'Нет архивных записей',
  emptySubtitle: 'Закройте первый период для начала работы',
  filterColumns: 2,
  columns: [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'month', label: 'Месяц', sortable: true },
    { key: 'object_name', label: 'Объект', sortable: true },
    { key: 'closed_at', label: 'Закрыто', sortable: true },
    { key: 'closed_by_name', label: 'Кем закрыто', sortable: true },
    { key: 'is_closed', label: 'Статус', sortable: true },
    { key: 'actions', label: 'Действия', sortable: false }
  ],
  filters: [
    {
      key: 'month',
      type: 'date',
      label: 'Месяц'
    },
    {
      key: 'object',
      type: 'select',
      label: 'Объект',
      options: objectOptions.value
    }
  ],
  actions: [
    {
      key: 'reopen',
      label: 'Открыть',
      class: 'btn-warning',
      disabled: (item: ArchivePeriod) => !item.is_closed
    }
  ],
  defaultSort: 'month',
  defaultSortOrder: 'desc'
}))

// --- Закрытие/открытие периодов ---
const dlg = ref<HTMLDialogElement | null>(null)
const closeMonth = ref<string | null>(null) // YYYY-MM
const closeObjectId = ref<number | undefined>(undefined)
const closing = ref(false)
const canClose = computed(() => !!closeMonth.value && !!closeObjectId.value)

function openCloseModal() {
  closeMonth.value = filters.month ?? new Date().toISOString().slice(0, 7)
  closeObjectId.value = filters.object
  dlg.value?.showModal()
}

function closeDialog() {
  dlg.value?.close()
}

async function closePeriod() {
  if (!canClose.value) { return }
  closing.value = true
  try {
    const payload: ArchivePeriodRequest = { month: closeMonth.value!, object: closeObjectId.value! }
    await api.post(endpoints.archive.close, payload)
    closeDialog()
    await archiveStore.fetchList()
  } catch (error) {
    await handleLoadingError(error, 'archive')
  } finally {
    closing.value = false
  }
}

async function reopen(p: ArchivePeriod) {
  if (!p.is_closed) { return }
  if (!confirm(`Открыть период ${p.month} по объекту "${p.object_name ?? p.object}"?`)) { return }
  busyId.value = p.id
  try {
    await api.post(endpoints.archive.reopen, { month: p.month, object: p.object })
    await archiveStore.fetchList()
  } catch (error) {
    await handleLoadingError(error, 'archive')
  } finally {
    busyId.value = null
  }
}

async function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    const data = rows.value
    const filename = `archive_${new Date().toISOString().split('T')[0]}`

    switch (format) {
      case 'csv':
        exportToCSV(data, filename)
        break
      case 'excel':
        exportToExcel(data, filename)
        break
      case 'pdf':
        exportToPDF(data, filename)
        break
    }
  } catch (error) {
    await handleLoadingError(error, 'archive')
  }
}

function handleAction(action: string, item: ArchivePeriod) {
  switch (action) {
    case 'reopen':
      reopen(item)
      break
  }
}

async function loadRefs() {
  try {
    const { data } = await api.get<PageResponse<SiteObject>>(endpoints.objects.list + buildQuery({ page_size: 1000, ordering: 'name' }))
    objects.value = data.results
  } catch (error) {
    await handleLoadingError(error, 'objects')
  }
}

onMounted(async () => {
  await loadRefs()
  await archiveStore.fetchList()
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>

