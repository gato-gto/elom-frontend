import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// F-1109 (live-проверка 25.11, списание 380 на объекте 484): правка списания архивного объекта — поле «Объект»
// было пустым, а ответственный подписан «(текущий ответственный)», хотя он ответственный объекта. И в обоих
// выпадающих списках была двойная заглушка («— выберите … —» дважды).

const EMPLOYEES = [{ id: 2, profile_id: 102, username: 'denis', first_name: 'Денис', last_name: '', assigned_object_ids: [] }]
const { get } = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/stores/writeOffs', () => ({ useWriteOffsStore: () => ({ update: vi.fn(), create: vi.fn(), items: [] }), createBulk: vi.fn() }))
vi.mock('@/stores/objects', () => ({
  useObjectsStore: () => ({ items: [{ id: 7, name: 'O-7', responsible: 999, is_active: true },
    { id: 8, name: 'O-8', responsible: 998, is_active: true }], fetchList: vi.fn().mockResolvedValue(undefined) }),
}))
vi.mock('@/stores/employees', () => ({
  useEmployeesStore: () => ({ items: EMPLOYEES, fetchList: vi.fn().mockResolvedValue(undefined) }),
  getByObject: () => [], getResponsibleEmployees: () => EMPLOYEES, canBeResponsible: () => true,
}))
vi.mock('@/api/client', () => ({ default: { get, post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
vi.mock('@/stores/units', () => ({ useUnitsStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/materials', () => ({
  useMaterialsStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined), fetchByObject: vi.fn().mockResolvedValue([]) }),
}))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ me: { id: 4 } }) }))

import WriteOffForm from '@/pages/WriteOffs/WriteOffForm.vue'

const INITIAL = { id: 380, object: 484, object_name: 'Офис Медцентр', material: 5, unit: 1, quantity: '7', responsible: 2,
  date: '2026-11-19', comment: '' }

describe('WriteOffForm: списание архивного объекта (F-1109)', () => {
  it('объект показан с пометкой, ответственный объекта найден по карточке объекта', async () => {
    get.mockImplementation((url: string) => Promise.resolve({
      data: String(url).includes('/objects/484/') ? { id: 484, name: 'Офис Медцентр', responsible: 102, is_active: false }
        : { results: [], count: 0 } }))
    const w = mount(WriteOffForm, { props: { initial: INITIAL, isOpen: true }, global: { stubs: { PermissionButton: true, MaterialSearchSelect: true } } })
    await flushPromises()
    const vm = w.vm as unknown as { loadEmployeesByObject: (id: number) => Promise<void>;
      responsibleOptions: Array<{ value: number; label: string }> }
    await vm.loadEmployeesByObject(484)
    const objectSelect = w.findAll('select')[0]
    expect(objectSelect.findAll('option').map(o => o.text())).toContain('Офис Медцентр (в архиве)')
    expect(vm.responsibleOptions.find(o => o.value === 2)?.label).toBe('Денис (ответственный за объект)')
  })

  it('в выпадающих списках одна заглушка, не две', async () => {
    get.mockResolvedValue({ data: { results: [], count: 0 } })
    const w = mount(WriteOffForm, { props: { isOpen: true }, global: { stubs: { PermissionButton: true, MaterialSearchSelect: true } } })
    await flushPromises()
    const [objectSelect, respSelect] = w.findAll('select')
    expect(objectSelect.findAll('option').filter(o => o.text() === '— выберите объект —').length).toBe(1)
    expect(respSelect.findAll('option').filter(o => o.text().startsWith('— ')).length).toBe(1)
  })
})
