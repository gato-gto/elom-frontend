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
      const { data } = await api.get(endpoints.archivePeriods.list)
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

  return { items, loading, error, fetchList, close, reopen }
})
