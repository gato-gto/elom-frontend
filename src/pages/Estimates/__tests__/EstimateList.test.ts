import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// F-932 (регресс F-931): EstimateList на GenericList ДОЛЖЕН звать estimatesStore.fetchList() в onMounted
// (GenericList сам не фетчит). Гард класса «список фетчит на mount» — чтобы не отломилось снова.
const { estFetch, objFetch } = vi.hoisted(() => ({
  estFetch: vi.fn().mockResolvedValue([]),
  objFetch: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/stores/estimates', () => ({
  useEstimatesStore: () => ({
    fetchList: estFetch,
    remove: vi.fn().mockResolvedValue({}),
    filters: {},
    items: [],
    loading: false,
    pagination: { count: 0, page: 1, pageSize: 20, next: null, previous: null },
  }),
}))
vi.mock('@/stores/objects', () => ({ useObjectsStore: () => ({ items: [], fetchList: objFetch }) }))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
// Стабим тяжёлые дочерние компоненты — тестируем ТОЛЬКО mount-фетч страницы.
vi.mock('@/components/GenericList.vue', () => ({ default: { name: 'GenericList', template: '<div />' } }))
vi.mock('@/components/cards/EstimateCard.vue', () => ({ default: { name: 'EstimateCard', template: '<div />' } }))

import EstimateList from '@/pages/Estimates/EstimateList.vue'

describe('EstimateList — фетч на mount (F-932, регресс F-931)', () => {
  beforeEach(() => { estFetch.mockClear(); objFetch.mockClear() })

  it('зовёт estimatesStore.fetchList() на mount (холодный заход грузит список)', async () => {
    mount(EstimateList)
    await nextTick()
    expect(estFetch).toHaveBeenCalled()
  })
})
