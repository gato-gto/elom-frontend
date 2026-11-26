import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// F-1093 (T3; ответы владельца 1 и 2): в списке списаний появилась кнопка «Удалить».
// D-2 (26.11): «Удалить» → «В корзину»; видимость — по полю сервера can_trash; вопрос — с последствиями для остатка.

const { remove, fetchList, perms, me, showSuccess } = vi.hoisted(() => ({
  remove: vi.fn().mockResolvedValue(undefined),
  showSuccess: vi.fn(),
  fetchList: vi.fn().mockResolvedValue(undefined),
  perms: { list: [] as string[] },
  me: { value: { id: 7, is_superuser: false, profile_id: 70, assigned_object_ids: [] as number[] } as
    { id: number; is_superuser: boolean; profile_id: number; assigned_object_ids: number[] } },
}))

vi.mock('vue-router', () => ({ useRoute: () => ({ query: {}, params: {} }), useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/stores/writeOffs', () => ({
  useWriteOffsStore: () => ({ items: [], fetchList, remove }),
}))
// объект 3 — бригадира (ответственный по profile_id 70)
vi.mock('@/stores/objects', () => ({ useObjectsStore: () => ({ items: [{ id: 3, responsible: 70 }], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/materials', () => ({ useMaterialsStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/employees', () => ({ useEmployeesStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ get me() { return me.value } }) }))
vi.mock('@/composables/useNotifications', () => ({ useNotifications: () => ({ showSuccess, showError: vi.fn() }) }))
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

type Action = { key: string; label?: string; permission?: string; visible?: (i: unknown) => boolean }
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
const WO = { id: 5, object: 3, quantity: '5.000000', unit_code: 'м', material_name: 'Кабель', object_name: 'Гостиница', is_archived: false }

describe('Список списаний: «В корзину» (F-1093, D-2)', () => {
  beforeEach(() => {
    remove.mockClear(); fetchList.mockClear(); showSuccess.mockClear()
    me.value = { id: 7, is_superuser: false, profile_id: 70, assigned_object_ids: [] }
  })

  it('действие «В корзину», гейт по writeoffs.delete', async () => {
    await mountList()
    expect(findDel()?.label).toBe('В корзину')
    expect(findDel()?.permission).toBe('writeoffs.delete')
  })

  it('видимость решает сервер (can_trash); архив — никогда', async () => {
    perms.list = ['writeoffs.delete', 'writeoffs.delete_all']
    await mountList()
    expect(del().visible({ ...WO, can_trash: false })).toBe(false)
    expect(del().visible({ ...WO, can_trash: true })).toBe(true)
    expect(del().visible({ ...WO, can_trash: true, is_archived: true })).toBe(false)
  })

  it('подтверждение с последствиями → в корзину и пересчёт списка; отказ → ничего', async () => {
    const w = await mountList()
    const vm = w.vm as unknown as { handleAction: (a: string, i: unknown) => Promise<void> }
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    await vm.handleAction('delete', WO)
    expect(remove).not.toHaveBeenCalled()
    fetchList.mockClear()
    await vm.handleAction('delete', WO)
    expect(remove).toHaveBeenCalledWith(5)
    expect(fetchList).toHaveBeenCalledTimes(1)   // F-1096: «Остаток» соседних строк пересчитан
    expect(confirmSpy).toHaveBeenCalledWith('Отправить списание в корзину? Остаток объекта «Гостиница» увеличится на 5 м '
      + '«Кабель». Руководство сможет вернуть его в течение 7 дней.')
    expect(showSuccess).toHaveBeenCalledWith('Списание в корзине')
    confirmSpy.mockRestore()
  })
})
