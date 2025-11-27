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

    <!-- Простая таблица -->
    <div class="bg-base-100 rounded-lg shadow-xl">
      <div class="">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Архивные периоды</h2>
          <button class="btn btn-primary" @click="openCloseModal">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Закрыть период
          </button>
        </div>

        <div v-if="loading" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="error" class="alert alert-error">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <span>{{ error }}</span>
        </div>

        <div v-else-if="items.length === 0" class="text-center py-8">
          <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Нет архивных записей</h3>
          <p class="text-gray-500">Закройте первый период для начала работы</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Месяц</th>
                <th>Объект</th>
                <th>Закрыто</th>
                <th>Кем закрыто</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td>{{ item.id }}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="font-mono">{{ formatMonth(item.month) }}</span>
                    <div class="badge badge-info badge-sm">{{ getMonthName(item.month) }}</div>
                  </div>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ item.object_name ?? item.object }}</span>
                    <div class="badge badge-outline badge-sm">{{ item.object }}</div>
                  </div>
                </td>
                <td>
                  <div class="flex flex-col">
                    <span class="text-sm">{{ formatDate(item.closed_at) }}</span>
                    <span class="text-xs text-gray-500">{{ formatTime(item.closed_at) }}</span>
                  </div>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <div class="avatar placeholder">
                      <div class="bg-neutral text-neutral-content rounded-full w-6">
                        <span class="text-xs">{{ getInitials(item.closed_by_name) }}</span>
                      </div>
                    </div>
                    <span>{{ item.closed_by_name ?? '—' }}</span>
                  </div>
                </td>
                <td>
                  <span class="badge badge-success">
                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                    Закрыт
                  </span>
                </td>
                <td>
                  <button
                    class="btn btn-xs btn-warning"
                    :disabled="busyId === item.id || !item.is_closed"
                    @click="reopen(item)"
                  >
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                    Открыть
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

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
        
        <form class="grid gap-4" @submit.prevent="closePeriod">
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
              <option v-for="obj in objects" :key="obj.id" :value="obj.id">
                {{ obj.name }} (ID: {{ obj.id }})
              </option>
            </select>
          </div>
          
          <div class="modal-action">
            <button type="button" class="btn btn-ghost" @click="closeDialog">
              Отмена
            </button>
            <button 
              type="submit" 
              class="btn btn-primary" 
              :disabled="loading || !canClose"
            >
              <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loading ? 'Закрываем…' : 'Закрыть период' }}
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
import api from '@/api/client'
import endpoints, { buildQuery } from '@/api/endpoints'

// Простые типы
interface ArchivePeriod {
  id: number
  month: string
  object: number
  object_name: string
  closed_at: string
  closed_by: number
  closed_by_name: string
  is_closed: boolean
}

interface ArchivePeriodRequest {
  month: string
  object: number
}

// State
const items = ref<ArchivePeriod[]>([])
const objects = ref<Array<{id: number, name: string}>>([])
const loading = ref(false)
const error = ref<string | null>(null)
const busyId = ref<number | null>(null)
const showCloseModal = ref(false)
const closeForm = ref<ArchivePeriodRequest>({
  month: new Date().toISOString().slice(0, 7),
  object: 0
})

// Computed
const archiveStats = computed(() => {
  const total = items.value.length
  const thisYear = new Date().getFullYear()
  const thisYearPeriods = items.value.filter(
    item => new Date(item.month).getFullYear() === thisYear
  ).length
  const lastPeriod = items.value.length > 0 ? items.value[0] : null

  return { total, thisYear: thisYearPeriods, lastPeriod }
})

const lastPeriodText = computed(() => {
  const lastPeriod = archiveStats.value.lastPeriod
  if (!lastPeriod) {return 'Нет'}
  return formatMonth(lastPeriod.month)
})

const canClose = computed(() => {
  if (!closeForm.value.month || !closeForm.value.object) {return false}
  // Проверяем, не закрыт ли уже период
  const existingPeriod = items.value.find(
    item => item.month === closeForm.value.month + '-01' && item.object === closeForm.value.object
  )
  return !existingPeriod
})

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

// Functions
async function fetchList() {
  loading.value = true
  error.value = null
  
  try {
    const { data } = await api.get(endpoints.archive.periods.list)
    items.value = data.results || data
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Ошибка загрузки архива'
  } finally {
    loading.value = false
  }
}

async function fetchObjects() {
  try {
    const { data } = await api.get(endpoints.objects.list + buildQuery({ page_size: 1000, ordering: 'name' }))
    objects.value = data.results || data
  } catch (err: any) {
    console.error('Ошибка загрузки объектов:', err)
  }
}

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

async function closePeriod() {
  if (!canClose.value) { 
    alert('Заполните все обязательные поля')
    return 
  }
  
  loading.value = true
  try {
    await api.post(endpoints.archive.periods.close, closeForm.value)
    alert('Период успешно закрыт')
    closeDialog()
    await fetchList()
  } catch (err: any) {
    alert('Ошибка при закрытии периода: ' + (err?.response?.data?.detail || 'Неизвестная ошибка'))
  } finally {
    loading.value = false
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
    await api.post(endpoints.archive.periods.reopen, { 
      month: period.month, 
      object: period.object 
    })
    alert('Период успешно открыт')
    await fetchList()
  } catch (err: any) {
    alert('Ошибка при открытии периода: ' + (err?.response?.data?.detail || 'Неизвестная ошибка'))
  } finally {
    busyId.value = null
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchObjects(),
    fetchList()
  ])
})
</script>
