<!-- Управление прайс-каталогом: разделы работ (A→B) + позиции. RBAC: руководство правит категории
     (work_categories.*), вводящий добавляет позиции (work_items.create). -->
<template>
  <div class="list-container">
    <ListHeader title="Прайс-каталог" subtitle="Разделы работ и позиции (для смет)" icon="book" :show-create="false" :show-stats="false" />

    <div class="tabs tabs-boxed my-2">
      <a class="tab" :class="{ 'tab-active': tab === 'categories' }" @click="tab = 'categories'">Разделы</a>
      <a class="tab" :class="{ 'tab-active': tab === 'items' }" @click="tab = 'items'">Позиции</a>
    </div>

    <!-- Разделы — иерархия A→B (owner UX: добавить раздел отдельно, у раздела появляется «+ подраздел»).
         Responsive: одна логика desktop+mobile (убирает widetable). Дерево строится на клиенте из
         плоского списка catStore.items (parent/children_count/items_count). -->
    <div v-if="tab === 'categories'">
      <div class="flex justify-between items-center mb-3">
        <p class="text-sm text-muted hidden md:block">Раздел (A) → подраздел (B). Позиции цепляются к разделу или подразделу.</p>
        <button v-if="canCreateCat" class="btn btn-sm btn-primary ml-auto" @click="openAddRoot">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>Добавить раздел
        </button>
      </div>

      <div class="space-y-3">
        <!-- A-раздел -->
        <div v-for="a in rootCats" :key="a.id" class="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
          <div class="flex justify-between items-center gap-2 p-3">
            <div class="min-w-0">
              <div class="font-semibold truncate">{{ a.name }}</div>
              <div class="text-xs text-muted">подразделов: {{ a.children_count }} · позиций: {{ a.items_count }}</div>
            </div>
            <div class="flex gap-1 shrink-0">
              <button v-if="canCreateCat" class="btn btn-ghost btn-xs touch-target text-primary" aria-label="Добавить подраздел" title="Добавить подраздел" @click="openAddChild(a)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg><span class="hidden sm:inline ml-1">Подраздел</span>
              </button>
              <button v-if="canEditCat" class="btn btn-ghost btn-xs btn-square touch-target" aria-label="Изменить раздел" title="Изменить" @click="openEditCat(a)"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
              <button v-if="canDeleteCat" class="btn btn-ghost btn-xs btn-square touch-target text-error" aria-label="Удалить раздел" :title="delTitle(a)" :disabled="a.children_count > 0 || a.items_count > 0" @click="deleteCat(a)"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
            </div>
          </div>
          <!-- B-подразделы (с отступом, без кнопки +подраздел → 3-й уровень невозможен из UI) -->
          <div v-if="childrenOf(a.id).length" class="border-t border-base-200 bg-base-200/40 px-3 py-1">
            <div v-for="b in childrenOf(a.id)" :key="b.id" class="flex justify-between items-center gap-2 py-1.5 border-l-2 border-base-300 pl-3">
              <div class="min-w-0">
                <div class="text-sm truncate">{{ b.name }}</div>
                <div class="text-xs text-muted">позиций: {{ b.items_count }}</div>
              </div>
              <div class="flex gap-1 shrink-0">
                <button v-if="canEditCat" class="btn btn-ghost btn-xs btn-square touch-target" aria-label="Изменить подраздел" title="Изменить" @click="openEditCat(b)"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                <button v-if="canDeleteCat" class="btn btn-ghost btn-xs btn-square touch-target text-error" aria-label="Удалить подраздел" :title="delTitle(b)" :disabled="b.items_count > 0" @click="deleteCat(b)"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="rootCats.length === 0" class="text-center text-muted py-8">Разделов нет — добавьте первый</div>
      </div>
    </div>

    <!-- Позиции -->
    <div v-else>
      <div class="grid md:grid-cols-3 gap-2 mb-2 items-end">
        <div class="form-control"><label class="label"><span class="label-text">Раздел A</span></label>
          <select v-model.number="filterA" class="select select-bordered select-sm" @change="onFilterA">
            <option :value="null">— все —</option><option v-for="c in roots" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="form-control"><label class="label"><span class="label-text">Подраздел B</span></label>
          <select v-model.number="filterB" class="select select-bordered select-sm" :disabled="!filterA" @change="loadItems">
            <option :value="null">— все —</option><option v-for="c in (childrenByParent[filterA || 0] || [])" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="flex justify-end" v-if="canAddItem">
          <button class="btn btn-sm btn-primary" @click="openItemForm(null)"><svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>Добавить позицию</button>
        </div>
      </div>
      <!-- Desktop-таблица -->
      <div class="hidden md:block overflow-x-auto">
        <table class="modern-table w-full">
          <thead><tr><th>Название</th><th>Раздел</th><th class="w-28">Тип</th><th class="w-16">Ед.</th><th class="text-right w-28">Цена</th><th class="w-24"></th></tr></thead>
          <tbody>
            <tr v-for="it in itemStore.items" :key="it.id">
              <td class="font-medium">{{ it.name }}</td>
              <td>{{ it.category_name }}</td>
              <td><span class="badge badge-ghost badge-sm">{{ it.kind_display }}</span></td>
              <td>{{ it.unit || '—' }}</td>
              <td class="text-right font-mono">{{ it.default_price ? formatNumber(it.default_price) : '—' }}</td>
              <td class="text-right" v-if="canEditItem || canDeleteItem">
                <button v-if="canEditItem" class="btn btn-ghost btn-xs btn-square touch-target" aria-label="Изменить позицию" title="Изменить" @click="openItemForm(it)"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                <button v-if="canDeleteItem" class="btn btn-ghost btn-xs btn-square touch-target text-error" aria-label="Удалить позицию" title="Удалить" @click="deleteItem(it)"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
              </td>
              <td v-else></td>
            </tr>
            <tr v-if="itemStore.items.length === 0"><td colspan="6" class="text-center text-muted py-8">Позиций нет</td></tr>
          </tbody>
        </table>
      </div>
      <!-- F-930: Mobile-карточки позиций -->
      <div class="md:hidden space-y-2">
        <div v-for="it in itemStore.items" :key="it.id" class="bg-base-200 rounded-lg p-3">
          <div class="flex justify-between items-start">
            <div class="font-medium">{{ it.name }}</div>
            <div class="flex gap-1" v-if="canEditItem || canDeleteItem">
              <button v-if="canEditItem" class="btn btn-ghost btn-xs btn-square touch-target" aria-label="Изменить позицию" title="Изменить" @click="openItemForm(it)"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
              <button v-if="canDeleteItem" class="btn btn-ghost btn-xs btn-square touch-target text-error" aria-label="Удалить позицию" title="Удалить" @click="deleteItem(it)"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
            </div>
          </div>
          <div class="text-sm text-muted mt-1">{{ it.category_name }} · {{ it.kind_display }}<span v-if="it.unit"> · {{ it.unit }}</span></div>
          <div v-if="it.default_price" class="text-sm font-mono mt-1">{{ formatNumber(it.default_price) }}</div>
        </div>
        <div v-if="itemStore.items.length === 0" class="text-center text-muted py-8">Позиций нет</div>
      </div>
    </div>

    <!-- Модалка раздела — 3 режима (root/child/edit), БЕЗ parent-селекта (родитель из контекста). -->
    <Modal v-model="catModal" :title="catModalTitle">
      <div class="p-4 space-y-3">
        <!-- Контекст для подраздела: под каким разделом (read-only, не селект). -->
        <div v-if="catFormMode === 'child'" class="text-sm bg-base-200 rounded-lg px-3 py-2">
          Раздел: <span class="font-medium">{{ catForm.parentName }}</span>
        </div>
        <div class="form-control"><label class="label"><span class="label-text">Название</span><span class="label-text-alt text-error">*</span></label>
          <input v-model="catForm.name" type="text" maxlength="128" class="input input-bordered" :class="{ 'input-error': catErr.name }" @keydown.enter.prevent="saveCat" />
          <label v-if="catErr.name" class="label"><span class="label-text-alt text-error">{{ catErr.name }}</span></label>
        </div>
        <div class="flex justify-end gap-2"><button class="btn btn-ghost" @click="catModal = false">Отмена</button><button class="btn btn-primary" :disabled="savingCat" @click="saveCat">{{ savingCat ? '…' : 'Сохранить' }}</button></div>
      </div>
    </Modal>

    <!-- Модалка позиции -->
    <Modal v-model="itemModal" :title="editingItem?.id ? 'Изменить позицию' : 'Новая позиция'">
      <div class="p-4 space-y-3">
        <div class="form-control"><label class="label"><span class="label-text">Раздел (подраздел B)</span><span class="label-text-alt text-error">*</span></label>
          <select v-model.number="itemForm.category" class="select select-bordered" :class="{ 'select-error': itemErr.category }">
            <option :value="null" disabled>— выберите раздел —</option>
            <option v-for="c in allCategories" :key="c.id" :value="c.id">{{ c.parent_name ? c.parent_name + ' → ' : '' }}{{ c.name }}</option>
          </select>
          <label v-if="itemErr.category" class="label"><span class="label-text-alt text-error">{{ itemErr.category }}</span></label>
        </div>
        <div class="form-control"><label class="label"><span class="label-text">Название</span><span class="label-text-alt text-error">*</span></label>
          <input v-model="itemForm.name" type="text" maxlength="256" class="input input-bordered" :class="{ 'input-error': itemErr.name }" />
          <label v-if="itemErr.name" class="label"><span class="label-text-alt text-error">{{ itemErr.name }}</span></label>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <label class="form-control"><span class="label-text text-xs">Тип</span><select v-model="itemForm.kind" class="select select-bordered select-sm"><option v-for="k in KIND_OPTIONS" :key="k.value" :value="k.value">{{ k.label }}</option></select></label>
          <label class="form-control"><span class="label-text text-xs">Ед.</span><input v-model="itemForm.unit" type="text" maxlength="32" class="input input-bordered input-sm" /></label>
          <label class="form-control"><span class="label-text text-xs">Цена</span><input v-model="itemForm.default_price" type="number" step="0.01" min="0" class="input input-bordered input-sm text-right" /></label>
        </div>
        <div class="flex justify-end gap-2"><button class="btn btn-ghost" @click="itemModal = false">Отмена</button><button class="btn btn-primary" :disabled="savingItem" @click="saveItem">{{ savingItem ? '…' : 'Сохранить' }}</button></div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useWorkCategoriesStore, fetchRootCategoriesSafe, fetchChildCategories } from '@/stores/workCategories'
