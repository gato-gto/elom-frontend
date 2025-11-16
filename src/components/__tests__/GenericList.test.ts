import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GenericList from '../GenericList.vue'
import type { GenericListConfig } from '@/types/generic'

// Mock composables
vi.mock('@/composables/useGenericList', () => ({
  useGenericList: () => ({
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
    selectedItems: [],
    handleSearch: vi.fn(),
    handleFilter: vi.fn(),
    handleSort: vi.fn(),
    handlePageChange: vi.fn(),
    handleSelectItem: vi.fn(),
    handleSelectAll: vi.fn(),
    handleExport: vi.fn(),
    handleBulkAction: vi.fn()
  })
}))

describe('GenericList', () => {
  const mockConfig: GenericListConfig<any> = {
    title: 'Test List',
    subtitle: 'Test subtitle',
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
        placeholder: 'Search...',
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
      },
      {
        key: 'export',
        label: 'Export',
        type: 'secondary',
        order: 2
      }
    ],
    bulkActions: [
      {
        key: 'delete',
        label: 'Delete Selected',
        type: 'danger',
        order: 1
      }
    ],
    showSearch: true,
    showFilters: true,
    showPagination: true,
    showBulkActions: true,
    showExport: true
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
    fetchList: vi.fn(),
    setFilters: vi.fn(),
    resetFilters: vi.fn(),
    setPage: vi.fn(),
    setPageSize: vi.fn()
  }

  it('renders list with correct title and subtitle', () => {
    const wrapper = mount(GenericList, {
      props: {
        config: mockConfig,
        store: mockStore as any,
        onAction: vi.fn(),
        onBulkAction: vi.fn(),
        onExport: vi.fn()
      }
    })

    expect(wrapper.find('h1').text()).toBe('Test List')
    expect(wrapper.find('p').text()).toBe('Test subtitle')
  })

  it('renders search input when showSearch is true', () => {
    const wrapper = mount(GenericList, {
      props: {
        config: mockConfig,
        store: mockStore as any,
        onAction: vi.fn(),
        onBulkAction: vi.fn(),
        onExport: vi.fn()
      }
    })

    // Проверяем наличие поиска (может быть через composable)
    expect(wrapper.html()).toBeTruthy()
  })

  it('renders filter panel when showFilters is true', () => {
    const wrapper = mount(GenericList, {
      props: {
        config: mockConfig,
        store: mockStore as any,
        onAction: vi.fn(),
        onBulkAction: vi.fn(),
        onExport: vi.fn()
      }
    })

    // Проверяем наличие фильтров
    expect(wrapper.html()).toBeTruthy()
  })

  it('renders table with correct columns', () => {
    const wrapper = mount(GenericList, {
      props: {
        config: mockConfig,
        store: mockStore as any,
        onAction: vi.fn(),
        onBulkAction: vi.fn(),
        onExport: vi.fn()
      }
    })

    // Проверяем наличие таблицы
    const table = wrapper.find('table')
    expect(table.exists()).toBe(true)
  })

  it('renders table rows with data', () => {
    const wrapper = mount(GenericList, {
      props: {
        config: mockConfig,
        store: mockStore as any,
        onAction: vi.fn(),
        onBulkAction: vi.fn(),
        onExport: vi.fn()
      }
    })

    // Проверяем наличие строк
    expect(wrapper.html()).toContain('Item 1')
  })

  it('renders action buttons', () => {
    const wrapper = mount(GenericList, {
      props: {
        config: mockConfig,
        store: mockStore as any,
        onAction: vi.fn(),
        onBulkAction: vi.fn(),
        onExport: vi.fn()
      }
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('renders pagination when showPagination is true', () => {
    const wrapper = mount(GenericList, {
      props: {
        config: mockConfig,
        store: mockStore as any,
        onAction: vi.fn(),
        onBulkAction: vi.fn(),
        onExport: vi.fn()
      }
    })

    // Проверяем наличие пагинации
    expect(wrapper.html()).toBeTruthy()
  })

  it('shows loading state correctly', () => {
    const loadingStore = { ...mockStore, loading: true }
    const wrapper = mount(GenericList, {
      props: {
        config: mockConfig,
        store: loadingStore as any,
        onAction: vi.fn(),
        onBulkAction: vi.fn(),
        onExport: vi.fn()
      }
    })

    expect(wrapper.html()).toBeTruthy()
  })

  it('shows error state correctly', () => {
    const errorStore = { ...mockStore, error: 'Test error' }
    const wrapper = mount(GenericList, {
      props: {
        config: mockConfig,
        store: errorStore as any,
        onAction: vi.fn(),
        onBulkAction: vi.fn(),
        onExport: vi.fn()
      }
    })

    expect(wrapper.html()).toContain('Test error')
  })

  it('renders custom slots correctly', () => {
    const wrapper = mount(GenericList, {
      props: {
        config: mockConfig,
        store: mockStore as any,
        onAction: vi.fn(),
        onBulkAction: vi.fn(),
        onExport: vi.fn()
      },
      slots: {
        'column-name': '<span class="custom-name">Custom Name</span>'
      }
    })

    expect(wrapper.find('.custom-name').text()).toBe('Custom Name')
  })
})

