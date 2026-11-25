import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { warnIfNearPageSize } from '@/stores/base'
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

/** F-1106 (ответ владельца 7): дата запрета объекта — всё по неё включительно только для чтения. */
export interface LockDateRow {
  object: number
  object_name: string
  object_is_active: boolean
  closed_until: string | null   // YYYY-MM-DD
  closed_until_by_name: string | null
  closed_until_at: string | null
}

/**
 * Архивные периоды (закрытые месяцы×объекты). Закрытие/открытие делают реальную
 * архивацию Purchase+StockSnapshot+WriteOff на бэкенде (D-012) — тут только вызовы.
 */
export const useArchivePeriodsStore = defineStore('archivePeriods', () => {
  const items = ref<ArchivePeriod[]>([])
  const lockDates = ref<LockDateRow[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchList() {
    loading.value = true
    error.value = null
    try {
      // F-895: page_size=1000 — иначе список закрытых периодов резался дефолтом (~20) и пред-
      // предупреждение о закрытом периоде (PurchaseForm/WriteOffForm/WriteOffByBalance) молча
      // пропускало периоды за пределами первой страницы (A F-718 этот стор оставил без page_size).
      // F-1028 (S): page_size через params + F-510-алярм усечения (хардкод-строка обходила warnIfNearPageSize).
      const PAGE = 1000
      // F-1106: даты запрета объектов — рядом с помесячными периодами (наследие), обе для пред-проверки форм.
      // F-1111 (ревью): сбой дат запрета не роняет загрузку формы — пред-проверка просто без них (сервер всё равно
      // проверит), список месяцев грузится как раньше.
      const lockReq = api.get(endpoints.archivePeriods.lockDates)
        .then(r => (Array.isArray(r.data) ? r.data : []))
        .catch(() => lockDates.value)
      const { data } = await api.get(endpoints.archivePeriods.list, { params: { page_size: PAGE } })
      lockDates.value = await lockReq
      items.value = Array.isArray(data) ? data : (data?.results ?? [])
      if (!Array.isArray(data)) { warnIfNearPageSize(endpoints.archivePeriods.list, Number(data?.count ?? items.value.length), PAGE, Boolean(data?.next)) }
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

  // F-1106: поставить/перенести/снять (null) дату запрета объекта; сервер сам переставит архивные флаги
  async function setLockDate(object: number, date: string | null) {
    const { data } = await api.post(endpoints.archivePeriods.setLockDate, { object, date })
    await fetchList()
    return data
  }

  // F-640: закрыт ли период (object, месяц указанной даты)? Зеркалит серверный гард
  // ArchivePeriod.is_closed (D-012/F-619) — для ПРЕД-предупреждения в формах списания/закупки,
  // чтобы пользователь видел «период закрыт» ДО submit, а не только по BE-400.
  function isPeriodClosed(objectId: number | null | undefined, date: string | null | undefined): boolean {
    if (!objectId || !date) { return false }
    const day = String(date).slice(0, 10)
    // F-1106: дата запрета — строки 'YYYY-MM-DD' сравниваются как даты; включительно (как сервер)
    const lock = lockDates.value.find(r => r.object === Number(objectId))?.closed_until
    if (lock && day <= lock) { return true }
    const month = day.slice(0, 7) + '-01'   // 'YYYY-MM-DD…' → 'YYYY-MM-01'
    return items.value.some(p => p.object === Number(objectId) && p.month === month && p.is_closed === true)
  }

  return { items, lockDates, loading, error, fetchList, close, reopen, setLockDate, isPeriodClosed }
})
