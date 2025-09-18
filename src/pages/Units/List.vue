<template>
  <div class="grid gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">Единицы измерения</h1>
      <button 
        class="btn btn-primary" 
        @click="openCreate" 
        v-if="canEdit"
        :disabled="unitsStore.loading"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Добавить единицу
      </button>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Фильтры и поиск</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <fieldset class="fieldset">
            <span class="label-text">Поиск</span>
            <input 
              v-model="unitsStore.filters.search"
              type="text"
              class="input input-bordered"
              placeholder="Название, код"
              @keyup.enter="handleSearch"
            />
          </fieldset>
          
          <!-- Code Filter -->
          <fieldset class="fieldset">
            <span class="label-text">Код</span>
            <input 
              v-model="unitsStore.filters.code"
              type="text"
              class="input input-bordered"
              placeholder="Код единицы"
              @keyup.enter="handleSearch"
            />
          </fieldset>
          
          <!-- Name Filter -->
          <fieldset class="fieldset">
            <span class="label-text">Название</span>
        <input 
              v-model="unitsStore.filters.name"
              type="text"
              class="input input-bordered"
              placeholder="Название единицы"
              @keyup.enter="handleSearch"
            />
          </fieldset>
          
        </div>
        
        <div class="flex gap-2 mt-4">
          <button class="btn btn-primary" @click="handleSearch" :disabled="unitsStore.loading">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        Применить
      </button>
          <button class="btn btn-outline" @click="handleReset" :disabled="unitsStore.loading">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Сбросить
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
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
            <th @click="handleSort('code')" class="cursor-pointer hover:bg-gray-50">
              Код
              <span v-if="sortBy === 'code'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th class="text-right">Действия</th>
        </tr>
        </thead>
        <tbody>
          <tr v-for="unit in unitsStore.items" :key="unit.id">
            <td>{{ unit.id }}</td>
            <td>{{ unit.name }}</td>
          <td>
              <div class="text-sm text-gray-600 font-mono">{{ unit.code }}</div>
          </td>
            <td class="text-right">
              <div class="flex gap-1 justify-end">
                <button 
                  v-if="canEdit" 
                  class="btn btn-xs btn-outline" 
                  @click="handleAction('edit', unit)"
                >
                  Редактировать
              </button>
              <button 
                  v-if="canEdit" 
                class="btn btn-xs btn-error" 
                  @click="handleAction('delete', unit)"
              >
                  Удалить
              </button>
            </div>
          </td>
        </tr>
          <tr v-if="!unitsStore.loading && unitsStore.items.length === 0">
            <td colspan="4" class="text-center text-gray-500">Нет данных</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="modern-pagination">
      <button class="pagination-btn" :disabled="unitsStore.pagination.page <= 1" @click="handlePageChange(1)">«</button>
      <button class="pagination-btn" :disabled="unitsStore.pagination.page <= 1" @click="handlePageChange(unitsStore.pagination.page - 1)">Назад</button>
      <span class="pagination-info">Стр. {{ unitsStore.pagination.page }}</span>
      <button class="pagination-btn" :disabled="unitsStore.pagination.page * unitsStore.pagination.pageSize >= unitsStore.pagination.count" @click="handlePageChange(unitsStore.pagination.page + 1)">Вперёд</button>
    </div>

    <!-- Modal -->
    <Modal v-model="modalOpen" :title="modalTitle" size="lg" :closable="true">
      <UnitForm :initial="current" @saved="onSaved" @cancel="modalOpen=false"/>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useUnitsStore } from '@/stores/units'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { Unit, Me } from '@/api/types'
import { debounce } from '@/utils/debounce'
import Modal from '@/components/Modal.vue'
import UnitForm from './UnitForm.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'

const unitsStore = useUnitsStore()
const auth = useAuthStore()
const ui = useUiStore()

const canEdit = computed(() => {
  const role = auth.role as Me['role'] | undefined
  return role === 'admin' || role === 'director'
})

const modalOpen = ref(false)
const current = ref<Unit | null>(null)

// Автоматические фильтры
const isSearching = ref(false)

// Debounced функция для поиска
const debouncedSearch = debounce(() => {
  unitsStore.fetchList()
}, 500)

const modalTitle = computed(() => {
  return current.value ? 'Редактировать единицу измерения' : 'Добавить единицу измерения'
})

const columns = [
  {
    key: 'id',
    title: 'ID',
    sortable: true,
    class: 'w-20'
  },
  {
    key: 'name',
    title: 'Название',
    sortable: true,
    class: 'min-w-48'
  },
  {
    key: 'code',
    title: 'Код',
    sortable: true,
    class: 'w-32'
  }
]

const actions = computed(() => {
  if (!canEdit.value) return []
  
  return [
    {
      key: 'edit',
      label: 'Изменить',
      icon: 'svg',
      class: 'btn-outline btn-xs'
    },
    {
      key: 'delete',
      label: 'Удалить',
      icon: 'svg',
      class: 'btn-error btn-xs'
    }
  ]
})

function openCreate() {
  current.value = null
  modalOpen.value = true
}

function openEdit(unit: Unit) {
  current.value = unit
  modalOpen.value = true
}

async function handleSearch() {
  await unitsStore.fetchList()
}

async function handleReset() {
  unitsStore.resetFilters()
  await unitsStore.fetchList()
}

async function handlePageChange(page: number) {
  await unitsStore.setPage(page)
}

async function handleAction(action: string, unit: Unit) {
  switch (action) {
    case 'edit':
      openEdit(unit)
      break
    case 'delete':
      await handleDelete(unit)
      break
  }
}

async function handleDelete(unit: Unit) {
  if (!confirm(`Удалить единицу измерения "${unit.name}"?`)) return
  
  try {
    await unitsStore.delete(unit.id)
    ui.toast({ type: 'success', text: `Единица измерения "${unit.name}" удалена` })
  } catch (error) {
    ui.toast({ type: 'error', text: 'Ошибка удаления единицы измерения' })
    console.error('Error deleting unit:', error)
  }
}

async function onSaved() {
  modalOpen.value = false
  ui.toast({ type: 'success', text: 'Единица измерения сохранена' })
  await unitsStore.fetchList()
}

// Watcher для автоматического поиска при изменении фильтров
watch(
  () => unitsStore.filters,
  () => {
    unitsStore.pagination.page = 1
    debouncedSearch()
  },
  { deep: true }
)

onMounted(() => {
  unitsStore.fetchList()
})
</script>