import { useWorkItemsStore } from '@/stores/workItems'
import { useUiStore } from '@/stores/ui'
import { usePermissions } from '@/composables/usePermissions'
import ListHeader from '@/components/ListHeader.vue'
import Modal from '@/components/Modal.vue'
import { formatNumber } from '@/utils/formatters'
import type { WorkCategory, WorkItem, WorkItemKind } from '@/api/types/estimates'

const catStore = useWorkCategoriesStore()
const itemStore = useWorkItemsStore()
const ui = useUiStore()
const { can } = usePermissions()

const KIND_OPTIONS: { value: WorkItemKind; label: string }[] = [
  { value: 'work', label: 'Работа' }, { value: 'material', label: 'Материал' },
  { value: 'equipment', label: 'Оборудование' }, { value: 'coefficient', label: 'Коэффициент' },
]

// F-912/913: каждый гейт = ТОЧНО право BE DictPermission (POST→create, PATCH→edit, DELETE→delete).
// Категории (work_categories) и позиции (work_items) — РАЗНЫЕ ресурсы (не путать гейты).
const canCreateCat = computed(() => can('work_categories', 'create'))
const canEditCat = computed(() => can('work_categories', 'edit'))
const canDeleteCat = computed(() => can('work_categories', 'delete'))
const canAddItem = computed(() => can('work_items', 'create'))
const canEditItem = computed(() => can('work_items', 'edit'))
const canDeleteItem = computed(() => can('work_items', 'delete'))

