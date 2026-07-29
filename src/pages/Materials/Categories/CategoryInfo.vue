<template>
  <div class="container mx-auto px-4 py-6">
    <div class="max-w-6xl mx-auto">
      <!-- Modern Header -->
      <div class="category-header">
        <div class="header-content">
          <div class="header-title-section">
            <div class="title-icon-wrapper">
              <div class="h-16 w-16 bg-primary/10 rounded border border-base-300 flex items-center justify-center">
                <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div class="title-content">
              <h1 class="category-title">{{ category?.name || 'Загрузка...' }}</h1>
              <p v-if="category?.parent_name" class="category-subtitle">
                Родительская категория: {{ category.parent_name }}
              </p>
              <p v-else class="category-subtitle">Корневая категория</p>
            </div>
          </div>
          
          <div class="header-actions">
            <button 
              class="action-btn action-btn-primary"
              @click="$router.push(`/material_categories/${categoryId}/edit`)"
            >
              <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Редактировать
            </button>
            <button 
              class="action-btn action-btn-outline"
              @click="$router.push('/material_categories')"
            >
              <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Назад
            </button>
          </div>
        </div>
      </div>

      <!-- Modern Info Cards -->
      <div v-if="category" class="info-grid">
        <!-- Основная информация -->
        <div class="info-card">
          <div class="card-header">
            <div class="card-icon">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 class="text-lg font-semibold">Основная информация</h2>
          </div>
          <div class="card-content">
            <div class="info-item">
              <label class="info-label">Название</label>
              <p class="info-value">{{ category.name }}</p>
            </div>
            <div v-if="category.parent_name" class="info-item">
              <label class="info-label">Родительская категория</label>
              <p class="info-value">{{ category.parent_name }}</p>
            </div>
            <div class="info-item">
              <label class="info-label">Полный путь</label>
              <p class="info-value path-value">{{ category.full_path }}</p>
            </div>
          </div>
        </div>

        <!-- Статистика -->
        <div class="info-card">
          <div class="card-header">
            <div class="card-icon">
              <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 class="text-lg font-semibold">Статистика</h2>
          </div>
          <div class="card-content">
            <div class="stat-item">
              <div class="stat-icon">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-title">Материалов</div>
                <div class="stat-value font-mono">{{ category.materials_count }}</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-title">Подкатегорий</div>
                <div class="stat-value font-mono">{{ category.children_count }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Даты -->
        <div class="info-card">
          <div class="card-header">
            <div class="card-icon">
              <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 class="text-lg font-semibold">Даты</h2>
          </div>
          <div class="card-content">
            <div class="info-item">
              <label class="info-label">Создано</label>
              <p class="info-value font-mono">{{ formatDate(category.created_at) }}</p>
            </div>
            <div class="info-item">
              <label class="info-label">Обновлено</label>
              <p class="info-value font-mono">{{ formatDate(category.updated_at) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modern Subcategories -->
      <div v-if="childCategories.length > 0" class="subcategories-section">
        <div class="section-header">
          <div class="section-icon">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 class="section-title">Подкатегории ({{ childCategories.length }})</h2>
        </div>
        <div class="subcategories-grid">
          <div 
            v-for="child in childCategories" 
            :key="child.id"
            class="subcategory-card"
            @click="$router.push(`/material_categories/${child.id}`)"
          >
            <div class="subcategory-icon">
              <div class="h-12 w-12 bg-primary/10 rounded border border-base-300 flex items-center justify-center">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div class="subcategory-content">
              <h3 class="subcategory-name">{{ child.name }}</h3>
              <div class="subcategory-stats">
                <div class="stat-badge">
                  <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span><span class="font-mono">{{ child.materials_count }}</span> материалов</span>
                </div>
                <div class="stat-badge">
                  <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span><span class="font-mono">{{ child.children_count }}</span> подкатегорий</span>
                </div>
              </div>
            </div>
            <div class="subcategory-arrow">
              <svg class="w-5 h-5 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Материалы в категории -->
      <div v-if="category && category.materials_count > 0" class="materials-section">
        <div class="materials-content">
          <GenericList
            :store="materialsStore"
            :config="materialsListConfig"
            @action="handleMaterialAction"
          />
        </div>
      </div>

      <!-- Пустая категория -->
      <div v-else-if="category && category.materials_count === 0 && category.children_count === 0" class="rounded">
        <div class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-subtle mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 class="text-lg font-semibold mb-2">Категория пуста</h3>
          <p class="text-muted mb-4">
            В этой категории пока нет материалов и подкатегорий.
          </p>
          <button 
            class="btn btn-primary"
            @click="$router.push('/materials/create')"
          >
            Добавить материал
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMaterialCategoriesStore } from '@/stores/materialCategories'
import { useMaterialsStore } from '@/stores/materials'
import { usePermissions } from '@/composables/usePermissions'
import GenericList from '@/components/GenericList.vue'
import MaterialCard from '@/components/cards/MaterialCard.vue'
import { formatDate } from '@/utils/formatters'
import type { Material } from '@/api/types'
import type { GenericListConfig } from '@/types/generic'
const route = useRoute()
const router = useRouter()
const materialCategoriesStore = useMaterialCategoriesStore()
const materialsStore = useMaterialsStore()

const categoryId = computed(() => Number(route.params.id))
// F-916: сначала .current (результат fetchOne — гарантированно ЭТА категория), затем items.find.
// Раньше читали ТОЛЬКО items.find → если категории нет на загруженной странице пагинации, страница
// висела в «Загрузка...» (store-shared-pollution / усечение).
const category = computed(() =>
  (materialCategoriesStore.current?.id === categoryId.value ? materialCategoriesStore.current : null)
  || materialCategoriesStore.items.find(c => c.id === categoryId.value)
)

// Подкатегории
const childCategories = computed(() => 
  materialCategoriesStore.items.filter(c => c.parent === categoryId.value)
)

// Права доступа
// ✅ RBAC: используем permissions
const { can } = usePermissions()
const canEdit = computed(() => can('material_categories', 'edit'))

// Конфигурация списка материалов - показываем только материалы категории без фильтров
const materialsListConfig = computed<GenericListConfig<Material>>(() => ({
  title: 'Материалы в категории',
  subtitle: `Категория: ${category.value?.name || ''}`,
  icon: 'category',
  showCreate: false, // Не показываем кнопку создания на странице категории
  showStats: false, // Убираем статистику, так как показываем только материалы категории
  exportable: false, // Убираем кнопку экспорта на странице категории
  loadingText: 'Загрузка материалов...',
  emptyText: 'Нет материалов в этой категории',
  emptyTitle: 'Нет материалов',
  emptySubtitle: 'В этой категории пока нет материалов',
  filterColumns: 0, // Убираем фильтры - показываем только материалы категории
  columns: [
    { key: 'name', label: 'Название', sortable: true },
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'unit_code', label: 'Единица', sortable: true }
  ],
  filters: [], // Убираем все фильтры - показываем только материалы категории
  actions: [
    {
      key: 'view',
      label: 'Просмотр',
      class: 'btn-outline'
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
      confirm: (item: Material) => `Удалить материал "${item.name}"?`
    }
  ],
  mobileCardComponent: MaterialCard,
  mobileCardProp: 'material'
}))

// Обработчик действий с материалами
async function handleMaterialAction(action: string, item: Material) {
  if (action === 'view') {
    // Перенаправляем на редактирование, так как отдельной страницы просмотра нет
    router.push(`/materials/${item.id}/edit`)
  } else if (action === 'edit') {
    router.push(`/materials/${item.id}/edit`)
  } else if (action === 'delete') {
    if (confirm(`Удалить материал "${item.name}"?`)) {
      try {
        await materialsStore.remove(item.id)
        // Обновляем список после удаления
        await materialsStore.fetchList()
        // F-891: перечитываем и саму категорию — иначе карточка «Материалов» (materials_count)
        // остаётся устаревшей после удаления материала (categoryInfo не обновлялся).
        await materialCategoriesStore.fetchOne(categoryId.value)
      } catch (error) {
        console.error('Error deleting material:', error)
      }
    }
  }
}

// Устанавливаем фильтр по категории при загрузке и изменении категории
watch(
  () => categoryId.value,
  async (newId) => {
    if (newId) {
      // Устанавливаем фильтр по категории
      await materialsStore.setFilters({ category: String(newId) })
      await materialsStore.fetchList()
    }
  },
  { immediate: true }
)

// Загрузка данных
onMounted(async () => {
  // F-916 (класс F-718): полный список — подкатегории (childCategories = items.filter) и lookup
  // категории иначе усекались бы дефолтной пагинацией (~20). Грузим безусловно (guard length===0
  // оставлял усечённый/чужой стор).
  await materialCategoriesStore.fetchList({ page_size: 1000 } as any)
  
  // Загружаем данные конкретной категории
  try {
    await materialCategoriesStore.fetchOne(categoryId.value)
  } catch (error) {
    console.error('Error loading category:', error)
    router.push('/material_categories')
  }
  
  // Загружаем материалы с фильтром по категории
  if (categoryId.value) {
    await materialsStore.setFilters({ category: String(categoryId.value) })
    await materialsStore.fetchList()
  }
})
</script>

<style scoped>
/* Modern Header Styles */
.category-header {
  background: hsl(var(--b1));
  border: 1px solid hsl(var(--b3));
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  margin-bottom: 2rem;
}

.category-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: hsl(var(--p));
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem;
  gap: 2rem;
}

