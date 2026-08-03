import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// #65: форма-документ с авто-группировкой. Строка несёт снапшот пути (section/subcategory) из выбранной
// позиции; buildPayloadLines — три режима (а) work_item, (б) category+name, (в) свободная.
const { create, update, fetchOne } = vi.hoisted(() => ({
  create: vi.fn().mockResolvedValue({ id: 7 }),
  update: vi.fn().mockResolvedValue({ id: 7 }),
  fetchOne: vi.fn(),
}))

vi.mock('@/stores/estimates', () => ({ useEstimatesStore: () => ({ create, update, fetchOne }) }))
vi.mock('@/stores/objects', () => ({ useObjectsStore: () => ({ items: [{ id: 347, name: 'Тест-объект' }], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))

const push = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: { object: '347' } }),
  useRouter: () => ({ push }),
}))
vi.mock('@/components/WorkItemSearchSelect.vue', () => ({ default: { name: 'WorkItemSearchSelect', template: '<div />' } }))
vi.mock('@/components/ListHeader.vue', () => ({ default: { name: 'ListHeader', template: '<div />' } }))

import EstimateForm from '@/pages/Estimates/EstimateForm.vue'

interface Lite { id: number; name: string; kind: string; kind_display: string; unit: string; default_price: string | null; category: number; section_name: string; subcategory_name: string }
function mountForm() {
  const wrapper = mount(EstimateForm)
  return wrapper.vm as unknown as {
    form: { object: number | null; title: string; date: string; note: string }
    lines: Array<Record<string, unknown>>
    onSearchPicked: (item: Lite) => void
    groupedLines: Array<{ section: string; sectionTotal: number; subgroups: Array<{ subcategory: string; subTotal: number; items: unknown[] }> }>
    handleSubmit: () => Promise<void>
  }
}
const line = (o: Record<string, unknown>) => ({
  _k: 'k', work_item: null, category: null, section_name: '', subcategory_name: '',
  name: '', kind: 'work', unit: '', quantity: '1', unit_price: '0', position_no: '', ...o,
})

