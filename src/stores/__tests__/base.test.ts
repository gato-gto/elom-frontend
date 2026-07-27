/**
 * Тесты для базового store (createBaseStore)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createBaseStore } from '@/stores/base'
import api from '@/api/client'

// Мокаем API клиент
vi.mock('@/api/client')
const mockedApi = vi.mocked(api)

// Мокаем composables
vi.mock('@/composables/useNotifications', () => ({
  useNotifications: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn()
  })
}))

// Keep the REAL parseApiError (base store relies on it to populate `error`),
// only stub the async toast side-effect.
vi.mock('@/utils/errorHandler', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/errorHandler')>()
  return { ...actual, handleApiErrorAsync: vi.fn() }
})

// Типы для тестирования
interface TestEntity {
  id: number
  name: string
  description?: string
}

interface TestRequest {
  name: string
  description?: string
}

describe('Base Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Configuration', () => {
    it('should create store with default configuration', () => {
      const useTestStore = createBaseStore<TestEntity, TestRequest>({
        endpoint: { list: '/api/test/', one: (id) => `/api/test/${id}/` },
        entityName: 'test',
        entityNamePlural: 'tests'
      })

      const store = useTestStore()

      expect(store.items).toEqual([])
      expect(store.current).toBe(null)
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
      expect(store.pagination.page).toBe(1)
      expect(store.pagination.pageSize).toBe(20)
    })

    it('should create store with custom configuration', () => {
      const useTestStore = createBaseStore<TestEntity, TestRequest>({
        endpoint: { list: '/api/test/', one: (id) => `/api/test/${id}/` },
        entityName: 'test',
        entityNamePlural: 'tests',
        defaultOrdering: '-created_at',
        defaultPageSize: 50
      })

      const store = useTestStore()

      expect(store.filters.ordering).toBe('-created_at')
      expect(store.pagination.pageSize).toBe(50)
    })
  })

  describe('State Management', () => {
    it('should manage loading state', async () => {
      const useTestStore = createBaseStore<TestEntity, TestRequest>({
        endpoint: { list: '/api/test/', one: (id) => `/api/test/${id}/` },
        entityName: 'test',
        entityNamePlural: 'tests'
      })

      const store = useTestStore()

      // Mock delayed API response
      mockedApi.get.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => resolve({ data: { count: 0, results: [] } }), 100)
        })
      )

      const fetchPromise = store.fetchList()
      
      // Should be loading
      expect(store.loading).toBe(true)
      
      await fetchPromise
      
      // Should not be loading anymore
      expect(store.loading).toBe(false)
    })

    // F-637 (H12): конкурентные fetchList — устаревший (медленный) ответ НЕ перезаписывает новый.
    it('a slow stale fetchList does NOT overwrite a newer one', async () => {
      const useTestStore = createBaseStore<TestEntity, TestRequest>({
        endpoint: { list: '/api/test/', one: (id) => `/api/test/${id}/` },
        entityName: 'test',
        entityNamePlural: 'tests'
      })
      const store = useTestStore()

      let resolveOld!: (v: any) => void
      let resolveNew!: (v: any) => void
      mockedApi.get
        .mockReturnValueOnce(new Promise(r => { resolveOld = r }) as any)   // 1-й (старый) вызов
        .mockReturnValueOnce(new Promise(r => { resolveNew = r }) as any)   // 2-й (новый) вызов

      const pOld = store.fetchList()   // gen 1
      const pNew = store.fetchList()   // gen 2 (новее)

      resolveNew({ data: { count: 1, results: [{ id: 2, name: 'new' }] } })   // новый приходит ПЕРВЫМ
      await pNew
      resolveOld({ data: { count: 1, results: [{ id: 1, name: 'stale' }] } }) // старый — вторым (устарел)
      await pOld

      expect(store.items.map((i: any) => i.id)).toEqual([2])   // новый не перезатёрт устаревшим
    })

    it('should handle error state', async () => {
      const useTestStore = createBaseStore<TestEntity, TestRequest>({
        endpoint: { list: '/api/test/', one: (id) => `/api/test/${id}/` },
        entityName: 'test',
        entityNamePlural: 'tests'
      })

      const store = useTestStore()
      const error = { response: { data: { detail: 'Test error' } } }

      mockedApi.get.mockRejectedValueOnce(error)

      await expect(store.fetchList()).rejects.toBeTruthy()
      
      expect(store.error).toBe('Test error')
      expect(store.loading).toBe(false)
    })

    it('should clear error', () => {
      const useTestStore = createBaseStore<TestEntity, TestRequest>({
        endpoint: { list: '/api/test/', one: (id) => `/api/test/${id}/` },
        entityName: 'test',
        entityNamePlural: 'tests'
      })

      const store = useTestStore()
      store.error = 'Some error'

      store.clearError()

      expect(store.error).toBe(null)
    })
  })

  describe('CRUD Operations', () => {
    let useTestStore: ReturnType<typeof createBaseStore<TestEntity, TestRequest>>

    beforeEach(() => {
      useTestStore = createBaseStore<TestEntity, TestRequest>({
        endpoint: { 
          list: '/api/test/', 
          one: (id) => `/api/test/${id}/`,
          create: '/api/test/',
          update: (id) => `/api/test/${id}/`,
          delete: (id) => `/api/test/${id}/`
        },
        entityName: 'test',
        entityNamePlural: 'tests'
      })
    })

    it('should fetch list', async () => {
      const store = useTestStore()
      const mockData = {
        count: 2,
        results: [
          { id: 1, name: 'Test 1', description: 'Description 1' },
          { id: 2, name: 'Test 2', description: 'Description 2' }
        ],
        next: null,
        previous: null
      }

      mockedApi.get.mockResolvedValueOnce({ data: mockData })

      const result = await store.fetchList()

      expect(result).toEqual(mockData.results)
      expect(store.items).toEqual(mockData.results)
      expect(store.pagination.count).toBe(2)
      // Store always sends a deterministic default ordering for stable pagination.
      expect(mockedApi.get).toHaveBeenCalledWith('/api/test/?page=1&page_size=20&ordering=id')
    })

    it('should fetch one item', async () => {
      const store = useTestStore()
      const mockItem = { id: 1, name: 'Test Item', description: 'Test Description' }

      mockedApi.get.mockResolvedValueOnce({ data: mockItem })

      const result = await store.fetchOne(1)

      expect(result).toEqual(mockItem)
      expect(store.current).toEqual(mockItem)
      expect(mockedApi.get).toHaveBeenCalledWith('/api/test/1/')
    })

    it('should create item', async () => {
      const store = useTestStore()
      const newItem = { name: 'New Test', description: 'New Description' }
      const createdItem = { id: 3, ...newItem }

      mockedApi.post.mockResolvedValueOnce({ data: createdItem })

      const result = await store.create(newItem)

      expect(result).toEqual(createdItem)
      expect(store.items).toContainEqual(createdItem)
      expect(store.pagination.count).toBe(1)
      expect(mockedApi.post).toHaveBeenCalledWith('/api/test/', newItem)
    })

    it('should update item', async () => {
      const store = useTestStore()
      const originalItem = { id: 1, name: 'Original', description: 'Original Description' }
      const updates = { name: 'Updated' }
      const updatedItem = { ...originalItem, ...updates }

      store.items = [originalItem]
      store.current = originalItem

      mockedApi.patch.mockResolvedValueOnce({ data: updatedItem })

      const result = await store.update(1, updates)

      expect(result).toEqual(updatedItem)
      expect(store.items[0]).toEqual(updatedItem)
      expect(store.current).toEqual(updatedItem)
      expect(mockedApi.patch).toHaveBeenCalledWith('/api/test/1/', updates)
    })

    it('should remove item', async () => {
      const store = useTestStore()
      const item = { id: 1, name: 'Test', description: 'Test Description' }

      store.items = [item]
      store.current = item
      store.pagination.count = 1

      mockedApi.delete.mockResolvedValueOnce({})

      await store.remove(1)

      expect(store.items).toEqual([])
      expect(store.current).toBe(null)
      expect(store.pagination.count).toBe(0)
      expect(mockedApi.delete).toHaveBeenCalledWith('/api/test/1/')
    })
  })

  describe('Filtering and Search', () => {
    let useTestStore: ReturnType<typeof createBaseStore<TestEntity, TestRequest>>

    beforeEach(() => {
      useTestStore = createBaseStore<TestEntity, TestRequest>({
        endpoint: { list: '/api/test/', one: (id) => `/api/test/${id}/` },
        entityName: 'test',
        entityNamePlural: 'tests'
      })
    })

    it('should set filters', async () => {
      const store = useTestStore()
      const newFilters = { search: 'test search' }

      mockedApi.get.mockResolvedValueOnce({ 
        data: { count: 0, results: [], next: null, previous: null }
      })

      await store.setFilters(newFilters)

      expect(store.filters.search).toBe('test search')
      expect(store.pagination.page).toBe(1)
      // URLSearchParams encodes spaces as '+'; the default ordering is always appended.
      expect(mockedApi.get).toHaveBeenCalledWith(
        '/api/test/?page=1&page_size=20&search=test+search&ordering=id'
      )
    })

    it('should reset filters', async () => {
      const store = useTestStore()
      
      // Set some filters first
      store.filters.search = 'test'
      
      mockedApi.get.mockResolvedValueOnce({ 
        data: { count: 0, results: [], next: null, previous: null }
      })

      await store.resetFilters()

      expect(store.filters.search).toBe('')
      expect(store.pagination.page).toBe(1)
    })

    it('should search with query', async () => {
      const store = useTestStore()
      const searchQuery = 'test query'
      const mockResults = [
        { id: 1, name: 'Test Result', description: 'Matching result' }
      ]

      mockedApi.get.mockResolvedValueOnce({ 
        data: { results: mockResults }
      })

      const result = await store.search(searchQuery)

      expect(result).toEqual(mockResults)
      // search() builds its own URL (encodeURIComponent => %20) and caps results at page_size=15.
      expect(mockedApi.get).toHaveBeenCalledWith(
        '/api/test/?search=test%20query&page_size=15'
      )
    })

    it('should not search with short query', async () => {
      const store = useTestStore()

      const result = await store.search('t')

      expect(result).toEqual([])
      expect(mockedApi.get).not.toHaveBeenCalled()
    })
  })

  describe('Pagination', () => {
    let useTestStore: ReturnType<typeof createBaseStore<TestEntity, TestRequest>>

    beforeEach(() => {
      useTestStore = createBaseStore<TestEntity, TestRequest>({
        endpoint: { list: '/api/test/', one: (id) => `/api/test/${id}/` },
        entityName: 'test',
        entityNamePlural: 'tests'
      })
    })

    it('should set page', async () => {
      const store = useTestStore()

      mockedApi.get.mockResolvedValueOnce({ 
        data: { count: 0, results: [], next: null, previous: null }
      })

      await store.setPage(3)

      expect(store.pagination.page).toBe(3)
      expect(mockedApi.get).toHaveBeenCalledWith('/api/test/?page=3&page_size=20&ordering=id')
    })

    it('should set page size', async () => {
      const store = useTestStore()

      mockedApi.get.mockResolvedValueOnce({ 
        data: { count: 0, results: [], next: null, previous: null }
      })

      await store.setPageSize(50)

      expect(store.pagination.pageSize).toBe(50)
      expect(store.pagination.page).toBe(1) // Reset to first page
      expect(mockedApi.get).toHaveBeenCalledWith('/api/test/?page=1&page_size=50&ordering=id')
    })
  })

  describe('Getters', () => {
    it('should get item by id', () => {
      const useTestStore = createBaseStore<TestEntity, TestRequest>({
        endpoint: { list: '/api/test/', one: (id) => `/api/test/${id}/` },
        entityName: 'test',
        entityNamePlural: 'tests'
      })

      const store = useTestStore()
      const item = { id: 1, name: 'Test Item', description: 'Test Description' }
      
      store.items = [item]

      expect(store.getById(1)).toEqual(item)
      expect(store.getById(999)).toBeUndefined()
    })

    it('should check if item exists', () => {
      const useTestStore = createBaseStore<TestEntity, TestRequest>({
        endpoint: { list: '/api/test/', one: (id) => `/api/test/${id}/` },
        entityName: 'test',
        entityNamePlural: 'tests'
      })

      const store = useTestStore()
      store.items = [{ id: 1, name: 'Test Item' }]

      expect(store.exists(1)).toBe(true)
      expect(store.exists(999)).toBe(false)
    })

    it('should get select options', () => {
      const useTestStore = createBaseStore<TestEntity, TestRequest>({
        endpoint: { list: '/api/test/', one: (id) => `/api/test/${id}/` },
        entityName: 'test',
        entityNamePlural: 'tests'
      })

      const store = useTestStore()
      store.items = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]

      const options = store.selectOptions
      expect(options).toHaveLength(2)
      expect(options[0]).toEqual({ value: 1, label: 'Item 1' })
      expect(options[1]).toEqual({ value: 2, label: 'Item 2' })
    })
  })

  describe('Current Item Management', () => {
    it('should set current item', () => {
      const useTestStore = createBaseStore<TestEntity, TestRequest>({
        endpoint: { list: '/api/test/', one: (id) => `/api/test/${id}/` },
        entityName: 'test',
        entityNamePlural: 'tests'
      })

      const store = useTestStore()
      const item = { id: 1, name: 'Current Item', description: 'Current Description' }

      store.setCurrent(item)

      expect(store.current).toEqual(item)
    })

    it('should clear current item', () => {
      const useTestStore = createBaseStore<TestEntity, TestRequest>({
        endpoint: { list: '/api/test/', one: (id) => `/api/test/${id}/` },
        entityName: 'test',
        entityNamePlural: 'tests'
      })

      const store = useTestStore()
      store.current = { id: 1, name: 'Current Item' }

      store.setCurrent(null)

      expect(store.current).toBe(null)
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors with detail message', async () => {
      const useTestStore = createBaseStore<TestEntity, TestRequest>({
        endpoint: { list: '/api/test/', one: (id) => `/api/test/${id}/` },
        entityName: 'test',
        entityNamePlural: 'tests'
      })

      const store = useTestStore()
      const error = { 
        response: { 
          data: { detail: 'Specific error message' } 
        } 
      }

      mockedApi.get.mockRejectedValueOnce(error)

      await expect(store.fetchList()).rejects.toBeTruthy()
      
      expect(store.error).toBe('Specific error message')
    })

    it('should handle API errors without detail message', async () => {
      const useTestStore = createBaseStore<TestEntity, TestRequest>({
        endpoint: { list: '/api/test/', one: (id) => `/api/test/${id}/` },
        entityName: 'test',
        entityNamePlural: 'tests'
      })

      const store = useTestStore()
      const error = new Error('Generic error')

      mockedApi.get.mockRejectedValueOnce(error)

      await expect(store.fetchList()).rejects.toBeTruthy()

      // FE-4: сетевая ошибка без response → локализованный текст, а НЕ утечка JS Error.message.
      expect(store.error).toBe('Ошибка сети. Проверьте подключение к интернету')
      expect(store.error).not.toBe('Generic error')
    })
  })
})



