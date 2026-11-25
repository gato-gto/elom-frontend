// F-1110 (ответ владельца 17): в карточке объекта — «Файлы проекта»; загружать/удалять может руководство
// (objects.delete) или ответственный ЭТОГО объекта, остальным — только просмотр.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'

const { me, perms } = vi.hoisted(() => ({
  me: { value: { id: 5, is_superuser: false, profile_id: 70 } as Record<string, unknown> },
  perms: { value: [] as string[] },
}))
vi.mock('vue-router', () => ({ useRoute: () => ({ params: { id: '1' } }), useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }))
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn((url: string) => Promise.resolve({ data: String(url).match(/\/objects\/1\/$/)
      ? { id: 1, name: 'Гостиница', responsible: 70, is_active: true } : { results: [], count: 0 } })),
    post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
  },
}))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ get me() { return me.value } }) }))
vi.mock('@/composables/usePermissions', () => ({
  usePermissions: () => ({ can: (r: string, a: string) => perms.value.includes(`${r}.${a}`) }),
}))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))

import ObjectInfo from '../ObjectInfo.vue'

let captured: { objectId: number; canManage: boolean } | null = null
const ObjectFilesStub = defineComponent({
  props: ['objectId', 'canManage'],
  setup(props) { return () => { captured = { objectId: props.objectId, canManage: props.canManage }; return h('div') } },
})
const mountIt = async () => {
  captured = null
  mount(ObjectInfo, { global: { stubs: { ObjectFiles: ObjectFilesStub, Modal: true, ObjectForm: true, LoadingSpinner: true } } })
  await flushPromises()
  return captured
}

describe('Карточка объекта: файлы проекта (F-1110)', () => {
  beforeEach(() => { setActivePinia(createPinia()); perms.value = [] })

  it('ответственный объекта — может', async () => {
    me.value = { id: 5, is_superuser: false, profile_id: 70 }
    expect(await mountIt()).toEqual({ objectId: 1, canManage: true })
  })
  it('участник, но не ответственный — только просмотр', async () => {
    me.value = { id: 6, is_superuser: false, profile_id: 71 }
    expect((await mountIt())?.canManage).toBe(false)
  })
  it('руководство (objects.delete) — может', async () => {
    me.value = { id: 7, is_superuser: false, profile_id: 72 }
    perms.value = ['objects.delete']
    expect((await mountIt())?.canManage).toBe(true)
  })
})
