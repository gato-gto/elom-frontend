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
      @reset="handleResetFilters"
    >
      <FilterField
        v-model="materialsStore.filters.name"
        type="text"
        label="Название"
        placeholder="Название материала"
      />
      
      <FilterField
        v-model="materialsStore.filters.sku"
        type="text"
        label="SKU"
        placeholder="Артикул"
      />
      
      <FilterField
        v-model="materialsStore.filters.category"
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
    <div class="list-content" :class="{ 'relative': materialsStore.loading }">
      <!-- Loading Overlay -->
      <LoadingSpinner 
        v-if="materialsStore.loading && materialsStore.items.length === 0"
        size="lg"
        variant="primary"
        text="Загрузка материалов..."
        :overlay="false"
      />
      
      <!-- Loading Skeleton for existing data -->
      <div v-if="materialsStore.loading && materialsStore.items.length > 0" class="loading-overlay">
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
            <th @click="handleSort('sku')" class="cursor-pointer hover:bg-gray-50">
              SKU
              <span v-if="sortBy === 'sku'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="handleSort('category_name')" class="cursor-pointer hover:bg-gray-50">
              Категория
              <span v-if="sortBy === 'category_name'" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th class="text-right">Действия</th>
          </tr>
        </thead>
        
        <!-- Skeleton Loading -->
        <TableSkeleton 
          v-if="materialsStore.loading && materialsStore.items.length === 0"
          :rows="materialsStore.pagination.pageSize"
          :columns="5"
        />
        
        <!-- Actual Data -->
        <tbody v-else>
          <tr v-for="material in materialsStore.items" :key="material.id" class="table-row">
            <td>{{ material.id }}</td>
            <td>
              <div class="flex items-center gap-3">
                <div class="flex items-center justify-center">
                  <img 
                    v-if="material.photo_url" 
                    :src="material.photo_url" 
                    alt="Фото материала" 
                    class="h-10 w-10 object-cover rounded-lg border"
                  />
                  <div v-else class="h-10 w-10 bg-gray-100 rounded-lg border flex items-center justify-center">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div class="flex flex-col">
                  <span class="font-medium text-gray-900">{{ material.name }}</span>
                  <span v-if="material.sku" class="text-sm text-gray-500">SKU: {{ material.sku }}</span>
                </div>
              </div>
            </td>
            <td>{{ material.sku || '—' }}</td>
            <td>
              <span v-if="material.category_name">{{ material.category_name }}</span>
              <span v-else class="text-gray-400 text-sm">—</span>
            </td>
            <td class="text-right">
              <div class="flex gap-1 justify-end">
                <button 
                  v-if="canEdit" 
                  class="btn btn-xs btn-outline" 
                  @click="handleAction('edit', material)"
                >
                  Редактировать
                </button>
                <button 
                  v-if="canEdit" 
                  class="btn btn-xs btn-error" 
                  @click="handleAction('delete', material)"
                >
                  Удалить
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!materialsStore.loading && materialsStore.items.length === 0">
            <td colspan="5" class="text-center text-gray-500 py-8">
              <div class="flex flex-col items-center gap-2">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <span class="text-sm">Нет материалов</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <ModernPagination
      :current-page="materialsStore.pagination.page"
      :total-pages="Math.ceil(materialsStore.pagination.count / materialsStore.pagination.pageSize)"
      :total-items="materialsStore.pagination.count"
      :page-size="materialsStore.pagination.pageSize"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    />

    <!-- Material Form Modal -->
    <Modal v-model="modalOpen" :title="current ? 'Редактировать материал' : 'Новый материал'" size="3xl">
      <MaterialForm 
        :initial="current" 
        @saved="onSaved" 
        @cancel="modalOpen = false"
      />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Material, Me } from '@/api/types'
