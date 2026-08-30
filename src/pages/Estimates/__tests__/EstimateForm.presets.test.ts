import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

// F-1036 (BE F-794, D-029 вопрос 2 владельца): «+ Добавить коэффициент» → выбор пресета из справочника
// (имя + множитель подставляются; зона предвыбирается по подсказке scope_hint, если такой подраздел есть среди
// строк сметы, иначе остаётся пустой — не выдумываем); «Свой коэффициент» — ручная строка как раньше (F-740);
// без активных пресетов кнопка сразу добавляет ручную строку (поведение до F-1036 сохранено).
const { create, presetState, presetFetch } = vi.hoisted(() => ({
  create: vi.fn().mockResolvedValue({ id: 7 }),
  presetState: { list: [] as Array<Record<string, unknown>> },
  presetFetch: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/stores/estimates', () => ({ useEstimatesStore: () => ({ create, update: vi.fn(), fetchOne: vi.fn() }) }))
vi.mock('@/stores/objects', () => ({ useObjectsStore: () => ({ items: [{ id: 347, name: 'Тест-объект' }], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))
vi.mock('@/stores/workCategories', () => ({ useWorkCategoriesStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/coefficientPresets', () => ({
  useCoefficientPresetsStore: () => ({ get items() { return presetState.list }, fetchList: presetFetch }),
}))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: { object: '347' } }),
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('@/components/WorkItemSearchSelect.vue', () => ({ default: { name: 'WorkItemSearchSelect', template: '<div />' } }))
vi.mock('@/components/ListHeader.vue', () => ({ default: { name: 'ListHeader', template: '<div />' } }))

import EstimateForm from '@/pages/Estimates/EstimateForm.vue'

const TV = 'Монтаж ТВ кронштейнов и установка на них телевизоров,монторов и проекторов'
const PRESETS = [
  { id: 1, name: 'Установка кронштейна на потолок коф.', multiplier: '1.50', scope_hint: TV, order: 2, is_active: true },
  { id: 2, name: 'Ночные работы после 20:00 30 процентов от общего объема', multiplier: '1.30', scope_hint: '', order: 7, is_active: true },
  { id: 3, name: 'Выключенный пресет', multiplier: '2.00', scope_hint: '', order: 9, is_active: false },
]
type Line = Record<string, unknown>
interface VM {
  lines: Line[]
  onSearchPicked: (i: Record<string, unknown>) => void
  openCoeffChooser: () => Promise<void>
  addCoeffLine: (p?: Record<string, unknown>) => void
  coeffChooserOpen: boolean
}
const lite = (o: Record<string, unknown>) => ({
  id: 1, name: 'X', kind: 'work', kind_display: 'Работа', unit: 'шт.', default_price: '100', category: 1,
  section_name: 'Электромонтажные работы', subcategory_name: TV, ...o,
})
const coeffButton = (w: ReturnType<typeof mount>) => w.findAll('button').find(b => b.text().includes('Добавить коэффициент'))!

describe('EstimateForm — пресеты коэффициентов (F-1036)', () => {
  beforeEach(() => { presetState.list = []; presetFetch.mockClear(); create.mockClear() })

  it('кнопка грузит активные пресеты и открывает выбор: имя, ×множитель, подсказка зоны; выключенных нет', async () => {
    presetState.list = PRESETS
    const w = mount(EstimateForm); await nextTick()
    const vm = w.vm as unknown as VM
    await coeffButton(w).trigger('click'); await flushPromises()
    expect(presetFetch).toHaveBeenCalledWith({ is_active: true, page_size: 100 })
    expect(vm.coeffChooserOpen).toBe(true)
    expect(vm.lines).toHaveLength(0)                          // строка ещё не добавлена
    const t = w.text()
    expect(t).toContain('Ночные работы после 20:00')
    expect(t).toContain('×1.3')
    expect(t).toContain('×1.5')
    expect(t).toContain(`зона: ${TV}`)
    expect(t).not.toContain('Выключенный пресет')
    expect(t).toContain('Свой коэффициент')
  })

  it('выбор пресета добавляет коэфф-строку с именем/множителем и предвыбирает зону-подраздел по подсказке', async () => {
    presetState.list = PRESETS
    const w = mount(EstimateForm); await nextTick()
    const vm = w.vm as unknown as VM
    vm.onSearchPicked(lite({ id: 11, name: 'Диагональ до 32', default_price: '200000' }))
    vm.onSearchPicked(lite({ id: 12, name: 'Кабель', category: 2, subcategory_name: 'Прокладка кабеля' }))
    await vm.openCoeffChooser(); await nextTick()
    await w.findAll('button').find(b => b.text().includes('Установка кронштейна на потолок коф.'))!.trigger('click')
    await nextTick()
    expect(vm.coeffChooserOpen).toBe(false)
    const c = vm.lines.find(l => l.kind === 'coefficient')!
    expect(c).toMatchObject({
      kind: 'coefficient', name: 'Установка кронштейна на потолок коф.', unit_price: '1.5', unit: 'коэф.',
      work_item: null, category: null,
      coeff_scope: 'subcategory', coeff_scope_section: 'Электромонтажные работы', coeff_scope_name: TV,
    })
    // пресет без подсказки → зона пустая, выбирается в строке
    await vm.openCoeffChooser(); await nextTick()
    await w.findAll('button').find(b => b.text().includes('Ночные работы после 20:00'))!.trigger('click')
    await nextTick()
    const c2 = vm.lines.filter(l => l.kind === 'coefficient')[1]
    expect(c2).toMatchObject({ name: 'Ночные работы после 20:00 30 процентов от общего объема', unit_price: '1.3', coeff_scope: '' })
    expect(presetFetch).toHaveBeenCalledTimes(1)              // список грузится один раз на форму
  })

  it('подсказка зоны без такого подраздела в смете → зона остаётся пустой (не выдумываем)', async () => {
    presetState.list = PRESETS
    const w = mount(EstimateForm); await nextTick()
    const vm = w.vm as unknown as VM
    vm.onSearchPicked(lite({ id: 12, name: 'Кабель', category: 2, subcategory_name: 'Прокладка кабеля' }))
    vm.addCoeffLine(PRESETS[0]); await nextTick()
    const c = vm.lines.find(l => l.kind === 'coefficient')!
    expect(c).toMatchObject({ name: 'Установка кронштейна на потолок коф.', unit_price: '1.5', coeff_scope: '', coeff_scope_name: '' })
  })

  it('без активных пресетов кнопка сразу добавляет ручную строку и выбор не открывает (как до F-1036)', async () => {
    presetState.list = [PRESETS[2]]     // только выключенный
    const w = mount(EstimateForm); await nextTick()
    const vm = w.vm as unknown as VM
    await coeffButton(w).trigger('click'); await flushPromises()
    expect(vm.coeffChooserOpen).toBe(false)
    expect(vm.lines).toHaveLength(1)
    expect(vm.lines[0]).toMatchObject({ kind: 'coefficient', name: '', unit_price: '', coeff_scope: '' })
  })

  it('«Свой коэффициент» из выбора — пустая ручная строка, выбор закрывается', async () => {
    presetState.list = PRESETS
    const w = mount(EstimateForm); await nextTick()
    const vm = w.vm as unknown as VM
    await vm.openCoeffChooser(); await nextTick()
    await w.findAll('button').find(b => b.text().includes('Свой коэффициент'))!.trigger('click')
    await nextTick()
    expect(vm.coeffChooserOpen).toBe(false)
    expect(vm.lines).toHaveLength(1)
    expect(vm.lines[0]).toMatchObject({ kind: 'coefficient', name: '', unit_price: '', coeff_scope: '' })
  })
})
