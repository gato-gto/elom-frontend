<template>
  <div class="list-container">
    <!-- Header -->
    <ListHeader
      title="Единицы измерения"
      subtitle="Управление базовыми единицами для материалов и закупок"
      icon="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 110 2h-1v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6H4a1 1 0 110-2h3zM9 4h6V3H9v1z"
      :show-create="canEdit"
      create-text="Добавить единицу"
      :can-create="canEdit"
      :loading="unitsStore.loading"
      :show-stats="true"
      :total-count="unitsStore.pagination.count"
      :filtered-count="unitsStore.items.length"
      @create="openCreate"
    />

    <!-- Admin Info -->
    <div class="alert alert-info">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
      </svg>
      <div>
        <h3 class="font-bold">Для администраторов</h3>
        <div class="text-xs">
          Создавайте единицы измерения для материалов. Пользователи видят автоматически конвертированные значения (например, 1000г → 1кг).
          <br>
          <strong>Поддерживаемые категории:</strong> масса (г, кг, т), длина (мм, см, м, км), площадь (см², м², га), объем (мл, л, м³).
        </div>
      </div>
    </div>

    <!-- Filters -->
    <FilterPanel
      :columns="3"
      :loading="unitsStore.loading"
      @reset="handleReset"
    >
      <FilterField
        v-model="unitsStore.filters.search"
        type="text"
        label="Поиск"
        placeholder="Название, код"
      />
      
      <FilterField
        v-model="unitsStore.filters.code"
        type="text"
        label="Код"
        placeholder="Код единицы"
      />
      
      <FilterField
        v-model="unitsStore.filters.name"
        type="text"
        label="Название"
        placeholder="Название единицы"
      />
    </FilterPanel>

    <!-- Table -->
    <!-- Table -->
    <div class="list-content" :class="{ 'relative': unitsStore.loading }">
      <!-- Loading Overlay -->
      <LoadingSpinner 
        v-if="unitsStore.loading && unitsStore.items.length === 0"
        size="lg"
        variant="primary"
        text="Загрузка единиц измерения..."
        :overlay="false"
      />
      
      <!-- Loading Skeleton for existing data -->
      <div v-if="unitsStore.loading && unitsStore.items.length > 0" class="loading-overlay">
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
            <th @click="handleSort('code')" class="cursor-pointer hover:bg-gray-50">
              Код
              <span v-if="sortBy === 'code'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th>Умная конвертация</th>
            <th class="text-right">Действия</th>
        </tr>
        </thead>
        
        <!-- Skeleton Loading -->
        <TableSkeleton 
          v-if="unitsStore.loading && unitsStore.items.length === 0"
          :rows="unitsStore.pagination.pageSize"
          :columns="5"
        />
        
        <!-- Actual Data -->
        <tbody v-else>
          <tr v-for="unit in unitsStore.items" :key="unit.id" class="table-row">
            <td>{{ unit.id }}</td>
            <td>{{ unit.name }}</td>
          <td>
              <div class="text-sm text-gray-600 font-mono">{{ unit.code }}</div>
          </td>
          <td>
            <span v-if="isUsedInSmartConversion(unit.code)" class="badge badge-success badge-xs">
              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              Поддерживается
            </span>
            <span v-else class="badge badge-ghost badge-xs">
              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
              </svg>
              Не поддерживается
            </span>
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
            <td colspan="5" class="text-center text-gray-500 py-8">
              <div class="flex flex-col items-center gap-2">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 110 2h-1v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6H4a1 1 0 110-2h3zM9 4h6V3H9v1z" />
                </svg>
                <span class="text-sm">Нет единиц измерения</span>
              </div>
            </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <ModernPagination
      :current-page="unitsStore.pagination.page"
      :total-pages="Math.ceil(unitsStore.pagination.count / unitsStore.pagination.pageSize)"
      :total-items="unitsStore.pagination.count"
      :page-size="unitsStore.pagination.pageSize"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    />

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
import { ErrorHandlers } from '@/utils/errorHandler'
import type { Unit, Me } from '@/api/types'
import { debounce } from '@/utils/debounce'
import Modal from '@/components/Modal.vue'
import UnitForm from './UnitForm.vue'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'
import ModernPagination from '@/components/ModernPagination.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'

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

async function handlePageSizeChange(size: number) {
  unitsStore.setPageSize(size)
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
  // Проверяем, используется ли единица в умной конвертации
  const isSmartUnit = isUsedInSmartConversion(unit.code)
  
  let confirmMessage = `Удалить единицу измерения "${unit.name}" (${unit.code})?`
  
  if (isSmartUnit) {
    confirmMessage += `\n\n⚠️ ВНИМАНИЕ: Эта единица поддерживает умную конвертацию!`
    confirmMessage += `\nУдаление может нарушить работу автоматического округления значений.`
    confirmMessage += `\n\nРекомендуется оставить единицу для корректной работы системы.`
  }
  
  if (!confirm(confirmMessage)) return
  
  // Дополнительное подтверждение для умных единиц
  if (isSmartUnit) {
    const doubleConfirm = confirm(`Вы уверены, что хотите удалить единицу "${unit.name}"?\n\nЭто может нарушить работу умной конвертации!`)
    if (!doubleConfirm) return
  }
  
  try {
    await unitsStore.delete(unit.id)
    ui.toast({ type: 'success', text: `Единица измерения "${unit.name}" удалена` })
  } catch (error) {
    ErrorHandlers.delete(error)
  }
}

async function onSaved() {
  modalOpen.value = false
  ui.toast({ type: 'success', text: 'Единица измерения сохранена' })
  await unitsStore.fetchList()
}

// Сортировка
const sortBy = ref<string>('id')
const sortOrder = ref<'asc' | 'desc'>('asc')

function handleSort(field: string) {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = 'asc'
  }
  
  // Обновляем ordering в store
  unitsStore.filters.ordering = sortOrder.value === 'asc' ? field : `-${field}`
  unitsStore.pagination.page = 1
  debouncedSearch()
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

// Функция для проверки поддержки умной конвертации
function isUsedInSmartConversion(unitCode: string): boolean {
  // Единицы, поддерживаемые умной конвертацией (из бэкенда)
  const smartConversionUnits = [
    // Масса
    'г', 'кг', 'т',
    // Длина
    'мм', 'см', 'м', 'км',
    // Площадь
    'см²', 'м²', 'га',
    // Объем
    'см³', 'м³', 'л', 'мл'
  ]
  
  return smartConversionUnits.includes(unitCode)
}

onMounted(() => {
  unitsStore.fetchList()
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>