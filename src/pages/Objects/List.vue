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
    <div class="list-content">
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
            <th @click="handleSort('status')" class="cursor-pointer hover:bg-gray-50">
              Статус
              <span v-if="sortBy === 'status'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('responsible_person')" class="cursor-pointer hover:bg-gray-50">
              Ответственный
              <span v-if="sortBy === 'responsible_person'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('start_date')" class="cursor-pointer hover:bg-gray-50">
              Дата начала
              <span v-if="sortBy === 'start_date'" class="ml-1">
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
        <tbody>
          <tr v-for="object in objectsStore.items" :key="object.id">
            <td>{{ object.id }}</td>
            <td>{{ object.name }}</td>
            <td>
              <div v-if="object.status" class="badge" :class="getStatusClass(object.status)">
                {{ getStatusText(object.status) }}
              </div>
              <span v-else class="text-gray-400">—</span>
            </td>
            <td>
              <span v-if="object.responsible_person">{{ object.responsible_person }}</span>
              <span v-else class="text-gray-400">—</span>
            </td>
            <td>
              <span v-if="object.start_date">{{ formatDate(object.start_date) }}</span>
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
            <td colspan="7" class="text-center text-gray-500">Нет данных</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="modern-pagination">
      <button class="pagination-btn" :disabled="objectsStore.pagination.page <= 1" @click="handlePageChange(1)">«</button>
      <button class="pagination-btn" :disabled="objectsStore.pagination.page <= 1" @click="handlePageChange(objectsStore.pagination.page - 1)">Назад</button>
      <span class="pagination-info">Стр. {{ objectsStore.pagination.page }}</span>
      <button class="pagination-btn" :disabled="objectsStore.pagination.page * objectsStore.pagination.pageSize >= objectsStore.pagination.count" @click="handlePageChange(objectsStore.pagination.page + 1)">Вперёд</button>
    </div>

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
import type { Object, Me, ObjectStatus } from '@/api/types'
import { formatDate } from '@/utils/formatters'
import Modal from '@/components/Modal.vue'
import ObjectForm from './ObjectForm.vue'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'

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
function getStatusClass(status: ObjectStatus): string {
  const classes = {
    planning: 'badge-info',
    active: 'badge-success',
    completed: 'badge-primary',
    on_hold: 'badge-warning',
    cancelled: 'badge-error'
  }
  return classes[status] || 'badge-ghost'
}

function getStatusText(status: ObjectStatus): string {
  const texts = {
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
    ui.toast({ type: 'error', text: 'Ошибка поиска объектов' })
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
    ui.toast({ type: 'error', text: 'Ошибка удаления объекта' })
    console.error('Error deleting object:', error)
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