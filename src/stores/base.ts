import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import api from '@/api/client'
import { endpoints, buildQuery } from '@/api/endpoints'
import { handleApiErrorAsync } from '@/utils/errorHandler'

// Базовые типы для пагинации
export interface PaginationState {
  count: number
  page: number
  pageSize: number
  next: string | null
  previous: string | null
}

// Базовые типы для фильтров
export interface BaseFilters {
  search: string
  ordering: string
  [key: string]: any // Дополнительные фильтры
}

// Конфигурация для базового store
export interface BaseStoreConfig<T, C, U> {
  endpoint: {
    list: string
    one: (id: number) => string
  }
  entityName: string
  entityNamePlural: string
}

// Базовый store с CRUD операциями
export function createBaseStore<T extends Record<string, any>, C, U>(
  config: BaseStoreConfig<T, C, U>
) {
  const store = defineStore(config.entityName, () => {
    // State
    const items = ref<T[]>([]) as Ref<T[]>
    const current = ref<T | null>(null) as Ref<T | null>
    const loading = ref(false)
    const error = ref<string | null>(null)
    const pagination = ref<PaginationState>({
      count: 0,
      page: 1,
      pageSize: 20,
      next: null,
      previous: null
    })
    const filters = ref<BaseFilters>({
      search: '',
      ordering: 'id'
    })

    // Computed getters
    const getById = computed(() => (id: number) => {
      return items.value.find(item => item.id === id)
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

    // CRUD Actions
    const fetchList = async (params?: any) => {
      loading.value = true
      error.value = null

      try {
        const queryParams: Record<string, any> = {
          page: params?.page || pagination.value.page,
          page_size: params?.page_size || pagination.value.pageSize,
          ...filters.value, // Добавляем все фильтры
          // Переопределяем специфичные параметры если они переданы
          ...(params?.search !== undefined && { search: params.search }),
          ...(params?.ordering !== undefined && { ordering: params.ordering })
        }

        // Удаляем undefined значения
        Object.keys(queryParams).forEach(key => {
          if (queryParams[key] === undefined || queryParams[key] === '') {
            delete queryParams[key]
          }
        })

        const query = buildQuery(queryParams)
        const { data } = await api.get(config.endpoint.list + query)

        items.value = data.results || data
        pagination.value = {
          count: data.count || data.length || 0,
          page: queryParams.page,
          pageSize: pagination.value.pageSize,
          next: data.next || null,
          previous: data.previous || null
        }

        // Update filters
        if (params) {
          Object.assign(filters.value, params)
        }
      } catch (err: any) {
        await handleApiErrorAsync(err, { operation: 'dataLoading' })
        throw err
      } finally {
        loading.value = false
      }
    }

    const fetchOne = async (id: number) => {
      loading.value = true
      error.value = null

      try {
        const { data } = await api.get<T>(config.endpoint.one(id))
        current.value = data

        // Update in list if exists
        const index = items.value.findIndex(item => item.id === id)
        if (index !== -1) {
          items.value[index] = data
        }

        return data
      } catch (err: any) {
        current.value = null
        await handleApiErrorAsync(err, { operation: 'dataLoading' })
        throw err
      } finally {
        loading.value = false
      }
    }

    const create = async (data: C) => {
      loading.value = true
      error.value = null

      try {
        const { data: newItem } = await api.post<T>(config.endpoint.list, data)
        
        // Add to list
        items.value.unshift(newItem)
        pagination.value.count++

        return newItem
      } catch (err: any) {
        await handleApiErrorAsync(err, { operation: 'formValidation' })
        throw err
      } finally {
        loading.value = false
      }
    }

    const update = async (id: number, data: U) => {
      loading.value = true
      error.value = null

      try {
        const { data: updatedItem } = await api.patch<T>(config.endpoint.one(id), data)
        
        // Update in list
        const index = items.value.findIndex(item => item.id === id)
        if (index !== -1) {
          items.value[index] = updatedItem
        }

        // Update current if it's the same
        if (current.value?.id === id) {
          current.value = updatedItem
        }

        return updatedItem
      } catch (err: any) {
        await handleApiErrorAsync(err, { operation: 'formValidation' })
        throw err
      } finally {
        loading.value = false
      }
    }

    const deleteItem = async (id: number) => {
      loading.value = true
      error.value = null

      try {
        const response = await api.delete(config.endpoint.one(id))
        
        // Проверяем, был ли объект деактивирован вместо удаления
        // (ответ 200 с action: 'deactivated')
        const wasDeactivated = response.status === 200 && response.data?.action === 'deactivated'
        
        if (wasDeactivated) {
          // Обновляем элемент в списке (помечаем как неактивный)
          const index = items.value.findIndex(item => item.id === id)
          if (index !== -1) {
            items.value[index] = { ...items.value[index], is_active: false }
          }
        } else {
          // Удаляем из списка
          items.value = items.value.filter(item => item.id !== id)
          pagination.value.count--
        }

        // Clear current if it's the same
        if (current.value?.id === id) {
          current.value = null
        }

        // Возвращаем данные ответа (для обработки деактивации)
        return response.data || { action: 'deleted' }
      } catch (err: any) {
        await handleApiErrorAsync(err, { operation: 'delete' })
        throw err
      } finally {
        loading.value = false
      }
    }

    // Utility methods
    const setCurrent = (item: T | null) => {
      current.value = item
    }

    const setFilters = async (newFilters: Partial<BaseFilters>) => {
      Object.assign(filters.value, newFilters)
      pagination.value.page = 1 // Сбрасываем на первую страницу при изменении фильтров
      await fetchList()
    }

    const resetFilters = async () => {
      // Сохраняем структуру фильтров, но устанавливаем значения в пустые строки
      const keys = Object.keys(filters.value)
      const resetFiltersObj: BaseFilters = {
        search: '',
        ordering: 'id'
      }
      
      // Устанавливаем все остальные фильтры в пустые строки
      keys.forEach(key => {
        if (key !== 'search' && key !== 'ordering') {
          resetFiltersObj[key] = ''
        }
      })
      
      filters.value = resetFiltersObj
      pagination.value.page = 1 // Сбрасываем на первую страницу при сбросе фильтров
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

    // Search method for autocomplete components
    const search = async (query: string) => {
      if (query.length < 2) {return []}
      
      try {
        const { data } = await api.get(config.endpoint.list + `?search=${encodeURIComponent(query)}&page_size=20`)
        return data.results || data
      } catch (err: any) {
        await handleApiErrorAsync(err, { operation: 'search' })
        return []
      }
    }

    // Alias for search (for backward compatibility)
    const searchMaterials = search
    const searchSuppliers = search

    // Alias for delete (for backward compatibility)
    const remove = deleteItem

    // Placeholder methods for photo upload (to be implemented in specific stores)
    const uploadPhoto = async (id: number, file: File) => {
      throw new Error('uploadPhoto method not implemented for this store')
    }

    const deletePhoto = async (id: number) => {
      throw new Error('deletePhoto method not implemented for this store')
    }

    // Placeholder method for object-specific materials (to be implemented in materials store)
    const getMaterialsByObject = async (objectId: number) => {
      throw new Error('getMaterialsByObject method not implemented for this store')
    }

    return {
      // State
      items,
      current,
      loading,
      error,
      pagination,
      filters,

      // Computed
      getById,
      exists,
      selectOptions,

      // CRUD Actions
      fetchList,
      fetchOne,
      create,
      update,
      delete: deleteItem,

      // Utility methods
      setCurrent,
      setFilters,
      resetFilters,
      clearError,
      setPageSize,
      setPage,

      // Search methods
      search,
      searchMaterials,
      searchSuppliers,

      // Alias methods
      remove,

      // Placeholder methods
      uploadPhoto,
      deletePhoto,
      getMaterialsByObject
    }
  })
  
  return store()
}

// Утилиты для работы с реактивностью
export const reactivityUtils = {
  // Создание реактивного объекта с глубоким отслеживанием
  createReactiveObject: <T extends Record<string, any>>(obj: T) => {
    return ref(obj)
  },

  // Оптимизированное обновление массива
  updateArrayItem: <T extends { id: number }>(array: Ref<T[]>, updatedItem: T) => {
    const index = array.value.findIndex(item => item.id === updatedItem.id)
    if (index !== -1) {
      Object.assign(array.value[index], updatedItem)
    }
  },

  // Batch обновления для предотвращения множественных перерендеров
  batchUpdate: (updates: (() => void)[]) => {
    // В Vue 3 нет встроенного batch, но можно использовать nextTick
    import('vue').then(({ nextTick }) => {
      nextTick(() => {
        updates.forEach(update => update())
      })
    })
  },

}
