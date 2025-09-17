<template>
  <div class="grid gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">Объекты</h1>
      <button 
        class="btn btn-primary" 
        @click="openCreate" 
        v-if="canEdit"
        :disabled="objectsStore.loading"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Добавить объект
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
              v-model="objectsStore.filters.search"
              type="text"
              class="input input-bordered"
              placeholder="Название, адрес"
              @keyup.enter="handleSearch"
            />
          </fieldset>
          
          <!-- Status Filter -->
          <fieldset class="fieldset">
            <span class="label-text">Статус</span>
            <select 
              v-model="objectsStore.filters.is_active"
              class="select select-bordered"
              @change="handleSearch"
            >
              <option value="">Все</option>
              <option value="true">Активные</option>
              <option value="false">Неактивные</option>
            </select>
          </fieldset>
          
          <!-- Name Filter -->
          <fieldset class="fieldset">
            <span class="label-text">Название</span>
            <input 
              v-model="objectsStore.filters.name"
              type="text"
              class="input input-bordered"
              placeholder="Название объекта"
              @keyup.enter="handleSearch"
            />
          </fieldset>
          
          <!-- Ordering -->
          <fieldset class="fieldset">
            <span class="label-text">Сортировка</span>
            <select 
              v-model="objectsStore.filters.ordering"
              class="select select-bordered"
              @change="handleSearch"
            >
              <option value="name">Название ↑</option>
              <option value="-name">Название ↓</option>
              <option value="id">ID ↑</option>
              <option value="-id">ID ↓</option>
            </select>
          </fieldset>
        </div>
        
        <div class="flex gap-2 mt-4">
          <button class="btn btn-primary" @click="handleSearch" :disabled="objectsStore.loading">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            Применить
          </button>
          <button class="btn btn-outline" @click="handleReset" :disabled="objectsStore.loading">
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
      :data="objectsStore.items"
      :loading="objectsStore.loading"
      :actions="actions"
      empty-text="Нет объектов"
      @action="handleAction"
    >
      <template #cell-is_active="{ value }">
        <div class="badge" :class="value ? 'badge-success' : 'badge-error'">
          {{ value ? 'Активный' : 'Неактивный' }}
        </div>
      </template>
    </Table>

    <!-- Pagination -->
    <Pagination
      :current="objectsStore.pagination.page"
      :total="objectsStore.pagination.count"
      :page-size="objectsStore.pagination.pageSize"
      @change="handlePageChange"
    />

    <!-- Modal -->
    <Modal v-model="modalOpen" :title="modalTitle" size="lg" :closable="true">
      <ObjectForm :initial="current" @saved="onSaved" @cancel="modalOpen=false"/>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useObjectsStore } from '@/stores/objects'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { Object, Me } from '@/api/types'
import Table from '@/components/Table.vue'
import Pagination from '@/components/Pagination.vue'
import Modal from '@/components/Modal.vue'
import ObjectForm from './ObjectForm.vue'

const objectsStore = useObjectsStore()
const auth = useAuthStore()
const ui = useUiStore()

const canEdit = computed(() => {
  const role = auth.role as Me['role'] | undefined
  return role === 'admin' || role === 'director'
})

const modalOpen = ref(false)
const current = ref<Object | null>(null)

const modalTitle = computed(() => {
  return current.value ? 'Редактировать объект' : 'Добавить объект'
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
    key: 'address',
    title: 'Адрес',
    sortable: false,
    class: 'min-w-64'
  },
  {
    key: 'is_active',
    title: 'Статус',
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

function openEdit(object: Object) {
  current.value = object
  modalOpen.value = true
}

async function handleSearch() {
  await objectsStore.fetchList()
}

async function handleReset() {
  objectsStore.resetFilters()
  await objectsStore.fetchList()
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