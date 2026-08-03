<!-- Форма сметы по объекту («отчёт цен») — #65: поиск-документ с АВТО-ГРУППИРОВКОЙ.
     Один поиск сверху → выбранная позиция сама встаёт в свой Раздел→Подраздел (путь из каталога,
     без ручного каскада). Подытоги на обоих уровнях (подраздел + раздел) + Итого. Строки уходят
     вложенно одним вызовом; BE снапшотит путь категории (историчность). -->
<template>
  <div class="list-container">
    <ListHeader
      :title="isEdit ? 'Редактирование сметы' : 'Новая смета'"
      :subtitle="objectName ? `Объект: ${objectName}` : 'Смета по объекту (отчёт цен)'"
      icon="clipboard" :show-create="false" :show-stats="false"
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

      <!-- Поиск-добавление позиции: позиция сама встаёт в свой раздел/подраздел -->
      <div class="form-control w-full">
        <label class="label"><span class="label-text font-medium">Добавить позицию</span></label>
        <WorkItemSearchSelect
          v-model="searchPick" :allow-custom="true"
          placeholder="Найти позицию в каталоге…"
          @change="onSearchPicked" @custom-item="onSearchCustom"
        />
        <label class="label"><span class="label-text-alt text-muted">Позиция сама встанет в свой раздел → подраздел. Раздел/подраздел выбирать не нужно.</span></label>
      </div>

      <div class="flex items-center justify-between mt-2">
        <h2 class="text-lg font-semibold">Позиции <span class="text-sm text-muted">({{ lines.length }} {{ pluralizeRu(lines.length, ['строка', 'строки', 'строк']) }})</span></h2>
      </div>

      <div v-if="lines.length === 0" class="text-center text-muted py-10 border border-dashed border-base-300 rounded-lg">
        Пусто — найдите и добавьте позицию через поиск выше
      </div>

      <!-- Группы: Раздел → Подраздел → позиции, с подытогами на обоих уровнях -->
      <div v-for="g in groupedLines" :key="g.section" class="card bg-base-100 border border-base-300 overflow-hidden">
        <div class="card-body p-3 gap-2">
          <div class="font-semibold text-primary">{{ g.section }}</div>

          <div v-for="sg in g.subgroups" :key="sg.subcategory" class="pl-2 sm:pl-3 border-l-2 border-base-200 space-y-1">
            <div v-if="sg.subcategory && sg.subcategory !== '—'" class="text-sm font-medium text-muted">{{ sg.subcategory }}</div>

            <div v-for="{ line, idx } in sg.items" :key="line._k" class="bg-base-200/40 rounded-lg p-2">
              <div class="flex items-start gap-2">
                <span class="flex-1 min-w-0 text-sm break-words">{{ line.name }}</span>
                <button type="button" class="btn btn-ghost btn-square row-action-btn text-error shrink-0" aria-label="Удалить строку" title="Удалить" @click="removeLine(idx)">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="ACTION_ICONS.delete" /></svg>
                </button>
              </div>
              <div class="flex items-center gap-1.5 mt-1.5 flex-wrap text-sm">
                <input v-model="line.quantity" type="number" :step="qtyStep(line.unit)" min="0" :max="MAX_QTY" class="input input-bordered input-sm w-20 text-right" :class="{ 'input-error': lineErrors[idx]?.quantity }" aria-label="Количество" @change="sanitizeQty(line)" />
                <span class="text-muted w-10 text-center">{{ line.unit || '—' }}</span>
                <span class="text-muted">×</span>
                <!-- цена: каталожная позиция → read-only (прайс-книга, меняется в каталоге); произвольная одноразовая → вручную -->
                <span v-if="line.work_item" class="font-mono w-28 text-right text-muted" title="Цена из каталога — меняется в «Прайс-каталоге»">{{ formatNumber(line.unit_price || 0) }}</span>
                <input v-else v-model="line.unit_price" type="number" step="1" min="0" class="input input-bordered input-sm w-28 text-right" :class="{ 'input-error': lineErrors[idx]?.unit_price }" aria-label="Цена" placeholder="цена" />
                <span class="text-muted">=</span>
                <span class="font-mono font-semibold ml-auto">{{ lineAmountDisplay(line) }}</span>
              </div>
              <div v-if="lineErrors[idx]?.quantity || lineErrors[idx]?.unit_price || lineErrors[idx]?.name" class="text-xs text-error mt-1">
                {{ lineErrors[idx]?.name || lineErrors[idx]?.quantity || lineErrors[idx]?.unit_price }}
              </div>
            </div>

            <div class="text-right text-xs text-muted pr-1">Подытог «{{ sg.subcategory || '—' }}»: <span class="font-mono">{{ formatNumber(sg.subTotal) }}</span></div>
          </div>

          <div class="text-right text-sm font-medium border-t border-base-200 pt-1.5">Итого «{{ g.section }}»: <span class="font-mono text-success">{{ formatNumber(g.sectionTotal) }}</span></div>
        </div>
      </div>

      <!-- Коэффициенты (kind=coefficient): зона применения (раздел/подраздел) + вклад; перемножаются -->
      <div v-if="coeffLines.length" class="card bg-base-100 border border-warning/40 overflow-hidden">
        <div class="card-body p-3 gap-2">
          <div class="font-semibold text-warning">Коэффициенты <span class="text-xs text-muted font-normal">(к работам выбранной зоны; несколько на зону — перемножаются)</span></div>
          <div v-for="{ line, idx } in coeffLines" :key="line._k" class="bg-base-200/40 rounded-lg p-2">
            <div class="flex items-start gap-2">
              <span class="flex-1 min-w-0 text-sm break-words">{{ line.name }} <span class="font-mono text-muted">×{{ formatNumberClean(line.unit_price || '1') }}</span></span>
              <button type="button" class="btn btn-ghost btn-square row-action-btn text-error shrink-0" aria-label="Удалить коэффициент" title="Удалить" @click="removeLine(idx)">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="ACTION_ICONS.delete" /></svg>
              </button>
            </div>
            <div class="flex items-center gap-1.5 mt-1.5 flex-wrap text-sm">
              <span class="text-muted">зона:</span>
              <select :value="scopeValue(line)" @change="onScopeChange(line, ($event.target as HTMLSelectElement).value)" class="select select-bordered select-sm min-w-0 max-w-[18rem]" :class="{ 'select-error': !line.coeff_scope }" aria-label="Зона коэффициента">
                <option value="">— выберите зону —</option>
                <option v-for="o in scopeOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
              <span class="text-muted">→</span>
              <!-- N2 (аудит): знак берём из числа (скидка k<1 → «-…» красным), не префиксуем «+» безусловно -->
              <span class="font-mono font-semibold ml-auto" :class="contribClass(idx)">{{ contribDisplay(idx) }}</span>
            </div>
            <div v-if="lineErrors[idx]?.coeff" class="text-xs text-error mt-1">{{ lineErrors[idx]?.coeff }}</div>
          </div>
        </div>
      </div>

      <!-- Итого сметы -->
      <div v-if="lines.length" class="card bg-base-100 border border-base-300">
        <div class="card-body flex-row justify-between items-center py-3 px-4">
          <span class="font-semibold text-lg">ИТОГО</span>
          <span class="font-mono font-semibold text-xl text-success">{{ formatNumber(clientTotal) }}</span>
        </div>
      </div>

      <div v-if="formError" class="alert alert-error"><span>{{ formError }}</span></div>

      <div class="flex justify-end gap-2 mt-2 pb-6">
        <button type="button" class="btn btn-ghost" @click="goBack">Отмена</button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">{{ submitting ? 'Сохранение…' : (isEdit ? 'Обновить' : 'Создать') }}</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEstimatesStore } from '@/stores/estimates'
