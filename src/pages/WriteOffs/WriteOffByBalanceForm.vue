<template>
  <Modal :size="'6xl'" :model-value="isOpen" title="Внести остатки (инвентаризация)" @close="$emit('close')">
    <div class="space-y-6">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <p class="text-sm text-muted">
          Введите ФАКТИЧЕСКИЙ остаток по каждому материалу — система вычислит расход
          (книжный остаток − факт) и оформит списания на разницу. Единица берётся из материала.
          В списке материалов — только то, что есть в наличии на выбранном объекте
          (можно списать); сначала выберите объект.
        </p>

        <!-- Общие поля: дата + объект -->
        <div class="grid md:grid-cols-3 gap-4">
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">Дата инвентаризации</span>
              <span class="label-text-alt text-primary font-semibold">*</span>
            </label>
            <input v-model="date" type="date" class="input input-bordered w-full"
                   :class="{ 'input-error': topErrors.date }" />
            <div v-if="topErrors.date" class="label">
              <span class="label-text-alt text-error">{{ topErrors.date }}</span>
            </div>
          </div>
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">Объект</span>
              <span class="label-text-alt text-primary font-semibold">*</span>
            </label>
            <select v-model="objectId" class="select select-bordered w-full" :class="{ 'select-error': topErrors.object }">
              <option :value="0" disabled>— выберите объект —</option>
              <option v-for="o in objectOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
            <div v-if="topErrors.object" class="label">
              <span class="label-text-alt text-error">{{ topErrors.object }}</span>
            </div>
          </div>
        </div>

        <!-- Позиции -->
        <div class="space-y-6">
          <h2 class="text-lg font-semibold text-base-content mb-2">Позиции</h2>

          <!-- Desktop table view -->
          <div class="hidden md:block overflow-auto">
            <table class="table w-full">
              <thead>
                <tr>
                  <th style="min-width: 240px">Материал</th>
                  <th style="min-width: 120px">Ед.</th>
                  <th style="min-width: 150px">Фактический остаток</th>
                  <th style="min-width: 150px">Книжный остаток</th>
                  <th class="text-right" style="min-width: 80px">Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in rows" :key="row._k">
                  <td>
                    <div>
                      <MaterialSearchSelect
                        v-model="row.material"
                        placeholder="— выберите материал —"
                        size="sm"
                        :disabled="!objectId || materialsLoading"
                        :object-id="objectId || null"
                        :date="date || null"
                        :filter-by-balance="true"
                        :exclude-materials="addedMaterialIds.filter(id => id !== row.material)"
                        :class="{ 'border-error': rowErrors[idx] }"
                      />
                      <div v-if="rowErrors[idx]" class="text-error text-xs mt-1">{{ rowErrors[idx] }}</div>
                    </div>
                  </td>
                  <td>
                    <div class="text-sm text-muted font-mono p-2">{{ balanceFor(row)?.unit_code || '—' }}</div>
                  </td>
                  <td>
                    <input v-model="row.actual_balance" type="number" inputmode="decimal" step="0.000001" min="0"
                           placeholder="0.000000" class="input input-bordered input-sm w-full" />
                  </td>
                  <td>
                    <div v-if="balanceFor(row)" class="text-sm">
                      <div class="font-mono">{{ formatNumberClean(Number(balanceFor(row)!.current_balance)) }}</div>
                      <div class="text-xs text-muted">{{ balanceFor(row)!.unit_code }}</div>
                    </div>
                    <div v-else class="text-sm text-subtle">—</div>
                  </td>
                  <td class="text-right">
                    <button type="button" class="btn btn-error btn-xs btn-square" :disabled="rows.length === 1" @click="removeRow(idx)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile card view -->
          <div class="md:hidden space-y-4">
            <div v-for="(row, idx) in rows" :key="row._k" class="bg-base-200 rounded-lg p-2">
              <div class="flex justify-between items-start mb-3">
                <h3 class="font-medium text-sm">Позиция {{ idx + 1 }}</h3>
                <button type="button" class="btn btn-error btn-xs btn-square" :disabled="rows.length === 1" @click="removeRow(idx)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
              <div class="space-y-3">
                <div>
                  <label class="label"><span class="label-text text-xs">Материал</span></label>
                  <MaterialSearchSelect
                    v-model="row.material"
                    placeholder="— выберите материал —"
                    size="sm"
                    :disabled="!objectId || materialsLoading"
                    :object-id="objectId || null"
                    :date="date || null"
                    :filter-by-balance="true"
                    :exclude-materials="addedMaterialIds.filter(id => id !== row.material)"
                    :class="{ 'border-error': rowErrors[idx] }"
                  />
                  <div v-if="rowErrors[idx]" class="text-error text-xs mt-1">{{ rowErrors[idx] }}</div>
                </div>
                <div>
                  <label class="label"><span class="label-text text-xs">Единица измерения</span></label>
                  <div class="text-sm text-muted font-mono p-2 rounded border">{{ balanceFor(row)?.unit_code || '—' }}</div>
                </div>
                <div>
                  <label class="label"><span class="label-text text-xs">Фактический остаток</span></label>
                  <input v-model="row.actual_balance" type="number" inputmode="decimal" step="0.000001" min="0"
                         placeholder="0.000000" class="input input-bordered input-sm w-full" />
                </div>
                <div>
                  <label class="label"><span class="label-text text-xs">Книжный остаток</span></label>
                  <div v-if="balanceFor(row)" class="text-sm font-mono p-2 rounded border">
                    {{ formatNumberClean(Number(balanceFor(row)!.current_balance)) }} {{ balanceFor(row)!.unit_code }}
                  </div>
                  <div v-else class="text-sm text-subtle p-2 rounded border">—</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Пусто -->
          <div v-if="objectId && !materialsLoading && stockMaterials.length === 0" class="text-sm text-muted">
            На этом объекте нет материалов в наличии — списывать нечего.
          </div>

          <!-- Add item button -->
          <div class="mt-4">
            <button type="button" class="btn btn-sm btn-primary w-full"
                    :disabled="!objectId || materialsLoading || stockMaterials.length === 0"
                    @click="addRow">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Добавить материал
            </button>
          </div>

          <!-- Общая ошибка -->
          <div v-if="topErrors.form" class="alert alert-error">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ topErrors.form }}</span>
          </div>
        </div>

        <!-- F-642 (#28): период закрыт — пред-предупреждение (submit погашен) -->
        <div v-if="periodClosed" class="alert alert-warning" role="alert">
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="text-sm">Период закрыт (архив) — инвентаризация этой датой в закрытый период запрещена. Измените дату или переоткройте период.</span>
        </div>

        <!-- Кнопки -->
        <div class="flex justify-end gap-2 pt-4">
          <button type="button" class="btn btn-ghost" :disabled="submitting" @click="$emit('close')">Отмена</button>
          <button type="submit" class="btn btn-primary" :disabled="submitting || periodClosed" :class="{ 'loading': submitting }">
            {{ submitting ? 'Сохранение...' : 'Оформить списания' }}
          </button>
        </div>
      </form>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useObjectsStore } from '@/stores/objects'
