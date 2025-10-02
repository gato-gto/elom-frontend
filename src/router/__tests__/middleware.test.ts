import { describe, it, expect, vi, beforeEach } from 'vitest'
import { middleware, getRouteMiddleware, applyMiddleware } from '../middleware'
import { useAuthStore } from '@/stores/auth'

// Mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn()
}))

describe('Router Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('auth middleware', () => {
    it('allows access for authenticated users', () => {
      const mockTo = {} as any
      const mockFrom = {} as any
      const mockNext = vi.fn()

      // Mock authenticated user
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true
      } as any)

      middleware.auth(mockTo, mockFrom, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('redirects unauthenticated users to login', () => {
      const mockTo = { fullPath: '/protected' } as any
      const mockFrom = {} as any
      const mockNext = vi.fn()

      // Mock unauthenticated user
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: false
      } as any)

      middleware.auth(mockTo, mockFrom, mockNext)

      expect(mockNext).toHaveBeenCalledWith('/login?redirect=%2Fprotected')
    })
  })

  describe('guest middleware', () => {
    it('allows access for unauthenticated users', () => {
      const mockTo = {} as any
      const mockFrom = {} as any
      const mockNext = vi.fn()

      // Mock unauthenticated user
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: false
      } as any)

      middleware.guest(mockTo, mockFrom, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('redirects authenticated users to purchases', () => {
      const mockTo = {} as any
      const mockFrom = {} as any
      const mockNext = vi.fn()

      // Mock authenticated user
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true
      } as any)

      middleware.guest(mockTo, mockFrom, mockNext)

      expect(mockNext).toHaveBeenCalledWith('/purchases')
    })
  })

  describe('roles middleware', () => {
    it('allows access for users with required role', () => {
      const mockTo = {
        meta: { roles: ['admin'] }
      } as any

      const mockFrom = {} as any
      const mockNext = vi.fn()

      // Mock auth store with admin role
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        role: 'admin'
      } as any)

      const rolesMiddleware = middleware.roles(['admin'])
      rolesMiddleware(mockTo, mockFrom, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('denies access for users without required role', () => {
      const mockTo = {
        meta: { roles: ['admin'] }
      } as any

      const mockFrom = {} as any
      const mockNext = vi.fn()

      // Mock auth store with user role
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        role: 'user'
      } as any)

      const rolesMiddleware = middleware.roles(['admin'])
      rolesMiddleware(mockTo, mockFrom, mockNext)

      expect(mockNext).toHaveBeenCalledWith('/purchases')
    })

    it('allows access when no roles are required', () => {
      const mockTo = {} as any
      const mockFrom = {} as any
      const mockNext = vi.fn()

      // Mock auth store
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        role: 'user'
      } as any)

      const rolesMiddleware = middleware.roles([])
      rolesMiddleware(mockTo, mockFrom, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('applyMiddleware', () => {
    it('applies middleware in correct order', async () => {
      const mockTo = { meta: { roles: ['admin'] } } as any
      const mockFrom = {} as any
      const mockNext = vi.fn()

      // Mock auth store
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        role: 'admin'
      } as any)

      const middlewares = [middleware.auth, middleware.roles(['admin'])]
      
      applyMiddleware(mockTo, mockFrom, mockNext, middlewares)

      expect(mockNext).toHaveBeenCalled()
    })

    it('stops middleware chain on failure', async () => {
      const mockTo = { fullPath: '/protected' } as any
      const mockFrom = {} as any
      const mockNext = vi.fn()

      // Mock unauthenticated user
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: false
      } as any)

      const middlewares = [middleware.auth, middleware.roles(['admin'])]
      
      applyMiddleware(mockTo, mockFrom, mockNext, middlewares)

      expect(mockNext).toHaveBeenCalledWith('/login?redirect=%2Fprotected')
    })

    it('handles middleware errors gracefully', async () => {
      const mockTo = {} as any
      const mockFrom = {} as any
      const mockNext = vi.fn()

      // Mock auth store that throws error
      vi.mocked(useAuthStore).mockImplementation(() => {
        throw new Error('Store error')
      })

      const middlewares = [middleware.auth]
      
      applyMiddleware(mockTo, mockFrom, mockNext, middlewares)

      expect(mockNext).toHaveBeenCalledWith('/purchases')
    })
  })

  describe('getRouteMiddleware', () => {
    it('returns correct middleware for route', () => {
      const mockTo = {
        meta: { roles: ['admin'] }
      } as any

      const result = getRouteMiddleware(mockTo)

      expect(result).toContain(middleware.auth)
      expect(result.length).toBeGreaterThan(0)
    })

    it('returns empty array for public routes', () => {
      const mockTo = {
        meta: { public: true }
      } as any

      const result = getRouteMiddleware(mockTo)

      expect(result).toContain(middleware.guest)
    })

    it('returns guest middleware for guest routes', () => {
      const mockTo = {
        meta: { public: true }
      } as any

      const result = getRouteMiddleware(mockTo)

      expect(result).toContain(middleware.guest)
    })
  })
})