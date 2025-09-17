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
    <div class="flex gap-2 items-end">
      <FormField
        v-model="materialsStore.filters.search"
        type="input"
        placeholder="Поиск по названию, SKU, категории"
        @keyup.enter="handleSearch"
        class="flex-1"
      />
      <FormField
        v-model="materialsStore.filters.ordering"
        type="select"
        :options="orderingOptions"
        @change="handleSearch"
      />
      <button 
        class="btn btn-outline btn-sm" 
        @click="handleSearch"
        :disabled="materialsStore.loading"
      >
        Применить
      </button>
    </div>

    <!-- Error message -->
    <div v-if="materialsStore.error" class="alert alert-error">
      <span>{{ materialsStore.error }}</span>
      <button class="btn btn-sm btn-ghost" @click="materialsStore.clearError()">×</button>
    </div>

    <!-- Table -->
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
        <img 
          v-if="value" 
          :src="value" 
          alt="Фото материала" 
          class="h-10 w-10 object-cover rounded"
        />
        <span v-else class="opacity-60 text-sm">нет</span>
      </template>

      <!-- Custom status cell -->
      <template #cell-is_active="{ value }">
        <span 
          class="badge" 
          :class="(value ?? true) ? 'badge-success' : 'badge-ghost'"
        >
          {{ (value ?? true) ? 'Активен' : 'Выключен' }}
        </span>
      </template>
    </Table>

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
import { useUiStore } from '@/stores/ui'
import Modal from '@/components/Modal.vue'
import Table from '@/components/Table.vue'
import FormField from '@/components/FormField.vue'
import Pagination from '@/components/Pagination.vue'

const router = useRouter()
const auth = useAuthStore()
const materialsStore = useMaterialsStore()
const ui = useUiStore()

// Computed
const canEdit = computed(() => {
  const role = auth.role as Me['role'] | undefined
  return role === 'admin' || role === 'director'
})

// Table configuration
const columns = [
  { key: 'id', title: 'ID', sortable: true, class: 'w-16' },
  { key: 'photo_url', title: 'Фото', sortable: false, class: 'w-20' },
  { key: 'name', title: 'Название', sortable: true },
  { key: 'sku', title: 'SKU', sortable: true, class: 'w-24' },
  { key: 'category_name', title: 'Категория', sortable: false },
  { key: 'default_unit_code', title: 'Ед.', sortable: false, class: 'w-16' },
  { key: 'is_active', title: 'Статус', sortable: false, class: 'w-24' }
]

const actions = computed(() => {
  if (!canEdit.value) return []
  
  return [
    {
      key: 'edit',
      label: 'Изменить',
      class: 'btn-primary btn-xs'
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
  { value: '-id', label: 'ID ↓' }
]

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
      ordering: materialsStore.filters.ordering
    })
  } catch (error) {
    ui.toast({ type: 'error', text: 'Ошибка поиска материалов' })
  }
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
    await materialsStore.fetchList()
  } catch (error) {
    ui.toast({ type: 'error', text: 'Ошибка загрузки материалов' })
  }
})
</script>

