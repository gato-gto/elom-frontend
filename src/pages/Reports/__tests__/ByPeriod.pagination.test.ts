import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ByPeriod from '../ByPeriod.vue'
import api from '@/api/client'

// F-073: ByPeriod/ByMaterial/ByResponsible must reset to page 1 when the filters, the sort,
// or a reset happen — otherwise, after paging deep, the next load requests an out-of-range
// page and shows a wrong/empty result. We assert this via the page param of the api.get URL.

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { results: [], count: 0, total: null } })
  }
}))

function lastGetUrl(): string {
  const calls = (api.get as any).mock.calls
  return calls[calls.length - 1]?.[0] ?? ''
}

function mountPage() {
  return mount(ByPeriod, {
    global: {
      stubs: {
        ChartContainer: true,
        ModernPagination: true,
        FilterPanel: true,
        FilterField: true,
        ListHeader: true,
        ExportButton: true,
        TableSkeleton: true,
        LoadingSpinner: true
      }
    }
  })
}

describe('ByPeriod pagination reset (F-073)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('initial load requests page 1', async () => {
    mountPage()
    await flushPromises()
    expect(lastGetUrl()).toContain('page=1')
  })

  it('resets to page 1 when sorting after paging deep', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const vm = wrapper.vm as any
    vm.currentPage = 5
    vm.handleSort('material')
    await flushPromises()
    expect(lastGetUrl()).toContain('page=1')
    expect(lastGetUrl()).not.toContain('page=5')
  })

  it('resets to page 1 when filters change after paging deep', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const vm = wrapper.vm as any
    vm.currentPage = 7
    vm.dateFrom = '2026-01-01'
    await flushPromises()
    // the filter watcher is debounced; wait for it
    await new Promise(r => setTimeout(r, 400))
    await flushPromises()
    expect(lastGetUrl()).toContain('page=1')
  })

  it('resets to page 1 on resetFilters after paging deep', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const vm = wrapper.vm as any
    vm.currentPage = 4
    vm.resetFilters()
    await flushPromises()
    // resetFilters clears filters (which also triggers the debounced watcher) and pages to 1
    await new Promise(r => setTimeout(r, 400))
    await flushPromises()
    expect(vm.currentPage).toBe(1)
    expect(lastGetUrl()).toContain('page=1')
  })
})
