<template>
  <div class="list-container">
    <ListHeader
      :title="spec.title"
      :icon="spec.icon"
      :show-create="false"
      :show-stats="true"
      :total-count="totalItems"
      :filtered-count="rows.length"
    >
      <template #actions>
        <ExportButton :data="rows" :filename="spec.file" :loading="loading" @export="handleExport" />
      </template>
    </ListHeader>

    <FilterPanel :columns="kind === 'writeoffs' ? 5 : 4" :loading="loading" :active="filtersActive" @reset="resetFilters">
      <FilterField v-model="filters.date_from" type="date" label="Дата с" />
      <FilterField v-model="filters.date_to" type="date" label="Дата по" />
      <FilterField v-model="filters.object" type="select" label="Объект" :options="objectOptions" />
      <FilterField v-model="filters.material" type="select" label="Материал" :options="materialOptions" />
      <FilterField v-if="kind === 'writeoffs'" v-model="filters.responsible" type="select" label="Ответственный"
                   :options="employeeOptions" />
    </FilterPanel>

    <p v-if="period" class="text-sm text-muted mb-3">
      Период: {{ formatDate(period.date_from) }} — {{ formatDate(period.date_to) }}
      <template v-if="kind === 'writeoffs' && grandTotal?.writeoffs !== undefined">
        · Списаний за период: {{ grandTotal.writeoffs }}
      </template>
    </p>

    <div class="list-content" :class="{ relative: loading }">
      <div class="overflow-x-auto">
        <table class="modern-table">
          <thead>
            <tr>
              <th v-for="c in spec.columns" :key="c.key" :class="['cursor-pointer hover:bg-base-200', c.num ? 'text-right' : '']"
                  @click="handleSort(c.key)">
                {{ c.label }}<span v-if="sortKey === c.key" class="ml-1">{{ sortDesc ? '↓' : '↑' }}</span>
              </th>
            </tr>
          </thead>
          <TableSkeleton v-if="loading && rows.length === 0" :rows="5" :columns="spec.columns.length" />
          <tbody v-else>
            <tr v-for="r in rows" :key="`${r.object_id}-${r.material_id}-${r.unit}`">
              <td v-for="c in spec.columns" :key="c.key" :class="c.num ? 'text-right tabular-nums' : ''">
                <template v-if="c.key === 'object_name'">
                  <span class="break-words">{{ r.object_name }}</span>
                  <span v-if="!r.object_is_active" class="badge badge-ghost badge-sm ml-1">неактивен</span>
                </template>
                <template v-else>{{ cell(r, c) }}</template>
              </td>
            </tr>
            <tr v-if="!loading && rows.length === 0">
              <td :colspan="spec.columns.length" class="text-center text-muted py-8">{{ spec.empty }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ModernPagination
      v-if="rows.length > 0"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="totalItems"
      :page-size="pageSize"
      @page-change="(p: number) => { currentPage = p; fetchReport() }"
      @page-size-change="(s: number) => { pageSize = s; currentPage = 1; fetchReport() }"
    />
  </div>
</template>

<script setup lang="ts">
// F-1104 (ответ владельца 13): «Оборотная ведомость» (начало, приход, расход, конец) и «Отчёт по списаниям»
// — по объекту × материалу за период. Количества — точно, в единице учёта материала (колонка «Ед.»): в одной
// строке ведомости разные укрупнения («1 км» и «500 м») сбивали бы с толку. Сортировка и выгрузка — на сервере.
import { computed, onMounted, ref, watch } from 'vue'
import api from '@/api/client'
import endpoints, { buildQuery } from '@/api/endpoints'
import type { Employee, Material, PageResponse, SiteObject, StockReportResponse, TurnoverRow,
  WriteOffReportRow } from '@/api/types'
import { formatDate, formatNumberWithOptions, todayLocal } from '@/utils/formatters'
import { ErrorHandlers } from '@/utils/errorHandler'
import { exportFromBackend } from '@/utils/export'
import { debounce } from '@/utils/debounce'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'
import ModernPagination from '@/components/ModernPagination.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'
import ExportButton from '@/components/ExportButton.vue'

type Kind = 'turnover' | 'writeoffs'
type Row = TurnoverRow & WriteOffReportRow
type Column = { key: keyof Row; label: string; num?: boolean; date?: boolean }

const props = defineProps<{ kind: Kind }>()

const SPECS: Record<Kind, { title: string; icon: string; file: string; url: string; empty: string; columns: Column[] }> = {
  turnover: {
    title: 'Оборотная ведомость', icon: 'table-cells', file: 'oborotnaya_vedomost', url: endpoints.reports.turnover,
    empty: 'Нет остатков и движений за период',
    columns: [
      { key: 'object_name', label: 'Объект' }, { key: 'material_name', label: 'Материал' }, { key: 'unit', label: 'Ед.' },
      { key: 'opening', label: 'Остаток на начало', num: true }, { key: 'income', label: 'Приход', num: true },
      { key: 'expense', label: 'Расход', num: true }, { key: 'closing', label: 'Остаток на конец', num: true },
    ],
  },
  writeoffs: {
    title: 'Отчёт по списаниям', icon: 'document-minus', file: 'spisaniya', url: endpoints.reports.writeoffs,
    empty: 'Нет списаний за период',
    columns: [
      { key: 'object_name', label: 'Объект' }, { key: 'material_name', label: 'Материал' }, { key: 'unit', label: 'Ед.' },
      { key: 'qty_total', label: 'Количество', num: true },
      // F-1108 (ревью): «без учёта» (руководство, D-026) не уменьшают остаток — их нет в «Расходе» оборотки
      { key: 'qty_unaccounted', label: 'в т.ч. без учёта', num: true },
      { key: 'writeoffs', label: 'Списаний', num: true },
      { key: 'first_date', label: 'Первое', date: true }, { key: 'last_date', label: 'Последнее', date: true },
    ],
  },
}
const spec = computed(() => SPECS[props.kind])

const monthStart = () => `${todayLocal().slice(0, 8)}01`
type FilterId = string | number | null | undefined
const emptyFilters = () => ({ date_from: monthStart(), date_to: todayLocal(), object: '' as FilterId,
  material: '' as FilterId, responsible: '' as FilterId })
const filters = ref(emptyFilters())
const rows = ref<Row[]>([])
const period = ref<{ date_from: string; date_to: string } | null>(null)
const grandTotal = ref<StockReportResponse<Row>['grand_total'] | null>(null)
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(50)
const totalItems = ref(0)
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))
const sortKey = ref<string>('')
const sortDesc = ref(false)

