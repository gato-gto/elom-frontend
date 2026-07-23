import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { endpoints } from '@/api/endpoints'

// Владелец: в форме «Внести остатки (инвентаризация)» в выборке материала должно быть только
// то, что есть в наличии и что можно списать. Тесты фиксируют фильтр по наличию, объект/дата-
// зависимую подгрузку, контракт отправки в from-balance-bulk и ключевые поведения формы.

const { getMaterialsInStock, post } = vi.hoisted(() => ({ getMaterialsInStock: vi.fn(), post: vi.fn() }))
vi.mock('@/stores/materials', () => ({ getMaterialsInStock }))
vi.mock('@/stores/objects', () => ({
  useObjectsStore: () => ({ items: [{ id: 7, name: 'Объект-7' }, { id: 8, name: 'Объект-8' }], fetchList: vi.fn().mockResolvedValue(undefined) }),
}))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))
vi.mock('@/api/client', () => ({ default: { post } }))

import WriteOffByBalanceForm from '@/pages/WriteOffs/WriteOffByBalanceForm.vue'

const stub = { global: { stubs: { Modal: { template: '<div><slot /></div>' } } } }
const bal = (id: number, name: string, balance: string, unit = 'шт') => ({
  material_id: id, material_name: name, unit_code: unit, current_balance: balance,
  total_purchased: '0', total_written_off: '0',
})

async function mountWithObject(object = 7) {
  const wrapper = mount(WriteOffByBalanceForm, { props: { isOpen: true }, ...stub })
  const vm = wrapper.vm as any
  vm.objectId = object
  await nextTick(); await flushPromises(); await nextTick()
  return { wrapper, vm }
}

