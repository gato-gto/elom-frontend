<template>
  <div class="list-container">
    <!-- Header -->
    <ListHeader
      title="Остатки"
      subtitle="Просмотр и управление остатками материалов по объектам"
      icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      :show-create="canEdit"
      create-text="Новое движение"
      :can-create="canEdit"
      :loading="loading"
      :show-stats="true"
      :total-count="count"
      :filtered-count="rows.length"
      @create="handleCreate"
    >
      <template #actions>
        <ExportButton 
          :data="rows"
          filename="stocks"
          :loading="loading"
          @export="handleExport"
        />
      </template>
    </ListHeader>

    <!-- Filters -->
    <FilterPanel
      :columns="4"
      :loading="loading"
      @reset="resetFilters"
    >
      <FilterField
        v-model="filters.search"
        type="text"
        label="Поиск"
        placeholder="Поиск по материалам, объектам..."
        @update:modelValue="handleSearchChange"
      />
      <FilterField
        v-model="filters.date_from"
        type="date"
        label="Дата с"
        @update:modelValue="(value) => stockSnapshotsStore.setFilters({ date_from: value as string })"
      />
      
      <FilterField
        v-model="filters.date_to"
        type="date"
        label="Дата по"
        @update:modelValue="(value) => stockSnapshotsStore.setFilters({ date_to: value as string })"
      />
      
      <FilterField
        v-model="filters.object"
        type="select"
        label="Объект"
        :options="objectOptions"
        @update:modelValue="(value) => stockSnapshotsStore.setFilters({ object: value as number })"
      />
      
      <FilterField
        v-model="filters.material"
        type="select"
        label="Материал"
        :options="materialOptions"
        @update:modelValue="(value) => stockSnapshotsStore.setFilters({ material: value as number })"
      />
      
      <FilterField
        v-model="filters.source_type"
        type="select"
        label="Тип"
        :options="sourceTypeOptions"
        @update:modelValue="handleSourceTypeChange"
      />
      
      <FilterField
        v-model="filters.stage"
        type="select"
        label="Этап"
        :options="stageOptions"
        @update:modelValue="(value) => stockSnapshotsStore.setFilters({ stage: value as any })"
      />
      
      <FilterField
        v-model="filters.responsible"
        type="select"
        label="Ответственный"
        :options="employeeOptions"
        @update:modelValue="(value) => stockSnapshotsStore.setFilters({ responsible: value as number })"
      />
    </FilterPanel>

    <!-- Error message -->
    <div v-if="stockSnapshotsStore.error" class="alert alert-error">
      <span>{{ stockSnapshotsStore.error }}</span>
      <button class="btn btn-sm btn-ghost" @click="stockSnapshotsStore.clearError()">×</button>
    </div>

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
          <th class="text-right">Количество</th>
          <th>Тип</th>
          <th>Этап</th>
          <th>Источник</th>
          <th>Ответственный</th>
          <th class="text-right">Действия</th>
        </tr>
        </thead>
        
        <!-- Skeleton Loading -->
        <TableSkeleton 
          v-if="loading && rows.length === 0"
          :rows="pageSize"
          :columns="10"
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
              :class-name="parseFloat(s.quantity_signed) >= 0 ? 'font-mono text-sm text-green-600' : 'font-mono text-sm text-red-600'"
            />
            <span 
              v-else
              :class="parseFloat(s.quantity_signed) >= 0 ? 'font-mono text-sm text-green-600' : 'font-mono text-sm text-red-600'"
            >
              {{ parseFloat(s.quantity_signed) >= 0 ? '+' : '' }}{{ s.quantity_signed }} {{ s.unit_code }}
            </span>
          </td>
          <td>
            <span 
              :class="parseFloat(s.quantity_signed) >= 0 ? 'badge badge-success badge-xs' : 'badge badge-error badge-xs'"
            >
              {{ parseFloat(s.quantity_signed) >= 0 ? 'Приход' : 'Расход' }}
            </span>
          </td>
          <td>
            <span class="badge badge-outline badge-xs">
              {{ getStageDisplayName(s.stage) }}
            </span>
          </td>
          <td>
            <span class="text-xs text-gray-600">
              {{ s.source_description || `${getSourceTypeDisplayName(s.source_type)} #${s.source_id}` }}
            </span>
          </td>
          <td>{{ responsibleName(s.responsible) ?? '—' }}</td>
          <td class="text-right">
            <div class="flex gap-1 justify-end">
              <span v-if="s.is_archived" class="badge badge-warning badge-xs">Архив</span>
              <RouterLink class="btn btn-xs btn-outline" :to="`/stocks/${s.id}/edit`">Редактировать</RouterLink>
            </div>
          </td>
        </tr>
        <tr v-if="!loading && rows.length === 0">
            <td colspan="10" class="text-center text-gray-500 py-8">
              <div class="flex flex-col items-center gap-2 empty-state">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span class="text-sm">Нет движений остатков</span>
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

    <!-- Modal for creating/editing stock snapshot -->
    <Modal v-model="modalOpen" :title="modalTitle" size="4xl" :closable="true">
      <StockSnapshotForm 
        :initial="editingStockSnapshot" 
        @saved="onStockSnapshotSaved" 
        @cancel="modalOpen = false" 
      />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import { useRouter } from 'vue-router'
