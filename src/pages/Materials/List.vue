<template>
  <div class="list-container">
    <!-- GenericList Component -->
    <GenericList
      :store="materialsStore"
      :config="listConfig"
      @create="openCreate"
      @action="handleAction"
      @export="handleExport"
    >
      <!-- Header actions -->
      <template #header-actions>
        <!-- Основная навигация: кнопки для всех устройств -->
        <div class="flex items-center gap-2 md:gap-3 flex-wrap">
          <!-- Кнопка Категории - видна на всех устройствах -->
          <button 
            class="btn btn-outline hover:btn-secondary transition-all duration-300 btn-sm shadow-sm hover:shadow-md"
            @click="$router.push('/material_categories')"
          >
            <svg class="w-4 h-4 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span class="text-xs md:text-sm font-medium">Категории</span>
          </button>
          
          <!-- Кнопка Массовое добавление - только для desktop -->
          <button 
            v-if="canEdit"
            class="hidden md:flex btn btn-primary hover:btn-primary-focus transition-all duration-300 btn-sm shadow-sm hover:shadow-md hover:scale-105"
            @click="openBulkCreate"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="font-medium">Массовое добавление</span>
          </button>
          
          <!-- Кнопка Массово - только для mobile -->
          <button 
            v-if="canEdit"
            class="md:hidden btn btn-secondary btn-sm flex-1 min-w-[100px]"
            @click="openBulkCreate"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="text-xs font-medium">Массово</span>
          </button>
        </div>
      </template>
      <!-- Custom column for material name with photo -->
      <template #column-name="{ item, value }">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center">
            <img 
              v-if="item.photo_url" 
              :src="item.photo_url" 
              alt="Фото материала" 
              class="h-10 w-10 object-cover rounded border"
            />
            <div v-else class="h-10 w-10 bg-base-200 rounded border flex items-center justify-center">
              <svg class="w-5 h-5 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div class="flex flex-col">
            <span class="font-medium text-base-content">{{ value }}</span>
            <span v-if="item.sku" class="text-sm text-muted">SKU: {{ item.sku }}</span>
          </div>
        </div>
      </template>
    </GenericList>

    <!-- Material Form Modal -->
    <Modal v-model="modalOpen" :title="current ? 'Редактировать материал' : 'Новый материал'" size="3xl">
      <MaterialForm 
        :initial="current" 
        @saved="onSaved" 
        @cancel="modalOpen = false"
      />
    </Modal>

    <!-- Material Bulk Form Modal -->
    <MaterialBulkForm
      :is-open="bulkModalOpen"
      @close="bulkModalOpen = false"
      @success="onBulkSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Material } from '@/api/types'
import type { GenericListConfig } from '@/types/generic'
import MaterialForm from './MaterialForm.vue'
import MaterialBulkForm from './MaterialBulkForm.vue'
import { usePermissions } from '@/composables/usePermissions'
import { useMaterialsStore } from '@/stores/materials'
import { useMaterialCategoriesStore } from '@/stores/materialCategories'
import Modal from '@/components/Modal.vue'
import GenericList from '@/components/GenericList.vue'
import MaterialCard from '@/components/cards/MaterialCard.vue'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useEditQuery } from '@/composables/useEditQuery'
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/export'

const _router = useRouter()
const materialsStore = useMaterialsStore()
const materialCategoriesStore = useMaterialCategoriesStore()

// Используем новый композабл для обработки ошибок
const { handleLoadingError, handleDeleteError } = useErrorHandler()

// Computed
// ✅ RBAC: используем permissions
const { can, canExportReports } = usePermissions()
const canEdit = computed(() => can('materials', 'edit'))

// Category filter options
const categoryFilterOptions = computed(() => [
  { value: '', label: 'Все категории' },
  ...materialCategoriesStore.selectOptions
])

// GenericList configuration
const listConfig = computed<GenericListConfig<Material>>(() => ({
  title: 'Материалы',
  subtitle: 'Управление материалами и их характеристиками',
  icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  showCreate: canEdit.value,
  createText: 'Добавить материал',
  canCreate: canEdit.value,
  showStats: true,
  exportable: canExportReports.value, // ✅ RBAC: контроль экспорта через permissions
  exportFilename: 'materials',
  exportUrl: '/api/v1/materials/',
  loadingText: 'Загрузка материалов...',
  emptyText: 'Нет материалов',
  emptyTitle: 'Нет материалов',
  emptySubtitle: 'Создайте первый материал для начала работы',
  filterColumns: 3,
  columns: [
    { key: 'name', label: 'Название', sortable: true },
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'category_name', label: 'Категория', sortable: false }
  ],
  filters: [
    {
      key: 'name',
      type: 'text',
      label: 'Название',
      placeholder: 'Название материала'
    },
    {
      key: 'sku',
      type: 'text',
      label: 'SKU',
      placeholder: 'Артикул'
    },
    {
      key: 'category',
      type: 'select',
      label: 'Категория',
      options: categoryFilterOptions.value
    }
  ],
  actions: [
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
      permission: 'materials.delete', // F-863 (perm-audit): было disabled:!canEdit (право EDIT!) → fail-open для роли edit-без-delete
      confirm: (item: Material) => `Удалить материал "${item.name}"?`
    }
  ],
  mobileCardComponent: MaterialCard,
  mobileCardProp: 'material'
}))

// Modal state
const modalOpen = ref(false)
const bulkModalOpen = ref(false)
const current = ref<Material | null>(null)

// Methods
function openCreate() {
  current.value = null
  modalOpen.value = true
}

function openBulkCreate() {
  bulkModalOpen.value = true
}

function openEdit(material: Material) {
  current.value = material
  modalOpen.value = true
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
  } catch (error) {
    await handleLoadingError(error, 'materials')
  }
}

async function handleAction(action: string, item: Material) {
  switch (action) {
    case 'edit':
      openEdit(item)
      break
    case 'delete':
      await handleDelete(item)
      break
  }
}

async function handleDelete(material: Material) {
  if (!confirm(`Удалить материал "${material.name}"?`)) {return}
  
  try {
    await materialsStore.remove(material.id)
  } catch (error) {
    await handleDeleteError(error, 'material', material.id)
  }
}

async function onSaved() {
  modalOpen.value = false
  current.value = null
  await materialsStore.fetchList()
}

async function onBulkSaved() {
  bulkModalOpen.value = false
  await materialsStore.fetchList()
}

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      materialsStore.fetchList(),
      materialCategoriesStore.fetchList()
    ])
  } catch (error) {
    await handleLoadingError(error, 'materials')
  }
})

// F-507: /:id/edit ведёт сюда с ?edit=:id — открываем модалку уже с записью
// (форма получает данные только через :initial, роутом рендерилась пустой — см. F-505).
useEditQuery(materialsStore, openEdit)
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>

