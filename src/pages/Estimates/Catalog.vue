<!-- Прайс-каталог (задача #64): ЕДИНОЕ дерево-аккордеон Раздел → Подраздел → Позиции.
     Заменяет прежние 2 вкладки (Разделы/Позиции): вся иерархия видна и правится в одном месте,
     с контекстными «+» на каждом уровне. Строгие 3 уровня (F-937: позиции всегда под подразделом).
     Дерево строится на клиенте из плоских catStore.items + itemStore.items. -->
<template>
  <div class="list-container">
    <ListHeader title="Прайс-каталог" subtitle="Разделы → подразделы → позиции" icon="book" :show-create="false" :show-stats="false" />

    <!-- Панель: поиск позиции + добавить раздел -->
    <div class="flex flex-wrap gap-2 items-center mb-3">
      <input v-model="search" type="search" placeholder="Поиск позиции…" class="input input-bordered input-sm flex-1 min-w-[180px]" aria-label="Поиск позиции" />
      <button v-if="canCreateCat" class="btn btn-sm btn-primary" @click="openAddRoot">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="ACTION_ICONS.add" /></svg>
        <span class="ml-1">Раздел</span>
      </button>
    </div>

    <LoadingSpinner v-if="loading && !catStore.items.length" size="lg" variant="primary" text="Загрузка каталога…" :overlay="false" />

    <div v-else class="space-y-2">
      <!-- РАЗДЕЛ (A) -->
      <div v-for="root in visibleTree" :key="root.id" class="card bg-base-100 border border-base-300 overflow-hidden">
        <div class="flex items-center gap-1 p-2 sm:p-3">
          <button class="btn btn-ghost btn-square row-action-btn shrink-0" :aria-label="isOpen(root.id) ? 'Свернуть' : 'Развернуть'" @click="toggle(root.id)">
            <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-90': isOpen(root.id) }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath('chevron_right')" /></svg>
          </button>
          <button class="flex-1 min-w-0 text-left self-stretch flex flex-col justify-center py-1" @click="toggle(root.id)">
            <div class="font-semibold truncate">{{ root.name }}</div>
            <div class="text-xs text-muted">подразделов: {{ root.subs.length }} · позиций: {{ root.posCount }}</div>
          </button>
          <button v-if="canCreateCat" class="btn btn-ghost btn-square row-action-btn text-primary shrink-0" aria-label="Добавить подраздел" title="Добавить подраздел" @click="openAddChild(root)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="ACTION_ICONS.add" /></svg>
          </button>
          <button v-if="canEditCat" class="btn btn-ghost btn-square row-action-btn shrink-0" aria-label="Изменить раздел" title="Изменить" @click="openEditCat(root)"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="ACTION_ICONS.edit" /></svg></button>
          <button v-if="canDeleteCat" class="btn btn-ghost btn-square row-action-btn text-error shrink-0" aria-label="Удалить раздел" :title="delTitle(root)" :disabled="root.children_count > 0 || root.items_count > 0" @click="deleteCat(root)"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="ACTION_ICONS.delete" /></svg></button>
        </div>

        <!-- ПОДРАЗДЕЛЫ (B) -->
        <div v-if="isOpen(root.id)" class="border-t border-base-200">
          <div v-for="sub in root.subs" :key="sub.id" class="border-b border-base-200 last:border-b-0">
            <div class="flex items-center gap-1 py-1.5 px-2 sm:px-3 pl-4 sm:pl-8 bg-base-200/40">
              <button class="btn btn-ghost btn-square row-action-btn shrink-0" :aria-label="isOpen(sub.id) ? 'Свернуть' : 'Развернуть'" @click="toggle(sub.id)">
                <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-90': isOpen(sub.id) }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath('chevron_right')" /></svg>
              </button>
              <button class="flex-1 min-w-0 text-left self-stretch flex items-center py-1" @click="toggle(sub.id)">
                <span class="text-sm font-medium">{{ sub.name }}</span> <span class="text-xs text-muted">({{ sub.allCount }})</span>
              </button>
              <button v-if="canAddItem" class="btn btn-ghost btn-square row-action-btn text-primary shrink-0" aria-label="Добавить позицию" title="Добавить позицию" @click="openItemForm(null, sub.id)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="ACTION_ICONS.add" /></svg>
              </button>
              <button v-if="canEditCat" class="btn btn-ghost btn-square row-action-btn shrink-0" aria-label="Изменить подраздел" title="Изменить" @click="openEditCat(sub)"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="ACTION_ICONS.edit" /></svg></button>
              <button v-if="canDeleteCat" class="btn btn-ghost btn-square row-action-btn text-error shrink-0" aria-label="Удалить подраздел" :title="delTitle(sub)" :disabled="sub.items_count > 0" @click="deleteCat(sub)"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="ACTION_ICONS.delete" /></svg></button>
            </div>

            <!-- ПОЗИЦИИ -->
            <div v-if="isOpen(sub.id)">
              <div v-for="p in sub.positions" :key="p.id" class="flex items-center gap-2 py-1.5 px-2 sm:px-3 pl-6 sm:pl-12 text-sm border-t border-base-200/60">
                <div class="flex-1 min-w-0">
                  <div class="truncate">{{ p.name }}</div>
                  <!-- моб: мета одной строкой под именем (имя получает всю ширину) -->
                  <div class="text-xs text-muted sm:hidden mt-0.5">{{ p.kind_display }} · {{ p.unit || '—' }} · <span class="font-mono">{{ p.default_price ? formatNumber(p.default_price) : 'НЗ' }}</span></div>
                </div>
                <!-- desktop: колонки (контейнер hidden sm:flex — надёжно прячет на мобиле, без CSS-конфликта .badge) -->
                <div class="hidden sm:flex items-center gap-2 shrink-0">
                  <span class="badge badge-ghost badge-sm">{{ p.kind_display }}</span>
                  <span class="text-xs text-muted w-12 text-right">{{ p.unit || '—' }}</span>
                  <span class="font-mono text-xs w-24 text-right">{{ p.default_price ? formatNumber(p.default_price) : 'НЗ' }}</span>
                </div>
                <button v-if="canEditItem" class="btn btn-ghost btn-square row-action-btn shrink-0" aria-label="Изменить позицию" title="Изменить" @click="openItemForm(p, sub.id)"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="ACTION_ICONS.edit" /></svg></button>
                <button v-if="canDeleteItem" class="btn btn-ghost btn-square row-action-btn text-error shrink-0" aria-label="Удалить позицию" title="Удалить" @click="deleteItem(p)"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="ACTION_ICONS.delete" /></svg></button>
              </div>
              <div v-if="!sub.positions.length" class="py-2 px-2 pl-6 sm:pl-12 text-xs text-muted">{{ search ? '—' : 'Позиций нет' }}</div>
            </div>
          </div>
          <div v-if="!root.subs.length" class="py-2 px-3 pl-4 sm:pl-8 text-xs text-muted">{{ search ? '—' : 'Подразделов нет' }}</div>
        </div>
      </div>

      <div v-if="!visibleTree.length" class="text-center text-muted py-10">{{ search ? 'Ничего не найдено' : 'Каталог пуст — добавьте раздел' }}</div>
    </div>

    <!-- Модалка раздела/подраздела -->
    <Modal v-model="catModal" :title="catModalTitle">
      <div class="p-4 space-y-3">
        <div v-if="catFormMode === 'child'" class="text-sm bg-base-200 rounded-lg px-3 py-2">Раздел: <span class="font-medium">{{ catForm.parentName }}</span></div>
        <div class="form-control"><label class="label"><span class="label-text">Название</span><span class="label-text-alt text-error">*</span></label>
          <input v-model="catForm.name" type="text" maxlength="128" class="input input-bordered w-full" :class="{ 'input-error': catErr.name }" @keydown.enter.prevent="saveCat" />
          <label v-if="catErr.name" class="label"><span class="label-text-alt text-error">{{ catErr.name }}</span></label>
        </div>
        <div class="flex justify-end gap-2"><button class="btn btn-ghost" @click="catModal = false">Отмена</button><button class="btn btn-primary" :disabled="savingCat" @click="saveCat">{{ savingCat ? '…' : 'Сохранить' }}</button></div>
      </div>
    </Modal>

    <!-- Модалка позиции -->
    <Modal v-model="itemModal" :title="editingItem?.id ? 'Изменить позицию' : 'Новая позиция'">
      <div class="p-4 space-y-3">
        <div class="form-control"><label class="label"><span class="label-text">Подраздел</span><span class="label-text-alt text-error">*</span></label>
          <select v-model.number="itemForm.category" class="select select-bordered w-full" :class="{ 'select-error': itemErr.category }">
            <option :value="null" disabled>— выберите подраздел —</option>
            <option v-for="o in subcategoryOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
          </select>
          <label v-if="itemErr.category" class="label"><span class="label-text-alt text-error">{{ itemErr.category }}</span></label>
        </div>
        <div class="form-control"><label class="label"><span class="label-text">Название</span><span class="label-text-alt text-error">*</span></label>
          <input v-model="itemForm.name" type="text" maxlength="256" class="input input-bordered w-full" :class="{ 'input-error': itemErr.name }" />
          <label v-if="itemErr.name" class="label"><span class="label-text-alt text-error">{{ itemErr.name }}</span></label>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <label class="form-control"><span class="label-text text-xs">Тип</span><select v-model="itemForm.kind" class="select select-bordered select-sm w-full"><option v-for="k in KIND_OPTIONS" :key="k.value" :value="k.value">{{ k.label }}</option></select></label>
          <label class="form-control"><span class="label-text text-xs">Ед.</span><input v-model="itemForm.unit" type="text" maxlength="32" class="input input-bordered input-sm w-full" /></label>
          <label class="form-control"><span class="label-text text-xs">Цена</span><input v-model="itemForm.default_price" type="number" step="0.01" min="0" class="input input-bordered input-sm text-right w-full" /></label>
        </div>
        <div class="flex justify-end gap-2"><button class="btn btn-ghost" @click="itemModal = false">Отмена</button><button class="btn btn-primary" :disabled="savingItem" @click="saveItem">{{ savingItem ? '…' : 'Сохранить' }}</button></div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useWorkCategoriesStore } from '@/stores/workCategories'
