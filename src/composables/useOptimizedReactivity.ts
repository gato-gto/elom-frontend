import { ref, computed, watch, watchEffect, nextTick, type Ref, type ComputedRef } from 'vue'

// Оптимизированные computed свойства с мемоизацией
export function useOptimizedComputed<T>(
  getter: () => T,
  deps: Ref[] = []
): ComputedRef<T> {
  return computed(() => {
    // Проверяем зависимости для дополнительной оптимизации
    deps.forEach(dep => dep.value)
    return getter()
  })
}

// Debounced watcher для поиска и фильтрации
export function useDebouncedWatch<T>(
  source: Ref<T> | (() => T),
  callback: (newValue: T, oldValue: T) => void,
  delay = 500
) {
  let timeoutId: NodeJS.Timeout | null = null

  return watch(
    source,
    (newValue, oldValue) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        callback(newValue, oldValue)
      }, delay)
    },
    { deep: true }
  )
}

// Throttled watcher для частых обновлений
export function useThrottledWatch<T>(
  source: Ref<T> | (() => T),
  callback: (newValue: T, oldValue: T) => void,
  delay = 100
) {
  let lastCall = 0

  return watch(
    source,
    (newValue, oldValue) => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        callback(newValue, oldValue)
      }
    },
    { deep: true }
  )
}

// Оптимизированный watcher для массивов
export function useArrayWatcher<T>(
  array: Ref<T[]>,
  callback: (items: T[]) => void,
  options: { deep?: boolean; immediate?: boolean } = {}
) {
  return watch(
    array,
    (newArray) => {
      // Проверяем, действительно ли массив изменился
      if (newArray.length !== array.value.length) {
        callback(newArray)
        return
      }
      
      // Проверяем изменения в элементах массива
      const hasChanges = newArray.some((item, index) => {
        const oldItem = array.value[index]
        return JSON.stringify(item) !== JSON.stringify(oldItem)
      })
      
      if (hasChanges) {
        callback(newArray)
      }
    },
    { deep: options.deep ?? true, immediate: options.immediate ?? false }
  )
}

// Batch обновления для предотвращения множественных перерендеров
export function useBatchUpdates() {
  const updates = ref<(() => void)[]>([])
  const isBatching = ref(false)

  const addUpdate = (update: () => void) => {
    updates.value.push(update)
    
    if (!isBatching.value) {
      isBatching.value = true
      nextTick(() => {
        updates.value.forEach(update => update())
        updates.value = []
        isBatching.value = false
      })
    }
  }

  return { addUpdate, isBatching }
}

// Оптимизированное состояние для форм
export function useOptimizedForm<T extends Record<string, any>>(
  initialData: T,
  validationRules?: Partial<Record<keyof T, (value: any) => string | null>>
) {
  const formData = ref<T>({ ...initialData })
  const errors = ref<Partial<Record<keyof T, string>>>({})
  const touched = ref<Partial<Record<keyof T, boolean>>>({})
  const isValid = computed(() => Object.keys(errors.value).length === 0)

  // Валидация с debounce
  const validateField = (field: keyof T) => {
    const rule = validationRules?.[field]
    if (rule) {
      const error = rule(formData.value[field])
      if (error) {
        errors.value[field] = error
      } else {
        delete errors.value[field]
      }
    }
  }

  const validateAll = () => {
    if (validationRules) {
      Object.keys(validationRules).forEach(field => {
        validateField(field as keyof T)
      })
    }
  }

  // Watcher для валидации при изменении полей
  watch(
    formData,
    () => {
      validateAll()
    },
    { deep: true }
  )

  const setFieldValue = (field: keyof T, value: any) => {
    formData.value[field] = value
    touched.value[field] = true
    validateField(field)
  }

  const resetForm = () => {
    formData.value = { ...initialData }
    errors.value = {}
    touched.value = {}
  }

  return {
    formData,
    errors,
    touched,
    isValid,
    setFieldValue,
    resetForm,
    validateField,
    validateAll
  }
}

// Оптимизированное состояние для пагинации
export function useOptimizedPagination(
  initialPage = 1,
  initialPageSize = 20
) {
  const currentPage = ref(initialPage)
  const pageSize = ref(initialPageSize)
  const totalCount = ref(0)
  const isLoading = ref(false)

  const totalPages = computed(() => 
    Math.ceil(totalCount.value / pageSize.value)
  )

  const hasNextPage = computed(() => 
    currentPage.value < totalPages.value
  )

  const hasPreviousPage = computed(() => 
    currentPage.value > 1
  )

  const startIndex = computed(() => 
    (currentPage.value - 1) * pageSize.value
  )

  const endIndex = computed(() => 
    Math.min(startIndex.value + pageSize.value, totalCount.value)
  )

  const setPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  const setPageSize = (size: number) => {
    pageSize.value = size
    currentPage.value = 1 // Сбрасываем на первую страницу
  }

  const nextPage = () => {
    if (hasNextPage.value) {
      currentPage.value++
    }
  }

  const previousPage = () => {
    if (hasPreviousPage.value) {
      currentPage.value--
    }
  }

  const resetPagination = () => {
    currentPage.value = initialPage
    pageSize.value = initialPageSize
    totalCount.value = 0
  }

  return {
    currentPage,
    pageSize,
    totalCount,
    isLoading,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    resetPagination
  }
}

// Оптимизированное состояние для поиска
export function useOptimizedSearch(
  initialQuery = '',
  delay = 500
) {
  const query = ref(initialQuery)
  const isSearching = ref(false)
  const searchResults = ref<any[]>([])
  const searchError = ref<string | null>(null)

  // Debounced search function
  let searchTimeout: NodeJS.Timeout | null = null

  const performSearch = (searchFn: (query: string) => Promise<any[]>) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    searchTimeout = setTimeout(async () => {
      if (!query.value.trim()) {
        searchResults.value = []
        isSearching.value = false
        return
      }

      isSearching.value = true
      searchError.value = null

      try {
        const results = await searchFn(query.value)
        searchResults.value = results
      } catch (error: any) {
        searchError.value = error.message || 'Ошибка поиска'
        searchResults.value = []
      } finally {
        isSearching.value = false
      }
    }, delay)
  }

  const clearSearch = () => {
    query.value = ''
    searchResults.value = []
    searchError.value = null
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
  }

  return {
    query,
    isSearching,
    searchResults,
    searchError,
    performSearch,
    clearSearch
  }
}

// Оптимизированное состояние для модальных окон
export function useOptimizedModal() {
  const isOpen = ref(false)
  const isLoading = ref(false)
  const data = ref<any>(null)

  const open = (modalData?: any) => {
    data.value = modalData
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
    data.value = null
    isLoading.value = false
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  return {
    isOpen,
    isLoading,
    data,
    open,
    close,
    setLoading
  }
}
