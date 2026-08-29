// F-1034 (BE F-792, owner 2026-08-29, D-028a): этапы — состояние САМОЙ стройки, объект берём на любом
// этапе → «дефолтного» этапа нет. Предзаполнение «Начало работ» молча штамповало бы неверный этап
// в каждое движение по складу (StockSnapshot/WriteOff.stage берутся из Object.current_stage).
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ObjectForm from '../ObjectForm.vue'
import GenericForm from '@/components/GenericForm.vue'
import { stageSelectOptions } from '@/constants/stages'
import type { SiteObject } from '@/api/types'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {} }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() })
}))

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} })
  }
}))

const mountForm = (initial?: SiteObject) =>
  mount(ObjectForm, {
    props: initial ? { initial } : {},
    global: { stubs: { GenericForm: true } }
  })

const existing: SiteObject = {
  id: 7,
  name: 'Гостиница',
  address: 'ул. Пример, 1',
  is_active: true,
  current_stage: 'rework',
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z'
}

describe('ObjectForm · этап работ (F-1034)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('новый объект: этап НЕ предзаполнен — селект показывает плейсхолдер', () => {
    const form = mountForm().findComponent(GenericForm)
    expect(form.props('initialData').current_stage).toBeUndefined()
  })

  it('редактирование: этап объекта передаётся в форму как есть', () => {
    const form = mountForm(existing).findComponent(GenericForm)
    expect(form.props('initialData').current_stage).toBe('rework')
  })

  it('поле этапа обязательно, с плейсхолдером и опциями в порядке единого источника', () => {
    const form = mountForm().findComponent(GenericForm)
    const field = form.props('config').fields.find((f: { key: string }) => f.key === 'current_stage')
    expect(field.required).toBe(true)
    expect(field.placeholder).toBe('— выберите этап —')
    expect(field.options).toEqual(stageSelectOptions())
    expect(field.options.map((o: { value: string }) => o.value)).toEqual(
      ['start', 'installation', 'rework', 'acceptance', 'handover']
    )
  })
})
