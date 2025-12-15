import type { RouteRecordNormalized } from 'vue-router'
import type { UserRole } from '@/api/types/common'
import type { NavigationItem, AppRouteRecordRaw } from '@/types/router'

/**
 * Generate navigation menu from routes
 */
export function generateNavigation(routes: RouteRecordNormalized[], userRole: UserRole | null): NavigationItem[] {
  const navigation: NavigationItem[] = []
  
  // Filter routes that should appear in navigation
  const navRoutes = routes.filter(route => {
    // Skip routes without meta or with public: true
    if (!route.meta || route.meta.public) {return false}
    
    // Skip routes with specific names that shouldn't be in nav
    const skipRoutes = ['Login', 'NotFound', 'MaterialCreate', 'MaterialEdit', 'ObjectCreate', 'ObjectEdit', 'UnitCreate', 'UnitEdit', 'EmployeeCreate', 'EmployeeEdit', 'SupplierCreate', 'SupplierEdit', 'StockCreate', 'StockEdit', 'WriteOffCreate', 'WriteOffEdit', 'PurchaseCreate', 'PurchaseEdit']
    if (skipRoutes.includes(route.name as string)) {return false}
    
    // Check role access
    // Если у роута указаны roles, проверяем что текущая роль есть в списке
    if (route.meta.roles && Array.isArray(route.meta.roles)) {
      // Если роль пользователя не определена - скрываем защищённые роуты
      if (!userRole) {return false}
      // Если роль не входит в список разрешённых - скрываем
      if (!(route.meta.roles as UserRole[]).includes(userRole)) {
        return false
      }
    }
    
    return true
  })
  
  // Group routes by category
  const categories = new Map<string, NavigationItem[]>()
  
  navRoutes.forEach(route => {
    const category = (route.meta.category as string) || 'other'
    const order = (route.meta.order as number) || 999
    
    if (!categories.has(category)) {
      categories.set(category, [])
    }
    
    categories.get(category)!.push({
      name: route.name as string,
      path: route.path,
      icon: route.meta.icon as string,
      title: route.meta.title as string,
      description: route.meta.description as string,
      category: category,
      order: order,
      roles: route.meta.roles as UserRole[]
    })
  })
  
  // Sort categories and items within categories
  const sortedCategories = Array.from(categories.entries())
    .sort(([a], [b]) => {
const categoryOrder = {
      'main': 1,
      'inventory': 2,
      'purchases': 3,
      'objects': 4,
      'suppliers': 5,
      'users': 6,
      'tools': 7,
      'settings': 8,
      'archive': 9,
      'reports': 10,
      'import': 11,
      'other': 999
    }
      return (categoryOrder[a as keyof typeof categoryOrder] || 999) - (categoryOrder[b as keyof typeof categoryOrder] || 999)
    })
  
  sortedCategories.forEach(([categoryName, items]) => {
    // Sort items within category by order
    items.sort((a, b) => (a.order || 999) - (b.order || 999))
    
    // Add category header if there are multiple items
    if (items.length > 1) {
      navigation.push({
        name: `category-${categoryName}`,
        path: '#',
        title: getCategoryTitle(categoryName),
        category: categoryName,
        order: items[0].order || 999
      })
    }
    
    // Add items
    navigation.push(...items)
  })
  
  return navigation
}

/**
 * Get category title in Russian
 */
function getCategoryTitle(category: string): string {
  const titles: Record<string, string> = {
    'main': 'Основное',
    'inventory': 'Склад',
    'purchases': 'Закупки',
    'objects': 'Объекты',
    'suppliers': 'Поставщики',
    'users': 'Пользователи',
    'tools': 'Инструменты',
    'settings': 'Настройки',
    'archive': 'Архив',
    'reports': 'Отчеты',
    'import': 'Импорт',
    'other': 'Прочее'
  }
  
  return titles[category] || category
}

/**
 * Get breadcrumb trail for current route
 */
export function getBreadcrumbs(route: RouteRecordNormalized): Array<{ title: string; path?: string }> {
  const breadcrumbs: Array<{ title: string; path?: string }> = []
  
  // Add dashboard as first breadcrumb
  breadcrumbs.push({ title: 'Панель управления', path: '/' })
  
  // Add route breadcrumb if available
  if (route.meta.breadcrumb) {
    const parts = (route.meta.breadcrumb as string).split(' / ')
    parts.forEach((part: string, index: number) => {
      if (index === parts.length - 1) {
        // Last part is current page, no link
        breadcrumbs.push({ title: part })
      } else {
        // Previous parts could have links (simplified for now)
        breadcrumbs.push({ title: part })
      }
    })
  } else if (route.meta.title) {
    breadcrumbs.push({ title: route.meta.title as string })
  }
  
  return breadcrumbs
}

/**
 * Check if user has access to route
 */
export function hasRouteAccess(route: RouteRecordNormalized, userRole: UserRole | null): boolean {
  // Public routes are always accessible
  if (route.meta.public) {return true}
  
  // If no role required, accessible to authenticated users
  if (!route.meta.roles) {return true}
  
  // Check if user role is in required roles
  return userRole ? (route.meta.roles as UserRole[]).includes(userRole) : false
}

/**
 * Get accessible routes for user
 */
export function getAccessibleRoutes(routes: RouteRecordNormalized[], userRole: UserRole | null): RouteRecordNormalized[] {
  return routes.filter(route => hasRouteAccess(route, userRole))
}

/**
 * Find route by name with type safety
 */
export function findRouteByName(routes: RouteRecordNormalized[], name: string): RouteRecordNormalized | undefined {
  return routes.find(route => route.name === name)
}

/**
 * Get route category icon
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'main': 'dashboard',
    'inventory': 'inventory',
    'purchases': 'shopping_cart',
    'objects': 'location_on',
    'suppliers': 'truck',
    'users': 'people',
    'tools': 'build',
    'settings': 'settings',
    'archive': 'archive',
    'reports': 'assessment',
    'import': 'upload',
    'other': 'more_horiz'
  }
  
  return icons[category] || 'more_horiz'
}

/**
 * Get route permissions for current user
 */
export function getRoutePermissions(route: RouteRecordNormalized, userRole: UserRole | null): {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
} {
  const canView = hasRouteAccess(route, userRole)
  
  // For now, same permissions for all operations
  // In the future, this could be more granular based on route meta
  return {
    canView,
    canCreate: canView,
    canEdit: canView,
    canDelete: canView
  }
}
