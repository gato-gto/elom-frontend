import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// F-1093 (T3; ответы владельца 1 и 2): в списке списаний появилась кнопка «Удалить».
// Видна по тому же правилу, что на сервере; перед удалением — вопрос с последствиями для остатка.

const { remove, perms, me } = vi.hoisted(() => ({
  remove: vi.fn().mockResolvedValue(undefined),
  perms: { list: [] as string[] },
  me: { value: { id: 7, is_superuser: false } as { id: number; is_superuser: boolean } },
}))

vi.mock('vue-router', () => ({ useRoute: () => ({ query: {}, params: {} }), useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/stores/writeOffs', () => ({
  useWriteOffsStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined), remove }),
}))
vi.mock('@/stores/objects', () => ({ useObjectsStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/materials', () => ({ useMaterialsStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/employees', () => ({ useEmployeesStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ get me() { return me.value } }) }))
vi.mock('@/composables/useNotifications', () => ({ useNotifications: () => ({ showSuccess: vi.fn(), showError: vi.fn() }) }))
vi.mock('@/composables/usePermissions', () => ({
  usePermissions: () => ({
    can: () => true,
    canExportReports: { value: false },
    hasPermission: (c: string) => perms.list.includes(c),
  }),
}))
vi.mock('@/composables/useEditQuery', () => ({ useEditQuery: () => {} }))
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

import WriteOffsList from '@/pages/WriteOffs/List.vue'

type Action = { key: string; permission?: string; visible?: (i: unknown) => boolean }
type Cfg = { actions: Action[] }
let captured: Cfg | null = null
const GenericListStub = defineComponent({
  props: ['config'],
  setup(props) { return () => { captured = props.config as Cfg; return h('div') } },
})

async function mountList() {
  captured = null
  const w = mount(WriteOffsList, { global: { stubs: { GenericList: GenericListStub, Modal: true } } })
  await flushPromises()
  return w
}
// без «!»: нет действия — тест падает явно
const findDel = () => captured?.actions.find(a => a.key === 'delete')
const del = () => {
  const a = findDel()
  if (!a?.visible) { throw new Error('нет действия «Удалить» с visible') }
  return a as Action & { visible: (i: unknown) => boolean }
}
const WO = { id: 5, quantity: '5.000000', unit_code: 'м', material_name: 'Кабель', object_name: 'Гостиница', is_archived: false }

describe('Список списаний: «Удалить» (F-1093)', () => {
  beforeEach(() => { remove.mockClear(); me.value = { id: 7, is_superuser: false } })

  it('действие есть, гейт по writeoffs.delete', async () => {
    await mountList()
    expect(findDel()?.permission).toBe('writeoffs.delete')
  })

  it('бригадир видит у своего списания и не видит у чужого', async () => {
    perms.list = ['writeoffs.delete', 'writeoffs.delete_own']
    await mountList()
    expect(del().visible({ ...WO, created_by: 7 })).toBe(true)
    expect(del().visible({ ...WO, created_by: 99 })).toBe(false)
  })

  it('руководство видит у любого, кроме архивного', async () => {
    perms.list = ['writeoffs.delete', 'writeoffs.delete_all']
    await mountList()
    expect(del().visible({ ...WO, created_by: 99 })).toBe(true)
    expect(del().visible({ ...WO, created_by: 99, is_archived: true })).toBe(false)
  })

  it('подтверждение с последствиями → удаляет; отказ → не удаляет', async () => {
    const w = await mountList()
    const vm = w.vm as unknown as { handleAction: (a: string, i: unknown) => Promise<void> }
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    await vm.handleAction('delete', WO)
    expect(remove).not.toHaveBeenCalled()
    await vm.handleAction('delete', WO)
    expect(remove).toHaveBeenCalledWith(5)
    expect(confirmSpy).toHaveBeenCalledWith('Удалить списание? Остаток объекта «Гостиница» увеличится на 5 м «Кабель».')
    confirmSpy.mockRestore()
  })
})
