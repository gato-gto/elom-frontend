<template>
  <nav class="p-3 w-full animate-slide-in-left">
    <!-- F-525: пока права грузятся (async), меню не строим по пустым правам — показываем
         скелетон вместо «пустого меню». Группы ниже сами пусты до загрузки прав. -->
    <div v-if="!permissionsStore.ready" class="space-y-2" aria-hidden="true" data-testid="nav-loading">
      <div v-for="i in 6" :key="i" class="h-8 rounded-md bg-base-300/40 animate-pulse"></div>
    </div>

    <!-- Business Operations -->
    <div v-if="businessOperations.length > 0" class="mb-4">
      <h3 class="text-xs font-semibold text-subtle uppercase tracking-wider mb-3 flex items-center">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        Операции
      </h3>
      <ul class="space-y-1">
        <li 
          v-for="item in businessOperations" 
          :key="item.name"
          class="nav-item" 
          :class="{ 'active': isActive(item.path) }"
        >
          <router-link :to="item.path" class="nav-link text-sm py-1.5 px-2">
            <div class="nav-icon-wrapper">
              <svg 
                v-if="item.icon" 
                class="nav-icon w-4 h-4" 
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
    </div>

    <!-- Inventory Management -->
    <div v-if="inventoryManagement.length > 0" class="mb-4">
      <h3 class="text-xs font-semibold text-subtle uppercase tracking-wider mb-3 flex items-center">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        Склад
      </h3>
      <ul class="space-y-1">
        <li 
          v-for="item in inventoryManagement" 
          :key="item.name"
          class="nav-item" 
          :class="{ 'active': isActive(item.path) }"
        >
          <router-link :to="item.path" class="nav-link text-sm py-1.5 px-2">
            <div class="nav-icon-wrapper">
              <svg 
                v-if="item.icon" 
                class="nav-icon w-4 h-4" 
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
    </div>

    <!-- Analytics & Reports -->
    <div v-if="analyticsReports.length > 0" class="mb-4">
      <h3 class="text-xs font-semibold text-subtle uppercase tracking-wider mb-3 flex items-center">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Аналитика
      </h3>
      <ul class="space-y-1">
        <li 
          v-for="item in analyticsReports" 
          :key="item.name"
          class="nav-item" 
          :class="{ 'active': isActive(item.path) }"
        >
          <router-link :to="item.path" class="nav-link text-sm py-1.5 px-2">
            <div class="nav-icon-wrapper">
              <svg 
                v-if="item.icon" 
                class="nav-icon w-4 h-4" 
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
    </div>

    <!-- Tools (только для admin) -->
    <div v-if="tools.length > 0" class="mb-4">
      <h3 class="text-xs font-semibold text-subtle uppercase tracking-wider mb-3 flex items-center">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath('build')" />
        </svg>
        Инструменты
      </h3>
      <ul class="space-y-1">
        <li 
          v-for="item in tools" 
          :key="item.name"
          class="nav-item" 
          :class="{ 'active': isActive(item.path) }"
        >
          <router-link :to="item.path" class="nav-link text-sm py-1.5 px-2">
            <div class="nav-icon-wrapper">
              <svg 
                v-if="item.icon" 
                class="nav-icon w-4 h-4" 
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
    </div>

    <!-- Administration -->
    <div v-if="administration.length > 0" class="mb-4">
      <h3 class="text-xs font-semibold text-subtle uppercase tracking-wider mb-3 flex items-center">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Администрирование
      </h3>
      <ul class="space-y-1">
        <li 
          v-for="item in administration" 
          :key="item.name"
          class="nav-item" 
          :class="{ 'active': isActive(item.path) }"
        >
          <router-link :to="item.path" class="nav-link text-sm py-1.5 px-2">
            <div class="nav-icon-wrapper">
              <svg 
                v-if="item.icon" 
                class="nav-icon w-4 h-4" 
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
    </div>

    <!-- Reference Data -->
    <div v-if="referenceData.length > 0" class="mb-4">
      <h3 class="text-xs font-semibold text-subtle uppercase tracking-wider mb-3 flex items-center">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
        </svg>
        Справочники
      </h3>
      <ul class="space-y-1">
        <li 
          v-for="item in referenceData" 
          :key="item.name"
          class="nav-item" 
          :class="{ 'active': isActive(item.path) }"
        >
          <router-link :to="item.path" class="nav-link text-sm py-1.5 px-2">
            <div class="nav-icon-wrapper">
              <svg 
                v-if="item.icon" 
                class="nav-icon w-4 h-4" 
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
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermissionsStore } from '@/stores/permissions'
import { usePermissions } from '@/composables/usePermissions'
import type { NavigationItem } from '@/types/router'

const route = useRoute()
const router = useRouter()
const _authStore = useAuthStore()
const permissionsStore = usePermissionsStore()
const { canCreateRequests } = usePermissions()

// Загружаем permissions при монтировании
onMounted(() => {
  permissionsStore.fetchPermissions()
})

// Build navigation from router configuration
const navigationItems = computed((): NavigationItem[] => {
  const routes = router.getRoutes()
  const items: NavigationItem[] = []
  
  routes.forEach(route => {
    const meta = route.meta
    
    // Skip routes without icon (not main nav items)
    if (!meta?.icon) {return}
    
    // Skip public routes
    if (meta.public) {return}
    
    // Check permissions access (RBAC)
    if (meta.permissions && Array.isArray(meta.permissions) && meta.permissions.length > 0) {
      if (!permissionsStore.hasAnyPermission(...meta.permissions as string[])) {return}
    }
    
    const item: NavigationItem = {
      name: route.name as string,
      path: route.path,
      title: meta.title as string,
      icon: meta.icon as string,
      description: meta.description as string,
      category: meta.category as string,
      order: meta.order as number || 999,
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

// Business Operations - основные бизнес-операции
const businessOperations = computed(() => {
  const items = navigationItems.value.filter(item =>
    ['purchases', 'objects', 'writeoffs', 'estimates'].includes(item.category || '')
  )
  
  // ✅ RBAC: Для requester изменяем название "Закупки" на "Заявки"
  if (canCreateRequests.value) {
    return items.map(item => {
      if (item.name === 'purchases') {
        return {
          ...item,
          title: 'Заявки'
        }
      }
      return item
    })
  }
  
  return items
})

// Inventory Management - управление складом и материалами
const inventoryManagement = computed(() => {
  return navigationItems.value.filter(item => 
    ['inventory'].includes(item.category || '')
  )
})

// Analytics & Reports - аналитика и отчеты
const analyticsReports = computed(() => {
  return navigationItems.value.filter(item => 
    ['reports'].includes(item.category || '')
  )
})

// Administration - администрирование системы
const administration = computed(() => {
  return navigationItems.value.filter(item => 
    ['users', 'settings', 'administration'].includes(item.category || '')
  )
})

// Tools - инструменты (только для admin)
const tools = computed(() => {
  return navigationItems.value.filter(item => 
    ['tools'].includes(item.category || '')
  )
})

// Reference Data - справочники
const referenceData = computed(() => {
  return navigationItems.value.filter(item => 
    ['reference_data'].includes(item.category || '')
  )
})

import { getIconPath } from '@/assets/icons'

function isActive(path: string): boolean {
  return route.path.startsWith(path)
}
</script>

<style scoped>
/* Navigation styles inherited from parent layout */
</style>
