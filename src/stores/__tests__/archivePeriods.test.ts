import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useArchivePeriodsStore } from '../archivePeriods'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'

vi.mock('@/api/client')

describe('ArchivePeriods Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchList GETs /archive/periods/ and stores paginated results', async () => {
    const store = useArchivePeriodsStore()
    vi.mocked(api.get).mockResolvedValue({
      data: { results: [{ id: 1, month: '2026-01-01', object: 1, object_name: 'O', closed_at: '', closed_by: 2, closed_by_name: 'A', is_closed: true }] },
    } as any)
    await store.fetchList()
    expect(api.get).toHaveBeenCalledWith(endpoints.archivePeriods.list, { params: { page_size: 1000 } })  // F-1028: params, не строка (F-510-алярм)
    expect(store.items).toHaveLength(1)
    expect(store.loading).toBe(false)
  })

  it('fetchList tolerates a bare-array response', async () => {
    const store = useArchivePeriodsStore()
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: 9, month: '2026-03-01', object: 1, object_name: 'X' }] } as any)
    await store.fetchList()
    expect(store.items).toHaveLength(1)
  })

  it('close POSTs {object, month} to the close endpoint and refreshes', async () => {
    const store = useArchivePeriodsStore()
    vi.mocked(api.post).mockResolvedValue({ data: { id: 5 } } as any)
    vi.mocked(api.get).mockResolvedValue({ data: { results: [] } } as any)
    await store.close(3, '2026-02')
    expect(api.post).toHaveBeenCalledWith(endpoints.archivePeriods.close, { object: 3, month: '2026-02' })
    expect(api.get).toHaveBeenCalledWith(endpoints.archivePeriods.list, { params: { page_size: 1000 } })  // F-1028: params, не строка (F-510-алярм) // refresh after close
  })

  it('reopen POSTs {object, month} to the reopen endpoint and refreshes', async () => {
    const store = useArchivePeriodsStore()
    vi.mocked(api.post).mockResolvedValue({ data: {} } as any)
    vi.mocked(api.get).mockResolvedValue({ data: { results: [] } } as any)
    await store.reopen(3, '2026-02')
    expect(api.post).toHaveBeenCalledWith(endpoints.archivePeriods.reopen, { object: 3, month: '2026-02' })
    expect(api.get).toHaveBeenCalled()
  })

  it('surfaces an error message on fetch failure', async () => {
    const store = useArchivePeriodsStore()
    vi.mocked(api.get).mockRejectedValue({ response: { data: { detail: 'boom' } } })
    await expect(store.fetchList()).rejects.toBeTruthy()
    expect(store.error).toBe('boom')
  })

  // F-640 (#28): пред-проверка закрытого периода для форм списания/закупки.
  it('isPeriodClosed matches (object, month-of-date) only for CLOSED periods', () => {
    const store = useArchivePeriodsStore()
    store.items = [
      { id: 1, month: '2026-08-01', object: 471, object_name: 'Баку', closed_at: '', closed_by: null, closed_by_name: null, is_closed: true },
      { id: 2, month: '2026-09-01', object: 471, object_name: 'Баку', closed_at: '', closed_by: null, closed_by_name: null, is_closed: false }, // переоткрыт
    ] as any
    expect(store.isPeriodClosed(471, '2026-08-15')).toBe(true)   // закрытый месяц того же объекта
    expect(store.isPeriodClosed(471, '2026-09-10')).toBe(false)  // переоткрытый → не блокируем
    expect(store.isPeriodClosed(999, '2026-08-15')).toBe(false)  // другой объект
    expect(store.isPeriodClosed(null, '2026-08-15')).toBe(false) // пустые аргументы
    expect(store.isPeriodClosed(471, '')).toBe(false)
  })
})
