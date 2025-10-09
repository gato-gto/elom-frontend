<template>
  <div class="list-container">
    <!-- Статистика архива -->
    <div class="stats-container mb-6">
      <div class="stats shadow">
        <div class="stat">
          <div class="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div class="stat-title">Всего периодов</div>
          <div class="stat-value text-primary">{{ archiveStats.total }}</div>
        </div>
        
        <div class="stat">
          <div class="stat-figure text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <div class="stat-title">В этом году</div>
          <div class="stat-value text-secondary">{{ archiveStats.thisYear }}</div>
        </div>
        
        <div class="stat">
          <div class="stat-figure text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="stat-title">Последний период</div>
          <div class="stat-value text-accent">{{ lastPeriodText }}</div>
        </div>
      </div>
    </div>

    <!-- GenericList Component -->
    <GenericList
      :store="archiveStore"
      :config="listConfig"
      @create="openCloseModal"
      @action="handleAction"
      @export="handleExport"
    >
      <!-- Custom column for object name -->
      <template #column-object_name="{ item, value }">
        <div class="flex items-center gap-2">
          <span class="font-medium">{{ value ?? item.object }}</span>
          <div class="badge badge-outline badge-sm">{{ item.object }}</div>
        </div>
      </template>

      <!-- Custom column for month -->
      <template #column-month="{ item, value }">
        <div class="flex items-center gap-2">
          <span class="font-mono">{{ formatMonth(value) }}</span>
          <div class="badge badge-info badge-sm">{{ getMonthName(value) }}</div>
        </div>
      </template>

      <!-- Custom column for closed_at -->
      <template #column-closed_at="{ item, value }">
        <div class="flex flex-col">
          <span class="text-sm">{{ formatDate(value) }}</span>
          <span class="text-xs text-gray-500">{{ formatTime(value) }}</span>
        </div>
      </template>

      <!-- Custom column for closed_by_name -->
      <template #column-closed_by_name="{ item, value }">
        <div class="flex items-center gap-2">
          <div class="avatar placeholder">
            <div class="bg-neutral text-neutral-content rounded-full w-6">
              <span class="text-xs">{{ getInitials(value) }}</span>
            </div>
          </div>
          <span>{{ value ?? '—' }}</span>
        </div>
      </template>

      <!-- Custom column for is_closed status -->
      <template #column-is_closed="{ item, value }">
        <div class="flex items-center gap-2">
          <span class="badge" :class="getStatusClass(value)">
            <svg v-if="value" class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <svg v-else class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
            {{ getStatusText(value) }}
          </span>
        </div>
      </template>

      <!-- Custom column for reopen action -->
      <template #column-actions="{ item }">
        <div class="flex gap-1">
          <button
            class="btn btn-xs btn-warning"
            :disabled="busyId === item.id || !item.is_closed"
            @click="reopen(item)"
            title="Открыть период"
          >
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            Открыть
          </button>
        </div>
      </template>
    </GenericList>

    <!-- Модалка закрытия периода -->
    <dialog v-if="showCloseModal" class="modal modal-open">
      <div class="modal-box w-11/12 max-w-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg">Закрыть период</h3>
          <button class="btn btn-sm btn-circle btn-ghost" @click="closeDialog">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="alert alert-info mb-4">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
          </svg>
          <span>Закрытие периода архивирует все закупки и складские операции за указанный месяц</span>
        </div>
        
        <form class="grid gap-4" @submit.prevent="closePeriodAction">
          <div class="form-control">
            <label class="label" for="close-month">
              <span class="label-text font-medium">Месяц</span>
              <span class="label-text-alt text-error">*</span>
            </label>
            <input 
              id="close-month" 
              v-model="closeForm.month" 
              type="month" 
              class="input input-bordered"
              :class="{ 'input-error': !closeForm.month }"
              required
            />
            <label v-if="!closeForm.month" class="label">
              <span class="label-text-alt text-error">Выберите месяц для архивирования</span>
            </label>
          </div>
          
          <div class="form-control">
            <label class="label" for="close-object">
              <span class="label-text font-medium">Объект</span>
              <span class="label-text-alt text-error">*</span>
            </label>
            <select 
              id="close-object" 
              v-model.number="closeForm.object" 
              class="select select-bordered"
              :class="{ 'select-error': !closeForm.object }"
              required
            >
              <option :value="undefined" disabled>Выберите объект</option>
              <option v-for="obj in objectsStore.items" :key="obj.id" :value="obj.id">
                {{ obj.name }} (ID: {{ obj.id }})
              </option>
            </select>
            <label v-if="!closeForm.object" class="label">
              <span class="label-text-alt text-error">Выберите объект для архивирования</span>
            </label>
          </div>

          <!-- Предупреждение о дублировании -->
          <div v-if="closeForm.month && closeForm.object && !canClose" class="alert alert-warning">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            <span>Период {{ formatMonth(closeForm.month + '-01') }} для выбранного объекта уже архивирован</span>
          </div>
          
          <div class="modal-action">
            <button type="button" class="btn btn-ghost" @click="closeDialog">
              Отмена
            </button>
            <button 
              type="submit" 
              class="btn btn-primary" 
              :disabled="archiveStore.loading || !canClose"
            >
              <svg v-if="archiveStore.loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ archiveStore.loading ? 'Закрываем…' : 'Закрыть период' }}
            </button>
          </div>
        </form>
      </div>
      <div class="modal-backdrop" @click="closeDialog"></div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useArchiveStore, getArchiveStats, closePeriod, reopenPeriod, canClosePeriod } from '@/stores/archive'