import { debounce } from '@/utils/debounce'
import MaterialForm from './MaterialForm.vue'
import { useAuthStore } from '@/stores/auth'
import { useMaterialsStore } from '@/stores/materials'
import { useMaterialCategoriesStore } from '@/stores/materialCategories'
import { useUiStore } from '@/stores/ui'
import { ErrorHandlers } from '@/utils/errorHandler'
import Modal from '@/components/Modal.vue'
import FormField from '@/components/FormField.vue'
import ExportButton from '@/components/ExportButton.vue'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'
import ModernPagination from '@/components/ModernPagination.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'

const router = useRouter()
const auth = useAuthStore()
const materialsStore = useMaterialsStore()
const materialCategoriesStore = useMaterialCategoriesStore()
const ui = useUiStore()

// Автоматические фильтры
const isSearching = ref(false)

// Computed
const canEdit = computed(() => {
  const role = auth.role as Me['role'] | undefined
  return role === 'admin' || role === 'director'
})


// Sorting
const sortBy = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')


// Category filter options
const categoryFilterOptions = computed(() => [
  { value: '', label: 'Все категории' },
  ...materialCategoriesStore.selectOptions
])



// Modal state
const modalOpen = ref(false)
const current = ref<Material | null>(null)

// Methods
function openCreate() {
  current.value = null
  modalOpen.value = true
}

function openEdit(material: Material) {
  current.value = material
  modalOpen.value = true
}

// Debounced функция для автоматического поиска
const debouncedSearch = debounce(async () => {
  isSearching.value = true
  try {
    await materialsStore.fetchList()
  } catch (error) {
    ErrorHandlers.dataLoading(error)
  } finally {
    isSearching.value = false
  }
}, 500)

// Watcher для автоматического поиска при изменении фильтров
watch(
  () => materialsStore.filters,
  () => {
    materialsStore.pagination.page = 1
    debouncedSearch()
  },
  { deep: true }
)

function handleResetFilters() {
  materialsStore.resetFilters()
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
    ErrorHandlers.dataLoading(error)
  }
}

function exportToCSV(data: Material[], filename: string) {
  const headers = ['ID', 'Название', 'SKU', 'Категория', 'Дата создания']
  const rows = data.map(item => [
    item.id,
    item.name,
    item.sku || '',
    item.category_name || '',
    item.id ? new Date().toLocaleDateString('ru-RU') : ''
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')

  downloadFile(csvContent, `${filename}.csv`, 'text/csv')
}

function exportToExcel(data: Material[], filename: string) {
  // For now, export as CSV with .xlsx extension
  // In a real app, you'd use a library like xlsx
  exportToCSV(data, filename.replace('.xlsx', ''))
  ui.toast({ type: 'info', text: 'Excel экспорт временно недоступен. Скачан CSV файл.' })
}

function exportToPDF(data: Material[], filename: string) {
  // For now, show info message
  ui.toast({ type: 'info', text: 'PDF экспорт временно недоступен' })
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function handleSort(key: string) {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
  
  const ordering = sortOrder.value === 'desc' ? `-${key}` : key
  materialsStore.setFilters({ ordering })
}

function handlePageChange(page: number) {
  materialsStore.setPage(page)
}

async function handlePageSizeChange(size: number) {
  materialsStore.setPageSize(size)
}

async function handleAction(action: string, row: Material) {
  switch (action) {
    case 'edit':
      openEdit(row)
      break
    case 'delete':
      await handleDelete(row)
      break
  }
}

async function handleDelete(material: Material) {
  if (!confirm(`Удалить материал "${material.name}"?`)) return
  
  try {
    await materialsStore.delete(material.id)
    ui.toast({ type: 'success', text: 'Материал удален' })
  } catch (error) {
    ErrorHandlers.delete(error)
  }
}

async function onSaved() {
  modalOpen.value = false
  current.value = null
  await materialsStore.fetchList()
  ui.toast({ type: 'success', text: 'Материал сохранен' })
}

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      materialsStore.fetchList(),
      materialCategoriesStore.fetchList()
    ])
  } catch (error) {
    ErrorHandlers.dataLoading(error)
  }
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>

