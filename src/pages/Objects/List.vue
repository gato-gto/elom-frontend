<template>
  <div class="grid gap-4">
    <div class="flex flex-wrap items-end gap-2">
      <div class="grow max-w-sm">
        <FormField label="Поиск">
          <input v-model.trim="search" class="input input-bordered input-sm" placeholder="Название/адрес" @keyup.enter="reload(1)"/>
        </FormField>
      </div>
      <button class="btn btn-sm" @click="reload(1)">Найти</button>
      <button class="btn btn-sm btn-primary" @click="openCreate">Добавить объект</button>
    </div>

    <div class="overflow-auto border border-base-300 rounded-xl">
      <table class="table table-zebra w-full">
        <thead>
        <tr>
          <th class="text-left">ID</th>
          <th class="text-left">Название</th>
          <th class="text-left">Адрес</th>
          <th class="text-left">Активен</th>
          <th class="text-right">Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="o in rows" :key="o.id">
          <td class="align-top">{{ o.id }}</td>
          <td class="align-top">{{ o.name }}</td>
          <td class="align-top">{{ o.address ?? '—' }}</td>
          <td class="align-top">
              <span class="badge" :class="o.is_active ? 'badge-success' : 'badge-ghost'">
                {{ o.is_active ? 'Да' : 'Нет' }}
              </span>
          </td>
          <td class="text-right">
            <div class="inline-flex gap-2">
              <button class="btn btn-xs" @click="openEdit(o)">Изм.</button>
              <button class="btn btn-xs btn-error" @click="remove(o)" :disabled="deletingId===o.id">
                {{ deletingId === o.id ? '...' : 'Удал.' }}
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!loading && rows.length===0">
          <td colspan="5" class="text-center text-base-content/60">Нет данных</td>
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

    <ObjectForm :open="modalOpen" :initial="current" @close="modalOpen=false" @saved="onSaved"/>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {PageResponse, ObjectLite} from '@/api/types'
import FormField from '@/components/FormField.vue'
import ObjectForm from './ObjectForm.vue'

const rows = ref<ObjectLite[]>([])
const count = ref(0)
const page = ref(1)
const pageSize = 20
const search = ref('')
const loading = ref(false)

const modalOpen = ref(false)
const current = ref<ObjectLite | null>(null)
const deletingId = ref<number | null>(null)

function openCreate() {
  current.value = null;
  modalOpen.value = true
}

function openEdit(o: ObjectLite) {
  current.value = o;
  modalOpen.value = true
}

async function fetchList(url?: string) {
  loading.value = true
  try {
    const q = buildQuery({page: page.value, page_size: pageSize, search: search.value || undefined})
    const {data} = await api.get<PageResponse<ObjectLite>>(url ?? (endpoints.objects.list + q))
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

async function remove(o: ObjectLite) {
  if (!confirm(`Удалить объект "${o.name}"?`)) return
  deletingId.value = o.id
  try {
    await api.delete(endpoints.objects.one(o.id))
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
