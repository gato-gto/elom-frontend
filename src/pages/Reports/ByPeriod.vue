<template>
  <div class="grid gap-4">
    <div class="card bg-white border">
      <div class="card-body grid md:grid-cols-5 gap-4">
        <fieldset class="fieldset">
          <label class="label" for="rp-from"><span class="label-text">Дата с</span></label>
          <input id="rp-from" v-model="dateFrom" type="date" class="input input-bordered input-sm" />
        </fieldset>
        <fieldset class="fieldset">
          <label class="label" for="rp-to"><span class="label-text">Дата по</span></label>
          <input id="rp-to" v-model="dateTo" type="date" class="input input-bordered input-sm" />
        </fieldset>
        <fieldset class="fieldset md:col-span-2">
          <label class="label" for="rp-search"><span class="label-text">Поиск</span></label>
          <input id="rp-search" v-model.trim="search" class="input input-bordered input-sm" placeholder="поставщик/комментарий/материал" @keyup.enter="load"/>
        </fieldset>
        <div class="flex items-end gap-2">
          <button class="btn btn-sm btn-outline" @click="load">Показать</button>
          <a class="btn btn-sm" :href="xlsxUrl" target="_blank" rel="noreferrer">Экспорт .xlsx</a>
          <a class="btn btn-sm btn-ghost" :href="pdfUrl" target="_blank" rel="noreferrer">PDF</a>
        </div>
      </div>
    </div>

    <div class="overflow-auto border border-gray-200 rounded-xl">
      <table class="table table-zebra w-full">
        <thead>
        <tr>
          <th>Месяц</th>
          <th class="text-right">Сумма</th>
          <th class="text-right">Кол-во закупок</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="r in rows" :key="r.period">
          <td>{{ formatDate(r.period) }}</td>
          <td class="text-right">{{ formatCurrency(r.total_amount) }}</td>
          <td class="text-right">{{ r.purchases ?? '—' }}</td>
        </tr>
        <tr v-if="!loading && rows.length===0">
          <td colspan="3" class="text-center text-gray-700-60">Нет данных</td>
        </tr>
        </tbody>
        <tfoot v-if="total">
        <tr>
          <th>Итого</th>
          <th class="text-right">{{ formatCurrency(total) }}</th>
          <th/>
        </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/api/client'
import endpoints, { buildQuery } from '@/api/endpoints'
import { formatDate, formatCurrency } from '@/utils/formatters'

type ReportRow = {
  period: string
  purchases: number
  total_amount: number
}

type ReportResponse = { 
  rows: ReportRow[]
  total_amount?: number 
}

const dateFrom = ref<string | undefined>()
const dateTo = ref<string | undefined>()
const search = ref('')
const rows = ref<ReportRow[]>([])
const total = ref<number | null>(null)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const q = buildQuery({
      date_from: dateFrom.value || undefined,
      date_to: dateTo.value || undefined,
      search: search.value || undefined,
    })
    const { data } = await api.get<ReportResponse>(endpoints.reports.byPeriod + q)
    
    // Обработка нового формата API
    if (data && typeof data === 'object' && 'rows' in data) {
      rows.value = (data as ReportResponse).rows ?? []
      total.value = (data as ReportResponse).total_amount ?? null
    } else {
      rows.value = []
      total.value = null
    }
  } catch (error) {
    console.error('Ошибка загрузки отчета по периодам:', error)
    rows.value = []
    total.value = null
  } finally {
    loading.value = false
  }
}

const xlsxUrl = computed(() => {
  const q = buildQuery({
    date_from: dateFrom.value || undefined,
    date_to: dateTo.value || undefined,
    search: search.value || undefined,
    export: 'xlsx',
  })
  return endpoints.reports.byPeriod + q
})
const pdfUrl = computed(() => {
  const q = buildQuery({
    date_from: dateFrom.value || undefined,
    date_to: dateTo.value || undefined,
    search: search.value || undefined,
    export: 'pdf',
  })
  return endpoints.reports.byPeriod + q
})

onMounted(load)
</script>

