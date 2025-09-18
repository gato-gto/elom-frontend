<template>
  <div class="grid gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">Сотрудники</h1>
      <button 
        class="btn btn-primary" 
        @click="openCreate" 
        v-if="canEdit"
        :disabled="employeesStore.loading"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Добавить сотрудника
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
              v-model="employeesStore.filters.search"
              type="text"
              class="input input-bordered"
              placeholder="Имя, email, роль"
              @keyup.enter="handleSearch"
            />
          </fieldset>
          
          <!-- Role Filter -->
          <fieldset class="fieldset">
            <span class="label-text">Роль</span>
            <select 
              v-model="employeesStore.filters.role"
              class="select select-bordered"
              @change="handleSearch"
            >
              <option value="">Все роли</option>
              <option value="admin">Администратор</option>
              <option value="director">Директор</option>
              <option value="coordinator">Координатор</option>
              <option value="site_manager">Бригадир</option>
              <option value="buyer">Закупщик</option>
            </select>
          </fieldset>
          
          <!-- First Name Filter -->
          <fieldset class="fieldset">
            <span class="label-text">Имя</span>
            <input 
              v-model="employeesStore.filters.search"
              type="text"
              class="input input-bordered"
              placeholder="Имя сотрудника"
              @keyup.enter="handleSearch"
            />
          </fieldset>
          
        </div>
        
        <div class="flex gap-2 mt-4">
          <button class="btn btn-primary" @click="handleSearch" :disabled="employeesStore.loading">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            Применить
          </button>
          <button class="btn btn-outline" @click="handleReset" :disabled="employeesStore.loading">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Сбросить
          </button>
        </div>
      </div>
    </div>

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
            <th @click="handleSort('username')" class="cursor-pointer hover:bg-gray-50">
              Логин
              <span v-if="sortBy === 'username'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('first_name')" class="cursor-pointer hover:bg-gray-50">
              Имя
              <span v-if="sortBy === 'first_name'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('last_name')" class="cursor-pointer hover:bg-gray-50">
              Фамилия
              <span v-if="sortBy === 'last_name'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('email')" class="cursor-pointer hover:bg-gray-50">
              Email
              <span v-if="sortBy === 'email'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('role')" class="cursor-pointer hover:bg-gray-50">
              Роль
              <span v-if="sortBy === 'role'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('is_active')" class="cursor-pointer hover:bg-gray-50">
              Статус
              <span v-if="sortBy === 'is_active'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th class="text-right">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="employee in employeesStore.items" :key="employee.id">
            <td>{{ employee.id }}</td>
            <td>{{ employee.username }}</td>
            <td>{{ employee.first_name || '—' }}</td>
            <td>{{ employee.last_name || '—' }}</td>
            <td>{{ employee.email || '—' }}</td>
            <td>
              <div class="badge" :class="getRoleBadgeClass(employee.role)">
                {{ getRoleDisplayName(employee.role) }}
              </div>
            </td>
            <td>
              <div class="badge" :class="employee.is_active ? 'badge-success' : 'badge-error'">
                {{ employee.is_active ? 'Активный' : 'Неактивный' }}
              </div>
            </td>
            <td class="text-right">
              <div class="flex gap-1 justify-end">
                <button 
                  v-if="canEdit" 
                  class="btn btn-xs btn-outline" 
                  @click="handleAction('edit', employee)"
                >
                  Редактировать
                </button>
                <button 
                  v-if="canEdit" 
                  class="btn btn-xs btn-error" 
                  @click="handleAction('delete', employee)"
                >
                  Удалить
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!employeesStore.loading && employeesStore.items.length === 0">
            <td colspan="8" class="text-center text-gray-500">Нет данных</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="modern-pagination">
      <button class="pagination-btn" :disabled="employeesStore.pagination.page <= 1" @click="handlePageChange(1)">«</button>
      <button class="pagination-btn" :disabled="employeesStore.pagination.page <= 1" @click="handlePageChange(employeesStore.pagination.page - 1)">Назад</button>
      <span class="pagination-info">Стр. {{ employeesStore.pagination.page }}</span>
      <button class="pagination-btn" :disabled="employeesStore.pagination.page * employeesStore.pagination.pageSize >= employeesStore.pagination.count" @click="handlePageChange(employeesStore.pagination.page + 1)">Вперёд</button>
    </div>

    <!-- Modal -->
    <Modal v-model="modalOpen" :title="modalTitle" size="lg" :closable="true">
      <EmployeeForm :initial="current" @saved="onSaved" @cancel="modalOpen=false"/>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useEmployeesStore } from '@/stores/employees'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { Employee, Me } from '@/api/types'