const tab = ref<'categories' | 'items'>('categories')
const roots = ref<WorkCategory[]>([])
const childrenByParent = reactive<Record<number, WorkCategory[]>>({})
const allCategories = computed(() => catStore.items)

const filterA = ref<number | null>(null)
const filterB = ref<number | null>(null)

// ── категории CRUD (дерево A→B, owner UX: добавить раздел отдельно → «+ подраздел» у раздела) ──
const catModal = ref(false)
const catFormMode = ref<'root' | 'child' | 'edit'>('root')
const editingCat = ref<WorkCategory | null>(null)
const catForm = reactive<{ name: string; parent: number | null; parentName: string }>({ name: '', parent: null, parentName: '' })
const catErr = reactive<Record<string, string>>({})
const savingCat = ref(false)

// Дерево строим на клиенте из плоского catStore.items (parent/children_count/items_count уже приходят).
const rootCats = computed(() => catStore.items.filter(c => c.parent == null))
function childrenOf(parentId: number) { return catStore.items.filter(c => c.parent === parentId) }
function delTitle(c: WorkCategory) {
  return (c.children_count > 0 || c.items_count > 0) ? 'Нельзя удалить: есть подразделы или позиции' : 'Удалить'
}
const catModalTitle = computed(() => {
  if (catFormMode.value === 'child') { return 'Новый подраздел' }
  if (catFormMode.value === 'edit') { return editingCat.value?.parent ? 'Изменить подраздел' : 'Изменить раздел' }
  return 'Новый раздел'
})

