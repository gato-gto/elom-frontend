import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { formatCurrency } from '@/utils/formatters'

// F-721: сводка отчёта (Общая сумма/Всего/Уникальных материалов) должна браться из BE grand_total
// (агрегат по ВСЕМУ отфильтрованному отчёту), а не reduce'ом по одной странице. Мок API отдаёт
// grand_total, ЗАВЕДОМО ОТЛИЧНЫЙ от суммы строк страницы → chartStats обязан показать grand_total.

const reportResponse = {
  count: 50,
  results: [
    // страница: одна строка на 10 (если бы FE считал reduce по странице — было бы 10)
    { material_id: 1, material_name: 'M1', material_category: '—', unit: 'шт',
      qty_total: 1, amount_total: 10, avg_price: 10, min_price: 10, max_price: 10, rows: 1,
      unique_objects: 1, unique_responsibles: 1, first_purchase_date: null, last_purchase_date: null,
      material_description: '', material_manufacturer: '', material_is_active: true,
      material_created_date: null, material_average_price: null, material_min_stock_level: null },
  ],
  grand_total: { amount_total: 99999, rows: 88, rows_count: 50, avg_amount: 2000 }, // по ВСЕМУ отчёту
}

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {} }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (String(url).includes('by-material')) { return Promise.resolve({ data: reportResponse }) }
      return Promise.resolve({ data: { results: [], count: 0 } })
    }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

import ByMaterial from '../ByMaterial.vue'

describe('F-721: ByMaterial сводка из grand_total (не reduce по странице)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('chartStats берёт Общую сумму/Всего/Уникальных из BE grand_total', async () => {
    const wrapper = mount(ByMaterial, {
      global: { stubs: { ChartContainer: true, ReportPageHeader: true, GenericPagination: true } },
    })
    await flushPromises()
    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any
    const cs = typeof vm.chartStats === 'object' && vm.chartStats.value !== undefined
      ? vm.chartStats.value : vm.chartStats

    // из grand_total (99999/88/50), а НЕ из суммы строки страницы (10/1/1)
    expect(cs.totalAmount.value).toBe(formatCurrency(99999))
    expect(cs.totalPurchases.value).toBe('88')
    expect(cs.uniqueMaterials.value).toBe('50')
  })
})
