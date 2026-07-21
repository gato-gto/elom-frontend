import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEmployeesStore, setPassword } from '../employees'
import api from '@/api/client'

// Mock API client
vi.mock('@/api/client')

describe('Employees Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const store = useEmployeesStore()
    
    expect(store.items).toEqual([])
    expect(store.current).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.pagination.count).toBe(0)
  })

  it('fetches employees list successfully', async () => {
    const store = useEmployeesStore()
    const mockResponse = {
      data: {
        count: 2,
        results: [
          {
            id: 1,
            username: 'user1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone: '+998901234567',
            role: 'brigadier',
            is_active: true,
            assigned_object_ids: [1, 2],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            username: 'user2',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane@example.com',
            phone: '+998901234568',
            role: 'coordinator',
            is_active: true,
            assigned_object_ids: [1],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ]
      }
    }
    
    vi.mocked(api.get).mockResolvedValue(mockResponse)
    
    await store.fetchList()
    
    expect(store.items).toHaveLength(2)
    expect(store.items[0].username).toBe('user1')
    expect(store.pagination.count).toBe(2)
    // Проверяем, что был вызван правильный endpoint (может быть полный URL)
    expect(api.get).toHaveBeenCalled()
    const callArgs = vi.mocked(api.get).mock.calls[0][0]
    expect(callArgs).toContain('/employees/')
  })

  it('creates employee successfully', async () => {
    const store = useEmployeesStore()
    const employeeData = {
      username: 'newuser',
      first_name: 'New',
      last_name: 'User',
      email: 'new@example.com',
      phone: '+998901234569',
      role: 'brigadier',
      is_active: true,
      assigned_object_ids: [1]
    }
    
    const mockResponse = {
      data: {
        id: 3,
        ...employeeData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
    
    vi.mocked(api.post).mockResolvedValue(mockResponse)
    
    const result = await store.create(employeeData)
    
    expect(result).toEqual(mockResponse.data)
    // Проверяем, что был вызван правильный endpoint
    expect(api.post).toHaveBeenCalled()
    const callArgs = vi.mocked(api.post).mock.calls[0][0]
    expect(callArgs).toContain('/employees/')
  })

  it('updates employee successfully', async () => {
    const store = useEmployeesStore()
    const updateData = {
      first_name: 'Updated',
      is_active: false
    }
    
    const mockResponse = {
      data: {
        id: 1,
        username: 'user1',
        first_name: 'Updated',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+998901234567',
        role: 'brigadier',
        is_active: false,
        assigned_object_ids: [1, 2],
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
    expect(callArgs).toContain('/employees/1/')
  })

  it('deletes employee successfully', async () => {
    const store = useEmployeesStore()
    
    vi.mocked(api.delete).mockResolvedValue({ data: null })
    
    await store.delete(1)
    
    // Проверяем, что был вызван правильный endpoint
    expect(api.delete).toHaveBeenCalled()
    const callArgs = vi.mocked(api.delete).mock.calls[0][0]
    expect(callArgs).toContain('/employees/1/')
  })

  it('sets password successfully', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } })
    
    const result = await setPassword(1, 'newpassword')
    
    expect(result).toBe(true)
    // Проверяем, что был вызван правильный endpoint
    expect(api.post).toHaveBeenCalled()
    const callArgs = vi.mocked(api.post).mock.calls[0][0]
    expect(callArgs).toContain('/employees/1/set_password/')
  })

  it('handles API errors correctly', async () => {
    const store = useEmployeesStore()
    const errorResponse = {
      response: {
        status: 404,
        data: {
          detail: 'Employee not found'
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
    const store = useEmployeesStore()()
    vi.mocked(api.get).mockResolvedValue({ data: { count: 0, results: [] } })
    
    await store.setFilters({
      search: 'test',
      role: 'brigadier'
    })
    
    expect(store.filters.search).toBe('test')
    expect(store.filters.role).toBe('brigadier')
  })

  it('resets filters correctly', async () => {
    const store = useEmployeesStore()()
    vi.mocked(api.get).mockResolvedValue({ data: { count: 0, results: [] } })
    
    await store.setFilters({ search: 'test', role: 'brigadier' })
    
    await store.resetFilters()
    
    expect(store.filters.search).toBe('')
    expect(store.filters.role).toBe('')
  })
})

