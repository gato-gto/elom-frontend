import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// F-074: суперпользователь имеет все права даже без RBAC-роли.
// F-069: fetchPermissions не должен ходить в API без токена.
let superuser = false
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ me: { is_superuser: superuser } }),
}))

import { usePermissionsStore } from '@/stores/permissions'

describe('permissions store — superuser bypass + token guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    superuser = false
    localStorage.clear()
  })

  it('F-074: superuser has EVERY permission even with empty permissions', () => {
    superuser = true
    const store = usePermissionsStore()
    expect(store.hasPermission('anything.at.all')).toBe(true)
    expect(store.hasAnyPermission('x.y')).toBe(true)
    expect(store.hasAllPermissions('a.b', 'c.d')).toBe(true)
  })

  it('non-superuser without permissions has none', () => {
    superuser = false
    const store = usePermissionsStore()
    expect(store.hasPermission('materials.view')).toBe(false)
    expect(store.hasAnyPermission('materials.view')).toBe(false)
  })

  it('F-069: fetchPermissions is a no-op without an access token', async () => {
    const store = usePermissionsStore()
    await store.fetchPermissions()
    expect(store.permissions).toEqual([])
    expect(store.error).toBeNull()
  })
})
