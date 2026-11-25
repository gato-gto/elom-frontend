// F-1119 (ревью-14, MED): бригадир при правке объекта ответственного не меняет (сервер, F-1113) — форма поле не
// шлёт: присланный ответственный, у которого сняли роль «Бригадир», давал 400 на любую правку объекта. И у объекта
// без ответственного заблокированное поле больше не обязательное (иначе форму было не сохранить вовсе).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { computed } from 'vue'
import ObjectForm from '../ObjectForm.vue'
import GenericForm from '@/components/GenericForm.vue'
import { useAuthStore } from '@/stores/auth'

const { patch, limited } = vi.hoisted(() => ({ patch: vi.fn(), limited: { value: true } }))
vi.mock('vue-router', () => ({ useRoute: () => ({ params: {}, query: {} }), useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }))
vi.mock('@/api/client', () => ({ default: { get: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }),
  post: vi.fn(), patch, put: vi.fn(), delete: vi.fn() } }))
vi.mock('@/composables/usePermissions', () => ({
  usePermissions: () => ({ canCreateRequests: computed(() => limited.value), hasPermission: () => !limited.value }),
}))

type Field = { key: string; required?: boolean; disabled?: boolean }
const OBJ = { id: 7, name: 'Гостиница', is_active: true, responsible: 42, responsible_name: 'Денис Ахмедов',
  current_stage: 'start', key_person_contacts: '+998', created_at: '', updated_at: '' }

async function submit(initial: unknown) {
  const w = mount(ObjectForm, { props: { initial: initial as never }, global: { stubs: { GenericForm: true } } })
  useAuthStore().me = { id: 9, username: 'helper', first_name: 'Хелпер', last_name: '', profile_id: 50 } as never
  await flushPromises()
  const form = w.findComponent(GenericForm)
  await (form.props('onSubmit') as (d: unknown) => Promise<void>)(form.props('initialData'))
  return { payload: patch.mock.calls[0][1] as Record<string, unknown>,
    field: (form.props('config') as { fields: Field[] }).fields.find(f => f.key === 'responsible') as Field }
}

describe('ObjectForm: правка бригадиром не шлёт ответственного (F-1119)', () => {
  beforeEach(() => { setActivePinia(createPinia()); patch.mockReset(); patch.mockResolvedValue({ data: OBJ }); limited.value = true })

  it('бригадир: в PATCH нет поля responsible, остальные поля есть', async () => {
    const { payload } = await submit(OBJ)
    expect('responsible' in payload).toBe(false)
    expect(payload.name).toBe('Гостиница')
  })

  it('бригадир, объект без ответственного: поле заблокировано и не обязательное', async () => {
    const { field } = await submit({ ...OBJ, responsible: null, responsible_name: null })
    expect({ required: field.required, disabled: field.disabled }).toEqual({ required: false, disabled: true })
  })

  it('руководство: ответственный уходит в PATCH и обязателен', async () => {
    limited.value = false
    const { payload, field } = await submit(OBJ)
    expect({ responsible: payload.responsible, required: field.required }).toEqual({ responsible: 42, required: true })
  })
})
