<template>
  <div class="drawer" :class="{ 'lg:drawer-open': !sidebarCollapsed }">
    <input id="drawer-toggle" type="checkbox" class="drawer-toggle" />

    <!-- Main content -->
    <div class="drawer-content flex flex-col">

      <!-- F-565: показать свёрнутое меню (только desktop; на мобиле — нижняя навигация) -->
      <button
        v-if="sidebarCollapsed"
        @click="sidebarCollapsed = false"
        title="Показать меню"
        aria-label="Показать меню"
        class="hidden lg:flex btn btn-sm btn-circle btn-primary shadow-lg fixed top-3 left-3 z-40"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- Page content. APPLE-1 (F-514): отступы учитывают safe-area. Мобильные правила и
           lg:p-4 живут в непересекающихся брейкпоинтах (max-width:1023 vs min-width:1024),
           поэтому не конфликтуют по специфичности. -->
      <main class="app-main flex-1 bg-base-200 lg:p-4" :class="{ 'lg:pl-16': sidebarCollapsed }">
        <router-view />
      </main>
    </div>
    
    <!-- Sidebar -->
    <div class="drawer-side">
      <label for="drawer-toggle" aria-label="close sidebar" class="drawer-overlay"></label>
      <aside class="sidebar min-h-full w-64">
        <!-- Logo/Brand -->
        <div class="sidebar-header h-16 flex items-center justify-between p-4">
          <div class="flex items-center gap-2">
            <div>
              <h2 class="sidebar-logo text-lg font-bold">ELOM</h2>
              <p class="sidebar-subtitle text-xs">Energy Life</p>
            </div>
          </div>
          <!-- F-565: свернуть меню (только desktop) -->
          <button
            class="hidden lg:flex items-center justify-center text-white/70 hover:text-white p-1 rounded transition-colors"
            @click="sidebarCollapsed = true"
            title="Свернуть меню"
            aria-label="Свернуть меню"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
        
        <!-- Auto-generated navigation menu -->
        <AutoNavigation />
        
        <!-- User menu and theme toggle at bottom -->
        <div class="mt-auto p-3 border-t border-white/10">
          <!-- Theme toggle -->
          <div class="mb-2">
            <button @click="toggleTheme" class="nav-link w-full justify-start" title="Переключить тему">
              <div class="nav-icon-wrapper">
                <svg v-if="isDark" class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <svg v-else class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
              {{ isDark ? 'Светлая тема' : 'Темная тема' }}
            </button>
          </div>
          
          <!-- User menu -->
          <div class="dropdown dropdown-top w-full">
            <div tabindex="0" role="button" class="nav-link w-full justify-start">
              <div class="nav-icon-wrapper">
                <div class="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">
                  {{ userInitials }}
                </div>
              </div>
              <div class="flex-1 text-left">
                <div class="text-sm font-semibold">{{ auth.me?.username }}</div>
                <div class="text-xs opacity-60">{{ roleDisplayName }}</div>
              </div>
              <svg class="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <ul tabindex="0" class="menu menu-sm dropdown-content mb-2 z-[1] p-2 shadow-2xl rounded-xl w-full border border-base-300/50">
              <li>
                <div class="text-sm px-3 py-2 bg-primary/5 rounded-lg">
                  <div class="font-semibold text-base-content">{{ auth.me?.username }}</div>
                  <div class="text-xs text-muted">{{ roleDisplayName }}</div>
                </div>
              </li>
              <li><div class="divider my-2"></div></li>
              <li>
                <a @click="logout" class="text-error hover:bg-error/10 hover:text-error transition-all duration-200 rounded-lg">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Выйти
                </a>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
    
    <!-- Мобильная навигация -->
    <AutoMobileNavigation />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermissionsStore } from '@/stores/permissions'
import { usePermissions } from '@/composables/usePermissions'
import { useUiStore } from '@/stores/ui'
import { useThemeStore } from '@/stores/theme'
import AutoNavigation from '@/components/AutoNavigation.vue'
import AutoMobileNavigation from '@/components/AutoMobileNavigation.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// F-565: сворачиваемое боковое меню на DESKTOP. Мотив — узкие desktop-экраны (< Full HD):
// свёрнутое меню отдаёт всю ширину контенту. Состояние персистентно. На мобиле не влияет
// (там своя нижняя навигация; lg:drawer-open работает только с ≥1024px).
const sidebarCollapsed = ref(localStorage.getItem('elom_sidebar_collapsed') === '1')
watch(sidebarCollapsed, (v) => localStorage.setItem('elom_sidebar_collapsed', v ? '1' : '0'))
const ui = useUiStore()
const permissionsStore = usePermissionsStore()

// Computed properties
const pageTitle = computed(() => {
  return (route.meta.title as string) || 'ELOM'
})
const theme = useThemeStore()

// Current page title
const currentPageTitle = computed(() => {
  return (route.meta.title as string) || 'ELOM'
})

// User initials for avatar
const userInitials = computed(() => {
  const user = auth.me
  if (!user) { return '?' }
  
  const first = user.first_name?.[0] || user.username[0]
  const last = user.last_name?.[0] || ''
  return (first + last).toUpperCase()
})

// Role display name - ✅ RBAC: используем permissionsStore
const roleDisplayName = computed(() => {
  if (permissionsStore.roles.length > 0) {
    return permissionsStore.roles.map(r => r.display_name).join(', ')
  }
  return 'Роль не задана'
})

// ✅ RBAC: проверка через permissions
const { can } = usePermissions()
const canManageUsers = computed(() => can('employees', 'edit'))

// Theme state
const isDark = computed(() => theme.isDark)

// Toggle theme function
const toggleTheme = () => {
  theme.toggleTheme()
}

// Logout function
const logout = async () => {
  try {
    auth.logout()
    ui.toast({ type: 'success', text: 'Вы вышли из системы' })
    await router.push('/login')
  } catch (error) {
    // eslint-disable-next-line no-console
    if (typeof console !== 'undefined' && console.error) { console.error('Logout error:', error) }
    ui.toast({ type: 'error', text: 'Ошибка при выходе' })
  }
}
</script>