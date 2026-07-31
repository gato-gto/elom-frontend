<!-- Форма сметы по объекту (создание/редактирование) — этап 1.
     Отдельная СТРАНИЦА (не модалка): смета документо-подобна (шапка + много строк). Строки уходят
     ВЛОЖЕННО одним вызовом (BE: PATCH с lines заменяет все, всё в одной transaction.atomic). -->
<template>
  <div class="list-container">
    <ListHeader
      :title="isEdit ? 'Редактирование сметы' : 'Новая смета'"
      :subtitle="objectName ? `Объект: ${objectName}` : 'Смета по объекту (отчёт цен)'"
      icon="clipboard"
      :show-create="false"
      :show-stats="false"
    />

    <form @submit.prevent="handleSubmit" class="space-y-4 p-1">
      <!-- Шапка -->
      <div class="grid md:grid-cols-4 gap-4">
        <div class="form-control w-full">
          <label class="label"><span class="label-text font-medium">Объект</span><span class="label-text-alt text-error">*</span></label>
          <select v-model.number="form.object" class="select select-bordered w-full" :class="{ 'select-error': fieldErrors.object }" :disabled="isEdit || lockObject">
            <option :value="null" disabled>— выберите объект —</option>
            <option v-for="o in objectsStore.items" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
          <label v-if="fieldErrors.object" class="label"><span class="label-text-alt text-error">{{ fieldErrors.object }}</span></label>
        </div>
        <div class="form-control w-full md:col-span-2">
          <label class="label"><span class="label-text font-medium">Название сметы</span></label>
          <input v-model="form.title" type="text" maxlength="256" class="input input-bordered w-full" placeholder="Напр. «Смета на электромонтаж»" />
        </div>
        <div class="form-control w-full">
          <label class="label"><span class="label-text font-medium">Дата</span></label>
          <input v-model="form.date" type="date" class="input input-bordered w-full" />
        </div>
        <div class="form-control w-full md:col-span-4">
          <label class="label"><span class="label-text font-medium">Примечание</span></label>
          <textarea v-model="form.note" rows="2" class="textarea textarea-bordered w-full" placeholder="Необязательно"></textarea>
        </div>
      </div>

      <!-- Строки -->
      <div class="flex items-center justify-between mt-4">
        <h2 class="text-lg font-semibold">Позиции <span class="text-sm text-muted">({{ lines.length }} {{ pluralizeRu(lines.length, ['строка', 'строки', 'строк']) }})</span></h2>
      </div>

      <!-- Desktop-таблица -->
      <div class="hidden md:block overflow-x-auto">
        <table class="modern-table w-full">
          <thead>
            <tr>
              <th class="w-10">№</th>
              <th class="w-40">Раздел</th>
              <th>Позиция</th>
              <th class="w-24">Тип</th>
              <th class="w-20 text-right">Кол-во</th>
              <th class="w-28 text-right">Цена</th>
              <th class="w-28 text-right">Сумма</th>
              <th class="w-12"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(line, idx) in lines" :key="line._k">
              <td>
                <input v-model="line.position_no" type="text" maxlength="32" class="input input-bordered input-xs w-14" placeholder="№" />
              </td>
              <td>
                <select v-model.number="line.category_a" class="select select-bordered select-xs w-full mb-1" @change="onCatARow(line)">
                  <option :value="null">— раздел A —</option>
                  <option v-for="c in rootCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
                <select v-if="line.category_a" v-model.number="line.category_b" class="select select-bordered select-xs w-full" :disabled="!(childrenByParent[line.category_a] || []).length">
                  <option :value="null">— подраздел B —</option>
                  <option v-for="c in (childrenByParent[line.category_a] || [])" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </td>
              <td>
                <WorkItemSearchSelect
                  v-model="line.work_item"
                  size="xs"
                  :category="line.category_b"
                  :allow-custom="true"
                  :error="lineErrors[idx]?.name || lineErrors[idx]?.work_item"
                  @change="onItemPicked(line, $event)"
                  @custom-item="onCustomItem(line, $event)"
                />
                <input v-if="line.name && !line.work_item" v-model="line.name" type="text" class="input input-bordered input-xs w-full mt-1" placeholder="Название позиции" />
              </td>
              <td>
                <select v-model="line.kind" class="select select-bordered select-xs w-full">
                  <option v-for="k in KIND_OPTIONS" :key="k.value" :value="k.value">{{ k.label }}</option>
                </select>
              </td>
              <td><input v-model="line.quantity" type="number" step="0.001" min="0" class="input input-bordered input-xs w-full text-right" :class="{ 'input-error': lineErrors[idx]?.quantity }" /></td>
              <td><input v-model="line.unit_price" type="number" step="0.01" min="0" class="input input-bordered input-xs w-full text-right" :class="{ 'input-error': lineErrors[idx]?.unit_price }" /></td>
              <td class="text-right font-mono">{{ lineAmountDisplay(line) }}</td>
              <td class="text-right">
                <button type="button" class="btn btn-error btn-xs btn-square touch-target" aria-label="Удалить строку" title="Удалить" @click="removeLine(idx)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </td>
            </tr>
            <tr v-if="lines.length === 0"><td colspan="8" class="text-center text-muted py-6">Нет строк — добавьте позицию</td></tr>
          </tbody>
          <tfoot v-if="lines.length">
            <tr><th colspan="6" class="text-right">Итого</th><th class="text-right font-mono">{{ formatNumber(clientTotal) }}</th><th></th></tr>
          </tfoot>
        </table>
      </div>

      <!-- Mobile-карточки строк -->
      <div class="md:hidden space-y-3">
        <div v-for="(line, idx) in lines" :key="line._k" class="bg-base-200 rounded-lg p-3">
          <div class="flex justify-between items-start mb-2">
            <span class="font-medium text-sm">Позиция {{ idx + 1 }}</span>
            <button type="button" class="btn btn-error btn-xs btn-square touch-target" aria-label="Удалить строку" title="Удалить" @click="removeLine(idx)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <select v-model.number="line.category_a" class="select select-bordered select-sm col-span-2" @change="onCatARow(line)">
              <option :value="null">— раздел A —</option>
              <option v-for="c in rootCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <select v-if="line.category_a" v-model.number="line.category_b" class="select select-bordered select-sm col-span-2" :disabled="!(childrenByParent[line.category_a] || []).length">
              <option :value="null">— подраздел B —</option>
              <option v-for="c in (childrenByParent[line.category_a] || [])" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <div class="col-span-2">
              <WorkItemSearchSelect v-model="line.work_item" size="sm" :category="line.category_b" :allow-custom="true" :error="lineErrors[idx]?.name || lineErrors[idx]?.work_item" @change="onItemPicked(line, $event)" @custom-item="onCustomItem(line, $event)" />
              <input v-if="line.name && !line.work_item" v-model="line.name" type="text" class="input input-bordered input-sm w-full mt-1" placeholder="Название позиции" />
            </div>
            <label class="form-control"><span class="label-text text-xs">Кол-во</span><input v-model="line.quantity" type="number" step="0.001" min="0" class="input input-bordered input-sm text-right" :class="{ 'input-error': lineErrors[idx]?.quantity }" /></label>
            <label class="form-control"><span class="label-text text-xs">Цена</span><input v-model="line.unit_price" type="number" step="0.01" min="0" class="input input-bordered input-sm text-right" :class="{ 'input-error': lineErrors[idx]?.unit_price }" /></label>
            <label class="form-control"><span class="label-text text-xs">Тип</span>
              <select v-model="line.kind" class="select select-bordered select-sm"><option v-for="k in KIND_OPTIONS" :key="k.value" :value="k.value">{{ k.label }}</option></select>
            </label>
            <label class="form-control"><span class="label-text text-xs">№</span><input v-model="line.position_no" type="text" maxlength="32" class="input input-bordered input-sm" /></label>
            <div class="col-span-2 text-right text-sm">Сумма: <span class="font-mono font-semibold">{{ lineAmountDisplay(line) }}</span></div>
          </div>
        </div>
        <div v-if="lines.length" class="text-right font-semibold">Итого: <span class="font-mono">{{ formatNumber(clientTotal) }}</span></div>
      </div>

      <button type="button" class="btn btn-sm btn-primary w-full mt-2" @click="addLine">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        Добавить позицию
      </button>

      <div v-if="formError" class="alert alert-error mt-2"><span>{{ formError }}</span></div>

      <div class="flex justify-end gap-2 mt-4 pb-6">
        <button type="button" class="btn btn-ghost" @click="goBack">Отмена</button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">{{ submitting ? 'Сохранение…' : (isEdit ? 'Обновить' : 'Создать') }}</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEstimatesStore } from '@/stores/estimates'
