<!-- manual→catalog (F-739): quick-add позиции прайса прямо из строки сметы (creatable-select паттерн).
     Поля как в Catalog.vue (единый стиль). ЦЕНА — только у руководства (work_items.create); вводящий
     (work_items.propose) заводит ДРАФТ без цены (BE решает по праву). Успех → emit created(WorkItem) →
     родитель авто-выбирает позицию в строке. -->
<template>
  <Modal :model-value="modelValue" title="Добавить позицию в каталог" @update:model-value="v => emit('update:modelValue', v)">
    <div class="p-4 space-y-3">
      <div class="form-control w-full">
        <label class="label"><span class="label-text font-medium">Подраздел</span><span class="label-text-alt text-error">*</span></label>
        <select v-model.number="form.category" class="select select-bordered w-full" :class="{ 'select-error': err.category }">
          <option :value="null" disabled>— выберите раздел → подраздел —</option>
          <option v-for="o in subcategoryOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
        </select>
        <label v-if="err.category" class="label"><span class="label-text-alt text-error">{{ err.category }}</span></label>
      </div>

      <div class="form-control w-full">
        <label class="label"><span class="label-text font-medium">Название</span><span class="label-text-alt text-error">*</span></label>
        <input v-model="form.name" type="text" maxlength="256" class="input input-bordered w-full" :class="{ 'input-error': err.name }" placeholder="Напр. «Монтаж розетки»" />
        <label v-if="err.name" class="label"><span class="label-text-alt text-error">{{ err.name }}</span></label>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <label class="form-control"><span class="label-text text-xs">Тип</span>
          <select v-model="form.kind" class="select select-bordered select-sm w-full">
            <option v-for="k in KIND_OPTIONS" :key="k.value" :value="k.value">{{ k.label }}</option>
          </select>
        </label>
        <label class="form-control"><span class="label-text text-xs">Ед.</span>
          <input v-model="form.unit" type="text" maxlength="32" class="input input-bordered input-sm w-full" placeholder="шт., п.м., …" />
        </label>
      </div>

      <!-- Цена: только руководство (work_items.create). Вводящий (propose) → драфт, цену поставит руководство. -->
      <!-- F-740: коэффициент не заводится в каталог → тип всегда работа/материал/оборуд., цена целым сумом. -->
      <label v-if="canSetPrice" class="form-control">
        <span class="label-text text-xs">Цена</span>
        <input v-model="form.default_price" type="number" inputmode="decimal" @focus="selectAllOnFocus" step="1" min="0" class="input input-bordered input-sm text-right w-full" placeholder="целый сум" />
      </label>
      <div v-else class="text-xs text-warning bg-warning/10 rounded-lg p-2">
        Позиция добавится <b>без цены</b> (черновик) — цену поставит руководство в «Прайс-каталоге».
      </div>

      <div class="flex justify-end gap-2 pt-1">
        <button type="button" class="btn btn-ghost" @click="emit('update:modelValue', false)">Отмена</button>
        <button type="button" class="btn btn-primary" :disabled="saving" @click="save">{{ saving ? 'Сохранение…' : 'Добавить' }}</button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { selectAllOnFocus } from '@/utils/numberInput'  // F-1017
import { useWorkCategoriesStore } from '@/stores/workCategories'
import { useWorkItemsStore } from '@/stores/workItems'
import { useUiStore } from '@/stores/ui'
import { usePermissions } from '@/composables/usePermissions'
import Modal from '@/components/Modal.vue'
import type { WorkItem, WorkItemKind, WorkItemRequest } from '@/api/types/estimates'

const props = defineProps<{
  modelValue: boolean
  initialName?: string
  initialCategory?: number | null
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'created': [item: WorkItem]
}>()

const catStore = useWorkCategoriesStore()
const itemStore = useWorkItemsStore()
const ui = useUiStore()
const { can } = usePermissions()

// Цена доступна только руководству; вводящий (propose) заводит драфт (BE решает по праву).
const canSetPrice = computed(() => can('work_items', 'create'))

const KIND_OPTIONS: { value: WorkItemKind; label: string }[] = [
  { value: 'work', label: 'Работа' },
  { value: 'material', label: 'Материал' },
  { value: 'equipment', label: 'Оборудование' },
]

const form = reactive<{ category: number | null; name: string; kind: WorkItemKind; unit: string; default_price: string }>({
  category: null, name: '', kind: 'work', unit: '', default_price: '',
})
const err = reactive<Record<string, string>>({ category: '', name: '' })
const saving = ref(false)

const subcategoryOptions = computed(() =>
  catStore.items.filter(c => c.parent != null).slice().sort((a, b) =>
    (a.parent_name || '').localeCompare(b.parent_name || '') || a.name.localeCompare(b.name),
  ).map(c => ({ id: c.id, label: `${c.parent_name || ''} → ${c.name}` })))

// При открытии — префилл имени из поиска + категории из контекста строки; сброс ошибок.
watch(() => props.modelValue, (open) => {
  if (open) {
    form.name = props.initialName || ''
    form.category = props.initialCategory ?? null
    form.kind = 'work'; form.unit = ''; form.default_price = ''
    err.category = ''; err.name = ''
    if (catStore.items.length === 0) { catStore.fetchList({ page_size: 1000 }).catch(() => {}) }
  }
}, { immediate: true })

onMounted(() => { if (catStore.items.length === 0) { catStore.fetchList({ page_size: 1000 }).catch(() => {}) } })

async function save() {
  err.category = ''; err.name = ''
  if (!form.category) { err.category = 'Выберите подраздел' }
  if (!form.name.trim()) { err.name = 'Укажите название' }
  if (err.category || err.name) { return }
  saving.value = true
  // Цену шлём только если её можно ставить (иначе BE по праву propose сделает драфт).
  const payload: WorkItemRequest = {
    category: form.category!, name: form.name.trim(), kind: form.kind, unit: form.unit || '',
  }
  if (canSetPrice.value) { payload.default_price = form.default_price ? String(form.default_price) : null }
  try {
    const created = await itemStore.create(payload) as WorkItem
    // F-739: драфт выводим из default_price==null (BE WorkItem-сериализатор is_draft не отдаёт).
    ui.toast({ type: 'success', text: created?.default_price == null ? 'Позиция добавлена (черновик, ждёт цены)' : 'Позиция добавлена в каталог' })
    emit('created', created)
    emit('update:modelValue', false)
  } catch (e: unknown) {
    const d = (e as { response?: { data?: Record<string, unknown> } })?.response?.data
    if (d?.name) { err.name = Array.isArray(d.name) ? String(d.name[0]) : String(d.name) }
    if (d?.category) { err.category = Array.isArray(d.category) ? String(d.category[0]) : String(d.category) }
    if (!err.name && !err.category) { ui.toast({ type: 'error', text: String(d?.detail || 'Не удалось добавить позицию') }) }
  } finally { saving.value = false }
}
</script>
