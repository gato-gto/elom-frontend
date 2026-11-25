import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// F-1101 (ответ владельца 12): в списке инструментов — «Списать» / «Вернуть в работу», выдача списанного и
// утерянного закрыта с причиной в подсказке, фильтр «Списанные».

const { restore, fetchList } = vi.hoisted(() => ({
  restore: vi.fn().mockResolvedValue({}),
  fetchList: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('vue-router', () => ({ useRoute: () => ({ query: {}, params: {} }), useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/stores/tools', () => ({
  useToolsStore: () => ({ items: [], fetchList, fetchCategories: vi.fn().mockResolvedValue([]), restore, remove: vi.fn() }),
}))
vi.mock('@/stores/toolIssues', () => ({ useToolIssuesStore: () => ({}) }))
vi.mock('@/stores/objects', () => ({ useObjectsStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/employees', () => ({ useEmployeesStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))
vi.mock('@/composables/usePermissions', () => ({
  usePermissions: () => ({ can: () => true, canExportReports: { value: false }, hasPermission: () => true }),
}))
vi.mock('@/composables/useEditQuery', () => ({ useEditQuery: () => {} }))
vi.mock('@/api/client', () => ({ default: { get: vi.fn().mockResolvedValue({ data: { results: [] } }) } }))

import ToolsList from '@/pages/Tools/List.vue'

type Action = {
  key: string; permission?: string
  visible?: (i: unknown) => boolean; disabled?: (i: unknown) => boolean
  disabledTooltip?: string | ((i: unknown) => string)
}
type Filter = { key: string; options?: { value: string; label: string }[] }
type Cfg = { actions: Action[]; filters: Filter[] }
let captured: Cfg | null = null
let emitAction: ((key: string, item: unknown) => void) | null = null
const GenericListStub = defineComponent({
  props: ['config'],
  emits: ['action'],
  setup(props, { emit }) {
    emitAction = (key, item) => emit('action', key, item)
    return () => { captured = props.config as Cfg; return h('div') }
  },
})
const ModalStub = defineComponent({
  props: ['modelValue', 'title'],
  setup(props, { slots }) { return () => (props.modelValue ? h('div', { 'data-modal': props.title }, slots.default?.()) : null) },
})

async function mountList() {
  captured = null
  const w = mount(ToolsList, {
    global: { stubs: { GenericList: GenericListStub, Modal: ModalStub, ToolForm: true, ToolBulkAddForm: true,
      ToolIssueForm: true, ToolReturnForm: true, ToolHistory: true, ToolWriteOffForm: true } },
  })
  await flushPromises()
  return w
}
const action = (key: string): Action => {
  const a = captured?.actions.find(x => x.key === key)
  if (!a) { throw new Error(`нет действия ${key}`) }
  return a
}
// без «!»: нет функции — тест падает явно
const fn = <F,>(f: F | undefined | null): F => { if (!f) { throw new Error('нет функции') } return f }
const tip = (a: Action, item: unknown) => (typeof a.disabledTooltip === 'function' ? a.disabledTooltip(item) : a.disabledTooltip)
const T = { id: 9, inventory_number: 'INV-9', name: 'Дрель', condition: 'good', current_holder: null, is_written_off: false }

describe('Список инструментов: списание (F-1101)', () => {
  beforeEach(() => { restore.mockClear(); fetchList.mockClear(); vi.restoreAllMocks() })

  it('«Выдать» закрыто у списанного и утерянного — причина в подсказке; сломанный выдаётся', async () => {
    await mountList()
    const issue = action('issue')
    expect(fn(issue.disabled)({ ...T, is_written_off: true })).toBe(true)
    expect(tip(issue, { ...T, is_written_off: true })).toBe('Инструмент списан — выдать нельзя')
    expect(fn(issue.disabled)({ ...T, condition: 'lost' })).toBe(true)
    expect(tip(issue, { ...T, condition: 'lost' })).toBe('Инструмент утерян — выдать нельзя')
    expect(fn(issue.disabled)({ ...T, condition: 'broken' })).toBe(false)
  })

  it('«Списать»: право tools.delete, не у списанного, закрыто у выданного с причиной', async () => {
    await mountList()
    const wo = action('write_off')
    expect(wo.permission).toBe('tools.delete')
    expect(fn(wo.visible)(T)).toBe(true)
    expect(fn(wo.visible)({ ...T, is_written_off: true })).toBe(false)
    expect(fn(wo.disabled)({ ...T, current_holder: 4 })).toBe(true)
    expect(tip(wo, { ...T, current_holder: 4 })).toBe('Инструмент выдан — сначала оформите возврат')
    expect(fn(wo.disabled)(T)).toBe(false)
  })

  it('«Вернуть в работу»: только у списанного, право tools.delete', async () => {
    await mountList()
    const rs = action('restore')
    expect(rs.permission).toBe('tools.delete')
    expect(fn(rs.visible)({ ...T, is_written_off: true })).toBe(true)
    expect(fn(rs.visible)(T)).toBe(false)
  })

  it('фильтр «Учёт»: в работе / списанные', async () => {
    await mountList()
    const f = captured?.filters.find(x => x.key === 'written_off')
    expect(f?.options?.map(o => [o.value, o.label])).toEqual([['', 'Все'], ['false', 'В работе'], ['true', 'Списанные']])
  })

  it('«Вернуть в работу» спрашивает и вызывает restore; отказ — ничего', async () => {
    await mountList()
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    fn(emitAction)('restore', { ...T, is_written_off: true })
    await flushPromises()
    expect(restore).not.toHaveBeenCalled()
    fn(emitAction)('restore', { ...T, is_written_off: true })
    await flushPromises()
    expect(restore).toHaveBeenCalledWith(9)
  })

  it('«Списать» открывает окно списания', async () => {
    const w = await mountList()
    fn(emitAction)('write_off', T)
    await flushPromises()
    expect(w.find('[data-modal="Списать инструмент"]').exists()).toBe(true)
  })
})
