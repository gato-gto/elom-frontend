<!-- Просмотр сметы (read-only): шапка + строки со снапшот-полями + итог. Edit/Delete по правам. -->
<template>
  <div class="list-container">
    <ListHeader :title="estimate?.title || 'Смета'" :subtitle="estimate ? `Объект: ${estimate.object_name}` : ''" icon="clipboard" :show-create="false" :show-stats="false" />

    <LoadingSpinner v-if="loading && !estimate" size="lg" variant="primary" text="Загрузка сметы…" :overlay="false" />

    <div v-else-if="estimate" class="space-y-4 p-1">
      <div class="grid md:grid-cols-4 gap-3 bg-base-200 rounded-lg p-4">
        <div><div class="text-xs text-muted">Дата</div><div class="font-mono">{{ estimate.date ? formatDate(estimate.date) : 'НЗ' }}</div></div>
        <div><div class="text-xs text-muted">Автор</div><div>{{ estimate.created_by_name || 'НЗ' }}</div></div>
        <div><div class="text-xs text-muted">Валюта</div><div>{{ estimate.currency }}</div></div>
        <div><div class="text-xs text-muted">Итого</div><div class="font-mono font-semibold text-lg">{{ formatNumber(estimate.total) }}</div></div>
        <div v-if="estimate.note" class="md:col-span-4"><div class="text-xs text-muted">Примечание</div><div>{{ estimate.note }}</div></div>
      </div>

      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold">Позиции <span class="text-sm text-muted">({{ estimate.lines.length }} {{ pluralizeRu(estimate.lines.length, ['строка', 'строки', 'строк']) }})</span></h2>
        <div class="flex gap-2">
          <button v-if="canEdit" class="btn btn-sm btn-primary" @click="editEstimate">Редактировать</button>
          <button v-if="canDelete" class="btn btn-sm btn-ghost text-error" :disabled="deleting" @click="showDelete = true">Удалить</button>
        </div>
      </div>

      <!-- Desktop -->
      <div class="hidden md:block overflow-x-auto">
        <table class="modern-table w-full">
          <thead><tr><th class="w-12">№</th><th>Позиция</th><th class="w-28">Тип</th><th class="w-24 text-right">Кол-во</th><th class="w-16">Ед.</th><th class="w-28 text-right">Цена</th><th class="w-28 text-right">Сумма</th></tr></thead>
          <tbody>
            <tr v-for="ln in estimate.lines" :key="ln.id">
              <td>{{ ln.position_no || '—' }}</td>
              <td class="font-medium">{{ ln.name }}</td>
              <td><span class="badge badge-ghost badge-sm">{{ ln.kind_display }}</span></td>
              <td class="text-right font-mono">{{ formatNumberClean(ln.quantity) }}</td>
              <td>{{ ln.unit || '—' }}</td>
              <td class="text-right font-mono">{{ formatNumber(ln.unit_price) }}</td>
              <td class="text-right font-mono">{{ ln.amount === null ? '×' : formatNumber(ln.amount) }}</td>
            </tr>
          </tbody>
          <tfoot><tr><th colspan="6" class="text-right">Итого (без коэффициентов)</th><th class="text-right font-mono">{{ formatNumber(estimate.total) }}</th></tr></tfoot>
        </table>
      </div>

      <!-- Mobile -->
      <div class="md:hidden space-y-2">
        <div v-for="ln in estimate.lines" :key="ln.id" class="bg-base-200 rounded-lg p-3">
          <div class="flex justify-between"><span class="font-medium">{{ ln.position_no ? ln.position_no + '. ' : '' }}{{ ln.name }}</span><span class="font-mono font-semibold">{{ ln.amount === null ? '×' : formatNumber(ln.amount) }}</span></div>
          <div class="text-xs text-muted mt-1">{{ ln.kind_display }} · {{ formatNumberClean(ln.quantity) }} {{ ln.unit }} × {{ formatNumber(ln.unit_price) }}</div>
        </div>
        <div class="text-right font-semibold pt-2">Итого: <span class="font-mono">{{ formatNumber(estimate.total) }}</span></div>
      </div>

      <div class="pt-2"><button class="btn btn-ghost btn-sm" @click="goBack">← К списку</button></div>
    </div>

    <Modal v-model="showDelete" title="Удалить смету?">
      <div class="p-6">
        <p class="mb-4">Удалить смету <strong>{{ estimate?.title || 'без названия' }}</strong>? Действие необратимо.</p>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost" @click="showDelete = false">Отмена</button>
          <button class="btn btn-error" :disabled="deleting" @click="confirmDelete">{{ deleting ? 'Удаление…' : 'Удалить' }}</button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEstimatesStore } from '@/stores/estimates'
import { useUiStore } from '@/stores/ui'
import { usePermissions } from '@/composables/usePermissions'
import ListHeader from '@/components/ListHeader.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Modal from '@/components/Modal.vue'
import { formatNumber, formatNumberClean, formatDate, pluralizeRu } from '@/utils/formatters'
import type { Estimate } from '@/api/types/estimates'

const route = useRoute()
const router = useRouter()
const estimatesStore = useEstimatesStore()
const ui = useUiStore()
const { can } = usePermissions()

const id = computed(() => Number(route.params.id))
const estimate = ref<Estimate | null>(null)
const loading = ref(false)
const deleting = ref(false)
const showDelete = ref(false)

// F-912/913: гейт = ТОЧНО право BE (PATCH→edit, DELETE→delete; scope own/all чекает BE на объекте).
const canEdit = computed(() => can('estimates', 'edit'))
const canDelete = computed(() => can('estimates', 'delete'))

function editEstimate() { router.push(`/estimates/${id.value}/edit`) }
function goBack() { router.push(estimate.value?.object ? `/estimates?object=${estimate.value.object}` : '/estimates') }

async function confirmDelete() {
  deleting.value = true
  try {
    await estimatesStore.remove(id.value)
    ui.toast({ type: 'success', text: 'Смета удалена' })
    goBack()
  } catch {
    ui.toast({ type: 'error', text: 'Не удалось удалить смету' })
  } finally {
    deleting.value = false
    showDelete.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    estimate.value = await estimatesStore.fetchOne(id.value)
  } catch {
    ui.toast({ type: 'error', text: 'Смета не найдена или нет доступа' })
    router.push('/estimates')
  } finally {
    loading.value = false
  }
})
</script>
