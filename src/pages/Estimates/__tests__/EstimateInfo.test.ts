import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// #65: просмотр сметы группирует строки Раздел→Подраздел с подытогами обоих уровней (дата-независимый
// гард — на проде 0 смет, урок F-932: нужен кейс С ДАННЫМИ, не пустой прод).
const line = (o: Record<string, unknown>) => ({
  id: 1, work_item: null, position_no: '', name: 'X', kind: 'work', kind_display: 'Работа',
  unit: 'шт.', section_name: '', subcategory_name: '', quantity: '1', unit_price: '0', amount: 0, order: 0, ...o,
})
const EST = {
  id: 5, object: 3, object_name: 'O', title: 'T', date: '2026-08-01', currency: 'UZS', note: '',
  total: 275000, created_by_name: 'A',
  lines: [
    line({ id: 1, name: 'Кабель', section_name: 'Монтажные работы', subcategory_name: 'Прокладка кабеля', amount: 6000 }),
    line({ id: 2, name: 'Штробление', section_name: 'Монтажные работы', subcategory_name: 'Штробление', amount: 20000 }),
    line({ id: 3, name: 'Камера', section_name: 'Слаботочные системы', subcategory_name: 'Общие', amount: 250000 }),
    line({ id: 4, name: 'Коэфф', kind: 'coefficient', section_name: 'Монтажные работы', subcategory_name: 'Штробление', amount: null }),
  ],
}
const fetchOne = vi.fn().mockResolvedValue(EST)
vi.mock('@/stores/estimates', () => ({ useEstimatesStore: () => ({ fetchOne, remove: vi.fn() }) }))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))
vi.mock('@/composables/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }))
vi.mock('vue-router', () => ({ useRoute: () => ({ params: { id: '5' } }), useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/components/ListHeader.vue', () => ({ default: { name: 'ListHeader', template: '<div/>' } }))
vi.mock('@/components/LoadingSpinner.vue', () => ({ default: { name: 'LoadingSpinner', template: '<div/>' } }))
vi.mock('@/components/Modal.vue', () => ({ default: { name: 'Modal', template: '<div/>' } }))

import EstimateInfo from '@/pages/Estimates/EstimateInfo.vue'

describe('EstimateInfo — #65 группировка просмотра', () => {
  beforeEach(() => { fetchOne.mockClear() })

  it('группирует строки Раздел→Подраздел с подытогами обоих уровней; коэффициент не в сумме', async () => {
    const w = mount(EstimateInfo)
    await nextTick(); await nextTick()
    const vm = w.vm as unknown as { grouped: Array<{ section: string; sectionTotal: number; subgroups: Array<{ subcategory: string; subTotal: number }> }> }
    const g = vm.grouped
    expect(g.map(s => s.section)).toEqual(['Монтажные работы', 'Слаботочные системы'])
    const mont = g[0]
    expect(mont.subgroups.map(s => s.subcategory)).toEqual(['Прокладка кабеля', 'Штробление'])
    expect(mont.subgroups[0].subTotal).toBe(6000)
    expect(mont.subgroups[1].subTotal).toBe(20000)   // коэффициент (amount=null) НЕ добавлен
    expect(mont.sectionTotal).toBe(26000)
    expect(g[1].sectionTotal).toBe(250000)
    // отрисовка: заголовки разделов видны
    expect(w.text()).toContain('Монтажные работы')
    expect(w.text()).toContain('Прокладка кабеля')
  })

  it('#F-742-harden: драфт-строка → бейдж «ждёт цены» + ИТОГО «предварительный»', async () => {
    fetchOne.mockResolvedValueOnce({ ...EST, unpriced_lines: 1, lines: [
      line({ id: 10, name: 'Драфт-позиция', work_item: 55, section_name: 'Монтажные работы', subcategory_name: 'Прокладка кабеля', amount: 0, is_draft: true }),
    ] })
    const w = mount(EstimateInfo)
    await nextTick(); await nextTick()
    const html = w.html()
    expect(html).toContain('ждёт цены')      // бейдж драфта на строке
    expect(html).toContain('предварительный') // подпись ИТОГО (unpriced_lines>0)
  })

  it('#F-742-harden: коэффициент со scope и contribution → показ вклада + подпись зоны', async () => {
    fetchOne.mockResolvedValueOnce({ ...EST, lines: [
      line({ id: 1, name: 'Монтаж', section_name: 'Монтаж', subcategory_name: '', amount: 100000 }),
      line({ id: 2, name: 'Ночная', kind: 'coefficient', amount: null, contribution: 50000, coeff_scope: 'section', coeff_scope_name: 'Монтаж' }),
    ] })
    const w = mount(EstimateInfo)
    await nextTick(); await nextTick()
    const html = w.html()
    expect(html).toContain('Коэффициенты')   // отдельный блок
    expect(html).toContain('раздел: Монтаж')  // подпись зоны (scopeText)
  })
})