const objects = ref<SiteObject[]>([])
const materials = ref<Material[]>([])
const employees = ref<Employee[]>([])
const objectOptions = computed(() => [{ value: '', label: 'Все объекты' }, ...objects.value.map(o => ({ value: o.id, label: o.name }))])
const materialOptions = computed(() => [{ value: '', label: 'Все материалы' }, ...materials.value.map(m => ({ value: m.id, label: m.name }))])
const employeeOptions = computed(() => [{ value: '', label: 'Все' }, ...employees.value.map(e => ({
  value: e.id, label: `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.username,
}))])

const filtersActive = computed(() => JSON.stringify(filters.value) !== JSON.stringify(emptyFilters()))

function query(): Record<string, string | number> {
  const q: Record<string, string | number> = {}
  const f = filters.value
  if (f.date_from) { q.date_from = f.date_from }
  if (f.date_to) { q.date_to = f.date_to }
  // F-1108 (ревью): FilterField на «Все …» отдаёт undefined/null — раньше Number(undefined) = NaN → 400
  const id = (v: FilterId) => (v === '' || v === null || v === undefined ? null : Number(v))
  const obj = id(f.object), mat = id(f.material), resp = id(f.responsible)
  if (obj !== null && Number.isFinite(obj)) { q.object = obj }
  if (mat !== null && Number.isFinite(mat)) { q.material = mat }
  if (props.kind === 'writeoffs' && resp !== null && Number.isFinite(resp)) { q.responsible = resp }
  return q
}

function cell(r: Row, c: Column): string {
  const v = r[c.key]
  if (c.date) { return formatDate(v as string) }
  if (c.num) { return formatNumberWithOptions(v as number, { minimumFractionDigits: 0, maximumFractionDigits: 6 }) }
  return v === null || v === undefined || v === '' ? '—' : String(v)
}

async function fetchReport() {
  loading.value = true
  try {
    const params: Record<string, string | number> = { ...query(), ...ordering(), page: currentPage.value,
      page_size: pageSize.value }
    const { data } = await api.get<StockReportResponse<Row>>(spec.value.url + buildQuery(params))
    rows.value = data.results || []
    totalItems.value = data.count || 0
    period.value = data.period || null
    grandTotal.value = data.grand_total || null
  } catch (error) {
    ErrorHandlers.dataLoading(error)
  } finally {
    loading.value = false
  }
}

function handleSort(key: string) {
  if (sortKey.value === key) { sortDesc.value = !sortDesc.value } else { sortKey.value = key; sortDesc.value = false }
  currentPage.value = 1
  fetchReport()
}

function ordering(): Record<string, string> {
  return sortKey.value ? { ordering: `${sortDesc.value ? '-' : ''}${sortKey.value}` } : {}
}

async function handleExport(format: 'csv' | 'excel') {
  try {
    // F-1108 (ревью): выгрузка — с теми же фильтрами и в том же порядке, что на экране
    await exportFromBackend(spec.value.url, format === 'excel' ? 'xlsx' : 'csv', `${spec.value.file}_${todayLocal()}`,
      { ...query(), ...ordering() })
  } catch (error) {
    ErrorHandlers.dataLoading(error)
  }
}

function resetFilters() {
  filters.value = emptyFilters()
}

async function loadRefs() {
  // сбой справочников не роняет отчёт (как в других отчётах, F-886): выпадашки просто пустые
  try {
    const [{ data: od }, { data: md }, { data: ed }] = await Promise.all([
      api.get<PageResponse<SiteObject>>(endpoints.objects.list + buildQuery({ page_size: 1000, ordering: 'name' })),
      api.get<PageResponse<Material>>(endpoints.materials.list + buildQuery({ page_size: 1000, ordering: 'name' })),
      props.kind === 'writeoffs'
        ? api.get<PageResponse<Employee>>(endpoints.employees.list + buildQuery({ page_size: 1000, ordering: 'username' }))
        : Promise.resolve({ data: { results: [] as Employee[] } as PageResponse<Employee> }),
    ])
    objects.value = od.results || []
    materials.value = md.results || []
    employees.value = ed.results || []
  } catch (error) {
    ErrorHandlers.dataLoading(error)
  }
}

const refetch = debounce(() => { currentPage.value = 1; fetchReport() }, 300)
watch(filters, refetch, { deep: true })
// F-1108 (ревью): оба маршрута — один компонент; Vue переиспользует его при переходе между отчётами →
// без этого новый вид показывал строки прежнего (и без справочника ответственных)
watch(() => props.kind, async () => {
  rows.value = []
  period.value = null
  grandTotal.value = null
  sortKey.value = ''
  sortDesc.value = false
  currentPage.value = 1
  await Promise.all([loadRefs(), fetchReport()])
})

defineExpose({ handleExport })

onMounted(async () => {
  await Promise.all([loadRefs(), fetchReport()])
})
</script>
