<template>
  <div class="drawer lg:drawer-open">
    <input id="drawer-toggle" type="checkbox" class="drawer-toggle" />
    
    <!-- Main content -->
    <div class="drawer-content flex flex-col">
      
      
      <!-- Page content -->
      <main class="flex-1 p-1 sm:p-4 bg-gray-50 pb-20 lg:pb-4">
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
            <ul tabindex="0" class="menu menu-sm dropdown-content mb-2 z-[1] p-2 shadow-2xl bg-base-100 rounded-xl w-full border border-base-300/50">
              <li>
                <div class="text-sm px-3 py-2 bg-primary/5 rounded-lg">
                  <div class="font-semibold text-base-content">{{ auth.me?.username }}</div>
                  <div class="text-xs text-base-content/60">{{ roleDisplayName }}</div>
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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useThemeStore } from '@/stores/theme'
import type { UserRole } from '@/api/types/common'
import AutoNavigation from '@/components/AutoNavigation.vue'
import AutoMobileNavigation from '@/components/AutoMobileNavigation.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

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

// Role display name
const roleDisplayName = computed(() => {
  const roleNames: Record<UserRole, string> = {
    admin: 'Администратор',
    director: 'Директор',
    coordinator: 'Координатор',
    site_manager: 'Менеджер объекта',
    buyer: 'Закупщик',
    brigadier: 'Бригадир'
  }
  return roleNames[auth.role as UserRole] || auth.role || 'Пользователь'
})

// Check if user can manage users (admin/director)
const canManageUsers = computed(() => {
  const role = auth.role
  return role === 'admin' || role === 'director'
})

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