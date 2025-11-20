import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/stores/writeOffs', () => ({
  useWriteOffsStore: {}
}))

vi.mock('@/stores/objects', () => ({
  useObjectsStore: { items: [{ id: 1, name: 'Объект 1', responsible: 10 }] }
}))

vi.mock('@/stores/employees', () => ({
  useEmployeesStore: { items: [{ id: 10, username: 'brigadier1', role: 'brigadier' }] },
  getByObject: (objectId: number) => [{ id: 10, username: 'brigadier1', role: 'brigadier' }]
}))

vi.mock('@/stores/units', () => ({
  useUnitsStore: { items: [{ id: 5, name: 'Килограмм', code: 'кг' }] }
}))

vi.mock('@/stores/materials', () => {
  const materialsStoreMock = {
    items: [{ id: 100, name: 'Цемент', default_unit: 5 }],
    fetchList: vi.fn()
  }
  return {
    useMaterialsStore: materialsStoreMock,
    getMaterialsByObject: async (objectId: number) => [{ id: 100, name: 'Цемент', default_unit: 5 }]
  }
})

vi.mock('@/api/client', () => {
  const apiGet = vi.fn()
  return {
    default: { get: apiGet }
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

describe('WriteOffForm.vue', () => {
  beforeEach(() => {
    apiGet.mockReset()
  })

  it('loads balance and shows future balance after selecting material and entering quantity', async () => {
    apiGet.mockResolvedValueOnce({ data: { current_balance: '12.500000' } })

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

    // Ждем обновления
    await wrapper.vm.$nextTick()
    // Проверим, что запрос к API баланса ушел
    expect(apiGet).toHaveBeenCalledWith(expect.stringContaining('/stock/snapshots/balance/'), expect.objectContaining({
      params: expect.objectContaining({ object_id: 1, material_id: 100 })
    }))

    // Текущий остаток должен отобразиться
    expect(wrapper.html()).toContain('12.500000')
    // Будущий остаток = 12.5 - 2.5 = 10.000000 (отображается округленным)
    expect(wrapper.text()).toMatch(/10[,\.\s]?0{5}/)
  })
})


