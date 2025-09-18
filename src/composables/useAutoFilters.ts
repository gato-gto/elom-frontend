import { ref, watch, type Ref } from 'vue'
import { debounce } from '@/utils/debounce'

// Типы для фильтров
export interface FilterConfig {
  debounceMs?: number
  autoSearch?: boolean
}

// Универсальный composable для автоматических фильтров
export function useAutoFilters<T extends Record<string, any>>(
  store: any,
  config: FilterConfig = {}
) {
  const { debounceMs = 500, autoSearch = true } = config
  
  // Состояние загрузки
  const isSearching = ref(false)
  
  // Debounced функция поиска
  const debouncedSearch = debounce(async () => {
    if (!autoSearch) return
    
    isSearching.value = true
    try {
      await store.fetchList()
    } catch (error) {
      console.error('Ошибка поиска:', error)
    } finally {
      isSearching.value = false
    }
  }, debounceMs)

  // Watcher для автоматического поиска при изменении фильтров
  const setupAutoSearch = () => {
    watch(
      () => store.filters,
      () => {
        // Сбрасываем на первую страницу при изменении фильтров
        store.pagination.page = 1
        debouncedSearch()
      },
      { deep: true }
    )
  }

  // Функция для ручного поиска
  const search = async () => {
    isSearching.value = true
    try {
      store.pagination.page = 1
      await store.fetchList()
    } catch (error) {
      console.error('Ошибка поиска:', error)
    } finally {
      isSearching.value = false
    }
  }

  // Функция для сброса фильтров
  const resetFilters = async () => {
    store.resetFilters()
    if (autoSearch) {
      await search()
    }
  }

  // Функция для установки фильтров
  const setFilters = (filters: Partial<T>) => {
    store.setFilters(filters)
  }

  return {
    isSearching,
    search,
    resetFilters,
    setFilters,
    setupAutoSearch
  }
}

// Специализированные composables для разных типов данных
export function useMaterialsFilters() {
  const { useMaterialsStore } = require('@/stores/materials')
  const store = useMaterialsStore()
  
  return useAutoFilters(store, { debounceMs: 400 })
}

export function useObjectsFilters() {
  const { useObjectsStore } = require('@/stores/objects')
  const store = useObjectsStore()
  
  return useAutoFilters(store, { debounceMs: 400 })
}

export function useEmployeesFilters() {
  const { useEmployeesStore } = require('@/stores/employees')
  const store = useEmployeesStore()
  
  return useAutoFilters(store, { debounceMs: 400 })
}

export function useUnitsFilters() {
  const { useUnitsStore } = require('@/stores/units')
  const store = useUnitsStore()
  
  return useAutoFilters(store, { debounceMs: 400 })
}

export function usePurchasesFilters() {
  const { usePurchasesStore } = require('@/stores/purchases')
  const store = usePurchasesStore()
  
  return useAutoFilters(store, { debounceMs: 600 })
}

// Утилиты для работы с фильтрами
export const filterUtils = {
  // Создание опций для select полей
  createSelectOptions: <T extends { id: number; name?: string; title?: string }>(
    items: T[],
    includeEmpty = true,
    emptyLabel = 'Все'
  ) => {
    const options = items.map(item => ({
      value: item.id,
      label: item.name || item.title || `Item ${item.id}`
    }))
    
    if (includeEmpty) {
      options.unshift({ value: '', label: emptyLabel })
    }
    
    return options
  },

  // Создание опций для boolean полей
  createBooleanOptions: (includeEmpty = true) => {
    const options = [
      { value: true, label: 'Да' },
      { value: false, label: 'Нет' }
    ]
    
    if (includeEmpty) {
      options.unshift({ value: null, label: 'Все' })
    }
    
    return options
  },

  // Создание опций для сортировки
  createOrderingOptions: (fields: Array<{ value: string; label: string }>) => {
    return fields.map(field => [
      { value: field.value, label: `${field.label} ↑` },
      { value: `-${field.value}`, label: `${field.label} ↓` }
    ]).flat()
  },

  // Валидация фильтров
  validateFilters: (filters: Record<string, any>) => {
    const validated: Record<string, any> = {}
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        validated[key] = value
      }
    })
    
    return validated
  },

  // Очистка пустых фильтров
  cleanFilters: (filters: Record<string, any>) => {
    const cleaned: Record<string, any> = {}
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = value
      }
    })
    
    return cleaned
  }
}