describe('WriteOffByBalanceForm — только материалы в наличии', () => {
  beforeEach(() => { getMaterialsInStock.mockReset(); post.mockReset(); post.mockResolvedValue({}) })

  it('выбор материала заблокирован, пока не выбран объект', () => {
    getMaterialsInStock.mockResolvedValue([])
    const wrapper = mount(WriteOffByBalanceForm, { props: { isOpen: true }, ...stub })
    const select = wrapper.find('tbody select')
    expect(select.exists()).toBe(true)
    expect(select.attributes('disabled')).toBeDefined()
    expect(getMaterialsInStock).not.toHaveBeenCalled()
  })

  it('после выбора объекта опции = материалы в наличии на этом объекте', async () => {
    getMaterialsInStock.mockResolvedValue([bal(1, 'Кабель', '10'), bal(2, 'Труба', '3')])
    const { vm } = await mountWithObject(7)
    expect(getMaterialsInStock).toHaveBeenCalledWith(7, expect.any(String))
    expect(vm.optionsForRow(vm.rows[0]).map((o: any) => o.label)).toEqual(['Кабель', 'Труба'])
  })

  it('материал, уже выбранный в другой строке, исключается (без дублей)', async () => {
    getMaterialsInStock.mockResolvedValue([bal(1, 'Кабель', '10'), bal(2, 'Труба', '3')])
    const { vm } = await mountWithObject(7)
    vm.rows[0].material = 1
    vm.addRow()
    await nextTick()
    expect(vm.optionsForRow(vm.rows[1]).map((o: any) => o.value)).toEqual([2])
  })

  it('смена ОБЪЕКТА сбрасывает строки и перезагружает материалы', async () => {
    getMaterialsInStock.mockResolvedValue([bal(1, 'Кабель', '10')])
    const { vm } = await mountWithObject(7)
    vm.rows[0].material = 1
    vm.addRow()
    expect(vm.rows.length).toBe(2)
    vm.objectId = 8
    await nextTick(); await flushPromises(); await nextTick()
    expect(vm.rows.length).toBe(1)
    expect(vm.rows[0].material).toBe(null)
    expect(getMaterialsInStock).toHaveBeenLastCalledWith(8, expect.any(String))
  })

  it('смена ДАТЫ перезагружает остатки, но СОХРАНЯЕТ введённые строки', async () => {
    getMaterialsInStock.mockResolvedValue([bal(1, 'Кабель', '10')])
    const { vm } = await mountWithObject(7)
    vm.rows[0].material = 1
    vm.rows[0].actual_balance = '4'
    vm.date = '2026-07-01'
    await nextTick(); await flushPromises(); await nextTick()
    expect(getMaterialsInStock).toHaveBeenLastCalledWith(7, '2026-07-01')
    // строки НЕ сброшены — введённое сохранено
    expect(vm.rows.length).toBe(1)
    expect(vm.rows[0].material).toBe(1)
    expect(vm.rows[0].actual_balance).toBe('4')
  })

  it('книжный остаток и единица выбранного материала доступны для подсказки', async () => {
    getMaterialsInStock.mockResolvedValue([bal(1, 'Кабель', '10.500000', 'м')])
    const { vm } = await mountWithObject(7)
    vm.rows[0].material = 1
    await nextTick()
    const b = vm.balanceFor(vm.rows[0])
    expect(b.current_balance).toBe('10.500000')
    expect(b.unit_code).toBe('м')
  })

  it('нет материалов в наличии → «+ Добавить материал» заблокирована', async () => {
    getMaterialsInStock.mockResolvedValue([])
    const { wrapper, vm } = await mountWithObject(7)
    expect(vm.stockMaterials.length).toBe(0)
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Добавить материал'))
    expect(addBtn?.attributes('disabled')).toBeDefined()
  })

  it('отправляет ровно {object, date, items:[{material, target_balance}]} в from-balance-bulk', async () => {
    getMaterialsInStock.mockResolvedValue([bal(1, 'Кабель', '10')])
    const { vm } = await mountWithObject(7)
    vm.rows[0].material = 1
    vm.rows[0].actual_balance = '4'
    await vm.handleSubmit()
    await flushPromises()
    expect(post).toHaveBeenCalledTimes(1)
    expect(post).toHaveBeenCalledWith(endpoints.writeOffs.fromBalanceBulk, {
      object: 7,
      date: expect.any(String),
      items: [{ material: 1, target_balance: '4' }],
    })
  })

  it('отрицательный фактический остаток → ошибка строки, запрос не уходит', async () => {
    getMaterialsInStock.mockResolvedValue([bal(1, 'Кабель', '10')])
    const { vm } = await mountWithObject(7)
    vm.rows[0].material = 1
    vm.rows[0].actual_balance = '-2'
    vm.handleSubmit()
    await flushPromises()
    expect(post).not.toHaveBeenCalled()
    expect(Object.values(vm.rowErrors).some((e: any) => /отрицат/i.test(e))).toBe(true)
  })

  it('построчная ошибка бэка ложится на ПРАВИЛЬНую строку (индекс filled → индекс rows)', async () => {
    getMaterialsInStock.mockResolvedValue([bal(1, 'Кабель', '10'), bal(2, 'Труба', '3')])
    const { vm } = await mountWithObject(7)
    // строка 0 остаётся пустой (будет отброшена из filled), заполняем строку 1
    vm.addRow()
    vm.rows[1].material = 1
    vm.rows[1].actual_balance = '4'
    post.mockRejectedValueOnce({ response: { data: { errors: { items: [{ index: 0, detail: 'нет остатка' }] } } } })
    vm.handleSubmit()
    await flushPromises()
    // backend index 0 = первый filled = наша строка rows[1]
    expect(vm.rowErrors[1]).toBe('нет остатка')
  })

  it('гонка: поздний ответ прошлого объекта не затирает свежий (loadToken)', async () => {
    let resolveFirst: (v: any) => void = () => {}
    getMaterialsInStock
      .mockImplementationOnce(() => new Promise(r => { resolveFirst = r }))
      .mockResolvedValueOnce([bal(2, 'Труба', '5')])
    const wrapper = mount(WriteOffByBalanceForm, { props: { isOpen: true }, ...stub })
    const vm = wrapper.vm as any
    vm.objectId = 7
    await nextTick()            // первый запрос (объект 7) — «завис»
    vm.objectId = 8
    await nextTick(); await flushPromises()  // второй (объект 8) — резолвится
    expect(vm.stockMaterials.map((m: any) => m.material_id)).toEqual([2])
    resolveFirst([bal(1, 'Кабель', '9')])    // поздний ответ объекта 7
    await flushPromises()
    expect(vm.stockMaterials.map((m: any) => m.material_id)).toEqual([2]) // не затёрт
    expect(vm.materialsLoading).toBe(false)
  })

  it('повторное открытие формы сбрасывает прошлую сессию (watch isOpen)', async () => {
    getMaterialsInStock.mockResolvedValue([bal(1, 'Кабель', '10')])
    const wrapper = mount(WriteOffByBalanceForm, { props: { isOpen: false }, ...stub })
    const vm = wrapper.vm as any
    // открыли, выбрали объект, заполнили
    await wrapper.setProps({ isOpen: true })
    vm.objectId = 7
    await nextTick(); await flushPromises(); await nextTick()
    vm.rows[0].material = 1
    vm.rows[0].actual_balance = '4'
    // закрыли и открыли снова
    await wrapper.setProps({ isOpen: false })
    await wrapper.setProps({ isOpen: true })
    await nextTick()
    expect(vm.objectId).toBe(0)
    expect(vm.rows.length).toBe(1)
    expect(vm.rows[0].material).toBe(null)
    expect(vm.rows[0].actual_balance).toBe('')
  })
})
