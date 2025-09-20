<template>
  <div class="list-container">
    <!-- Header -->
    <ListHeader
      title="Списания"
      subtitle="Управление списаниями материалов"
      icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      :show-create="true"
      :show-stats="true"
      :total-count="count"
      :filtered-count="rows.length"
      @create="handleCreate"
    />

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
        v-model="filters.material"
        type="select"
        label="Материал"
        :options="materialOptions"
      />
      
      <FilterField
        v-model="filters.stage"
        type="select"
        label="Этап"
        :options="stageOptions"
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
        text="Загрузка списаний..."
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
          <th>Этап</th>
          <th class="text-right">Остаток</th>
          <th>Ответственный</th>
          <th class="text-right">Действия</th>
        </tr>
        </thead>
        
        <!-- Skeleton Loading -->
        <TableSkeleton 
          v-if="loading && rows.length === 0"
          :rows="pageSize"
          :columns="9"
        />
        
        <!-- Actual Data -->
        <tbody v-else>
        <tr v-for="w in rows" :key="w.id" class="table-row">
          <td>{{ w.id }}</td>
          <td>{{ formatDate(w.date) }}</td>
          <td>{{ objectName(w.object) ?? w.object }}</td>
          <td>{{ materialName(w.material) ?? w.material }}</td>
          <td class="text-right">
            <SmartUnitValue 
              v-if="w.smart_quantity" 
              :smart-quantity="w.smart_quantity" 
              :show-original="true"
              class-name="font-mono text-sm text-red-600"
            />
            <span v-else class="font-mono text-sm text-red-600">
              {{ w.quantity }} {{ w.unit_code }}
            </span>
          </td>
          <td>
            <span class="badge badge-outline badge-xs">
              {{ getStageDisplayName(w.stage) }}
            </span>
          </td>
          <td class="text-right">
            <span class="font-mono text-sm text-gray-600">
              {{ w.current_balance }} {{ w.unit_code }}
            </span>
          </td>
          <td>{{ responsibleName(w.responsible) ?? '—' }}</td>
          <td class="text-right">
            <div class="flex gap-1 justify-end">
              <span v-if="w.validation_warnings.length > 0" class="badge badge-warning badge-xs">
                {{ w.validation_warnings.length }} предупреждений
              </span>
              <button class="btn btn-xs btn-outline" @click="openEditModal(w)">
                Редактировать
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!loading && rows.length === 0">
            <td colspan="9" class="text-center text-gray-500 py-8">
              <div class="flex flex-col items-center gap-2">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-sm">Нет списаний</span>
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

    <!-- Modal for creating/editing write-off -->
    <Modal v-model="modalOpen" :title="modalTitle" size="4xl" :closable="true">
      <WriteOffForm 
        :initial="editingWriteOff" 
        @saved="onWriteOffSaved" 
        @cancel="modalOpen = false" 
      />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import { useRouter } from 'vue-router'
import { useWriteOffsStore } from '@/stores/writeOffs'
import { useObjectsStore } from '@/stores/objects'
import { useMaterialsStore } from '@/stores/materials'
import { useEmployeesStore } from '@/stores/employees'
import type {WriteOff, WriteOffFilterParams, SiteObject, Material, Employee} from '@/api/types'
import {formatDate} from '@/utils/formatters'
import {debounce} from '@/utils/debounce'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import Modal from '@/components/Modal.vue'
import WriteOffForm from './WriteOffForm.vue'
import FilterField from '@/components/FilterField.vue'
import ModernPagination from '@/components/ModernPagination.vue'
import SmartUnitValue from '@/components/SmartUnitValue.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'

const router = useRouter()

// Stores
const writeOffsStore = useWriteOffsStore()
const objectsStore = useObjectsStore()
const materialsStore = useMaterialsStore()
const employeesStore = useEmployeesStore()

// Computed из stores
const rows = computed(() => writeOffsStore.rows)
const count = computed(() => writeOffsStore.count)
const page = computed(() => writeOffsStore.page)
const pageSize = computed(() => writeOffsStore.pageSize)
const loading = computed(() => writeOffsStore.loading)
const filters = computed(() => writeOffsStore.filters)

// Modal state
const modalOpen = ref(false)
const editingWriteOff = ref<WriteOff | null>(null)

// Computed properties
const modalTitle = computed(() => {
  return editingWriteOff.value ? 'Редактировать списание' : 'Новое списание'
})

// Debounced функция для поиска
const debouncedSearch = debounce(() => {
  writeOffsStore.fetchList()
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
  writeOffsStore.setFilters({ ordering })
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

async function loadRefs() {
  await Promise.all([
    objectsStore.fetchList({ page_size: 1000, ordering: 'name' } as any),
    materialsStore.fetchList({ page_size: 1000, ordering: 'name' } as any),
    employeesStore.fetchList({ page_size: 1000, ordering: 'username' } as any)
  ])
}

function reload(p = page.value) {
  writeOffsStore.setPage(p)
}

function resetFilters() {
  writeOffsStore.resetFilters()
}

function handleCreate() {
  editingWriteOff.value = null
  modalOpen.value = true
}

function openEditModal(writeOff: WriteOff) {
  editingWriteOff.value = writeOff
  modalOpen.value = true
}

function onWriteOffSaved() {
  modalOpen.value = false
  editingWriteOff.value = null
  // Reload the list to show the updated write-off
  writeOffsStore.fetchList()
}

// Watcher для автоматического поиска при изменении фильтров
watch(
  () => filters.value,
  () => {
    debouncedSearch()
  },
  { deep: true }
)

function handlePageChange(newPage: number) {
  writeOffsStore.setPage(newPage)
}

function handlePageSizeChange(newSize: number) {
  writeOffsStore.setPageSize(newSize)
}

onMounted(async () => {
  await loadRefs()
  await writeOffsStore.fetchList()
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>
