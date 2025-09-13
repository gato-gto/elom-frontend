<!-- src/pages/Materials/List.vue -->
<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">Материалы</h1>
      <button class="btn btn-primary" @click="openCreate" v-if="canEdit">Добавить материал</button>
    </div>

    <div class="flex gap-2 items-end">
      <label class="grid">
        <span class="text-xs text-base-content/70">Поиск</span>
        <input v-model.trim="search" class="input input-bordered" placeholder="name / sku / category" @keyup.enter="reload(1)"/>
      </label>
      <label class="grid">
        <span class="text-xs text-base-content/70">Сортировка</span>
        <select v-model="ordering" class="select select-bordered">
          <option value="name">name ↑</option>
          <option value="-name">name ↓</option>
          <option value="sku">sku ↑</option>
          <option value="-sku">sku ↓</option>
          <option value="id">id ↑</option>
          <option value="-id">id ↓</option>
        </select>
      </label>
      <button class="btn btn-outline" @click="reload(1)">Применить</button>
    </div>

    <div class="overflow-auto border rounded-xl">
      <table class="table">
        <thead class="bg-base-200">
        <tr>
          <th>ID</th>
          <th>Фото</th>
          <th>Название</th>
          <th>SKU</th>
          <th>Категория</th>
          <th>Ед.</th>
          <th v-if="canEdit">Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="m in rows" :key="m.id" class="odd:bg-base-100 even:bg-base-200">
          <td>{{ m.id }}</td>
          <td>
            <img v-if="m.photo_url" :src="m.photo_url" alt="" class="h-10 w-10 object-cover rounded"/>
            <span v-else class="opacity-60">нет</span>
          </td>
          <td>{{ m.name }}</td>
          <td>{{ m.sku || '—' }}</td>
          <td>{{ m.category_name || '—' }}</td>
          <td>{{ m.default_unit_code || m.default_unit }}</td>
          <td v-if="canEdit">
            <div class="flex gap-2">
              <button class="btn btn-outline btn-sm" @click="openEdit(m)">Изм.</button>
              <button class="btn btn-outline btn-sm" :disabled="deletingId===m.id" @click="remove(m)">
                {{ deletingId === m.id ? '...' : 'Удал.' }}
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td class="text-center opacity-60" :colspan="canEdit ? 7 : 6">Нет данных</td>
        </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between">
      <div class="text-sm opacity-70">Всего: {{ total }}</div>
      <div class="flex items-center gap-2">
        <button class="btn btn-outline btn-sm" :disabled="page<=1" @click="reload(page-1)">Назад</button>
        <span class="text-sm">Стр. {{ page }}</span>
        <button class="btn btn-outline btn-sm" :disabled="rows.length===0 || (page * pageSize) >= total" @click="reload(page+1)">Далее</button>
      </div>
    </div>

    <Modal v-model="modalOpen" :title="editTarget ? 'Редактировать материал' : 'Новый материал'">
      <MaterialForm :initial="editTarget" @saved="onSaved" @cancel="modalOpen=false"/>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from 'vue'
import api from '@/api/client'
import {endpoints, buildQuery} from '@/api/endpoints'
import type {Material, PageResponse} from '@/api/types'
import {useAuthStore} from '@/stores/auth'
import Modal from '@/components/Modal.vue'
import MaterialForm from './MaterialForm.vue'

const rows = ref<Material[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const search = ref('');
const ordering = ref('name')
const modalOpen = ref(false);
const editTarget = ref<Material | null>(null)
const deletingId = ref<number | null>(null)
const auth = useAuthStore();
const canEdit = computed(() => auth.role === 'admin')

async function reload(toPage?: number) {
  if (toPage) page.value = toPage
  const qs = buildQuery({page: page.value, page_size: pageSize, search: search.value || undefined, ordering: ordering.value})
  const {data} = await api.get<PageResponse<Material>>(`${endpoints.materials}${qs}`)
  rows.value = data.results;
  total.value = data.count
}

function openCreate() {
  editTarget.value = null;
  modalOpen.value = true
}

function openEdit(m: Material) {
  editTarget.value = m;
  modalOpen.value = true
}

async function onSaved() {
  modalOpen.value = false;
  await reload(page.value)
}

async function remove(m: Material) {
  if (!confirm(`Удалить материал "${m.name}" ?`)) return
  try {
    deletingId.value = m.id;
    await api.delete(`${endpoints.materials}${m.id}/`);
    await reload(page.value)
  } finally {
    deletingId.value = null
  }
}

onMounted(() => reload(1))
</script>

<style scoped>
/* no @apply */
</style>
