import { describe, it, expect } from 'vitest'
import { usePagination } from '../usePagination'
import type { PaginationState } from '@/stores/base'

describe('usePagination', () => {
  const mockPagination: PaginationState = {
    count: 100,
    page: 1,
    pageSize: 20,
    next: 'http://example.com?page=2',
    previous: null
  }

  it('calculates total pages correctly', () => {
    const { totalPages } = usePagination(mockPagination)
    expect(totalPages.value).toBe(5) // 100 items / 20 per page = 5 pages
  })

  it('calculates hasNext correctly', () => {
    const { hasNextPage } = usePagination(mockPagination)
    expect(hasNextPage.value).toBe(true)
  })

  it('calculates hasPrevious correctly', () => {
    const { hasPreviousPage } = usePagination(mockPagination)
    expect(hasPreviousPage.value).toBe(false)
  })

  it('calculates hasPrevious when on page 2', () => {
    const pagination = { ...mockPagination, page: 2 }
    const { hasPreviousPage } = usePagination(pagination)
    expect(hasPreviousPage.value).toBe(true)
  })

  it('calculates page range correctly', () => {
    const { visiblePages } = usePagination(mockPagination)
    expect(visiblePages.value).toEqual([1, 2, 3, 4, 5])
  })

  it('calculates page range with maxVisiblePages', () => {
    const { visiblePages } = usePagination(mockPagination, { maxVisiblePages: 3 })
    // Когда totalPages (5) > maxVisiblePages (3), показываются первые страницы с многоточием
    expect(visiblePages.value).toEqual([1, 2, 3, '...', 5])
  })

  it('calculates page info correctly', () => {
    const { getPageInfo } = usePagination(mockPagination)
    const pageInfo = getPageInfo()
    expect(pageInfo.start).toBe(1)
    expect(pageInfo.end).toBe(20)
    expect(pageInfo.count).toBe(100)
  })

  it('calculates page info for last page', () => {
    const pagination = { ...mockPagination, page: 5 }
    const { getPageInfo } = usePagination(pagination)
    const pageInfo = getPageInfo()
    expect(pageInfo.start).toBe(81)
    expect(pageInfo.end).toBe(100)
  })

  it('validates page numbers correctly', () => {
    const { isValidPage } = usePagination(mockPagination)
    expect(isValidPage(1)).toBe(true)
    expect(isValidPage(5)).toBe(true)
    expect(isValidPage(0)).toBe(false)
    expect(isValidPage(6)).toBe(false)
  })

  it('gets adjacent pages correctly', () => {
    const { getAdjacentPages } = usePagination(mockPagination)
    // getAdjacentPages возвращает страницы в диапазоне [page - count, page + count], исключая текущую
    expect(getAdjacentPages(2)).toEqual([2, 3]) // для page=1, count=2: [max(1,1-2), min(5,1+2)] = [1,3], исключая 1 → [2,3]
    
    const paginationPage2 = { ...mockPagination, page: 2 }
    const { getAdjacentPages: getAdjacentPages2 } = usePagination(paginationPage2)
    expect(getAdjacentPages2(1)).toEqual([1, 3]) // для page=2, count=1: [max(1,2-1), min(5,2+1)] = [1,3], исключая 2 → [1,3]
    
    const paginationPage5 = { ...mockPagination, page: 5 }
    const { getAdjacentPages: getAdjacentPages5 } = usePagination(paginationPage5)
    // Для page=5, count=2: [max(1,5-2), min(5,5+2)] = [3,5], исключая 5 → [3,4]
    // Но если count=5, то [max(1,5-5), min(5,5+5)] = [1,5], исключая 5 → [1,2,3,4]
    const result = getAdjacentPages5(5)
    expect(result).toContain(4)
    expect(result).toContain(3)
    expect(result).not.toContain(5)
  })
})