import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// F-072: раньше при редактировании сохранялась только items[0], остальные позиции
// молча терялись. Теперь первая обновляет запись, остальные создаются как новые.

const update = vi.fn().mockResolvedValue({})
const create = vi.fn().mockResolvedValue({})

vi.mock('@/stores/writeOffs', () => ({ useWriteOffsStore: () => ({ update, create, items: [] }) }))
vi.mock('@/stores/objects', () => ({ useObjectsStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/units', () => ({ useUnitsStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/materials', () => ({ useMaterialsStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined), fetchByObject: vi.fn().mockResolvedValue([]) }) }))
vi.mock('@/stores/employees', () => ({ useEmployeesStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ user: { id: 1 } }) }))
vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleFormError: vi.fn(),
    handleLoadingError: vi.fn(),
    clearErrors: vi.fn(),
    errors: { value: {} as Record<string, unknown> },
  }),
}))

import WriteOffForm from '@/pages/WriteOffs/WriteOffForm.vue'

describe('WriteOffForm edit — no position dropped (F-072)', () => {
  beforeEach(() => { update.mockClear(); create.mockClear() })

  it('edit with 2 positions updates the record and creates the extra', async () => {
    const wrapper = mount(WriteOffForm, {
      props: { initial: { id: 42, object: 1, responsible: 5, date: '2026-01-01' } },
      global: { stubs: { PermissionButton: true, MaterialSearchSelect: true } },
    })
    await nextTick()
    const vm = wrapper.vm as unknown as {
      items: Array<Record<string, unknown>>
      formData: Record<string, unknown>
      handleSubmit: () => Promise<void>
    }
    // задаём форму и две позиции напрямую (wrapper.vm авто-разворачивает ref'ы)
    Object.assign(vm.formData, { object: 1, responsible: 5, date: '2026-01-01', comment: '' })
    vm.items.splice(0, vm.items.length,
      { _k: 'a', material: 10, unit: 2, quantity: '3' },
      { _k: 'b', material: 11, unit: 2, quantity: '4' },
    )
    await nextTick()
    await vm.handleSubmit()
    expect(update).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledWith(42, expect.objectContaining({ material: 10, quantity: '3' }))
    expect(create).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ material: 11, quantity: '4' }))
  })
})