import { useObjectsStore } from '@/stores/objects'
import { fetchRootCategoriesSafe, fetchChildCategories } from '@/stores/workCategories'
import { useUiStore } from '@/stores/ui'
import WorkItemSearchSelect from '@/components/WorkItemSearchSelect.vue'
import ListHeader from '@/components/ListHeader.vue'
import { formatNumber, todayLocal } from '@/utils/formatters'
import { pluralizeRu } from '@/utils/formatters'
import type { WorkCategory, WorkItemKind, WorkItemLite, EstimateLineWrite, Estimate } from '@/api/types/estimates'

const route = useRoute()
const router = useRouter()
const estimatesStore = useEstimatesStore()
const objectsStore = useObjectsStore()
const ui = useUiStore()

const KIND_OPTIONS: { value: WorkItemKind; label: string }[] = [
  { value: 'work', label: 'Работа' },
  { value: 'material', label: 'Материал' },
  { value: 'equipment', label: 'Оборудование' },
  { value: 'coefficient', label: 'Коэффициент' },
]

interface FormLine {
  _k: string
  work_item: number | null
  category_a: number | null
  category_b: number | null
  name: string
  kind: WorkItemKind
  unit: string
  quantity: string
  unit_price: string
  position_no: string
}

const editId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => editId.value !== null)
const lockObject = computed(() => !!route.query.object)

