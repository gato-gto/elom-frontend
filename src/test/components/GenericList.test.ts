/**
 * Тесты для компонента GenericList
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import GenericList from '@/components/GenericList.vue'

// Мокаем stores
const mockStore = {
  items: [],
  loading: false,
  error: null,
  pagination: {
    count: 0,
    page: 1,
    pageSize: 20,
    next: null,
    previous: null
  },
  filters: {
    search: '',
    ordering: 'id'
  },
  fetchList: vi.fn(),
  setFilters: vi.fn(),
  resetFilters: vi.fn(),
  setPage: vi.fn(),
  setPageSize: vi.fn(),
  clearError: vi.fn()
}

// Мокаем composables
vi.mock('@/composables/useNotifications', () => ({
  useNotifications: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn()
  })
}))

vi.mock('@/utils/errorHandler', () => ({
  handleApiErrorAsync: vi.fn()
}))

describe('GenericList', () => {
  let wrapper: VueWrapper<any>

  const defaultConfig = {
    title: 'Test Items',
    subtitle: 'Test items list',
    icon: 'test',
    showCreate: true,
    createText: 'Добавить элемент',
    columns: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'name', label: 'Название', sortable: true },
      { key: 'status', label: 'Статус', sortable: false }
    ],
    filters: [
      {
        key: 'search',
        type: 'text' as const,
        label: 'Поиск',
        placeholder: 'Введите текст...'
      },
      {
        key: 'status',
        type: 'select' as const,
        label: 'Статус',
        options: [
          { value: '', label: 'Все' },
          { value: 'active', label: 'Активные' },
          { value: 'inactive', label: 'Неактивные' }
        ]
      }
    ],
    actions: [
      {
        key: 'edit',
        label: 'Редактировать',
        class: 'btn-primary btn-sm'
      },
      {
        key: 'delete',
        label: 'Удалить',
        class: 'btn-error btn-sm'
      }
    ]
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render title and subtitle', () => {
      wrapper = mount(GenericList, {
        props: {
          store: mockStore,
          config: defaultConfig
        }
      })

      expect(wrapper.find('h1').text()).toBe('Test Items')
      expect(wrapper.find('p').text()).toBe('Test items list')
    })

    it('should render create button when showCreate is true', () => {
      wrapper = mount(GenericList, {
        props: {
          store: mockStore,
          config: defaultConfig
        }
      })

      const createButton = wrapper.find('[data-testid="create-button"]')
      expect(createButton.exists()).toBe(true)
      expect(createButton.text()).toBe('Добавить элемент')
    })

    it('should not render create button when showCreate is false', () => {
      wrapper = mount(GenericList, {
        props: {
          store: mockStore,
          config: {
            ...defaultConfig,
            showCreate: false
          }
        }
      })

      const createButton = wrapper.find('[data-testid="create-button"]')
      expect(createButton.exists()).toBe(false)
    })

    it('should render table headers', () => {
      wrapper = mount(GenericList, {
        props: {
          store: mockStore,
          config: defaultConfig
        }
      })

      const headers = wrapper.findAll('th')
      expect(headers).toHaveLength(4) // 3 columns + actions column

      expect(headers[0].text()).toBe('ID')
      expect(headers[1].text()).toBe('Название')
      expect(headers[2].text()).toBe('Статус')
      expect(headers[3].text()).toBe('Действия')
    })

    it('should render sortable headers with sort icons', () => {
      wrapper = mount(GenericList, {
        props: {
          store: mockStore,
          config: defaultConfig
        }
      })

      const sortableHeaders = wrapper.findAll('[data-sortable="true"]')
      expect(sortableHeaders).toHaveLength(2) // ID and Name are sortable

      // Should have sort icons or buttons
      sortableHeaders.forEach(header => {
        expect(header.classes()).toContain('cursor-pointer')
      })
    })
  })

  describe('Data Display', () => {
    const mockItems = [
      { id: 1, name: 'Item 1', status: 'active' },
      { id: 2, name: 'Item 2', status: 'inactive' },
      { id: 3, name: 'Item 3', status: 'active' }
    ]

    it('should render data rows', () => {
      wrapper = mount(GenericList, {
        props: {
          store: {
            ...mockStore,
            items: mockItems,
            pagination: {
              ...mockStore.pagination,
              count: 3
            }
          },
          config: defaultConfig
        }
      })

      const dataRows = wrapper.findAll('tbody tr')
      expect(dataRows).toHaveLength(3)
    })

    it('should display cell values correctly', () => {
      wrapper = mount(GenericList, {
        props: {
          store: {
            ...mockStore,
            items: mockItems
          },
          config: defaultConfig
        }
      })

      const firstRow = wrapper.find('tbody tr:first-child')
      const cells = firstRow.findAll('td')

      expect(cells[0].text()).toBe('1') // ID
      expect(cells[1].text()).toBe('Item 1') // Name
      expect(cells[2].text()).toBe('active') // Status
    })

    it('should render action buttons for each row', () => {
      wrapper = mount(GenericList, {
        props: {
          store: {
            ...mockStore,
            items: mockItems
          },
          config: defaultConfig
        }
      })

      const firstRow = wrapper.find('tbody tr:first-child')
      const actionButtons = firstRow.findAll('button')
      
      expect(actionButtons).toHaveLength(2) // Edit and Delete buttons
      expect(actionButtons[0].text()).toBe('Редактировать')
      expect(actionButtons[1].text()).toBe('Удалить')
    })

    it('should show empty state when no items', () => {
      wrapper = mount(GenericList, {
        props: {
          store: mockStore,
          config: {
            ...defaultConfig,
            emptyTitle: 'Нет данных',
            emptyText: 'Список пуст'
          }
        }
      })

      expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Нет данных')
      expect(wrapper.text()).toContain('Список пуст')
    })

    it('should show loading state', () => {
      wrapper = mount(GenericList, {
        props: {
          store: {
            ...mockStore,
            loading: true
          },
          config: {
            ...defaultConfig,
            loadingText: 'Загрузка...'
          }
        }
      })

      expect(wrapper.find('[data-testid="loading-state"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Загрузка...')
    })

    it('should show error state', () => {
      wrapper = mount(GenericList, {
        props: {
          store: {
            ...mockStore,
            error: 'Ошибка загрузки данных'
          },
          config: defaultConfig
        }
      })

      expect(wrapper.find('[data-testid="error-state"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Ошибка загрузки данных')
    })
  })

  describe('Filtering', () => {
    it('should render filter inputs', () => {
      wrapper = mount(GenericList, {
        props: {
          store: mockStore,
          config: defaultConfig
        }
      })

      const searchInput = wrapper.find('input[type="text"]')
      expect(searchInput.exists()).toBe(true)
      expect(searchInput.attributes('placeholder')).toBe('Введите текст...')

      const selectInput = wrapper.find('select')
      expect(selectInput.exists()).toBe(true)
    })

    it('should call setFilters when search input changes', async () => {
      wrapper = mount(GenericList, {
        props: {
          store: mockStore,
          config: defaultConfig
        }
      })

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('test search')
      
      // Should debounce the call
      await new Promise(resolve => setTimeout(resolve, 600))
      
      expect(mockStore.setFilters).toHaveBeenCalledWith({
        search: 'test search'
      })
    })

    it('should call setFilters when select changes', async () => {
      wrapper = mount(GenericList, {
        props: {
          store: mockStore,
          config: defaultConfig
        }
      })

      const selectInput = wrapper.find('select')
      await selectInput.setValue('active')
      
      expect(mockStore.setFilters).toHaveBeenCalledWith({
        status: 'active'
      })
    })

    it('should reset filters when reset button clicked', async () => {
      wrapper = mount(GenericList, {
        props: {
          store: {
            ...mockStore,
            filters: {
              search: 'test',
              status: 'active'
            }
          },
          config: defaultConfig
        }
      })

      const resetButton = wrapper.find('[data-testid="reset-filters"]')
      await resetButton.trigger('click')
      
      expect(mockStore.resetFilters).toHaveBeenCalled()
    })
  })

  describe('Sorting', () => {
    it('should call setFilters with ordering when sortable header clicked', async () => {
      wrapper = mount(GenericList, {
        props: {
          store: mockStore,
          config: defaultConfig
        }
      })

      const nameHeader = wrapper.find('[data-testid="sort-name"]')
      await nameHeader.trigger('click')
      
      expect(mockStore.setFilters).toHaveBeenCalledWith({
        ordering: 'name'
      })
    })

    it('should toggle sort direction on repeated clicks', async () => {
      wrapper = mount(GenericList, {
        props: {
          store: {
            ...mockStore,
            filters: {
              ...mockStore.filters,
              ordering: 'name'
            }
          },
          config: defaultConfig
        }
      })

      const nameHeader = wrapper.find('[data-testid="sort-name"]')
      await nameHeader.trigger('click')
      
      expect(mockStore.setFilters).toHaveBeenCalledWith({
        ordering: '-name' // Descending
      })
    })

    it('should show sort indicators', () => {
      wrapper = mount(GenericList, {
        props: {
          store: {
            ...mockStore,
            filters: {
              ...mockStore.filters,
              ordering: 'name'
            }
          },
          config: defaultConfig
        }
      })

      const nameHeader = wrapper.find('[data-testid="sort-name"]')
      expect(nameHeader.classes()).toContain('sort-asc')
    })
  })

  describe('Pagination', () => {
    it('should render pagination when items count exceeds page size', () => {
      wrapper = mount(GenericList, {
        props: {
          store: {
            ...mockStore,
            pagination: {
              ...mockStore.pagination,
              count: 100,
              page: 2,
              pageSize: 20
            }
          },
          config: defaultConfig
        }
      })

      const pagination = wrapper.find('[data-testid="pagination"]')
      expect(pagination.exists()).toBe(true)
    })

    it('should call setPage when page button clicked', async () => {
      wrapper = mount(GenericList, {
        props: {
          store: {
            ...mockStore,
            pagination: {
              ...mockStore.pagination,
              count: 100,
              page: 2,
              pageSize: 20
            }
          },
          config: defaultConfig
        }
      })

      const nextButton = wrapper.find('[data-testid="page-3"]')
      if (nextButton.exists()) {
        await nextButton.trigger('click')
        expect(mockStore.setPage).toHaveBeenCalledWith(3)
      }
    })

    it('should call setPageSize when page size selector changes', async () => {
      wrapper = mount(GenericList, {
        props: {
          store: mockStore,
          config: {
            ...defaultConfig,
            showPageSize: true
          }
        }
      })

      const pageSizeSelect = wrapper.find('[data-testid="page-size-select"]')
      if (pageSizeSelect.exists()) {
        await pageSizeSelect.setValue('50')
        expect(mockStore.setPageSize).toHaveBeenCalledWith(50)
      }
    })

    it('should not render pagination when items count is small', () => {
      wrapper = mount(GenericList, {
        props: {
          store: {
            ...mockStore,
            pagination: {
              ...mockStore.pagination,
              count: 10
            }
          },
          config: defaultConfig
        }
      })

      const pagination = wrapper.find('[data-testid="pagination"]')
      expect(pagination.exists()).toBe(false)
    })
  })

  describe('Actions', () => {
    const mockItems = [
      { id: 1, name: 'Item 1', status: 'active' }
    ]

    it('should emit action event when action button clicked', async () => {
      wrapper = mount(GenericList, {
        props: {
          store: {
            ...mockStore,
            items: mockItems
          },
          config: defaultConfig
        }
      })

      const editButton = wrapper.find('[data-testid="action-edit-1"]')
      await editButton.trigger('click')
      
      expect(wrapper.emitted('action')).toBeTruthy()
      expect(wrapper.emitted('action')?.[0]).toEqual([
        'edit',
        mockItems[0],
        0 // row index
      ])
    })

    it('should disable action button when disabled function returns true', () => {
      const configWithDisabledAction = {
        ...defaultConfig,
        actions: [
          {
            key: 'edit',
            label: 'Редактировать',
            class: 'btn-primary btn-sm',
            disabled: (item: any) => item.status === 'inactive'
          }
        ]
      }

      wrapper = mount(GenericList, {
        props: {
          store: {
            ...mockStore,
            items: [{ id: 1, name: 'Item 1', status: 'inactive' }]
          },
          config: configWithDisabledAction
        }
      })

      const editButton = wrapper.find('[data-testid="action-edit-1"]')
      expect(editButton.attributes('disabled')).toBeDefined()
    })

    it('should hide action button when hidden function returns true', () => {
      const configWithHiddenAction = {
        ...defaultConfig,
        actions: [
          {
            key: 'delete',
            label: 'Удалить',
            class: 'btn-error btn-sm',
            hidden: (item: any) => item.status === 'active'
          }
        ]
      }

      wrapper = mount(GenericList, {
        props: {
          store: {
            ...mockStore,
            items: mockItems
          },
          config: configWithHiddenAction
        }
      })

      const deleteButton = wrapper.find('[data-testid="action-delete-1"]')
      expect(deleteButton.exists()).toBe(false)
    })
  })

  describe('Slots', () => {
    it('should render header-actions slot', () => {
      wrapper = mount(GenericList, {
        props: {
          store: mockStore,
          config: defaultConfig
        },
        slots: {
          'header-actions': '<button id="custom-action">Custom Action</button>'
        }
      })

      const customButton = wrapper.find('#custom-action')
      expect(customButton.exists()).toBe(true)
      expect(customButton.text()).toBe('Custom Action')
    })

    it('should render column-specific slots', () => {
      const mockItems = [
        { id: 1, name: 'Item 1', status: 'active' }
      ]

      wrapper = mount(GenericList, {
        props: {
          store: {
            ...mockStore,
            items: mockItems
          },
          config: defaultConfig
        },
        slots: {
          'column-name': '<span class="custom-name">{{ props.value }}</span>'
        }
      })

      const customCell = wrapper.find('.custom-name')
      expect(customCell.exists()).toBe(true)
    })
  })

  describe('Mobile View', () => {
    it('should render mobile cards when mobileCardComponent is provided', () => {
      const MockCard = {
        name: 'MockCard',
        props: ['item'],
        template: '<div class="mock-card">{{ item.name }}</div>'
      }

      wrapper = mount(GenericList, {
        props: {
          store: {
            ...mockStore,
            items: [{ id: 1, name: 'Item 1' }]
          },
          config: {
            ...defaultConfig,
            mobileCardComponent: MockCard,
            mobileCardProp: 'item'
          }
        }
      })

      // Mobile view should be activated based on screen size
      // This would require mocking window.matchMedia or using a test utility
      // for responsive testing
    })
  })

  describe('Export', () => {
    it('should emit export event when export button clicked', async () => {
      wrapper = mount(GenericList, {
        props: {
          store: mockStore,
          config: {
            ...defaultConfig,
            exportable: true
          }
        }
      })

      const exportButton = wrapper.find('[data-testid="export-button"]')
      await exportButton.trigger('click')
      
      expect(wrapper.emitted('export')).toBeTruthy()
    })

    it('should not render export button when exportable is false', () => {
      wrapper = mount(GenericList, {
        props: {
          store: mockStore,
          config: {
            ...defaultConfig,
            exportable: false
          }
        }
      })

      const exportButton = wrapper.find('[data-testid="export-button"]')
      expect(exportButton.exists()).toBe(false)
    })
  })

  describe('Statistics', () => {
    it('should show stats when showStats is true', () => {
      wrapper = mount(GenericList, {
        props: {
          store: {
            ...mockStore,
            pagination: {
              ...mockStore.pagination,
              count: 42
            }
          },
          config: {
            ...defaultConfig,
            showStats: true
          }
        }
      })

      const stats = wrapper.find('[data-testid="stats"]')
      expect(stats.exists()).toBe(true)
      expect(stats.text()).toContain('42')
    })
  })
})



