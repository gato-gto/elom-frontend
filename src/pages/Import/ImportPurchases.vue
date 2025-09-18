

<!--
  - Path: C:/Users/HVC/WebstormProjects/elom-frontend/src/pages/Import/ImportPurchases.vue
  - File: ImportPurchases.vue
  - Project: elom-frontend
  -
  -->

<template>
  <div class="card p-5 space-y-4">
    <h2 class="text-lg font-semibold">Импорт закупок из Excel</h2>
    <div class="grid md:grid-cols-2 gap-4">
      <div>
        <label class="label">Файл .xlsx</label>
        <input type="file" accept=".xlsx" @change="onFile" />
      </div>
      <div>
        <label class="label">Лист (необязательно)</label>
        <input class="input" v-model="sheet" placeholder="например, Закупки" />
      </div>
    </div>
    <div>
      <label class="label">Mapping (JSON, опционально)</label>
      <textarea class="input h-32" v-model="mapping" placeholder='{"date":"Дата","supplier":"Поставщик","invoice":"Накладная","item":"Товар","qty":"Количество","price":"Цена","total":"Сумма"}'></textarea>
    </div>
    <div class="flex items-center gap-3">
      <label class="inline-flex items-center gap-2">
        <input type="checkbox" v-model="dryRun" />
        <span>Пробный запуск (dry-run)</span>
      </label>
      <button class="btn" :disabled="!file" @click="run">Запустить импорт</button>
    </div>
    <div v-if="resp" class="mt-4">
      <h3 class="font-semibold mb-2">Результат</h3>
      <div v-if="resp.ok !== undefined" class="space-y-3">
        <div class="alert" :class="resp.ok ? 'alert-success' : 'alert-error'">
          <span>{{ resp.ok ? 'Импорт успешен' : 'Ошибка импорта' }}</span>
        </div>
        <div v-if="resp.sheets" class="card bg-base-100 border">
          <div class="card-body">
            <h4 class="card-title text-sm">Доступные листы:</h4>
            <ul class="list-disc list-inside">
              <li v-for="sheet in resp.sheets" :key="sheet">{{ sheet }}</li>
            </ul>
          </div>
        </div>
        <div v-if="resp.columns" class="card bg-base-100 border">
          <div class="card-body">
            <h4 class="card-title text-sm">Колонки:</h4>
            <div class="flex flex-wrap gap-2">
              <span v-for="col in resp.columns" :key="col" class="badge badge-outline">{{ col }}</span>
            </div>
          </div>
        </div>
        <div v-if="resp.warnings && resp.warnings.length > 0" class="alert alert-warning">
          <div>
            <h4 class="font-bold">Предупреждения:</h4>
            <ul class="list-disc list-inside">
              <li v-for="warning in resp.warnings" :key="warning">{{ warning }}</li>
            </ul>
          </div>
        </div>
        <div v-if="resp.hash" class="text-xs text-base-content-60">
          Hash: {{ resp.hash }}
        </div>
      </div>
      <div v-else>
        <pre class="bg-gray-50 rounded-xl p-3 text-sm overflow-auto">{{ resp }}</pre>
      </div>
    </div>
    <p class="text-sm text-error" v-if="error">{{ error }}</p>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import api from '@/api/client'

const file = ref<File | null>(null)
const mapping = ref('')
const sheet = ref('')
const dryRun = ref(true)
const resp = ref<any>(null)
const error = ref('')

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  file.value = input.files?.[0] || null
}

async function run() {
  error.value = ''; resp.value = null
  try {
    const fd = new FormData()
    if (!file.value) throw new Error('Не выбран файл')
    fd.append('file', file.value)
    if (mapping.value) fd.append('mapping', mapping.value)
    if (sheet.value) fd.append('sheet', sheet.value)
    
    // Используем правильные эндпоинты API
    const endpoint = dryRun.value ? '/api/v1/purchases/import/dry_run' : '/api/v1/purchases/import/commit'
    const { data } = await api.post(endpoint, fd)
    resp.value = data
  } catch (e: any) {
    error.value = e?.response?.data?.error || e.message || 'Ошибка импорта'
  }
}
</script>

