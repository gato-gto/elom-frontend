import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { parseApiError } from '@/utils/errorHandler'

/** D-2: строка корзины — закупка или списание, отправленные в корзину (GET /trash/). */
export interface TrashRow {
  kind: 'purchases' | 'writeoffs'
  id: number
  title: string
  object_name: string
  date: string            // дата документа, YYYY-MM-DD
  amount: string | null   // сумма закупки «10 UZS»; у списания — null
  deleted_at: string
  deleted_by_name: string | null
  purge_after: string     // после этого момента таймер удалит окончательно
  can_restore: boolean
  can_purge: boolean      // только мастер-аккаунт
}

export const useTrashStore = defineStore('trash', () => {
  const items = ref<TrashRow[]>([])
  const retentionDays = ref(7)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchList() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get(endpoints.trash.list)
      items.value = Array.isArray(data?.items) ? data.items : []
      if (typeof data?.retention_days === 'number') { retentionDays.value = data.retention_days }
    } catch (e) {
      error.value = parseApiError(e).detail || 'Не удалось загрузить корзину'
      throw e
    } finally {
      loading.value = false
    }
  }

  function drop(row: TrashRow) {
    items.value = items.value.filter(r => !(r.kind === row.kind && r.id === row.id))
  }

  /** Вернуть из корзины; возвращает текст сервера («Закупка P0001 восстановлена.»). */
  async function restore(row: TrashRow): Promise<string> {
    const { data } = await api.post(endpoints.trash.restore(row.kind, row.id))
    drop(row)
    return typeof data?.detail === 'string' ? data.detail : 'Восстановлено'
  }

  /** Удалить окончательно (только мастер-аккаунт). */
  async function purge(row: TrashRow): Promise<void> {
    await api.delete(endpoints.trash.purge(row.kind, row.id))
    drop(row)
  }

  return { items, retentionDays, loading, error, fetchList, restore, purge }
})
