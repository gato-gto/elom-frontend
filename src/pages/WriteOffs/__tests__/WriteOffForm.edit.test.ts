import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// F-072: раньше при редактировании сохранялась только items[0], остальные позиции
// молча терялись. Теперь первая обновляет запись, остальные создаются как новые.

// F-628 (#13): добавочные позиции edit-пути идут через атомарный createBulk, не N×create.
// createBulk — именованный экспорт, ссылается в фабрике vi.mock напрямую → нужен vi.hoisted
// (иначе TDZ: «Cannot access before initialization»).
const { update, create, createBulk } = vi.hoisted(() => ({
  update: vi.fn().mockResolvedValue({}),
  create: vi.fn().mockResolvedValue({}),
  createBulk: vi.fn().mockResolvedValue({ count: 1, created: [] }),
}))

vi.mock('@/stores/writeOffs', () => ({ useWriteOffsStore: () => ({ update, create, items: [] }), createBulk }))
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
  beforeEach(() => { update.mockClear(); create.mockClear(); createBulk.mockClear() })

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
    // F-628 (#13): добавочная позиция уходит одним атомарным createBulk (не create), retry не дублирует
    expect(create).not.toHaveBeenCalled()
    expect(createBulk).toHaveBeenCalledTimes(1)
    expect(createBulk).toHaveBeenCalledWith(expect.objectContaining({
      object: 1,
      items: [expect.objectContaining({ material: 11, quantity: '4' })],
    }))
  })

  // F-634: edit-путь шлёт extras = filledItems.slice(1); построчная ошибка bulk-create приходит в
  // индексах ЭТОГО (смещённого) массива. Ошибка должна сесть на добавочную позицию (display idx 1),
  // а НЕ на обновляемую (idx 0) — иначе класс M1 (ошибка на чужой строке) в edit-пути.
  it('F-634: edit-path bulk error maps to the extra row, not the updated row (off-by-one)', async () => {
    createBulk.mockRejectedValueOnce({
      response: { data: { detail: 'Ошибки в позициях', errors: { items: [
        { index: 0, detail: { __all__: ['Недостаточно остатка'] } },
      ] } } },
    })
    const wrapper = mount(WriteOffForm, {
      props: { initial: { id: 42, object: 1, responsible: 5, date: '2026-01-01' } },
      global: { stubs: { PermissionButton: true, MaterialSearchSelect: true } },
    })
    await nextTick()
    const vm = wrapper.vm as unknown as {
      items: Array<Record<string, unknown>>
      formData: Record<string, unknown>
      handleSubmit: () => Promise<void>
      getItemFieldError: (i: number, f: string) => string | undefined
    }
    Object.assign(vm.formData, { object: 1, responsible: 5, date: '2026-01-01', comment: '' })
    vm.items.splice(0, vm.items.length,
      { _k: 'a', material: 10, unit: 2, quantity: '3' },   // обновляемая (idx 0)
      { _k: 'b', material: 11, unit: 2, quantity: '4' },   // добавочная (idx 1) — она в bulk
    )
    await nextTick()
    await vm.handleSubmit()
    await nextTick()
    expect(vm.getItemFieldError(1, 'quantity')).toContain('Недостаточно остатка')
    expect(vm.getItemFieldError(0, 'quantity') || '').toBe('')
  })
})
