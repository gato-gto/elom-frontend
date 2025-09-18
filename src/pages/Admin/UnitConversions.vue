<!-- src/pages/Admin/UnitConversions.vue -->
<template>
  <div class="grid gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">Конвертации единиц измерения</h1>
      <button 
        class="btn btn-primary" 
        @click="openCreateModal"
        :disabled="unitConversionsStore.loading"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Добавить конвертацию
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
              v-model="filters.search"
              type="text"
              class="input input-bordered"
              placeholder="Поиск по единицам"
              @keyup.enter="handleSearch"
            />
          </fieldset>
          
          <!-- From Unit Filter -->
          <fieldset class="fieldset">
            <span class="label-text">Из единицы</span>
            <select 
              v-model="filters.from_unit"
              class="select select-bordered"
              @change="handleSearch"
            >
              <option value="">Все</option>
              <option v-for="unit in units" :key="unit.id" :value="unit.id">
                {{ unit.name }}
              </option>
            </select>
          </fieldset>
          
          <!-- To Unit Filter -->
          <fieldset class="fieldset">
            <span class="label-text">В единицу</span>
            <select 
              v-model="filters.to_unit"
              class="select select-bordered"
              @change="handleSearch"
            >
              <option value="">Все</option>
              <option v-for="unit in units" :key="unit.id" :value="unit.id">
                {{ unit.name }}
              </option>
            </select>
          </fieldset>
          
          <!-- Status Filter -->
          <fieldset class="fieldset">
            <span class="label-text">Статус</span>
            <select 
              v-model="filters.is_active"
              class="select select-bordered"
              @change="handleSearch"
            >
              <option value="">Все</option>
              <option value="true">Активные</option>
              <option value="false">Неактивные</option>
            </select>
          </fieldset>
        </div>
        
        <div class="flex gap-2 mt-4">
          <button class="btn btn-primary" @click="handleSearch" :disabled="unitConversionsStore.loading">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            Применить
          </button>
          <button class="btn btn-outline" @click="handleReset" :disabled="unitConversionsStore.loading">
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
      :data="unitConversionsStore.items"
      :loading="unitConversionsStore.loading"
      :actions="actions"
      empty-text="Нет конвертаций"
      @action="handleAction"
    >
      <template #cell-conversion_factor="{ value }">
        <span class="font-mono">{{ value }}</span>
      </template>
      
      <template #cell-is_active="{ value }">
        <div class="badge" :class="value ? 'badge-success' : 'badge-error'">
          {{ value ? 'Активная' : 'Неактивная' }}
        </div>
      </template>
    </Table>

    <!-- Pagination -->
    <Pagination
      :current-page="unitConversionsStore.pagination.page"
      :total-pages="Math.ceil(unitConversionsStore.pagination.count / unitConversionsStore.pagination.pageSize)"
      @page-change="handlePageChange"
    />

    <!-- Modal -->
    <Modal v-model="modalOpen" :title="modalTitle" size="lg" :closable="true">
      <UnitConversionForm 
        :initial="current" 
        :units="units"
        @saved="onSaved" 
        @cancel="modalOpen=false"
      />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUnitConversionsStore } from '@/stores/unitConversions'
import { useUnitsStore } from '@/stores/units'
import { useUiStore } from '@/stores/ui'
import type { UnitConversion, Unit } from '@/api/types'
import Table from '@/components/Table.vue'
import Pagination from '@/components/Pagination.vue'
import Modal from '@/components/Modal.vue'
import UnitConversionForm from './UnitConversionForm.vue'

const unitConversionsStore = useUnitConversionsStore()
const unitsStore = useUnitsStore()
const ui = useUiStore()

const modalOpen = ref(false)
const current = ref<UnitConversion | null>(null)
const units = ref<Unit[]>([])

const modalTitle = computed(() => {
  return current.value ? 'Редактировать конвертацию' : 'Добавить конвертацию'
})

const filters = ref({
  search: '',
  from_unit: '',
  to_unit: '',
  is_active: '',
  ordering: 'from_unit_name'
})

const columns = [
  {
    key: 'id',
    title: 'ID',
    sortable: true,
    class: 'w-20'
  },
  {
    key: 'from_unit_name',
    title: 'Из единицы',
    sortable: true,
    class: 'min-w-32'
  },
  {
    key: 'to_unit_name',
    title: 'В единицу',
    sortable: true,
    class: 'min-w-32'
  },
  {
    key: 'conversion_factor',
    title: 'Коэффициент',
    sortable: true,
    class: 'w-32'
  },
  {
    key: 'is_active',
    title: 'Статус',
    sortable: true,
    class: 'w-32'
  },
  {
    key: 'created_at',
    title: 'Создано',
    sortable: true,
    class: 'w-32'
  }
]

const actions = [
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

function openCreateModal() {
  current.value = null
  modalOpen.value = true
}

function handleAction(action: string, item: UnitConversion) {
  switch (action) {
    case 'edit':
      current.value = item
      modalOpen.value = true
      break
    case 'delete':
      handleDelete(item)
      break
  }
}

async function handleDelete(item: UnitConversion) {
  if (!confirm(`Удалить конвертацию "${item.from_unit_name} → ${item.to_unit_name}"?`)) {
    return
  }
  
  try {
    await unitConversionsStore.deleteItem(item.id)
    ui.toast({ type: 'success', text: 'Конвертация удалена' })
  } catch (error) {
    ui.toast({ type: 'error', text: 'Ошибка удаления конвертации' })
  }
}

function onSaved() {
  modalOpen.value = false
  loadData()
}

async function handleSearch() {
  await loadData()
}

function handleReset() {
  filters.value = {
    search: '',
    from_unit: '',
    to_unit: '',
    is_active: '',
    ordering: 'from_unit_name'
  }
  loadData()
}

function handlePageChange(page: number) {
  unitConversionsStore.pagination.page = page
  loadData()
}

async function loadData() {
  try {
    await unitConversionsStore.fetchList({
      page: unitConversionsStore.pagination.page,
      page_size: unitConversionsStore.pagination.pageSize,
      search: filters.value.search || undefined,
      from_unit: filters.value.from_unit ? Number(filters.value.from_unit) : undefined,
      to_unit: filters.value.to_unit ? Number(filters.value.to_unit) : undefined,
      is_active: filters.value.is_active ? filters.value.is_active === 'true' : undefined,
      ordering: filters.value.ordering
    })
  } catch (error) {
    ui.toast({ type: 'error', text: 'Ошибка загрузки конвертаций' })
  }
}

async function loadUnits() {
  try {
    await unitsStore.fetchList({ page_size: 1000 })
    units.value = unitsStore.items
  } catch (error) {
    ui.toast({ type: 'error', text: 'Ошибка загрузки единиц измерения' })
  }
}

onMounted(async () => {
  await loadUnits()
  await loadData()
})
</script>