.header-title-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
  min-width: 0;
}

.title-icon-wrapper {
  flex-shrink: 0;
}

.title-content {
  flex: 1;
  min-width: 0;
}

.category-title {
  font-size: 2rem;
  font-weight: 700;
  color: hsl(var(--bc));
  margin: 0;
  line-height: 1.2;
}

.category-subtitle {
  margin: 0.5rem 0 0 0;
  color: hsl(var(--tx-2));
  font-size: 1rem;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  position: relative;
  text-decoration: none;
}

.action-btn-primary {
  background: hsl(var(--p));
  color: hsl(var(--pc));
}

.action-btn-primary:hover:not(:disabled) {
  background: hsl(var(--p) / 0.9);
}

.action-btn-outline {
  background: transparent;
  color: hsl(var(--tx-2));
  border: 1px solid hsl(var(--b3));
}

.action-btn-outline:hover:not(:disabled) {
  background: hsl(var(--b2));
  color: hsl(var(--p));
  border-color: hsl(var(--p));
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

/* Info Grid Styles */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.info-card {
  background: hsl(var(--b1));
  border: 1px solid hsl(var(--b3));
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: hsl(var(--p));
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid hsl(var(--b3));
}

.card-icon {
  flex-shrink: 0;
}


.card-content {
  padding: 1.5rem;
}

.info-item {
  margin-bottom: 1rem;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--tx-2));
  margin-bottom: 0.25rem;
}

