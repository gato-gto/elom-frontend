<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">Остатки</h1>
    </div>

    <div class="card bg-white border">
      <div class="card-body grid md:grid-cols-6 gap-4">
        <fieldset class="fieldset">
          <label class="label"><span class="label-text">Дата с</span></label>
          <input v-model="filters.date_after" type="date" class="input input-bordered input-sm"/>
        </fieldset>
        <fieldset class="fieldset">
          <label class="label"><span class="label-text">Дата по</span></label>
          <input v-model="filters.date_before" type="date" class="input input-bordered input-sm"/>
        </fieldset>
        <fieldset class="fieldset">
          <label class="label"><span class="label-text">Объект</span></label>
          <select v-model.number="filters.object" class="select select-bordered select-sm">
            <option :value="undefined">Все</option>
            <option v-for="o in objects" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <label class="label"><span class="label-text">Материал</span></label>
          <select v-model.number="filters.material" class="select select-bordered select-sm">
            <option :value="undefined">Все</option>
            <option v-for="m in materials" :key="m.id" :value="m.id">{{ m.name }}</option>
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

        <div class="md:col-span-6 flex justify-end">
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
          <th>Материал</th>
          <th>Ед.</th>
          <th class="text-right">Факт. остаток</th>
          <th>Ответственный</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="s in rows" :key="s.id">
          <td>{{ s.date }}</td>
          <td>{{ objectName(s.object) ?? s.object }}</td>
          <td>{{ materialName(s.material) ?? s.material }}</td>
          <td>{{ s.unit_code ?? '—' }}</td>
          <td class="text-right">{{ s.quantity }}</td>
          <td>{{ responsibleName(s.responsible) ?? '—' }}</td>
        </tr>
        <tr v-if="!loading && rows.length===0">
          <td colspan="6" class="text-center text-gray-700-60">Нет данных</td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="join self-end">
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
import type {PageResponse, StockSnapshot, StockListFilters, SiteObject, Material, Employee} from '@/api/types'

type Query = Record<string, string | number | boolean | (string | number)[] | null | undefined>

const rows = ref<StockSnapshot[]>([])
const count = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)

const filters = ref<StockListFilters>({
  date_after: undefined, date_before: undefined, object: undefined, material: undefined, responsible: undefined,
})

const objects = ref<SiteObject[]>([])
const materials = ref<Material[]>([])
const employees = ref<Employee[]>([])

const oMap = computed(() => new Map(objects.value.map(o => [o.id, o.name])))
const mMap = computed(() => new Map(materials.value.map(m => [m.id, m.name])))
const eMap = computed(() => new Map(employees.value.map(e => [e.id, `${e.first_name || e.username}${e.last_name ? ' ' + e.last_name : ''}`])))

function objectName(id?: number) {
  return id ? oMap.value.get(id) : undefined
}

function materialName(id?: number) {
  return id ? mMap.value.get(id) : undefined
}

function responsibleName(id: number | null | undefined) {
  return id ? eMap.value.get(id) : undefined
}

async function loadRefs() {
  const [od, md, ed] = await Promise.all([
    api.get<PageResponse<SiteObject>>(endpoints.objects.list + buildQuery({page_size: 1000, ordering: 'name'})),
    api.get<PageResponse<Material>>(endpoints.materials.list + buildQuery({page_size: 1000, ordering: 'name'})),
    api.get<PageResponse<Employee>>(endpoints.employees.list + buildQuery({page_size: 1000, ordering: 'username'})),
  ])
  objects.value = od.data.results
  materials.value = md.data.results
  employees.value = ed.data.results
}

async function fetchList() {
  loading.value = true
  try {
    const q: StockListFilters & { page: number; page_size: number } = {...filters.value, page: page.value, page_size: pageSize}
    const {data} = await api.get<PageResponse<StockSnapshot>>(endpoints.stockSnapshots.list + buildQuery(q as unknown as Query))
    rows.value = data.results
    count.value = data.count
  } finally {
    loading.value = false
  }
}

function reload(p = page.value) {
  page.value = p;
  fetchList()
}

onMounted(async () => {
  await loadRefs();
  await fetchList()
})
</script>

