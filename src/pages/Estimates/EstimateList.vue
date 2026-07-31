<!-- Список смет по объекту (отчёт цен). Object-scoped: BE отдаёт только доступные сметы. -->
<template>
  <div class="list-container">
    <ListHeader title="Сметы" subtitle="Отчёт цен по объекту" icon="clipboard" :show-create="false" :show-stats="false" />

    <FilterPanel :columns="2" :loading="loading" @reset="resetFilters">
      <div class="form-control w-full">
        <label class="label"><span class="label-text font-medium">Объект</span></label>
        <select v-model.number="objectId" class="select select-bordered w-full" @change="onObjectChange">
          <option :value="null">— все доступные —</option>
          <option v-for="o in objectsStore.items" :key="o.id" :value="o.id">{{ o.name }}</option>
        </select>
      </div>
      <div class="form-control w-full flex-row items-end gap-2" v-if="canCreate">
        <button class="btn btn-primary" :disabled="!objectId" @click="createEstimate" :title="objectId ? '' : 'Сначала выберите объект'">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Новая смета
        </button>
      </div>
    </FilterPanel>

    <div class="list-content" :class="{ 'relative': loading }">
      <LoadingSpinner v-if="loading && rows.length === 0" size="lg" variant="primary" text="Загрузка смет…" :overlay="false" />

      <!-- Desktop -->
      <div class="hidden md:block overflow-x-auto">
        <table class="modern-table w-full">
          <thead>
            <tr><th>Название</th><th>Объект</th><th>Дата</th><th class="text-right">Итого</th><th>Автор</th><th class="w-32"></th></tr>
          </thead>
          <tbody>
            <tr v-for="e in rows" :key="e.id" class="hover:bg-base-200 cursor-pointer" @click="openEstimate(e.id)">
              <td class="font-medium">{{ e.title || 'Без названия' }}</td>
              <td>{{ e.object_name }}</td>
              <td class="font-mono">{{ e.date ? formatDate(e.date) : 'НЗ' }}</td>
              <td class="text-right font-mono">{{ formatNumber(e.total) }} <span class="text-xs text-muted">{{ e.currency }}</span></td>
              <td>{{ e.created_by_name || 'НЗ' }}</td>
              <td class="text-right" @click.stop>
                <button class="btn btn-ghost btn-xs btn-square touch-target" aria-label="Открыть смету" title="Открыть" @click="openEstimate(e.id)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
                <button v-if="canDelete" class="btn btn-ghost btn-xs btn-square touch-target text-error" aria-label="Удалить смету" title="Удалить" :disabled="deletingId === e.id" @click="askDelete(e)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </td>
            </tr>
            <tr v-if="!loading && rows.length === 0"><td colspan="6" class="text-center text-muted py-8">Смет нет</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile -->
      <div class="md:hidden space-y-3">
        <div v-for="e in rows" :key="e.id" class="bg-base-100 border border-base-300 rounded-lg p-3" @click="openEstimate(e.id)">
          <div class="flex justify-between items-start">
            <div class="font-medium">{{ e.title || 'Без названия' }}</div>
            <div class="font-mono font-semibold">{{ formatNumber(e.total) }} <span class="text-xs text-muted">{{ e.currency }}</span></div>
          </div>
          <div class="text-sm text-muted mt-1">{{ e.object_name }} · {{ e.date ? formatDate(e.date) : 'НЗ' }}</div>
          <div class="text-xs text-muted">Автор: {{ e.created_by_name || 'НЗ' }}</div>
          <div class="flex justify-end gap-2 mt-2" @click.stop>
            <button class="btn btn-ghost btn-sm" @click="openEstimate(e.id)">Открыть</button>
            <button v-if="canDelete" class="btn btn-ghost btn-sm text-error" :disabled="deletingId === e.id" @click="askDelete(e)">Удалить</button>
          </div>
        </div>
        <div v-if="!loading && rows.length === 0" class="text-center text-muted py-8">Смет нет</div>
      </div>

      <ModernPagination v-if="rows.length > 0" :current-page="currentPage" :total-pages="totalPages" :total-items="totalItems" :page-size="pageSize" @page-change="onPage" @page-size-change="onPageSize" />
    </div>

    <Modal v-model="showDelete" title="Удалить смету?">
      <div class="p-6">
        <p class="mb-4">Удалить смету <strong>{{ deleting?.title || 'без названия' }}</strong>? Действие необратимо.</p>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost" @click="showDelete = false">Отмена</button>
          <button class="btn btn-error" :disabled="!!deletingId" @click="confirmDelete">{{ deletingId ? 'Удаление…' : 'Удалить' }}</button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEstimatesStore } from '@/stores/estimates'
import { useObjectsStore } from '@/stores/objects'
import { useUiStore } from '@/stores/ui'
import { usePermissions } from '@/composables/usePermissions'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import ModernPagination from '@/components/ModernPagination.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Modal from '@/components/Modal.vue'
import { formatNumber, formatDate } from '@/utils/formatters'
import type { Estimate } from '@/api/types/estimates'

const route = useRoute()
const router = useRouter()
const estimatesStore = useEstimatesStore()
const objectsStore = useObjectsStore()
const ui = useUiStore()
const { can } = usePermissions()

// F-912/913-урок: гейт FE = ТОЧНО право, что чекает BE DictPermission (POST→create, DELETE→delete).
const canCreate = computed(() => can('estimates', 'create'))
const canDelete = computed(() => can('estimates', 'delete'))

const objectId = ref<number | null>(route.query.object ? Number(route.query.object) : null)
const rows = computed(() => estimatesStore.items)
const loading = computed(() => estimatesStore.loading)
const currentPage = computed(() => estimatesStore.pagination.page)
const pageSize = computed(() => estimatesStore.pagination.pageSize)
const totalItems = computed(() => estimatesStore.pagination.count)
const totalPages = computed(() => Math.ceil(totalItems.value / (pageSize.value || 20)))

const showDelete = ref(false)
const deleting = ref<Estimate | null>(null)
const deletingId = ref<number | null>(null)

async function load() {
  await estimatesStore.fetchList({ page: 1, object: objectId.value ?? undefined }).catch(() => {})
}
function onObjectChange() {
  // отражаем выбор в URL (без «двойного fetch» — просто replace + load)
  router.replace({ query: objectId.value ? { object: String(objectId.value) } : {} })
  load()
}
function onPage(p: number) { estimatesStore.setPage(p) }
function onPageSize(s: number) { estimatesStore.setPageSize(s) }
function resetFilters() { objectId.value = null; onObjectChange() }

function createEstimate() {
  if (!objectId.value) { return }
  router.push(`/estimates/new?object=${objectId.value}`)
}
function openEstimate(id: number) { router.push(`/estimates/${id}`) }

function askDelete(e: Estimate) { deleting.value = e; showDelete.value = true }
async function confirmDelete() {
  if (!deleting.value) { return }
  deletingId.value = deleting.value.id
  try {
    await estimatesStore.remove(deleting.value.id)
    ui.toast({ type: 'success', text: 'Смета удалена' })
    showDelete.value = false
  } catch {
    ui.toast({ type: 'error', text: 'Не удалось удалить смету' })
  } finally {
    deletingId.value = null
  }
}

// Object-scope filter персистится в стор через setFilters, но здесь ведём его явным параметром.
watch(() => estimatesStore.filters, () => {}, { deep: false })

onMounted(async () => {
  if (objectsStore.items.length === 0) { objectsStore.fetchList({ page_size: 1000 }).catch(() => {}) }
  await load()
})
</script>
