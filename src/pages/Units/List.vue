<!-- src/pages/Units/List.vue -->
<template>
  <div class="grid gap-4">
    <div class="flex flex-wrap items-end gap-2">
      <div class="grow max-w-sm">
        <FormField label="Поиск">
          <input v-model.trim="search" class="input" placeholder="Название или сокращение" @keyup.enter="reload()"/>
        </FormField>
      </div>
      <button class="btn" @click="reload">Найти</button>
      <button class="btn" @click="openCreate">Добавить единицу</button>
    </div>

    <div class="card p-4">
      <div class="w-full overflow-auto rounded-lg border border-surface-200">
        <table class="w-full text-sm">
          <thead class="bg-surface-50">
          <tr>
            <th class="px-3 py-2 text-left">ID</th>
            <th class="px-3 py-2 text-left">Название</th>
            <th class="px-3 py-2 text-left">Сокращение</th>
            <th class="px-3 py-2 text-left w-28"></th>
          </tr>
          </thead>
          <tbody>
          <tr v-if="rows.length === 0">
            <td colspan="4" class="px-3 py-6 text-center text-surface-500">Нет данных</td>
          </tr>
          <tr v-for="u in rows" :key="u.id" class="border-t border-surface-100">
            <td class="px-3 py-2">{{ u.id }}</td>
            <td class="px-3 py-2">{{ u.name }}</td>
            <td class="px-3 py-2">{{ u.short_name }}</td>
            <td class="px-3 py-2">
              <div class="flex gap-2">
                <button class="btn btn-sm" @click="openEdit(u)">Изм.</button>
                <button class="btn btn-sm" @click="remove(u)" :disabled="deletingId===u.id">
                  {{ deletingId === u.id ? '...' : 'Удал.' }}
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between gap-2 py-3">
        <div class="text-xs text-surface-500"><span v-if="count !== null">Всего: {{ count }}</span></div>
        <div class="inline-flex items-center gap-1">
          <button class="btn btn-sm" :disabled="!previous" @click="go(previous)">← Назад</button>
          <button class="btn btn-sm" :disabled="!next" @click="go(next)">Вперёд →</button>
        </div>
      </div>
    </div>

    <Modal v-model="modalOpen" :title="editTarget ? 'Редактировать единицу' : 'Новая единица'">
      <UnitForm :initial="editTarget" @saved="onSaved" @cancel="modalOpen=false"/>
      <template #footer>
        <div class="flex justify-end">
          <button class="btn btn-ghost" @click="modalOpen=false">Отмена</button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue'
import api from '@/api/client'
import {endpoints} from '@/api/endpoints'
import type {PageResponse} from '@/api/types'
import Modal from '@/components/Modal.vue'
import FormField from '@/components/FormField.vue'
import UnitForm from './UnitForm.vue'

type Unit = { id: number; name: string; short_name: string }

const search = ref<string>('')
const rows = ref<Unit[]>([])
const count = ref<number | null>(null)
const next = ref<string | null>(null)
const previous = ref<string | null>(null)
const pageUrl = ref<string | null>(null)

const deletingId = ref<number | null>(null)

const modalOpen = ref(false)
const editTarget = ref<Unit | null>(null)

async function fetchList(url?: string) {
  const path = url ?? `${endpoints.common.units}?search=${encodeURIComponent(search.value)}`
  const res = await api.get<PageResponse<Unit>>(path)
  rows.value = res.data.results
  count.value = res.data.count
  next.value = res.data.next
  previous.value = res.data.previous
  pageUrl.value = path
}

function reload() {
  fetchList(`${endpoints.common.units}?search=${encodeURIComponent(search.value)}`)
}

function go(url: string | null) {
  if (url) fetchList(url)
}

function openCreate() {
  editTarget.value = null;
  modalOpen.value = true
}

function openEdit(u: Unit) {
  editTarget.value = u;
  modalOpen.value = true
}

async function remove(u: Unit) {
  if (!confirm(`Удалить единицу "${u.name}"?`)) return
  try {
    deletingId.value = u.id
    await api.delete(`${endpoints.common.units}${u.id}/`)
    await fetchList(pageUrl.value ?? endpoints.common.units)
  } finally {
    deletingId.value = null
  }
}

async function onSaved() {
  modalOpen.value = false
  await fetchList(pageUrl.value ?? endpoints.common.units)
}

onMounted(() => fetchList())
</script>
