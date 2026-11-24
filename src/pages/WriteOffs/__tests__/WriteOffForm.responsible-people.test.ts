import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// F-1089 (ответ владельца 11): ответственный списания — только люди объекта (его ответственный + назначенные).
// Раньше список предлагал всех сотрудников, и руководство могло записать списание на человека с чужого объекта.
// Сервер проверяет то же правило (400), форма не должна его предлагать.

const EMPLOYEES = [
  { id: 1, profile_id: 101, username: 'helper', first_name: 'Пётр', last_name: 'Назначенный', assigned_object_ids: [7] },
  { id: 2, profile_id: 102, username: 'resp', first_name: 'Иван', last_name: 'Ответственный', assigned_object_ids: [] },
  { id: 3, profile_id: 103, username: 'stranger', first_name: 'Чужой', last_name: 'Бригадир', assigned_object_ids: [8] },
  { id: 4, profile_id: 104, username: 'mgr', first_name: 'Менеджер', last_name: '', assigned_object_ids: [] },
  // F-1094 (ревью): назначены на объект 7, но списание на них не уменьшит остаток — не предлагаем
  { id: 5, profile_id: 105, username: 'gone', first_name: 'Ушедший', last_name: '', assigned_object_ids: [7], is_active: false },
  { id: 6, profile_id: 106, username: 'mgr7', first_name: 'Менеджер7', last_name: '', assigned_object_ids: [7],
    roles: [{ name: 'manager' }] },
  { id: 9, profile_id: 109, username: 'mixed', first_name: 'Смешанный', last_name: '', assigned_object_ids: [7],
    roles: [{ name: 'manager' }, { name: 'brigadier' }] },
]

vi.mock('@/stores/writeOffs', () => ({
  useWriteOffsStore: () => ({ update: vi.fn(), create: vi.fn(), items: [] }), createBulk: vi.fn(),
}))
vi.mock('@/stores/objects', () => ({
  useObjectsStore: () => ({
    items: [{ id: 7, name: 'O-7', responsible: 102, is_active: true }, { id: 8, name: 'O-8', responsible: 103, is_active: true }],
    fetchList: vi.fn().mockResolvedValue(undefined),
  }),
}))
vi.mock('@/stores/employees', () => ({
  useEmployeesStore: () => ({ items: EMPLOYEES, fetchList: vi.fn().mockResolvedValue(undefined) }),
  getByObject: (objectId: number) => EMPLOYEES.filter(e => e.assigned_object_ids.includes(objectId)),
  // прежний код брал «всех, кто может быть ответственным» — оставлено, чтобы проверка на старом коде была честной
  getResponsibleEmployees: () => EMPLOYEES,
  canBeResponsible: () => true,
}))
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}))
vi.mock('@/stores/units', () => ({ useUnitsStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/materials', () => ({
  useMaterialsStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined), fetchByObject: vi.fn().mockResolvedValue([]) }),
}))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ me: { id: 4 } }) }))

import WriteOffForm from '@/pages/WriteOffs/WriteOffForm.vue'

type Vm = {
  responsibleOptions: Array<{ value: number; label: string }>
  formData: { responsible: number }
  loadEmployeesByObject: (id: number) => Promise<void>
}
const stubs = { PermissionButton: true, MaterialSearchSelect: true }

async function optionsFor(objectId: number, initial?: Record<string, unknown>) {
  const w = mount(WriteOffForm, { props: initial ? { initial } : {}, global: { stubs } })
  await flushPromises()
  const vm = w.vm as unknown as Vm
  await vm.loadEmployeesByObject(objectId)
  return vm
}

describe('WriteOffForm: ответственный — только люди объекта (F-1089)', () => {
  it('объект 7: ответственный объекта и назначенные с учётом; чужих, отключённых и «без учёта» нет', async () => {
    const vm = await optionsFor(7)
    expect(vm.responsibleOptions.map(o => o.value)).toEqual([0, 2, 1, 9])
    expect(vm.responsibleOptions[1].label).toBe('Иван Ответственный (ответственный за объект)')
  })

  it('автозаполнение — ответственный объекта', async () => {
    const vm = await optionsFor(7)
    expect(vm.formData.responsible).toBe(2)
  })

  it('без объекта выбирать не из кого', async () => {
    const vm = await optionsFor(0)
    expect(vm.responsibleOptions).toEqual([{ value: 0, label: '— сначала выберите объект —' }])
  })

  it('правка строки до правила: текущий (чужой) ответственный остаётся выбираемым на том же объекте', async () => {
    const vm = await optionsFor(7, { id: 50, object: 7, responsible: 3, date: '2026-03-05' })
    expect(vm.responsibleOptions.map(o => o.value)).toEqual([0, 2, 1, 9, 3])
    expect(vm.responsibleOptions[4].label).toBe('Чужой Бригадир (текущий ответственный)')
  })

  it('та же строка при смене объекта — прежний ответственный не предлагается', async () => {
    const vm = await optionsFor(8, { id: 50, object: 7, responsible: 1, date: '2026-03-05' })
    expect(vm.responsibleOptions.map(o => o.value)).toEqual([0, 3])
  })
})
