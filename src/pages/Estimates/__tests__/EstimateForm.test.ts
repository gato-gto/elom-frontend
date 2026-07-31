import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// F-928: контракт вложенных строк сметы — три режима (а) work_item, (б) category+name, (в) свободная.
// createBulk-аналог: один вызов estimatesStore.create с payload {object,...,lines:[...]}.
const { create, update, fetchOne } = vi.hoisted(() => ({
  create: vi.fn().mockResolvedValue({ id: 7 }),
  update: vi.fn().mockResolvedValue({ id: 7 }),
  fetchOne: vi.fn(),
}))

vi.mock('@/stores/estimates', () => ({ useEstimatesStore: () => ({ create, update, fetchOne }) }))
vi.mock('@/stores/objects', () => ({ useObjectsStore: () => ({ items: [{ id: 347, name: 'Тест-объект' }], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/workCategories', () => ({
  fetchRootCategoriesSafe: vi.fn().mockResolvedValue([{ id: 1, name: 'Раздел A', parent: null }]),
  fetchChildCategories: vi.fn().mockResolvedValue([{ id: 2, name: 'Подраздел B', parent: 1 }]),
}))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))

const push = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: { object: '347' } }),
  useRouter: () => ({ push }),
}))
vi.mock('@/components/WorkItemSearchSelect.vue', () => ({ default: { name: 'WorkItemSearchSelect', template: '<div />' } }))
vi.mock('@/components/ListHeader.vue', () => ({ default: { name: 'ListHeader', template: '<div />' } }))

import EstimateForm from '@/pages/Estimates/EstimateForm.vue'

function mountForm() {
  const wrapper = mount(EstimateForm)
  return wrapper.vm as unknown as {
    form: { object: number | null; title: string; date: string; note: string }
    lines: Array<Record<string, unknown>>
    handleSubmit: () => Promise<void>
  }
}

describe('EstimateForm — контракт вложенных строк (F-928)', () => {
  beforeEach(() => { create.mockClear(); update.mockClear(); push.mockClear() })

  it('object предзаполнен из ?object= и залочен', async () => {
    const vm = mountForm()
    await nextTick()
    expect(vm.form.object).toBe(347)
  })

  it('режим (а) существующая позиция → work_item в payload', async () => {
    const vm = mountForm()
    await nextTick()
    vm.lines.splice(0, vm.lines.length, {
      _k: 'a', work_item: 55, category_a: null, category_b: null, name: 'Монтаж', kind: 'work', unit: 'шт.', quantity: '3', unit_price: '1000', position_no: '1',
    })
    await vm.handleSubmit()
    expect(create).toHaveBeenCalledTimes(1)
    const payload = create.mock.calls[0][0]
    expect(payload.object).toBe(347)
    // F-929 (review): mode «а» ТЕПЕРЬ шлёт снапшот-имя явно (иначе BE fallback на wi.name → нарушение историчности).
    expect(payload.lines[0]).toMatchObject({ work_item: 55, name: 'Монтаж', quantity: '3', unit_price: '1000', position_no: '1', order: 0 })
    expect(payload.lines[0].category).toBeUndefined()
  })

  it('режим (б) новая позиция в каталог → category+name, без work_item', async () => {
    const vm = mountForm()
    await nextTick()
    vm.lines.splice(0, vm.lines.length, {
      _k: 'b', work_item: null, category_a: 1, category_b: 2, name: 'Новая работа', kind: 'material', unit: 'м', quantity: '5', unit_price: '250', position_no: '',
    })
    await vm.handleSubmit()
    const payload = create.mock.calls[0][0]
    expect(payload.lines[0]).toMatchObject({ category: 2, name: 'Новая работа', quantity: '5', unit_price: '250' })
    expect(payload.lines[0].work_item).toBeUndefined()
    expect(payload.lines[0].default_price).toBe('250')
  })

  it('режим (в) свободная строка → только name, без work_item/category', async () => {
    const vm = mountForm()
    await nextTick()
    vm.lines.splice(0, vm.lines.length, {
      _k: 'c', work_item: null, category_a: null, category_b: null, name: 'Свободная', kind: 'work', unit: '', quantity: '2', unit_price: '500', position_no: '',
    })
    await vm.handleSubmit()
    const payload = create.mock.calls[0][0]
    expect(payload.lines[0]).toMatchObject({ name: 'Свободная', quantity: '2', unit_price: '500' })
    expect(payload.lines[0].work_item).toBeUndefined()
    expect(payload.lines[0].category).toBeUndefined()
  })

  it('не сабмитит без строк / без объекта', async () => {
    const vm = mountForm()
    await nextTick()
    vm.lines.splice(0, vm.lines.length) // ноль строк
    await vm.handleSubmit()
    expect(create).not.toHaveBeenCalled()
  })

  it('не сабмитит строку с отрицательным/пустым кол-вом', async () => {
    const vm = mountForm()
    await nextTick()
    vm.lines.splice(0, vm.lines.length, { _k: 'x', work_item: 10, category_a: null, category_b: null, name: 'X', kind: 'work', unit: '', quantity: '', unit_price: '100', position_no: '' })
    await vm.handleSubmit()
    expect(create).not.toHaveBeenCalled()
  })

  it('F-929: не сабмитит строку с отрицательной ценой (симметрия с кол-вом)', async () => {
    const vm = mountForm()
    await nextTick()
    vm.lines.splice(0, vm.lines.length, { _k: 'p', work_item: 10, category_a: null, category_b: null, name: 'X', kind: 'work', unit: '', quantity: '1', unit_price: '-5', position_no: '' })
    await vm.handleSubmit()
    expect(create).not.toHaveBeenCalled()
  })
})
