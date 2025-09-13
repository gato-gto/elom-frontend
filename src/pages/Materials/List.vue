<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">Материалы</h1>
      <button class="btn btn-primary" @click="openCreate" v-if="canEdit">Добавить материал</button>
    </div>

    <div class="flex gap-2 items-end">
      <label class="grid">
        <span class="text-xs text-base-content/70">Поиск</span>
        <input v-model.trim="search" class="input input-bordered input-sm" placeholder="name / sku / category" @keyup.enter="reload(1)"/>
      </label>
      <label class="grid">
        <span class="text-xs text-base-content/70">Сортировка</span>
        <select v-model="ordering" class="select select-bordered select-sm">
          <option value="name">name ↑</option>
          <option value="-name">name ↓</option>
          <option value="sku">sku ↑</option>
          <option value="-sku">sku ↓</option>
          <option value="id">id ↑</option>
          <option value="-id">id ↓</option>
        </select>
      </label>
      <button class="btn btn-outline btn-sm" @click="reload(1)">Применить</button>
    </div>

    <div class="overflow-auto border border-base-300 rounded-xl">
      <table class="table table-zebra w-full">
        <thead>
        <tr>
          <th class="text-left">ID</th>
          <th class="text-left">Фото</th>
          <th class="text-left">Название</th>
          <th class="text-left">SKU</th>
          <th class="text-left">Категория</th>
          <th class="text-left">Ед.</th>
          <th class="text-left">Статус</th>
          <th v-if="canEdit" class="text-right">Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="m in rows" :key="m.id">
          <td>{{ m.id }}</td>
          <td>
            <img v-if="m.photo_url" :src="m.photo_url" alt="" class="h-10 w-10 object-cover rounded"/>
            <span v-else class="opacity-60">нет</span>
          </td>
          <td>{{ m.name }}</td>
          <td>{{ m.sku || '—' }}</td>
          <td>{{ m.category_name || '—' }}</td>
          <td>{{ m.default_unit_code || m.default_unit }}</td>
          <td>
              <span class="badge" :class="(m.is_active ?? true) ? 'badge-success' : 'badge-ghost'">
                {{ (m.is_active ?? true) ? 'Активен' : 'Выключен' }}
              </span>
          </td>
          <td v-if="canEdit" class="text-right">
            <div class="inline-flex gap-2">
              <button class="btn btn-xs" @click="openEdit(m)">Изм.</button>
              <button class="btn btn-xs btn-error" @click="remove(m)" :disabled="deletingId===m.id">
                {{ deletingId === m.id ? '...' : 'Удал.' }}
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!loading && rows.length===0">
          <td :colspan="canEdit ? 8 : 7" class="text-center text-base-content/60">Нет данных</td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="join mt-2 self-end">

    </div>

    <div class="flex items-center justify-between">
      <div class="text-sm opacity-70">Всего: {{ count }}</div>
      <div class="flex items-center gap-2">
        <button class="btn btn-sm join-item" :disabled="page<=1" @click="reload(1)">«</button>
        <button class="btn btn-sm join-item" :disabled="page<=1" @click="reload(page-1)">Назад</button>
        <span class="text-sm">Стр. {{ page }}</span>
        <button class="btn btn-sm join-item" :disabled="page*pageSize>=count" @click="reload(page+1)">Вперёд</button>
      </div>
    </div>

    <Modal v-model="modalOpen" :title="current ? 'Редактировать материал' : 'Новый материал'">
      <MaterialForm :initial="current" @saved="onSaved" @cancel="modalOpen=false"/>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {PageResponse, Material, Me} from '@/api/types'
import MaterialForm from './MaterialForm.vue'
import {useAuthStore} from '@/stores/auth'
import Modal from "@/components/Modal.vue";

const auth = useAuthStore()
const canEdit = computed(() => {
  const role = auth.role as Me['role'] | undefined
  return role === 'admin' || role === 'director'
})

const rows = ref<Material[]>([])
const count = ref(0)
const page = ref(1)
const pageSize = 20
const search = ref('')
const ordering = ref<'name' | '-name' | 'sku' | '-sku' | 'id' | '-id'>('name')
const loading = ref(false)

const modalOpen = ref(false)
const current = ref<Material | null>(null)
const deletingId = ref<number | null>(null)

function openCreate() {
  current.value = null;
  modalOpen.value = true
}

function openEdit(m: Material) {
  current.value = m;
  modalOpen.value = true
}

async function fetchList(url?: string) {
  loading.value = true
  try {
    const q = buildQuery({
      page: page.value,
      page_size: pageSize,
      search: search.value || undefined,
      ordering: ordering.value,
    })
    const {data} = await api.get<PageResponse<Material>>(url ?? (endpoints.materials.list + q))
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

async function remove(m: Material) {
  if (!confirm(`Удалить материал "${m.name}"?`)) return
  deletingId.value = m.id
  try {
    await api.delete(endpoints.materials.one(m.id))
    await fetchList()
  } finally {
    deletingId.value = null
  }
}

async function onSaved() {
  modalOpen.value = false
  await fetchList()
}

onMounted(() => reload(1))
</script>
