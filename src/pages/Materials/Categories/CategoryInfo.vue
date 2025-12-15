<template>
  <div class="container mx-auto px-4 py-6">
    <div class="max-w-6xl mx-auto">
      <!-- Modern Header -->
      <div class="category-header">
        <div class="header-content">
          <div class="header-title-section">
            <div class="title-icon-wrapper">
              <div class="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl border flex items-center justify-center">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              Назад к списку
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
              <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 class="text-lg font-semibold">Статистика</h2>
          </div>
          <div class="card-content">
            <div class="stat-item">
              <div class="stat-icon">
                <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-title">Материалов</div>
                <div class="stat-value">{{ category.materials_count }}</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">
                <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div class="stat-content">
                <div class="stat-title">Подкатегорий</div>
                <div class="stat-value">{{ category.children_count }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Даты -->
        <div class="info-card">
          <div class="card-header">
            <div class="card-icon">
              <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 class="text-lg font-semibold">Даты</h2>
          </div>
          <div class="card-content">
            <div class="info-item">
              <label class="info-label">Создано</label>
              <p class="info-value">{{ formatDate(category.created_at) }}</p>
            </div>
            <div class="info-item">
              <label class="info-label">Обновлено</label>
              <p class="info-value">{{ formatDate(category.updated_at) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modern Subcategories -->
      <div v-if="childCategories.length > 0" class="subcategories-section">
        <div class="section-header">
          <div class="section-icon">
            <svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div class="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl border flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div class="subcategory-content">
              <h3 class="subcategory-name">{{ child.name }}</h3>
              <div class="subcategory-stats">
                <div class="stat-badge">
                  <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span>{{ child.materials_count }} материалов</span>
                </div>
                <div class="stat-badge">
                  <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>{{ child.children_count }} подкатегорий</span>
                </div>
              </div>
            </div>
            <div class="subcategory-arrow">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div v-else-if="category && category.materials_count === 0 && category.children_count === 0" class="bg-base-100 rounded-lg">
        <div class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-base-content/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 class="text-lg font-semibold mb-2">Категория пуста</h3>
          <p class="text-base-content/70 mb-4">
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
import { useAuthStore } from '@/stores/auth'
import GenericList from '@/components/GenericList.vue'
import MaterialCard from '@/components/cards/MaterialCard.vue'
import { formatDate } from '@/utils/formatters'
import type { MaterialCategory } from '@/api/types'
import type { Material } from '@/api/types'
import type { GenericListConfig } from '@/types/generic'
import type { Me } from '@/api/types/common'

const route = useRoute()
const router = useRouter()
const materialCategoriesStore = useMaterialCategoriesStore()
const materialsStore = useMaterialsStore()
const auth = useAuthStore()

const categoryId = computed(() => Number(route.params.id))
const category = computed(() => materialCategoriesStore.items.find(c => c.id === categoryId.value))

// Подкатегории
const childCategories = computed(() => 
  materialCategoriesStore.items.filter(c => c.parent === categoryId.value)
)

// Права доступа
const canEdit = computed(() => {
  const role = auth.role as Me['role'] | undefined
  return role === 'admin' || role === 'manager' || role === 'warehouse'
})

// Конфигурация списка материалов - показываем только материалы категории без фильтров
const materialsListConfig = computed<GenericListConfig<Material>>(() => ({
  title: 'Материалы в категории',
  subtitle: `Категория: ${category.value?.name || ''}`,
  icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  showCreate: false, // Не показываем кнопку создания на странице категории
  showStats: false, // Убираем статистику, так как показываем только материалы категории
  exportable: false, // Убираем кнопку экспорта на странице категории
  loadingText: 'Загрузка материалов...',
  emptyText: 'Нет материалов в этой категории',
  emptyTitle: 'Нет материалов',
  emptySubtitle: 'В этой категории пока нет материалов',
  filterColumns: 0, // Убираем фильтры - показываем только материалы категории
  columns: [
    { key: 'id', label: 'ID', sortable: true },
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
  // Загружаем список категорий
  if (materialCategoriesStore.items.length === 0) {
    await materialCategoriesStore.fetchList()
  }
  
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
  background: linear-gradient(135deg, hsl(var(--b1)) 0%, hsl(var(--b2)) 100%);
  border: 1px solid hsl(var(--b3));
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
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
  height: 4px;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
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
  color: hsl(var(--bc) / 0.7);
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
  border-radius: 0.875rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: none;
  position: relative;
  overflow: hidden;
  text-decoration: none;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.action-btn:hover::before {
  opacity: 1;
}

.action-btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.action-btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.action-btn-outline {
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.action-btn-outline:hover:not(:disabled) {
  background: #f1f5f9;
  color: #3b82f6;
  border-color: #3b82f6;
  transform: translateY(-1px);
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
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
}

:root.dark .info-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.8) 100%);
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
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
  color: #64748b;
  margin-bottom: 0.25rem;
}

.info-value {
  font-size: 1rem;
  color: #1e293b;
  margin: 0;
  word-break: break-word;
}

:root.dark .info-value {
  color: #e2e8f0;
}

.path-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  background: #f1f5f9;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

:root.dark .path-value {
  background: rgba(51, 65, 85, 0.5);
  border-color: rgba(148, 163, 184, 0.2);
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
  color: #64748b;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Subcategories Section */
.subcategories-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  margin-bottom: 2rem;
}

:root.dark .subcategories-section {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.8) 100%);
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.subcategories-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #8b5cf6 0%, #ec4899 50%, #f59e0b 100%);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
}

.section-icon {
  flex-shrink: 0;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

:root.dark .section-title {
  color: #e2e8f0;
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
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

:root.dark .subcategory-card {
  background: linear-gradient(135deg, rgba(51, 65, 85, 0.5) 0%, rgba(71, 85, 105, 0.5) 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.subcategory-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.subcategory-card:hover::before {
  opacity: 1;
}

.subcategory-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.15);
  border-color: #8b5cf6;
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
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

:root.dark .subcategory-name {
  color: #e2e8f0;
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
  color: #64748b;
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
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  margin-bottom: 2rem;
}

:root.dark .materials-section {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.8) 100%);
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.materials-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6 0%, #06b6d4 50%, #10b981 100%);
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
