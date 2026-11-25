import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// F-1101 (ответ владельца 12): сломанный выдаётся с предупреждением (и вопросом перед выдачей);
// списанный и утерянный форма не выдаёт (сервер отказывает так же).

const { create } = vi.hoisted(() => ({ create: vi.fn().mockResolvedValue({}) }))
vi.mock('@/stores/toolIssues', () => ({ useToolIssuesStore: () => ({ create }) }))
vi.mock('@/stores/employees', () => ({ useEmployeesStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/stores/objects', () => ({ useObjectsStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/composables/useErrorHandler', () => ({ useErrorHandler: () => ({ handleFormError: vi.fn() }) }))

import ToolIssueForm from '@/pages/Tools/ToolIssueForm.vue'

let onSubmit: ((d: Record<string, unknown>) => Promise<void>) | null = null
const GenericFormStub = defineComponent({
  props: ['config', 'initialData', 'onSubmit', 'onCancel'],
  setup(props) { return () => { onSubmit = props.onSubmit; return h('div') } },
})
const mountForm = (over: Record<string, unknown>) => mount(ToolIssueForm, {
  props: { tool: { id: 3, inventory_number: 'INV-3', name: 'Болгарка', condition: 'good', current_holder: null, ...over } as never },
  global: { stubs: { GenericForm: GenericFormStub } },
})
const submit = (d: Record<string, unknown>) => { if (!onSubmit) { throw new Error('форма не смонтирована') } return onSubmit(d) }
const DATA = { tool: 3, issued_to: 5, object: undefined, issue_condition: 'broken' }

describe('Форма выдачи: состояние инструмента (F-1101)', () => {
  beforeEach(() => { create.mockClear(); vi.restoreAllMocks() })

  it('сломанный: предупреждение видно; отказ в вопросе — не выдаём; согласие — выдаём', async () => {
    const w = mountForm({ condition: 'broken' })
    expect(w.text()).toContain('Инструмент сломан. Выдать можно, но проверьте его и предупредите получателя.')
    const ask = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    await submit({ ...DATA })
    expect(create).not.toHaveBeenCalled()
    await submit({ ...DATA })
    expect(create).toHaveBeenCalledTimes(1)
    expect(ask).toHaveBeenCalledWith('Инструмент сломан. Выдать можно, но проверьте его и предупредите получателя. Выдать?')
  })

  it('исправный: без предупреждения и без вопроса', async () => {
    const w = mountForm({ condition: 'good' })
    expect(w.text()).not.toContain('Выдать можно, но')
    const ask = vi.spyOn(window, 'confirm')
    await submit({ ...DATA, issue_condition: 'good' })
    expect(ask).not.toHaveBeenCalled()
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('списанный: причина видна, выдача не уходит на сервер', async () => {
    const w = mountForm({ is_written_off: true })
    expect(w.text()).toContain('Инструмент списан — выдать нельзя')
    await expect(submit({ ...DATA })).rejects.toThrow('Инструмент списан — выдать нельзя')
    expect(create).not.toHaveBeenCalled()
  })

  it('утерянный: выдача не уходит на сервер', async () => {
    mountForm({ condition: 'lost' })
    await expect(submit({ ...DATA })).rejects.toThrow('Инструмент утерян — выдать нельзя')
    expect(create).not.toHaveBeenCalled()
  })
})