import { useObjectsStore } from '@/stores/objects'
import { useUiStore } from '@/stores/ui'
import WorkItemSearchSelect from '@/components/WorkItemSearchSelect.vue'
import ListHeader from '@/components/ListHeader.vue'
import { formatNumber, formatNumberClean, todayLocal, pluralizeRu } from '@/utils/formatters'
import { computeEstimate } from '@/utils/estimateCalc'
import type { WorkItemKind, WorkItemLite, EstimateLineWrite, Estimate } from '@/api/types/estimates'
import { ACTION_ICONS } from '@/utils/actionIcons'

const route = useRoute()
const router = useRouter()
const estimatesStore = useEstimatesStore()
const objectsStore = useObjectsStore()
const ui = useUiStore()

// Строка формы: несёт снапшот пути (section/subcategory) для авто-группировки.
interface FormLine {
  _k: string
  work_item: number | null
  category: number | null        // id подраздела (провенанс / добавление новой в каталог)
  section_name: string           // раздел (группировка)
  subcategory_name: string       // подраздел
  name: string
  kind: WorkItemKind
  unit: string
  quantity: string
  unit_price: string
  position_no: string
  coeff_scope: string            // #65 Фаза 1: зона коэффициента ('section'|'subcategory'|''); '' = не применён
  coeff_scope_name: string       // section-зона: имя раздела; subcategory-зона: имя подраздела
  coeff_scope_section: string    // M4: раздел подраздела-зоны (квалификатор; для section-зоны пусто)
}