import { useWorkItemsStore } from '@/stores/workItems'
import { useUiStore } from '@/stores/ui'
import { usePermissions } from '@/composables/usePermissions'
import ListHeader from '@/components/ListHeader.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Modal from '@/components/Modal.vue'
import { formatNumber } from '@/utils/formatters'
import { getIconPath } from '@/assets/icons'
import { ACTION_ICONS } from '@/utils/actionIcons'
import type { WorkCategory, WorkItem, WorkItemKind } from '@/api/types/estimates'

const catStore = useWorkCategoriesStore()
const itemStore = useWorkItemsStore()
const ui = useUiStore()
const { can } = usePermissions()

const KIND_OPTIONS: { value: WorkItemKind; label: string }[] = [
  { value: 'work', label: 'Работа' }, { value: 'material', label: 'Материал' },
  { value: 'equipment', label: 'Оборудование' }, { value: 'coefficient', label: 'Коэффициент' },
]

// F-912/913: каждый гейт = ТОЧНО право BE DictPermission. Категории (work_categories) и позиции
// (work_items) — РАЗНЫЕ ресурсы.
const canCreateCat = computed(() => can('work_categories', 'create'))
const canEditCat = computed(() => can('work_categories', 'edit'))
const canDeleteCat = computed(() => can('work_categories', 'delete'))
const canAddItem = computed(() => can('work_items', 'create'))
const canEditItem = computed(() => can('work_items', 'edit'))
const canDeleteItem = computed(() => can('work_items', 'delete'))