import { useArchivePeriodsStore } from '@/stores/archivePeriods'
import { getMaterialsInStock } from '@/stores/materials'
import type { SiteObject } from '@/api/types'
import type { MaterialBalance } from '@/api/types/stocks'
import Modal from '@/components/Modal.vue'
import MaterialSearchSelect from '@/components/MaterialSearchSelect.vue'
import { useUiStore } from '@/stores/ui'
import { parseApiError } from '@/utils/errorHandler'
import { formatNumberClean } from '@/utils/formatters'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: []; success: [] }>()

const objectsStore = useObjectsStore()
const archivePeriodsStore = useArchivePeriodsStore()
const ui = useUiStore()

interface Row { _k: number; material: number | null; actual_balance: string }
let seq = 0
const blankRow = (): Row => ({ _k: ++seq, material: null, actual_balance: '' })

const today = new Date().toISOString().split('T')[0]
const date = ref(today)
const objectId = ref(0)
// F-642 (#28): пред-предупреждение о закрытом периоде (зеркалит серверный гард D-012/F-619).
const periodClosed = computed(() => archivePeriodsStore.isPeriodClosed(objectId.value, date.value))
const rows = ref<Row[]>([blankRow()])
const rowErrors = ref<Record<number, string>>({})
const topErrors = ref<{ date?: string; object?: string; form?: string }>({})
const submitting = ref(false)

// Материалы, доступные к списанию на выбранном объекте на дату (только current_balance > 0).
const stockMaterials = ref<MaterialBalance[]>([])
const materialsLoading = ref(false)

const objectOptions = computed(() => objectsStore.items.map((o: SiteObject) => ({ value: o.id, label: o.name })))
const stockMap = computed(() => new Map(stockMaterials.value.map(m => [m.material_id, m])))

// Уже выбранные материалы — чтобы MaterialSearchSelect исключал их из выпадашки (без дублей),
// как в WriteOffForm (addedMaterialIds).
const addedMaterialIds = computed(() =>
  rows.value.map(r => r.material).filter((id): id is number => id != null),
)

// Книжный остаток (и единица) выбранного в строке материала — для подсказки/единицы.
function balanceFor(row: Row): MaterialBalance | undefined {
  return row.material != null ? stockMap.value.get(row.material) : undefined
}

