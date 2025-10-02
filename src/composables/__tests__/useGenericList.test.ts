import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGenericList } from '../useGenericList'
import type { GenericListConfig } from '@/types/generic'

describe('useGenericList', () => {
  const mockConfig: GenericListConfig<any> = {
    title: 'Test List',
    columns: [
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        order: 1
      },
      {
        key: 'status',
        label: 'Status',
        sortable: false,
        order: 2
      }
    ],
    filters: [
      {
        key: 'search',
        type: 'input',
        label: 'Search',
        order: 1
      },
      {
        key: 'status',
        type: 'select',
        label: 'Status',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ],
        order: 2
      }
    ],
    actions: [
      {
        key: 'create',
        label: 'Create',
        type: 'primary',
        order: 1
      }
    ],
    showSearch: true,
    showFilters: true,
    showPagination: true
  }

  const mockStore = {
    items: [
      { id: 1, name: 'Item 1', status: 'active' },
      { id: 2, name: 'Item 2', status: 'inactive' }
    ],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      pageSize: 20,
      count: 2,
      totalPages: 1
    },
    filters: { search: '', status: '' },
    fetchList: vi.fn(),
    setFilters: vi.fn(),
    setPage: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with store data', () => {
    const { items, loading, error, pagination } = useGenericList(mockConfig, mockStore)
    
    expect(items.value).toEqual(mockStore.items)
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(pagination.value).toEqual(mockStore.pagination)
  })

  it('handles search input correctly', async () => {
    const { handleSearch } = useGenericList(mockConfig, mockStore)
    
    await handleSearch('test')
    
    expect(mockStore.setFilters).toHaveBeenCalledWith({ search: 'test' })
    expect(mockStore.fetchList).toHaveBeenCalled()
  })

  it('handles filter changes correctly', async () => {
    const { handleFilter } = useGenericList(mockConfig, mockStore)
    
    await handleFilter('status', 'active')
    
    expect(mockStore.setFilters).toHaveBeenCalledWith({ status: 'active' })
    expect(mockStore.fetchList).toHaveBeenCalled()
  })

  it('handles sort changes correctly', async () => {
    const { handleSort } = useGenericList(mockConfig, mockStore)
    
    await handleSort('name', 'asc')
    
    expect(mockStore.setFilters).toHaveBeenCalledWith({ ordering: 'name' })
    expect(mockStore.fetchList).toHaveBeenCalled()
  })

  it('handles page changes correctly', async () => {
    const { handlePageChange } = useGenericList(mockConfig, mockStore)
    
    await handlePageChange(2)
    
    expect(mockStore.setPage).toHaveBeenCalledWith(2)
    expect(mockStore.fetchList).toHaveBeenCalled()
  })

  it('handles item selection correctly', () => {
    const { selectedItems, handleSelectItem } = useGenericList(mockConfig, mockStore)
    
    handleSelectItem(1, true)
    
    expect(selectedItems.value).toContain(1)
    
    handleSelectItem(1, false)
    
    expect(selectedItems.value).not.toContain(1)
  })

  it('handles select all correctly', () => {
    const { selectedItems, handleSelectAll } = useGenericList(mockConfig, mockStore)
    
    handleSelectAll(true)
    
    expect(selectedItems.value).toEqual([1, 2])
    
    handleSelectAll(false)
    
    expect(selectedItems.value).toEqual([])
  })

  it('handles export correctly', async () => {
    const { handleExport } = useGenericList(mockConfig, mockStore)
    
    await handleExport('csv')
    
    expect(mockStore.fetchList).toHaveBeenCalledWith({ export: 'csv' })
  })

  it('handles bulk actions correctly', async () => {
    const { selectedItems, handleBulkAction } = useGenericList(mockConfig, mockStore)
    
    selectedItems.value = [1, 2]
    
    await handleBulkAction('delete')
    
    expect(mockStore.fetchList).toHaveBeenCalled()
  })

  it('debounces search input correctly', async () => {
    const { handleSearch } = useGenericList(mockConfig, mockStore, { debounceMs: 100 })
    
    handleSearch('t')
    handleSearch('te')
    handleSearch('test')
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 150))
    
    expect(mockStore.setFilters).toHaveBeenCalledTimes(1)
    expect(mockStore.setFilters).toHaveBeenCalledWith({ search: 'test' })
  })

  it('saves filters to localStorage', () => {
    const { saveFiltersToStorage } = useGenericList(mockConfig, mockStore)
    
    saveFiltersToStorage()
    
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'elom_filters_test_list',
      JSON.stringify(mockStore.filters)
    )
  })

  it('loads filters from localStorage', () => {
    const savedFilters = { search: 'saved', status: 'active' }
    localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(savedFilters))
    
    const { loadFiltersFromStorage } = useGenericList(mockConfig, mockStore)
    
    loadFiltersFromStorage()
    
    expect(mockStore.setFilters).toHaveBeenCalledWith(savedFilters)
  })

  it('handles empty results correctly', () => {
    const emptyStore = {
      ...mockStore,
      items: [],
      pagination: { ...mockStore.pagination, count: 0 }
    }
    
    const { items, pagination } = useGenericList(mockConfig, emptyStore)
    
    expect(items.value).toEqual([])
    expect(pagination.value.count).toBe(0)
  })

  it('handles loading state correctly', () => {
    const loadingStore = {
      ...mockStore,
      loading: true
    }
    
    const { loading } = useGenericList(mockConfig, loadingStore)
    
    expect(loading.value).toBe(true)
  })

  it('handles error state correctly', () => {
    const errorStore = {
      ...mockStore,
      error: 'Test error'
    }
    
    const { error } = useGenericList(mockConfig, errorStore)
    
    expect(error.value).toBe('Test error')
  })
})

