import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMaterialsStore, uploadPhoto } from '../materials'
import api from '@/api/client'
// import { endpoints } from '@/api/endpoints' // Не используется

// Mock API client and endpoints
vi.mock('@/api/client')
vi.mock('@/api/endpoints', () => ({
  API_PREFIX: '/api/v1',
  buildQuery: (params?: Record<string, any>) => {
    if (!params) {return ''}
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        q.append(k, String(v))
      }
    })
    return q.toString() ? `?${q.toString()}` : ''
  },
  endpoints: {
    materials: {
      list: '/api/v1/materials/',
      one: (id: number) => `/api/v1/materials/${id}/`,
      uploadPhoto: (id: number) => `/api/v1/materials/${id}/upload-photo/`,
      byObject: '/api/v1/materials/by-object/',
    }
  }
}))

describe('Materials Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const store = useMaterialsStore()
    
    expect(store.items).toEqual([])
    expect(store.current).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.pagination.count).toBe(0)
  })

  it('fetches materials list successfully', async () => {
    const store = useMaterialsStore()
    const mockResponse = {
      data: {
        count: 2,
        results: [
          {
            id: 1,
            name: 'Material 1',
            sku: 'MAT001',
            category_name: 'Category 1',
            default_unit_code: 'kg',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            name: 'Material 2',
            sku: 'MAT002',
            category_name: 'Category 2',
            default_unit_code: 'm',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ]
      }
    }
    
    vi.mocked(api.get).mockResolvedValue(mockResponse)
    
    await store.fetchList()
    
    expect(store.items).toHaveLength(2)
    expect(store.items[0].name).toBe('Material 1')
    expect(store.pagination.count).toBe(2)
    expect(api.get).toHaveBeenCalled()
    const callArgs = vi.mocked(api.get).mock.calls[0]
    expect(callArgs[0]).toContain('/api/v1/materials/')
  })

  it('fetches single material successfully', async () => {
    const store = useMaterialsStore()
    const mockMaterial = {
      id: 1,
      name: 'Test Material',
      sku: 'TEST001',
      category_name: 'Test Category',
      default_unit_code: 'kg',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
    
    vi.mocked(api.get).mockResolvedValue({ data: mockMaterial })
    
    await store.fetchOne(1)
    
    expect(store.current).toEqual(mockMaterial)
    expect(api.get).toHaveBeenCalledWith('/api/v1/materials/1/')
  })

  it('creates material successfully', async () => {
    const store = useMaterialsStore()
    const materialData = {
      name: 'New Material',
      sku: 'NEW001',
      category: 1,
      default_unit: 1,
      is_active: true
    }
    
    const mockResponse = {
      data: {
        id: 3,
        ...materialData,
        category_name: 'Category 1',
        default_unit_code: 'kg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
    
    vi.mocked(api.post).mockResolvedValue(mockResponse)
    
    const result = await store.create(materialData)
    
    expect(result).toEqual(mockResponse.data)
    expect(api.post).toHaveBeenCalledWith('/api/v1/materials/', materialData)
  })

  it('updates material successfully', async () => {
    const store = useMaterialsStore()
    const updateData = {
      name: 'Updated Material',
      is_active: false
    }
    
    const mockResponse = {
      data: {
        id: 1,
        name: 'Updated Material',
        sku: 'MAT001',
        category_name: 'Category 1',
        default_unit_code: 'kg',
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
    const callArgs = vi.mocked(api.patch).mock.calls[0]
    expect(callArgs[0]).toContain('/materials/1/')
  })

  it('deletes material successfully', async () => {
    const store = useMaterialsStore()
    
    vi.mocked(api.delete).mockResolvedValue({ data: null })
    
    await store.delete(1)
    
    expect(api.delete).toHaveBeenCalledWith('/api/v1/materials/1/')
  })

  it('uploads photo successfully', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const mockResponse = {
      data: {
        photo_url: 'https://example.com/photo.jpg'
      }
    }
    
    vi.mocked(api.post).mockResolvedValue(mockResponse)
    
    const result = await uploadPhoto(1, mockFile)
    
    expect(result).toBe('https://example.com/photo.jpg')
    // Проверяем, что был вызван правильный endpoint
    expect(api.post).toHaveBeenCalled()
    const callArgs = vi.mocked(api.post).mock.calls[0]
    expect(callArgs[0]).toContain('/materials/1/upload-photo/')
  })

  it('handles API errors correctly', async () => {
    const store = useMaterialsStore()
    const errorResponse = {
      response: {
        data: {
          detail: 'Material not found'
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
    const store = useMaterialsStore()
    vi.mocked(api.get).mockResolvedValue({ data: { count: 0, results: [] } })
    
    await store.setFilters({
      search: 'test',
      category: '1'
    })
    
    expect(store.filters.search).toBe('test')
    expect(store.filters.category).toBe('1')
  })

  it('resets filters correctly', async () => {
    const store = useMaterialsStore()
    vi.mocked(api.get).mockResolvedValue({ data: { count: 0, results: [] } })
    await store.setFilters({ search: 'test' })
    
    await store.resetFilters()
    
    expect(store.filters.search).toBe('')
    expect(store.filters.category).toBe('')
  })
})
