<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">Закупки</h1>
      <RouterLink class="btn btn-primary" to="/purchases/new">Новая закупка</RouterLink>
    </div>

    <!-- Фильтры -->
    <div class="grid md:grid-cols-5 gap-2 items-end">
      <label class="form-control">
        <span class="label-text">Дата с</span>
        <input v-model="dateFrom" type="date" class="input input-bordered input-sm"/>
      </label>
      <label class="form-control">
        <span class="label-text">Дата по</span>
        <input v-model="dateTo" type="date" class="input input-bordered input-sm"/>
      </label>
      <label class="form-control">
        <span class="label-text">Объект</span>
        <select v-model.number="objectId" class="select select-bordered select-sm">
          <option :value="undefined">Все</option>
          <option v-for="o in objects" :key="o.id" :value="o.id">{{ o.name }}</option>
        </select>
      </label>
      <label class="form-control">
        <span class="label-text">Ответственный</span>
        <select v-model.number="responsibleId" class="select select-bordered select-sm">
          <option :value="undefined">Все</option>
          <option v-for="e in employees" :key="e.id" :value="e.id">
            {{ e.first_name || e.username }} {{ e.last_name || '' }}
          </option>
        </select>
      </label>
      <div class="flex gap-2">
        <label class="form-control grow">
          <span class="label-text">Поиск</span>
          <input v-model.trim="search" class="input input-bordered input-sm" placeholder="поставщик/комментарий/№…" @keyup.enter="reload(1)"/>
        </label>
        <button class="btn btn-sm btn-outline self-end" @click="reload(1)">Применить</button>
      </div>
    </div>

    <!-- Таблица -->
    <div class="overflow-auto border border-base-300 rounded-xl">
      <table class="table table-zebra w-full">
        <thead>
        <tr>
          <th>Дата</th>
          <th>Объект</th>
          <th>Поставщик</th>
          <th>Ответственный</th>
          <th class="text-right">Сумма</th>
          <th>Статус</th>
          <th class="text-right">Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="p in rows" :key="p.id">
          <td>{{ p.date }}</td>
          <td>{{ p.object_name }}</td>
          <td>{{ p.supplier || '—' }}</td>
          <td>{{ p.responsible_name || '—' }}</td>
          <td class="text-right">{{ p.total_amount ?? '—' }}</td>
          <td>
              <span class="badge" :class="p.is_archived ? 'badge-ghost' : 'badge-success'">
                {{ p.is_archived ? 'Архив' : 'Активна' }}
              </span>
          </td>
          <td class="text-right">
            <div class="inline-flex gap-2">
              <RouterLink class="btn btn-xs" :to="`/purchases/${p.id}`">Открыть</RouterLink>
              <button class="btn btn-xs btn-error" @click="remove(p)" :disabled="deletingId===p.id">
                {{ deletingId === p.id ? '...' : 'Удал.' }}
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!loading && rows.length===0">
          <td colspan="7" class="text-center text-base-content/60">Нет данных</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Пагинация + экспорт -->
    <div class="flex items-center justify-between">
      <div class="join">
        <button class="btn btn-sm join-item" :disabled="page<=1" @click="reload(1)">«</button>
        <button class="btn btn-sm join-item" :disabled="page<=1" @click="reload(page-1)">Назад</button>
        <button class="btn btn-sm join-item btn-ghost no-animation">Стр. {{ page }}</button>
        <button class="btn btn-sm join-item" :disabled="page*pageSize>=count" @click="reload(page+1)">Вперёд</button>
      </div>
      <a class="btn btn-sm btn-outline" :href="exportUrl" target="_blank" rel="noreferrer">Экспорт .xlsx</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {PageResponse, Purchase, ObjectLite, Employee} from '@/api/types'

const rows = ref<Purchase[]>([])
const count = ref(0)
const page = ref(1)
const pageSize = 20
const search = ref('')
const dateFrom = ref<string | undefined>()
const dateTo = ref<string | undefined>()
const objectId = ref<number | undefined>()
const responsibleId = ref<number | undefined>()
const loading = ref(false)
const deletingId = ref<number | null>(null)

const objects = ref<ObjectLite[]>([])
const employees = ref<Employee[]>([])

async function loadRefs() {
  const [{data: od}, {data: ed}] = await Promise.all([
    api.get<PageResponse<ObjectLite>>(endpoints.objects.list + buildQuery({page_size: 1000})),
    api.get<PageResponse<Employee>>(endpoints.employees.list + buildQuery({page_size: 1000})),
  ])
  objects.value = od.results
  employees.value = ed.results
}

async function fetchList() {
  loading.value = true
  try {
    const q = buildQuery({
      page: page.value,
      page_size: pageSize,
      search: search.value || undefined,
      date_after: dateFrom.value || undefined,   // Допущение: django-filter алиасы
      date_before: dateTo.value || undefined,
      object: objectId.value,
      responsible: responsibleId.value,
      ordering: '-date',
    })
    const {data} = await api.get<PageResponse<Purchase>>(endpoints.purchases.list + q)
    rows.value = data.results
    count.value = data.count
  } finally {
    loading.value = false
  }
}

function reload(p = page.value) {
  page.value = p
  fetchList()
}

async function remove(p: Purchase) {
  if (!confirm(`Удалить закупку от ${p.date}?`)) return
  deletingId.value = p.id
  try {
    await api.delete(endpoints.purchases.one(p.id))
    await fetchList()
  } finally {
    deletingId.value = null
  }
}

const exportUrl = computed(() => {
  const q = buildQuery({
    search: search.value || undefined,
    date_after: dateFrom.value || undefined,
    date_before: dateTo.value || undefined,
    object: objectId.value,
    responsible: responsibleId.value,
    export: 'xlsx', // Допущение: сервер вернёт файл
  })
  return endpoints.purchases.list + q
})

onMounted(async () => {
  await loadRefs()
  await fetchList()
})
</script>
