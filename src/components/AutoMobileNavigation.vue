<template>
  <!-- Мобильная навигация - всегда видимая внизу экрана -->
  <div class="mobile-nav lg:hidden">
    <!-- Основная навигация -->
    <div class="mobile-nav-container">
      <nav class="mobile-nav-items">
        <!-- Автоматически генерируемые элементы навигации -->
        <router-link 
          v-for="item in topNavigationItems" 
          :key="item.name"
          :to="item.path" 
          class="mobile-nav-item"
          :class="{ 'active': isActive(item.path) }"
        >
          <div class="relative">
            <svg class="mobile-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                :d="getIconPath(item.icon || '')"
              />
            </svg>
            <div 
              v-if="isActive(item.path)" 
              class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
            ></div>
          </div>
          <span class="mobile-nav-label">{{ item.title }}</span>
        </router-link>

        <!-- Кнопка "Еще" если есть дополнительные элементы -->
        <div v-if="hasMoreItems" class="mobile-nav-item" @click="toggleMore">
          <div class="relative">
            <svg class="mobile-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
            <div v-if="showMoreContent" class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
          </div>
          <span class="mobile-nav-label">Еще</span>
        </div>
      </nav>
    </div>

    <!-- Расширенное меню -->
    <div v-if="showMoreContent" class="mobile-more-content open">
      <div class="mobile-more-grid">
        <!-- Все элементы навигации включая невидимые в основной панели -->
        <router-link 
          v-for="item in allNavigationItems" 
          :key="item.name"
          :to="item.path" 
          class="mobile-more-item"
          :class="{ 'active': isActive(item.path) }"
          @click="closeMore"
        >
          <div class="mobile-more-icon-wrapper">
            <svg class="mobile-more-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                :d="getIconPath(item.icon || '')"
              />
            </svg>
          </div>
          <span class="mobile-more-label">{{ item.title }}</span>
        </router-link>
      </div>
      
      <!-- Пользователь и настройки -->
      <div class="mobile-more-user">
        <div class="mobile-user-info">
          <div class="mobile-user-avatar">
            {{ userInitials }}
          </div>
          <div class="mobile-user-details">
            <div class="mobile-user-name">{{ auth.me?.username }}</div>
            <div class="mobile-user-role">{{ roleDisplayName }}</div>
          </div>
        </div>
        
        <div class="mobile-actions">
          <button @click="toggleTheme" class="mobile-action-btn">
            <svg v-if="isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <span>{{ isDark ? 'Светлая' : 'Темная' }}</span>
          </button>
          
          <button @click="logout" class="mobile-action-btn mobile-action-logout">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Выйти</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Overlay для закрытия меню -->
    <div 
      v-if="showMoreContent" 
      class="mobile-nav-overlay" 
      @click="closeMore"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import type { NavigationItem } from '@/types/router'
import type { UserRole } from '@/api/types/common'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const theme = useThemeStore()

const showMoreContent = ref(false)

// Icon paths mapping
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
  if (!userRole || !requiredRoles.length) {return true}
  return requiredRoles.includes(userRole)
}

function isActive(path: string): boolean {
  return route.path.startsWith(path)
}

