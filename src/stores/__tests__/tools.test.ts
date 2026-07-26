/**
 * Тесты для store инструментов
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useToolsStore } from '@/stores/tools'
import { useUiStore } from '@/stores/ui'
import { endpoints } from '@/api/endpoints'
import api from '@/api/client'

// Мокаем API клиент
vi.mock('@/api/client')
const mockedApi = vi.mocked(api)

// EH-FE-1 (F-545): store больше НЕ использует useNotifications (второй, не отрисованный
// канал) — успех идёт в единый ui.toast (ToastCenter), ошибку показывает handleApiErrorAsync.

// Keep the REAL parseApiError (the store uses it to populate `error`); stub the toast.
vi.mock('@/utils/errorHandler', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/errorHandler')>()
  return { ...actual, handleApiErrorAsync: vi.fn() }
})

describe('Tools Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('State', () => {
    it('should have initial state', () => {
      const store = useToolsStore()
      
      expect(store.items).toEqual([])
      expect(store.current).toBe(null)
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
      expect(store.categories).toEqual([])
      expect(store.pagination.count).toBe(0)
      expect(store.pagination.page).toBe(1)
      expect(store.pagination.pageSize).toBe(20)
    })

    it('should have initial filters', () => {
      const store = useToolsStore()
      
      expect(store.filters).toEqual({
        search: '',
        ordering: '-created_at',
        condition: '',
        in_stock: '',
        current_holder: '',
        current_object: '',
        category: ''
      })
    })
  })

  describe('Getters', () => {
    it('should get item by id', () => {
      const store = useToolsStore()
      const tool = {
        id: 1,
        inventory_number: 'TOOL001',
        name: 'Test Tool',
        category: 'Test Category',
        brand: 'Test Brand',
        condition: 'good' as const,
        is_in_stock: true,
        current_holder: null,
        current_object: null,
        status_display: 'На складе'
      }
      
      store.items = [tool]
      
      expect(store.getById(1)).toEqual(tool)
      expect(store.getById(999)).toBeUndefined()
    })

    it('should check if item exists', () => {
      const store = useToolsStore()
      store.items = [
        { 
          id: 1, 
          inventory_number: 'TOOL001',
          name: 'Tool 1',
          condition: 'good' as const,
          is_in_stock: true
        }
      ]
      
      expect(store.exists(1)).toBe(true)
      expect(store.exists(999)).toBe(false)
    })

    it('should get select options', () => {
      const store = useToolsStore()
      store.items = [
        { 
          id: 1, 
          inventory_number: 'TOOL001',
          name: 'Tool 1',
          condition: 'good' as const,
          is_in_stock: true
        },
        { 
          id: 2, 
          inventory_number: 'TOOL002',
          name: 'Tool 2',
          condition: 'good' as const,
          is_in_stock: false
        }
      ]
      
      const options = store.selectOptions
      expect(options).toHaveLength(2)
      expect(options[0]).toEqual({ value: 1, label: 'TOOL001 - Tool 1' })
      expect(options[1]).toEqual({ value: 2, label: 'TOOL002 - Tool 2' })
    })

    it('should get in stock items', () => {
      const store = useToolsStore()
      store.items = [
        { 
          id: 1, 
          inventory_number: 'TOOL001',
          name: 'Tool 1',
          condition: 'good' as const,
          is_in_stock: true,
          current_holder: null
        },
        { 
          id: 2, 
          inventory_number: 'TOOL002',
          name: 'Tool 2',
          condition: 'good' as const,
          is_in_stock: false,
          current_holder: 1
        }
      ]
      
      const inStockItems = store.inStockItems
      expect(inStockItems).toHaveLength(1)
      expect(inStockItems[0].id).toBe(1)
    })

    it('should get issued items', () => {
      const store = useToolsStore()
      store.items = [
        { 
          id: 1, 
          inventory_number: 'TOOL001',
          name: 'Tool 1',
          condition: 'good' as const,
          is_in_stock: true,
          current_holder: null
        },
        { 
          id: 2, 
          inventory_number: 'TOOL002',
          name: 'Tool 2',
          condition: 'good' as const,
          is_in_stock: false,
          current_holder: 1
        }
      ]
      
      const issuedItems = store.issuedItems
      expect(issuedItems).toHaveLength(1)
      expect(issuedItems[0].id).toBe(2)
    })
  })

  describe('Actions', () => {
    it('should fetch list successfully', async () => {
      const store = useToolsStore()
      const mockData = {
        count: 2,
        results: [
          { 
            id: 1, 
            inventory_number: 'TOOL001',
            name: 'Tool 1',
            condition: 'good' as const,
            is_in_stock: true
          },
          { 
            id: 2, 
            inventory_number: 'TOOL002',
            name: 'Tool 2',
            condition: 'good' as const,
            is_in_stock: false
          }
        ],
        next: null,
        previous: null
      }
      
      mockedApi.get.mockResolvedValueOnce({ data: mockData })
      
      const result = await store.fetchList()
      
      expect(store.items).toHaveLength(2)
      expect(store.items[0].inventory_number).toBe('TOOL001')
      expect(store.pagination.count).toBe(2)
      expect(store.loading).toBe(false)
      expect(result).toEqual(mockData.results)
    })

    it('should handle fetch list error', async () => {
      const store = useToolsStore()
      const error = new Error('API Error')
      
      mockedApi.get.mockRejectedValueOnce(error)
      
      await expect(store.fetchList()).rejects.toThrow('API Error')
      expect(store.loading).toBe(false)
      // FE-4: локализованный текст сетевой ошибки, не утечка Error.message
      expect(store.error).toBe('Ошибка сети. Проверьте подключение к интернету')
    })

    it('should fetch one tool', async () => {
      const store = useToolsStore()
      const mockTool = {
        id: 1,
        inventory_number: 'TOOL001',
        name: 'Test Tool',
        condition: 'good' as const,
        is_in_stock: true
      }
      
      mockedApi.get.mockResolvedValueOnce({ data: mockTool })
      
      const result = await store.fetchOne(1)
      
      expect(result).toEqual(mockTool)
      expect(store.current).toEqual(mockTool)
      expect(mockedApi.get).toHaveBeenCalledWith(endpoints.tools.one(1))
    })

    it('should create tool', async () => {
      const store = useToolsStore()
      const newTool = {
        inventory_number: 'TOOL003',
        name: 'New Tool',
        category: 'New Category',
        brand: 'New Brand'
      }
      const createdTool = {
        id: 3,
        ...newTool,
        condition: 'good' as const,
        is_in_stock: true
      }
      
      mockedApi.post.mockResolvedValueOnce({ data: createdTool })
      
      const result = await store.create(newTool)
      
      expect(result).toEqual(createdTool)
      expect(store.items).toContainEqual(createdTool)
      expect(store.pagination.count).toBe(1)
      expect(mockedApi.post).toHaveBeenCalledWith(endpoints.tools.list, newTool)
    })

    it('F-557: create does NOT toast from the store (component owns success/error toast)', async () => {
      const store = useToolsStore()
      const ui = useUiStore()
      mockedApi.post.mockResolvedValueOnce({ data: { id: 9, inventory_number: 'T9', name: 'T', condition: 'good', is_in_stock: true } })

      await store.create({ inventory_number: 'T9', name: 'T', category: 'C', brand: 'B' } as any)

      // F-545 regression fix: страница (ToolForm/List) показывает «Инструмент сохранён»,
      // стор НЕ тостит — иначе два стека тостов.
      expect(ui.toasts.length).toBe(0)
    })

    it('F-557: create failure sets store.error and rethrows, no store toast', async () => {
      const store = useToolsStore()
      const ui = useUiStore()
      mockedApi.post.mockRejectedValueOnce({ response: { status: 400, data: { detail: 'bad' } } })

      await expect(store.create({ inventory_number: 'T9', name: 'T' } as any)).rejects.toBeTruthy()

      expect(ui.toasts.length).toBe(0)      // тост покажет компонент (handleFormError)
      expect(store.error).toBe('bad')
    })

    it('should update tool', async () => {
      const store = useToolsStore()
      const originalTool = {
        id: 1,
        inventory_number: 'TOOL001',
        name: 'Original Tool',
        category: 'Original Category',
        brand: 'Original Brand',
        condition: 'good' as const,
        is_in_stock: true
      }
      const updates = {
        name: 'Updated Tool',
        brand: 'Updated Brand'
      }
      const updatedTool = { ...originalTool, ...updates }
      
      store.items = [originalTool]
      store.current = originalTool
      
      mockedApi.patch.mockResolvedValueOnce({ data: updatedTool })
      
      const result = await store.update(1, updates)
      
      expect(result).toEqual(updatedTool)
      expect(store.items[0]).toEqual(updatedTool)
      expect(store.current).toEqual(updatedTool)
      expect(mockedApi.patch).toHaveBeenCalledWith(endpoints.tools.one(1), updates)
    })

    it('should remove tool', async () => {
      const store = useToolsStore()
      const tool = {
        id: 1,
        inventory_number: 'TOOL001',
        name: 'Tool to Delete',
        condition: 'good' as const,
        is_in_stock: true
      }
      
      store.items = [tool]
      store.current = tool
      store.pagination.count = 1
      
      mockedApi.delete.mockResolvedValueOnce({})
      
      await store.remove(1)
      
      expect(store.items).toEqual([])
      expect(store.current).toBe(null)
      expect(store.pagination.count).toBe(0)
      expect(mockedApi.delete).toHaveBeenCalledWith(endpoints.tools.one(1))
    })

    it('should fetch categories', async () => {
      const store = useToolsStore()
      const mockCategories = {
        categories: ['Перфоратор', 'Дрель', 'УШМ', 'Болгарка']
      }
      
      mockedApi.get.mockResolvedValueOnce({ data: mockCategories })
      
      const result = await store.fetchCategories()
      
      expect(result).toEqual(mockCategories.categories)
      expect(store.categories).toEqual(mockCategories.categories)
      expect(mockedApi.get).toHaveBeenCalledWith(endpoints.tools.categories)
    })

    it('should handle categories as direct array', async () => {
      const store = useToolsStore()
      const mockCategories = ['Перфоратор', 'Дрель', 'УШМ']
      
      mockedApi.get.mockResolvedValueOnce({ data: mockCategories })
      
      const result = await store.fetchCategories()
      
      expect(result).toEqual(mockCategories)
      expect(store.categories).toEqual(mockCategories)
    })

    it('should bulk create tools', async () => {
      const store = useToolsStore()
      const bulkData = {
        tools: [
          {
            inventory_number: 'BULK001',
            name: 'Bulk Tool 1',
            category: 'Bulk Category',
            brand: 'Bulk Brand'
          },
          {
            inventory_number: 'BULK002',
            name: 'Bulk Tool 2',
            category: 'Bulk Category',
            brand: 'Bulk Brand'
          }
        ],
        auto_issue: false
      }
      const mockResponse = {
        tools: [
          { id: 4, ...bulkData.tools[0], condition: 'good' as const, is_in_stock: true },
          { id: 5, ...bulkData.tools[1], condition: 'good' as const, is_in_stock: true }
        ],
        created_count: 2,
        issued_count: 0
      }
      
      mockedApi.post.mockResolvedValueOnce({ data: mockResponse })
      
      // Mock fetchList для обновления списка
      mockedApi.get.mockResolvedValueOnce({ 
        data: { 
          count: 2, 
          results: mockResponse.tools,
          next: null,
          previous: null
        }
      })
      
      const result = await store.bulkCreate(bulkData)
      
      expect(result).toEqual(mockResponse.tools)
      expect(mockedApi.post).toHaveBeenCalledWith(endpoints.tools.bulkCreate, bulkData)
      expect(mockedApi.get).toHaveBeenCalledWith(endpoints.tools.list + '?page=1&page_size=20&ordering=-created_at')
    })

    it('should set filters', async () => {
      const store = useToolsStore()
      const newFilters = {
        condition: 'good',
        in_stock: 'true'
      }
      
      // Mock fetchList
      mockedApi.get.mockResolvedValueOnce({ 
        data: { 
          count: 0, 
          results: [],
          next: null,
          previous: null
        }
      })
      
      await store.setFilters(newFilters)
      
      expect(store.filters.condition).toBe('good')
      expect(store.filters.in_stock).toBe('true')
      expect(store.pagination.page).toBe(1)
      expect(mockedApi.get).toHaveBeenCalled()
    })

    it('should reset filters', async () => {
      const store = useToolsStore()
      
      // Set some filters first
      store.filters.condition = 'good'
      store.filters.search = 'test'
      
      // Mock fetchList
      mockedApi.get.mockResolvedValueOnce({ 
        data: { 
          count: 0, 
          results: [],
          next: null,
          previous: null
        }
      })
      
      await store.resetFilters()
      
      expect(store.filters).toEqual({
        search: '',
        ordering: '-created_at',
        condition: '',
        in_stock: '',
        current_holder: '',
        current_object: '',
        category: ''
      })
      expect(store.pagination.page).toBe(1)
    })

    it('should search tools', async () => {
      const store = useToolsStore()
      const searchQuery = 'Makita'
      const mockResults = [
        {
          id: 1,
          inventory_number: 'TOOL001',
          name: 'Перфоратор Makita HR2470',
          brand: 'Makita',
          condition: 'good' as const,
          is_in_stock: true
        }
      ]
      
      mockedApi.get.mockResolvedValueOnce({ 
        data: { results: mockResults }
      })
      
      const result = await store.search(searchQuery)
      
      expect(result).toEqual(mockResults)
      // search() caps results at page_size=15 (mobile-friendly) and encodes via encodeURIComponent.
      expect(mockedApi.get).toHaveBeenCalledWith(
        endpoints.tools.list + '?search=Makita&page_size=15'
      )
    })

    it('should not search with short query', async () => {
      const store = useToolsStore()
      
      const result = await store.search('M')
      
      expect(result).toEqual([])
      expect(mockedApi.get).not.toHaveBeenCalled()
    })

    it('should set current tool', () => {
      const store = useToolsStore()
      const tool = {
        id: 1,
        inventory_number: 'TOOL001',
        name: 'Test Tool',
        condition: 'good' as const,
        is_in_stock: true
      }
      
      store.setCurrent(tool)
      
      expect(store.current).toEqual(tool)
    })

    it('should clear current tool', () => {
      const store = useToolsStore()
      store.current = {
        id: 1,
        inventory_number: 'TOOL001',
        name: 'Test Tool',
        condition: 'good' as const,
        is_in_stock: true
      }
      
      store.setCurrent(null)
      
      expect(store.current).toBe(null)
    })

    it('should clear error', () => {
      const store = useToolsStore()
      store.error = 'Some error'
      
      store.clearError()
      
      expect(store.error).toBe(null)
    })

    it('should set page size', async () => {
      const store = useToolsStore()
      
      // Mock fetchList
      mockedApi.get.mockResolvedValueOnce({ 
        data: { 
          count: 0, 
          results: [],
          next: null,
          previous: null
        }
      })
      
      await store.setPageSize(50)
      
      expect(store.pagination.pageSize).toBe(50)
      expect(store.pagination.page).toBe(1)
      expect(mockedApi.get).toHaveBeenCalled()
    })

    it('should set page', async () => {
      const store = useToolsStore()
      
      // Mock fetchList
      mockedApi.get.mockResolvedValueOnce({ 
        data: { 
          count: 0, 
          results: [],
          next: null,
          previous: null
        }
      })
      
      await store.setPage(3)
      
      expect(store.pagination.page).toBe(3)
      expect(mockedApi.get).toHaveBeenCalled()
    })
  })
})