const loading = computed(() => catStore.loading || itemStore.loading)
const search = ref('')

// ── дерево на клиенте: разделы(parent==null) → подразделы(parent==root) → позиции(itemsByCategory) ──
const byOrder = (a: { order?: number; name: string }, b: { order?: number; name: string }) =>
  ((a.order ?? 0) - (b.order ?? 0)) || a.name.localeCompare(b.name)

const itemsByCategory = computed<Record<number, WorkItem[]>>(() => {
  const m: Record<number, WorkItem[]> = {}
  for (const it of itemStore.items) { (m[it.category] ||= []).push(it) }
  return m
})

const visibleTree = computed(() => {
  const q = search.value.trim().toLowerCase()
  const roots = catStore.items.filter(c => c.parent == null).slice().sort(byOrder)
  return roots
    .map(root => {
      const subsRaw = catStore.items.filter(c => c.parent === root.id).slice().sort(byOrder)
      const subs = subsRaw.map(sub => {
        const all = (itemsByCategory.value[sub.id] || []).slice().sort(byOrder)
        const positions = q ? all.filter(p => p.name.toLowerCase().includes(q)) : all
        return { ...sub, positions, allCount: all.length }
      })
      const filteredSubs = q ? subs.filter(s => s.positions.length) : subs
      const posCount = subs.reduce((n, s) => n + s.allCount, 0)
      return { ...root, subs: filteredSubs, posCount }
    })
    .filter(root => (q ? root.subs.length > 0 : true))
})

