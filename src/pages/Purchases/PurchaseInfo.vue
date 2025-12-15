<template>
  <div class="purchase-info" v-if="purchase">
    <!-- Единый блок для всех устройств -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <!-- Заголовок -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">
              {{ purchase.purchase_no || '#' + purchase.id }}
            </h1>
            <p class="text-sm text-gray-600 mt-1">{{ formatDate(purchase.date) }}</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" :class="statusClass">{{ statusLabel }}</span>
            <span class="text-lg font-semibold text-gray-900">{{ formatCurrency(purchase.total_amount) }}</span>
          </div>
        </div>
      </div>

      <!-- Основной контент -->
      <div class="p-6">
        <!-- Информация о закупке -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div class="space-y-1">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Объект</p>
            <p class="text-sm text-gray-900">{{ purchase.object_name || '—' }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Поставщик</p>
            <p class="text-sm text-gray-900">{{ purchase.supplier_name || '—' }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Ответственный</p>
            <p class="text-sm text-gray-900">{{ responsibleName(purchase.responsible) || '—' }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Валюта</p>
            <p class="text-sm text-gray-900">{{ purchase.currency || 'UZS' }}</p>
          </div>
          <div class="space-y-1" v-if="purchase.invoice_number">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Номер счета</p>
            <p class="text-sm text-gray-900">{{ purchase.invoice_number }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Позиций</p>
            <p class="text-sm text-gray-900">{{ purchase.items?.length || 0 }}</p>
          </div>
        </div>

        <!-- Комментарий -->
        <div v-if="purchase.comment" class="mb-8">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Комментарий</p>
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ purchase.comment }}</p>
          </div>
        </div>

        <!-- Позиции закупки -->
        <div class="mb-8">
          <h3 class="text-sm font-medium text-gray-900 mb-4">Позиции закупки</h3>
          <div v-if="purchase.items && purchase.items.length > 0">
            <!-- Desktop: Таблица -->
            <div class="hidden md:block overflow-hidden rounded-lg border border-gray-200">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Материал</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Единица</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Количество</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Цена</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Сумма</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="item in purchase.items" :key="item.id" class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm text-gray-900">{{ item.material_name || '—' }}</td>
                    <td class="px-4 py-3 text-sm text-gray-500">{{ item.unit_code || '—' }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 text-right font-mono">{{ formatNumberClean(item.quantity) }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 text-right font-mono">{{ formatCurrency(item.price) }}</td>
                    <td class="px-4 py-3 text-sm text-gray-900 text-right font-mono font-medium">{{ formatCurrency(item.amount) }}</td>
                  </tr>
                </tbody>
                <tfoot class="bg-gray-50">
                  <tr>
                    <td colspan="4" class="px-4 py-3 text-right text-sm font-medium text-gray-900">Итого:</td>
                    <td class="px-4 py-3 text-right text-sm font-bold text-gray-900">{{ formatCurrency(purchase.total_amount) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Mobile: Карточки -->
            <div class="md:hidden space-y-3">
              <div v-for="item in purchase.items" :key="item.id" class="bg-gray-50 rounded-lg p-4">
                <div class="space-y-3">
                  <div>
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Материал</p>
                    <p class="text-sm text-gray-900 mt-1">{{ item.material_name || '—' }}</p>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Единица</p>
                      <p class="text-sm text-gray-900 mt-1">{{ item.unit_code || '—' }}</p>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Количество</p>
                      <p class="text-sm text-gray-900 mt-1 font-mono">{{ formatNumberClean(item.quantity) }}</p>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Цена</p>
                      <p class="text-sm text-gray-900 mt-1 font-mono">{{ formatCurrency(item.price) }}</p>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Сумма</p>
                      <p class="text-sm text-gray-900 mt-1 font-mono font-bold">{{ formatCurrency(item.amount) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <p class="text-sm text-gray-500">Нет позиций</p>
          </div>
        </div>

        <!-- Фотографии -->
        <div v-if="hasPhotos">
          <h3 class="text-sm font-medium text-gray-900 mb-4">Фотографии ({{ allPhotos.length }})</h3>
          <div class="text-xs text-gray-500 mb-2">
            DEBUG: activePhotoType={{ activePhotoType }}, photoTypes={{ photoTypes }}, photosByType={{ getPhotosByType(activePhotoType).length }}
          </div>
          
          <!-- Табы для типов фото -->
          <div class="tabs tabs-boxed mb-4">
            <button 
              v-for="type in photoTypes" 
              :key="type"
              class="tab"
              :class="{ 'tab-active': activePhotoType === type }"
              @click="activePhotoType = type"
            >
              {{ getPhotoTypeLabel(type) }} ({{ getPhotosByType(type).length }})
            </button>
          </div>

          <!-- Фотографии по типам -->
          <div v-if="getPhotosByType(activePhotoType).length > 0">
            <!-- Desktop: Карусель -->
            <div class="hidden md:block">
              <div class="carousel carousel-center w-full space-x-4 bg-base-200 p-4 rounded-lg">
                <div 
                  v-for="(photo, index) in getPhotosByType(activePhotoType)" 
                  :key="photo.id"
                  class="carousel-item relative group"
                >
                  <img
                    :src="photo.url"
                    :alt="`Фото ${index + 1}`"
                    class="w-64 h-48 object-cover rounded-lg border border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200"
                    @click.stop="console.log('DEBUG: Photo clicked!', photo, index); openPhotoModal(photo, index)"
                  />
                  <div class="absolute top-2 right-2">
                    <span class="badge badge-sm" :class="getPhotoTypeClass(photo.type)">
                      {{ getPhotoTypeLabel(photo.type) }}
                    </span>
                  </div>
                  <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg pointer-events-none"></div>
                </div>
              </div>
            </div>

            <!-- Mobile: Сетка -->
            <div class="md:hidden grid grid-cols-2 gap-3">
              <div 
                v-for="(photo, index) in getPhotosByType(activePhotoType)" 
                :key="photo.id"
                class="relative group"
              >
                <img
                  :src="photo.url"
                  :alt="`Фото ${index + 1}`"
                  class="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-all duration-200"
                  @click.stop="console.log('DEBUG: Mobile photo clicked!', photo, index); openPhotoModal(photo, index)"
                />
                <div class="absolute top-1 right-1">
                  <span class="badge badge-xs" :class="getPhotoTypeClass(photo.type)">
                    {{ getPhotoTypeLabel(photo.type) }}
                  </span>
                </div>
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg pointer-events-none"></div>
              </div>
            </div>
          </div>
          
          <div v-else class="text-center py-8 text-gray-500">
            <p>Нет фотографий типа "{{ getPhotoTypeLabel(activePhotoType) }}"</p>
          </div>
        </div>
        
        <div v-else class="text-center py-8 text-gray-500">
          <p>Нет фотографий для этой закупки</p>
          <div class="text-xs mt-2">
            DEBUG: purchase={{ props.purchase?.id }}, photos={{ props.purchase?.photos?.length || 0 }}
          </div>
        </div>
      </div>
    </div>

    <!-- Photo Modal -->
    <div v-if="photoModalOpen" class="modal modal-open">
      <div class="modal-box max-w-6xl w-full h-full max-h-screen">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold">
            {{ getPhotoTypeLabel(selectedPhoto?.type) }} - {{ currentPhotoIndex + 1 }} из {{ currentPhotoList.length }}
          </h3>
          <button class="btn btn-sm btn-circle btn-ghost" @click="photoModalOpen = false">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div v-if="selectedPhoto" class="relative h-full">
          <!-- Навигация по фото -->
          <div v-if="currentPhotoList.length > 1" class="flex justify-between items-center mb-4">
            <button 
              class="btn btn-circle btn-outline"
              :disabled="currentPhotoIndex === 0"
              @click="previousPhoto"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            
            <div class="flex items-center gap-2">
              <span class="badge badge-primary">{{ getPhotoTypeLabel(selectedPhoto.type) }}</span>
              <span class="text-sm text-base-content/70">{{ currentPhotoIndex + 1 }} / {{ currentPhotoList.length }}</span>
            </div>
            
            <button 
              class="btn btn-circle btn-outline"
              :disabled="currentPhotoIndex === currentPhotoList.length - 1"
              @click="nextPhoto"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>

          <!-- Основное фото -->
          <div class="text-center bg-base-200 rounded-lg p-4 mb-4">
            <img
              :src="selectedPhoto.url"
              :alt="`Фото ${selectedPhoto.id}`"
              class="max-w-full max-h-[60vh] object-contain mx-auto rounded-lg shadow-lg"
            />
          </div>

          <!-- Миниатюры (только если больше 1 фото) -->
          <div v-if="currentPhotoList.length > 1" class="mb-4">
            <div class="carousel carousel-center w-full space-x-2 bg-base-200 p-2 rounded-lg">
              <div 
                v-for="(photo, index) in currentPhotoList" 
                :key="photo.id"
                class="carousel-item"
              >
                <img
                  :src="photo.url"
                  :alt="`Миниатюра ${index + 1}`"
                  class="w-16 h-16 object-cover rounded cursor-pointer border-2 transition-all duration-200"
                  :class="{ 'border-primary': index === currentPhotoIndex, 'border-transparent': index !== currentPhotoIndex }"
                  @click="selectPhoto(index)"
                />
              </div>
            </div>
          </div>

          <!-- Информация о фото -->
          <div class="bg-base-100 rounded-lg">
            <div class="">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-4">
                  <span class="badge" :class="getPhotoTypeClass(selectedPhoto.type)">
                    {{ getPhotoTypeLabel(selectedPhoto.type) }}
                  </span>
                  <span v-if="selectedPhoto.size_bytes" class="text-sm text-base-content/70">
                    Размер: {{ formatFileSize(selectedPhoto.size_bytes) }}
                  </span>
                </div>
                <div class="text-sm text-base-content/70">
                  ID: {{ selectedPhoto.id }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop" @click="photoModalOpen = false"></div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-2 mt-6">
      <button class="btn btn-outline" @click="$emit('close')">
        Закрыть
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import type { Purchase, PurchasePhoto, Employee } from '@/api/types'
import { formatDate, formatCurrency, formatNumberClean } from '@/utils/formatters'
import { useEmployeesStore } from '@/stores/employees'
import Modal from '@/components/Modal.vue'

interface Props {
  purchase: Purchase | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

// Stores
const employeesStore = useEmployeesStore()

// Photo modal state
const photoModalOpen = ref(false)
const selectedPhoto = ref<PurchasePhoto | null>(null)
const currentPhotoIndex = ref(0)
const currentPhotoList = ref<PurchasePhoto[]>([])
const activePhotoType = ref<'instructions' | 'report'>('instructions')

// Computed properties
const statusLabel = computed(() => {
  if (!props.purchase) {return '—'}
  switch (props.purchase.status) {
    case 'new': return 'Новая'
    case 'completed': return 'Выполнено'
    case 'cancelled': return 'Отменена'
    default: return '—'
  }
})

const statusClass = computed(() => {
  if (!props.purchase) {return ''}
  switch (props.purchase.status) {
    case 'new': return 'bg-blue-100 text-blue-800'
    case 'completed': return 'bg-green-100 text-green-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
})

const allPhotos = computed(() => {
  if (!props.purchase?.photos) {
    console.log('DEBUG: no photos in purchase', props.purchase)
    return []
  }
  console.log('DEBUG: allPhotos', props.purchase.photos)
  return props.purchase.photos
})

const hasPhotos = computed(() => {
  return allPhotos.value.length > 0
})

const photoTypes = computed(() => {
  const types = new Set<string>()
  allPhotos.value.forEach(photo => {
    if (photo.type) {types.add(photo.type)}
  })
  return Array.from(types) as ('instructions' | 'report')[]
})

const getPhotosByType = (type: string) => {
  const filtered = allPhotos.value.filter(photo => photo.type === type)
  console.log('DEBUG: getPhotosByType', type, filtered)
  return filtered
}

// Инициализация активного типа фото
watch(photoTypes, (newTypes) => {
  if (newTypes.length > 0 && !newTypes.includes(activePhotoType.value)) {
    activePhotoType.value = newTypes[0]
  }
}, { immediate: true })

// Methods
function responsibleName(id: number): string {
  const employee = employeesStore.items.find((e: Employee) => e.id === id)
  return employee ? `${employee.first_name || employee.username} ${employee.last_name || ''}`.trim() : '—'
}

function getPhotoTypeLabel(type?: string): string {
  switch (type) {
    case 'instructions': return 'Инструкции'
    case 'report': return 'Отчет'
    default: return 'Фото'
  }
}

function getPhotoTypeClass(type?: string): string {
  switch (type) {
    case 'instructions': return 'bg-blue-100 text-blue-800'
    case 'report': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function openPhotoModal(photo: PurchasePhoto, index: number = 0) {
  console.log('DEBUG: openPhotoModal called', { photo, index })
  selectedPhoto.value = photo
  currentPhotoIndex.value = index
  currentPhotoList.value = getPhotosByType(photo.type || 'instructions')
  console.log('DEBUG: currentPhotoList', currentPhotoList.value)
  photoModalOpen.value = true
  console.log('DEBUG: photoModalOpen set to true')
}

function nextPhoto() {
  if (currentPhotoIndex.value < currentPhotoList.value.length - 1) {
    currentPhotoIndex.value++
    selectedPhoto.value = currentPhotoList.value[currentPhotoIndex.value]
  }
}

function previousPhoto() {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--
    selectedPhoto.value = currentPhotoList.value[currentPhotoIndex.value]
  }
}

function selectPhoto(index: number) {
  currentPhotoIndex.value = index
  selectedPhoto.value = currentPhotoList.value[index]
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) {return '0 Bytes'}
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Клавиатурная навигация
function handleKeydown(event: KeyboardEvent) {
  if (!photoModalOpen.value) {return}
  
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      previousPhoto()
      break
    case 'ArrowRight':
      event.preventDefault()
      nextPhoto()
      break
    case 'Escape':
      event.preventDefault()
      photoModalOpen.value = false
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.purchase-info {
  max-height: 80vh;
  overflow-y: auto;
}

textarea.textarea[rows="1"],textarea.textarea[rows="2"] {
    min-height: auto !important;
  }
</style>