// Build navigation from router configuration
const allNavigationItems = computed((): NavigationItem[] => {
  const routes = router.getRoutes()
  const items: NavigationItem[] = []
  
  routes.forEach(route => {
    const meta = route.meta
    
    // Skip routes without icon (not main nav items)
    if (!meta?.icon) {return}
    
    // Skip public routes
    if (meta.public) {return}
    
    // Check role access
    if (meta.roles && !hasRoleAccess(auth.role, meta.roles as UserRole[])) {return}
    
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

// Show only top 4 items in bottom navigation
const topNavigationItems = computed(() => {
  return allNavigationItems.value.slice(0, 4)
})

const hasMoreItems = computed(() => {
  return allNavigationItems.value.length > 4
})

// User info
const userInitials = computed(() => {
  const user = auth.me
  if (user?.first_name && user?.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`
  }
  return user?.username?.slice(0, 2).toUpperCase() || 'US'
})

const roleDisplayName = computed(() => {
  const roleNames: Record<string, string> = {
    admin: 'Администратор',
    director: 'Директор',
    coordinator: 'Координатор',
    brigadier: 'Бригадир',
    buyer: 'Покупатель',
    site_manager: 'Управляющий'
  }
  return roleNames[auth.role || ''] || 'Пользователь'
})

const isDark = computed(() => theme.isDark)

function toggleMore() {
  showMoreContent.value = !showMoreContent.value
}

function closeMore() {
  showMoreContent.value = false
}

function toggleTheme() {
  theme.toggleTheme()
}

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
/* Мобильная навигация - фиксированная внизу */
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: hsl(var(--b1));
  border-top: 1px solid hsl(var(--b3));
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
}

.mobile-nav-container {
  padding: 0.5rem;
}

.mobile-nav-items {
  display: flex;
  justify-content: space-around;
  align-items: center;
  max-width: 100%;
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  color: hsl(var(--bc) / 0.6);
  text-decoration: none;
  min-width: 0;
  flex: 1;
  cursor: pointer;
}

.mobile-nav-item:hover {
  background: hsl(var(--b2));
  color: hsl(var(--bc));
}

.mobile-nav-item.active {
  color: hsl(var(--p));
  background: hsl(var(--p) / 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px hsl(var(--p) / 0.3);
}

.mobile-nav-icon {
  width: 1.25rem;
  height: 1.25rem;
  margin-bottom: 0.25rem;
}

.mobile-nav-label {
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
  line-height: 1;
}

/* Расширенное меню */
.mobile-more-content {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: hsl(var(--b1));
  border-top: 1px solid hsl(var(--b3));
  border-radius: 1rem 1rem 0 0;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  max-height: 70vh;
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  z-index: 10;
}

.mobile-more-content.open {
  transform: translateY(0);
  opacity: 1;
  visibility: visible;
  overflow-y: auto;
}

.mobile-more-grid {
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}

.mobile-more-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  color: hsl(var(--bc));
  text-decoration: none;
  transition: all 0.2s ease;
  text-align: center;
}

.mobile-more-item:hover {
  background: hsl(var(--b2));
}

.mobile-more-item.active {
  color: hsl(var(--p));
  background: hsl(var(--p) / 0.1);
}

.mobile-more-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: hsl(var(--b2));
}

.mobile-more-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.mobile-more-label {
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
}

/* Пользовательская секция */
.mobile-more-user {
  padding: 1rem;
  border-top: 1px solid hsl(var(--b3));
  background: hsl(var(--b2) / 0.5);
}

.mobile-user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.mobile-user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: hsl(var(--p));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.mobile-user-details {
  flex: 1;
}

.mobile-user-name {
  font-weight: 600;
  color: hsl(var(--bc));
  font-size: 0.875rem;
}

.mobile-user-role {
  font-size: 0.75rem;
  color: hsl(var(--bc) / 0.6);
}

.mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mobile-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: hsl(var(--b1));
  border: 1px solid hsl(var(--b3));
  color: hsl(var(--bc));
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  font-size: 0.875rem;
}

.mobile-action-btn:hover {
  background: hsl(var(--b2));
}

.mobile-action-logout {
  color: hsl(var(--er));
  border-color: hsl(var(--er) / 0.3);
}

.mobile-action-logout:hover {
  background: hsl(var(--er) / 0.1);
}

/* Overlay */
.mobile-nav-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 5;
}

/* Анимации */
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.mobile-more-content.open {
  animation: slideUp 0.3s ease;
}

/* Адаптация для очень маленьких экранов */
@media (max-width: 360px) {
  .mobile-nav-label {
    font-size: 0.625rem;
  }
  
  .mobile-nav-icon {
    width: 1rem;
    height: 1rem;
  }
  
  .mobile-nav-item {
    padding: 0.375rem;
  }
  
  .mobile-more-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
  
  .mobile-more-item {
    padding: 0.5rem;
  }
  
  .mobile-more-label {
    font-size: 0.7rem;
  }
}
</style>
