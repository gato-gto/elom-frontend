import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import api from '@/api/client'

// Mock API client
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('initializes with empty state', () => {
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
    const mockResponse = {
      data: {
        access: 'access-token',
        refresh: 'refresh-token'
      }
    }
    
    vi.mocked(api.post).mockResolvedValue(mockResponse)
    
    const result = await store.login('testuser', 'password')
    
    expect(result).toBe(true)
    expect(store.accessToken).toBe('access-token')
    expect(store.refreshToken).toBe('refresh-token')
    expect(api.post).toHaveBeenCalledWith('/api/v1/auth/token/', {
      username: 'testuser',
      password: 'password'
    })
  })

  it('handles login failure', async () => {
    const store = useAuthStore()
    
    vi.mocked(api.post).mockRejectedValue(new Error('Invalid credentials'))
    
    const result = await store.login('testuser', 'wrongpassword')
    
    expect(result).toBe(false)
    expect(store.accessToken).toBeNull()
    expect(store.refreshToken).toBeNull()
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
    expect(api.get).toHaveBeenCalledWith('/api/v1/users/me/')
  })

  it('refreshes tokens successfully', async () => {
    const store = useAuthStore()
    store.setTokens({ access: 'old-token', refresh: 'refresh-token' })
    
    const mockResponse = {
      data: {
        access: 'new-access-token'
      }
    }
    
    vi.mocked(api.post).mockResolvedValue(mockResponse)
    
    const newToken = await store.refreshTokens()
    
    expect(newToken).toBe('new-access-token')
    expect(store.accessToken).toBe('new-access-token')
    expect(api.post).toHaveBeenCalledWith('/api/v1/auth/token/refresh/', {
      refresh: 'refresh-token'
    })
  })

  it('handles token refresh failure', async () => {
    const store = useAuthStore()
    store.setTokens({ access: 'old-token', refresh: 'invalid-refresh-token' })
    
    vi.mocked(api.post).mockRejectedValue(new Error('Invalid refresh token'))
    
    const newToken = await store.refreshTokens()
    
    expect(newToken).toBeNull()
    expect(store.accessToken).toBeNull()
    expect(store.refreshToken).toBeNull()
  })
})