describe('EstimateForm — #65 авто-группировка + контракт строк', () => {
  beforeEach(() => { create.mockClear(); update.mockClear(); push.mockClear() })

  it('object предзаполнен из ?object= и залочен', async () => {
    const vm = mountForm(); await nextTick()
    expect(vm.form.object).toBe(347)
  })

  it('#65: выбор позиции добавляет строку с авто-путём; группировка Раздел→Подраздел + подытоги', async () => {
    const vm = mountForm(); await nextTick()
    vm.onSearchPicked({ id: 55, name: 'Кабель', kind: 'work', kind_display: 'Работа', unit: 'п.м.', default_price: '6000', category: 2, section_name: 'Монтажные работы', subcategory_name: 'Прокладка кабеля' })
    vm.onSearchPicked({ id: 56, name: 'Штробление', kind: 'work', kind_display: 'Работа', unit: 'п.м.', default_price: '15000', category: 3, section_name: 'Монтажные работы', subcategory_name: 'Штробление' })
    vm.onSearchPicked({ id: 57, name: 'Камера', kind: 'work', kind_display: 'Работа', unit: 'шт.', default_price: '100000', category: 4, section_name: 'Слаботочные системы', subcategory_name: 'Видеонаблюдение' })
    await nextTick()
    expect(vm.lines.length).toBe(3)
    expect(vm.lines[0].section_name).toBe('Монтажные работы')
    expect(vm.lines[0].unit_price).toBe('6000')  // цена подставилась из каталога
    const g = vm.groupedLines
    expect(g.map(s => s.section)).toEqual(['Монтажные работы', 'Слаботочные системы'])
    expect(g[0].subgroups.map(s => s.subcategory)).toEqual(['Прокладка кабеля', 'Штробление'])
    // подытоги: раздел = сумма подразделов; qty=1 по умолчанию
    expect(g[0].subgroups[0].subTotal).toBe(6000)
    expect(g[0].sectionTotal).toBe(6000 + 15000)
  })

  const lite = (o: Partial<Lite>): Lite => ({ id: 1, name: 'X', kind: 'work', kind_display: 'Работа', unit: 'шт.', default_price: '1000', category: 2, section_name: 'S', subcategory_name: 'Sub', ...o })

  it('D1/D2/D3: кол-во clamp≥0 · целое для штучных · потолок MAX', async () => {
    const vm = mountForm(); await nextTick()
    vm.onSearchPicked(lite({ id: 1, unit: 'шт.', default_price: '1000' }))
    const line = vm.lines[0] as Record<string, unknown>
    line.quantity = '-5'; await nextTick()
    expect(vm.groupedLines[0].subgroups[0].subTotal).toBe(0)                 // D1: нет отрицательного
    line.quantity = '2.5'; await nextTick()
    expect(vm.groupedLines[0].subgroups[0].subTotal).toBe(2000)             // D2: floor(2.5)=2 × 1000
    line.quantity = '9999999999'; await nextTick()
    expect(vm.groupedLines[0].subgroups[0].subTotal).toBe(1_000_000 * 1000) // D3: cap 1e6
  })

  it('D2-инверсия: мерные/незнакомые единицы сохраняют дробное (флорим ТОЛЬКО штучные)', async () => {
    const vm = mountForm(); await nextTick()
    vm.onSearchPicked(lite({ id: 1, unit: 'п.м.', default_price: '1000', section_name: 'S1' }))   // мерная
    vm.onSearchPicked(lite({ id: 2, unit: 'проц.', default_price: '1000', section_name: 'S2' }))  // незнакомая (не в вайтлисте целых)
    await nextTick()
    ;(vm.lines[0] as Record<string, unknown>).quantity = '2.5'
    ;(vm.lines[1] as Record<string, unknown>).quantity = '12.5'
    await nextTick()
    // п.м. 2.5×1000 = 2500 (НЕ floor→2000); проц. 12.5×1000 = 12500 (НЕ floor→12000)
    const totals = vm.groupedLines.flatMap(s => s.subgroups.map(sg => sg.subTotal))
    expect(totals).toContain(2500)
    expect(totals).toContain(12500)
  })

  it('D5+D7: та же позиция → +1 к количеству (склейка, не дубль)', async () => {
    const vm = mountForm(); await nextTick()
    vm.onSearchPicked(lite({ id: 1, name: 'A' }))
    vm.onSearchPicked(lite({ id: 2, name: 'B' }))   // другой item — снимает 500мс-гвард
    vm.onSearchPicked(lite({ id: 1, name: 'A' }))   // снова A → склейка
    await nextTick()
    expect(vm.lines.length).toBe(2)
    expect((vm.lines.find(l => l.work_item === 1) as Record<string, unknown>).quantity).toBe('2')
  })

  it('D5: двойной клик (тот же item подряд, <500мс) → одна строка', async () => {
    const vm = mountForm(); await nextTick()
    vm.onSearchPicked(lite({ id: 1 }))
    vm.onSearchPicked(lite({ id: 1 }))   // гвард
    await nextTick()
    expect(vm.lines.length).toBe(1)
    expect((vm.lines[0] as Record<string, unknown>).quantity).toBe('1')
  })

  it('режим (а) существующая позиция → work_item + снапшот-имя (F-929)', async () => {
    const vm = mountForm(); await nextTick()
    vm.lines.splice(0, vm.lines.length, line({ work_item: 55, name: 'Монтаж', unit: 'шт.', quantity: '3', unit_price: '1000', position_no: '1' }))
    await vm.handleSubmit()
    const payload = create.mock.calls[0][0]
    expect(payload.object).toBe(347)
    expect(payload.lines[0]).toMatchObject({ work_item: 55, name: 'Монтаж', quantity: '3', unit_price: '1000', order: 0 })
    expect(payload.lines[0].category).toBeUndefined()
  })

  it('режим (б) новая позиция в каталог → category+name, без work_item', async () => {
    const vm = mountForm(); await nextTick()
    vm.lines.splice(0, vm.lines.length, line({ category: 2, name: 'Новая работа', kind: 'material', unit: 'м', quantity: '5', unit_price: '250' }))
    await vm.handleSubmit()
    const payload = create.mock.calls[0][0]
    expect(payload.lines[0]).toMatchObject({ category: 2, name: 'Новая работа', quantity: '5', unit_price: '250', default_price: '250' })
    expect(payload.lines[0].work_item).toBeUndefined()
  })

  it('режим (в) свободная строка → только name', async () => {
    const vm = mountForm(); await nextTick()
    vm.lines.splice(0, vm.lines.length, line({ name: 'Свободная', quantity: '2', unit_price: '500' }))
    await vm.handleSubmit()
    const payload = create.mock.calls[0][0]
    expect(payload.lines[0]).toMatchObject({ name: 'Свободная', quantity: '2', unit_price: '500' })
    expect(payload.lines[0].work_item).toBeUndefined()
    expect(payload.lines[0].category).toBeUndefined()
  })

  it('не сабмитит без строк', async () => {
    const vm = mountForm(); await nextTick()
    vm.lines.splice(0, vm.lines.length)
    await vm.handleSubmit()
    expect(create).not.toHaveBeenCalled()
  })

  it('не сабмитит строку с пустым кол-вом', async () => {
    const vm = mountForm(); await nextTick()
    vm.lines.splice(0, vm.lines.length, line({ work_item: 10, name: 'X', quantity: '', unit_price: '100' }))
    await vm.handleSubmit()
    expect(create).not.toHaveBeenCalled()
  })

  it('F-929: не сабмитит строку с отрицательной ценой', async () => {
    const vm = mountForm(); await nextTick()
    vm.lines.splice(0, vm.lines.length, line({ work_item: 10, name: 'X', quantity: '1', unit_price: '-5' }))
    await vm.handleSubmit()
    expect(create).not.toHaveBeenCalled()
  })

  it('#65 коэффициент: отдельный блок (не в группах работ) + scope уходит в payload', async () => {
    const vm = mountForm(); await nextTick()
    vm.onSearchPicked(lite({ id: 10, unit: 'шт.', default_price: '500000', section_name: 'Монтаж', subcategory_name: 'Прокладка' }))
    vm.onSearchPicked({ id: 20, name: 'Стеснённость', kind: 'coefficient', kind_display: 'Коэффициент', unit: 'коэф.', default_price: '1.2', category: 5, section_name: 'Монтаж', subcategory_name: 'Прокладка' } as unknown as Lite)
    await nextTick()
    const anyVm = vm as unknown as {
      groupedLines: Array<{ subgroups: Array<{ items: unknown[] }> }>
      coeffLines: Array<{ line: Record<string, unknown> }>
      onScopeChange: (l: Record<string, unknown>, v: string) => void
    }
    // коэффициент НЕ в группах работ; он в отдельном блоке coeffLines
    expect(anyVm.groupedLines.flatMap(g => g.subgroups.flatMap(s => s.items)).length).toBe(1)
    expect(anyVm.coeffLines.length).toBe(1)
    // задаём зону = раздел «Монтаж» → уходит в payload (value = scopesectionname)
    anyVm.onScopeChange(anyVm.coeffLines[0].line, 'sectionМонтаж')
    await nextTick()
    await vm.handleSubmit()
    const payload = create.mock.calls[0][0]
    const cp = payload.lines.find((l: Record<string, unknown>) => l.kind === 'coefficient')
    expect(cp.coeff_scope).toBe('section')
    expect(cp.coeff_scope_name).toBe('Монтаж')
    expect(cp.coeff_scope_section).toBe('')
  })

  it('#65 M4: подраздел-зона квалифицируется разделом в payload', async () => {
    const vm = mountForm(); await nextTick()
    vm.onSearchPicked(lite({ id: 11, unit: 'шт.', default_price: '100', section_name: 'Разд1', subcategory_name: 'Общие' }))
    vm.onSearchPicked({ id: 22, name: 'Коэфф', kind: 'coefficient', kind_display: 'Коэффициент', unit: 'коэф.', default_price: '1.5', category: 9, section_name: 'Разд1', subcategory_name: 'Общие' } as unknown as Lite)
    await nextTick()
    const anyVm = vm as unknown as { coeffLines: Array<{ line: Record<string, unknown> }>; onScopeChange: (l: Record<string, unknown>, v: string) => void }
    anyVm.onScopeChange(anyVm.coeffLines[0].line, 'subcategoryРазд1Общие')
    await nextTick()
    await vm.handleSubmit()
    const cp = create.mock.calls[0][0].lines.find((l: Record<string, unknown>) => l.kind === 'coefficient')
    expect(cp.coeff_scope).toBe('subcategory')
    expect(cp.coeff_scope_section).toBe('Разд1')
    expect(cp.coeff_scope_name).toBe('Общие')
  })
})
