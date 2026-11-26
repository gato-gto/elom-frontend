<template>
  <div class="list-container space-y-6">
    <!-- D-2 (корзина, 26.11): закупки и списания, отправленные в корзину. Видит и восстанавливает руководство;
         окончательно удаляет мастер-аккаунт или таймер через N дней (сервер). -->
    <ListHeader
      title="Корзина"
      :subtitle="`Закупки и списания, отправленные в корзину. В списках, остатках и отчётах их нет. Через ${store.retentionDays} дней они удаляются окончательно.`"
      :show-create="false"
    />

    <section class="rounded-lg border border-base-300 overflow-hidden">
      <div class="px-4 py-3 border-b border-base-300 flex items-center justify-between">
        <h2 class="text-sm font-medium">Документы в корзине</h2>
        <button class="btn btn-ghost btn-sm" :disabled="store.loading" @click="refresh">Обновить</button>
      </div>
      <div v-if="store.error" class="px-4 py-3 text-sm text-error border-b border-base-300">{{ store.error }}</div>
      <div v-if="store.loading && store.items.length === 0" class="p-6 text-center text-sm text-subtle">Загрузка…</div>
      <div v-else-if="store.items.length === 0" data-test="trash-empty" class="p-8 text-center text-sm text-subtle">
        Корзина пуста. Закупки и списания, отправленные в корзину, хранятся здесь {{ store.retentionDays }} дней.
      </div>
      <!-- телефон — карточки (MOBILE_UI_SPEC п.6) -->
      <ul v-else-if="isMobile" class="divide-y divide-base-300" data-test="trash-cards">
        <li v-for="r in store.items" :key="`${r.kind}-${r.id}`" class="px-4 py-3 space-y-1">
          <div class="font-medium break-words">{{ r.title }}</div>
          <div class="text-sm break-words">{{ r.object_name }}, {{ formatDate(r.date) }}<template v-if="r.amount">, {{ r.amount }}</template></div>
          <div class="text-xs text-muted break-words">
            Отправил{{ r.deleted_by_name ? ` ${r.deleted_by_name}` : '' }} {{ formatDateTime(r.deleted_at) }}.
            Удалится {{ formatDate(r.purge_after) }}.
          </div>
          <div class="flex flex-wrap gap-2 pt-1">
            <button v-if="r.can_restore" data-test="restore-card" class="btn btn-sm btn-outline flex-1"
                    :disabled="busy" @click="restore(r)">Восстановить</button>
            <button v-if="r.can_purge" data-test="purge-card" class="btn btn-sm btn-ghost text-error flex-1"
                    :disabled="busy" @click="purge(r)">Удалить окончательно</button>
          </div>
        </li>
      </ul>
      <div v-else class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Документ</th>
              <th>Объект</th>
              <th>Дата</th>
              <th>Кто и когда отправил</th>
              <th>Удалится</th>
              <th class="text-right no-print">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in store.items" :key="`${r.kind}-${r.id}`" data-test="trash-row">
              <!-- F-565: даты — font-mono (не переносятся); названия — блок с мин. шириной, чтобы длинное название
                   документа не сжимало соседние колонки до разрыва слов («Медцент|р 01») -->
              <td>
                <div class="min-w-[14rem] break-words">{{ r.title }}</div>
                <div v-if="r.amount" class="text-xs text-muted">{{ r.amount }}</div>
              </td>
              <td><div class="min-w-[8rem] break-words">{{ r.object_name }}</div></td>
              <td class="font-mono">{{ formatDate(r.date) }}</td>
              <td class="text-muted"><div class="min-w-[9rem]">{{ r.deleted_by_name || '—' }}, {{ formatDateTime(r.deleted_at) }}</div></td>
              <td class="font-mono">{{ formatDate(r.purge_after) }}</td>
              <td class="text-right no-print whitespace-nowrap">
                <button v-if="r.can_restore" data-test="restore" class="btn btn-sm btn-outline" :disabled="busy"
                        @click="restore(r)">Восстановить</button>
                <button v-if="r.can_purge" data-test="purge" class="btn btn-sm btn-ghost text-error ml-1" :disabled="busy"
                        @click="purge(r)">Удалить окончательно</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTrashStore, type TrashRow } from '@/stores/trash'
import { useUiStore } from '@/stores/ui'
import { parseApiError } from '@/utils/errorHandler'
import { formatDate, formatDateTime } from '@/utils/formatters'
import ListHeader from '@/components/ListHeader.vue'
import { useResponsiveTable } from '@/composables/useResponsiveTable'

const store = useTrashStore()
const { isMobile } = useResponsiveTable()
const ui = useUiStore()
const busy = ref(false)

async function restore(r: TrashRow) {
  busy.value = true
  try {
    ui.toast({ type: 'success', text: await store.restore(r) })
  } catch (e) {
    // «не хватает остатка», «период закрыт», «объект в архиве», «уже восстановлено» — текст сервера
    ui.toast({ type: 'error', text: parseApiError(e).detail || 'Не удалось восстановить' })
    await store.fetchList().catch(() => {})
  } finally {
    busy.value = false
  }
}

async function purge(r: TrashRow) {
  if (!confirm(`Удалить окончательно: ${r.title}? Вернуть будет нельзя.`)) { return }
  busy.value = true
  try {
    await store.purge(r)
    ui.toast({ type: 'success', text: 'Удалено окончательно' })
  } catch (e) {
    ui.toast({ type: 'error', text: parseApiError(e).detail || 'Не удалось удалить' })
    await store.fetchList().catch(() => {})
  } finally {
    busy.value = false
  }
}

async function refresh() {
  await store.fetchList().catch(() => {})
}

onMounted(refresh)
</script>
