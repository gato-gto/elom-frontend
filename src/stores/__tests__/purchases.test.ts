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
    expect(api.get).toHaveBeenCalledWith('/api/v1/purchases/')
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
    expect(api.post).toHaveBeenCalledWith('/api/v1/purchases/', purchaseData)
  })

  it('uploads photo successfully', async () => {
    const store = usePurchasesStore
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const mockResponse = {
      data: {
        id: 1,
        photo_url: 'https://example.com/photo.jpg',
        photo_type: 'instructions'
      }
    }
    
    vi.mocked(api.post).mockResolvedValue(mockResponse)
    
    const result = await store.uploadPhoto(1, { file: mockFile, photo_type: 'instructions' })
    
    expect(result).toBe(true)
    expect(api.post).toHaveBeenCalledWith('/api/v1/purchases/1/photos/upload/', expect.any(FormData))
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
    
    await store.fetchOne(999)
    
    expect(store.error).toBe('Purchase not found')
    expect(store.current).toBeNull()
  })

  it('sets filters correctly', () => {
    const store = usePurchasesStore
    
    store.setFilters({
      search: 'test',
      status: 'new'
    })
    
    expect(store.filters.search).toBe('test')
    expect(store.filters.status).toBe('new')
  })

  it('resets filters correctly', () => {
    const store = usePurchasesStore
    store.setFilters({ search: 'test' })
    
    store.resetFilters()
    
    expect(store.filters.search).toBe('')
    expect(store.filters.status).toBe('')
  })
})

