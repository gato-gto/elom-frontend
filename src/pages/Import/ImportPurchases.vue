

<!--
  - Path: C:/Users/HVC/WebstormProjects/elom-frontend/src/pages/Import/ImportPurchases.vue
  - File: ImportPurchases.vue
  - Project: elom-frontend
  -
  -->

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Импорт закупок</h1>
        <p class="text-gray-600 mt-1">Импорт данных закупок из Excel файлов</p>
      </div>
    </div>

    <!-- Import Form -->
    <form class="grid gap-6" @submit.prevent="run">
      <!-- Основная информация -->
      <div class="card bg-base-100 border">
        <div class="card-body">
          <h3 class="card-title text-lg mb-4">Настройки импорта</h3>
          
          <div class="grid md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Файл Excel (.xlsx)</span>
                <span class="label-text-alt text-error">*</span>
              </label>
              <input 
                type="file" 
                accept=".xlsx" 
                @change="onFile"
                class="file-input file-input-bordered w-full"
                required
              />
              <label class="label">
                <span class="label-text-alt">Выберите файл Excel для импорта</span>
              </label>
            </div>
            
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Лист (необязательно)</span>
              </label>
              <input 
                class="input input-bordered" 
                v-model="sheet" 
                placeholder="например, Закупки"
              />
              <label class="label">
                <span class="label-text-alt">Оставьте пустым для автоматического выбора</span>
              </label>
            </div>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Mapping (JSON, опционально)</span>
            </label>
            <textarea 
              class="textarea textarea-bordered h-32" 
              v-model="mapping" 
              placeholder='{"date":"Дата","supplier":"Поставщик","invoice":"Накладная","item":"Товар","qty":"Количество","price":"Цена","total":"Сумма"}'
            ></textarea>
            <label class="label">
              <span class="label-text-alt">JSON объект для сопоставления колонок</span>
            </label>
          </div>
          
          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-3">
              <input type="checkbox" v-model="dryRun" class="checkbox checkbox-primary" />
              <span class="label-text font-medium">Пробный запуск (dry-run)</span>
            </label>
            <label class="label">
              <span class="label-text-alt">Проверить файл без создания записей</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <button 
          type="button" 
          class="btn btn-outline"
          @click="resetForm"
        >
          Сбросить
        </button>
        <button 
          type="submit" 
          class="btn btn-primary"
          :disabled="!file || loading"
        >
          <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading ? 'Импорт...' : 'Запустить импорт' }}
        </button>
      </div>
    </form>

    <!-- Results -->
    <div v-if="resp" class="card bg-base-100 border">
      <div class="card-body">
        <h3 class="card-title text-lg mb-4">Результат импорта</h3>
        
        <div v-if="resp.ok !== undefined" class="space-y-4">
          <div class="alert" :class="resp.ok ? 'alert-success' : 'alert-error'">
            <svg v-if="resp.ok" class="stroke-current shrink-0 w-6 h-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else class="stroke-current shrink-0 w-6 h-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ resp.ok ? 'Импорт успешно выполнен' : 'Ошибка при импорте' }}</span>
          </div>
          
          <div v-if="resp.sheets" class="card bg-base-200 border">
            <div class="card-body">
              <h4 class="card-title text-base">Доступные листы:</h4>
              <ul class="list-disc list-inside space-y-1">
                <li v-for="sheet in resp.sheets" :key="sheet" class="text-sm">{{ sheet }}</li>
              </ul>
            </div>
          </div>
          
          <div v-if="resp.columns" class="card bg-base-200 border">
            <div class="card-body">
              <h4 class="card-title text-base">Колонки:</h4>
              <div class="flex flex-wrap gap-2">
                <span v-for="col in resp.columns" :key="col" class="badge badge-outline">{{ col }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="resp.warnings && resp.warnings.length > 0" class="alert alert-warning">
            <svg class="stroke-current shrink-0 w-6 h-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 class="font-bold">Предупреждения:</h4>
              <ul class="list-disc list-inside space-y-1">
                <li v-for="warning in resp.warnings" :key="warning" class="text-sm">{{ warning }}</li>
              </ul>
            </div>
          </div>
          
          <div v-if="resp.hash" class="text-xs text-base-content-60 bg-base-200 p-2 rounded">
            <strong>Hash:</strong> {{ resp.hash }}
          </div>
        </div>
        
        <div v-else>
          <pre class="bg-base-200 rounded-lg p-4 text-sm overflow-auto">{{ resp }}</pre>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="alert alert-error">
      <svg class="stroke-current shrink-0 w-6 h-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ error }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import api from '@/api/client'
import { ErrorHandlers } from '@/utils/errorHandler'

const file = ref<File | null>(null)
const mapping = ref('')
const sheet = ref('')
const dryRun = ref(true)
const resp = ref<any>(null)
const error = ref('')
const loading = ref(false)

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  file.value = input.files?.[0] || null
}

function resetForm() {
  file.value = null
  mapping.value = ''
  sheet.value = ''
  dryRun.value = true
  resp.value = null
  error.value = ''
  
  // Reset file input
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
  }
}

async function run() {
  if (!file.value) {
    error.value = 'Выберите файл для импорта'
    return
  }
  
  loading.value = true
  error.value = ''
  resp.value = null
  
  try {
    const fd = new FormData()
    fd.append('file', file.value)
    if (mapping.value) fd.append('mapping', mapping.value)
    if (sheet.value) fd.append('sheet', sheet.value)
    
    // Используем правильные эндпоинты API
    const endpoint = dryRun.value ? '/api/v1/purchases/import/dry_run' : '/api/v1/purchases/import/commit'
    const { data } = await api.post(endpoint, fd)
    resp.value = data
  } catch (e: any) {
    const errorResult = ErrorHandlers.dataLoading(e)
    error.value = errorResult.detail
  } finally {
    loading.value = false
  }
}
</script>

