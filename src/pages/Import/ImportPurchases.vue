

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
      <pre class="bg-gray-50 rounded-xl p-3 text-sm overflow-auto">{{ resp }}</pre>
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
    const url = `/purchases/import?dry_run=${dryRun.value ? '1':'0'}${sheet.value ? `&sheet=${encodeURIComponent(sheet.value)}`:''}`
    const { data } = await api.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    resp.value = data
  } catch (e: any) {
    error.value = e?.response?.data?.error || e.message || 'Ошибка импорта'
  }
}
</script>

