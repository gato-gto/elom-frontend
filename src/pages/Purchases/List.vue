<!-- src/pages/Purchases/List.vue -->
<template>
  <div class="grid gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold">Закупки</h1>
        <p class="text-sm opacity-70">Фильтры, поиск, экспорт .xlsx</p>
      </div>
      <div class="flex gap-2">
        <a :href="exportUrl" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Экспорт .xlsx</a>
        <RouterLink class="btn btn-primary btn-sm" :to="{ name: 'purchases.new' }">Новая закупка</RouterLink>
      </div>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 border">
      <div class="card-body grid gap-3 md:grid-cols-2">
        <div class="flex flex-wrap gap-3 items-end">
          <label class="form-control">
            <span class="label-text text-xs">Поиск</span>
            <input v-model.trim="search" class="input input-bordered input-sm" placeholder="поставщик / комментарий" @keyup.enter="reload(1)"/>
          </label>
          <label class="form-control">
            <span class="label-text text-xs">Сортировка</span>
            <select v-model="ordering" class="select select-bordered select-sm w-44">
              <option value="-date">date ↓</option>
              <option value="date">date ↑</option>
              <option value="-created_at">created_at ↓</option>
              <option value="created_at">created_at ↑</option>
            </select>
          </label>
          <button class="btn btn-outline btn-sm" @click="reload(1)">Применить</button>
        </div>

        <div class="flex flex-wrap gap-3 items-end">
          <label class="form-control">
            <span class="label-text text-xs">Дата от</span>
            <input v-model="dateFrom" type="date" class="input input-bordered input-sm"/>
          </label>
          <label class="form-control">
            <span class="label-text text-xs">Дата до</span>
            <input v-model="dateTo" type="date" class="input input-bordered input-sm"/>
          </label>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-auto border rounded-xl">
      <table class="table table-zebra">
        <thead class="bg-base-200">
        <tr>
          <th>ID</th>
          <th>Дата</th>
          <th>Объект</th>
          <th>Поставщик</th>
          <th>Ответственный</th>
          <th class="text-right">Сумма</th>
          <th class="text-right">Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr v-if="loading">
          <td :colspan="7">
            <div class="flex items-center gap-2">
              <span class="loading loading-spinner loading-sm"></span>
              <span>Загрузка…</span>
            </div>
          </td>
        </tr>
        <tr v-for="p in rows" :key="p.id">
          <td class="whitespace-nowrap">{{ p.id }}</td>
          <td class="whitespace-nowrap">{{ p.date }}</td>
          <td>{{ p.object_name || p.object }}</td>
          <td>{{ p.supplier || '—' }}</td>
          <td>{{ p.responsible_name || p.responsible || '—' }}</td>
          <td class="text-right whitespace-nowrap">{{ p.total_amount ? formatMoney(p.total_amount) : '—' }}</td>
          <td class="text-right">
            <div class="join join-horizontal justify-end">
              <RouterLink class="btn btn-outline btn-xs join-item" :to="{ name: 'purchases.edit', params:{ id: p.id } }">Изм.</RouterLink>
              <button class="btn btn-outline btn-xs join-item" :disabled="deletingId===p.id" @click="remove(p)">
                {{ deletingId === p.id ? '…' : 'Удал.' }}
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!loading && rows.length===0">
          <td :colspan="7" class="text-center opacity-60">Нет данных</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between">
      <div class="text-sm opacity-70">Всего: {{ total }}</div>
      <div class="join">
        <button class="btn btn-outline btn-sm join-item" :disabled="page<=1" @click="reload(page-1)">Назад</button>
        <button class="btn btn-outline btn-sm join-item">Стр. {{ page }}</button>
        <button class="btn btn-outline btn-sm join-item" :disabled="rows.length===0 || (page * pageSize) >= total" @click="reload(page+1)">Далее</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, watch, computed} from 'vue'
import api from '@/api/client'
import {endpoints, buildQuery} from '@/api/endpoints'
import type {PageResponse, Purchase} from '@/api/types'

const rows = ref<Purchase[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20

const search = ref('')
const ordering = ref('-date')
const dateFrom = ref<string | null>(null)
const dateTo = ref<string | null>(null)

const loading = ref(false)
const deletingId = ref<number | null>(null)

async function reload(toPage?: number) {
  if (toPage) page.value = toPage
  loading.value = true
  try {
    const qs = buildQuery({
      page: page.value, page_size: pageSize,
      ordering: ordering.value,
      search: search.value || undefined,
      date_from: dateFrom.value || undefined,
      date_to: dateTo.value || undefined,
    })
    const {data} = await api.get<PageResponse<Purchase>>(`${endpoints.purchases}${qs}`)
    rows.value = data.results
    total.value = data.count
  } finally {
    loading.value = false
  }
}

async function remove(p: Purchase) {
  if (!confirm(`Удалить закупку #${p.id}?`)) return
  try {
    deletingId.value = p.id
    await api.delete(`${endpoints.purchases}${p.id}/`)
    await reload(page.value)
  } finally {
    deletingId.value = null
  }
}

const exportUrl = computed(() => {
  const base = (endpoints as any).purchases || '/api/v1/purchases/'
  const params = new URLSearchParams()
  if (search.value) params.set('search', search.value)
  if (ordering.value) params.set('ordering', ordering.value)
  if (dateFrom.value) params.set('date_from', dateFrom.value)
  if (dateTo.value) params.set('date_to', dateTo.value)
  params.set('export', 'xlsx')
  return `${base}?${params.toString()}`
})

function formatMoney(v: string | number) {
  const n = Number(v || 0)
  return new Intl.NumberFormat('ru-RU').format(n) + ' UZS'
}

onMounted(() => reload(1))
watch([search, ordering, dateFrom, dateTo], () => reload(1))
</script>

<style scoped>
/* no @apply */
</style>
