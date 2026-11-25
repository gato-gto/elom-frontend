import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// F-1101 (ответ владельца 12): окно «Списать инструмент» — причина обязательна, дата не позже сегодня.

const { writeOff } = vi.hoisted(() => ({ writeOff: vi.fn().mockResolvedValue({}) }))
vi.mock('@/stores/tools', () => ({ useToolsStore: () => ({ writeOff }) }))
vi.mock('@/composables/useErrorHandler', () => ({ useErrorHandler: () => ({ handleFormError: vi.fn() }) }))

import ToolWriteOffForm from '@/pages/Tools/ToolWriteOffForm.vue'

type Field = { key: string; required?: boolean; type?: string }
let cfg: { fields: Field[] } | null = null
let onSubmit: ((d: Record<string, unknown>) => Promise<void>) | null = null
const GenericFormStub = defineComponent({
  props: ['config', 'initialData', 'onSubmit', 'onCancel'],
  setup(props) { return () => { cfg = props.config; onSubmit = props.onSubmit; return h('div') } },
})
const submit = (d: Record<string, unknown>) => { if (!onSubmit) { throw new Error('форма не смонтирована') } return onSubmit(d) }
const field = (k: string) => { if (!cfg) { throw new Error('нет конфига') } return cfg.fields.find(x => x.key === k) }
const mountForm = () => mount(ToolWriteOffForm, {
  props: { tool: { id: 4, inventory_number: 'INV-4', name: 'Дрель' } as never },
  global: { stubs: { GenericForm: GenericFormStub } },
})

describe('Окно «Списать инструмент» (F-1101)', () => {
  beforeEach(() => { writeOff.mockClear() })

  it('причина — обязательное многострочное поле, дата — поле даты', () => {
    mountForm()
    expect([field('reason')?.type, field('reason')?.required]).toEqual(['textarea', true])
    expect(field('date')?.type).toBe('date')
  })

  it('отправляет причину без пробелов по краям и дату; сообщает о сохранении', async () => {
    const w = mountForm()
    await submit({ reason: '  Сгорел двигатель ', date: '2026-03-05' })
    expect(writeOff).toHaveBeenCalledWith(4, { reason: 'Сгорел двигатель', date: '2026-03-05' })
    expect(w.emitted('saved')).toHaveLength(1)
  })

  it('без даты — дату не шлём (сервер поставит сегодня)', async () => {
    mountForm()
    await submit({ reason: 'Утерян на объекте', date: '' })
    expect(writeOff).toHaveBeenCalledWith(4, { reason: 'Утерян на объекте' })
  })
})
