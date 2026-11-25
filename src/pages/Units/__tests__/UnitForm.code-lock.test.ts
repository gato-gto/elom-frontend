// F-1099 (ответ владельца 8): код используемой единицы менять нельзя (сервер — 400), название можно.
// Форма закрывает поле кода, если API пометил единицу in_use, и говорит почему; новая/неиспользуемая — как раньше.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import UnitForm from '../UnitForm.vue'
import GenericForm from '@/components/GenericForm.vue'
import type { Unit } from '@/api/types'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} })
  }
}))

const HINT = 'Единица уже есть в материалах или документах — код менять нельзя, название можно'
const codeField = (initial?: Unit) => {
  const w = mount(UnitForm, { props: initial ? { initial } : {}, global: { stubs: { GenericForm: true } } })
  return w.findComponent(GenericForm).props('config').fields.find((f: { key: string }) => f.key === 'code')
}
const unit = (in_use: boolean): Unit => ({ id: 3, code: 'м', name: 'метр', in_use })

describe('UnitForm · замок кода используемой единицы (F-1099)', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks() })

  it('используемая единица: поле кода закрыто и подсказка объясняет почему', () => {
    const f = codeField(unit(true))
    expect(f.disabled).toBe(true)
    expect(f.help).toBe(HINT)
  })

  it('используемая единица со «старым» кодом: у закрытого поля нет проверок формата (иначе не сохранить имя)', () => {
    const f = codeField({ ...unit(true), code: 'п.м.' })
    expect(f.validation).toBeUndefined()
  })

  it('неиспользуемая единица: код проверяется по формату', () => {
    expect(codeField(unit(false)).validation?.pattern).toBeInstanceOf(RegExp)
  })

  it('неиспользуемая единица: код можно менять, подсказки нет', () => {
    const f = codeField(unit(false))
    expect(f.disabled).toBe(false)
    expect(f.help).toBeUndefined()
  })

  it('новая единица: код открыт', () => {
    const f = codeField()
    expect(f.disabled).toBe(false)
    expect(f.help).toBeUndefined()
  })
})
