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
    expect(visiblePages.value).toEqual([1, 2, 3])
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
    expect(getAdjacentPages(2)).toEqual([2, 3])
    expect(getAdjacentPages(1)).toEqual([2])
    expect(getAdjacentPages(5)).toEqual([4, 5])
  })
})