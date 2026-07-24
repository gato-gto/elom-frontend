/**
 * F-525 — навигационная гонка + очистка прав при logout.
 * ready: пока права не загружены (и не суперюзер) — навигация показывает скелетон, не пустое меню.
 * logout: кэш прав очищается, иначе следующий пользователь мог увидеть старое меню.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePermissionsStore } from '../permissions'
import { useAuthStore } from '../auth'

describe('F-525 · permissions.ready + logout', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('ready=false, пока права не загружены и пользователь не суперюзер', () => {
    expect(usePermissionsStore().ready).toBe(false)
  })

  it('logout очищает кэш прав', () => {
    const perms = usePermissionsStore()
    perms.permissions = [{ codename: 'purchases.view_own' }] as never
    expect(perms.permissions.length).toBe(1)

    useAuthStore().logout() // без redirect
    expect(perms.permissions.length).toBe(0)
    expect(perms.ready).toBe(false)
  })
})
