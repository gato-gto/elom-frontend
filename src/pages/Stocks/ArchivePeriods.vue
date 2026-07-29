<template>
  <div class="list-container space-y-6">
    <!-- F-526: единый заголовок как на остальных страницах (ListHeader), вместо кастомного <h1>. -->
    <ListHeader
      title="Архивные периоды"
      subtitle="Закрытие месяца по объекту делает данные периода (закупки, движения, списания) архивными — только для чтения. Балансы сохраняются."
      icon="inventory_2"
      :show-create="false"
    />

    <!-- Закрыть период — только для держателей stock.edit (иначе контрол скрыт, не «обманка») -->
    <section v-if="canEdit" class="rounded-lg border border-base-300 p-4">
      <h2 class="text-sm font-medium mb-3">Закрыть период</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:items-end">
        <label class="block">
          <span class="block text-xs mb-1 text-muted">Объект</span>
          <select v-model="form.object" class="select select-bordered w-full">
            <option :value="0" disabled>— выберите объект —</option>
            <option v-for="o in objectOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </label>
        <label class="block">
          <span class="block text-xs mb-1 text-muted">Месяц</span>
          <input v-model="form.month" type="month" class="input input-bordered w-full" />
        </label>
        <button
          class="btn btn-primary"
          :disabled="!form.object || !form.month || busy"
          @click="askClose"
        >
          Закрыть период
        </button>
      </div>
    </section>

    <!-- Список закрытых периодов -->
    <section class="rounded-lg border border-base-300 overflow-hidden">
      <div class="px-4 py-3 border-b border-base-300 flex items-center justify-between">
        <h2 class="text-sm font-medium">Закрытые периоды</h2>
        <button class="btn btn-ghost btn-sm" :disabled="store.loading" @click="refresh">Обновить</button>
      </div>

      <div v-if="store.error" class="px-4 py-3 text-sm text-error border-b border-base-300">{{ store.error }}</div>

      <div v-if="store.loading" class="p-6 text-center text-sm text-subtle">Загрузка…</div>
      <div v-else-if="store.items.length === 0" class="p-8 text-center text-sm text-subtle">
        Пока нет закрытых периодов
      </div>
      <!-- F-526: стандартная таблица .modern-table как на остальных экранах (вместо кастомной). -->
      <div v-else class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Месяц</th>
              <th>Объект</th>
              <th>Закрыт</th>
              <th>Кем</th>
              <th v-if="canEdit" class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in store.items" :key="p.id">
              <td class="whitespace-nowrap font-mono">{{ formatMonth(p.month) }}</td>
              <td>{{ p.object_name }}</td>
              <td class="text-muted whitespace-nowrap font-mono">{{ formatDateTime(p.closed_at) }}</td>
              <td class="text-muted">{{ p.closed_by_name || '—' }}</td>
              <td v-if="canEdit" class="text-right">
                <button class="btn btn-sm btn-outline" :disabled="busy" @click="askReopen(p)">Открыть</button>
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
import ListHeader from '@/components/ListHeader.vue'

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
  // F-718: objects=35 > 20 — грузим полный список БЕЗУСЛОВНО. Guard !items.length оставлял усечённый
  // (20) стор с Objects/List → объекты #21..35 печатались как «объект #id» вместо имени.
  const loads: Promise<unknown>[] = [
    store.fetchList().catch(() => {}),
    objectsStore.fetchList({ page_size: 1000, ordering: 'name' } as any),
  ]
  await Promise.all(loads)
})
</script>
