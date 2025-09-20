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
    const { hasNext } = usePagination(mockPagination)
    expect(hasNext.value).toBe(true)
  })

  it('calculates hasPrevious correctly', () => {
    const { hasPrevious } = usePagination(mockPagination)
    expect(hasPrevious.value).toBe(false)
  })

  it('calculates hasPrevious when on page 2', () => {
    const pagination = { ...mockPagination, page: 2 }
    const { hasPrevious } = usePagination(pagination)
    expect(hasPrevious.value).toBe(true)
  })

  it('calculates page range correctly', () => {
    const { pageRange } = usePagination(mockPagination)
    expect(pageRange.value).toEqual([1, 2, 3, 4, 5])
  })

  it('calculates page range with maxVisiblePages', () => {
    const { pageRange } = usePagination(mockPagination, { maxVisiblePages: 3 })
    expect(pageRange.value).toEqual([1, 2, 3])
  })

  it('calculates page info correctly', () => {
    const { pageInfo } = usePagination(mockPagination)
    expect(pageInfo.value).toBe('Показано 1-20 из 100')
  })

  it('calculates page info for last page', () => {
    const pagination = { ...mockPagination, page: 5 }
    const { pageInfo } = usePagination(pagination)
    expect(pageInfo.value).toBe('Показано 81-100 из 100')
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
    expect(getAdjacentPages(2)).toEqual([1, 2, 3])
    expect(getAdjacentPages(1)).toEqual([1, 2])
    expect(getAdjacentPages(5)).toEqual([4, 5])
  })
})
