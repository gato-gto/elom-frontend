// F-1118 (ревью-13): с F-1113 сервер не меняет ответственного объекта при правке бригадиром. Форма же показывала
// самого бригадира «Ответственным» с подсказкой «Вы автоматически назначены…» — теперь при правке в заблокированном
// поле настоящий ответственный, подсказка — только при создании (там бригадир и правда становится ответственным).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { computed } from 'vue'
import ObjectForm from '../ObjectForm.vue'
import GenericForm from '@/components/GenericForm.vue'
import { useAuthStore } from '@/stores/auth'

vi.mock('vue-router', () => ({ useRoute: () => ({ params: {}, query: {} }), useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }))
vi.mock('@/api/client', () => ({ default: { get: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }),
  post: vi.fn(), patch: vi.fn().mockResolvedValue({ data: {} }), put: vi.fn(), delete: vi.fn() } }))
vi.mock('@/composables/usePermissions', () => ({
  usePermissions: () => ({ canCreateRequests: computed(() => true), hasPermission: () => false }),
}))

type Field = { key: string; help?: string; disabled?: boolean; options?: Array<{ value: number; label: string }> }
const OBJ = { id: 7, name: 'Гостиница', is_active: true, responsible: 42, responsible_name: 'Денис Ахмедов',
  current_stage: 'start', created_at: '', updated_at: '' }

async function mountForm(initial?: unknown) {
  const w = mount(ObjectForm, { props: initial ? { initial: initial as never } : {}, global: { stubs: { GenericForm: true } } })
  useAuthStore().me = { id: 9, username: 'helper', first_name: 'Хелпер', last_name: '', profile_id: 50 } as never
  await flushPromises()
  const form = w.findComponent(GenericForm)
  const field = (form.props('config') as { fields: Field[] }).fields.find(f => f.key === 'responsible')
  return { responsible: (form.props('initialData') as { responsible?: number }).responsible, field: field as Field }
}

describe('ObjectForm: ответственный у бригадира (F-1118)', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('правка чужого (назначенного) объекта — настоящий ответственный, без подсказки, поле заблокировано', async () => {
    const { responsible, field } = await mountForm(OBJ)
    expect({ responsible, options: field.options, help: field.help, disabled: field.disabled })
      .toEqual({ responsible: 42, options: [{ value: 42, label: 'Денис Ахмедов' }], help: undefined, disabled: true })
  })

  it('правка своего объекта — он сам', async () => {
    const { responsible, field } = await mountForm({ ...OBJ, responsible: 50, responsible_name: 'Хелпер' })
    expect({ responsible, options: field.options }).toEqual({ responsible: 50, options: [{ value: 50, label: 'Хелпер' }] })
  })

  it('создание — бригадир ответственный, с подсказкой', async () => {
    const { responsible, field } = await mountForm()
    expect({ responsible, options: field.options, help: field.help }).toEqual({
      responsible: 50, options: [{ value: 50, label: 'Хелпер' }],
      help: 'Вы автоматически назначены ответственным за этот объект' })
  })
})