.info-value {
  font-size: 1rem;
  color: hsl(var(--bc));
  margin: 0;
  word-break: break-word;
}

.path-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  background: hsl(var(--b2));
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid hsl(var(--b3));
}

/* Stat Items */
.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-icon {
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 0.875rem;
  color: hsl(var(--tx-2));
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: hsl(var(--p));
}

/* Subcategories Section */
.subcategories-section {
  background: hsl(var(--b1));
  border: 1px solid hsl(var(--b3));
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  margin-bottom: 2rem;
}

.subcategories-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: hsl(var(--p));
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid hsl(var(--b3));
}

.section-icon {
  flex-shrink: 0;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: hsl(var(--bc));
  margin: 0;
}

.subcategories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
}

.subcategory-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: hsl(var(--b2));
  border: 1px solid hsl(var(--b3));
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.subcategory-card:hover {
  border-color: hsl(var(--p));
}

.subcategory-icon {
  flex-shrink: 0;
}

.subcategory-content {
  flex: 1;
  min-width: 0;
}

.subcategory-name {
  font-size: 1rem;
  font-weight: 600;
  color: hsl(var(--bc));
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.subcategory-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: hsl(var(--tx-2));
}

.subcategory-arrow {
  flex-shrink: 0;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.subcategory-card:hover .subcategory-arrow {
  opacity: 1;
  transform: translateX(4px);
}

/* Materials Section */
.materials-section {
  background: hsl(var(--b1));
  border: 1px solid hsl(var(--b3));
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  margin-bottom: 2rem;
}

.materials-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: hsl(var(--p));
}

.materials-content {
  padding: 0.75rem;
}

@media (min-width: 768px) {
  .materials-content {
    padding: 1.5rem;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
  }
  
  .header-actions {
    justify-content: flex-end;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .subcategories-grid {
    grid-template-columns: 1fr;
  }
  
  .category-title {
    font-size: 1.5rem;
  }
}
</style>
