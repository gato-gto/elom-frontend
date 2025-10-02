import { computed } from 'vue'
// import { ref, watch } from 'vue' // Не используются
import type { PaginationState } from '@/stores/base'

export interface PaginationConfig {
  defaultPageSize?: number
  pageSizeOptions?: number[]
  maxVisiblePages?: number
  showPageSizeSelector?: boolean
  showJumpToPage?: boolean
}

export function usePagination(
  pagination: PaginationState,
  config: PaginationConfig = {}
) {
  const {
    defaultPageSize = 20,
    pageSizeOptions = [10, 20, 50, 100],
    maxVisiblePages = 5,
    showPageSizeSelector = true,
    showJumpToPage = true
  } = config

  // Вычисляемые свойства
  const totalPages = computed(() => {
    return Math.ceil(pagination.count / pagination.pageSize)
  })

  const startItem = computed(() => {
    return (pagination.page - 1) * pagination.pageSize + 1
  })

  const endItem = computed(() => {
    return Math.min(pagination.page * pagination.pageSize, pagination.count)
  })

  const hasNextPage = computed(() => {
    return pagination.page < totalPages.value
  })

  const hasPreviousPage = computed(() => {
    return pagination.page > 1
  })

  const visiblePages = computed(() => {
    const pages: (number | string)[] = []
    
    if (totalPages.value <= maxVisiblePages) {
      // Показываем все страницы
      for (let i = 1; i <= totalPages.value; i++) {
        pages.push(i)
      }
    } else {
      // Показываем страницы с многоточием
      const half = Math.floor(maxVisiblePages / 2)
      let start = Math.max(1, pagination.page - half)
      const end = Math.min(totalPages.value, start + maxVisiblePages - 1)
      
      if (end - start + 1 < maxVisiblePages) {
        start = Math.max(1, end - maxVisiblePages + 1)
      }
      
      if (start > 1) {
        pages.push(1)
        if (start > 2) {
          pages.push('...')
        }
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (end < totalPages.value) {
        if (end < totalPages.value - 1) {
          pages.push('...')
        }
        pages.push(totalPages.value)
      }
    }
    
    return pages
  })

  const pageSizeOptionsComputed = computed(() => {
    return pageSizeOptions.map(size => ({
      value: size,
      label: size.toString()
    }))
  })

  // Методы
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value && page !== pagination.page) {
      pagination.page = page
    }
  }

  const goToNextPage = () => {
    if (hasNextPage.value) {
      goToPage(pagination.page + 1)
    }
  }

  const goToPreviousPage = () => {
    if (hasPreviousPage.value) {
      goToPage(pagination.page - 1)
    }
  }

  const goToFirstPage = () => {
    goToPage(1)
  }

  const goToLastPage = () => {
    goToPage(totalPages.value)
  }

  const changePageSize = (newSize: number) => {
    if (pageSizeOptions.includes(newSize)) {
      pagination.pageSize = newSize
      // Сбрасываем на первую страницу при изменении размера
      pagination.page = 1
    }
  }

  const resetPagination = () => {
    pagination.page = 1
    pagination.pageSize = defaultPageSize
  }

  // Утилиты для отображения
  const getPageInfo = () => {
    return {
      current: pagination.page,
      total: totalPages.value,
      start: startItem.value,
      end: endItem.value,
      count: pagination.count,
      pageSize: pagination.pageSize
    }
  }

  const getPageRange = () => {
    return `${startItem.value}-${endItem.value} из ${pagination.count}`
  }

  // Проверка валидности страницы
  const isValidPage = (page: number) => {
    return page >= 1 && page <= totalPages.value
  }

  // Получение соседних страниц
  const getAdjacentPages = (count: number = 2) => {
    const pages: number[] = []
    const start = Math.max(1, pagination.page - count)
    const end = Math.min(totalPages.value, pagination.page + count)
    
    for (let i = start; i <= end; i++) {
      if (i !== pagination.page) {
        pages.push(i)
      }
    }
    
    return pages
  }

  return {
    // Computed
    totalPages,
    startItem,
    endItem,
    hasNextPage,
    hasPreviousPage,
    visiblePages,
    pageSizeOptions: pageSizeOptionsComputed,
    
    // Methods
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    changePageSize,
    resetPagination,
    
    // Utils
    getPageInfo,
    getPageRange,
    isValidPage,
    getAdjacentPages,
    
    // Config
    config: {
      defaultPageSize,
      pageSizeOptions,
      maxVisiblePages,
      showPageSizeSelector,
      showJumpToPage
    }
  }
}

// Хук для работы с пагинацией в компонентах (переименован для избежания конфликтов)
export function usePaginationWithHandlers(
  pagination: PaginationState,
  onPageChange?: (page: number) => void,
  onPageSizeChange?: (size: number) => void
) {
  const paginationUtils = usePagination(pagination)

  // Обработчики событий
  const handlePageChange = (page: number) => {
    paginationUtils.goToPage(page)
    onPageChange?.(page)
  }

  const handlePageSizeChange = (size: number) => {
    paginationUtils.changePageSize(size)
    onPageSizeChange?.(size)
  }

  return {
    ...paginationUtils,
    handlePageChange,
    handlePageSizeChange
  }
}
