// Router types and interfaces

// Route meta information
export interface RouteMeta {
  title?: string
  icon?: string
  breadcrumb?: string
  public?: boolean
  auth?: boolean
  description?: string
  category?: string
  order?: number
  
  // ✅ RBAC: permissions для проверки доступа (приоритет!)
  permissions?: string[]  // ['materials.view', 'materials.create']
  
  // ⚠️ DEPRECATED: roles удалено - используйте permissions
  
  // Additional meta properties
  keywords?: string[]
  noIndex?: boolean
  layout?: string
  middleware?: string[]
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
  // ⚠️ DEPRECATED: roles удалено - используйте permissions в RouteMeta
  children?: NavigationItem[]
}

// ⚠️ DEPRECATED функции удалены - используйте RBAC permissions через usePermissions() composable