import { useStockSnapshotsStore } from '@/stores/stockSnapshots'
import { useObjectsStore } from '@/stores/objects'
import { useMaterialsStore } from '@/stores/materials'
import { useEmployeesStore } from '@/stores/employees'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { ErrorHandlers } from '@/utils/errorHandler'
import type {StockSnapshot, StockSnapshotFilterParams, SiteObject, Material, Employee, Me} from '@/api/types'
import {formatDate, formatNumber} from '@/utils/formatters'
import {debounce} from '@/utils/debounce'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import Modal from '@/components/Modal.vue'
import StockSnapshotForm from './StockSnapshotForm.vue'
import FilterField from '@/components/FilterField.vue'
import ModernPagination from '@/components/ModernPagination.vue'
import SmartUnitValue from '@/components/SmartUnitValue.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'
import ExportButton from '@/components/ExportButton.vue'

// Router and stores
const router = useRouter()
const stockSnapshotsStore = useStockSnapshotsStore()
const objectsStore = useObjectsStore()
const materialsStore = useMaterialsStore()
const employeesStore = useEmployeesStore()
const auth = useAuthStore()
const ui = useUiStore()

// Computed из stores
const rows = computed(() => stockSnapshotsStore.rows)
const count = computed(() => stockSnapshotsStore.count)
const page = computed(() => stockSnapshotsStore.page)
const pageSize = computed(() => stockSnapshotsStore.pageSize)
const loading = computed(() => stockSnapshotsStore.loading)
const filters = computed(() => stockSnapshotsStore.filters)

// Modal state
const modalOpen = ref(false)
const editingStockSnapshot = ref<StockSnapshot | null>(null)

// Computed properties
const modalTitle = computed(() => {
  return editingStockSnapshot.value ? 'Редактировать движение' : 'Новое движение'
})

// Computed
const canEdit = computed(() => {
  const role = auth.role as Me['role'] | undefined
  return role === 'admin' || role === 'director'
})

// Debounced функция для поиска (удалена, так как теперь используется в handleSearchChange)

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
  stockSnapshotsStore.setFilters({ ordering })
}

// Computed для справочников
const objects = computed(() => objectsStore.items)
const materials = computed(() => materialsStore.items)
const employees = computed(() => employeesStore.items)

// Computed options for filters
const objectOptions = computed(() => [
  { value: undefined, label: 'Все' },
  ...objects.value.map((o: SiteObject) => ({ value: o.id, label: o.name }))
])

const materialOptions = computed(() => [
  { value: undefined, label: 'Все' },
  ...materials.value.map((m: Material) => ({ value: m.id, label: m.name }))
])

const employeeOptions = computed(() => [
  { value: undefined, label: 'Все' },
  ...employees.value.map((e: Employee) => ({ 
    value: e.id, 
    label: `${e.first_name || e.username} ${e.last_name || ''}`.trim()
  }))
])

const sourceTypeOptions = computed(() => [
  { value: undefined, label: 'Все' },
  { value: 'purchase_item', label: 'Закупка' },
  { value: 'writeoff', label: 'Списание' }
])

const stageOptions = computed(() => [
  { value: undefined, label: 'Все' },
  { value: 'acceptance', label: 'Приемка' },
  { value: 'request', label: 'Заявка' },
  { value: 'delivery_fixed', label: 'Доставка' },
  { value: 'post_rough', label: 'После черновых' },
  { value: 'handover', label: 'Сдача' }
])

const oMap = computed(() => new Map(objects.value.map((o: SiteObject) => [o.id, o.name])))
const mMap = computed(() => new Map(materials.value.map((m: Material) => [m.id, m.name])))
const eMap = computed(() => new Map(employees.value.map((e: Employee) => [e.id, `${e.first_name || e.username}${e.last_name ? ' ' + e.last_name : ''}`])))

