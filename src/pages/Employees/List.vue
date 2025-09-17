<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">Сотрудники</h1>
      <button class="btn btn-primary" @click="openCreate" v-if="canEdit">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Добавить сотрудника
      </button>
    </div>

    <!-- Фильтры и поиск -->
    <div class="flex gap-2 items-end">
      <label class="grid">
        <span class="text-xs text-gray-700-70">Поиск</span>
        <input 
          v-model.trim="search" 
          class="input input-bordered input-sm" 
          placeholder="имя / email / роль" 
          @keyup.enter="reload(1)"
        />
      </label>
      <label class="grid">
        <span class="text-xs text-gray-700-70">Роль</span>
        <select v-model="roleFilter" class="select select-bordered select-sm">
          <option value="">Все роли</option>
          <option value="admin">Администратор</option>
          <option value="director">Директор</option>
          <option value="manager">Менеджер</option>
          <option value="employee">Сотрудник</option>
        </select>
      </label>
      <label class="grid">
        <span class="text-xs text-gray-700-70">Сортировка</span>
        <select v-model="ordering" class="select select-bordered select-sm">
          <option value="first_name">имя ↑</option>
          <option value="-first_name">имя ↓</option>
          <option value="last_name">фамилия ↑</option>
          <option value="-last_name">фамилия ↓</option>
          <option value="email">email ↑</option>
          <option value="-email">email ↓</option>
          <option value="id">id ↑</option>
          <option value="-id">id ↓</option>
        </select>
      </label>
      <button class="btn btn-outline btn-sm" @click="reload(1)">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        Применить
      </button>
    </div>

    <!-- Таблица -->
    <div class="overflow-auto border border-gray-200 rounded-xl">
      <table class="table table-zebra w-full">
        <thead>
        <tr>
          <th class="text-left">ID</th>
          <th class="text-left">Имя</th>
          <th class="text-left">Email</th>
          <th class="text-left">Роль</th>
          <th v-if="canEdit" class="text-right">Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="e in rows" :key="e.id">
          <td>{{ e.id }}</td>
          <td>
            <div class="font-medium">{{ e.first_name }} {{ e.last_name }}</div>
          </td>
          <td>
            <div class="text-sm text-gray-700-70">{{ e.email }}</div>
          </td>
          <td>
            <span class="badge" :class="getRoleBadgeClass(e.role)">
              {{ getRoleLabel(e.role) }}
            </span>
          </td>
          <td v-if="canEdit" class="text-right">
            <div class="inline-flex gap-2">
              <button class="btn btn-xs btn-outline" @click="openEdit(e)">
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                Изм.
              </button>
              <button 
                class="btn btn-xs btn-error" 
                @click="remove(e)" 
                :disabled="deletingId===e.id"
              >
                <svg v-if="deletingId !== e.id" class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                {{ deletingId === e.id ? '...' : 'Удал.' }}
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!loading && rows.length===0">
          <td :colspan="canEdit ? 5 : 4" class="text-center text-gray-700-60 py-8">
            <div class="flex flex-col items-center gap-2">
              <svg class="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
              Нет сотрудников
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Пагинация -->
    <div class="flex items-center justify-between">
      <div class="text-sm opacity-70">Всего: {{ count }}</div>
      <div class="flex items-center gap-2">
        <button class="btn btn-sm join-item" :disabled="page<=1" @click="reload(1)">«</button>
        <button class="btn btn-sm join-item" :disabled="page<=1" @click="reload(page-1)">Назад</button>
        <span class="text-sm">Стр. {{ page }}</span>
        <button class="btn btn-sm join-item" :disabled="page*pageSize>=count" @click="reload(page+1)">Вперёд</button>
      </div>
    </div>

    <Modal v-model="modalOpen" :title="''" size="lg" :closable="true">
      <EmployeeForm :initial="current" @saved="onSaved" @cancel="modalOpen=false"/>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {PageResponse, Employee, Me} from '@/api/types'
import EmployeeForm from './EmployeeForm.vue'
import Modal from '@/components/Modal.vue'
import {useAuthStore} from '@/stores/auth'
import {useUiStore} from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()

const canEdit = computed(() => {
  const role = auth.role as Me['role'] | undefined
  return role === 'admin' || role === 'director'
})

const rows = ref<Employee[]>([])
const count = ref(0)
const page = ref(1)
const pageSize = 20
const search = ref('')
const roleFilter = ref('')
const ordering = ref<'first_name' | '-first_name' | 'last_name' | '-last_name' | 'email' | '-email' | 'id' | '-id'>('first_name')
const loading = ref(false)

const modalOpen = ref(false)
const current = ref<Employee | null>(null)
const deletingId = ref<number | null>(null)

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Администратор',
    director: 'Директор',
    manager: 'Менеджер',
    employee: 'Сотрудник'
  }
  return labels[role] || role
}

function getRoleBadgeClass(role: string): string {
  const classes: Record<string, string> = {
    admin: 'badge-error',
    director: 'badge-warning',
    manager: 'badge-info',
    employee: 'badge-success'
  }
  return classes[role] || 'badge-ghost'
}

function openCreate() {
  current.value = null;
  modalOpen.value = true
}

function openEdit(e: Employee) {
  current.value = e;
  modalOpen.value = true
}

async function fetchList(url?: string) {
  loading.value = true
  try {
    const query: Record<string, any> = {
      page: page.value,
      page_size: pageSize,
      ordering: ordering.value,
    }
    
    if (search.value) query.search = search.value
    if (roleFilter.value) query.role = roleFilter.value
    
    const q = buildQuery(query)
    const {data} = await api.get<PageResponse<Employee>>(url ?? (endpoints.employees.list + q))
    rows.value = data.results
    count.value = data.count
  } catch (e: any) {
    ui.toast({type: 'error', text: 'Ошибка загрузки сотрудников'})
    console.error('Error fetching employees:', e)
  } finally {
    loading.value = false
  }
}

async function reload(p = page.value) {
  page.value = p
  await fetchList()
}

async function remove(e: Employee) {
  if (!confirm(`Удалить сотрудника "${e.first_name} ${e.last_name}"?`)) return
  deletingId.value = e.id
  try {
    await api.delete(endpoints.employees.one(e.id))
    ui.toast({type: 'success', text: `Сотрудник "${e.first_name} ${e.last_name}" удален`})
    await fetchList()
  } catch (e: any) {
    ui.toast({type: 'error', text: 'Ошибка удаления сотрудника'})
    console.error('Error deleting employee:', e)
  } finally {
    deletingId.value = null
  }
}

async function onSaved() {
  modalOpen.value = false
  ui.toast({type: 'success', text: 'Сотрудник сохранен'})
  await fetchList()
}

onMounted(() => fetchList())
</script>
