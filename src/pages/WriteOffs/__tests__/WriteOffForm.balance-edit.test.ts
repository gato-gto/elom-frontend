import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// F-229: in edit mode the /balance endpoint already subtracts THIS write-off's own snapshot, so the
// form must add the row's quantity back before display — otherwise "текущий/будущий остаток"
// subtracts the write-off twice. Display-only (submit untouched).

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

describe('WriteOffForm edit-mode balance (F-229)', () => {
  it('adds this write-off quantity back to the fetched balance in edit mode', async () => {
    const wrapper = mount(WriteOffForm, {
      props: { initial: { id: 42, object: 1, responsible: 5, date: '2026-01-01', material: 100, quantity: '3' } },
      global: { stubs: { PermissionButton: true, MaterialSearchSelect: true } },
    })
    await nextTick()
    const vm = wrapper.vm as unknown as {
      items: Array<Record<string, unknown>>
      formData: Record<string, unknown>
      loadCurrentBalance: (item: Record<string, unknown>) => Promise<void>
    }
    Object.assign(vm.formData, { object: 1, date: '2026-01-01' })
    const item = vm.items[0] || { material: 100, quantity: 3, unit: null, currentBalance: null }
    item.material = 100; item.quantity = 3
    await vm.loadCurrentBalance(item)
    // fetched 10 (already net of this write-off) + own 3 = 13 → getFutureBalance(13-3)=10 (correct)
    expect(Number(item.currentBalance)).toBeCloseTo(13, 1)
  })
})
