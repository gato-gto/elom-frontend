import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { formatCurrency } from '@/utils/formatters'

// F-721: покрываем ВТОРОЙ паттерн ключей grand_total — total_amount/purchases (by-object/period/
// responsible), в дополнение к by-material (amount_total/rows). chartStats обязан брать сводку из BE
// grand_total, а не reduce'ом по странице; avg = total_amount / rows_count (на строку отчёта).

const reportResponse = {
  count: 40,
  results: [
    { period: '2026-01', purchases: 1, total_amount: 10, unique_objects: 1, unique_materials: 1,
      unique_responsibles: 1, avg_amount: 10 },
  ],
  grand_total: { total_amount: 77777, purchases: 55, rows_count: 40, avg_amount: 1900 },
}

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {} }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (String(url).includes('by-period')) return Promise.resolve({ data: reportResponse })
      return Promise.resolve({ data: { results: [], count: 0 } })
    }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

import ByPeriod from '../ByPeriod.vue'

describe('F-721: ByPeriod сводка из grand_total (паттерн total_amount/purchases)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('chartStats: Общая сумма/Всего/Средняя из BE grand_total, не reduce по странице', async () => {
    const wrapper = mount(ByPeriod, {
      global: { stubs: { ChartContainer: true, ReportPageHeader: true, GenericPagination: true } },
    })
    await flushPromises()
    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any
    const cs = typeof vm.chartStats === 'object' && vm.chartStats.value !== undefined
      ? vm.chartStats.value : vm.chartStats

    expect(cs.totalAmount.value).toBe(formatCurrency(77777))          // из grand_total, не 10
    expect(cs.totalPurchases.value).toBe('55')                        // из grand_total, не 1
    expect(cs.avgAmount.value).toBe(formatCurrency(77777 / 40))       // total_amount / rows_count
  })
})
