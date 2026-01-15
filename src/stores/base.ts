/**
 * Базовый store с CRUD операциями для entity stores
 * 
 * Использование:
 * 1. Создание store:
 *    export const useMyStore = createBaseStore<Entity, CreateRequest, UpdateRequest>({
 *      endpoint: endpoints.myEntity,
 *      entityName: 'myEntity',
 *      entityNamePlural: 'мои сущности'
 *    })
 * 
 * 2. Использование в компонентах:
 *    const myStore = useMyStore()
 *    await myStore.fetchList()
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import api from '@/api/client'
import { buildQuery } from '@/api/endpoints'
import { handleApiErrorAsync } from '@/utils/errorHandler'
import { findById } from '@/utils/arrayHelpers'
import { getOptimalPageSize } from '@/utils/device'

// ============================================================================
// Types
// ============================================================================

export interface PaginationState {
  count: number
  page: number
  pageSize: number
  next: string | null
  previous: string | null
}

export interface BaseFilters {
  search: string
  ordering: string
  [key: string]: any
}

export interface BaseStoreConfig<T, C, U> {
  endpoint: {
    list: string
    one: (id: number) => string
  }
  entityName: string
  entityNamePlural: string
  defaultOrdering?: string
  defaultPageSize?: number
}

export interface BaseStoreState<T> {
  items: Ref<T[]>
  current: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  pagination: Ref<PaginationState>
  filters: Ref<BaseFilters>
}

export interface BaseStoreGetters<T> {
  getById: ComputedRef<(id: number) => T | undefined>
  exists: ComputedRef<(id: number) => boolean>
  selectOptions: ComputedRef<{ value: number; label: string }[]>
}

export interface BaseStoreActions<T, C, U> {
  fetchList: (params?: Record<string, any>) => Promise<T[]>
  fetchOne: (id: number) => Promise<T>
  create: (data: C) => Promise<T>
  update: (id: number, data: U) => Promise<T>
  remove: (id: number) => Promise<any>
  setCurrent: (item: T | null) => void
  setFilters: (newFilters: Partial<BaseFilters>) => Promise<void>
  resetFilters: () => Promise<void>
  clearError: () => void
  setPageSize: (size: number) => Promise<void>
  setPage: (page: number) => Promise<void>
  search: (query: string) => Promise<T[]>
}

// ============================================================================
// Factory Function
// ============================================================================

export function createBaseStore<T extends { id: number; name?: string; title?: string }, C, U>(
  config: BaseStoreConfig<T, C, U>
) {
  return defineStore(config.entityName, () => {
    // ========================================================================
    // State
    // ========================================================================
    const items = ref<T[]>([]) as Ref<T[]>
    const current = ref<T | null>(null) as Ref<T | null>
    const loading = ref(false)
    const error = ref<string | null>(null)
    // Используем адаптивный размер страницы для мобильных устройств
    const initialPageSize = config.defaultPageSize || 20
    const pagination = ref<PaginationState>({
      count: 0,
      page: 1,
      pageSize: getOptimalPageSize(initialPageSize),
      next: null,
      previous: null
    })
    const filters = ref<BaseFilters>({
      search: '',
      ordering: config.defaultOrdering || 'id'
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
        label: item.name || item.title || `Item ${item.id}`
      }))
    })

    // ========================================================================
    // Actions
    // ========================================================================
    
    const fetchList = async (params?: Record<string, any>): Promise<T[]> => {
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

        // Remove empty values
        Object.keys(queryParams).forEach(key => {
          if (queryParams[key] === undefined || queryParams[key] === '') {
            delete queryParams[key]
          }
        })

        const query = buildQuery(queryParams)
        const { data } = await api.get(config.endpoint.list + query)

        items.value = data.results || data
        pagination.value = {
          count: data.count || (Array.isArray(data) ? data.length : 0),
          page: queryParams.page,
          pageSize: queryParams.page_size,
          next: data.next || null,
          previous: data.previous || null
        }

        if (params) {
          Object.assign(filters.value, params)
        }

        return items.value
      } catch (err: any) {
        error.value = err?.response?.data?.detail || `Ошибка загрузки ${config.entityNamePlural}`
        await handleApiErrorAsync(err, { operation: 'dataLoading', entity: config.entityName })
        throw err
      } finally {
        loading.value = false
      }
    }

    const fetchOne = async (id: number): Promise<T> => {
      loading.value = true
      error.value = null

      try {
        const { data } = await api.get<T>(config.endpoint.one(id))
        current.value = data

        const index = items.value.findIndex(item => item.id === id)
        if (index !== -1) {
          items.value[index] = data
        }

        return data
      } catch (err: any) {
        current.value = null
        error.value = err?.response?.data?.detail || `Ошибка загрузки`
        await handleApiErrorAsync(err, { operation: 'dataLoading', entity: config.entityName })
        throw err
      } finally {
        loading.value = false
      }
    }

    const create = async (data: C): Promise<T> => {
      loading.value = true
      error.value = null

      try {
        const { data: newItem } = await api.post<T>(config.endpoint.list, data)
        items.value.unshift(newItem)
        pagination.value.count++
        return newItem
      } catch (err: any) {
        error.value = err?.response?.data?.detail || `Ошибка создания`
        await handleApiErrorAsync(err, { operation: 'formValidation', entity: config.entityName })
        throw err
      } finally {
        loading.value = false
      }
    }

    const update = async (id: number, data: U): Promise<T> => {
      loading.value = true
      error.value = null

      try {
        const { data: updatedItem } = await api.patch<T>(config.endpoint.one(id), data)
        
        const index = items.value.findIndex(item => item.id === id)
        if (index !== -1) {
          items.value[index] = updatedItem
        }

        if (current.value?.id === id) {
          current.value = updatedItem
        }

        return updatedItem
      } catch (err: any) {
        error.value = err?.response?.data?.detail || `Ошибка обновления`
        await handleApiErrorAsync(err, { operation: 'formValidation', entity: config.entityName })
        throw err
      } finally {
        loading.value = false
      }
    }

    const remove = async (id: number): Promise<any> => {
      loading.value = true
      error.value = null

      try {
        const response = await api.delete(config.endpoint.one(id))
        
        const wasDeactivated = response.status === 200 && response.data?.action === 'deactivated'
        
        if (wasDeactivated) {
          const index = items.value.findIndex(item => item.id === id)
          if (index !== -1) {
            (items.value[index] as any).is_active = false
          }
        } else {
          items.value = items.value.filter(item => item.id !== id)
          pagination.value.count--
        }

        if (current.value?.id === id) {
          current.value = null
        }

        return response.data || { action: 'deleted' }
      } catch (err: any) {
        error.value = err?.response?.data?.detail || `Ошибка удаления`
        await handleApiErrorAsync(err, { operation: 'delete', entity: config.entityName })
        throw err
      } finally {
        loading.value = false
      }
    }

    const setCurrent = (item: T | null) => {
      current.value = item
    }

    const setFilters = async (newFilters: Partial<BaseFilters>) => {
      Object.assign(filters.value, newFilters)
      pagination.value.page = 1
      await fetchList()
    }

    const resetFilters = async () => {
      const resetObj: BaseFilters = {
        search: '',
        ordering: config.defaultOrdering || 'id'
      }
      
      Object.keys(filters.value).forEach(key => {
        if (key !== 'search' && key !== 'ordering') {
          resetObj[key] = ''
        }
      })
      
      filters.value = resetObj
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

    const search = async (query: string): Promise<T[]> => {
      if (query.length < 2) {return []}
      
      try {
        // На мобильных используем меньше результатов для поиска
        const searchPageSize = getOptimalPageSize(15)
        const { data } = await api.get(config.endpoint.list + `?search=${encodeURIComponent(query)}&page_size=${searchPageSize}`)
        return data.results || data
      } catch (err: any) {
        await handleApiErrorAsync(err, { operation: 'search', entity: config.entityName })
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
      selectOptions,

      // Actions
      fetchList,
      fetchOne,
      create,
      update,
      remove,
      setCurrent,
      setFilters,
      resetFilters,
      clearError,
      setPageSize,
      setPage,
      search
    }
  })
}
