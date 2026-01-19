import type { RouteRecordNormalized } from 'vue-router'
import type { NavigationItem, AppRouteRecordRaw } from '@/types/router'
import { usePermissionsStore } from '@/stores/permissions'
import { useAuthStore } from '@/stores/auth'

/**
 * Проверка доступа к маршруту через RBAC permissions
 */
function hasPermissionAccess(permissions: string[] | undefined): boolean {
  if (!permissions || permissions.length === 0) {
    return true // Нет ограничений по permissions
  }
  
  const permissionsStore = usePermissionsStore()
  const authStore = useAuthStore()
  
  // Суперпользователь имеет все права
  if (authStore.me?.is_superuser) {
    return true
  }
  
  // ✅ Используем прямой доступ к permissions вместо computed функции для надежности
  const permissionCodenames = new Set(permissionsStore.permissions.map(p => p.codename))
  return permissions.some(codename => permissionCodenames.has(codename))
}

/**
 * Generate navigation menu from routes
 * ✅ RBAC: Использует permissions для проверки доступа
 * ⚠️ DEPRECATED: userRole параметр сохранен для обратной совместимости, но не используется
 */
/**
 * ✅ RBAC: Генерирует навигацию на основе permissions
 * @param routes - Список маршрутов
 */
export function generateNavigation(routes: RouteRecordNormalized[]): NavigationItem[] {
  const navigation: NavigationItem[] = []
  
  // Отладка: проверить все маршруты administration (можно удалить после проверки)
  const allAdminRoutes = routes.filter(r => r.meta?.category === 'administration')
  if (allAdminRoutes.length > 0) {
    console.log('[Router] Все маршруты с категорией administration:', allAdminRoutes.map(r => ({ 
      path: r.path, 
      name: r.name, 
      permissions: r.meta.permissions,
      public: r.meta.public 
    })))
  } else {
    console.log('[Router] Нет маршрутов с категорией administration в router.getRoutes()')
    console.log('[Router] Все маршруты:', routes.map(r => ({ path: r.path, name: r.name, category: r.meta?.category })))
  }
  
  // Filter routes that should appear in navigation
  const navRoutes = routes.filter(route => {
    // Skip routes without meta or with public: true
    if (!route.meta || route.meta.public) {return false}
    
    // Skip routes with specific names that shouldn't be in nav
    const skipRoutes = ['Login', 'NotFound', 'MaterialCreate', 'MaterialEdit', 'ObjectCreate', 'ObjectEdit', 'UnitCreate', 'UnitEdit', 'EmployeeCreate', 'EmployeeEdit', 'SupplierCreate', 'SupplierEdit', 'StockCreate', 'StockEdit', 'WriteOffCreate', 'WriteOffEdit', 'PurchaseCreate', 'PurchaseEdit']
    if (skipRoutes.includes(route.name as string)) {return false}
    
    // ✅ RBAC: Проверка через permissions
    const routePermissions = route.meta.permissions as string[] | undefined
    if (routePermissions && routePermissions.length > 0) {
      const hasAccess = hasPermissionAccess(routePermissions)
      // Отладка для маршрутов administration (можно удалить после проверки)
      if (route.meta.category === 'administration' && !hasAccess) {
        const permissionsStore = usePermissionsStore()
        console.log(`[Router] Маршрут ${route.path} отфильтрован:`, {
          route: route.path,
          category: route.meta.category,
          requiredPermissions: routePermissions,
          userPermissions: permissionsStore.permissions.map(p => p.codename),
          hasAccess
        })
      }
      if (!hasAccess) {
        return false
      }
    }
    // ⚠️ DEPRECATED: meta.roles больше не поддерживается
    // Если маршрут использует только meta.roles без permissions, он не будет показан
    else if (route.meta.roles && Array.isArray(route.meta.roles)) {
      console.warn(`[RBAC] Route ${route.path} uses deprecated meta.roles. Migrate to meta.permissions.`)
        return false
    }
    
    return true
  })
  
  // Group routes by category
  const categories = new Map<string, NavigationItem[]>()
  
  // Отладка: проверить маршруты administration (можно удалить после проверки)
  const adminRoutes = navRoutes.filter(r => r.meta.category === 'administration')
  if (adminRoutes.length > 0) {
    console.log('[Router] Маршруты administration прошли фильтрацию:', adminRoutes.map(r => ({ path: r.path, name: r.name, permissions: r.meta.permissions })))
  }
  
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
    })
  })
  
  // Отладка: проверить что попало в categories (можно удалить после проверки)
  if (categories.has('administration')) {
    console.log('[Router] Маршруты administration в categories:', categories.get('administration')?.map(i => ({ name: i.name, path: i.path })))
  }
  
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
      'administration': 8,  // ✅ Администрирование: между Инструменты и Справочники
      'reference_data': 9,  // ✅ Справочники: после Администрирования
      'settings': 10,
      'archive': 11,
      'reports': 12,
      'import': 13,
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
  
  // Отладка: проверить итоговую навигацию (можно удалить после проверки)
  const adminNavItems = navigation.filter(i => i.category === 'administration')
  if (adminNavItems.length > 0) {
    console.log('[Router] Итоговые элементы administration в navigation:', adminNavItems.map(i => ({ name: i.name, path: i.path, title: i.title })))
  } else {
    console.log('[Router] В итоговой navigation нет элементов administration')
    console.log('[Router] Все категории в navigation:', [...new Set(navigation.map(i => i.category))])
  }
  
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
    'administration': 'Администрирование',  // ✅ Администрирование: между Инструменты и Справочники
    'reference_data': 'Справочники',  // ✅ Справочники: после Администрирования
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
 * ✅ RBAC: Использует permissions для проверки доступа
 * ⚠️ DEPRECATED: userRole параметр сохранен для обратной совместимости
 */
/**
 * ✅ RBAC: Проверяет доступ к маршруту через permissions
 * @param route - Маршрут для проверки
 */
export function hasRouteAccess(route: RouteRecordNormalized): boolean {
  // Public routes are always accessible
  if (route.meta.public) {return true}
  
  // ✅ RBAC: Проверка через permissions
  const routePermissions = route.meta.permissions as string[] | undefined
  if (routePermissions && routePermissions.length > 0) {
    return hasPermissionAccess(routePermissions)
  }
  
  // ⚠️ DEPRECATED: meta.roles больше не поддерживается
  // Если маршрут использует только meta.roles без permissions, доступ запрещен
  if (route.meta.roles && Array.isArray(route.meta.roles)) {
    console.warn(`[RBAC] Route ${route.path} uses deprecated meta.roles. Migrate to meta.permissions.`)
      return false
  }
  
  return true // Нет ограничений
}

/**
 * ✅ RBAC: Получает доступные маршруты на основе permissions
 */
export function getAccessibleRoutes(routes: RouteRecordNormalized[]): RouteRecordNormalized[] {
  return routes.filter(route => hasRouteAccess(route))
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
 * ✅ RBAC: Использует permissions для проверки доступа
 * ⚠️ DEPRECATED: userRole параметр сохранен для обратной совместимости
 */
/**
 * ✅ RBAC: Получает permissions для маршрута
 * @param route - Маршрут
 */
export function getRoutePermissions(route: RouteRecordNormalized): {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
} {
  const canView = hasRouteAccess(route)
  
  // For now, same permissions for all operations
  // In the future, this could be more granular based on route meta
  return {
    canView,
    canCreate: canView,
    canEdit: canView,
    canDelete: canView
  }
}
