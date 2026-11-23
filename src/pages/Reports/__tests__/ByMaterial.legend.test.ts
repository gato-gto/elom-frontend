import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// F-1072 (ревью F-1062): «Другие» в легенде появлялись, даже когда сумма вне топ-5 равна 0 — на круге
// такого сегмента нет, легенда и диаграмма расходились.
const row = (id: number, amount: number) => ({
  material_id: id, material_name: `M${id}`, material_category: '—', unit: 'шт', qty_total: 1, amount_total: amount,
  avg_price: amount, min_price: amount, max_price: amount, rows: 1, unique_objects: 1, unique_responsibles: 1,
  first_purchase_date: null, last_purchase_date: null, material_description: '', material_manufacturer: '',
  material_is_active: true, material_created_date: null, material_average_price: null, material_min_stock_level: null,
})
let results: unknown[] = []
vi.mock('vue-router', () => ({ useRoute: () => ({ params: {}, query: {} }), useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }))
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn((url: string) => String(url).includes('by-material')
      ? Promise.resolve({ data: { count: results.length, results, grand_total: null } })
      : Promise.resolve({ data: { results: [], count: 0 } })),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}))
import ByMaterial from '../ByMaterial.vue'

async function legendLabels() {
  const w = mount(ByMaterial, { global: { stubs: { ChartContainer: true, ReportPageHeader: true, GenericPagination: true } } })
  await flushPromises()
  const vm = w.vm as any
  const items = vm.chartLegendItems?.value ?? vm.chartLegendItems
  return items.map((i: { label: string }) => i.label)
}

describe('F-1072 ByMaterial: легенда = сегменты диаграммы', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('остаток вне топ-5 равен 0 → «Другие» в легенде нет', async () => {
    results = [row(1, 50), row(2, 40), row(3, 30), row(4, 20), row(5, 10), row(6, 0), row(7, 0)]
    expect(await legendLabels()).not.toContain('Другие')
  })

  it('остаток вне топ-5 > 0 → «Другие» есть', async () => {
    results = [row(1, 50), row(2, 40), row(3, 30), row(4, 20), row(5, 10), row(6, 5), row(7, 1)]
    expect(await legendLabels()).toContain('Другие')
  })
})
