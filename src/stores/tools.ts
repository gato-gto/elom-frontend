/**
 * Store для управления инструментами
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/client'
import { endpoints, buildQuery } from '@/api/endpoints'
import type { Tool, ToolRequest, ToolBulkCreateRequest, ToolBulkCreateResponse, ToolCategory } from '@/api/types/tools'
import { useUiStore } from '@/stores/ui'
import { handleApiErrorAsync, parseApiError } from '@/utils/errorHandler'
import { findById } from '@/utils/arrayHelpers'
import { getOptimalPageSize } from '@/utils/device'

export const useToolsStore = defineStore('tools', () => {
  // ========================================================================
  // State
  // ========================================================================
  const items = ref<Tool[]>([])
  const current = ref<Tool | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const categories = ref<string[]>([])
  const pagination = ref({
    count: 0,
    page: 1,
    pageSize: 20,
    next: null as string | null,
    previous: null as string | null
  })
  const filters = ref({
    search: '',
    ordering: '-created_at',
    condition: '',
    in_stock: '',
    current_holder: '',
    current_object: '',
    category: ''
  })

  // ========================================================================
  // Getters
  // ========================================================================
  const getById = computed(() => (id: number) => {
    return findById(items.value, id)
  })

  const exists = computed(() => (id: number) => {
    return items.value.some(item => item.id === id)
  })

  const selectOptions = computed(() => {
    return items.value.map(item => ({
      value: item.id,
      label: `${item.inventory_number} - ${item.name}`
    }))
  })

  const inStockItems = computed(() => {
    return items.value.filter(item => !item.current_holder)
  })

  const issuedItems = computed(() => {
    return items.value.filter(item => item.current_holder)
  })

  // ========================================================================
  // Actions
  // ========================================================================
  const fetchList = async (params?: Record<string, any>): Promise<Tool[]> => {
    loading.value = true
    error.value = null

    try {
      const queryParams: Record<string, any> = {
        page: params?.page || pagination.value.page,
        page_size: params?.page_size || pagination.value.pageSize,
        ...filters.value,
        ...(params?.search !== undefined && { search: params.search }),
        ...(params?.ordering !== undefined && { ordering: params.ordering }),
        ...params
      }

      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined || queryParams[key] === '') {
          delete queryParams[key]
        }
      })

      const query = buildQuery(queryParams)
      const { data } = await api.get(endpoints.tools.list + query)

      items.value = data.results || data
      pagination.value = {
        count: data.count || data.length || 0,
        page: queryParams.page,
        pageSize: queryParams.page_size,
        next: data.next || null,
        previous: data.previous || null
      }

      return items.value
    } catch (err: any) {
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
      await handleApiErrorAsync(err, { operation: 'dataLoading', entity: 'tools' })
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchOne = async (id: number): Promise<Tool> => {
    loading.value = true
    error.value = null

    try {
      const { data } = await api.get<Tool>(endpoints.tools.one(id))
      current.value = data
      
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = data
      }
      
      return data
    } catch (err: any) {
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
      await handleApiErrorAsync(err, { operation: 'dataLoading', entity: 'tools' })
      throw err
    } finally {
      loading.value = false
    }
  }

  const create = async (payload: ToolRequest): Promise<Tool> => {
    loading.value = true
    error.value = null

    try {
      const { data } = await api.post<Tool>(endpoints.tools.list, payload)
      items.value.unshift(data)
      pagination.value.count++
      return data
    } catch (err: any) {
      // F-557: тост успеха/ошибки принадлежит компоненту (ToolForm→handleFormError,
      // List.vue→onSaved). Стор только ставит error и пробрасывает — иначе ДВОЙНОЙ тост
      // (регресс F-545: стор тостил в ui.toast, и страница тоже).
      error.value = parseApiError(err).detail
      throw err
    } finally {
      loading.value = false
    }
  }

  const update = async (id: number, payload: Partial<ToolRequest>): Promise<Tool> => {
    loading.value = true
    error.value = null

    try {
      const { data } = await api.patch<Tool>(endpoints.tools.one(id), payload)
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = data
      }
      if (current.value?.id === id) {
        current.value = data
      }
      return data
    } catch (err: any) {
      // F-557: тост у компонента (ToolForm→handleFormError). Стор не тостит (иначе двойной).
      error.value = parseApiError(err).detail
      throw err
    } finally {
      loading.value = false
    }
  }

  const remove = async (id: number): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      await api.delete(endpoints.tools.one(id))
      items.value = items.value.filter(item => item.id !== id)
      pagination.value.count--
      if (current.value?.id === id) {
        current.value = null
      }
    } catch (err: any) {
      // F-557: тост у компонента (List.vue→handleDeleteError). Стор не тостит (иначе двойной).
      error.value = parseApiError(err).detail
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCategories = async (): Promise<string[]> => {
    try {
      const { data } = await api.get<{ categories: string[] } | string[]>(endpoints.tools.categories)
      // API может возвращать либо { categories: [...] }, либо массив напрямую
      const categoriesArray = Array.isArray(data) ? data : (data?.categories || [])
      categories.value = categoriesArray
      return categories.value
    } catch (err: any) {
      await handleApiErrorAsync(err, { operation: 'dataLoading', entity: 'tools' })
      return []
    }
  }

  const bulkCreate = async (payload: ToolBulkCreateRequest): Promise<Tool[]> => {
    loading.value = true
    error.value = null

    try {
      const { data } = await api.post<ToolBulkCreateResponse>(endpoints.tools.bulkCreate, payload)
      // API возвращает { tools: [...], created_count: ..., issued_count: ... }
      const tools = Array.isArray(data) ? data : (data?.tools || [])
      useUiStore().toast({ type: 'success', text: `Добавлено инструментов: ${Array.isArray(data) ? data.length : data.created_count}` })
      await fetchList()
      return tools
    } catch (err: any) {
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
      await handleApiErrorAsync(err, { operation: 'formValidation', entity: 'tools' })
      throw err
    } finally {
      loading.value = false
    }
  }

  const setCurrent = (item: Tool | null) => {
    current.value = item
  }

  const setFilters = async (newFilters: Partial<typeof filters.value>) => {
    Object.assign(filters.value, newFilters)
    pagination.value.page = 1
    await fetchList()
  }

  const resetFilters = async () => {
    filters.value = {
      search: '',
      ordering: '-created_at',
      condition: '',
      in_stock: '',
      current_holder: '',
      current_object: '',
      category: ''
    }
    pagination.value.page = 1
    await fetchList()
  }

  const clearError = () => {
    error.value = null
  }

  const setPageSize = async (size: number) => {
    pagination.value.pageSize = size
    pagination.value.page = 1
    await fetchList()
  }

  const setPage = async (page: number) => {
    pagination.value.page = page
    await fetchList()
  }

  const search = async (query: string): Promise<Tool[]> => {
    if (query.length < 2) {return []}
    
    try {
      // На мобильных используем меньше результатов для поиска
      const searchPageSize = getOptimalPageSize(15)
      const { data } = await api.get(endpoints.tools.list + `?search=${encodeURIComponent(query)}&page_size=${searchPageSize}`)
      return data.results || data
    } catch (err: any) {
      await handleApiErrorAsync(err, { operation: 'search', entity: 'tools' })
      return []
    }
  }

  // ========================================================================
  // Return
  // ========================================================================
  return {
    // State
    items,
    current,
    loading,
    error,
    categories,
    pagination,
    filters,
    
    // Getters
    getById,
    exists,
    selectOptions,
    inStockItems,
    issuedItems,
    
    // Actions
    fetchList,
    fetchOne,
    create,
    update,
    remove,
    fetchCategories,
    bulkCreate,
    setCurrent,
    setFilters,
    resetFilters,
    clearError,
    setPageSize,
    setPage,
    search
  }
})

// ============================================================================
// Helper Functions
// ============================================================================

export const getToolsStats = () => {
  const store = useToolsStore()
  return {
    total: store.items.length,
    inStock: store.inStockItems.length,
    issued: store.issuedItems.length
  }
}

export const getToolCategories = async () => {
  const store = useToolsStore()
  return await store.fetchCategories()
}
