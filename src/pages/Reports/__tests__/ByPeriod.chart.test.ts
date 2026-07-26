import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import ByPeriod from '../ByPeriod.vue'
import api from '@/api/client'

// F-570: the report chart must be created exactly ONCE per data load. Previously load() both
// called nextTick(updateChart) AND a watch(rows) fired it → two createChart() in one tick. The
// first instance was built on the not-yet-laid-out canvas, then destroyed mid-render-frame, and
// Chart.js's Filler hook called ctx.save() on the torn-down context → uncaught "reading 'save'"
// and an empty plot. This guards against the double-trigger regressing.

vi.mock('@/api/client', () => ({
  default: { get: vi.fn() }
}))

const createChartSpy = vi.fn()
const ChartStub = defineComponent({
  name: 'ChartContainer',
  setup(_props, { expose }) {
    expose({ createChart: createChartSpy, updateChart: vi.fn(), destroyChart: vi.fn() })
    return () => h('div', { class: 'chart-stub' })
  }
})

function mountPage() {
  return mount(ByPeriod, {
    global: {
      stubs: {
        ChartContainer: ChartStub,
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

describe('ByPeriod chart single-render (F-570)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(api.get as any).mockResolvedValue({
      data: {
        results: [
          { period: '2026-01-01', total_amount: 8500000, purchases: 2, unique_objects: 1, unique_materials: 1, unique_responsibles: 1, avg_amount: 4250000 },
          { period: '2026-07-01', total_amount: 1620000, purchases: 2, unique_objects: 1, unique_materials: 1, unique_responsibles: 1, avg_amount: 810000 }
        ],
        count: 2,
        total: null
      }
    })
  })

  it('creates the chart exactly once per data load (no double-trigger race)', async () => {
    mountPage()
    await flushPromises()
    await flushPromises() // let nextTick + the rows watcher settle
    expect(createChartSpy).toHaveBeenCalledTimes(1)
  })

  // F-570b: a reload returning IDENTICAL data must still redraw. ChartContainer hides the
  // <canvas> behind v-if="loading", so a reload remounts the canvas; the old equality-guard
  // skipped the redraw on identical data → permanently blank chart. Guard removed.
  it('redraws on an identical-data reload (canvas may remount; no equality-guard skip)', async () => {
    const wrapper = mountPage()
    await flushPromises()
    await flushPromises()
    expect(createChartSpy).toHaveBeenCalledTimes(1)
    // Second load returns the SAME mocked data (via a re-sort that reloads)
    const vm = wrapper.vm as any
    vm.handleSort('total_amount')
    await flushPromises()
    await flushPromises()
    expect(createChartSpy).toHaveBeenCalledTimes(2)
  })
})
