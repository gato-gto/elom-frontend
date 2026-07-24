/**
 * F-517 — кнопка создания видна при ЛЮБОМ из createPermissionAny.
 *
 * Роль «Заявитель» создаёт заявки правом purchases.create_request, а GenericList проверял
 * только ресурсный purchases.create → кнопки не было (замерено вживую на проде). Тест
 * монтирует список под правами заявителя и проверяет, что кнопка «Новая заявка» появляется,
 * а под чистым просмотром (view_own) — нет.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import GenericList from '../GenericList.vue'
import { usePermissionsStore } from '@/stores/permissions'
import type { GenericListConfig } from '@/types/generic'

vi.mock('@/composables/useGenericList', () => ({
  useGenericList: () => ({
    items: [{ id: 1, name: 'A' }],
    loading: false,
    error: null,
    pagination: { page: 1, pageSize: 20, count: 1, totalPages: 1 },
    filters: {},
    selectedItems: [],
    handleSearch: vi.fn(), handleFilter: vi.fn(), handleSort: vi.fn(),
    handlePageChange: vi.fn(), handleSelectItem: vi.fn(), handleSelectAll: vi.fn(),
    handleExport: vi.fn(), handleBulkAction: vi.fn(),
  }),
}))

const config: GenericListConfig<{ id: number; name: string }> = {
  title: 'Закупки',
  columns: [{ key: 'name', label: 'Название', order: 1 }],
  filters: [],
  showCreate: true,
  createText: 'Новая заявка',
  resource: 'purchases',
  createPermissionAny: ['purchases.create', 'purchases.create_request'],
}

const store = {
  items: [{ id: 1, name: 'A' }], loading: false, error: null,
  pagination: { page: 1, pageSize: 20, count: 1, next: null, previous: null },
  filters: {}, fetchList: vi.fn(),
}

// Важно: тот же экземпляр pinia и для seed, и для смонтированного компонента — иначе
// компонент берёт pinia из глобального setup, а seed уходит в другой, и права не доходят.
let pinia: ReturnType<typeof createPinia>

function seed(perms: string[]) {
  usePermissionsStore(pinia).permissions = perms.map((codename) => ({ codename })) as never
}

function mountList() {
  return mount(GenericList, { props: { config, store: store as never }, global: { plugins: [pinia] } })
}

describe('F-517 · GenericList createPermissionAny', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('заявитель (purchases.create_request) видит кнопку «Новая заявка»', () => {
    seed(['purchases.create_request', 'purchases.view_own'])
    expect(mountList().text()).toContain('Новая заявка')
  })

  it('менеджер (purchases.create) тоже видит', () => {
    seed(['purchases.create'])
    expect(mountList().text()).toContain('Новая заявка')
  })

  it('чистый просмотр (view_own) НЕ видит кнопку создания', () => {
    seed(['purchases.view_own'])
    expect(mountList().text()).not.toContain('Новая заявка')
  })
})
