import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWriteOffsStore, getByObject, getByMaterial, getByResponsible, getByStage } from '../writeOffs'
import api from '@/api/client'

// Mock API client
vi.mock('@/api/client')

describe('WriteOffs Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const store = useWriteOffsStore
    
    expect(store.items).toEqual([])
    expect(store.current).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.pagination.count).toBe(0)
  })

  it('fetches writeoffs list successfully', async () => {
    const store = useWriteOffsStore
    const mockResponse = {
      data: {
        count: 2,
        results: [
          {
            id: 1,
            object: 1,
            material: 1,
            quantity: '10.00',
            responsible: 1,
            stage: 'acceptance',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            object: 2,
            material: 2,
            quantity: '20.00',
            responsible: 2,
            stage: 'request',
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z'
          }
        ]
      }
    }
    
    vi.mocked(api.get).mockResolvedValue(mockResponse)
    
    await store.fetchList()
    
    expect(store.items).toHaveLength(2)
    expect(store.items[0].quantity).toBe('10.00')
    expect(store.pagination.count).toBe(2)
    expect(api.get).toHaveBeenCalled()
  })

  it('filters writeoffs by object correctly', () => {
    const store = useWriteOffsStore
    store.items = [
      { id: 1, object: 1, quantity: '10.00' } as any,
      { id: 2, object: 2, quantity: '20.00' } as any,
      { id: 3, object: 1, quantity: '15.00' } as any
    ]
    
    const result = getByObject(1)
    
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(1)
    expect(result[1].id).toBe(3)
  })

  it('filters writeoffs by material correctly', () => {
    const store = useWriteOffsStore
    store.items = [
      { id: 1, material: 1, quantity: '10.00' } as any,
      { id: 2, material: 2, quantity: '20.00' } as any,
      { id: 3, material: 1, quantity: '15.00' } as any
    ]
    
    const result = getByMaterial(1)
    
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(1)
    expect(result[1].id).toBe(3)
  })

  it('filters writeoffs by responsible correctly', () => {
    const store = useWriteOffsStore
    store.items = [
      { id: 1, responsible: 1, quantity: '10.00' } as any,
      { id: 2, responsible: 2, quantity: '20.00' } as any,
      { id: 3, responsible: 1, quantity: '15.00' } as any
    ]
    
    const result = getByResponsible(1)
    
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(1)
    expect(result[1].id).toBe(3)
  })

  it('filters writeoffs by stage correctly', () => {
    const store = useWriteOffsStore
    store.items = [
      { id: 1, stage: 'acceptance', quantity: '10.00' } as any,
      { id: 2, stage: 'request', quantity: '20.00' } as any,
      { id: 3, stage: 'acceptance', quantity: '15.00' } as any
    ]
    
    const result = getByStage('acceptance')
    
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(1)
    expect(result[1].id).toBe(3)
  })

  it('creates writeoff successfully', async () => {
    const store = useWriteOffsStore
    const writeoffData = {
      object: 1,
      material: 1,
      quantity: '10.00',
      responsible: 1,
      stage: 'acceptance'
    }
    
    const mockResponse = {
      data: {
        id: 1,
        ...writeoffData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
    
    vi.mocked(api.post).mockResolvedValue(mockResponse)
    
    const result = await store.create(writeoffData)
    
    expect(result).toEqual(mockResponse.data)
    expect(api.post).toHaveBeenCalled()
    const callArgs = vi.mocked(api.post).mock.calls[0][0]
    expect(callArgs).toContain('/writeoffs/')
  })

  it('handles API errors correctly', async () => {
    const store = useWriteOffsStore
    const errorResponse = {
      response: {
        data: {
          detail: 'Writeoff not found'
        }
      }
    }
    
    vi.mocked(api.get).mockRejectedValue(errorResponse)
    
    try {
      await store.fetchOne(999)
    } catch (error) {
      expect(error).toBe(errorResponse)
    }
    
    expect(store.current).toBeNull()
  })
})