const form = reactive<{ object: number | null; title: string; date: string; note: string }>({
  object: route.query.object ? Number(route.query.object) : null,
  title: '',
  date: todayLocal(),
  note: '',
})
const lines = ref<FormLine[]>([])
const rootCategories = ref<WorkCategory[]>([])
const childrenByParent = reactive<Record<number, WorkCategory[]>>({})
const submitting = ref(false)
const formError = ref('')
const fieldErrors = reactive<Record<string, string>>({})
const lineErrors = ref<Record<number, Record<string, string>>>({})

const objectName = computed(() => objectsStore.items.find(o => o.id === form.object)?.name || '')

let _kSeq = 0
function newLine(): FormLine {
  return { _k: `l${_kSeq++}`, work_item: null, category_a: null, category_b: null, name: '', kind: 'work', unit: '', quantity: '', unit_price: '', position_no: '' }
}
function addLine() { lines.value.push(newLine()) }
function removeLine(idx: number) {
  lines.value.splice(idx, 1)
  // F-628/F-883-класс: ошибки строк переиндексируем, чтобы не «съезжали» на соседнюю строку.
  const remapped: Record<number, Record<string, string>> = {}
  Object.entries(lineErrors.value).forEach(([k, v]) => {
    const i = Number(k)
    if (i < idx) { remapped[i] = v } else if (i > idx) { remapped[i - 1] = v }
  })
  lineErrors.value = remapped
}

async function loadChildren(parentId: number) {
  if (childrenByParent[parentId]) { return }
  try { childrenByParent[parentId] = await fetchChildCategories(parentId) } catch { childrenByParent[parentId] = [] }
}
function onCatARow(line: FormLine) {
  line.category_b = null
  if (line.category_a) { loadChildren(line.category_a) }
}

function onItemPicked(line: FormLine, item: WorkItemLite | null) {
  if (!item) { return }
  // Существующая позиция → снапшот-префилл (BE всё равно возьмёт снапшот из каталога, но показываем сразу).
  line.name = item.name
  line.kind = item.kind
  line.unit = item.unit
  if (item.default_price && (!line.unit_price || line.unit_price === '')) { line.unit_price = item.default_price }
}
function onCustomItem(line: FormLine, name: string) {
  // Ввод новой позиции: режим «б» если выбран подраздел B (добавить в каталог), иначе «в» (свободная).
  line.work_item = null
  line.name = name
}

function lineAmount(line: FormLine): number | null {
  if (line.kind === 'coefficient') { return null }
  const q = parseFloat(line.quantity || '0')
  const p = parseFloat(line.unit_price || '0')
  if (isNaN(q) || isNaN(p)) { return 0 }
  return q * p
}
function lineAmountDisplay(line: FormLine): string {
  const a = lineAmount(line)
  return a === null ? '×' : formatNumber(a)
}
const clientTotal = computed(() => lines.value.reduce((s, l) => s + (lineAmount(l) || 0), 0))

