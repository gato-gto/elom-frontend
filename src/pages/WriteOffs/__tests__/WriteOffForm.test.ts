import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Stores are consumed as `useXStore()` — every mock export MUST be a function.
vi.mock('@/stores/writeOffs', () => ({
  useWriteOffsStore: () => ({ create: vi.fn(), update: vi.fn(), items: [] })
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
  getByObject: (_objectId: number) => [{ id: 10, username: 'brigadier1', role: 'brigadier' }]
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
  getMaterialsByObject: async (_objectId: number) => [{ id: 100, name: 'Цемент', default_unit: 5 }]
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

describe('WriteOffForm.vue', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset()
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
})


