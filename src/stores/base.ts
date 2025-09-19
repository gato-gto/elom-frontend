import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Ref, ComputedRef } from 'vue'

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
}

// Базовый store с оптимизированной реактивностью
export function createBaseStore<T extends Record<string, any>, F extends BaseFilters>(
  storeName: string,
  defaultFilters: F
) {
  return defineStore(storeName, () => {
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
    const filters = ref<F>({ ...defaultFilters })

    // Computed getters с мемоизацией
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

    // Оптимизированные методы для работы с массивом
    const updateItemInList = (updatedItem: T) => {
      const index = items.value.findIndex(item => item.id === updatedItem.id)
      if (index !== -1) {
        // Используем Object.assign для реактивного обновления
        Object.assign(items.value[index], updatedItem)
      }
    }

    const addItemToList = (newItem: T) => {
      items.value.unshift(newItem)
      pagination.value.count++
    }

    const removeItemFromList = (id: number) => {
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value.splice(index, 1)
        pagination.value.count--
      }
    }

    // Debounced search
    let searchTimeout: NodeJS.Timeout | null = null
    const debouncedSearch = (callback: () => void, delay = 500) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
      searchTimeout = setTimeout(callback, delay)
    }

    // Watchers для автоматического обновления
    const setupAutoRefresh = (fetchFn: () => Promise<void>) => {
      // Автоматическое обновление при изменении фильтров
      watch(
        () => filters.value,
        () => {
          debouncedSearch(() => {
            pagination.value.page = 1
            fetchFn()
          })
        },
        { deep: true }
      )
    }

    // Кэширование для предотвращения дублирования запросов
    const cache = new Map<string, { data: any; timestamp: number }>()
    const CACHE_DURATION = 5 * 60 * 1000 // 5 минут

    const getCachedData = (key: string) => {
      const cached = cache.get(key)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data
      }
      return null
    }

    const setCachedData = (key: string, data: any) => {
      cache.set(key, { data, timestamp: Date.now() })
    }

    const clearCache = () => {
      cache.clear()
    }

    // Базовые actions
    const setLoading = (value: boolean) => {
      loading.value = value
    }

    const setError = (errorMessage: string | null) => {
      error.value = errorMessage
    }

    const setCurrent = (item: T | null) => {
      current.value = item
    }

    const setFilters = (newFilters: Partial<F>) => {
      Object.assign(filters.value, newFilters)
    }

    const resetFilters = () => {
      Object.assign(filters.value, defaultFilters)
    }

    const clearError = () => {
      error.value = null
    }

    const setPageSize = (size: number) => {
      pagination.value.pageSize = size
      pagination.value.page = 1 // Сбрасываем на первую страницу
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

      // Methods
      updateItemInList,
      addItemToList,
      removeItemFromList,
      debouncedSearch,
      setupAutoRefresh,
      getCachedData,
      setCachedData,
      clearCache,
      setLoading,
      setError,
      setCurrent,
      setFilters,
      resetFilters,
      clearError,
      setPageSize
    }
  })
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

  // Debounce функция
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  },

  // Throttle функция
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastCall = 0
    return (...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        func(...args)
      }
    }
  }
}
