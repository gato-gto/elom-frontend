import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import api, { refreshAccessToken } from '@/api/client'

// Mock API client
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  // FE-1: единая точка refresh; auth.refreshTokens делегирует сюда.
  refreshAccessToken: vi.fn(),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('initializes with empty state', () => {
    localStorageMock.getItem.mockReturnValue(null)
    const store = useAuthStore()
    
    expect(store.accessToken).toBeNull()
    expect(store.refreshToken).toBeNull()
    expect(store.me).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('sets tokens correctly', () => {
    const store = useAuthStore()
    const tokens = { access: 'access-token', refresh: 'refresh-token' }
    
    store.setTokens(tokens)
    
    expect(store.accessToken).toBe('access-token')
    expect(store.refreshToken).toBe('refresh-token')
    expect(store.isAuthenticated).toBe(true)
  })

  it('saves tokens to localStorage', () => {
    const store = useAuthStore()
    const tokens = { access: 'access-token', refresh: 'refresh-token' }
    
    store.saveTokens(tokens)
    
    expect(localStorage.setItem).toHaveBeenCalledWith('elom_access', 'access-token')
    expect(localStorage.setItem).toHaveBeenCalledWith('elom_refresh', 'refresh-token')
  })

  it('clears tokens on logout', () => {
    const store = useAuthStore()
    store.setTokens({ access: 'access-token', refresh: 'refresh-token' })
    
    store.logout()
    
    expect(store.accessToken).toBeNull()
    expect(store.refreshToken).toBeNull()
    expect(store.me).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('performs successful login', async () => {
    const store = useAuthStore()
    const mockTokenResponse = {
      data: {
        access: 'access-token',
        refresh: 'refresh-token'
      }
    }
    const mockUserResponse = {
      data: {
        id: 1,
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        role: 'admin'
      }
    }
    
    vi.mocked(api.post).mockResolvedValue(mockTokenResponse)
    vi.mocked(api.get).mockResolvedValue(mockUserResponse)
    
    const result = await store.login('testuser', 'password')
    
    expect(result).toBe(true)
    expect(store.accessToken).toBe('access-token')
    expect(store.refreshToken).toBe('refresh-token')
    expect(api.post).toHaveBeenCalled()
    const postCallArgs = vi.mocked(api.post).mock.calls[0][0]
    expect(postCallArgs).toContain('/auth/token/')
  })

  it('handles login failure', async () => {
    const store = useAuthStore()
    
    vi.mocked(api.post).mockRejectedValue(new Error('Invalid credentials'))
    
    const result = await store.login('testuser', 'wrongpassword')
    
    expect(result).toBe(false)
    expect(store.accessToken).toBeNull()
    expect(store.refreshToken).toBeNull()
  })

  it('EH-FE-12: 401 login shows a localized message, not the English DRF detail', async () => {
    const store = useAuthStore()
    vi.mocked(api.post).mockRejectedValue({
      response: { status: 401, data: { detail: 'No active account found with the given credentials' } },
    })

    const result = await store.login('testuser', 'wrongpassword')

    expect(result).toBe(false)
    expect(store.error).toBe('Неверный логин или пароль')
  })

  it('fetches user profile successfully', async () => {
    const store = useAuthStore()
    const mockUser = {
      id: 1,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      role: 'admin'
    }
    
    vi.mocked(api.get).mockResolvedValue({ data: mockUser })
    
    await store.fetchMe()
    
    expect(store.me).toEqual(mockUser)
    expect(api.get).toHaveBeenCalledWith('http://localhost:8000/api/v1/users/me')
  })

  // FE-1: refreshTokens делегирует в ЕДИНУЮ точку refreshAccessToken (общий лок),
  // а не рефрешит вторым независимым потоком через api.post.
  it('делегирует refresh в единую точку refreshAccessToken (FE-1)', async () => {
    const store = useAuthStore()
    vi.mocked(refreshAccessToken).mockResolvedValue('new-access-token')

    const newToken = await store.refreshTokens()

    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(newToken).toBe('new-access-token')
    // второго независимого потока через api.post больше нет
    expect(api.post).not.toHaveBeenCalled()
  })

  it('возвращает null, когда единый refresh не удался', async () => {
    const store = useAuthStore()
    vi.mocked(refreshAccessToken).mockResolvedValue(null)

    const newToken = await store.refreshTokens()

    expect(newToken).toBeNull()
  })
})
