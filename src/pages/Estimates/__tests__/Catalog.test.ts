import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// #64 Прайс-каталог = единое дерево Раздел→Подраздел→Позиции. Гарды:
//  (1) фетч категорий И позиций на mount (дерево группируется на клиенте — без фетча пусто);
//  (2) дерево строится: раздел виден, при разворачивании подраздел→позиции группируются под своим подразделом.
const { catFetch, itemFetch } = vi.hoisted(() => ({
  catFetch: vi.fn().mockResolvedValue([]), itemFetch: vi.fn().mockResolvedValue([]),
}))

const cats = [
  { id: 1, name: 'Раздел A', parent: null, parent_name: null, children_count: 1, items_count: 0, order: 0 },
  { id: 2, name: 'Подраздел B', parent: 1, parent_name: 'Раздел A', children_count: 0, items_count: 2, order: 0 },
]
const items = [
  { id: 10, category: 2, name: 'Позиция X', kind: 'work', kind_display: 'Работа', unit: 'шт.', default_price: '100' },
  { id: 11, category: 2, name: 'Позиция Y', kind: 'work', kind_display: 'Работа', unit: 'шт.', default_price: '200' },
]

vi.mock('@/stores/workCategories', () => ({
  useWorkCategoriesStore: () => ({ items: cats, loading: false, fetchList: catFetch, create: vi.fn(), update: vi.fn(), remove: vi.fn() }),
}))
vi.mock('@/stores/workItems', () => ({
  useWorkItemsStore: () => ({ items, loading: false, fetchList: itemFetch, create: vi.fn(), update: vi.fn(), remove: vi.fn() }),
}))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))
vi.mock('@/composables/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }))
vi.mock('@/components/Modal.vue', () => ({ default: { name: 'Modal', template: '<div><slot/></div>' } }))
vi.mock('@/components/LoadingSpinner.vue', () => ({ default: { name: 'LoadingSpinner', template: '<div/>' } }))
vi.mock('@/components/ListHeader.vue', () => ({ default: { name: 'ListHeader', template: '<div/>' } }))

import Catalog from '@/pages/Estimates/Catalog.vue'

describe('Catalog — дерево прайса (#64)', () => {
  beforeEach(() => { catFetch.mockClear(); itemFetch.mockClear() })

  it('фетчит категории И позиции на mount', async () => {
    mount(Catalog)
    await nextTick()
    expect(catFetch).toHaveBeenCalled()
    expect(itemFetch).toHaveBeenCalled()
  })

  it('строит дерево: раздел виден; разворот → подраздел → позиции под ним', async () => {
    const w = mount(Catalog)
    await nextTick()
    expect(w.text()).toContain('Раздел A')
    // позиции ещё скрыты (аккордеон свёрнут)
    expect(w.text()).not.toContain('Позиция X')
    // развернуть раздел
    const rootBtn = w.findAll('button').find(b => b.text().includes('Раздел A'))!
    await rootBtn.trigger('click')
    await nextTick()
    expect(w.text()).toContain('Подраздел B')
    // развернуть подраздел
    const subBtn = w.findAll('button').find(b => b.text().includes('Подраздел B'))!
    await subBtn.trigger('click')
    await nextTick()
    expect(w.text()).toContain('Позиция X')
    expect(w.text()).toContain('Позиция Y')
  })
})
