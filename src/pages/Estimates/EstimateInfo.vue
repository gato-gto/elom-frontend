<!-- Просмотр сметы (read-only): шапка + строки со снапшот-полями + итог. Edit/Delete по правам. -->
<template>
  <div class="list-container">
    <ListHeader :title="estimate?.title || 'Смета'" :subtitle="estimate ? `Объект: ${estimate.object_name}` : ''" icon="clipboard" :show-create="false" :show-stats="false" />

    <LoadingSpinner v-if="loading && !estimate" size="lg" variant="primary" text="Загрузка сметы…" :overlay="false" />

    <div v-else-if="estimate" class="space-y-4 p-1">
      <!-- F-934 (дизайн-консистентность P1): шапка-сводка в .card/.card-body (как остальные детальные), «Итого» — stat-акцент. -->
      <div class="card">
        <div class="card-body grid md:grid-cols-4 gap-3">
          <div><div class="text-xs text-muted">Дата</div><div class="font-mono">{{ estimate.date ? formatDate(estimate.date) : 'НЗ' }}</div></div>
          <div><div class="text-xs text-muted">Автор</div><div>{{ estimate.created_by_name || 'НЗ' }}</div></div>
          <div><div class="text-xs text-muted">Валюта</div><div>{{ estimate.currency }}</div></div>
          <div><div class="text-xs text-muted">Итого</div><div class="font-mono font-semibold text-lg text-success">{{ formatNumber(estimate.total) }}</div></div>
          <div v-if="estimate.note" class="md:col-span-4"><div class="text-xs text-muted">Примечание</div><div>{{ estimate.note }}</div></div>
        </div>
      </div>

      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold">Позиции <span class="text-sm text-muted">({{ estimate.lines.length }} {{ pluralizeRu(estimate.lines.length, ['строка', 'строки', 'строк']) }})</span></h2>
        <div class="flex gap-2">
          <button v-if="canExport" class="btn btn-sm btn-ghost" :disabled="exporting" @click="exportEstimate" title="Скачать xlsx">{{ exporting ? '…' : 'Экспорт' }}</button>
          <button v-if="canEdit" class="btn btn-sm btn-primary" @click="editEstimate">Редактировать</button>
          <button v-if="canDelete" class="btn btn-sm btn-ghost text-error" :disabled="deleting" @click="showDelete = true">Удалить</button>
        </div>
      </div>

      <!-- #65: группировка Раздел → Подраздел с подытогами обоих уровней (как форма/отчёт цен). Единый вид desktop+mobile. -->
      <div v-for="g in grouped" :key="g.section" class="card bg-base-100 border border-base-300 overflow-hidden">
        <div class="card-body p-3 gap-2">
          <div class="font-semibold text-primary">{{ g.section }}</div>
          <div v-for="sg in g.subgroups" :key="sg.subcategory" class="pl-2 sm:pl-3 border-l-2 border-base-200 space-y-1">
            <div v-if="sg.subcategory && sg.subcategory !== '—'" class="text-sm font-medium text-muted">{{ sg.subcategory }}</div>
            <div v-for="ln in sg.lines" :key="ln.id" class="bg-base-200/40 rounded-lg p-2">
              <div class="flex justify-between gap-2">
                <span class="flex-1 min-w-0 text-sm break-words">{{ ln.position_no ? ln.position_no + '. ' : '' }}{{ ln.name }}<span v-if="ln.is_draft" class="badge badge-warning badge-sm ml-1" title="Позиция без цены — ждёт руководства">ждёт цены</span></span>
                <span class="font-mono font-semibold shrink-0">{{ ln.is_draft ? '—' : formatNumber(ln.amount || 0) }}</span>
              </div>
              <div class="text-xs text-muted mt-0.5">{{ ln.kind_display }} · {{ formatNumberClean(ln.quantity) }} {{ ln.unit }} × {{ formatNumber(ln.unit_price) }}</div>
            </div>
            <div class="text-right text-xs text-muted pr-1">Подытог «{{ sg.subcategory || '—' }}»: <span class="font-mono">{{ formatNumber(sg.subTotal) }}</span></div>
          </div>
          <div class="text-right text-sm font-medium border-t border-base-200 pt-1.5">Итого «{{ g.section }}»: <span class="font-mono text-success">{{ formatNumber(g.sectionTotal) }}</span></div>
        </div>
      </div>

      <!-- #65 Фаза 1: коэффициенты с вкладом + зона -->
      <div v-if="coeffLines.length" class="card bg-base-100 border border-warning/40 overflow-hidden">
        <div class="card-body p-3 gap-2">
          <div class="font-semibold text-warning">Коэффициенты <span class="text-xs text-muted font-normal">(к работам зоны; перемножаются)</span></div>
          <div v-for="ln in coeffLines" :key="ln.id" class="bg-base-200/40 rounded-lg p-2 flex justify-between gap-2">
            <span class="flex-1 min-w-0 text-sm break-words">
              {{ ln.name }} <span class="font-mono text-muted">×{{ formatNumberClean(ln.unit_price) }}</span>
              <span class="text-xs text-muted">· {{ scopeText(ln) }}</span>
            </span>
            <span class="font-mono font-semibold shrink-0" :class="contribClass(ln.contribution)">{{ contribText(ln.contribution) }}</span>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 border border-base-300">
        <div class="card-body flex-row justify-between items-center py-3 px-4">
          <span class="font-semibold text-lg">ИТОГО <span v-if="estimate.unpriced_lines" class="text-xs text-warning font-normal">(предварительный · {{ estimate.unpriced_lines }} без цены)</span></span>
          <span class="font-mono font-semibold text-xl text-success">{{ formatNumber(estimate.total) }}</span>
        </div>
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
import api from '@/api/client'
import { downloadBlob } from '@/utils/export'
import type { Estimate, EstimateLine } from '@/api/types/estimates'

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
const exporting = ref(false)

