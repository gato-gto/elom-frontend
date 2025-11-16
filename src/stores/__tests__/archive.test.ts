/**
 * Тесты для store архива
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useArchiveStore, closePeriod, reopenPeriod, canClosePeriod, getArchiveStats } from '../archive'
import type { ArchivePeriod, ArchivePeriodRequest } from '@/api/types/archive'
import api from '@/api/client'

// Мокаем API client
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }
}))

describe('Archive Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('closePeriod', () => {
    it('должен успешно закрыть период', async () => {
      const store = useArchiveStore
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

      vi.mocked(api.post).mockResolvedValueOnce({
        data: mockResponse
      })
      vi.mocked(api.get).mockResolvedValueOnce({ data: { count: 0, results: [] } })

      const request: ArchivePeriodRequest = {
        month: '2024-01',
        object: 1
      }

      const result = await closePeriod(request)

      // Проверяем, что был вызван правильный endpoint (может быть полный URL)
      expect(api.post).toHaveBeenCalled()
      const callArgs = vi.mocked(api.post).mock.calls[0]
      expect(callArgs[0]).toContain('/archive/periods/close/')
      expect(callArgs[1]).toEqual(request)

      expect(result).toEqual(mockResponse)
    })

    it('должен обработать ошибку при закрытии периода', async () => {
      const store = useArchiveStore
      
      const errorResponse = {
        response: {
          data: {
            detail: 'Period already closed'
          }
        }
      }
      vi.mocked(api.post).mockRejectedValueOnce(errorResponse)
      vi.mocked(api.get).mockResolvedValueOnce({ data: { count: 0, results: [] } })

      const request: ArchivePeriodRequest = {
        month: '2024-01',
        object: 1
      }

      await expect(closePeriod(request)).rejects.toBe(errorResponse)
      expect(store.error).toBe('Period already closed')
    })
  })

  describe('reopenPeriod', () => {
    it('должен успешно открыть период', async () => {
      const store = useArchiveStore
      const mockResponse = {
        message: 'Period reopened successfully'
      }

      vi.mocked(api.post).mockResolvedValueOnce({
        data: mockResponse
      })
      vi.mocked(api.get).mockResolvedValueOnce({ data: { count: 0, results: [] } })

      const request = {
        month: '2024-01',
        object: 1
      }

      const result = await reopenPeriod(request)

      // Проверяем, что был вызван правильный endpoint (может быть полный URL)
      expect(api.post).toHaveBeenCalled()
      const callArgs = vi.mocked(api.post).mock.calls[0]
      expect(callArgs[0]).toContain('/archive/periods/reopen/')
      expect(callArgs[1]).toEqual(request)

      expect(result).toEqual(mockResponse)
    })
  })

  describe('canClosePeriod', () => {
    it('должен вернуть true если период не закрыт', () => {
      const store = useArchiveStore
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

      const canClose = canClosePeriod('2024-02', 1)
      expect(canClose).toBe(true)
    })

    it('должен вернуть false если период уже закрыт', () => {
      const store = useArchiveStore
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

      const canClose = canClosePeriod('2024-01', 1)
      expect(canClose).toBe(false)
    })
  })

  describe('getArchiveStats', () => {
    it('должен вернуть корректную статистику', () => {
      const store = useArchiveStore
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

      const stats = getArchiveStats()

      expect(stats.total).toBe(3)
      expect(stats.thisYear).toBe(2)
      expect(stats.lastPeriod).toEqual(store.items[0])
    })

    it('должен вернуть пустую статистику для пустого списка', () => {
      const store = useArchiveStore
      store.items = []

      const stats = getArchiveStats()

      expect(stats.total).toBe(0)
      expect(stats.thisYear).toBe(0)
      expect(stats.lastPeriod).toBeNull()
    })
  })
})
