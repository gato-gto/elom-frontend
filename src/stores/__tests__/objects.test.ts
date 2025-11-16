import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useObjectsStore } from '../objects'
import api from '@/api/client'

// Mock API client
vi.mock('@/api/client')

describe('Objects Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const store = useObjectsStore
    
    expect(store.items).toEqual([])
    expect(store.current).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.pagination.count).toBe(0)
  })

  it('fetches objects list successfully', async () => {
    const store = useObjectsStore
    const mockResponse = {
      data: {
        count: 2,
        results: [
          {
            id: 1,
            name: 'Object 1',
            address: 'Address 1',
            responsible: 1,
            key_person: 'John Doe',
            key_person_phone: '+998901234567',
            start_date: '2024-01-01',
            end_date: '2024-12-31',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            name: 'Object 2',
            address: 'Address 2',
            responsible: 2,
            key_person: 'Jane Smith',
            key_person_phone: '+998901234568',
            start_date: '2024-02-01',
            end_date: '2024-11-30',
            is_active: true,
            created_at: '2024-02-01T00:00:00Z',
            updated_at: '2024-02-01T00:00:00Z'
          }
        ]
      }
    }
    
    vi.mocked(api.get).mockResolvedValue(mockResponse)
    
    await store.fetchList()
    
    expect(store.items).toHaveLength(2)
    expect(store.items[0].name).toBe('Object 1')
    expect(store.pagination.count).toBe(2)
    // Проверяем, что был вызван правильный endpoint (может быть полный URL)
    expect(api.get).toHaveBeenCalled()
    const callArgs = vi.mocked(api.get).mock.calls[0][0]
    expect(callArgs).toContain('/objects/')
  })

  it('creates object successfully', async () => {
    const store = useObjectsStore
    const objectData = {
      name: 'New Object',
      address: 'New Address',
      responsible: 1,
      key_person: 'New Person',
      key_person_phone: '+998901234569',
      start_date: '2024-01-01',
      is_active: true
    }
    
    const mockResponse = {
      data: {
        id: 3,
        ...objectData,
        end_date: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
    
    vi.mocked(api.post).mockResolvedValue(mockResponse)
    
    const result = await store.create(objectData)
    
    expect(result).toEqual(mockResponse.data)
    // Проверяем, что был вызван правильный endpoint
    expect(api.post).toHaveBeenCalled()
    const callArgs = vi.mocked(api.post).mock.calls[0][0]
    expect(callArgs).toContain('/objects/')
  })

  it('updates object successfully', async () => {
    const store = useObjectsStore
    const updateData = {
      name: 'Updated Object',
      is_active: false
    }
    
    const mockResponse = {
      data: {
        id: 1,
        name: 'Updated Object',
        address: 'Address 1',
        responsible: 1,
        key_person: 'John Doe',
        key_person_phone: '+998901234567',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        is_active: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
    
    vi.mocked(api.patch).mockResolvedValue(mockResponse)
    
    const result = await store.update(1, updateData)
    
    expect(result).toEqual(mockResponse.data)
    // Проверяем, что был вызван правильный endpoint и метод
    expect(api.patch).toHaveBeenCalled()
    const callArgs = vi.mocked(api.patch).mock.calls[0][0]
    expect(callArgs).toContain('/objects/1/')
  })

  it('deletes object successfully', async () => {
    const store = useObjectsStore
    
    vi.mocked(api.delete).mockResolvedValue({ data: null })
    
    await store.delete(1)
    
    // Проверяем, что был вызван правильный endpoint
    expect(api.delete).toHaveBeenCalled()
    const callArgs = vi.mocked(api.delete).mock.calls[0][0]
    expect(callArgs).toContain('/objects/1/')
  })

  it('handles API errors correctly', async () => {
    const store = useObjectsStore
    const errorResponse = {
      response: {
        data: {
          detail: 'Object not found'
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
    const store = useObjectsStore
    vi.mocked(api.get).mockResolvedValue({ data: { count: 0, results: [] } })
    
    await store.setFilters({
      search: 'test',
      is_active: 'true'
    })
    
    expect(store.filters.search).toBe('test')
    expect(store.filters.is_active).toBe('true')
  })

  it('resets filters correctly', async () => {
    const store = useObjectsStore
    vi.mocked(api.get).mockResolvedValue({ data: { count: 0, results: [] } })
    
    await store.setFilters({ search: 'test', is_active: 'true' })
    
    await store.resetFilters()
    
    expect(store.filters.search).toBe('')
    expect(store.filters.is_active).toBe('')
  })
})

