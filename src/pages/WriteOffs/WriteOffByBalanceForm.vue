<template>
  <Modal :size="'5xl'" :model-value="isOpen" title="Внести остатки (инвентаризация)" @close="$emit('close')">
    <div class="space-y-4">
      <p class="text-sm text-muted">
        Введите ФАКТИЧЕСКИЙ остаток по каждому материалу — система вычислит расход
        (книжный остаток − факт) и оформит списания на разницу. Единица берётся из материала.
        В списке материалов — только то, что есть в наличии на выбранном объекте
        (можно списать); сначала выберите объект.
      </p>

      <!-- Общие поля: дата + объект -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="form-control">
          <label class="label"><span class="label-text font-medium">Дата инвентаризации <span class="text-error">*</span></span></label>
          <input v-model="date" type="date" class="input input-bordered w-full"
                 :class="{ 'input-error': topErrors.date }" />
          <span v-if="topErrors.date" class="text-error text-xs mt-1">{{ topErrors.date }}</span>
        </div>
        <div class="form-control">
          <label class="label"><span class="label-text font-medium">Объект <span class="text-error">*</span></span></label>
          <select v-model="objectId" class="select select-bordered w-full" :class="{ 'select-error': topErrors.object }">
            <option :value="0" disabled>— выберите объект —</option>
            <option v-for="o in objectOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          <span v-if="topErrors.object" class="text-error text-xs mt-1">{{ topErrors.object }}</span>
        </div>
      </div>

      <!-- Позиции (массив материалов) -->
      <div class="overflow-x-auto">
        <table class="table table-sm w-full">
          <thead>
            <tr>
              <th class="w-[45%]">Материал</th>
              <th class="w-[15%]">Ед.</th>
              <th class="w-[30%] text-right">Фактический остаток</th>
              <th class="w-[10%]"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in rows" :key="row._k" :class="{ 'bg-error/5': rowErrors[idx] }">
              <td>
                <select v-model="row.material" class="select select-bordered select-sm w-full"
                        :disabled="!objectId || materialsLoading">
                  <option :value="null" disabled>{{ materialPlaceholder }}</option>
                  <option v-for="m in optionsForRow(row)" :key="m.value" :value="m.value">{{ m.label }}</option>
                </select>
                <div v-if="rowErrors[idx]" class="text-error text-xs mt-1">{{ rowErrors[idx] }}</div>
              </td>
              <td>
                <span class="text-sm font-mono">{{ balanceFor(row)?.unit_code || '—' }}</span>
              </td>
              <td>
                <input v-model="row.actual_balance" type="number" step="0.000001" min="0"
                       placeholder="0" class="input input-bordered input-sm w-full text-right" />
                <div v-if="balanceFor(row)" class="text-xs text-muted mt-1 text-right">
                  Книжный остаток:
                  <span class="font-mono">{{ formatNumberClean(Number(balanceFor(row)!.current_balance)) }} {{ balanceFor(row)!.unit_code }}</span>
                </div>
              </td>
              <td class="text-right">
                <button type="button" class="btn btn-error btn-xs" :disabled="rows.length === 1"
                        @click="removeRow(idx)">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="objectId && !materialsLoading && stockMaterials.length === 0"
           class="text-sm text-muted">
        На этом объекте нет материалов в наличии — списывать нечего.
      </div>

      <button type="button" class="btn btn-outline btn-sm"
              :disabled="!objectId || materialsLoading || stockMaterials.length === 0"
              @click="addRow">+ Добавить материал</button>

      <div v-if="topErrors.form" class="alert alert-error text-sm py-2">{{ topErrors.form }}</div>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" class="btn btn-ghost" :disabled="submitting" @click="$emit('close')">Отмена</button>
        <button type="button" class="btn btn-primary" :disabled="submitting" @click="handleSubmit">
          <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
          Оформить списания
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useObjectsStore } from '@/stores/objects'
import { getMaterialsInStock } from '@/stores/materials'
import type { SiteObject } from '@/api/types'
import type { MaterialBalance } from '@/api/types/stocks'
import Modal from '@/components/Modal.vue'
import { useUiStore } from '@/stores/ui'
import { parseApiError } from '@/utils/errorHandler'
import { formatNumberClean } from '@/utils/formatters'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: []; success: [] }>()

const objectsStore = useObjectsStore()
const ui = useUiStore()

interface Row { _k: number; material: number | null; actual_balance: string }
let seq = 0
const blankRow = (): Row => ({ _k: ++seq, material: null, actual_balance: '' })

const today = new Date().toISOString().split('T')[0]
const date = ref(today)
const objectId = ref(0)
const rows = ref<Row[]>([blankRow()])
const rowErrors = ref<Record<number, string>>({})
const topErrors = ref<{ date?: string; object?: string; form?: string }>({})
const submitting = ref(false)

// Материалы, доступные к списанию на выбранном объекте на дату (только current_balance > 0).
const stockMaterials = ref<MaterialBalance[]>([])
const materialsLoading = ref(false)

const objectOptions = computed(() => objectsStore.items.map((o: SiteObject) => ({ value: o.id, label: o.name })))
const stockMap = computed(() => new Map(stockMaterials.value.map(m => [m.material_id, m])))

const materialPlaceholder = computed(() => {
  if (!objectId.value) { return '— сначала выберите объект —' }
  if (materialsLoading.value) { return 'Загрузка…' }
  return '— выберите материал —'
})

// Опции для строки: материалы в наличии, минус уже выбранные в ДРУГИХ строках (без дублей).
function optionsForRow(row: Row) {
  const takenElsewhere = new Set(
    rows.value.filter(r => r !== row && r.material != null).map(r => r.material as number),
  )
  return stockMaterials.value
    .filter(m => !takenElsewhere.has(m.material_id))
    .map(m => ({ value: m.material_id, label: m.material_name }))
}

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
    if (my === loadToken) { stockMaterials.value = [] }
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
  date.value = today
  objectId.value = 0
  rows.value = [blankRow()]
  stockMaterials.value = []
  clearErrors()
}

onMounted(() => {
  if (!objectsStore.items.length) {objectsStore.fetchList?.({ page_size: 1000 } as any)}
})
</script>