function openAddRoot() {
  catFormMode.value = 'root'; editingCat.value = null
  catForm.name = ''; catForm.parent = null; catForm.parentName = ''
  catErr.name = ''; catModal.value = true
}
function openAddChild(a: WorkCategory) {
  catFormMode.value = 'child'; editingCat.value = null
  catForm.name = ''; catForm.parent = a.id; catForm.parentName = a.name
  catErr.name = ''; catModal.value = true
}
function openEditCat(c: WorkCategory) {
  catFormMode.value = 'edit'; editingCat.value = c
  catForm.name = c.name; catForm.parent = c.parent; catForm.parentName = c.parent_name || ''
  catErr.name = ''; catModal.value = true
}
async function saveCat() {
  catErr.name = ''
  if (!catForm.name.trim()) { catErr.name = 'Укажите название'; return }
  savingCat.value = true
  try {
    if (editingCat.value?.id) {
      // ТОЛЬКО name (parent НЕ шлём) — иначе оживает F-733 re-parent-валидация. Переместить B под другой A
      // из UI нельзя (нет действия) → 3-й уровень / re-parent структурно исключены.
      await catStore.update(editingCat.value.id, { name: catForm.name.trim() })
    } else {
      await catStore.create({ name: catForm.name.trim(), parent: catForm.parent })
    }
    ui.toast({ type: 'success', text: catFormMode.value === 'child' ? 'Подраздел сохранён' : 'Раздел сохранён' })
    catModal.value = false
    await reloadCats()
  } catch (e: any) {
    const d = e?.response?.data
    // F-733: уникальность (parent,name) → {name:...}; показываем под инпутом.
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
    await reloadCats()
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

function openItemForm(it: WorkItem | null) {
  editingItem.value = it
  itemForm.category = it?.category ?? filterB.value ?? null
  itemForm.name = it?.name || ''
  itemForm.kind = it?.kind || 'work'
  itemForm.unit = it?.unit || ''
  itemForm.default_price = it?.default_price || ''
  itemErr.category = ''; itemErr.name = ''
  itemModal.value = true
}
async function saveItem() {
  itemErr.category = ''; itemErr.name = ''
  if (!itemForm.category) { itemErr.category = 'Выберите раздел' }
  if (!itemForm.name.trim()) { itemErr.name = 'Укажите название' }
  if (itemErr.category || itemErr.name) { return }
  savingItem.value = true
  const payload = { category: itemForm.category!, name: itemForm.name.trim(), kind: itemForm.kind, unit: itemForm.unit || '', default_price: itemForm.default_price ? String(itemForm.default_price) : null }
  try {
    if (editingItem.value?.id) {
      await itemStore.update(editingItem.value.id, payload)
    } else {
      await itemStore.create(payload)
    }
    ui.toast({ type: 'success', text: 'Позиция сохранена' })
    itemModal.value = false
    await loadItems()
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
    await loadItems()
  } catch (e: any) {
    ui.toast({ type: 'error', text: e?.response?.data?.detail || 'Не удалось удалить позицию' })
  }
}

// ── загрузка ──
async function reloadCats() {
  await catStore.fetchList({ page_size: 1000 }).catch(() => {})
  roots.value = await fetchRootCategoriesSafe()
}
async function onFilterA() {
  filterB.value = null
  if (filterA.value && !childrenByParent[filterA.value]) {
    try { childrenByParent[filterA.value] = await fetchChildCategories(filterA.value) } catch { childrenByParent[filterA.value] = [] }
  }
  await loadItems()
}
async function loadItems() {
  const category = filterB.value || filterA.value || undefined
  await itemStore.fetchList({ page: 1, page_size: 1000, category }).catch(() => {})
}

onMounted(async () => {
  await reloadCats()
  await loadItems()
})
</script>
