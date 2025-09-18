<template>
  <div class="list-container">
    <!-- Header -->
    <ListHeader
      title="Материалы"
      subtitle="Управление материалами и их характеристиками"
      icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      :show-create="canEdit"
      create-text="Добавить материал"
      :can-create="canEdit"
      :loading="materialsStore.loading"
      :show-stats="true"
      :total-count="materialsStore.pagination.count"
      :filtered-count="materialsStore.items.length"
      @create="openCreate"
    >
      <template #actions>
        <ExportButton 
          :data="materialsStore.items"
          filename="materials"
          :loading="materialsStore.loading"
          @export="handleExport"
        />
      </template>
    </ListHeader>

    <!-- Filters -->
    <FilterPanel
      :columns="3"
      :loading="materialsStore.loading"
      @search="handleSearch"
      @reset="handleResetFilters"
    >
      <FilterField
        v-model="searchQuery"
        type="text"
        label="Поиск"
        placeholder="Название, SKU, категория"
      />
      
      <FilterField
        v-model="categoryFilter"
        type="select"
        label="Категория"
        :options="categoryFilterOptions"
      />
      
    </FilterPanel>

    <!-- Error message -->
    <div v-if="materialsStore.error" class="alert alert-error">
      <span>{{ materialsStore.error }}</span>
      <button class="btn btn-sm btn-ghost" @click="materialsStore.clearError()">×</button>
    </div>

    <!-- Table -->
    <div class="list-content">
      <Table
        :data="materialsStore.items"
        :columns="columns"
        :actions="actions"
        :loading="materialsStore.loading"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @sort="handleSort"
        @action="handleAction"
      >
        <!-- Custom photo cell -->
        <template #cell-photo_url="{ value }">
          <div class="flex items-center justify-center">
            <img 
              v-if="value" 
              :src="value" 
              alt="Фото материала" 
              class="h-12 w-12 object-cover rounded-lg border"
            />
            <div v-else class="h-12 w-12 bg-gray-100 rounded-lg border flex items-center justify-center">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </template>

        <!-- Custom name cell -->
        <template #cell-name="{ value, row }">
          <div class="flex flex-col">
            <span class="font-medium text-gray-900">{{ value }}</span>
            <span v-if="row.sku" class="text-sm text-gray-500">SKU: {{ row.sku }}</span>
          </div>
        </template>

        <!-- Custom category cell -->
        <template #cell-category_name="{ value }">
          <span v-if="value" class="badge badge-outline">{{ value }}</span>
          <span v-else class="text-gray-400">—</span>
        </template>

        <!-- Custom unit cell -->
        <template #cell-default_unit_code="{ value }">
          <span v-if="value" class="badge badge-secondary">{{ value }}</span>
          <span v-else class="text-gray-400">—</span>
        </template>

        <!-- Custom actions cell -->
        <template #cell-actions="{ row }">
          <div class="flex items-center gap-2">
            <button 
              v-if="canEdit"
              class="btn btn-sm btn-ghost"
              @click="openEdit(row)"
              title="Редактировать"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            <button 
              v-if="canEdit"
              class="btn btn-sm btn-ghost text-error"
              @click="handleDelete(row)"
              title="Удалить"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </template>
      </Table>

      <!-- Pagination -->
      <div class="modern-pagination">
        <button 
          class="pagination-btn"
          :disabled="!materialsStore.pagination.previous"
          @click="handlePreviousPage"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span class="pagination-info">
          Страница {{ materialsStore.pagination.page }} из {{ totalPages }}
        </span>

        <button 
          class="pagination-btn"
          :disabled="!materialsStore.pagination.next"
          @click="handleNextPage"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Modal -->
    <MaterialForm
      v-if="modalOpen"
      :material="current"
      :open="modalOpen"
      @close="closeModal"
      @saved="handleMaterialSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useMaterialsStore } from '@/stores/materials-optimized'
import { useMaterialCategoriesStore } from '@/stores/materialCategories'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useOptimizedReactivity } from '@/composables/useOptimizedReactivity'
import type { Material, Me } from '@/api/types'
import { debounce } from '@/utils/debounce'
import { exportToCSV, exportToExcel, exportToPDF, downloadFile } from '@/utils/export'

// Stores
const materialsStore = useMaterialsStore()
const materialCategoriesStore = useMaterialCategoriesStore()
const auth = useAuthStore()
const ui = useUiStore()

// Optimized reactivity
const { useDebouncedWatch, useOptimizedComputed } = useOptimizedReactivity

