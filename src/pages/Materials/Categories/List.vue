<template>
  <div class="list-container">
    <!-- GenericList Component -->
    <GenericList
      :store="materialCategoriesStore"
      :config="listConfig"
      @create="openCreate"
      @action="handleAction"
    >
      <!-- Custom column for category name with hierarchy -->
      <template #column-name="{ item, value }">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center">
            <div class="h-10 w-10 bg-primary/10 rounded border flex items-center justify-center">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <div class="flex flex-col">
            <span class="font-medium text-base-content">{{ value }}</span>
            <span v-if="item.parent_name" class="text-sm text-muted">
              Родительская: {{ item.parent_name }}
            </span>
            <span v-else class="text-sm text-muted">Корневая категория</span>
          </div>
        </div>
      </template>

      <!-- Custom column for statistics -->
      <template #column-materials_count="{ value }">
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1">
            <svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span class="font-medium text-base-content font-mono">{{ value }}</span>
          </div>
          <span class="text-sm text-muted">материалов</span>
        </div>
      </template>

      <!-- Custom column for children count -->
      <template #column-children_count="{ value }">
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1">
            <svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span class="font-medium text-base-content font-mono">{{ value }}</span>
          </div>
          <span class="text-sm text-muted">подкатегорий</span>
        </div>
      </template>
    </GenericList>

    <!-- Category Form Modal -->
    <Modal v-model="modalOpen" :title="current ? 'Редактировать категорию' : 'Новая категория'" size="2xl">
      <CategoryForm 
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
import type { MaterialCategory } from '@/api/types'
import type { GenericListConfig } from '@/types/generic'
import CategoryForm from './CategoryForm.vue'
import { usePermissions } from '@/composables/usePermissions'
import { useMaterialCategoriesStore } from '@/stores/materialCategories'
import Modal from '@/components/Modal.vue'
import GenericList from '@/components/GenericList.vue'
import MaterialCategoryCard from '@/components/cards/MaterialCategoryCard.vue'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useEditQuery } from '@/composables/useEditQuery'

const router = useRouter()
const materialCategoriesStore = useMaterialCategoriesStore()

// Используем новый композабл для обработки ошибок
const { handleLoadingError, handleDeleteError } = useErrorHandler()

// Computed
// ✅ RBAC: используем permissions
const { can, canExportReports } = usePermissions()
const canEdit = computed(() => can('material_categories', 'edit'))

// Parent category filter options
const parentFilterOptions = computed(() => [
  { value: '', label: 'Все категории' },
  { value: 'null', label: 'Без родительской категории' },
  ...materialCategoriesStore.selectOptions
])

// GenericList configuration
const listConfig = computed<GenericListConfig<MaterialCategory>>(() => ({
  title: 'Категории материалов',
  subtitle: 'Управление категориями материалов и их иерархией',
  icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  showCreate: canEdit.value,
  createText: 'Добавить категорию',
  canCreate: canEdit.value,
  showStats: true,
  exportable: canExportReports.value, // ✅ RBAC: контроль экспорта через permissions
  exportFilename: 'material-categories',
  exportUrl: '/api/v1/material-categories/',
  loadingText: 'Загрузка категорий...',
  emptyText: 'Нет категорий',
  emptyTitle: 'Нет категорий',
  emptySubtitle: 'Создайте первую категорию для организации материалов',
  filterColumns: 2,
  columns: [
    { key: 'name', label: 'Название', sortable: true },
    { key: 'parent_name', label: 'Родительская категория', sortable: false },
    { key: 'materials_count', label: 'Материалов', sortable: false },
    { key: 'children_count', label: 'Подкатегорий', sortable: false },
    { key: 'created_at', label: 'Создано', sortable: true }
  ],
  filters: [
    {
      key: 'search',
      type: 'text',
      label: 'Поиск',
      placeholder: 'Название категории'
    },
    {
      key: 'parent',
      type: 'select',
      label: 'Родительская категория',
      options: parentFilterOptions.value
    }
  ],
  actions: [
    {
      key: 'view',
      label: 'Просмотр',
      class: 'btn-ghost',
      disabled: () => false
    },
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
      confirm: (item: MaterialCategory) => `Удалить категорию "${item.name}"?`
    }
  ],
  mobileCardComponent: MaterialCategoryCard,
  mobileCardProp: 'category'
}))

// Modal state
const modalOpen = ref(false)
const current = ref<MaterialCategory | null>(null)

// Methods
function openCreate() {
  current.value = null
  modalOpen.value = true
}

function openEdit(category: MaterialCategory) {
  current.value = category
  modalOpen.value = true
}

async function handleAction(action: string, item: MaterialCategory) {
  switch (action) {
    case 'view':
      router.push(`/material_categories/${item.id}`)
      break
    case 'edit':
      openEdit(item)
      break
    case 'delete':
      await handleDelete(item)
      break
  }
}

async function handleDelete(category: MaterialCategory) {
  if (!confirm(`Удалить категорию "${category.name}"?`)) {return}
  
  try {
    await materialCategoriesStore.remove(category.id)
  } catch (error) {
    await handleDeleteError(error, 'category', category.id)
  }
}

async function onSaved() {
  modalOpen.value = false
  current.value = null
  await materialCategoriesStore.fetchList()
}

// Lifecycle
onMounted(async () => {
  try {
    await materialCategoriesStore.fetchList()
  } catch (error) {
    await handleLoadingError(error, 'material-categories')
  }
})

// F-507: /:id/edit ведёт сюда с ?edit=:id — открываем модалку уже с записью
// (форма получает данные только через :initial, роутом рендерилась пустой — см. F-505).
useEditQuery(materialCategoriesStore, openEdit)
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>