import { debounce } from '@/utils/debounce'
import Modal from '@/components/Modal.vue'
import EmployeeForm from './EmployeeForm.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'

const employeesStore = useEmployeesStore()
const auth = useAuthStore()
const ui = useUiStore()

const canEdit = computed(() => {
  const role = auth.role as Me['role'] | undefined
  return role === 'admin' || role === 'director'
})

const modalOpen = ref(false)
const current = ref<Employee | null>(null)

// Автоматические фильтры
const isSearching = ref(false)

// Debounced функция для поиска
const debouncedSearch = debounce(() => {
  employeesStore.fetchList()
}, 500)

const modalTitle = computed(() => {
  return current.value ? 'Редактировать сотрудника' : 'Добавить сотрудника'
})

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
  employeesStore.setFilters({ ordering })
}

// Filter options
const roleFilterOptions = computed(() => [
  { value: '', label: 'Все роли' },
  { value: 'admin', label: 'Администратор' },
  { value: 'director', label: 'Директор' },
  { value: 'coordinator', label: 'Координатор' },
  { value: 'site_manager', label: 'Бригадир' },
  { value: 'buyer', label: 'Закупщик' }
])

const activeFilterOptions = computed(() => [
  { value: '', label: 'Все' },
  { value: true, label: 'Активные' },
  { value: false, label: 'Неактивные' }
])

const objectFilterOptions = computed(() => [
  { value: '', label: 'Все объекты' }
  // TODO: Добавить опции объектов из store
])

function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'admin': return 'Администратор'
    case 'director': return 'Директор'
    case 'coordinator': return 'Координатор'
    case 'site_manager': return 'Бригадир'
    case 'buyer': return 'Закупщик'
    default: return 'Пользователь'
  }
}

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'admin': return 'badge-error'
    case 'director': return 'badge-warning'
    case 'coordinator': return 'badge-info'
    case 'site_manager': return 'badge-success'
    case 'buyer': return 'badge-primary'
    default: return 'badge-neutral'
  }
}

function openCreate() {
  current.value = null
  modalOpen.value = true
}

function openEdit(employee: Employee) {
  current.value = employee
  modalOpen.value = true
}

async function handleSearch() {
  await employeesStore.fetchList()
}

async function handleReset() {
  employeesStore.resetFilters()
  await employeesStore.fetchList()
}

async function handlePageChange(page: number) {
  await employeesStore.setPage(page)
}

async function handleAction(action: string, employee: Employee) {
  switch (action) {
    case 'edit':
      openEdit(employee)
      break
    case 'delete':
      await handleDelete(employee)
      break
  }
}

async function handleDelete(employee: Employee) {
  if (!confirm(`Удалить сотрудника "${employee.first_name} ${employee.last_name}"?`)) return
  
  try {
    await employeesStore.delete(employee.id)
    ui.toast({ type: 'success', text: `Сотрудник "${employee.first_name} ${employee.last_name}" удален` })
  } catch (error) {
    ui.toast({ type: 'error', text: 'Ошибка удаления сотрудника' })
    console.error('Error deleting employee:', error)
  }
}

async function onSaved() {
  modalOpen.value = false
  ui.toast({ type: 'success', text: 'Сотрудник сохранен' })
  await employeesStore.fetchList()
}

// Watcher для автоматического поиска при изменении фильтров
watch(
  () => employeesStore.filters,
  () => {
    employeesStore.pagination.page = 1
    debouncedSearch()
  },
  { deep: true }
)

onMounted(() => {
  employeesStore.fetchList()
})
</script>