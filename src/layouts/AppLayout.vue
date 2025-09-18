<template>
  <div class="drawer lg:drawer-open">
    <input id="drawer-toggle" type="checkbox" class="drawer-toggle" />
    
    <!-- Main content -->
    <div class="drawer-content flex flex-col">
      <!-- Top navigation bar -->
      <div class="topbar navbar">
        <div class="flex-none lg:hidden">
          <label for="drawer-toggle" class="mobile-menu-btn btn btn-square btn-ghost icon-btn">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
        </div>
        
        <div class="flex-1">
          <h1 class="topbar-title text-lg font-semibold animate-fade-in-up">{{ currentPageTitle }}</h1>
        </div>
        
        <div class="flex-none topbar-actions">
          <!-- Notifications -->
          <Notifications />
          
          <!-- Theme toggle -->
          <ThemeToggle />
          
          <!-- User menu -->
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="user-avatar btn btn-ghost btn-circle avatar">
              <div class="w-8 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium">
                  {{ userInitials }}
                </span>
              </div>
            </div>
            <ul tabindex="0" class="dropdown-menu menu menu-sm dropdown-content mt-3 z-[1] p-2 w-52">
              <li>
                <div class="dropdown-item text-sm opacity-70">
                  <div class="font-medium">{{ auth.me?.username }}</div>
                  <div class="text-xs">{{ roleDisplayName }}</div>
                </div>
              </li>
              <li><hr class="my-1" /></li>
              <li>
                <a @click="logout" class="dropdown-item text-error btn-nav">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Выйти
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- Page content -->
      <main class="flex-1 p-4 bg-gray-50">
        <router-view />
      </main>
    </div>
    
    <!-- Sidebar -->
    <div class="drawer-side">
      <label for="drawer-toggle" aria-label="close sidebar" class="drawer-overlay"></label>
      <aside class="sidebar min-h-full w-64">
        <!-- Logo/Brand -->
        <div class="sidebar-header p-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <div>
              <h2 class="sidebar-logo text-xl font-bold">ELOM</h2>
              <p class="sidebar-subtitle text-sm">Energy Life</p>
            </div>
          </div>
        </div>
        
        <!-- Navigation menu -->
        <nav class="p-4 w-full animate-slide-in-left">
          <ul class="space-y-1">
            <!-- Dashboard -->
            <li class="nav-item" :class="{ 'active': $route.name === 'Dashboard' }">
              <router-link to="/" class="nav-link">
                <div class="nav-icon-wrapper">
                  <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                  </svg>
                </div>
                Панель управления
              </router-link>
            </li>
            
            <!-- Materials -->
            <li class="nav-item" :class="{ 'active': $route.path.startsWith('/materials') }">
              <router-link to="/materials" class="nav-link">
                <div class="nav-icon-wrapper">
                  <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                Материалы
              </router-link>
            </li>
            
            <!-- Purchases -->
            <li class="nav-item" :class="{ 'active': $route.path.startsWith('/purchases') }">
              <router-link to="/purchases" class="nav-link">
                <div class="nav-icon-wrapper">
                  <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                </div>
                Закупки
              </router-link>
            </li>
            
            <!-- Objects -->
            <li class="nav-item" :class="{ 'active': $route.path.startsWith('/objects') }">
              <router-link to="/objects" class="nav-link">
                <div class="nav-icon-wrapper">
                  <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                Объекты
              </router-link>
            </li>
            
            <!-- Stocks -->
            <li class="nav-item" :class="{ 'active': $route.path.startsWith('/stocks') }">
              <router-link to="/stocks" class="nav-link">
                <div class="nav-icon-wrapper">
                  <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                Остатки
              </router-link>
            </li>
            
            <!-- Archive -->
            <li class="nav-item" :class="{ 'active': $route.path.startsWith('/archive') }">
              <router-link to="/archive" class="nav-link">
                <div class="nav-icon-wrapper">
                  <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293h11.172a1 1 0 00.707-.293l1.414-1.414a1 1 0 01.707-.293H19a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                Архив
              </router-link>
            </li>
            
            <!-- Reports -->
            <li>
              <details :open="$route.path.startsWith('/reports')">
                <summary class="nav-link">
                  <div class="nav-icon-wrapper">
                    <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  Отчеты
                </summary>
                <ul class="ml-4">
                  <li class="nav-item">
                    <router-link to="/reports" class="nav-link text-sm">Обзор</router-link>
                  </li>
                  <li class="nav-item">
                    <router-link to="/reports/by-period" class="nav-link text-sm">По периодам</router-link>
                  </li>
                  <li class="nav-item">
                    <router-link to="/reports/by-object" class="nav-link text-sm">По объектам</router-link>
                  </li>
                  <li class="nav-item">
                    <router-link to="/reports/by-material" class="nav-link text-sm">По материалам</router-link>
                  </li>
                  <li class="nav-item">
                    <router-link to="/reports/by-responsible" class="nav-link text-sm">По ответственным</router-link>
                   </li>
                </ul>
              </details>
            </li>
            
            <!-- Import -->
            <li class="nav-item" :class="{ 'active': $route.path.startsWith('/import') }">
              <router-link to="/import" class="nav-link">
                <div class="nav-icon-wrapper">
                  <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
                Импорт
              </router-link>
            </li>
            
            <!-- Admin section (only for admin/director) -->
            <template v-if="canManageUsers">
              <li><hr class="admin-divider" /></li>
              <li class="admin-title">
                <span>Администрирование</span>
              </li>
              
              <!-- Units -->
              <li class="nav-item" :class="{ 'active': $route.path.startsWith('/units') }">
                <router-link to="/units" class="nav-link">
                  <div class="nav-icon-wrapper">
                    <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2" />
                    </svg>
                  </div>
                  Единицы измерения
                </router-link>
              </li>
              
              <!-- Unit Conversions -->
              <li class="nav-item" :class="{ 'active': $route.path.startsWith('/admin/unit-conversions') }">
                <router-link to="/admin/unit-conversions" class="nav-link">
                  <div class="nav-icon-wrapper">
                    <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8l-4 4 4 4M17 8l4 4-4 4M3 12h18" />
                    </svg>
                  </div>
                  Конвертации единиц
                </router-link>
              </li>
              
              <!-- Employees -->
              <li class="nav-item" :class="{ 'active': $route.path.startsWith('/employees') }">
                <router-link to="/employees" class="nav-link">
                <div class="nav-icon-wrapper">
                  <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
                  </svg>
                </div>
                Сотрудники
                </router-link>
              </li>
            </template>
          </ul>
        </nav>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import ThemeToggle from '@/components/ThemeToggle.vue'
import Notifications from '@/components/Notifications.vue'
import type { UserRole } from '@/api/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

// Current page title
const currentPageTitle = computed(() => {
  return (route.meta.title as string) || 'ELOM'
})

// User initials for avatar
const userInitials = computed(() => {
  const user = auth.me
  if (!user) return '?'
  
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
    site_manager: 'Бригадир',
    buyer: 'Закупщик'
  }
  return roleNames[auth.role as UserRole] || auth.role || 'Пользователь'
})

// Check if user can manage users (admin/director)
const canManageUsers = computed(() => {
  const role = auth.role
  return role === 'admin' || role === 'director'
})

// Logout function
const logout = async () => {
  try {
    auth.logout()
    ui.toast({ type: 'success', text: 'Вы вышли из системы' })
    await router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
    ui.toast({ type: 'error', text: 'Ошибка при выходе' })
  }
}
</script>