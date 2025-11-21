<template>
  <div class="list-container">
    <!-- GenericList Component -->
    <GenericList
      :store="employeesStore"
      :config="listConfig"
      @create="openCreate"
      @action="handleAction"
      @export="handleExport"
    >
      <!-- Custom column for role with badge -->
      <template #column-role="{ item, value }">
        <div class="badge" :class="getRoleBadgeClass(value)">
          {{ getRoleDisplayName(value) }}
        </div>
      </template>

      <!-- Custom column for status with badge -->
      <template #column-is_active="{ item, value }">
        <div class="badge" :class="value ? 'badge-success' : 'badge-error'">
          {{ value ? 'Активный' : 'Неактивный' }}
        </div>
      </template>
    </GenericList>

    <!-- Modal -->
    <Modal v-model="modalOpen" :title="modalTitle" size="lg" :closable="true">
      <EmployeeForm :initial="current" @saved="onSaved" @cancel="modalOpen=false"/>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEmployeesStore } from '@/stores/employees'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { exportToCSV, exportToExcel, exportToPDF } from '@/composables/useExport'
import type { Employee, Me } from '@/api/types'
import type { GenericListConfig } from '@/types/generic'
import Modal from '@/components/Modal.vue'
import EmployeeForm from './EmployeeForm.vue'
import GenericList from '@/components/GenericList.vue'
import EmployeeCard from '@/components/cards/EmployeeCard.vue'

const employeesStore = useEmployeesStore
const auth = useAuthStore()
const ui = useUiStore()

// Error handling
const { handleLoadingError, handleDeleteError } = useErrorHandler()

const canEdit = computed(() => {
  const role = auth.role as Me['role'] | undefined
  return role === 'admin' || role === 'director'
})

const modalOpen = ref(false)
const current = ref<Employee | null>(null)

const modalTitle = computed(() => {
  return current.value ? 'Редактировать сотрудника' : 'Добавить сотрудника'
})

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

// GenericList configuration
const listConfig = computed<GenericListConfig<Employee>>(() => ({
  title: 'Сотрудники',
  subtitle: 'Управление пользователями системы и их ролями',
  icon: 'people',
  showCreate: canEdit.value,
  createText: 'Добавить сотрудника',
  canCreate: canEdit.value,
  showStats: true,
  exportable: true,
  exportFilename: 'employees',
  exportUrl: '/api/v1/users/',
  loadingText: 'Загрузка сотрудников...',
  emptyText: 'Нет сотрудников',
  emptyTitle: 'Нет сотрудников',
  emptySubtitle: 'Создайте первого сотрудника для начала работы',
  filterColumns: 3,
  columns: [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'username', label: 'Логин', sortable: true },
    { key: 'first_name', label: 'Имя', sortable: true },
    { key: 'last_name', label: 'Фамилия', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Роль', sortable: true },
    { key: 'is_active', label: 'Статус', sortable: true }
  ],
  filters: [
    {
      key: 'search',
      type: 'text',
      label: 'Поиск',
      placeholder: 'Имя, email, роль'
    },
    {
      key: 'role',
      type: 'select',
      label: 'Роль',
      options: roleFilterOptions.value
    },
    {
      key: 'is_active',
      type: 'select',
      label: 'Статус',
      options: statusFilterOptions.value
    }
  ],
  actions: [
    {
      key: 'edit',
      label: 'Редактировать',
      class: 'btn-outline',
      disabled: () => !canEdit.value
    },
    {
      key: 'delete',
      label: 'Удалить',
      class: 'btn-error',
      disabled: () => !canEdit.value,
      confirm: (item: Employee) => `Удалить сотрудника "${item.first_name} ${item.last_name}"?`
    }
  ],
  mobileCardComponent: EmployeeCard,
  mobileCardProp: 'employee',
  defaultSort: 'id',
  defaultSortOrder: 'asc'
}))

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

// Methods
function openCreate() {
  current.value = null
  modalOpen.value = true
}

function openEdit(employee: Employee) {
  current.value = employee
  modalOpen.value = true
}

async function onSaved() {
  modalOpen.value = false
  ui.toast({ type: 'success', text: 'Сотрудник сохранен' })
  await employeesStore.fetchList()
}

async function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    const data = employeesStore.items
    const filename = `employees_${new Date().toISOString().split('T')[0]}`

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
    await handleLoadingError(error, 'employees')
  }
}

async function handleAction(action: string, item: Employee) {
  switch (action) {
    case 'edit':
      openEdit(item)
      break
    case 'delete':
      await handleDelete(item)
      break
  }
}

async function handleDelete(employee: Employee) {
  if (!confirm(`Удалить сотрудника "${employee.first_name} ${employee.last_name}"?`)) { return }
  
  try {
    await employeesStore.delete(employee.id)
    ui.toast({ type: 'success', text: `Сотрудник "${employee.first_name} ${employee.last_name}" удален` })
  } catch (error) {
    await handleDeleteError(error, 'employee', employee.id)
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await employeesStore.fetchList()
  } catch (error) {
    await handleLoadingError(error, 'employees')
  }
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>