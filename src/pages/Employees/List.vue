<template>
  <div class="list-container">
    <!-- Header -->
    <ListHeader
      title="Сотрудники"
      subtitle="Управление пользователями системы и их ролями"
      icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
      :show-create="canEdit"
      create-text="Добавить сотрудника"
      :can-create="canEdit"
      :loading="employeesStore.loading"
      :show-stats="true"
      :total-count="employeesStore.pagination.count"
      :filtered-count="employeesStore.items.length"
      @create="openCreate"
    />

    <!-- Filters -->
    <FilterPanel
      :columns="3"
      :loading="employeesStore.loading"
      @reset="handleReset"
    >
      <FilterField
        v-model="employeesStore.filters.search"
        type="text"
        label="Поиск"
        placeholder="Имя, email, роль"
      />
      
      <FilterField
        v-model="employeesStore.filters.role"
        type="select"
        label="Роль"
        :options="roleFilterOptions"
      />
      
      <FilterField
        v-model="employeesStore.filters.is_active"
        type="select"
        label="Статус"
        :options="statusFilterOptions"
      />
    </FilterPanel>

    <!-- Table -->
    <div class="list-content" :class="{ 'relative': employeesStore.loading }">
      <!-- Loading Overlay -->
      <LoadingSpinner 
        v-if="employeesStore.loading && employeesStore.items.length === 0"
        size="lg"
        variant="primary"
        text="Загрузка сотрудников..."
        :overlay="false"
      />
      
      <!-- Loading Skeleton for existing data -->
      <div v-if="employeesStore.loading && employeesStore.items.length > 0" class="loading-overlay">
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
        
        <!-- Skeleton Loading -->
        <TableSkeleton 
          v-if="employeesStore.loading && employeesStore.items.length === 0"
          :rows="employeesStore.pagination.pageSize"
          :columns="8"
        />
        
        <!-- Actual Data -->
        <tbody v-else>
          <tr v-for="employee in employeesStore.items" :key="employee.id" class="table-row">
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
            <td colspan="8" class="text-center text-gray-500 py-8">
              <div class="flex flex-col items-center gap-2">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span class="text-sm">Нет сотрудников</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <ModernPagination
      :current-page="employeesStore.pagination.page"
      :total-pages="Math.ceil(employeesStore.pagination.count / employeesStore.pagination.pageSize)"
      :total-items="employeesStore.pagination.count"
      :page-size="employeesStore.pagination.pageSize"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    />

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
import { ErrorHandlers } from '@/utils/errorHandler'
import type { Employee, Me } from '@/api/types'
import { debounce } from '@/utils/debounce'
import Modal from '@/components/Modal.vue'
import EmployeeForm from './EmployeeForm.vue'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'
import ModernPagination from '@/components/ModernPagination.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'

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

const statusFilterOptions = computed(() => [
  { value: '', label: 'Все статусы' },
  { value: 'true', label: 'Активный' },
  { value: 'false', label: 'Неактивный' }
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

async function handlePageSizeChange(size: number) {
  employeesStore.setPageSize(size)
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
  if (!confirm(`Удалить сотрудника "${employee.first_name} ${employee.last_name}"?`)) { return }
  
  try {
    await employeesStore.delete(employee.id)
    ui.toast({ type: 'success', text: `Сотрудник "${employee.first_name} ${employee.last_name}" удален` })
  } catch (error) {
    ErrorHandlers.delete(error)
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

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>