import { useObjectsStore } from '@/stores/objects'
import type { ArchivePeriod, ArchivePeriodRequest } from '@/api/types/archive'
import type { GenericListConfig } from '@/types/generic'
import { getStatusClass, getStatusText } from '@/utils/formatters'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useNotifications } from '@/composables/useNotifications'
import { useExport } from '@/composables/useExport'
import GenericList from '@/components/GenericList.vue'

// Stores
const archiveStore = useArchiveStore
const objectsStore = useObjectsStore


// Composables
const { handleLoadingError } = useErrorHandler()
const { showSuccess, showError, showWarning } = useNotifications()
const { exportToCSV, exportToExcel, exportToPDF } = useExport()

// State
const busyId = ref<number | null>(null)
const showCloseModal = ref(false)
const closeForm = ref<ArchivePeriodRequest>({
  month: new Date().toISOString().slice(0, 7),
  object: 0
})

// Computed
const archiveStats = computed(() => getArchiveStats())

const lastPeriodText = computed(() => {
  const lastPeriod = archiveStats.value.lastPeriod
  if (!lastPeriod) {return 'Нет'}
  return formatMonth(lastPeriod.month)
})

const objectOptions = computed(() => [
  { value: '', label: 'Все объекты' },
  ...objectsStore.items.map((obj: any) => ({ 
    value: obj.id, 
    label: `${obj.name} (ID: ${obj.id})` 
  }))
])

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push({ value: i, label: i.toString() })
  }
  return years
})

const monthOptions = computed(() => [
  { value: '', label: 'Все месяцы' },
  { value: 1, label: 'Январь' },
  { value: 2, label: 'Февраль' },
  { value: 3, label: 'Март' },
  { value: 4, label: 'Апрель' },
  { value: 5, label: 'Май' },
  { value: 6, label: 'Июнь' },
  { value: 7, label: 'Июль' },
  { value: 8, label: 'Август' },
  { value: 9, label: 'Сентябрь' },
  { value: 10, label: 'Октябрь' },
  { value: 11, label: 'Ноябрь' },
  { value: 12, label: 'Декабрь' }
])

