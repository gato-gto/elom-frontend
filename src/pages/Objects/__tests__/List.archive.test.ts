import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// F-1107 (ответ владельца 3): «В архив» / «Вернуть из архива» — явными действиями (раньше «Удалить» молча
// архивировал объект с историей, B13); тестовый объект со всеми документами удаляет только администратор,
// введя точное название.

const { update, remove, fetchList, post, me } = vi.hoisted(() => ({
  update: vi.fn().mockResolvedValue({}),
  remove: vi.fn().mockResolvedValue(undefined),
  fetchList: vi.fn().mockResolvedValue(undefined),
  post: vi.fn().mockResolvedValue({ data: { deleted: { закупки: 2 } } }),
  me: { value: { id: 1, is_superuser: true } as { id: number; is_superuser: boolean } },
}))
vi.mock('vue-router', () => ({ useRoute: () => ({ query: {}, params: {} }), useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/stores/objects', () => ({
  useObjectsStore: () => ({ items: [], fetchList, update, remove }),
  fetchResponsibles: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ get me() { return me.value } }) }))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))
vi.mock('@/composables/usePermissions', () => ({
  usePermissions: () => ({ can: () => true, canExportReports: { value: false }, hasPermission: () => true }),
}))
vi.mock('@/composables/useEditQuery', () => ({ useEditQuery: () => {} }))
vi.mock('@/api/client', () => ({ default: { get: vi.fn().mockResolvedValue({ data: [] }), post } }))

import ObjectsList from '@/pages/Objects/List.vue'
import { endpoints } from '@/api/endpoints'

type Action = { key: string; permission?: string; visible?: (i: unknown) => boolean; confirm?: (i: unknown) => string }
let captured: { actions: Action[] } | null = null
let emitAction: ((key: string, item: unknown) => void) | null = null
const GenericListStub = defineComponent({
  props: ['config'], emits: ['action'],
  setup(props, { emit }) {
    emitAction = (k, i) => emit('action', k, i)
    return () => { captured = props.config as { actions: Action[] }; return h('div') }
  },
})
const mountList = async () => {
  const w = mount(ObjectsList, { global: { stubs: { GenericList: GenericListStub, Modal: true, ObjectForm: true } } })
  await flushPromises()
  return w
}
const act = (k: string) => { const a = captured?.actions.find(x => x.key === k); if (!a) { throw new Error(`нет ${k}`) } return a }
const fire = (k: string, item: unknown) => { if (!emitAction) { throw new Error('нет emit') } emitAction(k, item) }
const ACTIVE = { id: 5, name: 'Гостиница', is_active: true }
const ARCHIVED = { id: 6, name: 'Тест-объект', is_active: false }

describe('Объекты: архив и удаление тестовых (F-1107)', () => {
  beforeEach(() => {
    update.mockClear(); remove.mockClear(); post.mockClear(); fetchList.mockClear()
    me.value = { id: 1, is_superuser: true }
    vi.restoreAllMocks()
  })

  it('«В архив» — у активного, «Вернуть из архива» — у архивного; право objects.delete', async () => {
    await mountList()
    expect([act('archive').permission, act('archive').visible?.(ACTIVE), act('archive').visible?.(ARCHIVED)])
      .toEqual(['objects.delete', true, false])
    expect([act('unarchive').permission, act('unarchive').visible?.(ARCHIVED), act('unarchive').visible?.(ACTIVE)])
      .toEqual(['objects.delete', true, false])
  })

  it('«В архив» спрашивает и снимает активность; «Вернуть» — ставит', async () => {
    await mountList()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    fire('archive', ACTIVE)
    await flushPromises()
    fire('unarchive', ARCHIVED)
    await flushPromises()
    expect(update.mock.calls).toEqual([[5, { is_active: false }], [6, { is_active: true }]])
  })

  it('«Удалить» больше не обещает деактивацию', async () => {
    await mountList()
    expect(act('delete').confirm?.(ACTIVE)).toBe('Удалить объект «Гостиница»? Объект с документами удалить нельзя — его отправляют в архив.')
  })

  it('удалить тестовый объект: только суперпользователь и только из архива', async () => {
    await mountList()
    expect([act('purge').visible?.(ARCHIVED), act('purge').visible?.(ACTIVE)]).toEqual([true, false])
    me.value = { id: 2, is_superuser: false }
    expect(act('purge').visible?.(ARCHIVED)).toBe(false)
  })

  it('удалить тестовый: нужно ввести точное название; отмена или неверное — ничего', async () => {
    await mountList()
    // F-1111: регистр, «умные» кавычки и пробел в конце (клавиатура iOS) не важны — неверно только другое название
    const ask = vi.spyOn(window, 'prompt').mockReturnValueOnce(null).mockReturnValueOnce('Тест-объект-2').mockReturnValueOnce('тест-объект ')
    fire('purge', ARCHIVED); await flushPromises()
    fire('purge', ARCHIVED); await flushPromises()
    expect(post).not.toHaveBeenCalled()
    fire('purge', ARCHIVED); await flushPromises()
    expect(post).toHaveBeenCalledWith(endpoints.objects.purge(6), { confirm_name: 'тест-объект ' })
    expect(ask.mock.calls[0][0]).toContain('Удалить «Тест-объект» со всеми закупками, списаниями и движениями')
  })
})
