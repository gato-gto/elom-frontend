<template>
  <nav class="p-3 w-full animate-slide-in-left">
    <ul class="space-y-1">
      <li 
        v-for="item in navigationItems" 
        :key="item.name"
        class="nav-item" 
        :class="{ 'active': isActive(item.path) }"
      >
        <router-link :to="item.path" class="nav-link">
          <div class="nav-icon-wrapper">
            <svg 
              v-if="item.icon" 
              class="nav-icon" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                :d="getIconPath(item.icon)"
              />
            </svg>
          </div>
          {{ item.title }}
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { NavigationItem } from '@/types/router'
import type { UserRole } from '@/api/types/common'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// Icon paths mapping for common icons
const iconPaths: Record<string, string> = {
  dashboard: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 4h6',
  inventory: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  shopping_cart: 'M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01',
  truck: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  location_on: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  warehouse: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  'minus-circle': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  archive: 'M5 8l6 6 6-6',
  people: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z',
  straighten: 'M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m3 0H4m15.5 0l-1.5 1.5m0 0V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5.5m11 0l1.5-1.5',
  upload: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
  chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
}

function getIconPath(icon: string): string {
  return iconPaths[icon] || iconPaths.dashboard
}

function hasRoleAccess(userRole: UserRole | null, requiredRoles: UserRole[]): boolean {
  if (!userRole || !requiredRoles.length) return true
  return requiredRoles.includes(userRole)
}

function isActive(path: string): boolean {
  return route.path.startsWith(path)
}

// Build navigation from router configuration
const navigationItems = computed((): NavigationItem[] => {
  const routes = router.getRoutes()
  const items: NavigationItem[] = []
  
  routes.forEach(route => {
    const meta = route.meta
    
    // Skip routes without icon (not main nav items)
    if (!meta?.icon) return
    
    // Skip public routes
    if (meta.public) return
    
    // Check role access
    if (meta.roles && !hasRoleAccess(auth.role, meta.roles as UserRole[])) return
    
    const item: NavigationItem = {
      name: route.name as string,
      path: route.path,
      title: meta.title as string,
      icon: meta.icon as string,
      description: meta.description as string,
      category: meta.category as string,
      order: meta.order as number || 999,
      roles: meta.roles as UserRole[]
    }
    
    items.push(item)
  })
  
  // Sort by order, then by title
  return items.sort((a, b) => {
    if (a.order !== b.order) {
      return (a.order || 0) - (b.order || 0)
    }
    return a.title.localeCompare(b.title)
  })
})
</script>

<style scoped>
/* Navigation styles inherited from parent layout */
</style>