// GenericList configuration
const listConfig = computed<GenericListConfig<ArchivePeriod>>(() => ({
  title: 'Архив периодов',
  subtitle: 'Управление закрытыми периодами по объектам',
  icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  showCreate: true,
  createText: 'Закрыть период',
  canCreate: true,
  showStats: false, // Используем кастомную статистику
  exportable: true,
  exportFilename: 'archive',
  exportUrl: '/api/v1/archive/periods/',
  loadingText: 'Загрузка архива...',
  emptyText: 'Нет архивных записей',
  emptyTitle: 'Нет архивных записей',
  emptySubtitle: 'Закройте первый период для начала работы',
  filterColumns: 3,
  columns: [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'month', label: 'Месяц', sortable: true },
    { key: 'object_name', label: 'Объект', sortable: true },
    { key: 'closed_at', label: 'Закрыто', sortable: true },
    { key: 'closed_by_name', label: 'Кем закрыто', sortable: true },
    { key: 'is_closed', label: 'Статус', sortable: true },
    { key: 'actions', label: 'Действия', sortable: false }
  ],
  filters: [
    {
      key: 'month',
      type: 'date',
      label: 'Месяц',
      placeholder: 'Выберите месяц'
    },
    {
      key: 'month_from',
      type: 'date',
      label: 'Месяц от',
      placeholder: 'Начало периода'
    },
    {
      key: 'month_to',
      type: 'date',
      label: 'Месяц до',
      placeholder: 'Конец периода'
    },
    {
      key: 'object',
      type: 'select',
      label: 'Объект',
      options: objectOptions.value
    },
    {
      key: 'object_name',
      type: 'text',
      label: 'Название объекта',
      placeholder: 'Поиск по названию'
    },
    {
      key: 'year',
      type: 'select',
      label: 'Год',
      options: yearOptions.value
    },
    {
      key: 'month_number',
      type: 'select',
      label: 'Месяц',
      options: monthOptions.value
    }
  ],
  actions: [
    {
      key: 'reopen',
      label: 'Открыть',
      class: 'btn-warning',
      disabled: (item: ArchivePeriod) => !item.is_closed
    }
  ],
  defaultSort: 'month',
  defaultSortOrder: 'desc'
}))

// Utility functions
function formatMonth(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', { year: 'numeric', month: '2-digit' })
}

function getMonthName(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', { month: 'long' })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU')
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

function getInitials(name: string): string {
  if (!name) {return '?'}
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// --- Закрытие/открытие периодов ---
function openCloseModal() {
  closeForm.value = {
    month: new Date().toISOString().slice(0, 7),
    object: 0
  }
  showCloseModal.value = true
}

function closeDialog() {
  showCloseModal.value = false
}

const canClose = computed(() => {
  if (!closeForm.value.month || !closeForm.value.object) {return false}
  return canClosePeriod(closeForm.value.month, closeForm.value.object)
})

async function closePeriodAction() {
  if (!canClose.value) { 
    showWarning('Заполните все обязательные поля')
    return 
  }
  
  try {
    await closePeriod(closeForm.value)
    showSuccess('Период успешно закрыт')
    closeDialog()
  } catch (error) {
    showError('Ошибка при закрытии периода')
    await handleLoadingError(error, 'archive')
  }
}

async function reopen(period: ArchivePeriod) {
  if (!period.is_closed) {return}
  
  const confirmed = confirm(
    `Вы уверены, что хотите открыть период ${formatMonth(period.month)} по объекту "${period.object_name}"?`
  )
  
  if (!confirmed) {return}
  
  busyId.value = period.id
  try {
    await reopenPeriod({ 
      month: period.month, 
      object: period.object 
    })
    showSuccess('Период успешно открыт')
  } catch (error) {
    showError('Ошибка при открытии периода')
    await handleLoadingError(error, 'archive')
  } finally {
    busyId.value = null
  }
}

async function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    const data = archiveStore.items
    const filename = `archive_${new Date().toISOString().split('T')[0]}`

    // Используем функции экспорта
    
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
    
    showSuccess(`Данные экспортированы в формате ${format.toUpperCase()}`)
  } catch (error) {
    showError('Ошибка при экспорте данных')
    await handleLoadingError(error, 'archive')
  }
}

function handleAction(action: string, item: ArchivePeriod) {
  switch (action) {
    case 'reopen':
      reopen(item)
      break
  }
}

// Lifecycle
onMounted(async () => {
  try {
    // Загружаем объекты и архив параллельно
    await Promise.all([
      objectsStore.fetchList(),
      archiveStore.fetchList()
    ])
  } catch (error) {
    await handleLoadingError(error, 'archive')
  }
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>

