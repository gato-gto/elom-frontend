/**
 * F-512 — роль «Заявитель» видела пустое меню без своих главных экранов.
 *
 * Причина: nav-гард и роут-гард требовали `purchases.view` / `writeoffs.view` / `stock.view`,
 * а у заявителя эти права в форме `*.view_own`. Бэкенд при этом на GET пускает view_own и
 * скоупит выдачу по назначенным объектам (PurchasesPermission / StockPermission), то есть
 * доступ реально был — прятал его только фронт. Это навигационный дефект, а не модель прав.
 *
 * Тест собран на ТОЧНОМ наборе прав роли из бэкенд-сида
 * (rbac/management/commands/init_rbac.py → ROLE_PERMISSIONS['requester']), чтобы при расхождении
 * фронта и бэка он падал. До фикса expect на PurchasesList/WriteOffsList/StocksList/StockBalances
 * возвращал false — баг воспроизводился.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import router from '@/router'
import { usePermissionsStore } from '@/stores/permissions'

// Точная копия ROLE_PERMISSIONS['requester'] из бэкенд-сида (15 прав).
const REQUESTER_PERMS = [
  'objects.view',
  'materials.view',
  'material_categories.view',
  'units.view',
  'purchases.view_own',
  'purchases.create_request',
  'writeoffs.view_own',
  'stock.view_own',
  'suppliers.view',
  'employees.view',
  'material_requests.view',
  'material_requests.create',
  'material_requests.edit',
  'material_requests.delete',
  'tools.view',
]

/** Повторяет предикат nav-гарда из AutoNavigation.vue: пункт виден, если есть иконка,
 *  роут не public и права роли пересекаются с meta.permissions. */
function visibleNav(perms: string[]): Set<string> {
  const store = usePermissionsStore()
  store.permissions = perms.map((codename) => ({ codename })) as never
  const names = new Set<string>()
  for (const r of router.getRoutes()) {
    const m = r.meta as Record<string, unknown>
    if (!m?.icon || m.public) { continue }
    const req = m.permissions as string[] | undefined
    if (req?.length && !store.hasAnyPermission(...req)) { continue }
    if (r.name) { names.add(String(r.name)) }
  }
  return names
}

describe('F-512 · навигация роли «Заявитель»', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('видит свои главные экраны (закупки/заявки, списания, движения, остатки)', () => {
    const nav = visibleNav(REQUESTER_PERMS)
    expect(nav.has('PurchasesList'), 'закупки/заявки').toBe(true)
    expect(nav.has('WriteOffsList'), 'списания').toBe(true)
    expect(nav.has('StocksList'), 'движения').toBe(true)
    expect(nav.has('StockBalances'), 'остатки').toBe(true)
  })

  it('НЕ получает управленческий экран вне своих прав (Архив периодов)', () => {
    // stock.view_own не должен открывать закрытие/открытие месяцев — там нужен полный stock.view.
    expect(visibleNav(REQUESTER_PERMS).has('ArchivePeriods')).toBe(false)
  })

  it('меню не пустое', () => {
    expect(visibleNav(REQUESTER_PERMS).size).toBeGreaterThan(4)
  })

  it('пользователь совсем без прав не видит защищённых пунктов', () => {
    const nav = visibleNav([])
    expect(nav.has('PurchasesList')).toBe(false)
    expect(nav.has('StockBalances')).toBe(false)
  })
})