const editId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => editId.value !== null)
const lockObject = computed(() => !!route.query.object)

const form = reactive<{ object: number | null; title: string; date: string; note: string }>({
  object: route.query.object ? Number(route.query.object) : null,
  title: '', date: todayLocal(), note: '',
})
const lines = ref<FormLine[]>([])
const searchPick = ref<number | null>(null)
const submitting = ref(false)
const formError = ref('')
const fieldErrors = reactive<Record<string, string>>({})
const lineErrors = ref<Record<number, Record<string, string>>>({})

const objectName = computed(() => objectsStore.items.find(o => o.id === form.object)?.name || '')

let _kSeq = 0

// ── добавление позиции через поиск (позиция сама встаёт в свою группу) ──
let _lastPickId: number | null = null
let _lastPickAt = 0
function onSearchPicked(item: WorkItemLite | null) {
  if (!item) { return }
  const clearSearch = () => nextTick(() => { searchPick.value = null })
  // D5: гвард двойного клика — тот же item в пределах 500мс игнорируем.
  if (item.id === _lastPickId && Date.now() - _lastPickAt < 500) { clearSearch(); return }
  _lastPickId = item.id; _lastPickAt = Date.now()
  // D5+D7: позиция уже в смете → +1 к количеству (не новая строка). M5 (аудит): НЕ для коэффициента —
  // один каталожный коэффициент может понадобиться на РАЗНЫЕ зоны (каждая = своя строка), дедуп их сливал.
  const existing = item.kind !== 'coefficient'
    ? lines.value.find(l => l.work_item === item.id)
    : undefined
  if (existing) {
    existing.quantity = String(effQty(existing) + 1)
    ui.toast({ type: 'info', text: `«${item.name}» уже в смете — количество +1` })
    clearSearch(); return
  }
  lines.value.push({
    _k: `l${_kSeq++}`, work_item: item.id, category: item.category,
    section_name: item.section_name || '', subcategory_name: item.subcategory_name || '',
    name: item.name, kind: item.kind, unit: item.unit,
    quantity: '1', unit_price: item.default_price || '', position_no: '',
    coeff_scope: '', coeff_scope_name: '', coeff_scope_section: '',
  })
  clearSearch()
}
function onSearchCustom(name: string) {
  // Свободная позиция (нет в каталоге) → группа «Прочее». В каталог добавляют отдельно (Прайс-каталог).
  lines.value.push({
    _k: `l${_kSeq++}`, work_item: null, category: null,
    section_name: '', subcategory_name: '',
    name, kind: 'work', unit: '', quantity: '1', unit_price: '', position_no: '',
    coeff_scope: '', coeff_scope_name: '', coeff_scope_section: '',
  })
  nextTick(() => { searchPick.value = null })
}
function removeLine(idx: number) {
  lines.value.splice(idx, 1)
  const remapped: Record<number, Record<string, string>> = {}
  Object.entries(lineErrors.value).forEach(([k, v]) => {
    const i = Number(k)
    if (i < idx) { remapped[i] = v } else if (i > idx) { remapped[i - 1] = v }
  })
  lineErrors.value = remapped
}

// ── числа: количество целое ТОЛЬКО для штучных; всё остальное (мерные/коэф./проц./пусто) — дробное ──
// D2 (аудит-инверсия, F-954): вайтлист ЦЕЛЫХ единиц, а не мерных — иначе любая незнакомая единица
// (коэф./проц./новая мерная от руководства) молча флорилась бы. Неизвестное → допускаем дробное (без потери).
const COUNT_UNITS = new Set(['шт.', 'точ.'])
const MAX_QTY = 1_000_000 // D3: разумный потолок количества
function isCount(unit: string) { return COUNT_UNITS.has((unit || '').trim().toLowerCase()) }
function qtyStep(unit: string) { return isCount(unit) ? '1' : '0.001' }

// Каноническое кол-во строки: clamp [0, MAX] (D1 нет отрицательного / D3 потолок) + целое для штучных (D2).
function effQty(line: FormLine): number {
  const q = parseFloat(line.quantity || '0')
  if (isNaN(q)) { return 0 }
  const c = Math.min(Math.max(0, q), MAX_QTY)
  return isCount(line.unit) ? Math.floor(c) : c
}
// Синхронизируем видимое значение поля после ввода (пусто оставляем пустым — ловит валидация).
function sanitizeQty(line: FormLine) {
  if (line.quantity === '' || line.quantity == null) { return }
  line.quantity = String(effQty(line))
}

