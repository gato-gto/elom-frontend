import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/api/types/common'

// Middleware types
export type MiddlewareFunction = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => void | Promise<void>

export interface MiddlewareConfig {
  auth?: boolean
  guest?: boolean
  roles?: UserRole[]
  redirect?: string
}

// Available middleware functions
export const middleware = {
  // Require authentication
  auth: async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
    const auth = useAuthStore()
    
    // Wait for auth store to be initialized
    if (!auth.initialized) {
      try {
        await auth.tryHydrate()
      } catch (error) {
        console.error('Auth hydration failed in middleware:', error)
        next('/login')
        return
      }
    }
    
    if (!auth.isAuthenticated) {
      const redirect = encodeURIComponent(to.fullPath)
      next(`/login?redirect=${redirect}`)
      return
    }
    
    next()
  },

  // Require guest (not authenticated)
  guest: async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
    const auth = useAuthStore()
    
    // Wait for auth store to be initialized
    if (!auth.initialized) {
      try {
        await auth.tryHydrate()
      } catch (error) {
        console.error('Auth hydration failed in guest middleware:', error)
        next()
        return
      }
    }
    
    if (auth.isAuthenticated) {
      next('/purchases')
      return
    }
    
    next()
  },

  // Require specific roles
  roles: (requiredRoles: UserRole[]) => {
    return async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
      const auth = useAuthStore()
      
      // Wait for auth store to be initialized
      if (!auth.initialized) {
        try {
          await auth.tryHydrate()
        } catch (error) {
          console.error('Auth hydration failed in roles middleware:', error)
          next('/login')
          return
        }
      }
      
      if (!auth.isAuthenticated) {
        const redirect = encodeURIComponent(to.fullPath)
        next(`/login?redirect=${redirect}`)
        return
      }
      
      if (!auth.role || !requiredRoles.includes(auth.role)) {
        next('/purchases')
        return
      }
      
      next()
    }
  },

  // Redirect to specific route
  redirect: (path: string) => {
    return (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
      next(path)
    }
  }
}

// Get middleware for a route based on its meta
export function getRouteMiddleware(to: RouteLocationNormalized): MiddlewareFunction[] {
  const middlewares: MiddlewareFunction[] = []
  const meta = to.meta

  // Public routes - no middleware needed
  if (meta.public) {
    middlewares.push(middleware.guest)
    return middlewares
  }

  // Protected routes - require auth
  middlewares.push(middleware.auth)

  // Role-based access
  if (meta.roles && Array.isArray(meta.roles) && meta.roles.length > 0) {
    middlewares.push(middleware.roles(meta.roles))
  }

  // If no middleware, add a simple pass-through
  if (middlewares.length === 0) {
    middlewares.push((to, from, next) => next())
  }

  return middlewares
}

// Apply middleware chain
export function applyMiddleware(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
  middlewares: MiddlewareFunction[]
): void {
  let index = 0
  let isCompleted = false

  function runNext() {
    if (isCompleted) return
    
    if (index >= middlewares.length) {
      isCompleted = true
      next()
      return
    }

    const middleware = middlewares[index++]
    
    try {
      const result = middleware(to, from, (location?: any) => {
        if (isCompleted) return
        isCompleted = true
        
        if (location) {
          next(location)
        } else {
          runNext()
        }
      })

      // Handle async middleware
      if (result instanceof Promise) {
        result.then(() => {
          if (isCompleted) return
          runNext()
        }).catch((error) => {
          if (isCompleted) return
          isCompleted = true
          console.error('Middleware error:', error)
          next('/purchases')
        })
      } else if (result === undefined) {
        // Synchronous middleware completed without calling next
        if (isCompleted) return
        runNext()
      }
    } catch (error) {
      if (isCompleted) return
      isCompleted = true
      console.error('Middleware error:', error)
      next('/purchases')
    }
  }

  // Ensure next is always called
  if (middlewares.length === 0) {
    next()
    return
  }

  runNext()
}

// Helper function to check if user has required role
export function hasRequiredRole(userRole: UserRole | null, requiredRoles: UserRole[]): boolean {
  if (!userRole || !requiredRoles.length) return false
  return requiredRoles.includes(userRole)
}

// Helper function to get accessible routes for user
export function getAccessibleRoutes(routes: any[], userRole: UserRole | null): any[] {
  return routes.filter(route => {
    if (route.meta?.public) return true
    if (!route.meta?.roles) return true
    if (!userRole) return false
    
    return hasRequiredRole(userRole, route.meta.roles)
  })
}