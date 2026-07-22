import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// F-301: единица измерения — производное поле, ВСЕГДА следует за материалом.
// Регресс: смена материала должна менять unit (раньше guard `&& !item.unit`
// оставлял единицу от предыдущего материала).

vi.mock('@/api/client', () => ({ default: { get: vi.fn().mockResolvedValue({ data: { current_balance: '10' } }) } }))
vi.mock('@/stores/writeOffs', () => ({ useWriteOffsStore: () => ({ update: vi.fn(), create: vi.fn(), items: [] }) }))
vi.mock('@/stores/objects', () => ({ useObjectsStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/units', () => ({ useUnitsStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/materials', () => ({ useMaterialsStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined), fetchByObject: vi.fn().mockResolvedValue([]) }) }))
vi.mock('@/stores/employees', () => ({ useEmployeesStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ user: { id: 1 } }) }))
vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: () => ({ handleFormError: vi.fn(), handleLoadingError: vi.fn(), clearErrors: vi.fn(), errors: { value: {} } }),
}))

import WriteOffForm from '@/pages/WriteOffs/WriteOffForm.vue'

describe('WriteOffForm — unit follows material (F-301)', () => {
  it('updates the unit when the material is CHANGED, not only first-set', async () => {
    const wrapper = mount(WriteOffForm, {
      props: { initial: { object: 1, date: '2026-01-01' } },
      global: { stubs: { PermissionButton: true, MaterialSearchSelect: true } },
    })
    await nextTick()
    const vm = wrapper.vm as unknown as {
      formData: Record<string, unknown>
      onItemMaterialChange: (item: Record<string, unknown>, m: Record<string, unknown> | null) => Promise<void>
    }
    Object.assign(vm.formData, { object: 1, date: '2026-01-01' })

    const item: Record<string, unknown> = { _k: 'k1', material: null, unit: 0, quantity: '', currentBalance: null }

    // выбрали материал A (default_unit 7) → единица = 7
    await vm.onItemMaterialChange(item, { id: 10, default_unit: 7 })
    expect(item.unit).toBe(7)

    // СМЕНИЛИ на материал B (default_unit 9) → единица ДОЛЖНА стать 9 (был баг: оставалась 7)
    await vm.onItemMaterialChange(item, { id: 11, default_unit: 9 })
    expect(item.unit).toBe(9)

    // сброс материала → единица обнуляется
    await vm.onItemMaterialChange(item, null)
    expect(item.unit).toBe(0)
  })
})