// Reactive state
const searchQuery = ref('')
const categoryFilter = ref('')
const orderingFilter = ref('name')
const sortBy = ref('name')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Computed properties with optimization
const canEdit = useOptimizedComputed(() => {
  const role = auth.role as Me['role'] | undefined
  return role === 'admin' || role === 'director'
}, [auth.role])

const totalPages = useOptimizedComputed(() => {
  return Math.ceil(materialsStore.pagination.count / materialsStore.pagination.pageSize)
}, [materialsStore.pagination.count, materialsStore.pagination.pageSize])

// Table configuration
const columns = [
  { key: 'photo_url', label: 'Фото', sortable: false, width: '80px' },
  { key: 'name', label: 'Название', sortable: true },
  { key: 'category_name', label: 'Категория', sortable: true },
  { key: 'default_unit_code', label: 'Единица', sortable: true },
  { key: 'created_at', label: 'Дата создания', sortable: true },
  { key: 'actions', label: 'Действия', sortable: false, width: '120px' }
]

const actions = [
  { key: 'edit', label: 'Редактировать', icon: 'edit' },
  { key: 'delete', label: 'Удалить', icon: 'delete', variant: 'error' }
]

// Filter options

const categoryFilterOptions = computed(() => [
  { value: '', label: 'Все категории' },
  ...materialCategoriesStore.selectOptions
])

// Modal state
const modalOpen = ref(false)
const current = ref<Material | null>(null)

// Optimized search with debouncing
const debouncedSearch = debounce(async () => {
  try {
    await materialsStore.fetchList({
      page: 1,
      search: searchQuery.value,
      category: categoryFilter.value,
      ordering: orderingFilter.value
    })
  } catch (error) {
    ui.toast({ type: 'error', text: 'Ошибка поиска материалов' })
  }
}, 500)

// Watchers for automatic search
useDebouncedWatch(
  () => searchQuery.value,
  () => {
    materialsStore.setFilters({ search: searchQuery.value })
    debouncedSearch()
  },
  500
)

useDebouncedWatch(
  () => categoryFilter.value,
  () => {
    materialsStore.setFilters({ category: categoryFilter.value })
    debouncedSearch()
  },
  300
)

useDebouncedWatch(
  () => orderingFilter.value,
  () => {
    materialsStore.setFilters({ ordering: orderingFilter.value })
    debouncedSearch()
  },
  300
)

// Methods
function openCreate() {
  current.value = null
  modalOpen.value = true
}

function openEdit(material: Material) {
  current.value = material
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  current.value = null
}

async function handleSearch() {
  await debouncedSearch()
}

function handleResetFilters() {
  searchQuery.value = ''
  categoryFilter.value = ''
  orderingFilter.value = 'name'
  
  materialsStore.resetFilters()
  debouncedSearch()
}

function handleSort(column: string, order: 'asc' | 'desc') {
  sortBy.value = column
  sortOrder.value = order
  
  const ordering = order === 'desc' ? `-${column}` : column
  orderingFilter.value = ordering
  materialsStore.setFilters({ ordering })
  debouncedSearch()
}

async function handleAction(action: string, material: Material) {
  switch (action) {
    case 'edit':
      openEdit(material)
      break
    case 'delete':
      await handleDelete(material)
      break
  }
}

async function handleDelete(material: Material) {
  if (confirm(`Вы уверены, что хотите удалить материал "${material.name}"?`)) {
    try {
      await materialsStore.delete(material.id)
      ui.toast({ type: 'success', text: 'Материал удален' })
    } catch (error) {
      ui.toast({ type: 'error', text: 'Ошибка удаления материала' })
    }
  }
}

async function handlePreviousPage() {
  if (materialsStore.pagination.previous) {
    await materialsStore.setPage(materialsStore.pagination.page - 1)
  }
}

async function handleNextPage() {
  if (materialsStore.pagination.next) {
    await materialsStore.setPage(materialsStore.pagination.page + 1)
  }
}

function handleMaterialSaved() {
  closeModal()
  ui.toast({ type: 'success', text: 'Материал сохранен' })
}

async function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    const data = materialsStore.items
    const filename = `materials_${new Date().toISOString().split('T')[0]}`

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

    ui.toast({ type: 'success', text: `Экспорт в ${format.toUpperCase()} выполнен` })
  } catch (error) {
    ui.toast({ type: 'error', text: 'Ошибка экспорта' })
  }
}

// Lifecycle
onMounted(async () => {
  try {
    // Загружаем данные параллельно
    await Promise.all([
      materialsStore.fetchList(),
      materialCategoriesStore.fetchList()
    ])
  } catch (error) {
    ui.toast({ type: 'error', text: 'Ошибка загрузки данных' })
  }
})
</script>
