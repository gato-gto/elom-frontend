// F-1021 · auth.changePassword: POST /users/me/password → перелогин новым паролем (BE F-777 отзывает
// ВСЕ refresh, включая текущий) → me.must_change_password=false. Мутация «убрать перелогин» → красный.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import api from '@/api/client'

vi.mock('@/api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  refreshAccessToken: vi.fn(),
}))

describe('auth.changePassword (F-1021)', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.mocked(api.post).mockReset(); vi.mocked(api.get).mockReset() })

  it('POST на /users/me/password с old/new, затем login новым паролем и флаг снят', async () => {
    const auth = useAuthStore()
    auth.me = { id: 1, profile_id: 1, username: 'ivan', first_name: '', last_name: '', email: '', is_active: true, assigned_object_ids: [], must_change_password: true } as any
    vi.mocked(api.post)
      .mockResolvedValueOnce({ status: 204 } as any)                                   // password change
      .mockResolvedValueOnce({ data: { access: 'A2', refresh: 'R2' } } as any)         // re-login
    vi.mocked(api.get).mockResolvedValue({ data: { id: 1, username: 'ivan', must_change_password: false, roles: [], assigned_object_ids: [], is_active: true } } as any)

    await auth.changePassword('TempPass123!', 'NewStrong1')

    expect(vi.mocked(api.post).mock.calls[0][0]).toMatch(/\/users\/me\/password$/)
    expect(vi.mocked(api.post).mock.calls[0][1]).toEqual({ old_password: 'TempPass123!', new_password: 'NewStrong1' })
    expect(vi.mocked(api.post).mock.calls[1][0]).toMatch(/\/auth\/token\/?$/)
    expect(vi.mocked(api.post).mock.calls[1][1]).toEqual({ username: 'ivan', password: 'NewStrong1' })
    expect(auth.me?.must_change_password).toBe(false)
    expect(auth.accessToken).toBe('A2')
  })

  it('400 от BE пробрасывается (модалка раскладывает по полям), me не тронут', async () => {
    const auth = useAuthStore()
    auth.me = { id: 1, username: 'ivan', must_change_password: true } as any
    vi.mocked(api.post).mockRejectedValueOnce({ response: { status: 400, data: { errors: { old_password: ['x'] } } } })
    await expect(auth.changePassword('bad', 'NewStrong1')).rejects.toBeTruthy()
    expect(auth.me?.must_change_password).toBe(true)
    expect(vi.mocked(api.post)).toHaveBeenCalledTimes(1)
  })
})
