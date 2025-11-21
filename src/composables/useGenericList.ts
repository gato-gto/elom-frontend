import { ref, computed, watch } from 'vue'
import type { GenericListConfig, UseGenericListOptions, UseGenericListReturn } from '@/types/generic'
import { useErrorHandler } from './useErrorHandler'
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/export'
import { debounce } from '@/utils/debounce'

/**
 * Composable for managing generic lists with filtering, pagination, and export functionality
 */
export function useGenericList<T extends Record<string, any>>(
  options: UseGenericListOptions<T>
): UseGenericListReturn<T> {
  const { handleLoadingError, handleExportError } = useErrorHandler()
  
  // State
  const sortBy = ref(options.config.defaultSort || '')
  const sortOrder = ref<'asc' | 'desc'>(options.config.defaultSortOrder || 'asc')

  // Computed
  const items = computed(() => options.store.items)
  const loading = computed(() => options.store.loading)
  const error = computed(() => options.store.error)
  const pagination = computed(() => options.store.pagination)
  const filters = computed(() => options.store.filters)

  // Methods
  async function fetchList() {
    try {
      await options.store.fetchList()
    } catch (error) {
      await handleLoadingError(error, options.config.title.toLowerCase())
    }
  }

  function handleSort(key: string) {
    if (sortBy.value === key) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = key
      sortOrder.value = 'asc'
    }
    
    const ordering = sortOrder.value === 'desc' ? `-${key}` : key
    options.store.setFilters({ ordering })
  }

  function handlePageChange(page: number) {
    options.store.setPage(page)
  }

  async function handlePageSizeChange(size: number) {
    await options.store.setPageSize(size)
  }

  function handleResetFilters() {
    options.store.resetFilters()
  }

  function handleAction(action: string, item: T) {
    // This will be handled by the parent component
    // The composable just provides the method signature
  }

  async function handleExport(format: 'csv' | 'excel' | 'pdf') {
    try {
      const data = options.store.items
      const filename = `${options.config.exportFilename || 'data'}_${new Date().toISOString().split('T')[0]}`

      switch (format) {
        case 'csv':
          exportToCSV(data, filename)
          break
        case 'excel':
          exportToExcel(data, filename)
          break
        case 'pdf':
          exportToPDF(data, filename)
          break
      }
    } catch (error) {
      await handleExportError(error, options.config.title.toLowerCase())
    }
  }

  // Убрали watch на filters, так как setFilters и resetFilters в base.ts уже вызывают fetchList()
  // Это предотвращает двойную загрузку данных при изменении фильтров
  // Если нужна debounced загрузка для прямых изменений filters, можно добавить watch с флагом

  // Auto-fetch on mount if enabled
  if (options.autoFetch !== false) {
    fetchList()
  }

  return {
    items,
    loading,
    error,
    pagination,
    filters,
    fetchList,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    handleResetFilters,
    handleAction,
    handleExport
  }
}

/**
 * Composable for managing list filters with persistence
 */
export function useListFilters<T extends Record<string, any>>(
  store: any,
  filterKey: string = 'listFilters'
) {
  const savedFilters = ref<Record<string, any>>({})

  // Load saved filters from localStorage
  function loadSavedFilters() {
    try {
      const saved = localStorage.getItem(filterKey)
      if (saved) {
        savedFilters.value = JSON.parse(saved)
        store.setFilters(savedFilters.value)
      }
    } catch (error) {
      console.warn('Failed to load saved filters:', error)
    }
  }

  // Save filters to localStorage
  function saveFilters() {
    try {
      localStorage.setItem(filterKey, JSON.stringify(store.filters))
    } catch (error) {
      console.warn('Failed to save filters:', error)
    }
  }

  // Clear saved filters
  function clearSavedFilters() {
    try {
      localStorage.removeItem(filterKey)
      savedFilters.value = {}
    } catch (error) {
      console.warn('Failed to clear saved filters:', error)
    }
  }

  // Watch for filter changes and save them
  watch(
    () => store.filters,
    (_newFilters: Record<string, any>) => {
      saveFilters()
    },
    { deep: true }
  )

  return {
    savedFilters,
    loadSavedFilters,
    saveFilters,
    clearSavedFilters
  }
}

/**
 * Composable for managing list selection and bulk operations
 */
export function useListSelection<T extends Record<string, any>>() {
  const selectedItems = ref<Set<number>>(new Set())
  const selectAll = ref(false)

  const selectedCount = computed(() => selectedItems.value.size)
  const hasSelection = computed(() => selectedItems.value.size > 0)

  function toggleItem(item: T) {
    if (selectedItems.value.has(item.id)) {
      selectedItems.value.delete(item.id)
    } else {
      selectedItems.value.add(item.id)
    }
    updateSelectAll()
  }

  function toggleSelectAll(items: T[]) {
    selectAll.value = !selectAll.value
    
    if (selectAll.value) {
      items.forEach(item => selectedItems.value.add(item.id))
    } else {
      selectedItems.value.clear()
    }
  }

  function updateSelectAll() {
    // This should be called when items change
    // Implementation depends on the current items list
  }

  function clearSelection() {
    selectedItems.value.clear()
    selectAll.value = false
  }

  function getSelectedItems(items: T[]): T[] {
    return items.filter(item => selectedItems.value.has(item.id))
  }

  return {
    selectedItems,
    selectAll,
    selectedCount,
    hasSelection,
    toggleItem,
    toggleSelectAll,
    clearSelection,
    getSelectedItems
  }
}

/**
 * Composable for managing list search with debouncing
 */
export function useListSearch(
  store: any,
  searchField: string = 'search',
  debounceMs: number = 500
) {
  const searchQuery = ref('')
  const isSearching = ref(false)

  // Debounced search function
  const debouncedSearch = debounce(async () => {
    isSearching.value = true
    try {
      store.setFilters({ [searchField]: searchQuery.value })
      await store.fetchList()
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      isSearching.value = false
    }
  }, debounceMs)

  function handleSearch(query: string) {
    searchQuery.value = query
    debouncedSearch()
  }

  function clearSearch() {
    searchQuery.value = ''
    store.setFilters({ [searchField]: '' })
  }

  // Watch for search query changes
  watch(searchQuery, (newQuery: string) => {
    if (newQuery !== store.filters[searchField]) {
      debouncedSearch()
    }
  })

  return {
    searchQuery,
    isSearching,
    handleSearch,
    clearSearch
  }
}

/**
 * Composable for managing list sorting
 */
export function useListSorting(store: any) {
  const sortBy = ref('')
  const sortOrder = ref<'asc' | 'desc'>('asc')

  function handleSort(field: string) {
    if (sortBy.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = field
      sortOrder.value = 'asc'
    }
    
    const ordering = sortOrder.value === 'desc' ? `-${field}` : field
    store.setFilters({ ordering })
  }

  function getSortIcon(field: string): string {
    if (sortBy.value !== field) {return '↕️'}
    return sortOrder.value === 'asc' ? '↑' : '↓'
  }

  function isSortedBy(field: string): boolean {
    return sortBy.value === field
  }

  return {
    sortBy,
    sortOrder,
    handleSort,
    getSortIcon,
    isSortedBy
  }
}
