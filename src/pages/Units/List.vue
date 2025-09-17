<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">Единицы измерения</h1>
      <button class="btn btn-primary" @click="openCreate" v-if="canEdit">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Добавить единицу
      </button>
    </div>

    <!-- Фильтры и поиск -->
    <div class="flex gap-2 items-end">
      <label class="grid">
        <span class="text-xs text-gray-700-600">Поиск</span>
        <input 
          v-model.trim="search" 
          class="input input-bordered input-sm" 
          placeholder="название / код" 
          @keyup.enter="reload(1)"
        />
      </label>
      <label class="grid">
        <span class="text-xs text-gray-700-600">Сортировка</span>
        <select v-model="ordering" class="select select-bordered select-sm">
          <option value="name">название ↑</option>
          <option value="-name">название ↓</option>
          <option value="code">код ↑</option>
          <option value="-code">код ↓</option>
          <option value="id">id ↑</option>
          <option value="-id">id ↓</option>
        </select>
      </label>
      <button class="btn btn-outline btn-sm" @click="reload(1)">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        Применить
      </button>
    </div>

    <!-- Таблица -->
    <div class="overflow-auto border border-gray-200 rounded-xl">
      <table class="table table-zebra w-full">
        <thead>
        <tr>
          <th class="text-left">ID</th>
          <th class="text-left">Название</th>
          <th class="text-left">Код</th>
          <th v-if="canEdit" class="text-right">Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="u in rows" :key="u.id">
          <td>{{ u.id }}</td>
          <td>
            <div class="font-medium">{{ u.name }}</div>
          </td>
          <td>
            <div class="text-sm text-gray-700-600 font-mono">{{ u.code }}</div>
          </td>
          <td v-if="canEdit" class="text-right">
            <div class="inline-flex gap-2">
              <button class="btn btn-xs btn-outline" @click="openEdit(u)">
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                Изм.
              </button>
              <button 
                class="btn btn-xs btn-error" 
                @click="remove(u)" 
                :disabled="deletingId===u.id"
              >
                <svg v-if="deletingId !== u.id" class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                {{ deletingId === u.id ? '...' : 'Удал.' }}
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!loading && rows.length===0">
          <td :colspan="canEdit ? 4 : 3" class="text-center text-gray-700-500 py-8">
            <div class="flex flex-col items-center gap-2">
              <svg class="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Нет единиц измерения
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Пагинация -->
    <div class="flex items-center justify-between">
      <div class="text-sm opacity-70">Всего: {{ count }}</div>
      <div class="flex items-center gap-2">
        <button class="btn btn-sm join-item" :disabled="page<=1" @click="reload(1)">«</button>
        <button class="btn btn-sm join-item" :disabled="page<=1" @click="reload(page-1)">Назад</button>
        <span class="text-sm">Стр. {{ page }}</span>
        <button class="btn btn-sm join-item" :disabled="page*pageSize>=count" @click="reload(page+1)">Вперёд</button>
      </div>
    </div>

    <Modal v-model="modalOpen" :title="''" size="lg" :closable="true">
      <UnitForm :initial="current" @saved="onSaved" @cancel="modalOpen=false"/>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {PageResponse, Unit, Me} from '@/api/types'
import UnitForm from './UnitForm.vue'
import Modal from '@/components/Modal.vue'
import {useAuthStore} from '@/stores/auth'
import {useUiStore} from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()

const canEdit = computed(() => {
  const role = auth.role as Me['role'] | undefined
  return role === 'admin' || role === 'director'
})

const rows = ref<Unit[]>([])
const count = ref(0)
const page = ref(1)
const pageSize = 20
const search = ref('')
const ordering = ref<'name' | '-name' | 'code' | '-code' | 'id' | '-id'>('name')
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
    const query: Record<string, any> = {
      page: page.value,
      page_size: pageSize,
      ordering: ordering.value,
    }
    
    if (search.value) query.search = search.value
    
    const q = buildQuery(query)
    const {data} = await api.get<PageResponse<Unit>>(url ?? (endpoints.units.list + q))
    rows.value = data.results
    count.value = data.count
  } catch (e: any) {
    ui.toast({type: 'error', text: 'Ошибка загрузки единиц измерения'})
    console.error('Error fetching units:', e)
  } finally {
    loading.value = false
  }
}

async function reload(p = page.value) {
  page.value = p
  await fetchList()
}

async function remove(u: Unit) {
  if (!confirm(`Удалить единицу измерения "${u.name}"?`)) return
  deletingId.value = u.id
  try {
    await api.delete(endpoints.units.one(u.id))
    ui.toast({type: 'success', text: `Единица измерения "${u.name}" удалена`})
    await fetchList()
  } catch (e: any) {
    ui.toast({type: 'error', text: 'Ошибка удаления единицы измерения'})
    console.error('Error deleting unit:', e)
  } finally {
    deletingId.value = null
  }
}

async function onSaved() {
  modalOpen.value = false
  ui.toast({type: 'success', text: 'Единица измерения сохранена'})
  await fetchList()
}

onMounted(() => fetchList())
</script>
