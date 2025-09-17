<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">Отчёт по объектам</h1>
      <a class="btn btn-primary" :href="exportUrl" target="_blank" rel="noreferrer">Экспорт .xlsx</a>
    </div>

    <div class="card bg-white border">
      <div class="card-body grid md:grid-cols-6 gap-4">
        <fieldset class="fieldset">
          <label class="label"><span class="label-text">Дата с</span></label>
          <input v-model="filters.date_from" type="date" class="input input-bordered input-sm"/>
        </fieldset>
        <fieldset class="fieldset">
          <label class="label"><span class="label-text">Дата по</span></label>
          <input v-model="filters.date_to" type="date" class="input input-bordered input-sm"/>
        </fieldset>
        <fieldset class="fieldset">
          <label class="label"><span class="label-text">Объект</span></label>
          <select v-model.number="filters.object" class="select select-bordered select-sm">
            <option :value="undefined">Все</option>
            <option v-for="o in objects" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <label class="label"><span class="label-text">Ответственный</span></label>
          <select v-model.number="filters.responsible" class="select select-bordered select-sm">
            <option :value="undefined">Все</option>
            <option v-for="e in employees" :key="e.id" :value="e.id">
              {{ e.first_name || e.username }} {{ e.last_name || '' }}
            </option>
          </select>
        </fieldset>
        <div class="md:col-span-2 flex items-end justify-end">
          <button class="btn btn-sm btn-outline" @click="reload(1)">Применить</button>
        </div>
      </div>
    </div>

    <div class="overflow-auto border border-gray-200 rounded-xl">
      <table class="table table-zebra w-full">
        <thead>
        <tr>
          <th>Дата</th>
          <th>Объект</th>
          <th>Ответственный</th>
          <th>Материал</th>
          <th>Ед.</th>
          <th class="text-right">Кол-во</th>
          <th class="text-right">Сумма</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(r, i) in rows" :key="i">
          <td>{{ r[0] ?? '—' }}</td>
          <td>{{ r[1] ?? '—' }}</td>
          <td>{{ r[2] ?? '—' }}</td>
          <td>{{ r[3] ?? '—' }}</td>
          <td>{{ r[4] ?? '—' }}</td>
          <td class="text-right">{{ r[5] ?? '—' }}</td>
          <td class="text-right">{{ r[6] ?? '—' }}</td>
        </tr>
        <tr v-if="!loading && rows.length===0">
          <td colspan="7" class="text-center text-gray-700-60">Нет данных</td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="join self-end" v-if="isPaginated">
      <button class="btn btn-sm join-item" :disabled="page<=1" @click="reload(1)">«</button>
      <button class="btn btn-sm join-item" :disabled="page<=1" @click="reload(page-1)">Назад</button>
      <button class="btn btn-sm join-item btn-ghost no-animation">Стр. {{ page }}</button>
      <button class="btn btn-sm join-item" :disabled="page*pageSize>=count" @click="reload(page+1)">Вперёд</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {PageResponse, ReportResponse, ReportByObjectQuery, SiteObject, Employee, Material} from '@/api/types'

type Query = Record<string, string | number | boolean | (string | number)[] | null | undefined>

const rows = ref<(string | number | null)[][]>([])
const loading = ref(false)
const count = ref(0)
const page = ref(1)
const pageSize = 50

const filters = ref<ReportByObjectQuery>({date_from: undefined, date_to: undefined, object: undefined, responsible: undefined})

const objects = ref<SiteObject[]>([])
const employees = ref<Employee[]>([])
const materials = ref<Material[]>([])

const objMap = computed(() => new Map(objects.value.map(o => [o.id, o.name])))
const matMap = computed(() => new Map(materials.value.map(m => [m.id, m.name])))

function objectName(id?: number) {
  return id ? objMap.value.get(id) : undefined
}

function materialName(id?: number) {
  return id ? matMap.value.get(id) : undefined
}

const isPaginated = computed(() => count.value > rows.value.length)

async function loadRefs() {
  const [{data: od}, {data: ed}, {data: md}] = await Promise.all([
    api.get<PageResponse<SiteObject>>(endpoints.objects.list + buildQuery({page_size: 1000, ordering: 'name'})),
    api.get<PageResponse<Employee>>(endpoints.employees.list + buildQuery({page_size: 1000, ordering: 'username'})),
    api.get<PageResponse<Material>>(endpoints.materials.list + buildQuery({page_size: 1000, ordering: 'name'})),
  ])
  objects.value = od.results
  employees.value = ed.results
  materials.value = md.results
}

async function fetchReport() {
  loading.value = true
  try {
    const q = {...filters.value, page: page.value, page_size: pageSize} as ReportByObjectQuery & { page: number; page_size: number }
    const {data} = await api.get<ReportResponse>(endpoints.reports.byObject + buildQuery(q as unknown as Query))
    if (Array.isArray(data)) {
      rows.value = data
      count.value = data.length
    } else {
      rows.value = (data as ReportResponse).rows
      count.value = (data as ReportResponse).rows.length
    }
  } finally {
    loading.value = false
  }
}

function reload(p = page.value) {
  page.value = p;
  fetchReport()
}

const exportUrl = computed(() => {
  const q = {...filters.value, export: 'xlsx'} as ReportByObjectQuery
  return endpoints.reports.byObject + buildQuery(q as unknown as Query)
})

onMounted(async () => {
  await loadRefs();
  await fetchReport()
})
</script>

