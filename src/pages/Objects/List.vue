<template>
  <div class="list-container">
    <!-- Header -->
    <ListHeader
      title="Объекты"
      subtitle="Управление строительными объектами и их характеристиками"
      icon="M3 21h18v-2H3v2zM5 10h14V8H5v2zm0-4h14V4H5v2z"
      :show-create="canEdit"
      create-text="Добавить объект"
      :can-create="canEdit"
      :loading="objectsStore.loading"
      :show-stats="true"
      :total-count="objectsStore.pagination.count"
      :filtered-count="objectsStore.items.length"
      @create="openCreate"
    />

    <!-- Filters -->
    <FilterPanel
      :columns="4"
      :loading="objectsStore.loading"
      @reset="handleReset"
    >
      <FilterField
        v-model="objectsStore.filters.name"
        type="text"
        label="Название"
        placeholder="Название объекта"
      />
      
      <FilterField
        v-model="objectsStore.filters.is_active"
        type="select"
        label="Статус"
        :options="statusOptions"
      />
      
    </FilterPanel>

    <!-- Table -->
    <div class="list-content" :class="{ 'relative': objectsStore.loading }">
      <!-- Loading Overlay -->
      <LoadingSpinner 
        v-if="objectsStore.loading && objectsStore.items.length === 0"
        size="lg"
        variant="primary"
        text="Загрузка объектов..."
        :overlay="false"
      />
      
      <!-- Loading Skeleton for existing data -->
      <div v-if="objectsStore.loading && objectsStore.items.length > 0" class="loading-overlay">
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
            <th @click="handleSort('name')" class="cursor-pointer hover:bg-gray-50">
              Название
              <span v-if="sortBy === 'name'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th>Адрес</th>
            <th @click="handleSort('date_start')" class="cursor-pointer hover:bg-gray-50">
              Дата начала
              <span v-if="sortBy === 'date_start'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('date_end')" class="cursor-pointer hover:bg-gray-50">
              Дата окончания
              <span v-if="sortBy === 'date_end'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('is_active')" class="cursor-pointer hover:bg-gray-50">
              Активность
              <span v-if="sortBy === 'is_active'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th class="text-right">Действия</th>
          </tr>
        </thead>
        
        <!-- Skeleton Loading -->
        <TableSkeleton 
          v-if="objectsStore.loading && objectsStore.items.length === 0"
          :rows="objectsStore.pagination.pageSize"
          :columns="7"
        />
        
        <!-- Actual Data -->
        <tbody v-else>
          <tr v-for="object in objectsStore.items" :key="object.id" class="table-row">
            <td>{{ object.id }}</td>
            <td>{{ object.name }}</td>
            <td>
              <span v-if="object.address">{{ object.address }}</span>
              <span v-else class="text-gray-400">—</span>
            </td>
            <td>
              <span v-if="object.date_start">{{ formatDate(object.date_start) }}</span>
              <span v-else class="text-gray-400">—</span>
            </td>
            <td>
              <span v-if="object.date_end">{{ formatDate(object.date_end) }}</span>
              <span v-else class="text-gray-400">—</span>
            </td>
            <td>
              <div class="badge" :class="object.is_active ? 'badge-success' : 'badge-error'">
                {{ object.is_active ? 'Активный' : 'Неактивный' }}
              </div>
            </td>
            <td class="text-right">
              <div class="flex gap-1 justify-end">
                <button 
                  v-if="canEdit" 
                  class="btn btn-xs btn-outline" 
                  @click="handleAction('edit', object)"
                >
                  Редактировать
                </button>
                <button 
                  v-if="canEdit" 
                  class="btn btn-xs btn-error" 
                  @click="handleAction('delete', object)"
                >
                  Удалить
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!objectsStore.loading && objectsStore.items.length === 0">
            <td colspan="7" class="text-center text-gray-500 py-8">
              <div class="flex flex-col items-center gap-2 empty-state">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span class="text-sm">Нет объектов</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <ModernPagination
      :current-page="objectsStore.pagination.page"
      :total-pages="Math.ceil(objectsStore.pagination.count / objectsStore.pagination.pageSize)"
      :total-items="objectsStore.pagination.count"
      :page-size="objectsStore.pagination.pageSize"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    />

    <!-- Modal -->
    <Modal v-model="modalOpen" :title="modalTitle" size="lg" :closable="true">
      <ObjectForm :initial="current" @saved="onSaved" @cancel="modalOpen=false"/>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { debounce } from '@/utils/debounce'
import { useObjectsStore } from '@/stores/objects'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { ErrorHandlers } from '@/utils/errorHandler'
import type { Object, Me } from '@/api/types'
import { formatDate } from '@/utils/formatters'
import Modal from '@/components/Modal.vue'
import ObjectForm from './ObjectForm.vue'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'
import ModernPagination from '@/components/ModernPagination.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'

const objectsStore = useObjectsStore()
const auth = useAuthStore()
const ui = useUiStore()

// Автоматические фильтры
const isSearching = ref(false)

const canEdit = computed(() => {
  const role = auth.role as Me['role'] | undefined
  return role === 'admin' || role === 'director'
})

const modalOpen = ref(false)
const current = ref<Object | null>(null)

const modalTitle = computed(() => {
  return current.value ? 'Редактировать объект' : 'Добавить объект'
})

// Computed options for filters
const statusOptions = computed(() => [
  { value: '', label: 'Все' },
  { value: 'true', label: 'Активные' },
  { value: 'false', label: 'Неактивные' }
])


// Функции для форматирования статусов
function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    planning: 'badge-info',
    active: 'badge-success',
    completed: 'badge-primary',
    on_hold: 'badge-warning',
    cancelled: 'badge-error'
  }
  return classes[status] || 'badge-ghost'
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    planning: 'Планирование',
    active: 'Активный',
    completed: 'Завершен',
    on_hold: 'Приостановлен',
    cancelled: 'Отменен'
  }
  return texts[status] || status
}

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
  objectsStore.setFilters({ ordering })
}

function openCreate() {
  current.value = null
  modalOpen.value = true
}

function openEdit(object: Object) {
  current.value = object
  modalOpen.value = true
}

// Debounced функция для автоматического поиска
const debouncedSearch = debounce(async () => {
  isSearching.value = true
  try {
    await objectsStore.fetchList()
  } catch (error) {
    ErrorHandlers.dataLoading(error)
  } finally {
    isSearching.value = false
  }
}, 500)

// Watcher для автоматического поиска при изменении фильтров
watch(
  () => objectsStore.filters,
  () => {
    objectsStore.pagination.page = 1
    debouncedSearch()
  },
  { deep: true }
)

async function handleReset() {
  objectsStore.resetFilters()
}

async function handlePageChange(page: number) {
  await objectsStore.setPage(page)
}

async function handlePageSizeChange(size: number) {
  objectsStore.setPageSize(size)
}

async function handleAction(action: string, object: Object) {
  switch (action) {
    case 'edit':
      openEdit(object)
      break
    case 'delete':
      await handleDelete(object)
      break
  }
}

async function handleDelete(object: Object) {
  if (!confirm(`Удалить объект "${object.name}"?`)) return
  
  try {
    await objectsStore.delete(object.id)
    ui.toast({ type: 'success', text: `Объект "${object.name}" удален` })
  } catch (error) {
    ErrorHandlers.delete(error)
  }
}

async function onSaved() {
  modalOpen.value = false
  ui.toast({ type: 'success', text: 'Объект сохранен' })
  await objectsStore.fetchList()
}

onMounted(() => {
  objectsStore.fetchList()
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>