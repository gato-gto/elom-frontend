import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

// Хвост ревью F-1071: «Сбросить фильтры» показывается только при заданном фильтре. Отчёты и роли не
// передавали в FilterPanel состояние `active` → кнопка висела всегда (по умолчанию active=true).

vi.mock('@/api/client', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: { results: [], count: 0, total: null } }) },
}))
vi.mock('@/stores/rbac', () => ({
  useRbacStore: () => ({ roles: [], loading: false, error: null, fetchRoles: vi.fn().mockResolvedValue(undefined) }),
}))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))
vi.mock('@/composables/usePermissions', async () => {
  const { ref } = await import('vue')
  return {
    usePermissions: () => ({
      canManageRoles: ref(true), canExportReports: ref(true), can: () => true,
    }),
  }
})

import ByPeriod from '../ByPeriod.vue'
import ByMaterial from '../ByMaterial.vue'
import ByObject from '../ByObject.vue'
import ByResponsible from '../ByResponsible.vue'
import RbacList from '@/pages/RBAC/List.vue'

const stubs = {
  ChartContainer: true, ModernPagination: true, FilterField: true, ListHeader: true,
  ExportButton: true, TableSkeleton: true, LoadingSpinner: true, RoleForm: true, Modal: true,
  PermissionAssignment: true,
}

async function activeOf(component: unknown, set?: (vm: Record<string, any>) => void): Promise<boolean> {
  const w = mount(component as never, { global: { stubs } })
  await flushPromises()
  if (set) { set(w.vm as unknown as Record<string, any>); await nextTick() }
  const text = w.find('.filter-panel').text()
  w.unmount()
  return text.includes('Сбросить фильтры')
}

describe('«Сбросить фильтры» в отчётах и ролях — только при заданном фильтре', () => {
  beforeEach(() => vi.clearAllMocks())

  it('test_by_period_hidden_by_default_shown_for_date_or_non_default_period', async () => {
    expect(await activeOf(ByPeriod)).toBe(false)
    expect(await activeOf(ByPeriod, vm => { vm.dateFrom = '2026-11-01' })).toBe(true)
    expect(await activeOf(ByPeriod, vm => { vm.period = 'day' })).toBe(true)
  })

  it('test_by_material_hidden_by_default_shown_for_object', async () => {
    expect(await activeOf(ByMaterial)).toBe(false)
    expect(await activeOf(ByMaterial, vm => { vm.objectId = 484 })).toBe(true)
    expect(await activeOf(ByMaterial, vm => { vm.dateTo = '2026-11-30' })).toBe(true)
    expect(await activeOf(ByMaterial, vm => { vm.objectId = '' }), '«Все объекты» — не фильтр').toBe(false)
  })

  it('test_by_object_hidden_by_default_shown_for_responsible', async () => {
    expect(await activeOf(ByObject)).toBe(false)
    expect(await activeOf(ByObject, vm => { vm.filters.responsible = 7 })).toBe(true)
    expect(await activeOf(ByObject, vm => { vm.filters.object = '' }), '«Все объекты» — не фильтр').toBe(false)
  })

  it('test_by_responsible_hidden_by_default_shown_for_date', async () => {
    expect(await activeOf(ByResponsible)).toBe(false)
    expect(await activeOf(ByResponsible, vm => { vm.dateFrom = '2026-11-01' })).toBe(true)
  })

  it('test_rbac_roles_hidden_by_default_shown_for_search_or_type', async () => {
    expect(await activeOf(RbacList)).toBe(false)
    expect(await activeOf(RbacList, vm => { vm.filters.search = 'бриг' })).toBe(true)
    expect(await activeOf(RbacList, vm => { vm.filters.is_system = 'true' })).toBe(true)
  })
})
