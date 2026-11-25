import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { formatCurrency } from '@/utils/formatters'

// F-1104 (ответ владельца 13, B20): «Средняя сумма» в сводке трёх отчётов делилась на число СТРОК отчёта
// (объектов / месяцев / ответственных) — «средняя на объект», а не на закупку. Владелец: средняя — на закупку.
// Ожидание посчитано руками: 77 777 / 55 закупок (а не / 40 строк).

const gt = { total_amount: 77777, purchases: 55, rows_count: 40, avg_amount: 77777 / 55 }
const row = { purchases: 1, total_amount: 10, avg_amount: 10, unique_objects: 1, unique_materials: 1,
  unique_responsibles: 1, object_id: 1, object_name: 'О', responsible_id: 1, responsible_name: 'Р', period: '2026-01' }

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {} }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (String(url).includes('/reports/')) { return Promise.resolve({ data: { count: 40, results: [row], grand_total: gt } }) }
      return Promise.resolve({ data: { results: [], count: 0 } })
    }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

import ByPeriod from '../ByPeriod.vue'
import ByObject from '../ByObject.vue'
import ByResponsible from '../ByResponsible.vue'

const stats = async (cmp: unknown) => {
  const w = mount(cmp as never, { global: { stubs: { ChartContainer: true, ReportPageHeader: true, GenericPagination: true } } })
  await flushPromises()
  await w.vm.$nextTick()
  const vm = w.vm as unknown as { chartStats: { value?: unknown } }
  return (vm.chartStats && typeof vm.chartStats === 'object' && 'value' in vm.chartStats
    ? vm.chartStats.value : vm.chartStats) as Record<string, { label: string; value: string }>
}

describe('Сводка отчётов: средняя — на закупку (F-1104)', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks() })

  for (const [name, cmp] of [['по периодам', ByPeriod], ['по объектам', ByObject], ['по ответственным', ByResponsible]] as const) {
    it(`отчёт ${name}: «Средняя на закупку» = сумма / число закупок`, async () => {
      const cs = await stats(cmp)
      expect(cs.avgAmount.label).toBe('Средняя на закупку')
      expect(cs.avgAmount.value).toBe(formatCurrency(77777 / 55))
    })
  }
})