function validate(): boolean {
  Object.keys(fieldErrors).forEach(k => delete fieldErrors[k])
  lineErrors.value = {}
  formError.value = ''
  let ok = true
  if (!form.object) { fieldErrors.object = 'Выберите объект'; ok = false }
  if (lines.value.length === 0) { formError.value = 'Добавьте хотя бы одну позицию'; ok = false }
  lines.value.forEach((l, i) => {
    const errs: Record<string, string> = {}
    if (!l.work_item && !l.name.trim()) { errs.name = 'Укажите позицию или название' }
    const q = parseFloat(l.quantity || '')
    if (l.quantity === '' || isNaN(q) || q < 0) { errs.quantity = 'Кол-во ≥ 0' }
    if (Object.keys(errs).length) { lineErrors.value[i] = errs; ok = false }
  })
  return ok
}

function buildPayloadLines(): EstimateLineWrite[] {
  return lines.value.map((l, i) => {
    const base: EstimateLineWrite = {
      quantity: String(l.quantity || '0'),
      unit_price: String(l.unit_price || '0'),
      position_no: l.position_no || '',
      order: i,
      kind: l.kind,
      unit: l.unit || '',
    }
    if (l.work_item) {
      base.work_item = l.work_item // (а) существующая позиция
    } else if (l.category_b && l.name.trim()) {
      base.category = l.category_b // (б) добавить в каталог
      base.name = l.name.trim()
      if (l.unit_price) { base.default_price = String(l.unit_price) }
    } else {
      base.name = l.name.trim() // (в) свободная строка
    }
    return base
  })
}

async function handleSubmit() {
  if (submitting.value) { return }
  if (!validate()) { return }
  submitting.value = true
  try {
    const payload = {
      object: form.object!,
      title: form.title || '',
      date: form.date || null,
      note: form.note || '',
      lines: buildPayloadLines(),
    }
    let saved: Estimate
    if (isEdit.value) {
      saved = await estimatesStore.update(editId.value!, payload)
    } else {
      saved = await estimatesStore.create(payload)
    }
    ui.toast({ type: 'success', text: isEdit.value ? 'Смета обновлена' : 'Смета создана' })
    router.push(`/estimates/${saved.id}`)
  } catch (error: any) {
    applyServerErrors(error)
  } finally {
    submitting.value = false
  }
}

function applyServerErrors(error: any) {
  const data = error?.response?.data
  // Построчные ошибки вложенных lines: DRF отдаёт errors как {lines: [{field:[...]}, ...]} по индексу.
  const linesErr = data?.lines
  if (Array.isArray(linesErr)) {
    const mapped: Record<number, Record<string, string>> = {}
    linesErr.forEach((row: any, i: number) => {
      if (row && typeof row === 'object') {
        const e: Record<string, string> = {}
        Object.entries(row).forEach(([f, v]) => { e[f] = Array.isArray(v) ? String(v[0]) : String(v) })
        if (Object.keys(e).length) { mapped[i] = e }
      }
    })
    lineErrors.value = mapped
  }
  if (data?.object) { fieldErrors.object = Array.isArray(data.object) ? data.object[0] : String(data.object) }
  const detail = data?.detail || (Array.isArray(data?.non_field_errors) ? data.non_field_errors[0] : null)
  formError.value = detail || 'Не удалось сохранить смету — проверьте поля'
  ui.toast({ type: 'error', text: formError.value })
}

function goBack() {
  if (form.object) { router.push(`/estimates?object=${form.object}`) } else { router.push('/estimates') }
}

async function loadForEdit(id: number) {
  try {
    const est = await estimatesStore.fetchOne(id)
    form.object = est.object
    form.title = est.title || ''
    form.date = est.date || todayLocal()
    form.note = est.note || ''
    lines.value = est.lines.map(ln => ({
      _k: `l${_kSeq++}`,
      work_item: ln.work_item,
      category_a: null, category_b: null,
      name: ln.name,
      kind: ln.kind,
      unit: ln.unit,
      quantity: ln.quantity,
      unit_price: ln.unit_price,
      position_no: ln.position_no,
    }))
  } catch {
    ui.toast({ type: 'error', text: 'Не удалось загрузить смету' })
    router.push('/estimates')
  }
}

onMounted(async () => {
  // Справочники: объекты (полным списком, page_size:1000 — класс F-718) + корневые категории.
  if (objectsStore.items.length === 0) { objectsStore.fetchList({ page_size: 1000 }).catch(() => {}) }
  rootCategories.value = await fetchRootCategoriesSafe()
  if (isEdit.value) {
    await loadForEdit(editId.value!)
  } else {
    addLine()
  }
})
</script>
