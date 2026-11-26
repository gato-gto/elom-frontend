// F-1134 (ответы владельца 23 и 31): сроки объекта — сроки застройщика, не наши. Карточка писала «Прошло 100 % срока»
// и рисовала полосу — «не задумано». Теперь: подпись «Сроки застройщика», только даты, без процента и полосы.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const OBJ = { id: 1, name: 'Медцентр 01', responsible: 70, is_active: true, date_start: '2025-01-01', date_end: '2025-06-30' }
vi.mock('vue-router', () => ({ useRoute: () => ({ params: { id: '1' } }), useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }))
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn((url: string) => Promise.resolve({ data: String(url).match(/\/objects\/1\/$/) ? OBJ : { results: [], count: 0 } })),
    post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
  },
}))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ get me() { return { id: 5, is_superuser: false, profile_id: 70 } } }) }))
vi.mock('@/composables/usePermissions', () => ({ usePermissions: () => ({ can: () => false }) }))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))

import ObjectInfo from '../ObjectInfo.vue'
import ObjectCard from '@/components/cards/ObjectCard.vue'

describe('сроки застройщика (F-1134)', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('карточка объекта: «Сроки застройщика», даты; срок давно прошёл — ни процента, ни полосы', async () => {
    const w = mount(ObjectInfo, { global: { stubs: { ObjectFiles: true, Modal: true, ObjectForm: true, LoadingSpinner: true } } })
    await flushPromises()
    expect(w.text()).toContain('Сроки застройщика')
    expect(w.find('[data-test="developer-term"]').text()).toBe('01.01.2025 — 30.06.2025')
    expect(w.text()).not.toContain('Прошло')
    expect(w.text()).not.toContain('% срока')
    expect(w.find('.term-bar').exists()).toBe(false)
  })

  it('мобильная карточка: одна строка «Сроки застройщика», без «Прогресс»', () => {
    const w = mount(ObjectCard, { props: { object: { ...OBJ, address: 'ул. 1' } as never, actions: [] },
      global: { stubs: { MobileCard: { template: '<div><slot name="content" /></div>' } } } })
    const row = w.find('[data-test="developer-term"]').findAll('span').map(x => x.text())
    expect(row).toEqual(['Сроки застройщика:', '01.01.2025 — 30.06.2025'])
    expect(w.text()).not.toContain('Прогресс')
    expect(w.text()).not.toContain('%')
  })

  it('мобильная карточка: без дат строки сроков нет', () => {
    const w = mount(ObjectCard, { props: { object: { ...OBJ, date_start: null, date_end: null } as never, actions: [] },
      global: { stubs: { MobileCard: { template: '<div><slot name="content" /></div>' } } } })
    expect(w.find('[data-test="developer-term"]').exists()).toBe(false)
  })
})
