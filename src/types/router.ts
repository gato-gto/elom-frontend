// Router types and interfaces

import type { UserRole } from '@/api/types/common'

// Route meta information
export interface RouteMeta {
  title?: string
  icon?: string
  breadcrumb?: string
  public?: boolean
  auth?: boolean
  roles?: UserRole[]
  requiresRole?: UserRole | UserRole[]
  description?: string
  category?: string
  order?: number
  // Additional meta properties
  keywords?: string[]
  noIndex?: boolean
  layout?: string
  middleware?: string[]
  permissions?: {
    view?: UserRole[]
    create?: UserRole[]
    edit?: UserRole[]
    delete?: UserRole[]
  }
}

// Extended route record with meta
export interface AppRouteRecordRaw {
  path: string
  name: string
  component?: any
  meta?: RouteMeta
  children?: AppRouteRecordRaw[]
  redirect?: string | { name: string }
}

// Navigation item for menu generation
export interface NavigationItem {
  name: string
  path: string
  icon?: string
  title: string
  description?: string
  category?: string
  order?: number
  roles?: UserRole[]
  children?: NavigationItem[]
}

// Role hierarchy for access control
// - admin: Администратор (полный доступ)
// - manager: Управляющий (полный доступ, но без учета изменений)
// - warehouse: Склад/Цех/Проект (полный доступ без учета изменений)
// - brigadier: Бригадир/Инженер (работа с назначенными объектами)
// - requester: Заявитель (просмотр и подача заявок)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  manager: 90,
  warehouse: 85,
  brigadier: 60,
  requester: 40
}

// Helper function to check if user has required role or higher
export function hasRoleAccess(userRole: UserRole | null, requiredRoles: UserRole[]): boolean {
  if (!userRole) {return false}
  
  const userLevel = ROLE_HIERARCHY[userRole]
  return requiredRoles.some(role => userLevel >= ROLE_HIERARCHY[role])
}

// Helper function to get accessible routes for user
export function getAccessibleRoutes(routes: AppRouteRecordRaw[], userRole: UserRole | null): AppRouteRecordRaw[] {
  return routes.filter(route => {
    if (route.meta?.public) {return true}
    if (!route.meta?.auth && !route.meta?.roles) {return true}
    if (!userRole) {return false}
    
    if (route.meta?.roles) {
      return hasRoleAccess(userRole, route.meta.roles)
    }
    
    return true
  })
}
