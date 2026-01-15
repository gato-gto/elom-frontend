/**
 * Store для управления выдачами инструментов
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/client'
import { endpoints, buildQuery } from '@/api/endpoints'
import type { ToolIssue, ToolIssueCreateRequest, ToolIssueReturnRequest } from '@/api/types/tools'
import { useNotifications } from '@/composables/useNotifications'
import { handleApiErrorAsync } from '@/utils/errorHandler'
import { findById } from '@/utils/arrayHelpers'
import { getOptimalPageSize } from '@/utils/device'
import { useToolsStore } from './tools'

export const useToolIssuesStore = defineStore('toolIssues', () => {
  // ========================================================================
  // State
  // ========================================================================
  const items = ref<ToolIssue[]>([])
  const current = ref<ToolIssue | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    count: 0,
    page: 1,
    pageSize: 20,
    next: null as string | null,
    previous: null as string | null
  })
  const filters = ref({
    search: '',
    ordering: '-issued_at',
    tool: '',
    issued_to: '',
    issued_by: '',
    object: '',
    is_open: ''
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

  const openIssues = computed(() => {
    return items.value.filter(item => item.is_open)
  })

  const returnedIssues = computed(() => {
    return items.value.filter(item => !item.is_open)
  })

  // ========================================================================
  // Actions
  // ========================================================================
  const fetchList = async (params?: Record<string, any>): Promise<ToolIssue[]> => {
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
      const { data } = await api.get(endpoints.toolIssues.list + query)

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
      error.value = err?.response?.data?.detail || 'Ошибка при загрузке выдач инструментов'
      await handleApiErrorAsync(err, { operation: 'dataLoading', entity: 'toolIssues' })
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchOne = async (id: number): Promise<ToolIssue> => {
    loading.value = true
    error.value = null

    try {
      const { data } = await api.get<ToolIssue>(endpoints.toolIssues.one(id))
      current.value = data
      
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = data
      }
      
      return data
    } catch (err: any) {
      error.value = err?.response?.data?.detail || 'Ошибка при загрузке выдачи'
      await handleApiErrorAsync(err, { operation: 'dataLoading', entity: 'toolIssues' })
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchOpenIssues = async (): Promise<ToolIssue[]> => {
    loading.value = true
    error.value = null

    try {
      const { data } = await api.get(endpoints.toolIssues.openIssues)
      items.value = data.results || data
      return items.value
    } catch (err: any) {
      error.value = err?.response?.data?.detail || 'Ошибка при загрузке активных выдач'
      await handleApiErrorAsync(err, { operation: 'dataLoading', entity: 'toolIssues' })
      throw err
    } finally {
      loading.value = false
    }
  }

  const create = async (payload: ToolIssueCreateRequest): Promise<ToolIssue> => {
    loading.value = true
    error.value = null
    const { showSuccess, showError } = useNotifications()

    try {
      const { data } = await api.post<ToolIssue>(endpoints.toolIssues.issue, payload)
      items.value.unshift(data)
      pagination.value.count++
      
      // Обновляем список инструментов
      const toolsStore = useToolsStore()
      await toolsStore.fetchList()
      
      showSuccess('Инструмент успешно выдан')
      return data
    } catch (err: any) {
      showError('Ошибка при выдаче инструмента')
      error.value = err?.response?.data?.detail || 'Ошибка при выдаче инструмента'
      await handleApiErrorAsync(err, { operation: 'formValidation', entity: 'toolIssues' })
      throw err
    } finally {
      loading.value = false
    }
  }

  const returnTool = async (id: number, payload: ToolIssueReturnRequest): Promise<ToolIssue> => {
    loading.value = true
    error.value = null
    const { showSuccess, showError } = useNotifications()

    try {
      const { data } = await api.post<ToolIssue>(endpoints.toolIssues.returnTool(id), payload)
      
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = data
      }
      if (current.value?.id === id) {
        current.value = data
      }
      
      // Обновляем список инструментов
      const toolsStore = useToolsStore()
      await toolsStore.fetchList()
      
      showSuccess('Инструмент успешно возвращён')
      return data
    } catch (err: any) {
      showError('Ошибка при возврате инструмента')
      error.value = err?.response?.data?.detail || 'Ошибка при возврате инструмента'
      await handleApiErrorAsync(err, { operation: 'formValidation', entity: 'toolIssues' })
      throw err
    } finally {
      loading.value = false
    }
  }

  const setCurrent = (item: ToolIssue | null) => {
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
      ordering: '-issued_at',
      tool: '',
      issued_to: '',
      issued_by: '',
      object: '',
      is_open: ''
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

  const search = async (query: string): Promise<ToolIssue[]> => {
    if (query.length < 2) {return []}
    
    try {
      // На мобильных используем меньше результатов для поиска
      const searchPageSize = getOptimalPageSize(15)
      const { data } = await api.get(endpoints.toolIssues.list + `?search=${encodeURIComponent(query)}&page_size=${searchPageSize}`)
      return data.results || data
    } catch (err: any) {
      await handleApiErrorAsync(err, { operation: 'search', entity: 'toolIssues' })
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
    pagination,
    filters,
    
    // Getters
    getById,
    exists,
    openIssues,
    returnedIssues,
    
    // Actions
    fetchList,
    fetchOne,
    fetchOpenIssues,
    create,
    returnTool,
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

export const getIssuesStats = () => {
  const store = useToolIssuesStore()
  return {
    total: store.items.length,
    active: store.openIssues.length,
    returned: store.returnedIssues.length
  }
}
