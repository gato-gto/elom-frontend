<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">Архив периодов</h1>
      <button class="btn btn-primary" @click="openCloseModal">Закрыть период</button>
    </div>

    <!-- Фильтры -->
    <div class="card bg-white border">
      <div class="card-body grid md:grid-cols-3 gap-4">
        <fieldset class="fieldset">
          <label class="label" for="ar-month"><span class="label-text">Месяц</span></label>
          <input id="ar-month" v-model="month" type="month" class="input input-bordered input-sm"/>
        </fieldset>

        <fieldset class="fieldset">
          <label class="label" for="ar-obj"><span class="label-text">Объект</span></label>
          <select id="ar-obj" v-model.number="objectId" class="select select-bordered select-sm">
            <option :value="undefined">Все</option>
            <option v-for="o in objects" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
        </fieldset>

        <div class="md:col-span-1 flex items-end justify-end">
          <button class="btn btn-sm btn-outline" @click="reload(1)">Применить</button>
        </div>
      </div>
    </div>

    <!-- Таблица -->
    <div class="overflow-auto border border-gray-200 rounded-xl">
      <table class="table table-zebra w-full">
        <thead>
        <tr>
          <th>Месяц</th>
          <th>Объект</th>
          <th>Закрыто</th>
          <th>Статус</th>
          <th class="text-right">Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="p in rows" :key="p.id">
          <td>{{ p.month }}</td>
          <td>{{ p.object_name ?? p.object }}</td>
          <td>{{ p.closed_at ?? '—' }}</td>
          <td>
              <span class="badge" :class="p.is_closed ? 'badge-ghost' : 'badge-success'">
                {{ p.is_closed ? 'Закрыт' : 'Открыт' }}
              </span>
          </td>
          <td class="text-right">
            <button
                class="btn btn-xs btn-warning"
                :disabled="busyId===p.id || !p.is_closed"
                @click="reopen(p)"
            >Открыть
            </button>
          </td>
        </tr>
        <tr v-if="!loading && rows.length===0">
          <td colspan="5" class="text-center text-gray-700-60">Нет данных</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Пагинация -->
    <div class="join self-end">
      <button class="btn btn-sm join-item" :disabled="page<=1" @click="reload(1)">«</button>
      <button class="btn btn-sm join-item" :disabled="page<=1" @click="reload(page-1)">Назад</button>
      <button class="btn btn-sm join-item btn-ghost no-animation">Стр. {{ page }}</button>
      <button class="btn btn-sm join-item" :disabled="page*pageSize>=count" @click="reload(page+1)">Вперёд</button>
    </div>

    <!-- Модалка закрытия периода -->
    <dialog ref="dlg" class="modal">
      <div class="modal-box">
        <h3 class="font-semibold mb-3">Закрыть период</h3>
        <div class="grid gap-3">
          <fieldset class="fieldset">
            <label class="label" for="dlg-month"><span class="label-text">Месяц*</span></label>
            <input id="dlg-month" v-model="closeMonth" type="month" class="input input-bordered"/>
          </fieldset>
          <fieldset class="fieldset">
            <label class="label" for="dlg-object"><span class="label-text">Объект*</span></label>
            <select id="dlg-object" v-model.number="closeObjectId" class="select select-bordered">
              <option :value="undefined" disabled>Выберите объект</option>
              <option v-for="o in objects" :key="o.id" :value="o.id">{{ o.name }}</option>
            </select>
          </fieldset>
        </div>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="closeDialog">Отмена</button>
          <button class="btn btn-primary" :disabled="closing || !canClose" @click="closePeriod">
            {{ closing ? 'Закрываем…' : 'Закрыть' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import {computed, ref, onMounted} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {
  PageResponse,
  ArchivePeriod,
  ArchivePeriodRequest,
  ArchiveListQuery,
  SiteObject,
} from '@/api/types'

type Query = Record<string, string | number | boolean | (string | number)[] | null | undefined>

const rows = ref<ArchivePeriod[]>([])
const count = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const busyId = ref<number | null>(null)

const month = ref<string | undefined>(new Date().toISOString().slice(0, 7)) // YYYY-MM
const objectId = ref<number | undefined>()
const objects = ref<SiteObject[]>([])

async function loadRefs() {
  const {data} = await api.get<PageResponse<SiteObject>>(endpoints.objects.list + buildQuery({page_size: 1000, ordering: 'name'}))
  objects.value = data.results
}

async function fetchList() {
  loading.value = true
  try {
    const q: ArchiveListQuery & { page: number; page_size: number } = {
      page: page.value,
      page_size: pageSize,
      month: month.value,
      object: objectId.value,
    }
    const {data} = await api.get<PageResponse<ArchivePeriod>>(endpoints.archive.periods.list + buildQuery(q as unknown as Query))
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

// --- Закрытие/открытие периодов ---
const dlg = ref<HTMLDialogElement | null>(null)
const closeMonth = ref<string | null>(null) // YYYY-MM
const closeObjectId = ref<number | undefined>(undefined)
const closing = ref(false)
const canClose = computed(() => !!closeMonth.value && !!closeObjectId.value)

function openCloseModal() {
  closeMonth.value = month.value ?? new Date().toISOString().slice(0, 7)
  closeObjectId.value = objectId.value
  dlg.value?.showModal()
}

function closeDialog() {
  dlg.value?.close()
}

async function closePeriod() {
  if (!canClose.value) return
  closing.value = true
  try {
    const payload: ArchivePeriodRequest = {month: closeMonth.value!, object: closeObjectId.value!}
    await api.post(endpoints.archive.close, payload)
    closeDialog()
    await fetchList()
  } finally {
    closing.value = false
  }
}

async function reopen(p: ArchivePeriod) {
  if (!p.is_closed) return
  if (!confirm(`Открыть период ${p.month} по объекту "${p.object_name ?? p.object}"?`)) return
  busyId.value = p.id
  try {
    // По спецификации ReopenRequest = {month, object}
    await api.post(endpoints.archive.reopen, {month: p.month, object: p.object})
    await fetchList()
  } finally {
    busyId.value = null
  }
}

onMounted(async () => {
  await loadRefs()
  await fetchList()
})
</script>

