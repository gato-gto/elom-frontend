<template>
  <div class="grid gap-4">
    <div class="card bg-base-100 border">
      <div class="card-body grid md:grid-cols-6 gap-4">
        <fieldset class="fieldset">
          <label class="label" for="rm-from"><span class="label-text">Дата с</span></label>
          <input id="rm-from" v-model="dateFrom" type="date" class="input input-bordered input-sm"/>
        </fieldset>
        <fieldset class="fieldset">
          <label class="label" for="rm-to"><span class="label-text">Дата по</span></label>
          <input id="rm-to" v-model="dateTo" type="date" class="input input-bordered input-sm"/>
        </fieldset>
        <fieldset class="fieldset">
          <label class="label" for="rm-object"><span class="label-text">Объект</span></label>
          <select id="rm-object" v-model.number="objectId" class="select select-bordered select-sm">
            <option :value="undefined">Все</option>
            <option v-for="o in objects" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <label class="label" for="rm-search"><span class="label-text">Поиск</span></label>
          <input id="rm-search" v-model.trim="search" class="input input-bordered input-sm" placeholder="название материала / SKU" @keyup.enter="load"/>
        </fieldset>
        <div class="flex items-end gap-2 md:col-span-2">
          <button class="btn btn-sm btn-outline" @click="load">Показать</button>
          <a class="btn btn-sm" :href="xlsxUrl" target="_blank" rel="noreferrer">Экспорт .xlsx</a>
          <a class="btn btn-sm btn-ghost" :href="pdfUrl" target="_blank" rel="noreferrer">PDF</a>
        </div>
      </div>
    </div>

    <div class="overflow-auto border border-base-300 rounded-xl">
      <table class="table table-zebra w-full">
        <thead>
        <tr>
          <th>Материал</th>
          <th>Ед.</th>
          <th class="text-right">Сумма</th>
          <th class="text-right">Кол-во закупок</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="r in rows" :key="r.material">
          <td>{{ r.material_name }}</td>
          <td>{{ r.unit_code ?? '—' }}</td>
          <td class="text-right">{{ r.total_amount }}</td>
          <td class="text-right">{{ r.purchases_count ?? '—' }}</td>
        </tr>
        <tr v-if="!loading && rows.length===0">
          <td colspan="4" class="text-center text-base-content/60">Нет данных</td>
        </tr>
        </tbody>
        <tfoot v-if="total">
        <tr>
          <th>Итого</th>
          <th/>
          <th class="text-right">{{ total }}</th>
          <th/>
        </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {SiteObject, PageResponse} from '@/api/types'

type Row = { material: number; material_name: string; unit_code?: string; total_amount: string; purchases_count?: number }
type ReportResponse = { rows: Row[]; total_amount?: string }

const dateFrom = ref<string | undefined>()
const dateTo = ref<string | undefined>()
const objectId = ref<number | undefined>()
const search = ref('')
const rows = ref<Row[]>([])
const total = ref<string | null>(null)
const loading = ref(false)

const objects = ref<SiteObject[]>([])

async function loadObjects() {
  const {data} = await api.get<PageResponse<SiteObject>>(endpoints.objects.list + buildQuery({page_size: 1000}))
  objects.value = data.results
}

async function load() {
  loading.value = true
  try {
    const q = buildQuery({
      date_after: dateFrom.value || undefined,
      date_before: dateTo.value || undefined,
      object: objectId.value,
      search: search.value || undefined,
    })
    const {data} = await api.get<ReportResponse>(endpoints.reports.byMaterial + q)
    rows.value = Array.isArray((data as any)) ? (data as any as Row[]) : (data.rows ?? [])
    total.value = (data as any).total_amount ?? null
  } finally {
    loading.value = false
  }
}

const xlsxUrl = computed(() => {
  const q = buildQuery({
    date_after: dateFrom.value || undefined,
    date_before: dateTo.value || undefined,
    object: objectId.value,
    search: search.value || undefined,
    format: 'xlsx',
  })
  return endpoints.reports.byMaterial + q
})
const pdfUrl = computed(() => {
  const q = buildQuery({
    date_after: dateFrom.value || undefined,
    date_before: dateTo.value || undefined,
    object: objectId.value,
    search: search.value || undefined,
    format: 'pdf',
  })
  return endpoints.reports.byMaterial + q
})

onMounted(async () => {
  await loadObjects()
  await load()
})
</script>
