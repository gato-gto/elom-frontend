import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import { generateNavigation, getBreadcrumbs, hasRouteAccess, getRoutePermissions } from '@/utils/router'
import type { NavigationItem } from '@/types/router'

/**
 * Composable for router-related functionality
 */
export function useAppRouter() {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()

  // Current route info
  const currentRoute = computed(() => route)
  const currentPath = computed(() => route.path)
  const currentName = computed(() => route.name as string)
  const currentMeta = computed(() => route.meta)
  const currentTitle = computed(() => route.meta.title as string)
  const currentBreadcrumb = computed(() => route.meta.breadcrumb as string)

  // Navigation
  const navigation = computed(() => {
    // ✅ RBAC: userRole больше не используется, проверка через permissions
    return generateNavigation(router.getRoutes())
  })

  // Breadcrumbs
  const breadcrumbs = computed(() => {
    const routeRecord = router.getRoutes().find(r => r.name === route.name)
    return routeRecord ? getBreadcrumbs(routeRecord) : []
  })

  // Route access
  const hasAccess = computed(() => {
    const routeRecord = router.getRoutes().find(r => r.name === route.name)
    // ✅ RBAC: userRole больше не используется, проверка через permissions
    return routeRecord ? hasRouteAccess(routeRecord) : false
  })

  const permissions = computed(() => {
    const routeRecord = router.getRoutes().find(r => r.name === route.name)
    // ✅ RBAC: userRole больше не используется, проверка через permissions
    return routeRecord ? getRoutePermissions(routeRecord) : {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }
  })

  // Navigation methods
  const navigateTo = (path: string) => {
    router.push(path)
  }

  const navigateToName = (name: string, params?: Record<string, any>) => {
    router.push({ name, params })
  }

  const navigateBack = () => {
    router.back()
  }

  const navigateForward = () => {
    router.forward()
  }

  const replaceRoute = (path: string) => {
    router.replace(path)
  }

  // Route checking
  const isCurrentRoute = (path: string) => {
    return route.path === path
  }

  const isCurrentRouteName = (name: string) => {
    return route.name === name
  }

  const isRouteActive = (path: string) => {
    return route.path.startsWith(path)
  }

  // Meta helpers
  const getMetaValue = (key: string) => {
    return route.meta[key]
  }

  const hasMeta = (key: string) => {
    return key in route.meta
  }

  // Role-based navigation
  const getNavigationByCategory = (category: string): NavigationItem[] => {
    return navigation.value.filter(item => item.category === category)
  }

  const getMainNavigation = (): NavigationItem[] => {
    return navigation.value.filter(item => 
      ['main', 'inventory', 'purchases', 'objects', 'suppliers'].includes(item.category || '')
    )
  }

  const getSecondaryNavigation = (): NavigationItem[] => {
    return navigation.value.filter(item => 
      ['users', 'settings', 'archive', 'reports', 'import'].includes(item.category || '')
    )
  }

  // Route history
  const canGoBack = computed(() => {
    return window.history.length > 1
  })

  const canGoForward = computed(() => {
    // This is a simplified check, in real app you might want to track history
    return false
  })

  // Query parameters
  const queryParams = computed(() => route.query)
  
  const getQueryParam = (key: string) => {
    return route.query[key]
  }

  const setQueryParam = (key: string, value: string) => {
    const query = { ...route.query, [key]: value }
    router.push({ query })
  }

  const removeQueryParam = (key: string) => {
    const query = { ...route.query }
    delete query[key]
    router.push({ query })
  }

  // Route parameters
  const routeParams = computed(() => route.params)
  
  const getRouteParam = (key: string) => {
    return route.params[key]
  }

  // Hash
  const currentHash = computed(() => route.hash)

  const setHash = (hash: string) => {
    router.push({ hash })
  }

  return {
    // Current route info
    currentRoute,
    currentPath,
    currentName,
    currentMeta,
    currentTitle,
    currentBreadcrumb,
    
    // Navigation
    navigation,
    breadcrumbs,
    
    // Access control
    hasAccess,
    permissions,
    
    // Navigation methods
    navigateTo,
    navigateToName,
    navigateBack,
    navigateForward,
    replaceRoute,
    
    // Route checking
    isCurrentRoute,
    isCurrentRouteName,
    isRouteActive,
    
    // Meta helpers
    getMetaValue,
    hasMeta,
    
    // Category navigation
    getNavigationByCategory,
    getMainNavigation,
    getSecondaryNavigation,
    
    // History
    canGoBack,
    canGoForward,
    
    // Query parameters
    queryParams,
    getQueryParam,
    setQueryParam,
    removeQueryParam,
    
    // Route parameters
    routeParams,
    getRouteParam,
    
    // Hash
    currentHash,
    setHash
  }
}

/**
 * Composable for route-based permissions
 * ✅ RBAC: использует permissions вместо хардкода ролей
 */
export function useRoutePermissions() {
  const { currentRoute, permissions: routePermissions, hasAccess } = useAppRouter()
  const { can, hasPermission, hasAnyPermission } = usePermissions()

  // ✅ RBAC: проверка через permissions
  const canView = computed(() => routePermissions.value.canView)
  const canCreate = computed(() => routePermissions.value.canCreate)
  const canEdit = computed(() => routePermissions.value.canEdit)
  const canDelete = computed(() => routePermissions.value.canDelete)

  // ✅ RBAC: универсальные проверки через permissions
  const canManageUsers = computed(() => hasPermission('employees.edit'))
  const canManageRoles = computed(() => hasPermission('rbac.manage_roles'))
  const canExportReports = computed(() => hasPermission('reports.export'))
  const canViewAllObjects = computed(() => hasPermission('objects.view_all'))

  return {
    canView,
    canCreate,
    canEdit,
    canDelete,
    hasAccess,
    // ✅ RBAC методы
    can,
    hasPermission,
    hasAnyPermission,
    // Специфичные проверки
    canManageUsers,
    canManageRoles,
    canExportReports,
    canViewAllObjects
  }
}

