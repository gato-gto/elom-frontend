import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// F-1044 (B10). Раньше (F-229) форма в правке прибавляла своё количество к /balance обратно — неверно при
// смене даты или объекта (своя строка журнала на другом объекте/дате). Теперь собственная строка
// исключается на сервере (exclude_writeoff), а «хватает ли» считается по available — ровно проверка
// сервера (минимум на эту и последующие даты), а не по остатку на дату.

const getMock = vi.fn()
vi.mock('@/api/client', () => ({ default: { get: (...a: unknown[]) => getMock(...a) } }))
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

type Vm = {
  items: Array<Record<string, unknown>>
  formData: Record<string, unknown>
  loadCurrentBalance: (item: Record<string, unknown>) => Promise<void>
  exceedsAvailable: (item: Record<string, unknown>) => boolean
}

async function setup(initial?: Record<string, unknown>) {
  const wrapper = mount(WriteOffForm, {
    props: initial ? { initial } : {},
    global: { stubs: { PermissionButton: true, MaterialSearchSelect: true } },
  })
  await nextTick()
  const vm = wrapper.vm as unknown as Vm
  Object.assign(vm.formData, { object: 1, date: '2026-11-05' })
  return vm
}

describe('WriteOffForm: остаток в форме = проверка сервера (F-1044)', () => {
  beforeEach(() => getMock.mockReset())

  it('в правке передаёт exclude_writeoff и НЕ прибавляет своё количество', async () => {
    getMock.mockResolvedValue({ data: { current_balance: '10', available: '10' } })
    const vm = await setup({ id: 42, object: 1, responsible: 5, date: '2026-11-05', material: 100, quantity: '3' })
    const item: Record<string, unknown> = { material: 100, quantity: 3, unit: null, currentBalance: null }
    await vm.loadCurrentBalance(item)
    const balanceCalls = getMock.mock.calls.filter((c) => c[1]?.params?.material_id === 100)
    expect(balanceCalls.length).toBeGreaterThan(0)
    for (const c of balanceCalls) expect(c[1].params.exclude_writeoff).toBe(42)
    expect(item.currentBalance).toBe(10)
  })

  it('блокирует количество больше available, даже если на дату остатка хватает', async () => {
    getMock.mockResolvedValue({ data: { current_balance: '10', available: '2' } })
    const vm = await setup()
    const item: Record<string, unknown> = { material: 100, quantity: 5, unit: 1, currentBalance: null }
    await vm.loadCurrentBalance(item)
    expect(vm.exceedsAvailable(item)).toBe(true)
    item.quantity = '2'
    expect(vm.exceedsAvailable(item)).toBe(false)
  })

  it('старый BE без available — проверка по остатку на дату', async () => {
    getMock.mockResolvedValue({ data: { current_balance: '10' } })
    const vm = await setup()
    const item: Record<string, unknown> = { material: 100, quantity: 11, unit: 1, currentBalance: null }
    await vm.loadCurrentBalance(item)
    expect(vm.exceedsAvailable(item)).toBe(true)
  })
})
