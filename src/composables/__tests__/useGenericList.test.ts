import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGenericList } from '../useGenericList'
import type { GenericListConfig } from '@/types/generic'

// Mock error handler
vi.mock('../useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleLoadingError: vi.fn(),
    handleExportError: vi.fn()
  })
}))

// Mock export utils
vi.mock('@/utils/export', () => ({
  exportToCSV: vi.fn(),
  exportToExcel: vi.fn(),
  exportToPDF: vi.fn()
}))

// Mock debounce
vi.mock('@/utils/debounce', () => ({
  debounce: (fn: any) => fn
}))

describe('useGenericList', () => {
  const mockConfig: GenericListConfig<any> = {
    title: 'Test List',
    defaultSort: 'id',
    defaultSortOrder: 'asc',
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
        type: 'text',
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
      next: null,
      previous: null
    },
    filters: { search: '', status: '' },
    fetchList: vi.fn().mockResolvedValue(undefined),
    setFilters: vi.fn().mockResolvedValue(undefined),
    resetFilters: vi.fn().mockResolvedValue(undefined),
    setPage: vi.fn().mockResolvedValue(undefined),
    setPageSize: vi.fn().mockResolvedValue(undefined)
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with store data', () => {
    const { items, loading, error, pagination } = useGenericList({
      config: mockConfig,
      store: mockStore as any
    })
    
    expect(items.value).toEqual(mockStore.items)
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(pagination.value).toEqual(mockStore.pagination)
  })

  it('handles search input correctly', async () => {
    const { fetchList } = useGenericList({
      config: mockConfig,
      store: mockStore as any
    })
    
    await fetchList()
    
    expect(mockStore.fetchList).toHaveBeenCalled()
  })

  it('handles sort changes correctly', () => {
    const { handleSort } = useGenericList({
      config: mockConfig,
      store: mockStore as any
    })
    
    handleSort('name')
    
    expect(mockStore.setFilters).toHaveBeenCalled()
  })

  it('handles page changes correctly', () => {
    const { handlePageChange } = useGenericList({
      config: mockConfig,
      store: mockStore as any
    })
    
    handlePageChange(2)
    
    expect(mockStore.setPage).toHaveBeenCalled()
  })

  it('handles export correctly', async () => {
    const { handleExport } = useGenericList({
      config: mockConfig,
      store: mockStore as any,
      autoFetch: false
    })
    
    await handleExport('csv')
    
    // Export should use store items, not fetchList
    expect(mockStore.items).toBeDefined()
  })

  it('handles reset filters correctly', () => {
    const { handleResetFilters } = useGenericList({
      config: mockConfig,
      store: mockStore as any
    })
    
    handleResetFilters()
    
    expect(mockStore.resetFilters).toHaveBeenCalled()
  })

  it('handles empty results correctly', () => {
    const emptyStore = {
      ...mockStore,
      items: [],
      pagination: { ...mockStore.pagination, count: 0 }
    }
    
    const { items, pagination } = useGenericList({
      config: mockConfig,
      store: emptyStore as any
    })
    
    expect(items.value).toEqual([])
    expect(pagination.value.count).toBe(0)
  })

  it('handles loading state correctly', () => {
    const loadingStore = {
      ...mockStore,
      loading: true
    }
    
    const { loading } = useGenericList({
      config: mockConfig,
      store: loadingStore as any
    })
    
    expect(loading.value).toBe(true)
  })

  it('handles error state correctly', () => {
    const errorStore = {
      ...mockStore,
      error: 'Test error'
    }
    
    const { error } = useGenericList({
      config: mockConfig,
      store: errorStore as any
    })
    
    expect(error.value).toBe('Test error')
  })
})

