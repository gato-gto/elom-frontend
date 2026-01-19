import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
// UserRole больше не используется - все проверки через RBAC permissions

// Middleware types
export type MiddlewareFunction = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => void | Promise<void>

export interface MiddlewareConfig {
  auth?: boolean
  guest?: boolean
  // ⚠️ DEPRECATED: roles удалено - используйте permissions в RouteMeta
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

  // ⚠️ DEPRECATED: middleware.roles удален - используйте meta.permissions в маршрутах

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

  // ⚠️ DEPRECATED: meta.roles больше не поддерживается
  // Используйте meta.permissions - проверка выполняется в router guard (index.ts)

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
    if (isCompleted) {return}
    
    if (index >= middlewares.length) {
      isCompleted = true
      next()
      return
    }

    const middleware = middlewares[index++]
    
    try {
      const result = middleware(to, from, (location?: any) => {
        if (isCompleted) {return}
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
          if (isCompleted) {return}
          runNext()
        }).catch((error) => {
          if (isCompleted) {return}
          isCompleted = true
          console.error('Middleware error:', error)
          next('/purchases')
        })
      } else if (result === undefined) {
        // Synchronous middleware completed without calling next
        if (isCompleted) {return}
        runNext()
      }
    } catch (error) {
      if (isCompleted) {return}
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

// ⚠️ DEPRECATED функции удалены - используйте RBAC permissions через usePermissions() composable