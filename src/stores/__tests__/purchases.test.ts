import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePurchasesStore } from '../purchases'
import api from '@/api/client'

// Mock API client
vi.mock('@/api/client')

describe('Purchases Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const store = usePurchasesStore
    
    expect(store.items).toEqual([])
    expect(store.current).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.pagination.count).toBe(0)
  })

  it('fetches purchases list successfully', async () => {
    const store = usePurchasesStore
    const mockResponse = {
      data: {
        count: 2,
        results: [
          {
            id: 1,
            purchase_number: 'P0001',
            date: '2024-01-01',
            object: 1,
            supplier: 1,
            responsible: 1,
            status: 'new',
            total_amount: '1000.00',
            currency: 'UZS',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            purchase_number: 'P0002',
            date: '2024-01-02',
            object: 2,
            supplier: 2,
            responsible: 2,
            status: 'completed',
            total_amount: '2000.00',
            currency: 'UZS',
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z'
          }
        ]
      }
    }
    
    vi.mocked(api.get).mockResolvedValue(mockResponse)
    
    await store.fetchList()
    
    expect(store.items).toHaveLength(2)
    expect(store.items[0].purchase_number).toBe('P0001')
    expect(store.pagination.count).toBe(2)
    // Проверяем, что был вызван правильный endpoint (может быть полный URL)
    expect(api.get).toHaveBeenCalled()
    const callArgs = vi.mocked(api.get).mock.calls[0][0]
    expect(callArgs).toContain('/purchases/')
  })

  it('creates purchase successfully', async () => {
    const store = usePurchasesStore
    const purchaseData = {
      date: '2024-01-01',
      object: 1,
      supplier: 1,
      responsible: 1,
      status: 'new',
      items: []
    }
    
    const mockResponse = {
      data: {
        id: 3,
        purchase_number: 'P0003',
        ...purchaseData,
        total_amount: '0.00',
        currency: 'UZS',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
    
    vi.mocked(api.post).mockResolvedValue(mockResponse)
    
    const result = await store.create(purchaseData)
    
    expect(result).toEqual(mockResponse.data)
    // Проверяем, что был вызван правильный endpoint
    expect(api.post).toHaveBeenCalled()
    const callArgs = vi.mocked(api.post).mock.calls[0][0]
    expect(callArgs).toContain('/purchases/')
  })

  it('uploads photo successfully', async () => {
    const store = usePurchasesStore
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const mockPurchaseResponse = {
      data: {
        id: 1,
        purchase_number: 'P0001',
        date: '2024-01-01',
        object: 1,
        supplier: 1,
        responsible: 1,
        status: 'new',
        total_amount: '1000.00',
        currency: 'UZS',
        photos: []
      }
    }
    
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } })
    vi.mocked(api.get).mockResolvedValue(mockPurchaseResponse)
    
    const { uploadPhoto } = await import('../purchases')
    const result = await uploadPhoto(1, { photo: mockFile, photo_type: 'instructions' })
    
    expect(result).toBe(true)
    // Проверяем, что был вызван правильный endpoint
    expect(api.post).toHaveBeenCalled()
    const callArgs = vi.mocked(api.post).mock.calls[0][0]
    expect(callArgs).toContain('/purchases/1/photos/upload/')
  })

  it('handles API errors correctly', async () => {
    const store = usePurchasesStore
    const errorResponse = {
      response: {
        data: {
          detail: 'Purchase not found'
        }
      }
    }
    
    vi.mocked(api.get).mockRejectedValue(errorResponse)
    
    try {
      await store.fetchOne(999)
    } catch (error) {
      // Ожидаем, что ошибка будет выброшена
      expect(error).toBe(errorResponse)
    }
    
    // Проверяем, что текущий элемент не установлен
    expect(store.current).toBeNull()
  })

  it('sets filters correctly', async () => {
    const store = usePurchasesStore
    vi.mocked(api.get).mockResolvedValue({ data: { count: 0, results: [] } })
    
    await store.setFilters({
      search: 'test',
      status: 'new'
    })
    
    expect(store.filters.search).toBe('test')
    expect(store.filters.status).toBe('new')
  })

  it('resets filters correctly', async () => {
    const store = usePurchasesStore
    vi.mocked(api.get).mockResolvedValue({ data: { count: 0, results: [] } })
    
    await store.setFilters({ search: 'test', status: 'new' })
    
    await store.resetFilters()
    
    expect(store.filters.search).toBe('')
    expect(store.filters.status).toBe('')
  })
})

