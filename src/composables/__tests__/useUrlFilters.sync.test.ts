/**
 * F-590 — URL как источник истины для фильтров списков.
 *
 * Баг (владелец): Объекты → Объект → Списания применяет ?object=X; затем «Списания» из навигации
 * ведёт на /writeoffs (пустой URL), но фильтр «залипал» в store.filters и показывался в UI при
 * запросе БЕЗ фильтра. Причина: applyFromUrl раньше только ДОБАВЛял фильтры из URL (Object.assign)
 * и рано выходил на пустом URL — отсутствующие в URL фильтры не сбрасывались.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reactive, defineComponent, nextTick, h } from 'vue'
import { mount } from '@vue/test-utils'

const route = reactive({ query: {} as Record<string, any> })
const router = {
  replace: vi.fn((loc: any) => { route.query = loc?.query || {}; return Promise.resolve() }),
}
vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => router }))

import { useUrlFilters } from '@/composables/useUrlFilters'

const configs = [
  { key: 'object', type: 'select', label: 'Объект', options: [{ value: '', label: 'Все' }, { value: 347, label: 'D' }] },
]

function makeStore() {
  return reactive({ filters: {} as Record<string, any>, pagination: { page: 1 }, fetchList: vi.fn() })
}
function mountWith(store: any) {
  return mount(defineComponent({ setup() { useUrlFilters(store, () => configs as any); return () => h('div') } }))
}

describe('useUrlFilters — URL is source of truth (F-590)', () => {
  beforeEach(() => { route.query = {}; router.replace.mockClear() })

  it('applies a deep-linked filter on mount', async () => {
    route.query = { object: '347' }
    const store = makeStore()
    mountWith(store)
    await nextTick()
    expect(store.filters.object).toBe(347)
  })

  it('clears a stale filter when navigating to a URL without it (the reported bug)', async () => {
    route.query = { object: '347' }
    const store = makeStore()
    mountWith(store)
    await nextTick()
    expect(store.filters.object).toBe(347)

    // navigate to the bare list (no object in URL) — like clicking «Списания» in the nav
    route.query = {}
    await nextTick(); await nextTick()

    expect(store.filters.object).toBe('')            // stale filter cleared, not left at 347
    expect(store.fetchList).toHaveBeenCalled()        // refetched so data matches the empty filter
  })
})
