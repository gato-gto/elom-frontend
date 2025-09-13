<template>
  <div class="grid gap-4">
    <div class="flex flex-wrap items-end gap-2">
      <div class="grow max-w-sm">
        <FormField label="Поиск">
          <input v-model.trim="search" class="input input-bordered input-sm" placeholder="Название или сокращение" @keyup.enter="reload(1)"/>
        </FormField>
      </div>
      <button class="btn btn-sm" @click="reload(1)">Найти</button>
      <button class="btn btn-sm btn-primary" @click="openCreate">Добавить единицу</button>
    </div>

    <div class="overflow-auto border border-base-300 rounded-xl">
      <table class="table table-zebra w-full">
        <thead>
        <tr>
          <th class="text-left">ID</th>
          <th class="text-left">Код</th>
          <th class="text-left">Название</th>
          <th class="text-right">Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="u in rows" :key="u.id">
          <td>{{ u.id }}</td>
          <td>{{ u.code }}</td>
          <td>{{ u.name }}</td>
          <td class="text-right">
            <div class="inline-flex gap-2">
              <button class="btn btn-xs" @click="openEdit(u)">Изм.</button>
              <button class="btn btn-xs btn-error" @click="remove(u)" :disabled="deletingId===u.id">
                {{ deletingId === u.id ? '...' : 'Удал.' }}
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!loading && rows.length===0">
          <td colspan="4" class="text-center text-base-content/60">Нет данных</td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="join mt-2 self-end">
      <button class="btn btn-sm join-item" :disabled="page<=1" @click="reload(1)">«</button>
      <button class="btn btn-sm join-item" :disabled="page<=1" @click="reload(page-1)">Назад</button>
      <button class="btn btn-sm join-item btn-ghost no-animation">Стр. {{ page }}</button>
      <button class="btn btn-sm join-item" :disabled="page*pageSize>=count" @click="reload(page+1)">Вперёд</button>
    </div>

    <UnitForm :open="modalOpen" :initial="current" @close="modalOpen=false" @saved="onSaved"/>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {PageResponse, Unit} from '@/api/types'
import FormField from '@/components/FormField.vue'
import UnitForm from './UnitForm.vue'

const rows = ref<Unit[]>([])
const count = ref(0)
const page = ref(1)
const pageSize = 20
const search = ref('')
const loading = ref(false)

const modalOpen = ref(false)
const current = ref<Unit | null>(null)
const deletingId = ref<number | null>(null)

function openCreate() {
  current.value = null;
  modalOpen.value = true
}

function openEdit(u: Unit) {
  current.value = u;
  modalOpen.value = true
}

async function fetchList(url?: string) {
  loading.value = true
  try {
    const q = buildQuery({page: page.value, page_size: pageSize, search: search.value || undefined})
    const {data} = await api.get<PageResponse<Unit>>(url ?? (endpoints.units.list + q))
    rows.value = data.results
    count.value = data.count
  } finally {
    loading.value = false
  }
}

async function reload(p = page.value) {
  page.value = p
  await fetchList()
}

async function remove(u: Unit) {
  if (!confirm(`Удалить единицу "${u.code}"?`)) return
  deletingId.value = u.id
  try {
    await api.delete(endpoints.units.one(u.id))
    await fetchList()
  } finally {
    deletingId.value = null
  }
}

async function onSaved() {
  modalOpen.value = false
  await fetchList()
}

onMounted(() => fetchList())
</script>