// Гонка: при быстрой смене объекта/даты берём только ответ последнего запроса.
let loadToken = 0
async function loadStockMaterials() {
  const my = ++loadToken
  if (!objectId.value || !date.value) {
    stockMaterials.value = []
    materialsLoading.value = false
    return
  }
  materialsLoading.value = true
  try {
    const res = await getMaterialsInStock(objectId.value, date.value)
    if (my === loadToken) { stockMaterials.value = res }
  } catch (error) {
    // fail-closed: не удалось проверить остатки — не предлагаем ничего (список пуст).
    // EH-FE-8 (F-552): но с явным сигналом — иначе пустой список выглядит как «нечего
    // списывать», а не как сбой (класс F-538). Тост только для актуального запроса.
    if (my === loadToken) {
      stockMaterials.value = []
      ui.toast({ type: 'error', text: 'Не удалось проверить остатки — попробуйте ещё раз' })
    }
    console.error('Error loading in-stock materials:', error)
  } finally {
    if (my === loadToken) { materialsLoading.value = false }
  }
}

// Смена ОБЪЕКТА меняет весь набор материалов → сбрасываем строки и перезагружаем.
watch(objectId, () => {
  rows.value = [blankRow()]
  clearErrors()
  loadStockMaterials()
})

// Смена ДАТЫ меняет книжные остатки на дату, но НЕ набор объекта — перезагружаем остатки,
// уже введённые строки/значения сохраняем (пользователь мог их посчитать). Материал, который
// на новую дату вышел из остатка, просто теряет подсказку; бэкенд проверит при отправке.
watch(date, () => {
  loadStockMaterials()
})

// Компонент всегда смонтирован (List.vue тогглит через :is-open, не v-if). Каждое открытие —
// чистая форма: сбрасываем прошлую сессию (объект/строки/остатки), как это делает WriteOffForm.
watch(() => props.isOpen, (open) => {
  if (open) { reset() }
})

function addRow() {
  rows.value.push(blankRow())
}

function removeRow(index: number) {
  if (rows.value.length > 1) {rows.value.splice(index, 1)}
}

function clearErrors() {
  rowErrors.value = {}
  topErrors.value = {}
}

function handleSubmit() {
  clearErrors()
  if (!date.value) {topErrors.value.date = 'Укажите дату'}
  if (!objectId.value) {topErrors.value.object = 'Выберите объект'}
  // F-642 (#28): защёлка на закрытый период (кнопка уже погашена; на программный submit).
  if (periodClosed.value) {topErrors.value.date = 'Период закрыт (архив) — измените дату'}

  // отбрасываем полностью пустые строки; валидируем заполненные
  const filled = rows.value.filter(r => r.material || (r.actual_balance !== '' && r.actual_balance != null))
  if (filled.length === 0) {topErrors.value.form = 'Добавьте хотя бы одну позицию'}

  const seen = new Set<number>()
  filled.forEach((r) => {
    const idx = rows.value.indexOf(r)
    if (!r.material) { rowErrors.value[idx] = 'Выберите материал'; return }
    if (r.actual_balance === '' || r.actual_balance == null) { rowErrors.value[idx] = 'Укажите остаток'; return }
    if (parseFloat(r.actual_balance) < 0) { rowErrors.value[idx] = 'Остаток не может быть отрицательным'; return }
    if (seen.has(r.material)) { rowErrors.value[idx] = 'Материал повторяется'; return }
    seen.add(r.material)
  })

  if (topErrors.value.date || topErrors.value.object || topErrors.value.form || Object.keys(rowErrors.value).length) {
    return
  }

  submitting.value = true
  const items = filled.map(r => ({ material: r.material, target_balance: r.actual_balance }))
  api.post(endpoints.writeOffs.fromBalanceBulk, { object: objectId.value, date: date.value, items })
    .then(() => {
      ui.toast({ type: 'success', text: `Инвентаризация проведена: ${items.length} поз.` })
      emit('success')
      emit('close')
      reset()
    })
    .catch((error: any) => {
      // построчные ошибки от бэка: { errors: { items: [{ index, detail }] } }
      const backendItems = error?.response?.data?.errors?.items
      if (Array.isArray(backendItems)) {
        backendItems.forEach((e: { index: number; detail: string }) => {
          const filledRow = filled[e.index]
          const realIdx = filledRow ? rows.value.indexOf(filledRow) : e.index
          rowErrors.value[realIdx] = e.detail
        })
      } else {
        topErrors.value.form = parseApiError(error).detail || 'Не удалось провести инвентаризацию'
      }
    })
    .finally(() => { submitting.value = false })
}

function reset() {
  // F-853: свежая дата на КАЖДОЕ открытие (форма всегда смонтирована через :is-open; PWA,
  // открытая через полночь, иначе дефолтила инвентаризацию вчерашней датой).
  date.value = new Date().toISOString().split('T')[0]
  objectId.value = 0
  rows.value = [blankRow()]
  stockMaterials.value = []
  clearErrors()
}

onMounted(() => {
  if (!objectsStore.items.length) {objectsStore.fetchList?.({ page_size: 1000 } as any)}
  if (!archivePeriodsStore.items.length) {archivePeriodsStore.fetchList()}  // F-642 (#28)
})
</script>
