<template>
  <div class="space-y-6">
      <!-- Loading state -->
      <div v-if="loading" class="card bg-base-100 shadow border">
        <div class="card-body">
          <LoadingSpinner text="Загрузка информации об объекте..." :overlay="false" />
        </div>
      </div>

      <!-- Not found state -->
      <div v-else-if="!object" class="card bg-base-100 shadow border">
        <div class="card-body text-center space-y-4">
          <svg class="w-16 h-16 mx-auto text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h2 class="text-2xl font-semibold">Объект не найден</h2>
          <p class="text-base-content/70">
            Возможно объект был удалён или у вас нет доступа к его просмотру.
          </p>
          <button class="btn btn-primary" @click="router.push('/objects')">
            Вернуться к списку объектов
          </button>
        </div>
      </div>

      <!-- Main content -->
      <div v-else>
        <!-- Modern Header -->
        <div class="object-header">
          <div class="header-content">
            <div class="header-title-section">
              <div class="title-icon-wrapper">
                <div class="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl border flex items-center justify-center">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div class="title-content">
                <h1 class="object-title">{{ object.name }}</h1>
                <p class="object-subtitle">
                  <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 12.414A4 4 0 1012.414 13.414l4.243 4.243a1 1 0 001.414-1.414z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {{ object.address || 'Адрес не указан' }}
                </p>
                <div class="flex flex-wrap gap-2 mt-2">
                  <span class="badge text-xs px-3 py-1.5" :class="statusBadgeClass">
                    {{ statusLabel }}
                  </span>
                  <span v-if="currentStageMeta" class="badge badge-outline text-xs px-3 py-1.5">
                    {{ currentStageMeta.label }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="header-actions">
              <button 
                v-if="canEdit"
                class="action-btn action-btn-primary"
                @click="openEditModal"
              >
                <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Редактировать
              </button>
              <button 
                class="action-btn action-btn-outline"
                @click="router.push('/objects')"
              >
                <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Назад к списку
              </button>
            </div>
          </div>
        </div>

        <!-- Unified Info Card -->
        <div class="info-card">
          <div class="card-header">
            <div class="card-icon">
              <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 class="card-title">Информация об объекте</h2>
          </div>
          <div class="card-content">
            <div class="info-grid-unified">
              <!-- Основная информация -->
              <div class="info-section">
                <h3 class="info-section-title">Основная информация</h3>
                <div class="info-item">
                  <label class="info-label">Ответственный</label>
                  <p class="info-value">{{ responsibleName }}</p>
                </div>
                <div class="info-item">
                  <label class="info-label">Этап работ</label>
                  <p class="info-value">
                    {{ currentStageMeta?.label || 'Не указан' }}
                    <span v-if="currentStageMeta?.description" class="info-hint">
                      {{ currentStageMeta.description }}
                    </span>
                  </p>
                </div>
                <div class="info-item">
                  <label class="info-label">Статус объекта</label>
                  <p class="info-value">{{ statusLabel }}</p>
                </div>
                <div class="info-item">
                  <label class="info-label">Ключевое лицо</label>
                  <p class="info-value">{{ object.key_person_name || 'Не указано' }}</p>
                </div>
              </div>

              <!-- Статистика -->
              <div class="info-section">
                <h3 class="info-section-title">Статистика</h3>
                <div class="stat-item">
                  <div class="stat-icon">
                    <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h2l3.6 7.59a1 1 0 00.9.59H17a1 1 0 00.95-.68L21 7H6" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 13a4 4 0 11-8 0" />
                    </svg>
                  </div>
                  <div class="stat-content">
                    <div class="stat-title">Закупок</div>
                    <div class="stat-value">{{ objectStats.purchasesCount }}</div>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon">
                    <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div class="stat-content">
                    <div class="stat-title">Материалов</div>
                    <div class="stat-value">{{ objectStats.materialsCount }}</div>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon">
                    <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h11m0 0l-4-4m4 4l-4 4m13-7v10" />
                    </svg>
                  </div>
                  <div class="stat-content">
                    <div class="stat-title">Списаний</div>
                    <div class="stat-value">{{ objectStats.writeoffsCount }}</div>
                  </div>
                </div>
              </div>

              <!-- Контакты и расположение -->
              <div class="info-section">
                <h3 class="info-section-title">Контакты и расположение</h3>
                <div class="info-item">
                  <label class="info-label">Контакты ключевого лица</label>
                  <p class="info-value">{{ object.key_person_contacts || 'Не указаны' }}</p>
                </div>
                <div class="info-item">
                  <label class="info-label">Ссылка на карту</label>
                  <p class="info-value">
                    <a
                      v-if="object.location_url"
                      :href="object.location_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="link link-primary break-all"
                    >
                      Открыть карту
                    </a>
                    <span v-else>Не указана</span>
                  </p>
                </div>
              </div>

              <!-- Сроки и прогресс -->
              <div class="info-section">
                <h3 class="info-section-title">Сроки и прогресс</h3>
                <div class="info-item">
                  <label class="info-label">Дата начала</label>
                  <p class="info-value">{{ formatDate(object.date_start || null) }}</p>
                </div>
                <div class="info-item">
                  <label class="info-label">Дата окончания</label>
                  <p class="info-value">{{ formatDate(object.date_end || null) }}</p>
                </div>
                <div class="info-item" v-if="projectProgress !== null">
                  <label class="info-label">Прогресс выполнения</label>
                  <div class="mt-2">
                    <div class="progress-bar">
                      <div
                        class="progress-bar__value"
                        :style="{ width: `${projectProgress}%` }"
                      />
                    </div>
                    <p class="text-sm text-base-content/70 mt-1">
                      {{ projectProgress }}% завершено
                    </p>
                  </div>
                </div>
              </div>

              <!-- Служебные данные -->
              <div class="info-section">
                <h3 class="info-section-title">Служебные данные</h3>
                <div class="info-item">
                  <label class="info-label">ID объекта</label>
                  <p class="info-value">#{{ object.id }}</p>
                </div>
                <div class="info-item">
                  <label class="info-label">Создан</label>
                  <p class="info-value">{{ formatDate(object.created_at) }}</p>
                </div>
                <div class="info-item">
                  <label class="info-label">Обновлён</label>
                  <p class="info-value">{{ formatDate(object.updated_at) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Быстрые действия -->
        <div class="quick-actions-section mt-8">
          <div class="section-header">
            <div class="section-icon">
              <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 class="section-title">Быстрые действия</h2>
          </div>
          <div class="quick-actions-grid">
            <div 
              v-for="action in quickActions" 
              :key="action.key"
              class="quick-action-card"
              @click="action.handler()"
            >
              <div class="quick-action-icon" :class="action.iconClass">
                <svg
                  v-if="action.key === 'purchases'"
                  class="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h2l3.6 7.59a1 1 0 00.9.59H17a1 1 0 00.95-.68L21 7H6" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 13a4 4 0 11-8 0" />
                </svg>
                <svg
                  v-else-if="action.key === 'balances'"
                  class="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm6 0v-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16" />
                </svg>
                <svg
                  v-else-if="action.key === 'writeoffs'"
                  class="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h11m0 0l-4-4m4 4l-4 4m13-7v10" />
                </svg>
                <svg
                  v-else
                  class="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 11V3a1 1 0 00-1-1H4a1 1 0 00-1 1v8m8 0a4 4 0 11-8 0m8 0h4m0 0h4M7 21v-4m4 4v-8m4 8V9m4 12V5" />
                </svg>
              </div>
              <div class="quick-action-content">
                <h3 class="quick-action-title">{{ action.title }}</h3>
                <p class="quick-action-description">{{ action.description }}</p>
              </div>
              <div class="quick-action-arrow">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

    <!-- Modal for editing -->
    <Modal v-model="editModalOpen" title="Редактировать объект" size="lg" :closable="true">
      <ObjectForm :initial="object" @saved="onObjectSaved" @cancel="editModalOpen = false" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Object as SiteObject } from '@/api/types'
import { useObjectsStore } from '@/stores/objects'
import { usePurchasesStore } from '@/stores/purchases'
import { getByObject as getPurchasesByObject } from '@/stores/purchases'
import { useWriteOffsStore } from '@/stores/writeOffs'
import { getByObject as getWriteOffsByObject } from '@/stores/writeOffs'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/utils/formatters'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useErrorHandler } from '@/composables/useErrorHandler'
import Modal from '@/components/Modal.vue'
import ObjectForm from './ObjectForm.vue'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const router = useRouter()
const objectsStore = useObjectsStore
const purchasesStore = usePurchasesStore
const writeOffsStore = useWriteOffsStore
const authStore = useAuthStore()
const { handleLoadingError } = useErrorHandler()

const loading = ref(true)
const object = ref<SiteObject | null>(null)
const editModalOpen = ref(false)
const ui = useUiStore()

const objectId = computed(() => Number(route.params.id))

const stageDictionary: Record<
  string,
  { label: string; description: string }
> = {
  acceptance: { label: 'Приемка', description: 'Подготовка площадки и приём материалов' },
  request: { label: 'Заявка', description: 'Сбор потребностей и согласование' },
  delivery_fixed: { label: 'Доставка', description: 'Поставка материалов на объект' },
  post_rough: { label: 'После черновых', description: 'Работы после черновой отделки' },
  handover: { label: 'Сдача', description: 'Этап подготовки к передаче' }
}

const canEdit = computed(() => {
  const role = authStore.role
  return role === 'admin' || role === 'director' || role === 'coordinator' || role === 'site_manager'
})

const statusLabel = computed(() => (object.value?.is_active ? 'Активный объект' : 'Неактивный объект'))
const statusBadgeClass = computed(() => (object.value?.is_active ? 'badge-success' : 'badge-error'))
const currentStageMeta = computed(() => (object.value?.current_stage ? stageDictionary[object.value.current_stage] : null))

const responsibleName = computed(() => object.value?.responsible_name || 'Не назначен')

const projectProgress = computed(() => {
  if (!object.value?.date_start || !object.value?.date_end) {
    return null
  }
  const start = new Date(object.value.date_start)
  const end = new Date(object.value.date_end)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null
  }
  const now = new Date()
  if (now <= start) {return 0}
  if (now >= end) {return 100}
  return Math.min(100, Math.max(0, Math.round(((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100)))
})

// Статистика по объекту
const objectStats = computed(() => {
  if (!object.value) {
    return { purchasesCount: 0, materialsCount: 0, writeoffsCount: 0 }
  }
  
  const purchases = getPurchasesByObject(object.value.id)
  const writeoffs = getWriteOffsByObject(object.value.id)
  
  // Уникальные материалы из закупок
  const materialIds = new Set<number>()
  purchases.forEach(purchase => {
    purchase.items?.forEach(item => {
      if (item.material) {
        materialIds.add(item.material)
      }
    })
  })
  
  return {
    purchasesCount: purchases.length,
    materialsCount: materialIds.size,
    writeoffsCount: writeoffs.length
  }
})

const quickActions = computed(() => [
  {
    key: 'purchases',
    title: 'Закупки по объекту',
    description: 'Фильтрованные заявки и накладные',
    iconClass: 'quick-action-icon--primary',
    handler: () => {
      router.push({ path: '/purchases', query: { object: String(objectId.value) } })
    }
  },
  {
    key: 'balances',
    title: 'Остатки материалов',
    description: 'Состояние склада по объекту',
    iconClass: 'quick-action-icon--success',
    handler: () => {
      router.push({ path: '/balances', query: { object: String(objectId.value) } })
    }
  },
  {
    key: 'writeoffs',
    title: 'Списания',
    description: 'Расход материалов по объекту',
    iconClass: 'quick-action-icon--warning',
    handler: () => {
      router.push({ path: '/writeoffs', query: { object: String(objectId.value) } })
    }
  }
])

async function loadObject(id: number) {
  loading.value = true
  try {
    const data = await objectsStore.fetchOne(id)
    object.value = data
    
    // Загружаем связанные данные для статистики
    if (purchasesStore.items.length === 0) {
      await purchasesStore.fetchList({ object: id })
    } else {
      // Обновляем список закупок для этого объекта
      await purchasesStore.fetchList({ object: id })
    }
    
    if (writeOffsStore.items.length === 0) {
      await writeOffsStore.fetchList({ object: id })
    } else {
      await writeOffsStore.fetchList({ object: id })
    }
  } catch (error) {
    await handleLoadingError(error, 'object')
    router.push('/objects')
  } finally {
    loading.value = false
  }
}

watch(
  objectId,
  (id) => {
    if (!id || Number.isNaN(id)) {
      router.push('/objects')
      return
    }
    loadObject(id)
  },
  { immediate: true }
)

function openEditModal() {
  editModalOpen.value = true
}

async function onObjectSaved() {
  editModalOpen.value = false
  ui.toast({ type: 'success', text: 'Объект обновлен' })
  // Перезагружаем данные объекта
  await loadObject(objectId.value)
}

onBeforeUnmount(() => {
  // Cleanup if needed
})
</script>

<style scoped>
/* Modern Header Styles */
.object-header {
  background: linear-gradient(135deg, hsl(var(--b1)) 0%, hsl(var(--b2)) 100%);
  border: 1px solid hsl(var(--b3));
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  margin-bottom: 2rem;
}

:root.dark .object-header {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.object-header::before {
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

.object-title {
  font-size: 2rem;
  font-weight: 700;
  color: hsl(var(--bc));
  margin: 0;
  line-height: 1.2;
}

.object-subtitle {
  margin: 0.5rem 0 0 0;
  color: hsl(var(--bc) / 0.7);
  font-size: 1rem;
  line-height: 1.4;
  display: flex;
  align-items: center;
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

:root.dark .action-btn-outline {
  color: hsl(var(--bc) / 0.7);
  border-color: hsl(var(--b3));
}

.action-btn-outline:hover:not(:disabled) {
  background: #f1f5f9;
  color: #3b82f6;
  border-color: #3b82f6;
  transform: translateY(-1px);
}

:root.dark .action-btn-outline:hover:not(:disabled) {
  background: hsl(var(--b2));
  color: hsl(var(--p));
  border-color: hsl(var(--p));
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

/* Unified Info Grid Styles */
.info-grid-unified {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid rgba(59, 130, 246, 0.2);
}

:root.dark .info-section-title {
  color: #e2e8f0;
  border-bottom-color: rgba(148, 163, 184, 0.2);
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

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

:root.dark .card-title {
  color: #e2e8f0;
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

:root.dark .info-label {
  color: hsl(var(--bc) / 0.6);
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

.info-hint {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
}

:root.dark .info-hint {
  color: hsl(var(--bc) / 0.6);
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

:root.dark .stat-title {
  color: hsl(var(--bc) / 0.6);
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

:root.dark .stat-value {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Progress Bar */
.progress-bar {
  width: 100%;
  height: 0.75rem;
  border-radius: 9999px;
  background-color: hsl(var(--b3));
  overflow: hidden;
}

.progress-bar__value {
  height: 100%;
  background-color: hsl(var(--p));
  transition: all 0.3s ease;
}

/* Quick Actions Section */
.quick-actions-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  margin-bottom: 2rem;
}

:root.dark .quick-actions-section {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.8) 100%);
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.quick-actions-section::before {
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

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
}

.quick-action-card {
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

:root.dark .quick-action-card {
  background: linear-gradient(135deg, rgba(51, 65, 85, 0.5) 0%, rgba(71, 85, 105, 0.5) 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.quick-action-card::before {
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

.quick-action-card:hover::before {
  opacity: 1;
}

.quick-action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.15);
  border-color: #8b5cf6;
}

.quick-action-icon {
  height: 3rem;
  width: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-action-icon--primary {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.quick-action-icon--success {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
}

.quick-action-icon--warning {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.quick-action-icon--accent {
  background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%);
}

.quick-action-content {
  flex: 1;
  min-width: 0;
}

.quick-action-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
}

:root.dark .quick-action-title {
  color: #e2e8f0;
}

.quick-action-description {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

:root.dark .quick-action-description {
  color: hsl(var(--bc) / 0.7);
}

.quick-action-arrow {
  flex-shrink: 0;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.quick-action-card:hover .quick-action-arrow {
  opacity: 1;
  transform: translateX(4px);
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
  
  .info-grid-unified {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .quick-actions-grid {
    grid-template-columns: 1fr;
  }
  
  .object-title {
    font-size: 1.5rem;
  }
}
</style>
