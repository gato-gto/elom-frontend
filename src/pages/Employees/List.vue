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
              v-model="employeesStore.filters.first_name"
              type="text"
              class="input input-bordered"
              placeholder="Имя сотрудника"
              @keyup.enter="handleSearch"
            />
          </fieldset>
          
          <!-- Ordering -->
          <fieldset class="fieldset">
            <span class="label-text">Сортировка</span>
            <select 
              v-model="employeesStore.filters.ordering"
              class="select select-bordered"
              @change="handleSearch"
            >
              <option value="first_name">Имя ↑</option>
              <option value="-first_name">Имя ↓</option>
              <option value="last_name">Фамилия ↑</option>
              <option value="-last_name">Фамилия ↓</option>
              <option value="email">Email ↑</option>
              <option value="-email">Email ↓</option>
              <option value="id">ID ↑</option>
              <option value="-id">ID ↓</option>
            </select>
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
    <Table
      :columns="columns"
      :data="employeesStore.items"
      :loading="employeesStore.loading"
      :actions="actions"
      empty-text="Нет сотрудников"
      @action="handleAction"
    >
      <template #cell-role="{ value }">
        <div class="badge" :class="getRoleBadgeClass(value)">
          {{ getRoleDisplayName(value) }}
        </div>
      </template>
    </Table>

    <!-- Pagination -->
    <Pagination
      :current="employeesStore.pagination.page"
      :total="employeesStore.pagination.count"
      :page-size="employeesStore.pagination.pageSize"
      @change="handlePageChange"
    />

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
import type { Employee, Me } from '@/api/types'
import Table from '@/components/Table.vue'
import Pagination from '@/components/Pagination.vue'
import Modal from '@/components/Modal.vue'
import EmployeeForm from './EmployeeForm.vue'

const employeesStore = useEmployeesStore()
const auth = useAuthStore()
const ui = useUiStore()

const canEdit = computed(() => {
  const role = auth.role as Me['role'] | undefined
  return role === 'admin' || role === 'director'
})

const modalOpen = ref(false)
const current = ref<Employee | null>(null)

const modalTitle = computed(() => {
  return current.value ? 'Редактировать сотрудника' : 'Добавить сотрудника'
})

const columns = [
  {
    key: 'id',
    title: 'ID',
    sortable: true,
    class: 'w-20'
  },
  {
    key: 'first_name',
    title: 'Имя',
    sortable: true,
    class: 'min-w-32'
  },
  {
    key: 'last_name',
    title: 'Фамилия',
    sortable: true,
    class: 'min-w-32'
  },
  {
    key: 'email',
    title: 'Email',
    sortable: true,
    class: 'min-w-48'
  },
  {
    key: 'role',
    title: 'Роль',
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

onMounted(() => {
  employeesStore.fetchList()
})
</script>