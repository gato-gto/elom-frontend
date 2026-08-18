import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
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
// QuickAddWorkItem (всегда смонтирован) в onMounted зовёт catStore.fetchList → без мока = реальный XHR
// в jsdom (AggregateError-шум ×27 в выводе vitest). Поведение теста не зависит от каталога.
vi.mock('@/stores/workCategories', () => ({ useWorkCategoriesStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))

const push = vi.fn()
// Т2 (аудит#3): params — мутируемый объект, чтобы тесты могли включать edit-режим (params.id).
const routeParams = vi.hoisted(() => ({} as Record<string, string>))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: routeParams, query: { object: '347' } }),
  useRouter: () => ({ push }),
}))
vi.mock('@/components/WorkItemSearchSelect.vue', () => ({ default: { name: 'WorkItemSearchSelect', template: '<div />' } }))
vi.mock('@/components/ListHeader.vue', () => ({ default: { name: 'ListHeader', template: '<div />' } }))

import EstimateForm from '@/pages/Estimates/EstimateForm.vue'

interface Lite { id: number; name: string; kind: string; kind_display: string; unit: string; default_price: string | null; category: number; section_name: string; subcategory_name: string; is_draft?: boolean }
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
  beforeEach(() => {
    create.mockClear(); update.mockClear(); push.mockClear(); fetchOne.mockReset()
    for (const k of Object.keys(routeParams)) { delete routeParams[k] }
  })

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

  it('#65 Фаза 2 selection: строки несут uid, пикер → coeff_targets в payload', async () => {
    const vm = mountForm(); await nextTick()
    vm.onSearchPicked(lite({ id: 31, name: 'Работа1', unit: 'шт.', default_price: '100', section_name: 'A' }))
    vm.onSearchPicked(lite({ id: 32, name: 'Работа2', unit: 'шт.', default_price: '200', section_name: 'A' }))
    vm.onSearchPicked({ id: 40, name: 'Коэфф', kind: 'coefficient', kind_display: 'Коэффициент', unit: 'коэф.', default_price: '1.5', category: 9, section_name: 'A', subcategory_name: '' } as unknown as Lite)
    await nextTick()
    const anyVm = vm as unknown as {
      lines: Array<{ uid: string; work_item: number | null; kind: string }>
      coeffLines: Array<{ line: Record<string, unknown> }>
      onScopeChange: (l: Record<string, unknown>, v: string) => void
      toggleTarget: (l: Record<string, unknown>, uid: string) => void
    }
    // все строки получили uid
    expect(anyVm.lines.every(l => !!l.uid)).toBe(true)
    const coeffLine = anyVm.coeffLines[0].line
    anyVm.onScopeChange(coeffLine, 'selection')   // scopeSEPSEP (пустые section/name)
    const w1uid = anyVm.lines.find(l => l.work_item === 31)!.uid
    anyVm.toggleTarget(coeffLine, w1uid)          // выбрать только Работа1
    await nextTick()
    await vm.handleSubmit()
    const cp = create.mock.calls[0][0].lines.find((l: Record<string, unknown>) => l.kind === 'coefficient')
    expect(cp.coeff_scope).toBe('selection')
    expect(cp.coeff_targets).toEqual([w1uid])
  })

  it('#MED2 (аудит A): построчная сумма формы = десятичное HALF_UP (== движок), не Math.round(float)', async () => {
    const vm = mountForm(); await nextTick()
    vm.onSearchPicked(lite({ id: 90, unit: 'п.м.', default_price: '45', section_name: 'A', subcategory_name: '' }))
    ;(vm.lines[0] as Record<string, unknown>).quantity = '0.7'
    await nextTick()
    // 0.7×45 = 31.5 → HALF_UP = 32; Math.round(float 31.4999…) дал бы 31 (баг → подытог≠ИТОГО)
    const sub = vm.groupedLines[0].subgroups[0].subTotal
    expect(sub).toBe(32)
    expect(vm.groupedLines[0].sectionTotal).toBe(32)
  })

  it('#F-740 ad-hoc коэффициент: addCoeffLine пушит пустую коэфф-строку; validate требует имя+множитель', async () => {
    const vm = mountForm(); await nextTick()
    const anyVm = vm as unknown as { addCoeffLine: () => void; lines: Array<Record<string, unknown>> }
    anyVm.addCoeffLine(); await nextTick()
    expect(anyVm.lines.length).toBe(1)
    expect(anyVm.lines[0]).toMatchObject({ kind: 'coefficient', work_item: null, category: null, unit: 'коэф.', unit_price: '', coeff_scope: '' })
    // пустой коэфф (без имени/множителя/зоны) не сабмитится
    await vm.handleSubmit()
    expect(create).not.toHaveBeenCalled()
    // заполнили имя+множитель, но без зоны — всё равно не сабмит (зона обязательна)
    ;(anyVm.lines[0] as Record<string, unknown>).name = 'Ночная'
    ;(anyVm.lines[0] as Record<string, unknown>).unit_price = '1.5'
    await vm.handleSubmit()
    expect(create).not.toHaveBeenCalled()
  })

  it('#F-742-harden ad-hoc коэфф END-TO-END: add→имя/множитель/зона→payload kind=coefficient без каталога', async () => {
    const vm = mountForm(); await nextTick()
    vm.onSearchPicked(lite({ id: 70, name: 'Монтаж', unit: 'шт.', default_price: '100000', section_name: 'Монтаж', subcategory_name: '' }))
    const anyVm = vm as unknown as { addCoeffLine: () => void; coeffLines: Array<{ line: Record<string, unknown> }>; onScopeChange: (l: Record<string, unknown>, v: string) => void }
    anyVm.addCoeffLine(); await nextTick()
    const c = anyVm.coeffLines[0].line
    c.name = 'Ночная надбавка'; c.unit_price = '1.5'
    const sep = String.fromCharCode(1)
    anyVm.onScopeChange(c, 'section' + sep + sep + 'Монтаж')   // scope=section, section='', name=Монтаж
    await nextTick()
    await vm.handleSubmit()
    const payload = create.mock.calls[0][0]
    const cp = payload.lines.find((l: Record<string, unknown>) => l.kind === 'coefficient')
    expect(cp).toMatchObject({ kind: 'coefficient', name: 'Ночная надбавка', unit_price: '1.5', coeff_scope: 'section', coeff_scope_name: 'Монтаж' })
    expect(cp.work_item).toBeUndefined()      // ad-hoc: НЕ ссылается на каталог
    expect(cp.category).toBeUndefined()        // и не заводит каталог
    // работа тоже в payload; ИТОГО-эффект: коэфф ×1.5 на «Монтаж» 100k → сервер посчитает вклад
    expect(payload.lines.some((l: Record<string, unknown>) => l.work_item === 70)).toBe(true)
  })

  it('#F-739/A7 quick-add: строка несёт АВТОРИТЕТНЫЙ is_draft от BE (не выводит из default_price)', async () => {
    const vm = mountForm(); await nextTick()
    const anyVm = vm as unknown as { onWorkItemCreated: (i: Record<string, unknown>) => void; lines: Array<Record<string, unknown>> }
    // руководство завело с ценой → BE отдаёт is_draft=false (F-762)
    anyVm.onWorkItemCreated({ id: 77, name: 'Новая работа', kind: 'work', kind_display: 'Работа', unit: 'шт.', default_price: '5000', category: 3, category_name: 'Прокладка', is_draft: false })
    await nextTick()
    expect(anyVm.lines.length).toBe(1)
    expect(anyVm.lines[0]).toMatchObject({ work_item: 77, name: 'Новая работа', is_draft: false, unit_price: '5000' })
    // вводящий завёл драфт (default_price=null, proposed_by задан) → BE отдаёт is_draft=true
    anyVm.onWorkItemCreated({ id: 78, name: 'Драфт-поз', kind: 'work', kind_display: 'Работа', unit: '', default_price: null, category: 3, category_name: 'Прокладка', is_draft: true })
    await nextTick()
    expect(anyVm.lines.find(l => l.work_item === 78)).toMatchObject({ is_draft: true, unit_price: '' })
  })

  it('#A7 (F-762) РЕГРЕСС: договорная позиция (default_price=null НО is_draft=false) — НЕ драфт', async () => {
    // Суть A7: цена по договору = default_price NULL, proposed_by NULL → BE is_draft=false.
    // Старый FE `is_draft: item.default_price == null` метил такую позицию черновиком (ложный бейдж «ждёт цены»).
    const vm = mountForm(); await nextTick()
    const anyVm = vm as unknown as {
      onWorkItemCreated: (i: Record<string, unknown>) => void
      onSearchPicked: (i: Lite) => void
      lines: Array<Record<string, unknown>>
    }
    // путь quick-add (onWorkItemCreated → lite → onSearchPicked): договорная без цены
    anyVm.onWorkItemCreated({ id: 80, name: 'Договорная-QA', kind: 'work', kind_display: 'Работа', unit: 'шт.', default_price: null, category: 3, category_name: 'Прокладка', is_draft: false })
    await nextTick()
    expect(anyVm.lines.find(l => l.work_item === 80)).toMatchObject({ is_draft: false, unit_price: '' })
    // путь прямого поиска (onSearchPicked с WorkItemLite от search): договорная без цены
    anyVm.onSearchPicked({ id: 81, name: 'Договорная-search', kind: 'work', kind_display: 'Работа', unit: 'шт.', default_price: null, category: 4, section_name: 'S', subcategory_name: 'Sub', is_draft: false })
    await nextTick()
    expect(anyVm.lines.find(l => l.work_item === 81)).toMatchObject({ is_draft: false })
  })

  it('#65 Ф2-аудит F2-2: пикер selection предлагает только работы (не материалы)', async () => {
    const vm = mountForm(); await nextTick()
    vm.onSearchPicked(lite({ id: 51, name: 'Работа', kind: 'work', unit: 'шт.', default_price: '100', section_name: 'A' }))
    vm.onSearchPicked({ id: 52, name: 'Материал', kind: 'material', kind_display: 'Материал', unit: 'шт.', default_price: '50', category: 9, section_name: 'A', subcategory_name: '' } as unknown as Lite)
    await nextTick()
    const anyVm = vm as unknown as { selectableWorks: Array<{ name: string }> }
    expect(anyVm.selectableWorks.map(w => w.name)).toEqual(['Работа'])   // материал не в списке
  })

  it('#65 Ф2-аудит F2-5: смена зоны с selection на раздел чистит coeff_targets', async () => {
    const vm = mountForm(); await nextTick()
    vm.onSearchPicked(lite({ id: 61, unit: 'шт.', default_price: '100', section_name: 'A' }))
    vm.onSearchPicked({ id: 62, name: 'Коэфф', kind: 'coefficient', kind_display: 'Коэффициент', unit: 'коэф.', default_price: '1.5', category: 9, section_name: 'A', subcategory_name: '' } as unknown as Lite)
    await nextTick()
    const anyVm = vm as unknown as {
      lines: Array<{ uid: string; work_item: number | null }>
      coeffLines: Array<{ line: Record<string, unknown> }>
      onScopeChange: (l: Record<string, unknown>, v: string) => void
      toggleTarget: (l: Record<string, unknown>, uid: string) => void
    }
    const coeff = anyVm.coeffLines[0].line
    const sep = String.fromCharCode(1)
    anyVm.onScopeChange(coeff, 'selection')
    anyVm.toggleTarget(coeff, anyVm.lines.find(l => l.work_item === 61)!.uid)
    expect((coeff.coeff_targets as string[]).length).toBe(1)
    anyVm.onScopeChange(coeff, `section${sep}${sep}A`)   // сменили на раздел → цели должны обнулиться
    expect((coeff.coeff_targets as string[]).length).toBe(0)
  })

  it('Т2 (аудит#3) edit-round-trip: BE-uid строк и coeff_targets сохраняются при загрузке на правку', async () => {
    // Мутация `uid: ln.uid || newUid()` → `uid: newUid()` проходила весь сьют зелёной — selection
    // тихо слетал бы при любой правке сметы. Пин: uid НЕ регенерятся, цели скопированы.
    routeParams.id = '5'
    fetchOne.mockResolvedValueOnce({
      id: 5, object: 347, title: 'Смета', date: '', note: '', lines: [
        { work_item: 55, name: 'Кабель', kind: 'work', unit: 'п.м.', quantity: '2', unit_price: '6000',
          position_no: '', section_name: 'Монтаж', subcategory_name: 'Прокладка', coeff_scope: '',
          coeff_scope_name: '', coeff_scope_section: '', uid: 'be-w1', coeff_targets: [], is_draft: false },
        { work_item: null, name: 'Коэфф', kind: 'coefficient', unit: 'коэф.', quantity: '1', unit_price: '1.5',
          position_no: '', section_name: '', subcategory_name: '', coeff_scope: 'selection',
          coeff_scope_name: '', coeff_scope_section: '', uid: 'be-c1', coeff_targets: ['be-w1'], is_draft: false },
      ],
    })
    const vm = mountForm(); await flushPromises(); await nextTick()
    expect(fetchOne).toHaveBeenCalledWith(5)
    expect(vm.lines.map(l => l.uid)).toEqual(['be-w1', 'be-c1'])          // НЕ перегенерированы
    expect(vm.lines[1].coeff_targets).toEqual(['be-w1'])                  // цели скопированы
    expect(vm.lines[1].coeff_scope).toBe('selection')                     // зона пережила N3-watch
  })

  it('D2-FE (аудит#3) edit: зона «вся смета» переживает загрузку на правку (раньше N3-watch сбрасывал)', async () => {
    routeParams.id = '6'
    fetchOne.mockResolvedValueOnce({
      id: 6, object: 347, title: 'Смета', date: '', note: '', lines: [
        { work_item: 55, name: 'Кабель', kind: 'work', unit: 'п.м.', quantity: '1', unit_price: '6000',
          position_no: '', section_name: 'Монтаж', subcategory_name: '', coeff_scope: '',
          coeff_scope_name: '', coeff_scope_section: '', uid: 'w1', coeff_targets: [], is_draft: false },
        { work_item: null, name: 'Квсей', kind: 'coefficient', unit: 'коэф.', quantity: '1', unit_price: '1.1',
          position_no: '', section_name: '', subcategory_name: '', coeff_scope: 'all',
          coeff_scope_name: '', coeff_scope_section: '', uid: 'c1', coeff_targets: [], is_draft: false },
      ],
    })
    const vm = mountForm(); await flushPromises(); await nextTick(); await nextTick()
    expect(vm.lines[1].coeff_scope).toBe('all')   // зона цела (опция «Вся смета» теперь существует)
    const anyVm = vm as unknown as { scopeOptions: Array<{ label: string }> }
    expect(anyVm.scopeOptions.map(o => o.label)).toContain('Вся смета')
  })

  it('D9 (аудит#3): опции selection/«Вся смета» гейтятся по РАБОТАМ, не по любым не-коэфф строкам', async () => {
    const vm = mountForm(); await nextTick()
    const anyVm = vm as unknown as { scopeOptions: Array<{ label: string }> }
    // только материал → спец-опций нет (calc множит лишь работы; пикер был бы пуст)
    vm.onSearchPicked({ id: 71, name: 'Мат', kind: 'material', kind_display: 'Материал', unit: 'шт.', default_price: '100', category: 9, section_name: 'A', subcategory_name: '' } as unknown as Lite)
    await nextTick()
    const labels0 = anyVm.scopeOptions.map(o => o.label)
    expect(labels0).not.toContain('Выбранные позиции…')
    expect(labels0).not.toContain('Вся смета')
    // появилась работа → обе опции доступны
    vm.onSearchPicked(lite({ id: 72, name: 'Раб', unit: 'шт.', default_price: '100', section_name: 'A' }))
    await nextTick()
    const labels1 = anyVm.scopeOptions.map(o => o.label)
    expect(labels1).toContain('Выбранные позиции…')
    expect(labels1).toContain('Вся смета')
  })

  it('D10 (аудит#3): зона выбрана, множитель пуст → «укажите множитель» (не «выберите зону»)', async () => {
    const vm = mountForm(); await nextTick()
    vm.onSearchPicked(lite({ id: 81, unit: 'шт.', default_price: '100', section_name: 'A' }))
    await nextTick()
    const anyVm = vm as unknown as {
      lines: Array<Record<string, unknown>>
      addCoeffLine: () => void
      onScopeChange: (l: Record<string, unknown>, v: string) => void
      contribDisplay: (i: number) => string
    }
    anyVm.addCoeffLine(); await nextTick()
    const idx = anyVm.lines.findIndex(l => l.kind === 'coefficient')
    const coeff = anyVm.lines[idx]
    expect(anyVm.contribDisplay(idx)).toBe('выберите зону')      // зоны нет — прежний текст верен
    anyVm.onScopeChange(coeff, `all${String.fromCharCode(1)}${String.fromCharCode(1)}`)
    coeff.unit_price = ''                                        // зона есть, множителя нет
    await nextTick()
    expect(anyVm.contribDisplay(idx)).toBe('укажите множитель')  // раньше врало «выберите зону»
  })

  it('D3 (аудит#3): серверный 400 по полю коэфф-строки видим — coeffLineError берёт первый доступный ключ', async () => {
    const vm = mountForm(); await nextTick()
    const anyVm = vm as unknown as {
      lineErrors: Record<number, Record<string, string>>
      coeffLineError: (i: number) => string
    }
    // BE-ключ (unit_price из DRF) без клиентского .coeff — раньше рендерился НИКАК (только тост)
    anyVm.lineErrors = { 1: { unit_price: 'Множитель должен быть больше 0.' } }
    await nextTick()
    expect(anyVm.coeffLineError(1)).toBe('Множитель должен быть больше 0.')
    // клиентский .coeff приоритетнее
    anyVm.lineErrors = { 1: { coeff: 'клиентская', unit_price: 'серверная' } }
    await nextTick()
    expect(anyVm.coeffLineError(1)).toBe('клиентская')
    expect(anyVm.coeffLineError(0)).toBe('')   // чужая строка чиста
  })

  it('Т6 (аудит#3): удаление работы-цели вычищает её uid из coeff_targets (watch-прунинг)', async () => {
    const vm = mountForm(); await nextTick()
    vm.onSearchPicked(lite({ id: 91, name: 'Р1', unit: 'шт.', default_price: '100', section_name: 'A' }))
    vm.onSearchPicked(lite({ id: 92, name: 'Р2', unit: 'шт.', default_price: '200', section_name: 'A' }))
    await nextTick()
    const anyVm = vm as unknown as {
      lines: Array<{ uid: string; work_item: number | null; kind: string; coeff_targets: string[] }>
      addCoeffLine: () => void
      onScopeChange: (l: Record<string, unknown>, v: string) => void
      toggleTarget: (l: Record<string, unknown>, uid: string) => void
      removeLine: (i: number) => void
    }
    anyVm.addCoeffLine(); await nextTick()
    const coeff = anyVm.lines.find(l => l.kind === 'coefficient')!
    const uid1 = anyVm.lines.find(l => l.work_item === 91)!.uid
    const uid2 = anyVm.lines.find(l => l.work_item === 92)!.uid
    anyVm.onScopeChange(coeff as unknown as Record<string, unknown>, `selection${String.fromCharCode(1)}${String.fromCharCode(1)}`)
    anyVm.toggleTarget(coeff as unknown as Record<string, unknown>, uid1)
    anyVm.toggleTarget(coeff as unknown as Record<string, unknown>, uid2)
    expect(coeff.coeff_targets).toEqual([uid1, uid2])
    anyVm.removeLine(anyVm.lines.findIndex(l => l.work_item === 91))   // удалили Р1 (цель)
    await nextTick(); await nextTick()
    expect(coeff.coeff_targets).toEqual([uid2])   // uid удалённой работы вычищен, вторая цель жива
  })
})