function objectName(id?: number) {
  return id ? oMap.value.get(id) : undefined
}

function materialName(id?: number) {
  return id ? mMap.value.get(id) : undefined
}

function responsibleName(id: number | null | undefined) {
  return id ? eMap.value.get(id) : undefined
}

function getStageDisplayName(stage: string) {
  const stageNames: Record<string, string> = {
    'acceptance': 'Приемка',
    'request': 'Заявка',
    'delivery_fixed': 'Доставка',
    'post_rough': 'После черновых',
    'handover': 'Сдача'
  }
  return stageNames[stage] || stage
}

function getSourceTypeDisplayName(sourceType: string) {
  const sourceTypeNames: Record<string, string> = {
    'purchase_item': 'Закупка',
    'writeoff': 'Списание'
  }
  return sourceTypeNames[sourceType] || sourceType
}

async function loadRefs() {
  await Promise.all([
    objectsStore.fetchList({ page_size: 1000, ordering: 'name' } as any),
    materialsStore.fetchList({ page_size: 1000, ordering: 'name' } as any),
    employeesStore.fetchList({ page_size: 1000, ordering: 'username' } as any)
  ])
  
  // Отладка: показываем загруженных сотрудников (можно убрать в продакшене)
  // console.log('Loaded employees for stocks:', employees.value.length, employees.value.map((e: Employee) => ({id: e.id, name: `${e.first_name || e.username} ${e.last_name || ''}`.trim()})))
}

function reload(p = page.value) {
  stockSnapshotsStore.setPage(p)
}

function resetFilters() {
  stockSnapshotsStore.resetFilters()
}

function handleSourceTypeChange(value: string | number | boolean | null | undefined | (string | number)[]) {
  // console.log('Stocks List - source_type changed to:', value)
  stockSnapshotsStore.setFilters({ source_type: value as any })
}

function handleSearchChange(value: string | number | boolean | null | undefined | (string | number)[]) {
  // console.log('Stocks List - search changed to:', value)
  debouncedSearch(value as string)
}

// Debounced функция для поиска
const debouncedSearch = debounce((value: string) => {
  stockSnapshotsStore.setFilters({ search: value })
}, 500)

// Watcher для автоматического поиска при изменении фильтров
// Убираем watcher, так как setFilters уже вызывает fetchList

function handlePageChange(newPage: number) {
  stockSnapshotsStore.setPage(newPage)
}

function handlePageSizeChange(newSize: number) {
  stockSnapshotsStore.setPageSize(newSize)
}

function handleCreate() {
  editingStockSnapshot.value = null
  modalOpen.value = true
}

function onStockSnapshotSaved() {
  modalOpen.value = false
  editingStockSnapshot.value = null
  // Reload the list to show the updated stock snapshot
  stockSnapshotsStore.fetchList()
}

async function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    const data = rows.value
    const filename = `stocks_${new Date().toISOString().split('T')[0]}`

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

    ui.toast({ type: 'success', text: `Экспорт в ${format.toUpperCase()} выполнен` })
  } catch (error) {
    ErrorHandlers.dataLoading(error)
  }
}

function exportToCSV(data: StockSnapshot[], filename: string) {
  const headers = ['ID', 'Дата', 'Объект', 'Материал', 'Количество', 'Тип', 'Этап', 'Источник', 'Ответственный']
  const rows = data.map(item => [
    item.id,
    formatDate(item.date),
    objectName(item.object) || item.object,
    materialName(item.material) || item.material,
    item.quantity_signed,
    parseFloat(item.quantity_signed) >= 0 ? 'Приход' : 'Расход',
    getStageDisplayName(item.stage),
    item.source_description || `${getSourceTypeDisplayName(item.source_type)} #${item.source_id}`,
    responsibleName(item.responsible) || '—'
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')

  downloadFile(csvContent, `${filename}.csv`, 'text/csv')
}

function exportToExcel(data: StockSnapshot[], filename: string) {
  // For now, export as CSV with .xlsx extension
  // In a real app, you'd use a library like xlsx
  exportToCSV(data, filename.replace('.xlsx', ''))
  ui.toast({ type: 'info', text: 'Excel экспорт временно недоступен. Скачан CSV файл.' })
}

function exportToPDF(data: StockSnapshot[], filename: string) {
  // For now, show info message
  ui.toast({ type: 'info', text: 'PDF экспорт временно недоступен' })
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  try {
    await loadRefs()
    await stockSnapshotsStore.fetchList()
  } catch (error) {
    ErrorHandlers.dataLoading(error)
  }
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>

