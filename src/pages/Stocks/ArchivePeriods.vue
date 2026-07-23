<template>
  <div class="archive-periods space-y-6">
    <!-- Header -->
    <header>
      <h1 class="text-xl font-semibold">Архивные периоды</h1>
      <p class="text-sm text-muted mt-1 max-w-3xl">
        Закрытие периода (месяц × объект) делает данные периода — закупки, движения остатков и
        списания — архивными и только для чтения. Открытие периода снимает архив. Балансы при этом
        сохраняются (архив — про неизменяемость истории, не про обнуление остатков).
      </p>
    </header>

    <!-- Закрыть период — только для держателей stock.edit (иначе контрол скрыт, не «обманка») -->
    <section v-if="canEdit" class="rounded border border-base-300 p-4">
      <h2 class="text-sm font-medium mb-3">Закрыть период</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:items-end">
        <label class="block">
          <span class="block text-xs mb-1 text-muted">Объект</span>
          <select v-model="form.object" class="select select-bordered select-sm w-full">
            <option :value="0" disabled>— выберите объект —</option>
            <option v-for="o in objectOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </label>
        <label class="block">
          <span class="block text-xs mb-1 text-muted">Месяц</span>
          <input v-model="form.month" type="month" class="input input-bordered input-sm w-full" />
        </label>
        <button
          class="btn btn-sm btn-primary"
          :disabled="!form.object || !form.month || busy"
          @click="askClose"
        >
          Закрыть период
        </button>
      </div>
    </section>

    <!-- Список закрытых периодов -->
    <section class="rounded border border-base-300 overflow-hidden">
      <div class="px-4 py-3 border-b border-base-300 flex items-center justify-between">
        <h2 class="text-sm font-medium">Закрытые периоды</h2>
        <button class="btn btn-ghost btn-xs" :disabled="store.loading" @click="refresh">Обновить</button>
      </div>

      <div v-if="store.error" class="px-4 py-3 text-sm text-error border-b border-base-300">{{ store.error }}</div>

      <div v-if="store.loading" class="p-6 text-center text-sm text-subtle">Загрузка…</div>
      <div v-else-if="store.items.length === 0" class="p-8 text-center text-sm text-subtle">
        Пока нет закрытых периодов
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-left text-xs text-muted border-b border-base-300">
            <tr>
              <th class="px-4 py-2 font-medium">Месяц</th>
              <th class="px-4 py-2 font-medium">Объект</th>
              <th class="px-4 py-2 font-medium">Закрыт</th>
              <th class="px-4 py-2 font-medium">Кем</th>
              <th v-if="canEdit" class="px-4 py-2 font-medium text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in store.items" :key="p.id" class="border-b border-base-200 last:border-0">
              <td class="px-4 py-2 whitespace-nowrap font-mono">{{ formatMonth(p.month) }}</td>
              <td class="px-4 py-2">{{ p.object_name }}</td>
              <td class="px-4 py-2 text-muted whitespace-nowrap font-mono">{{ formatDateTime(p.closed_at) }}</td>
              <td class="px-4 py-2 text-muted">{{ p.closed_by_name || '—' }}</td>
              <td v-if="canEdit" class="px-4 py-2 text-right">
                <button class="btn btn-xs btn-outline" :disabled="busy" @click="askReopen(p)">Открыть</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Подтверждение действия -->
    <Modal v-model="confirm.open" :title="confirm.title" size="lg" :closable="!busy">
      <p class="text-sm">{{ confirm.message }}</p>
      <div v-if="confirm.error" class="mt-3 alert alert-error text-sm py-2">{{ confirm.error }}</div>
      <div class="flex justify-end gap-2 mt-5">
        <button class="btn btn-ghost btn-sm" :disabled="busy" @click="confirm.open = false">Отмена</button>
        <button
          class="btn btn-sm"
          :class="confirm.danger ? 'btn-warning' : 'btn-primary'"
          :disabled="busy"
          @click="runConfirm"
        >
          <span v-if="busy" class="loading loading-spinner loading-xs"></span>
          {{ confirm.confirmText }}
        </button>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useArchivePeriodsStore, type ArchivePeriod } from '@/stores/archivePeriods'
import { useObjectsStore } from '@/stores/objects'
import { usePermissions } from '@/composables/usePermissions'
import { useUiStore } from '@/stores/ui'
import { parseApiError } from '@/utils/errorHandler'
import { formatDateTime } from '@/utils/formatters'
import type { SiteObject } from '@/api/types'
import Modal from '@/components/Modal.vue'

const store = useArchivePeriodsStore()
const objectsStore = useObjectsStore()
const ui = useUiStore()
const { can } = usePermissions()

// D-014: закрытие/открытие требуют stock.edit — иначе контролы полностью скрыты (не «кнопки-обманки»)
const canEdit = computed(() => can('stock', 'edit'))

const busy = ref(false)
const form = reactive({ object: 0, month: new Date().toISOString().slice(0, 7) })

const objectOptions = computed(() =>
  objectsStore.items.map((o: SiteObject) => ({ value: o.id, label: o.name }))
)

interface ConfirmState {
  open: boolean
  title: string
  message: string
  confirmText: string
  danger: boolean
  error: string | null
  run: (() => Promise<void>) | null
}
const confirm = reactive<ConfirmState>({
  open: false, title: '', message: '', confirmText: '', danger: false, error: null, run: null,
})

const RU_MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
function formatMonth(m: string): string {
  const d = new Date(m)
  if (isNaN(d.getTime())) {return m}
  return `${RU_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function objectName(id: number): string {
  return objectsStore.items.find((o: SiteObject) => o.id === id)?.name ?? `объект #${id}`
}

function askClose() {
  if (!form.object || !form.month) {return}
  confirm.title = 'Закрыть период'
  confirm.message = `Закрыть ${formatMonth(form.month + '-01')} по объекту «${objectName(form.object)}»? `
    + 'Закупки, движения и списания этого периода станут архивными (только для чтения).'
  confirm.confirmText = 'Закрыть период'
  confirm.danger = false
  confirm.error = null
  confirm.run = async () => {
    await store.close(form.object, form.month)
    ui.toast({ type: 'success', text: 'Период закрыт' })
  }
  confirm.open = true
}

function askReopen(p: ArchivePeriod) {
  const month = String(p.month).slice(0, 7)
  confirm.title = 'Открыть период'
  confirm.message = `Открыть ${formatMonth(p.month)} по объекту «${p.object_name}»? `
    + 'С данных периода будет снят архив — они снова станут редактируемыми.'
  confirm.confirmText = 'Открыть период'
  confirm.danger = true
  confirm.error = null
  confirm.run = async () => {
    await store.reopen(p.object, month)
    ui.toast({ type: 'success', text: 'Период открыт' })
  }
  confirm.open = true
}

async function runConfirm() {
  if (!confirm.run) {return}
  busy.value = true
  confirm.error = null
  try {
    await confirm.run()
    confirm.open = false
  } catch (e: any) {
    confirm.error = parseApiError(e).detail || 'Не удалось выполнить действие'
  } finally {
    busy.value = false
  }
}

async function refresh() {
  try {
    await store.fetchList()
  } catch {
    ui.toast({ type: 'error', text: 'Не удалось обновить список' })
  }
}

onMounted(async () => {
  const loads: Promise<unknown>[] = [store.fetchList().catch(() => {})]
  if (!objectsStore.items.length) {loads.push(objectsStore.fetchList({ page_size: 1000, ordering: 'name' } as any))}
  await Promise.all(loads)
})
</script>
