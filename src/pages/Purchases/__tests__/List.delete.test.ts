import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// F-1093 (T3; ответы владельца 1 и 2): в списке закупок появилась кнопка «Удалить».
// D-2 (26.11): «Удалить» → «В корзину»; кто может — решает сервер (поле can_trash, окно 3 ч считает он).

const { remove, perms, me, showSuccess } = vi.hoisted(() => ({
  remove: vi.fn().mockResolvedValue(undefined),
  showSuccess: vi.fn(),
  perms: { list: [] as string[] },
  me: { value: { id: 7, is_superuser: false, profile_id: 70, assigned_object_ids: [] as number[] } as
    { id: number; is_superuser: boolean; profile_id: number; assigned_object_ids: number[] } },
}))

vi.mock('vue-router', () => ({ useRoute: () => ({ query: {}, params: {} }), useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/stores/purchases', () => ({
  usePurchasesStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined), remove }),
  approvePurchaseWithReport: vi.fn(), rejectPurchase: vi.fn(),
}))
vi.mock('@/stores/objects', () => ({ useObjectsStore: () => ({ items: [{ id: 3, responsible: 70 }], selectOptions: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/employees', () => ({ useEmployeesStore: () => ({ items: [], selectOptions: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ get me() { return me.value } }) }))
vi.mock('@/composables/useNotifications', () => ({ useNotifications: () => ({ showSuccess, showError: vi.fn() }) }))
vi.mock('@/composables/usePermissions', () => ({
  usePermissions: () => ({
    canCreateRequests: { value: false }, canApprovePurchases: { value: false }, canExportReports: { value: false },
    hasPermission: (c: string) => perms.list.includes(c), can: () => true,
  }),
}))
vi.mock('@/composables/useEditQuery', () => ({ useEditQuery: () => {} }))
vi.mock('@/api/client', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }), delete: vi.fn() },
}))

import PurchasesList from '@/pages/Purchases/List.vue'

type Action = { key: string; label?: string; permission?: string; visible?: (i: unknown) => boolean }
let captured: { actions: Action[] } | null = null
const GenericListStub = defineComponent({
  props: ['config'],
  setup(props) { return () => { captured = props.config as { actions: Action[] }; return h('div') } },
})
async function mountList() {
  captured = null
  const w = mount(PurchasesList, {
    global: { stubs: { GenericList: GenericListStub, Modal: true, PurchaseForm: true, PurchaseInfo: true } },
  })
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
const P = { id: 21552, object: 3, purchase_no: 'P0005', status: 'completed', object_name: 'Медцентр 01', created_by: 99, is_archived: false }

describe('Список закупок: «В корзину» (F-1093, D-2)', () => {
  beforeEach(() => { remove.mockClear() })

  it('действие «В корзину», гейт по purchases.delete', async () => {
    await mountList()
    expect(findDel()?.label).toBe('В корзину')
    expect(findDel()?.permission).toBe('purchases.delete')
  })

  it('видимость решает сервер (can_trash), а не права на клиенте', async () => {
    perms.list = ['purchases.delete', 'purchases.delete_all']   // руководство — но сервер сказал «нельзя»
    await mountList()
    expect(del().visible({ ...P, can_trash: false })).toBe(false)
    perms.list = ['purchases.delete', 'purchases.delete_own']   // бригадир — сервер разрешил (своё, в пределах 3 ч)
    await mountList()
    expect(del().visible({ ...P, can_trash: true })).toBe(true)
    expect(del().visible({ ...P, can_trash: true, is_archived: true })).toBe(false)
  })

  it('вопрос — про остаток и возврат; отказ ничего не трогает; уведомление «в корзине»', async () => {
    const w = await mountList()
    const vm = w.vm as unknown as { handleAction: (a: string, i: unknown) => Promise<void> }
    const spy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    await vm.handleAction('delete', P)
    expect(remove).not.toHaveBeenCalled()
    await vm.handleAction('delete', P)
    expect(remove).toHaveBeenCalledWith(21552)
    expect(spy).toHaveBeenCalledWith('Отправить закупку P0005 в корзину? Её приход уйдёт с остатка объекта «Медцентр 01». '
      + 'Руководство сможет вернуть её в течение 7 дней.')
    expect(showSuccess).toHaveBeenCalledWith('Закупка в корзине')
    spy.mockRestore()
  })
})
