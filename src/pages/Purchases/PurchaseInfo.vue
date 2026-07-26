<template>
  <div class="invoice-container" v-if="purchase" id="purchase-invoice">
    <!-- Кнопки действий (скрываются при печати) -->
    <div class="no-print actions-bar mb-4 flex justify-between items-center">
      <h2 class="text-xl font-semibold">Накладная №{{ purchase.purchase_no || purchase.id }}</h2>
      <div class="flex gap-2">
        <button class="btn btn-primary btn-sm" @click="handlePrint">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
          </svg>
          Печать
        </button>
      </div>
    </div>

    <!-- Накладная -->
    <div class="invoice-paper">
      <!-- Шапка накладной -->
      <div class="invoice-header">
        <div class="invoice-header-left">
          <h1 class="invoice-title">НАКЛАДНАЯ</h1>
          <div class="invoice-number">
            <span class="label">№</span>
            <span class="value font-mono">{{ purchase.purchase_no || purchase.id }}</span>
          </div>
        </div>
        <div class="invoice-header-right">
          <div class="invoice-date">
            <span class="label">Дата:</span>
            <span class="value">{{ formatDate(purchase.date) }}</span>
          </div>
          <div class="invoice-status" :class="statusClass">
            {{ statusLabel }}
          </div>
          <!-- F-271/D-019: завершена, но фото-отчёт не приложен -->
          <div
            v-if="purchase.status === 'completed' && purchase.has_report_photos === false"
            class="no-print badge badge-warning badge-sm"
            title="Закупка завершена без фото-отчёта"
          >
            нет фото-отчёта
          </div>
        </div>
      </div>

      <!-- Основная информация -->
      <div class="invoice-info">
        <div class="info-row">
          <div class="info-item">
            <span class="info-label">Объект:</span>
            <span class="info-value">{{ purchase.object_name || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Поставщик:</span>
            <span class="info-value">{{ purchase.supplier_name || '—' }}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="info-item">
            <span class="info-label">Ответственный:</span>
            <span class="info-value">{{ responsibleName(purchase.responsible) || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Валюта:</span>
            <span class="info-value">{{ purchase.currency || 'UZS' }}</span>
          </div>
        </div>
        <div class="info-row" v-if="purchase.invoice_number">
          <div class="info-item">
            <span class="info-label">Номер счета:</span>
            <span class="info-value">{{ purchase.invoice_number }}</span>
          </div>
        </div>
        <!-- F-316: кто внёс запись. Отличается от «Ответственный»: ответственный
             отвечает за закупку по делу, автор — тот, кто завёл её в системе. -->
        <div class="info-row">
          <div class="info-item">
            <span class="info-label">Внёс:</span>
            <span class="info-value" :title="purchase.created_by_name ? undefined : 'не задано'">{{ purchase.created_by_name || 'НЗ' }}</span>
          </div>
          <div class="info-item" v-if="purchase.updated_by_name && purchase.updated_by !== purchase.created_by">
            <span class="info-label">Изменил:</span>
            <span class="info-value">{{ purchase.updated_by_name }}</span>
          </div>
        </div>
      </div>

      <!-- Таблица позиций -->
      <div class="invoice-items">
        <table class="invoice-table">
          <thead>
            <tr>
              <th class="col-number">№</th>
              <th class="col-material">Наименование материала</th>
              <th class="col-unit">Ед.</th>
              <th class="col-quantity">Кол-во</th>
              <th class="col-price">Цена</th>
              <th class="col-amount">Сумма</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in purchase.items" :key="item.id">
              <td class="col-number">{{ index + 1 }}</td>
              <td class="col-material">{{ item.material_name || '—' }}</td>
              <td class="col-unit">{{ item.unit_code || '—' }}</td>
              <td class="col-quantity font-mono">{{ formatNumberClean(item.quantity) }}</td>
              <td class="col-price font-mono">{{ formatNumber(item.price) }}<span class="cur-code"> UZS</span></td>
              <td class="col-amount font-mono">{{ formatNumber(item.amount) }}<span class="cur-code"> UZS</span></td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3" class="total-label">ИТОГО:</td>
              <td class="total-quantity font-mono">{{ formatNumberClean(totalQuantity) }}</td>
              <td class="total-price">—</td>
              <td class="total-amount font-mono">{{ formatNumber(purchase.total_amount) }}<span class="cur-code"> UZS</span></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Комментарий -->
      <div class="invoice-comment" v-if="purchase.comment">
        <div class="comment-label">Комментарий:</div>
        <div class="comment-text">{{ purchase.comment }}</div>
      </div>

      <!-- Подписи -->
      <div class="invoice-signatures">
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="signature-label">Ответственный</div>
        </div>
        <div class="signature-block">
          <div class="signature-line"></div>
          <div class="signature-label">Получил</div>
        </div>
      </div>

      <!-- Фотографии (только для просмотра, не для печати) -->
      <div class="no-print invoice-photos" v-if="hasPhotos">
        <div class="photos-header">
          <h3 class="photos-title">Фотографии ({{ allPhotos.length }})</h3>
          <div class="tabs tabs-boxed">
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
        </div>

        <div v-if="getPhotosByType(activePhotoType).length > 0" class="photos-grid">
          <div 
            v-for="(photo, index) in getPhotosByType(activePhotoType)" 
            :key="photo.id"
            class="photo-item"
            @click="openPhotoModal(photo, index)"
          >
            <img
              :src="photo.url"
              :alt="`Фото ${index + 1}`"
              class="photo-thumbnail"
            />
            <div class="photo-badge" :class="getPhotoTypeClass(photo.type)">
              {{ getPhotoTypeLabel(photo.type) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Photo Modal -->
    <div v-if="photoModalOpen" class="modal modal-open no-print">
      <div class="modal-box max-w-6xl w-full h-full max-h-screen">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold">
            {{ getPhotoTypeLabel(selectedPhoto?.type) }} - {{ currentPhotoIndex + 1 }} из {{ currentPhotoList.length }}
          </h3>
          <button class="btn btn-sm btn-circle btn-outline" aria-label="Закрыть" title="Закрыть" @click="photoModalOpen = false">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div v-if="selectedPhoto" class="relative h-full">
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
              <span class="text-sm text-muted">{{ currentPhotoIndex + 1 }} / {{ currentPhotoList.length }}</span>
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

          <div class="text-center bg-base-200 rounded-lg p-4 mb-4">
            <img
              :src="selectedPhoto.url"
              :alt="`Фото ${selectedPhoto.id}`"
              class="max-w-full max-h-[60vh] object-contain mx-auto rounded-lg shadow-lg"
            />
          </div>

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
        </div>
      </div>
      <div class="modal-backdrop" @click="photoModalOpen = false"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { Purchase, PurchasePhoto, Employee } from '@/api/types'
import { formatDate, formatNumber, formatNumberClean } from '@/utils/formatters'
import { useEmployeesStore } from '@/stores/employees'

interface Props {
  purchase: Purchase | null
}

const props = defineProps<Props>()

defineEmits<{
  close: []
}>()

// Router
const router = useRouter()
const route = useRoute()

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
    case 'new': return 'status-new'
    case 'completed': return 'status-completed'
    case 'cancelled': return 'status-cancelled'
    default: return 'status-default'
  }
})

const totalQuantity = computed(() => {
  if (!props.purchase?.items) {return 0}
  return props.purchase.items.reduce((sum, item) => {
    const qty = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity || 0))
    return sum + (isNaN(qty) ? 0 : qty)
  }, 0)
})

const allPhotos = computed(() => {
  if (!props.purchase?.photos) {return []}
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
  return allPhotos.value.filter(photo => photo.type === type)
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
    case 'instructions': return 'badge badge-info'
    case 'report': return 'badge badge-success'
    default: return 'badge badge-ghost'
  }
}

function openPhotoModal(photo: PurchasePhoto, index: number = 0) {
  selectedPhoto.value = photo
  currentPhotoIndex.value = index
  currentPhotoList.value = getPhotosByType(photo.type || 'instructions')
  photoModalOpen.value = true
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

function handlePrint() {
  if (!props.purchase) {return}
  
  // Если уже на странице печати - вызываем печать
  if (route.name === 'PurchasePrint') {
    window.print()
    return
  }
  
  // Иначе переходим на страницу печати
  router.push({ name: 'PurchasePrint', params: { id: props.purchase.id } })
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
/* Основные стили */
.invoice-container {
  max-width: 100%;
  /* F-568: НЕ скроллим здесь — накладная всегда открыта внутри <Modal>, а у .modal-box
     уже есть свой overflow-y:auto+max-height. Двойной скролл (внешний модальный + внутренний
     контейнер) выглядел неопрятно. Скролл принадлежит модалке; печать даёт overflow:visible ниже. */
}

.actions-bar {
  padding: 1rem;
  background: var(--color-base-100);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
  color: var(--color-base-content);
}

.actions-bar h2 {
  color: var(--color-base-content);
}

.invoice-paper {
  background: var(--color-base-100);
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  /* Экран: фон/текст из токенов (корректно в light и dark). Печать форсит белый фон +
     чёрный текст — см. @media print ниже (документ на бумаге всегда бело-чёрный). */
  color: var(--color-base-content);
}

/* Приглушённый цвет для меток (base-content с прозрачностью — читаемо в обеих темах) */
.invoice-paper .label,
.invoice-paper .info-label,
.invoice-paper .comment-label,
.invoice-paper .signature-label {
  color: hsl(var(--tx-2));
}

/* Шапка накладной */
.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--color-base-content);
}

.invoice-header-left {
  flex: 1;
}

.invoice-title {
  font-size: 1.5rem;
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  letter-spacing: 0.05em;
}

.invoice-number {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.invoice-number .label {
  font-size: 0.875rem;
  color: hsl(var(--tx-2));
}

.invoice-number .value {
  font-size: 1.25rem;
  font-weight: bold;
}

.invoice-header-right {
  text-align: right;
}

.invoice-date {
  margin-bottom: 0.5rem;
}

.invoice-date .label {
  font-size: 0.875rem;
  color: hsl(var(--tx-2));
  margin-right: 0.5rem;
}

.invoice-date .value {
  font-size: 1rem;
  font-weight: 500;
}

.invoice-status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-new {
  background-color: color-mix(in oklab, var(--color-info) 15%, transparent);
  color: var(--color-info);
}

.status-completed {
  background-color: color-mix(in oklab, var(--color-success) 15%, transparent);
  color: var(--color-success);
}

.status-cancelled {
  background-color: color-mix(in oklab, var(--color-error) 15%, transparent);
  color: var(--color-error);
}

.status-default {
  background-color: var(--color-base-200);
  color: var(--color-base-content);
}

/* Информация о закупке */
.invoice-info {
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  gap: 2rem;
  margin-bottom: 0.75rem;
}

.info-item {
  flex: 1;
  display: flex;
  gap: 0.5rem;
}

.info-label {
  font-weight: 500;
  color: hsl(var(--tx-2));
  min-width: 120px;
}

.info-value {
  flex: 1;
  font-weight: 500;
}

/* Таблица позиций */
.invoice-items {
  margin-bottom: 1.5rem;
}

.invoice-table {
  width: 100%;
  /* F-586: table-layout:fixed → таблица НИКОГДА не шире контейнера (модалки), на любой ширине.
     Числовые колонки nowrap, а «Наименование» переносится — так ничего не обрезается и числа не
     ломаются. На узких экранах ниже уменьшаем шрифт/паддинги, чтобы числа влезли в свои колонки. */
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 0.875rem;
}

/* Числа (кол-во/цена/сумма) — в одну строку; наименование — переносится. */
.invoice-table .col-quantity,
.invoice-table .col-price,
.invoice-table .col-amount,
.invoice-table .total-quantity,
.invoice-table .total-price,
.invoice-table .total-amount {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.invoice-table .col-material {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.invoice-table thead {
  background-color: var(--color-base-200);
}

.invoice-table th {
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  border: 1px solid var(--color-base-300);
  font-size: 0.75rem;
  text-transform: uppercase;
}

.invoice-table td {
  padding: 0.75rem;
  border: 1px solid var(--color-base-300);
}

.invoice-table tbody tr:nth-child(even) {
  background-color: var(--color-base-200);
}

.col-number {
  width: 3%;
  text-align: center;
}

.col-material {
  width: 45%;
}

.col-unit {
  width: 8%;
  text-align: center;
}

.col-quantity {
  width: 12%;
  text-align: right;
}

.col-price {
  width: 16%;
  text-align: right;
}

.col-amount {
  width: 16%;
  text-align: right;
  font-weight: 600;
}

.total-row {
  background-color: var(--color-base-200);
  font-weight: bold;
}

.total-label {
  text-align: right;
  padding-right: 1rem;
}

.total-quantity,
.total-price,
.total-amount {
  text-align: right;
  font-size: 1rem;
}

/* F-586: узкие экраны (телефон / full-screen модалка ≤639px) — компактнее, чтобы 6 колонок
   влезли и числа не резались. Больше ширины числовым колонкам, меньше — служебным. Печать это
   НЕ трогает (там свой @media print, документ остаётся полноразмерным). */
@media (max-width: 639px) {
  /* Меньше «бумажных» полей — таблице больше ширины. */
  .invoice-paper {
    padding: 0.75rem;
  }
  .invoice-table {
    font-size: 0.75rem;
  }
  .invoice-table th,
  .invoice-table td {
    padding: 0.3rem 0.35rem;
  }
  .invoice-table th {
    font-size: 0.6rem;
  }
  .col-number { width: 6%; }
  .col-material { width: 28%; }
  .col-unit { width: 9%; }
  .col-quantity { width: 15%; }
  .col-price { width: 20%; }
  .col-amount { width: 22%; }
  .total-quantity,
  .total-price,
  .total-amount {
    font-size: 0.8rem;
  }
  /* На узком экране «UZS» в ячейках прячем — валюта указана в шапке накладной; так «120 000»
     помещается без обрезки. <span> по умолчанию inline (десктоп), а печать форсит суффикс ниже. */
  .cur-code {
    display: none;
  }
}

/* Суффикс валюты остаётся в ПЕЧАТИ (документ полноразмерный, с «UZS») и на десктопе. */
@media print {
  .cur-code {
    display: inline !important;
  }
}

/* Комментарий */
.invoice-comment {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: var(--color-base-200);
  border-left: 3px solid var(--color-base-300);
  border-radius: 0.25rem;
}

.comment-label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: hsl(var(--tx-2));
  font-size: 0.875rem;
}

.comment-text {
  white-space: pre-wrap;
  line-height: 1.5;
}

/* Подписи */
.invoice-signatures {
  display: flex;
  justify-content: space-between;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-base-300);
}

.signature-block {
  flex: 1;
  max-width: 300px;
}

.signature-line {
  height: 1px;
  background-color: var(--color-base-content);
  margin-bottom: 0.5rem;
}

.signature-label {
  font-size: 0.875rem;
  color: hsl(var(--tx-2));
  text-align: center;
}

/* Фотографии */
.invoice-photos {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-base-300);
}

.photos-header {
  margin-bottom: 1rem;
}

.photos-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.photo-item {
  position: relative;
  cursor: pointer;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid var(--color-base-300);
  transition: transform 0.2s, box-shadow 0.2s;
}

.photo-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.photo-thumbnail {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.photo-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Стили для печати - основные стили в components.css */
@media print {
  /* Печать — документ на бумаге: ВСЕГДА белый фон + чёрный текст, независимо от темы
     экрана. Явно гасим токен-заливки (в тёмной теме base-200/300 тёмные) — иначе тёмная
     тема протекла бы в печать (жжёт тонер / нечитаемо). */
  .invoice-container {
    overflow: visible !important;
    max-height: none !important;
  }

  .invoice-paper {
    background: #fff !important;
    color: #000 !important;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
  }

  .invoice-paper * {
    color: #000 !important;
    border-color: #000 !important;
  }

  /* Лёгкие серые заливки для читаемости таблицы (не тёмные) */
  .invoice-table thead,
  .invoice-table tbody tr:nth-child(even),
  .total-row {
    background-color: #f0f0f0 !important;
  }

  .invoice-comment {
    background-color: #f7f7f7 !important;
    border-left-color: #000 !important;
  }

  .signature-line {
    background-color: #000 !important;
  }

  /* Статусы в печати — без цветных заливок, только контур + чёрный текст */
  .invoice-status {
    background: transparent !important;
    color: #000 !important;
    border: 1px solid #000 !important;
  }

  /* Метки чуть светлее чёрного, но не прозрачные (color-mix с transparent на бумаге бледнит) */
  .invoice-paper .label,
  .invoice-paper .info-label,
  .invoice-paper .comment-label,
  .invoice-paper .signature-label,
  .invoice-number .label,
  .invoice-date .label {
    color: #333 !important;
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  .invoice-paper {
    padding: 1rem;
  }

  .invoice-header {
    flex-direction: column;
    gap: 1rem;
  }

  .invoice-header-right {
    text-align: left;
  }

  .info-row {
    flex-direction: column;
    gap: 0.5rem;
  }

  .invoice-table {
    font-size: 0.75rem;
  }

  .invoice-table th,
  .invoice-table td {
    padding: 0.5rem;
  }

  .invoice-signatures {
    flex-direction: column;
    gap: 2rem;
  }
}
</style>