// ── суммы (целый сум; отрицательное/дробное-штучное/сверх-max отсекает effQty; цена ≥0) ──
function lineAmount(line: FormLine): number | null {
  if (line.kind === 'coefficient') { return null }
  const p = Math.max(0, parseFloat(line.unit_price || '0'))
  if (isNaN(p)) { return 0 }
  return Math.round(effQty(line) * p)
}
function lineAmountDisplay(line: FormLine): string {
  const a = lineAmount(line)
  return a === null ? '×' : formatNumber(a)
}

// #65 Фаза 1: расчёт-зеркало BE (компаундинг коэффициентов). contributions выровнен с lines.value.
const calcResult = computed(() => computeEstimate(lines.value))
const clientTotal = computed(() => calcResult.value.total)
function contributionAt(idx: number): number | null { return calcResult.value.contributions[idx] ?? null }
// N2 (аудит): показ вклада со знаком (скидка k<1 → отрицательный, красным; не «+−…» зелёным).
function contribDisplay(idx: number): string {
  const c = contributionAt(idx)
  if (c === null) { return 'выберите зону' }
  return c > 0 ? `+${formatNumber(c)}` : formatNumber(c)
}
function contribClass(idx: number): string {
  const c = contributionAt(idx)
  if (c === null || c === 0) { return 'text-muted' }
  return c > 0 ? 'text-success' : 'text-error'
}

// Коэффициент-строки (kind=coefficient) — отдельным блоком со селектором зоны (не в группировке работ).
const coeffLines = computed(() =>
  lines.value.map((line, idx) => ({ line, idx })).filter(({ line }) => line.kind === 'coefficient'))

// Зоны для селектора: разделы + КВАЛИФИЦИРОВАННЫЕ разделом подразделы (M4: имя «Общие» не уникально).
// value кодирует scope+section+name через U+0001 (не встречается в именах) → устойчиво к именам с символами.
const SEP = '\u0001'
interface ScopeOpt { scope: string; section: string; name: string; label: string; value: string }
const scopeOptions = computed<ScopeOpt[]>(() => {
  const opts: ScopeOpt[] = []
  const seenSec = new Set<string>(), seenPair = new Set<string>()
  for (const l of lines.value) {
    if (l.kind === 'coefficient') { continue }
    if (l.section_name && !seenSec.has(l.section_name)) {
      seenSec.add(l.section_name)
      opts.push({ scope: 'section', section: '', name: l.section_name,
        label: `Раздел: ${l.section_name}`, value: `section${SEP}${SEP}${l.section_name}` })
    }
    if (l.subcategory_name) {
      const key = `${l.section_name}${SEP}${l.subcategory_name}`
      if (!seenPair.has(key)) {
        seenPair.add(key)
        opts.push({ scope: 'subcategory', section: l.section_name, name: l.subcategory_name,
          label: `${l.section_name} / ${l.subcategory_name}`,
          value: `subcategory${SEP}${l.section_name}${SEP}${l.subcategory_name}` })
      }
    }
  }
  return opts
})

function scopeValue(line: FormLine): string {
  return line.coeff_scope ? `${line.coeff_scope}${SEP}${line.coeff_scope_section}${SEP}${line.coeff_scope_name}` : ''
}
function onScopeChange(line: FormLine, val: string) {
  if (!val) { line.coeff_scope = ''; line.coeff_scope_section = ''; line.coeff_scope_name = ''; return }
  const [scope, section, name] = val.split(SEP)
  line.coeff_scope = scope; line.coeff_scope_section = section || ''; line.coeff_scope_name = name || ''
}

// N3 (аудит): зона исчезла из опций (удалили все работы раздела/подраздела) → сбросить зону коэффициента,
// иначе селектор пуст, а вклад тихо «+0». Сброс включает штатное «выберите зону»/валидацию.
watch(scopeOptions, (opts) => {
  const valid = new Set(opts.map(o => o.value))
  for (const l of lines.value) {
    if (l.kind === 'coefficient' && l.coeff_scope && !valid.has(scopeValue(l))) {
      l.coeff_scope = ''; l.coeff_scope_section = ''; l.coeff_scope_name = ''
    }
  }
})

