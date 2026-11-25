// F-1106 (ответ владельца 7): «дата запрета» на объект. Пред-проверка форм (isPeriodClosed) учитывает её:
// всё по дату включительно закрыто; помесячные закрытия (наследие) — тоже.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn().mockResolvedValue({ data: {} }) }))
vi.mock('@/api/client', () => ({ default: { get, post } }))

import { useArchivePeriodsStore } from '@/stores/archivePeriods'
import { endpoints } from '@/api/endpoints'

describe('archivePeriods · дата запрета (F-1106)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    get.mockReset(); post.mockClear()
    get.mockImplementation((url: string) => Promise.resolve({
      data: url === endpoints.archivePeriods.lockDates
        ? [{ object: 7, object_name: 'A', object_is_active: true, closed_until: '2026-03-31',
             closed_until_by_name: 'Анна', closed_until_at: '2026-04-01T10:00:00+05:00' },
           { object: 8, object_name: 'B', object_is_active: true, closed_until: null,
             closed_until_by_name: null, closed_until_at: null }]
        : { results: [{ id: 1, month: '2026-01-01', object: 8, object_name: 'B', closed_at: '', closed_by: null,
                        closed_by_name: null, is_closed: true }], count: 1 },
    }))
  })

  it('по дату запрета включительно — закрыто, позже — открыто', async () => {
    const s = useArchivePeriodsStore()
    await s.fetchList()
    expect([s.isPeriodClosed(7, '2026-03-31'), s.isPeriodClosed(7, '2026-04-01'), s.isPeriodClosed(7, '2025-12-01')])
      .toEqual([true, false, true])
  })

  it('объект без даты запрета — открыт; помесячно закрытый месяц — закрыт', async () => {
    const s = useArchivePeriodsStore()
    await s.fetchList()
    expect([s.isPeriodClosed(8, '2026-03-10'), s.isPeriodClosed(8, '2026-01-20')]).toEqual([false, true])
  })

  it('setLockDate шлёт объект и дату (null — снять) и перечитывает список', async () => {
    const s = useArchivePeriodsStore()
    await s.setLockDate(7, '2026-02-28')
    await s.setLockDate(7, null)
    expect(post.mock.calls.map(c => c[1])).toEqual([{ object: 7, date: '2026-02-28' }, { object: 7, date: null }])
    expect(post.mock.calls[0][0]).toBe(endpoints.archivePeriods.setLockDate)
    expect(get.mock.calls.filter(c => c[0] === endpoints.archivePeriods.lockDates).length).toBe(2)
  })
})

describe('archivePeriods · сбой дат запрета не ломает загрузку (F-1111)', () => {
  beforeEach(() => { setActivePinia(createPinia()); get.mockReset() })

  it('lock-dates отвечает ошибкой — месяцы загружены, ошибки нет', async () => {
    get.mockImplementation((url: string) => (url === endpoints.archivePeriods.lockDates
      ? Promise.reject(new Error('404'))
      : Promise.resolve({ data: { results: [{ id: 1, month: '2026-01-01', object: 8, object_name: 'B', closed_at: '',
          closed_by: null, closed_by_name: null, is_closed: true }], count: 1 } })))
    const s = useArchivePeriodsStore()
    await expect(s.fetchList()).resolves.toBeUndefined()
    expect(s.isPeriodClosed(8, '2026-01-20')).toBe(true)
  })
})
