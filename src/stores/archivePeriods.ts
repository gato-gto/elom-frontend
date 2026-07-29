import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { parseApiError } from '@/utils/errorHandler'

export interface ArchivePeriod {
  id: number
  month: string            // YYYY-MM-01
  object: number
  object_name: string
  closed_at: string
  closed_by: number | null
  closed_by_name: string | null
  is_closed: boolean
}

/**
 * Архивные периоды (закрытые месяцы×объекты). Закрытие/открытие делают реальную
 * архивацию Purchase+StockSnapshot+WriteOff на бэкенде (D-012) — тут только вызовы.
 */
export const useArchivePeriodsStore = defineStore('archivePeriods', () => {
  const items = ref<ArchivePeriod[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchList() {
    loading.value = true
    error.value = null
    try {
      // F-895: page_size=1000 — иначе список закрытых периодов резался дефолтом (~20) и пред-
      // предупреждение о закрытом периоде (PurchaseForm/WriteOffForm/WriteOffByBalance) молча
      // пропускало периоды за пределами первой страницы (A F-718 этот стор оставил без page_size).
      const { data } = await api.get(endpoints.archivePeriods.list + '?page_size=1000')
      items.value = Array.isArray(data) ? data : (data?.results ?? [])
    } catch (e: any) {
      // EH-FE-9 (F-552): единый parseApiError вместо сырого data.detail.
      error.value = parseApiError(e).detail
      throw e
    } finally {
      loading.value = false
    }
  }

  async function close(object: number, month: string) {
    const { data } = await api.post(endpoints.archivePeriods.close, { object, month })
    await fetchList()
    return data
  }

  async function reopen(object: number, month: string) {
    await api.post(endpoints.archivePeriods.reopen, { object, month })
    await fetchList()
  }

  // F-640: закрыт ли период (object, месяц указанной даты)? Зеркалит серверный гард
  // ArchivePeriod.is_closed (D-012/F-619) — для ПРЕД-предупреждения в формах списания/закупки,
  // чтобы пользователь видел «период закрыт» ДО submit, а не только по BE-400.
  function isPeriodClosed(objectId: number | null | undefined, date: string | null | undefined): boolean {
    if (!objectId || !date) { return false }
    const month = String(date).slice(0, 7) + '-01'   // 'YYYY-MM-DD…' → 'YYYY-MM-01'
    return items.value.some(p => p.object === Number(objectId) && p.month === month && p.is_closed === true)
  }

  return { items, loading, error, fetchList, close, reopen, isPeriodClosed }
})