// разворот: при активном поиске всё с совпадениями раскрыто; иначе — по клику
const expanded = reactive(new Set<number>())
function isOpen(id: number) { return search.value.trim() ? true : expanded.has(id) }
function toggle(id: number) { if (search.value.trim()) { return } expanded.has(id) ? expanded.delete(id) : expanded.add(id) }

function delTitle(c: WorkCategory) {
  return (c.children_count > 0 || c.items_count > 0) ? 'Нельзя удалить: есть подразделы или позиции' : 'Удалить'
}

// подразделы (2-й уровень) для селекта позиции — строго под них цепляем позиции.
const subcategoryOptions = computed(() =>
  catStore.items.filter(c => c.parent != null).slice().sort((a, b) =>
    (a.parent_name || '').localeCompare(b.parent_name || '') || a.name.localeCompare(b.name),
  ).map(c => ({ id: c.id, label: `${c.parent_name || ''} → ${c.name}` })))

// ── категории CRUD ──
const catModal = ref(false)
const catFormMode = ref<'root' | 'child' | 'edit'>('root')
const editingCat = ref<WorkCategory | null>(null)
const catForm = reactive<{ name: string; parent: number | null; parentName: string }>({ name: '', parent: null, parentName: '' })
const catErr = reactive<Record<string, string>>({})
const savingCat = ref(false)

const catModalTitle = computed(() => {
  if (catFormMode.value === 'child') { return 'Новый подраздел' }
  if (catFormMode.value === 'edit') { return editingCat.value?.parent ? 'Изменить подраздел' : 'Изменить раздел' }
  return 'Новый раздел'
})
function openAddRoot() {
  catFormMode.value = 'root'; editingCat.value = null
  catForm.name = ''; catForm.parent = null; catForm.parentName = ''; catErr.name = ''; catModal.value = true
}
function openAddChild(a: WorkCategory) {
  catFormMode.value = 'child'; editingCat.value = null
  catForm.name = ''; catForm.parent = a.id; catForm.parentName = a.name; catErr.name = ''
  expanded.add(a.id); catModal.value = true
}
function openEditCat(c: WorkCategory) {
  catFormMode.value = 'edit'; editingCat.value = c
  catForm.name = c.name; catForm.parent = c.parent; catForm.parentName = c.parent_name || ''; catErr.name = ''; catModal.value = true
}
async function saveCat() {
  catErr.name = ''
  if (!catForm.name.trim()) { catErr.name = 'Укажите название'; return }
  savingCat.value = true
  try {
    if (editingCat.value?.id) {
      // ТОЛЬКО name (parent НЕ шлём) — иначе оживает F-733 re-parent-валидация.
      await catStore.update(editingCat.value.id, { name: catForm.name.trim() })
    } else {
      await catStore.create({ name: catForm.name.trim(), parent: catForm.parent })
    }
    ui.toast({ type: 'success', text: catFormMode.value === 'child' ? 'Подраздел сохранён' : 'Раздел сохранён' })
    catModal.value = false
    await reload()
  } catch (e: any) {
    const d = e?.response?.data
    if (d?.name) { catErr.name = Array.isArray(d.name) ? d.name[0] : String(d.name) }
    if (!catErr.name) { ui.toast({ type: 'error', text: d?.detail || (Array.isArray(d?.parent) ? d.parent[0] : 'Не удалось сохранить') }) }
  } finally { savingCat.value = false }
}
async function deleteCat(c: WorkCategory) {
  const kind = c.parent ? 'подраздел' : 'раздел'
  if (!confirm(`Удалить ${kind} «${c.name}»?`)) { return }
  try {
    await catStore.remove(c.id)
    ui.toast({ type: 'success', text: `${c.parent ? 'Подраздел' : 'Раздел'} удалён` })
    await reload()
  } catch (e: any) {
    ui.toast({ type: 'error', text: e?.response?.data?.detail || 'Нельзя удалить: есть подразделы или позиции' })
  }
}

