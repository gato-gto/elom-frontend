<template>
  <div class="grid gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">Материалы</h1>
      <button 
        class="btn btn-primary" 
        @click="openCreate" 
        v-if="canEdit"
        :disabled="materialsStore.loading"
      >
        Добавить материал
      </button>
    </div>

    <!-- Filters -->
    <div class="card bg-white border">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Фильтры и поиск</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <fieldset class="fieldset">
            <span class="label-text">Поиск</span>
            <input 
              v-model="materialsStore.filters.search"
              type="text"
              class="input input-bordered"
              placeholder="Название, SKU, категория"
              @keyup.enter="handleSearch"
            />
          </fieldset>
          
          <!-- Category Filter -->
          <fieldset class="fieldset">
            <span class="label-text">Категория</span>
            <select 
              v-model="materialsStore.filters.category"
              class="select select-bordered"
              @change="handleSearch"
            >
              <option v-for="option in categoryFilterOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </fieldset>
          
          
          <!-- Ordering -->
          <fieldset class="fieldset">
            <span class="label-text">Сортировка</span>
            <select 
              v-model="materialsStore.filters.ordering"
              class="select select-bordered"
              @change="handleSearch"
            >
              <option v-for="option in orderingOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </fieldset>
        </div>
        
        <!-- Action buttons -->
        <div class="flex gap-2 mt-4">
          <button 
            class="btn btn-primary btn-sm" 
            @click="handleSearch"
            :disabled="materialsStore.loading"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Поиск
          </button>
          
          <button 
            class="btn btn-outline btn-sm" 
            @click="handleResetFilters"
            :disabled="materialsStore.loading"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Сбросить
          </button>
          
          <ExportButton 
            :data="materialsStore.items"
            filename="materials"
            :loading="materialsStore.loading"
            @export="handleExport"
          />
        </div>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="materialsStore.error" class="alert alert-error">
      <span>{{ materialsStore.error }}</span>
      <button class="btn btn-sm btn-ghost" @click="materialsStore.clearError()">×</button>
    </div>

    <!-- Table -->
    <div class="card bg-white border">
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
          <span v-if="value">{{ value }}</span>
          <span v-else class="text-gray-400 text-sm">—</span>
        </template>

        <!-- Custom unit cell -->
        <template #cell-default_unit_code="{ value }">
          <span class="badge badge-ghost">{{ value }}</span>
        </template>

      </Table>
    </div>

    <!-- Pagination -->
    <Pagination
      :current-page="materialsStore.pagination.page"
      :total-pages="Math.ceil(materialsStore.pagination.count / materialsStore.pagination.pageSize)"
      @page-change="handlePageChange"
    />

    <!-- Material Form Modal -->
    <Modal v-model="modalOpen" :title="current ? 'Редактировать материал' : 'Новый материал'">
      <MaterialForm 
        :initial="current" 
        @saved="onSaved" 
        @cancel="modalOpen = false"
      />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Material, Me } from '@/api/types'
import MaterialForm from './MaterialForm.vue'
import { useAuthStore } from '@/stores/auth'
import { useMaterialsStore } from '@/stores/materials'
import { useMaterialCategoriesStore } from '@/stores/materialCategories'
import { useUiStore } from '@/stores/ui'
import Modal from '@/components/Modal.vue'
import Table from '@/components/Table.vue'
import FormField from '@/components/FormField.vue'
import Pagination from '@/components/Pagination.vue'
import ExportButton from '@/components/ExportButton.vue'

const router = useRouter()
const auth = useAuthStore()
const materialsStore = useMaterialsStore()
const materialCategoriesStore = useMaterialCategoriesStore()
const ui = useUiStore()

// Computed
const canEdit = computed(() => {
  const role = auth.role as Me['role'] | undefined
  return role === 'admin' || role === 'director'
})

// Table configuration
const columns = [
  { key: 'photo_url', title: 'Фото', sortable: false, class: 'w-20' },
  { key: 'name', title: 'Название', sortable: true },
  { key: 'category_name', title: 'Категория', sortable: false, class: 'w-32' },
  { key: 'default_unit_code', title: 'Единица', sortable: false, class: 'w-20' },
  { key: 'id', title: 'ID', sortable: true, class: 'w-16' }
]

const actions = computed(() => {
  if (!canEdit.value) return []
  
  return [
    {
      key: 'edit',
      label: 'Изменить',
      class: 'btn-outline btn-xs'
    },
    {
      key: 'delete',
      label: 'Удалить',
      class: 'btn-error btn-xs',
      disabled: (row: Material) => materialsStore.loading
    }
  ]
})

// Sorting
const sortBy = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Ordering options
const orderingOptions = [
  { value: 'name', label: 'Название ↑' },
  { value: '-name', label: 'Название ↓' },
  { value: 'sku', label: 'SKU ↑' },
  { value: '-sku', label: 'SKU ↓' },
  { value: 'id', label: 'ID ↑' },
  { value: '-id', label: 'ID ↓' },
  { value: 'created_at', label: 'Дата создания ↑' },
  { value: '-created_at', label: 'Дата создания ↓' }
]

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

async function handleSearch() {
  try {
    await materialsStore.fetchList({
      page: 1,
      search: materialsStore.filters.search,
      category: materialsStore.filters.category,
      ordering: materialsStore.filters.ordering
    })
  } catch (error) {
    ui.toast({ type: 'error', text: 'Ошибка поиска материалов' })
  }
}

function handleResetFilters() {
  materialsStore.setFilters({
    search: '',
    category: '',
    ordering: 'name'
  })
  handleSearch()
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

function exportToCSV(data: Material[], filename: string) {
  const headers = ['ID', 'Название', 'SKU', 'Категория', 'Единица', 'Статус', 'Дата создания']
  const rows = data.map(item => [
    item.id,
    item.name,
    item.sku || '',
    item.category_name || '',
    item.default_unit_code || '',
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
  handleSearch()
}

function handlePageChange(page: number) {
  materialsStore.fetchList({ page })
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
    ui.toast({ type: 'error', text: 'Ошибка удаления материала' })
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
    ui.toast({ type: 'error', text: 'Ошибка загрузки данных' })
  }
})
</script>