// ── группировка Раздел → Подраздел (БЕЗ коэффициентов — они отдельным блоком) ──
const groupedLines = computed(() => {
  const sections = new Map<string, Map<string, { line: FormLine; idx: number }[]>>()
  lines.value.forEach((line, idx) => {
    if (line.kind === 'coefficient') { return }
    const sec = line.section_name || 'Прочее'
    const sub = line.subcategory_name || '—'
    if (!sections.has(sec)) { sections.set(sec, new Map()) }
    const subs = sections.get(sec)!
    if (!subs.has(sub)) { subs.set(sub, []) }
    subs.get(sub)!.push({ line, idx })
  })
  return [...sections.entries()].map(([section, subs]) => {
    const subgroups = [...subs.entries()].map(([subcategory, items]) => ({
      subcategory, items,
      subTotal: items.reduce((s, { line }) => s + (lineAmount(line) || 0), 0),
    }))
    return { section, subgroups, sectionTotal: subgroups.reduce((s, sg) => s + sg.subTotal, 0) }
  })
})

// ── валидация ──
function validate(): boolean {
  Object.keys(fieldErrors).forEach(k => delete fieldErrors[k])
  lineErrors.value = {}
  formError.value = ''
  let ok = true
  if (!form.object) { fieldErrors.object = 'Выберите объект'; ok = false }
  if (lines.value.length === 0) { formError.value = 'Добавьте хотя бы одну позицию'; ok = false }
  lines.value.forEach((l, i) => {
    const errs: Record<string, string> = {}
    if (!l.work_item && !l.name.trim()) { errs.name = 'Укажите позицию' }
    const q = parseFloat(l.quantity || '')
    if (l.quantity === '' || isNaN(q) || q < 0) { errs.quantity = 'Кол-во ≥ 0' }
    if (l.unit_price !== '' && l.unit_price != null) {
      const p = parseFloat(String(l.unit_price))
      if (isNaN(p) || p < 0) { errs.unit_price = 'Цена ≥ 0' }
    }
    // #65 Фаза 1 (аудит A#6): коэффициент без выбранной зоны инертен — не пускаем сабмит.
    if (l.kind === 'coefficient' && !l.coeff_scope) { errs.coeff = 'Выберите зону коэффициента'; ok = false }
    if (Object.keys(errs).length) { lineErrors.value[i] = errs; ok = false }
  })
  return ok
}

function buildPayloadLines(): EstimateLineWrite[] {
  return lines.value.map((l, i) => {
    const base: EstimateLineWrite = {
      quantity: String(effQty(l)),
      unit_price: String(Math.max(0, parseFloat(l.unit_price || '0')) || 0),
      position_no: l.position_no || '', order: i, kind: l.kind, unit: l.unit || '',
      // D8: снапшот пути с фронта → историчность на правке (BE не ре-деривит из текущего каталога).
      section_name: l.section_name || '', subcategory_name: l.subcategory_name || '',
      // #65 Фаза 1: зона коэффициента (для kind=coefficient; иначе пусто, BE игнорит на не-коэфф).
      coeff_scope: l.coeff_scope || '', coeff_scope_name: l.coeff_scope_name || '',
      coeff_scope_section: l.coeff_scope_section || '',
    }
    if (l.work_item) {
      base.work_item = l.work_item                    // (а) существующая позиция
      base.name = l.name.trim()                       // снапшот-имя явно (историчность, F-929)
    } else if (l.category && l.name.trim()) {
      base.category = l.category                       // (б) добавить в каталог
      base.name = l.name.trim()
      if (l.unit_price) { base.default_price = String(l.unit_price) }
    } else {
      base.name = l.name.trim()                        // (в) свободная строка
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
      object: form.object!, title: form.title || '', date: form.date || null,
      note: form.note || '', lines: buildPayloadLines(),
    }
    const saved: Estimate = isEdit.value
      ? await estimatesStore.update(editId.value!, payload)
      : await estimatesStore.create(payload)
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
    form.date = est.date || ''            // F-929: без даты → пусто (не сегодня) на правке
    form.note = est.note || ''
    lines.value = est.lines.map(ln => ({
      _k: `l${_kSeq++}`, work_item: ln.work_item, category: null,
      section_name: ln.section_name || '', subcategory_name: ln.subcategory_name || '',
      name: ln.name, kind: ln.kind, unit: ln.unit,
      quantity: ln.quantity, unit_price: ln.unit_price, position_no: ln.position_no,
      coeff_scope: ln.coeff_scope || '', coeff_scope_name: ln.coeff_scope_name || '',
      coeff_scope_section: ln.coeff_scope_section || '',
    }))
  } catch {
    ui.toast({ type: 'error', text: 'Не удалось загрузить смету' })
    router.push('/estimates')
  }
}

onMounted(async () => {
  if (objectsStore.items.length === 0) { objectsStore.fetchList({ page_size: 1000 }).catch(() => {}) }
  if (isEdit.value) { await loadForEdit(editId.value!) }
})
</script>
