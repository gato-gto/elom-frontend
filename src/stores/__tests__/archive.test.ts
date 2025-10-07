/**
 * Тесты для store архива
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useArchiveStore } from '../archive'
import type { ArchivePeriod, ArchivePeriodRequest } from '@/api/types/archive'

// Мокаем fetch
global.fetch = vi.fn()

describe('Archive Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('closePeriod', () => {
    it('должен успешно закрыть период', async () => {
      const store = useArchiveStore()
      const mockResponse = {
        id: 1,
        month: '2024-01-01',
        object: 1,
        object_name: 'Test Object',
        closed_at: '2024-02-01T10:00:00Z',
        closed_by: 1,
        closed_by_name: 'Test User',
        is_closed: true
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const request: ArchivePeriodRequest = {
        month: '2024-01',
        object: 1
      }

      const result = await store.closePeriod(request)

      expect(fetch).toHaveBeenCalledWith('/api/v1/archive/periods/close/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer null'
        },
        body: JSON.stringify(request)
      })

      expect(result).toEqual(mockResponse)
    })

    it('должен обработать ошибку при закрытии периода', async () => {
      const store = useArchiveStore()
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ detail: 'Period already closed' })
      } as Response)

      const request: ArchivePeriodRequest = {
        month: '2024-01',
        object: 1
      }

      await expect(store.closePeriod(request)).rejects.toThrow('Period already closed')
      expect(store.error).toBe('Period already closed')
    })
  })

  describe('reopenPeriod', () => {
    it('должен успешно открыть период', async () => {
      const store = useArchiveStore()
      const mockResponse = {
        message: 'Period reopened successfully'
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const request = {
        month: '2024-01',
        object: 1
      }

      const result = await store.reopenPeriod(request)

      expect(fetch).toHaveBeenCalledWith('/api/v1/archive/periods/reopen/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer null'
        },
        body: JSON.stringify(request)
      })

      expect(result).toEqual(mockResponse)
    })
  })

  describe('canClosePeriod', () => {
    it('должен вернуть true если период не закрыт', () => {
      const store = useArchiveStore()
      store.items = [
        {
          id: 1,
          month: '2024-01-01',
          object: 1,
          object_name: 'Test Object',
          closed_at: '2024-02-01T10:00:00Z',
          closed_by: 1,
          closed_by_name: 'Test User',
          is_closed: true
        }
      ]

      const canClose = store.canClosePeriod('2024-02', 1)
      expect(canClose).toBe(true)
    })

    it('должен вернуть false если период уже закрыт', () => {
      const store = useArchiveStore()
      store.items = [
        {
          id: 1,
          month: '2024-01-01',
          object: 1,
          object_name: 'Test Object',
          closed_at: '2024-02-01T10:00:00Z',
          closed_by: 1,
          closed_by_name: 'Test User',
          is_closed: true
        }
      ]

      const canClose = store.canClosePeriod('2024-01', 1)
      expect(canClose).toBe(false)
    })
  })

  describe('getArchiveStats', () => {
    it('должен вернуть корректную статистику', () => {
      const store = useArchiveStore()
      const currentYear = new Date().getFullYear()
      
      store.items = [
        {
          id: 1,
          month: `${currentYear}-01-01`,
          object: 1,
          object_name: 'Test Object 1',
          closed_at: '2024-02-01T10:00:00Z',
          closed_by: 1,
          closed_by_name: 'Test User',
          is_closed: true
        },
        {
          id: 2,
          month: `${currentYear}-02-01`,
          object: 2,
          object_name: 'Test Object 2',
          closed_at: '2024-03-01T10:00:00Z',
          closed_by: 1,
          closed_by_name: 'Test User',
          is_closed: true
        },
        {
          id: 3,
          month: '2023-12-01',
          object: 1,
          object_name: 'Test Object 1',
          closed_at: '2024-01-01T10:00:00Z',
          closed_by: 1,
          closed_by_name: 'Test User',
          is_closed: true
        }
      ]

      const stats = store.getArchiveStats()

      expect(stats.total).toBe(3)
      expect(stats.thisYear).toBe(2)
      expect(stats.lastPeriod).toEqual(store.items[0])
    })

    it('должен вернуть пустую статистику для пустого списка', () => {
      const store = useArchiveStore()
      store.items = []

      const stats = store.getArchiveStats()

      expect(stats.total).toBe(0)
      expect(stats.thisYear).toBe(0)
      expect(stats.lastPeriod).toBeNull()
    })
  })
})
