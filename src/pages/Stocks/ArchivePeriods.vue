<template>
  <div class="list-container space-y-6">
    <!-- F-1106 (ответ владельца 7): одна «дата запрета» на объект вместо помесячного закрытия -->
    <ListHeader
      title="Дата запрета"
      subtitle="Всё по дату запрета включительно — закупки, движения, списания — только для чтения. Остатки и отчёты их учитывают. Дату переносит и снимает руководство."
      icon="inventory_2"
      :show-create="false"
    />

    <section class="rounded-lg border border-base-300 overflow-hidden">
      <div class="px-4 py-3 border-b border-base-300 flex items-center justify-between">
        <h2 class="text-sm font-medium">Объекты</h2>
        <button class="btn btn-ghost btn-sm" :disabled="store.loading" @click="refresh">Обновить</button>
      </div>
      <div v-if="store.error" class="px-4 py-3 text-sm text-error border-b border-base-300">{{ store.error }}</div>
      <div v-if="store.loading && store.lockDates.length === 0" class="p-6 text-center text-sm text-subtle">Загрузка…</div>
      <div v-else-if="store.lockDates.length === 0" class="p-8 text-center text-sm text-subtle">Нет объектов</div>
      <div v-else class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Объект</th>
              <th>Дата запрета</th>
              <th>Кто и когда менял</th>
              <th v-if="canEdit" class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in store.lockDates" :key="r.object">
              <td>
                <span class="break-words">{{ r.object_name }}</span>
                <span v-if="!r.object_is_active" class="badge badge-ghost badge-sm ml-1">неактивен</span>
              </td>
              <td class="whitespace-nowrap">
                <span v-if="r.closed_until" class="font-medium">{{ formatDate(r.closed_until) }}</span>
                <span v-else class="text-muted">не задана</span>
              </td>
              <td class="text-muted">
                <template v-if="r.closed_until_at">{{ r.closed_until_by_name || '—' }}, {{ formatDateTime(r.closed_until_at) }}</template>
                <template v-else>—</template>
              </td>
              <td v-if="canEdit" class="text-right">
                <button data-test="edit-lock" class="btn btn-sm btn-outline" :disabled="busy" @click="openEdit(r)">
                  {{ r.closed_until ? 'Изменить' : 'Поставить' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Помесячные закрытия по старому правилу (на проде их нет) — только снять -->
    <section v-if="store.items.length > 0" class="rounded-lg border border-base-300 overflow-hidden">
      <div class="px-4 py-3 border-b border-base-300">
        <h2 class="text-sm font-medium">Закрытые месяцы (старое правило)</h2>
      </div>
      <div class="table-container">
        <table class="modern-table">
          <tbody>
            <tr v-for="p in store.items" :key="p.id">
              <td class="whitespace-nowrap">{{ formatMonthYear(p.month) }}</td>
              <td>{{ p.object_name }}</td>
              <td v-if="canEdit" class="text-right">
                <!-- F-1111 (ревью): месяц внутри даты запрета объекта открыть нельзя (сервер — 400) -->
                <button v-if="!insideLockDate(p)" data-test="reopen-legacy" class="btn btn-sm btn-ghost" :disabled="busy"
                        @click="reopenLegacy(p)">Открыть</button>
                <span v-else class="text-xs text-muted">внутри даты запрета</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Modal v-model="edit.open" :title="`Дата запрета: ${edit.name}`" size="lg" :closable="!busy">
      <label class="block">
        <span class="block text-xs mb-1 text-muted">Дата запрета (включительно)</span>
        <input v-model="edit.date" type="date" :min="MIN_DATE" :max="today()" class="input input-bordered w-full sm:w-60" />
      </label>
      <p v-if="dateIsFuture" class="text-sm text-error mt-2">Дату запрета в будущем ставить нельзя</p>
      <p v-else-if="dateTooEarly" class="text-sm text-error mt-2">Слишком ранняя дата запрета — проверьте год</p>
      <p v-else-if="edit.date" class="text-sm mt-3">
        Закупки, движения и списания объекта по {{ formatDate(edit.date) }} включительно станут только для чтения.
        <template v-if="edit.current && edit.date < edit.current">
          Документы с {{ formatDate(nextDay(edit.date)) }} по {{ formatDate(edit.current) }} снова можно будет менять.
        </template>
      </p>
      <div v-if="edit.error" class="mt-3 alert alert-error text-sm py-2">{{ edit.error }}</div>
      <div class="flex flex-wrap justify-between gap-2 mt-5">
        <button v-if="edit.current" data-test="clear-lock" class="btn btn-sm btn-ghost text-warning" :disabled="busy"
                @click="save(null)">
          Снять дату запрета
        </button>
        <span v-else />
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm" :disabled="busy" @click="edit.open = false">Отмена</button>
          <button data-test="save-lock" class="btn btn-primary btn-sm" :disabled="busy || !edit.date || dateIsFuture || dateTooEarly"
                  @click="save(edit.date)">
            <span v-if="busy" class="loading loading-spinner loading-xs"></span>
            Сохранить
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useArchivePeriodsStore, type ArchivePeriod, type LockDateRow } from '@/stores/archivePeriods'
import { usePermissions } from '@/composables/usePermissions'
import { useUiStore } from '@/stores/ui'
import { parseApiError } from '@/utils/errorHandler'
import { formatDate, formatDateTime, formatMonthYear, todayLocal } from '@/utils/formatters'
import Modal from '@/components/Modal.vue'
import ListHeader from '@/components/ListHeader.vue'

const store = useArchivePeriodsStore()
const ui = useUiStore()
const { can } = usePermissions()
// как у сервера (SetLockDateView, close/reopen): stock.edit_all
const canEdit = computed(() => can('stock', 'edit_all'))

const busy = ref(false)
const today = (): string => todayLocal()
const edit = reactive({ open: false, object: 0, name: '', current: null as string | null, date: '', error: null as string | null })
// строки 'YYYY-MM-DD' сравниваются как даты; сервер проверяет то же (400)
const dateIsFuture = computed(() => !!edit.date && edit.date > today())
// F-1111 (ревью): опечатка в годе («0026») — сервер отвечает 400; не даём отправить
const MIN_DATE = '2020-01-01'
const dateTooEarly = computed(() => !!edit.date && edit.date < MIN_DATE)

function insideLockDate(p: ArchivePeriod): boolean {
  const lock = store.lockDates.find(r => r.object === p.object)?.closed_until
  return !!lock && String(p.month).slice(0, 10) <= lock
}

function nextDay(d: string): string {
  const [y, m, dd] = d.split('-').map(Number)
  const n = new Date(Date.UTC(y, m - 1, dd + 1))
  return n.toISOString().slice(0, 10)
}

function openEdit(r: LockDateRow) {
  Object.assign(edit, { open: true, object: r.object, name: r.object_name, current: r.closed_until,
    date: r.closed_until || today(), error: null })
}

async function save(date: string | null) {
  busy.value = true
  edit.error = null
  try {
    await store.setLockDate(edit.object, date)
    edit.open = false
    ui.toast({ type: 'success', text: date ? `Дата запрета — ${formatDate(date)}` : 'Дата запрета снята' })
  } catch (e) {
    edit.error = parseApiError(e).detail || 'Не удалось сохранить'
  } finally {
    busy.value = false
  }
}

async function reopenLegacy(p: ArchivePeriod) {
  if (!confirm(`Открыть ${formatMonthYear(p.month)} по объекту «${p.object_name}»?`)) { return }
  try {
    await store.reopen(p.object, String(p.month).slice(0, 7))
  } catch (e) {
    ui.toast({ type: 'error', text: parseApiError(e).detail || 'Не удалось открыть месяц' })
  }
}

async function refresh() {
  try {
    await store.fetchList()
  } catch {
    ui.toast({ type: 'error', text: 'Не удалось обновить список' })
  }
}

onMounted(() => { store.fetchList().catch(() => {}) })
</script>
