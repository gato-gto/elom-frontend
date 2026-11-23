/**
 * F-1061 (логи прода 23.11): 485 из 721 запросов rbac/my-permissions — точные повторы в пределах секунды.
 * Кэш (CACHE_TIME) пуст, пока первый запрос в полёте, поэтому роутер, меню, мобильное меню и
 * PermissionGuard запускали каждый свой запрос. Параллельные вызовы должны делить один запрос.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const getMock = vi.fn()
vi.mock('@/api/client', () => ({ default: { get: (...a: unknown[]) => getMock(...a) } }))

import { usePermissionsStore } from '../permissions'

describe('F-1061 · один запрос прав на параллельные вызовы', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getMock.mockReset()
    // setup.ts подменяет localStorage заглушкой (getItem → undefined) — даём токен явно
    vi.mocked(localStorage.getItem).mockImplementation((k: string) => (k === 'elom_access' ? 'token' : null))
  })

  it('три параллельных fetchPermissions → один GET', async () => {
    let resolve!: (v: unknown) => void
    getMock.mockReturnValue(new Promise((r) => { resolve = r }))
    const store = usePermissionsStore()
    const calls = [store.fetchPermissions(), store.fetchPermissions(), store.fetchPermissions()]
    resolve({ data: { permissions: [{ codename: 'purchases.view' }], roles: [] } })
    await Promise.all(calls)
    expect(getMock).toHaveBeenCalledTimes(1)
    expect(store.permissions.map((p) => p.codename)).toEqual(['purchases.view'])
  })

  it('force во время запроса в полёте не плодит второй параллельный GET', async () => {
    let resolve!: (v: unknown) => void
    getMock.mockReturnValue(new Promise((r) => { resolve = r }))
    const store = usePermissionsStore()
    const a = store.fetchPermissions()
    const b = store.fetchPermissions(true)
    resolve({ data: { permissions: [], roles: [] } })
    await Promise.all([a, b])
    expect(getMock).toHaveBeenCalledTimes(1)
  })

  it('после завершения следующий force делает новый запрос', async () => {
    getMock.mockResolvedValue({ data: { permissions: [], roles: [] } })
    const store = usePermissionsStore()
    await store.fetchPermissions()
    await store.fetchPermissions(true)
    expect(getMock).toHaveBeenCalledTimes(2)
  })
})

describe('F-1068 · выход во время запроса прав: B не получает права A', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getMock.mockReset()
    vi.mocked(localStorage.getItem).mockImplementation((k: string) => (k === 'elom_access' ? 'token' : null))
  })

  it('A-запрос в полёте → clearCache (выход) → B fetch(true) идёт отдельным запросом, в сторе права B', async () => {
    let resolveA!: (v: unknown) => void
    getMock.mockReturnValueOnce(new Promise((r) => { resolveA = r }))
    getMock.mockResolvedValueOnce({ data: { permissions: [{ codename: 'B.view' }], roles: [] } })
    const store = usePermissionsStore()
    const a = store.fetchPermissions()
    store.clearCache()                         // выход пользователя A
    const b = store.fetchPermissions(true)     // вход пользователя B
    resolveA({ data: { permissions: [{ codename: 'A.admin' }], roles: [] } })
    await Promise.all([a, b])
    expect(getMock).toHaveBeenCalledTimes(2)
    expect(store.permissions.map((p) => p.codename)).toEqual(['B.view'])
  })

  it('F-1075: ошибка запроса прошлого пользователя не даёт тост и не сбрасывает loading нового', async () => {
    const ui = (await import('../ui')).useUiStore()
    const toast = vi.spyOn(ui, 'toast')
    let rejectA!: (e: unknown) => void
    getMock.mockReturnValueOnce(new Promise((_, rej) => { rejectA = rej }))
    let resolveB!: (v: unknown) => void
    getMock.mockReturnValueOnce(new Promise((r) => { resolveB = r }))
    const store = usePermissionsStore()
    const a = store.fetchPermissions()
    store.clearCache()
    const b = store.fetchPermissions(true)
    rejectA(new Error('boom'))
    await a.catch(() => undefined)
    expect(toast).not.toHaveBeenCalled()
    expect(store.loading).toBe(true)
    resolveB({ data: { permissions: [{ codename: 'b.view' }], roles: [] } })
    await b
    expect(store.error).toBeNull()
    expect(store.permissions.map((p) => p.codename)).toEqual(['b.view'])
  })
})
