import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Stores are consumed as `useXStore()` — every mock export MUST be a function.
// createBulk (F-270): именованный экспорт, мокаем как vi.fn() — форма зовёт его на CREATE.
vi.mock('@/stores/writeOffs', () => ({
  useWriteOffsStore: () => ({ create: vi.fn(), update: vi.fn(), items: [] }),
  createBulk: vi.fn()
}))

vi.mock('@/stores/ui', () => ({
  useUiStore: () => ({ toast: vi.fn() })
}))

vi.mock('@/stores/objects', () => ({
  useObjectsStore: () => ({
    items: [{ id: 1, name: 'Объект 1', responsible: 10 }],
    fetchList: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('@/stores/employees', () => ({
  useEmployeesStore: () => ({
    items: [{ id: 10, username: 'brigadier1', role: 'brigadier' }],
    fetchList: vi.fn().mockResolvedValue(undefined)
  }),
  getByObject: () => [{ id: 10, username: 'brigadier1', role: 'brigadier' }]
}))

vi.mock('@/stores/units', () => ({
  useUnitsStore: () => ({
    items: [{ id: 5, name: 'Килограмм', code: 'кг' }],
    fetchList: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('@/stores/materials', () => ({
  useMaterialsStore: () => ({
    items: [{ id: 100, name: 'Цемент', default_unit: 5 }],
    fetchList: vi.fn().mockResolvedValue(undefined)
  }),
  getMaterialsByObject: async () => [{ id: 100, name: 'Цемент', default_unit: 5 }]
}))

vi.mock('@/api/client', () => {
  const apiGet = vi.fn()
  return {
    default: { get: apiGet },
    apiGet // Export for use in tests
  }
})

// Stubs
const ModalStub = {
  template: '<div><slot /></div>',
  props: ['size', 'modelValue', 'title']
}
const MaterialSearchSelectStub = {
  template: '<div class="material-select-stub" @click="$emit(\'change\', { id: 100, name: \'Цемент\', default_unit: 5 })"></div>',
  emits: ['change', 'update:modelValue']
}

import WriteOffForm from '../WriteOffForm.vue'
import api from '@/api/client'
import { createBulk } from '@/stores/writeOffs'

describe('WriteOffForm.vue', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset()
    vi.mocked(createBulk).mockReset() // изолируем счётчик вызовов между тестами (F-270)
  })

  it('loads balance and shows future balance after selecting material and entering quantity', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { current_balance: '12.500000' } })

    const wrapper = mount(WriteOffForm, {
      props: { isOpen: true, initial: null },
      global: {
        stubs: {
          Modal: ModalStub,
          MaterialSearchSelect: MaterialSearchSelectStub
        }
      }
    })

    // Выбираем объект (устанавливаем напрямую formData, чтобы не тратить время на селект)
    await wrapper.vm.$nextTick()
    ;(wrapper.vm as any).formData.object = 1
    await (wrapper.vm as any).onObjectChange()

    // Кликаем по заглушке выбора материала, чтобы эмитить change
    await wrapper.find('.material-select-stub').trigger('click')
    // Введем количество в первое поле количества
    const qtyInput = wrapper.find('input[type="number"]')
    await qtyInput.setValue('2.5')

    // Ждем обновления и загрузки баланса
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100)) // Wait for async balance load
    await wrapper.vm.$nextTick()
    
    // Проверим, что запрос к API баланса ушел
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/stock/snapshots/balance/'), expect.objectContaining({
      params: expect.objectContaining({ object_id: 1, material_id: 100 })
    }))

    // Текущий остаток должен отобразиться (может быть отформатирован)
    const html = wrapper.html()
    const text = wrapper.text()
    // Проверяем что баланс загружен (может быть в разных форматах)
    expect(html.includes('12.5') || html.includes('12,5') || text.includes('12.5') || text.includes('12,5')).toBe(true)
  })

  // FE-3/F-563: раньше отправка одних пустых строк давала «Списание создано» при НУЛЕ записей
  // (guard items.length===0 не срабатывал; фильтр давал [] → Promise.all([]) резолвился).
  it('FE-3: submit with only the empty placeholder row emits NO success and shows an error', async () => {
    const wrapper = mount(WriteOffForm, {
      props: { isOpen: true, initial: null },
      global: { stubs: { Modal: ModalStub, MaterialSearchSelect: MaterialSearchSelectStub } }
    })
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as any
    vm.formData.object = 1
    vm.formData.responsible = 10
    // items содержит только пустой плейсхолдер (материал не выбран, кол-во 0)
    await vm.handleSubmit()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('success')).toBeFalsy()               // НЕ ложный успех
    expect(vm.errors.non_field_errors?.length).toBeTruthy()      // явная ошибка «добавьте позицию»
  })

  // F-270: CREATE многопозиционного «Нового списания» — ОДИН атомарный bulk-create,
  // а не N независимых create(). Раньше падение N-й строки оставляло первые сохранёнными.
  it('F-270: CREATE submits exactly ONE atomic bulk-create carrying all filled rows', async () => {
    vi.mocked(createBulk).mockResolvedValue({ count: 1, created: [] } as any)

    const wrapper = mount(WriteOffForm, {
      props: { isOpen: true, initial: null },
      global: { stubs: { Modal: ModalStub, MaterialSearchSelect: MaterialSearchSelectStub } }
    })
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as any
    vm.formData.object = 1
    vm.formData.responsible = 10
    vm.formData.date = '2026-02-01'
    // одна заполненная позиция с достаточным остатком (обходим overdraft-гард F-306)
    vm.addItem()
    vm.items[0].material = 100
    vm.items[0].unit = 5
    vm.items[0].quantity = '3'
    vm.items[0].currentBalance = 100

    await vm.handleSubmit()
    await wrapper.vm.$nextTick()

    expect(createBulk).toHaveBeenCalledTimes(1)
    expect(createBulk).toHaveBeenCalledWith(expect.objectContaining({
      object: 1,
      date: '2026-02-01',
      responsible: 10,
      items: [expect.objectContaining({ material: 100, unit: 5, quantity: '3' })],
    }))
    expect(wrapper.emitted('success')).toBeTruthy()
  })

  // F-270: построчные ошибки bulk-create (errors.items[{index, detail}]) раскладываются по
  // позициям; __all__ (напр. «Недостаточно остатка») ложится на поле quantity строки.
  it('F-270: maps bulk-create row errors onto the failing item', async () => {
    vi.mocked(createBulk).mockRejectedValue({
      response: { data: { detail: 'Ошибки в позициях', errors: { items: [
        { index: 0, detail: { __all__: ['Недостаточно остатка для списания'] } },
      ] } } },
    })

    const wrapper = mount(WriteOffForm, {
      props: { isOpen: true, initial: null },
      global: { stubs: { Modal: ModalStub, MaterialSearchSelect: MaterialSearchSelectStub } }
    })
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as any
    vm.formData.object = 1
    vm.formData.responsible = 10
    vm.formData.date = '2026-02-01'
    vm.addItem()
    vm.items[0].material = 100
    vm.items[0].unit = 5
    vm.items[0].quantity = '3'
    vm.items[0].currentBalance = 100

    await vm.handleSubmit()
    await wrapper.vm.$nextTick()

    expect(createBulk).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('success')).toBeFalsy()
    expect(vm.getItemFieldError(0, 'quantity')).toContain('Недостаточно остатка')
  })

  // F-270/M1: пустая строка ПЕРЕД ошибочной сдвигает индекс — ошибка обязана сесть на реальную
  // (заполненную) строку по индексу ОТОБРАЖЕНИЯ, а не на пустую/чужую (регресс M1).
  it('F-270/M1: bulk row error maps to the display row, not shifted by a leading empty row', async () => {
    // бэкенд видит позиции в индексах ОТПРАВЛЕННОГО filledItems: пустая строка отфильтрована,
    // поэтому заполненная строка (display idx 1) приходит как index 0.
    vi.mocked(createBulk).mockRejectedValue({
      response: { data: { detail: 'Ошибки в позициях', errors: { items: [
        { index: 0, detail: { __all__: ['Недостаточно остатка для списания'] } },
      ] } } },
    })

    const wrapper = mount(WriteOffForm, {
      props: { isOpen: true, initial: null },
      global: { stubs: { Modal: ModalStub, MaterialSearchSelect: MaterialSearchSelectStub } }
    })
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as any
    vm.formData.object = 1
    vm.formData.responsible = 10
    vm.formData.date = '2026-02-01'
    vm.addItem()                     // Row0 — пустая (material=null, отфильтруется)
    vm.addItem()                     // Row1 — заполненная
    vm.items[1].material = 100
    vm.items[1].unit = 5
    vm.items[1].quantity = '3'
    vm.items[1].currentBalance = 100

    await vm.handleSubmit()
    await wrapper.vm.$nextTick()

    expect(createBulk).toHaveBeenCalledTimes(1)
    // ошибка на заполненной строке (display idx 1), а НЕ на пустой (idx 0)
    expect(vm.getItemFieldError(1, 'quantity')).toContain('Недостаточно остатка')
    expect(vm.getItemFieldError(0, 'quantity')).toBe('')
  })

  // F-270/L1: построчная ошибка поля ШАПКИ (responsible) должна всплыть на форменной ошибке,
  // а не уйти в невидимый itemErrors-ключ.
  it('F-270/L1: bulk row error on a header field (responsible) surfaces on the form', async () => {
    vi.mocked(createBulk).mockRejectedValue({
      response: { data: { detail: 'Ошибки в позициях', errors: { items: [
        { index: 0, detail: { responsible: ['Недопустимый ответственный'] } },
      ] } } },
    })
    const wrapper = mount(WriteOffForm, {
      props: { isOpen: true, initial: null },
      global: { stubs: { Modal: ModalStub, MaterialSearchSelect: MaterialSearchSelectStub } }
    })
    await wrapper.vm.$nextTick()
    const vm = wrapper.vm as any
    vm.formData.object = 1
    vm.formData.responsible = 10
    vm.formData.date = '2026-02-01'
    vm.addItem()
    vm.items[0].material = 100
    vm.items[0].unit = 5
    vm.items[0].quantity = '3'
    vm.items[0].currentBalance = 100

    await vm.handleSubmit()
    await wrapper.vm.$nextTick()

    expect(vm.errors.responsible?.[0]).toContain('Недопустимый ответственный')
  })
})


