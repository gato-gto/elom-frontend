// F-1120 (live-проверка 25.11, WebKit 390px): на телефоне таблица «Дата запрета» была шире экрана — колонка даты
// обрезалась («не…»), кнопка «Изменить» уходила за край. Теперь под md — карточки (MOBILE_UI_SPEC п.6).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/api/client', () => ({ default: { get, post: vi.fn().mockResolvedValue({ data: {} }) } }))
vi.mock('@/composables/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))

import ArchivePeriods from '@/pages/Stocks/ArchivePeriods.vue'
import { endpoints } from '@/api/endpoints'

const ModalStub = defineComponent({
  props: ['modelValue', 'title'],
  setup(props, { slots }) { return () => (props.modelValue ? h('div', { class: 'modal-stub' }, [props.title, slots.default?.()]) : null) },
})
const ROWS = [
  { object: 7, object_name: 'Гостиница Гранд Капитал', object_is_active: false, closed_until: '2026-03-31',
    closed_until_by_name: 'Вячеслав', closed_until_at: '2026-11-25T10:00:00+05:00' },
  { object: 8, object_name: 'Медцентр 01', object_is_active: true, closed_until: null, closed_until_by_name: null,
    closed_until_at: null },
]
const width = window.innerWidth

describe('Дата запрета на телефоне (F-1120)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    get.mockImplementation((url: string) => Promise.resolve({ data: url === endpoints.archivePeriods.lockDates
      ? ROWS : { results: [], count: 0 } }))
  })
  afterEach(() => { Object.defineProperty(window, 'innerWidth', { value: width, configurable: true }) })

  const mountAt = async (w: number) => {
    Object.defineProperty(window, 'innerWidth', { value: w, configurable: true })
    const wrapper = mount(ArchivePeriods, { global: { stubs: { Modal: ModalStub, ListHeader: true } } })
    await flushPromises()
    return wrapper
  }

  it('390px — карточки с датой и кнопкой, без таблицы', async () => {
    const w = await mountAt(390)
    expect(w.find('table').exists()).toBe(false)
    const cards = w.findAll('[data-test="lock-cards"] li')
    const parts = (c: (typeof cards)[number]) => [...c.element.querySelectorAll('span, div, button')]
      .filter(e => e.children.length === 0).map(e => (e.textContent || '').replace(/\s+/g, ' ').trim())
    expect(parts(cards[0])).toEqual(['Гостиница Гранд Капитал', 'неактивен', '31.03.2026',
      'Вячеслав, 25.11.2026, 10:00', 'Изменить'])
    expect(parts(cards[1])).toEqual(['Медцентр 01', 'не задана', 'Поставить'])
    await cards[1].find('[data-test="edit-lock-card"]').trigger('click')
    expect(w.find('.modal-stub').text()).toContain('Дата запрета: Медцентр 01')
  })

  it('1366px — таблица, как раньше', async () => {
    const w = await mountAt(1366)
    expect(w.find('[data-test="lock-cards"]').exists()).toBe(false)
    expect(w.findAll('tbody tr').length).toBe(2)
  })
})