async function exportEstimate() {
  if (exporting.value) { return }
  exporting.value = true
  try {
    const resp = await api.get(`/estimates/${id.value}/export/`, { responseType: 'blob' })
    downloadBlob(resp.data as Blob, `smeta_${id.value}.xlsx`)
  } catch {
    ui.toast({ type: 'error', text: 'Не удалось экспортировать смету' })
  } finally {
    exporting.value = false
  }
}

// F-912/913: гейт = ТОЧНО право BE (PATCH→edit, DELETE→delete; scope own/all чекает BE на объекте).
const canEdit = computed(() => can('estimates', 'edit'))
const canDelete = computed(() => can('estimates', 'delete'))
// F-738 (A, BE): экспорт = выделенное право estimates.export (руководство) → прячем кнопку без него,
// иначе viewer/brigadier ловил бы 403 по клику.
const canExport = computed(() => can('estimates', 'export'))

// #65: группировка строк Раздел → Подраздел (по снапшот-пути) с подытогами. Коэффициенты — отдельно.
const grouped = computed(() => {
  const est = estimate.value
  const amt = (ln: EstimateLine) => (ln.amount === null ? 0 : ln.amount)
  const sections = new Map<string, Map<string, EstimateLine[]>>()
  for (const ln of est?.lines || []) {
    if (ln.kind === 'coefficient') { continue }
    const sec = ln.section_name || 'Прочее'
    const sub = ln.subcategory_name || '—'
    if (!sections.has(sec)) { sections.set(sec, new Map()) }
    const subs = sections.get(sec)!
    if (!subs.has(sub)) { subs.set(sub, []) }
    subs.get(sub)!.push(ln)
  }
  return [...sections.entries()].map(([section, subs]) => {
    const subgroups = [...subs.entries()].map(([subcategory, lines]) => ({
      subcategory, lines, subTotal: lines.reduce((s, ln) => s + amt(ln), 0),
    }))
    return { section, subgroups, sectionTotal: subgroups.reduce((s, sg) => s + sg.subTotal, 0) }
  })
})

// #65 Фаза 1: коэффициенты с вкладом (BE отдаёт contribution) + подпись зоны.
const SCOPE_LABEL: Record<string, string> = { section: 'раздел', subcategory: 'подраздел', all: 'вся смета' }
const coeffLines = computed(() =>
  (estimate.value?.lines || []).filter(ln => ln.kind === 'coefficient'))
function scopeText(ln: EstimateLine): string {
  if (!ln.coeff_scope) { return 'зона не задана' }
  if (ln.coeff_scope === 'selection') {
    const n = Array.isArray(ln.coeff_targets) ? ln.coeff_targets.length : 0
    return `выбранные позиции: ${n}`
  }
  if (ln.coeff_scope === 'subcategory') {
    // M4: подраздел квалифицируем разделом.
    return ln.coeff_scope_section ? `${ln.coeff_scope_section} / ${ln.coeff_scope_name}` : ln.coeff_scope_name
  }
  const kind = SCOPE_LABEL[ln.coeff_scope] || ln.coeff_scope
  return ln.coeff_scope_name ? `${kind}: ${ln.coeff_scope_name}` : kind
}
// N2 (аудит): знак вклада (скидка k<1 → «-…» красным).
function contribText(c: number | null): string {
  if (c === null) { return '×' }
  return c > 0 ? '+' + formatNumber(c) : formatNumber(c)
}
function contribClass(c: number | null): string {
  if (c === null || c === 0) { return 'text-muted' }
  return c > 0 ? 'text-success' : 'text-error'
}

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
