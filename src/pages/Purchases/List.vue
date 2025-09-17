<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">Закупки</h1>
      <button class="btn btn-primary" @click="openCreateModal">Новая закупка</button>
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
          <label class="label"><span class="label-text">Ответственный</span></label>
          <select v-model.number="filters.responsible" class="select select-bordered select-sm">
            <option :value="undefined">Все</option>
            <option v-for="e in employees" :key="e.id" :value="e.id">
              {{ e.first_name || e.username }} {{ e.last_name || '' }}
            </option>
          </select>
        </fieldset>
        <fieldset class="fieldset md:col-span-2">
          <label class="label"><span class="label-text">Поиск</span></label>
          <input v-model.trim="filters.search" class="input input-bordered input-sm" placeholder="поставщик/комментарий" @keyup.enter="reload(1)"/>
        </fieldset>

        <div class="md:col-span-6 flex justify-end gap-2">
          <button class="btn btn-sm btn-outline" @click="reload(1)">Применить</button>
          <a class="btn btn-sm" :href="exportUrl" target="_blank" rel="noreferrer">Экспорт .xlsx</a>
        </div>
      </div>
    </div>

    <div class="overflow-auto border border-gray-200 rounded-xl">
      <table class="table table-zebra w-full">
        <thead>
        <tr>
          <th>Дата</th>
          <th>Объект</th>
          <th>Поставщик</th>
          <th>Ответственный</th>
          <th class="text-right">Позиций</th>
          <th class="text-right">Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="p in rows" :key="p.id">
          <td>{{ p.date }}</td>
          <td>{{ (p as any).object_name ?? p.object }}</td>
          <td>{{ p.supplier ?? '—' }}</td>
          <td>{{ (p as any).responsible_name ?? p.responsible ?? '—' }}</td>
          <td class="text-right">{{ p.items?.length ?? 0 }}</td>
          <td class="text-right">
            <RouterLink class="btn btn-xs btn-outline" :to="`/purchases/${p.id}`">Открыть</RouterLink>
          </td>
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

    <!-- Modal for creating new purchase -->
    <Modal v-model="modalOpen" :title="'Новая закупка'" size="6xl" :closable="true">
      <PurchaseForm @saved="onPurchaseSaved" @cancel="modalOpen = false" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {PageResponse, Purchase, PurchaseListFilters, PurchaseExportQuery, SiteObject, Employee} from '@/api/types'
import Modal from '@/components/Modal.vue'
import PurchaseForm from './PurchaseForm.vue'

type Query = Record<string, string | number | boolean | (string | number)[] | null | undefined>

const rows = ref<Purchase[]>([])
const count = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const modalOpen = ref(false)

const filters = ref<PurchaseListFilters>({
  date_after: undefined, date_before: undefined, object: undefined, responsible: undefined, search: '', ordering: '-date',
})

const objects = ref<SiteObject[]>([])
const employees = ref<Employee[]>([])

async function loadRefs() {
  const [{data: od}, {data: ed}] = await Promise.all([
    api.get<PageResponse<SiteObject>>(endpoints.objects.list + buildQuery({page_size: 1000, ordering: 'name'})),
    api.get<PageResponse<Employee>>(endpoints.employees.list + buildQuery({page_size: 1000, ordering: 'username'})),
  ])
  objects.value = od.results
  employees.value = ed.results
}

async function fetchList() {
  loading.value = true
  try {
    const q: PurchaseListFilters & { page: number; page_size: number } = {...filters.value, page: page.value, page_size: pageSize}
    const {data} = await api.get<PageResponse<Purchase>>(endpoints.purchases.list + buildQuery(q as unknown as Query))
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

function openCreateModal() {
  modalOpen.value = true
}

function onPurchaseSaved() {
  modalOpen.value = false
  // Reload the list to show the new purchase
  fetchList()
}

const exportUrl = computed(() => {
  const q: PurchaseExportQuery = {...filters.value, export: 'xlsx'} as PurchaseExportQuery
  return endpoints.purchases.list + buildQuery(q as unknown as Query)
})

onMounted(async () => {
  await loadRefs();
  await fetchList()
})
</script>