// ── позиции CRUD ──
const itemModal = ref(false)
const editingItem = ref<WorkItem | null>(null)
const itemForm = reactive<{ category: number | null; name: string; kind: WorkItemKind; unit: string; default_price: string }>({ category: null, name: '', kind: 'work', unit: '', default_price: '' })
const itemErr = reactive<Record<string, string>>({})
const savingItem = ref(false)

// contextCategoryId — подраздел, из-под которого нажали «+ Позиция» (подставляется в форму).
function openItemForm(it: WorkItem | null, contextCategoryId?: number) {
  editingItem.value = it
  itemForm.category = it?.category ?? contextCategoryId ?? null
  itemForm.name = it?.name || ''
  itemForm.kind = it?.kind || 'work'
  itemForm.unit = it?.unit || ''
  itemForm.default_price = it?.default_price || ''
  itemErr.category = ''; itemErr.name = ''
  if (contextCategoryId) { expanded.add(contextCategoryId) }
  itemModal.value = true
}
async function saveItem() {
  itemErr.category = ''; itemErr.name = ''
  if (!itemForm.category) { itemErr.category = 'Выберите подраздел' }
  if (!itemForm.name.trim()) { itemErr.name = 'Укажите название' }
  if (itemErr.category || itemErr.name) { return }
  savingItem.value = true
  const payload = { category: itemForm.category!, name: itemForm.name.trim(), kind: itemForm.kind, unit: itemForm.unit || '', default_price: itemForm.default_price ? String(itemForm.default_price) : null }
  try {
    if (editingItem.value?.id) { await itemStore.update(editingItem.value.id, payload) } else { await itemStore.create(payload) }
    ui.toast({ type: 'success', text: 'Позиция сохранена' })
    itemModal.value = false
    await reload()
  } catch (e: any) {
    const d = e?.response?.data
    if (d?.name) { itemErr.name = Array.isArray(d.name) ? d.name[0] : String(d.name) }
    if (d?.category) { itemErr.category = Array.isArray(d.category) ? d.category[0] : String(d.category) }
    if (!itemErr.name && !itemErr.category) { ui.toast({ type: 'error', text: d?.detail || 'Не удалось сохранить позицию' }) }
  } finally { savingItem.value = false }
}
async function deleteItem(it: WorkItem) {
  if (!confirm(`Удалить позицию «${it.name}»?`)) { return }
  try {
    await itemStore.remove(it.id)
    ui.toast({ type: 'success', text: 'Позиция удалена' })
    await reload()
  } catch (e: any) {
    ui.toast({ type: 'error', text: e?.response?.data?.detail || 'Не удалось удалить позицию' })
  }
}

// ── загрузка: все категории + все позиции разом (дерево группируем на клиенте) ──
async function reload() {
  await Promise.all([
    catStore.fetchList({ page_size: 1000 }).catch(() => {}),
    itemStore.fetchList({ page: 1, page_size: 1000 }).catch(() => {}),
  ])
}
onMounted(reload)
</script>
