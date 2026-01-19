<template>
  <!-- Мобильная навигация - всегда видимая внизу экрана -->
  <div class="mobile-nav lg:hidden">
    <!-- Основная навигация -->
    <div class="mobile-nav-container">
      <nav class="mobile-nav-items">

        <!-- Materials -->
        <router-link 
          to="/materials" 
          class="mobile-nav-item"
          :class="{ 'active': $route.path.startsWith('/materials') }"
        >
          <div class="relative">
            <svg class="mobile-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath('inventory')" />
            </svg>
            <div v-if="$route.path.startsWith('/materials')" class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
          </div>
          <span class="mobile-nav-label">Материалы</span>
        </router-link>

        <!-- Purchases -->
        <router-link 
          to="/purchases" 
          class="mobile-nav-item"
          :class="{ 'active': $route.path.startsWith('/purchases') }"
        >
          <div class="relative">
            <svg class="mobile-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath('shopping_cart')" />
            </svg>
            <div v-if="$route.path.startsWith('/purchases')" class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
          </div>
          <span class="mobile-nav-label">{{ isRequester ? 'Заявки' : 'Закупки' }}</span>
        </router-link>

        <!-- Objects -->
        <router-link 
          to="/objects" 
          class="mobile-nav-item"
          :class="{ 'active': $route.path.startsWith('/objects') }"
        >
          <div class="relative">
            <svg class="mobile-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath('location_on')" />
            </svg>
            <div v-if="$route.path.startsWith('/objects')" class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
          </div>
          <span class="mobile-nav-label">Объекты</span>
        </router-link>

        <!-- WriteOffs -->
        <router-link 
          to="/writeoffs" 
          class="mobile-nav-item"
          :class="{ 'active': $route.path.startsWith('/writeoffs') }"
        >
          <div class="relative">
            <svg class="mobile-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath('minus-circle')" />
            </svg>
            <div v-if="$route.path.startsWith('/writeoffs')" class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
          </div>
          <span class="mobile-nav-label">Списания</span>
        </router-link>

        <!-- Stocks Balances -->
        <router-link 
          to="/balances" 
          class="mobile-nav-item"
          :class="{ 'active': $route.path.startsWith('/balances') }"
        >
          <div class="relative">
            <svg class="mobile-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath('inventory_2')" />
            </svg>
            <div v-if="$route.path.startsWith('/balances')" class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
          </div>
          <span>Остатки</span>
        </router-link>

        <!-- More menu -->
        <div class="mobile-nav-item mobile-nav-more" @click="toggleMoreMenu">
          <div class="relative">
            <svg class="mobile-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath('dots-vertical')" />
            </svg>
            <!-- Индикатор активного меню -->
            <div v-if="showMoreMenu" class="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
          </div>
          <span class="mobile-nav-label">Еще</span>
        </div>
      </nav>
    </div>

    <!-- Дополнительное меню (выдвигается вверх) -->
    <div class="mobile-more-menu" :class="{ 'open': showMoreMenu }">
      <div class="mobile-more-content">

        <!-- Stock Movements -->
        <router-link 
          to="/stocks" 
          class="mobile-more-item"
          :class="{ 'active': $route.path.startsWith('/stocks') }"
          @click="closeMoreMenu"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span>Движения</span>
        </router-link>


        <!-- Archive -->
        <router-link 
          to="/archive" 
          class="mobile-more-item"
          :class="{ 'active': $route.path.startsWith('/archive') }"
          @click="closeMoreMenu"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293h11.172a1 1 0 00.707-.293l1.414-1.414a1 1 0 01.707-.293H19a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <span>Архив</span>
        </router-link>

        <!-- Reference Data Section -->
        <div class="mobile-more-divider"></div>
        <div class="mobile-more-item mobile-more-submenu" @click="toggleReferenceDataMenu">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
          </svg>
          <span>Справочники</span>
          <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': showReferenceDataMenu }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <!-- Reference Data submenu -->
        <div v-if="showReferenceDataMenu" class="mobile-reports-submenu">
          <router-link 
            v-for="item in referenceData" 
            :key="item.name"
            :to="item.path" 
            class="mobile-submenu-item" 
            @click="closeMoreMenu"
          >
            {{ item.title }}
          </router-link>
        </div>

        <!-- Reports -->
        <div class="mobile-more-item mobile-more-submenu" @click="toggleReportsMenu">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Отчеты</span>
          <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': showReportsMenu }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <!-- Reports submenu -->
        <div v-if="showReportsMenu" class="mobile-reports-submenu">
          <router-link to="/reports/by-period" class="mobile-submenu-item" @click="closeMoreMenu">
            По периодам
          </router-link>
          <router-link to="/reports/by-object" class="mobile-submenu-item" @click="closeMoreMenu">
            По объектам
          </router-link>
          <router-link to="/reports/by-material" class="mobile-submenu-item" @click="closeMoreMenu">
            По материалам
          </router-link>
          <router-link to="/reports/by-responsible" class="mobile-submenu-item" @click="closeMoreMenu">
            По ответственным
          </router-link>
        </div>

      </div>
    </div>

    <!-- Overlay для закрытия меню -->
    <div 
      v-if="showMoreMenu" 
      class="mobile-nav-overlay" 
      @click="closeMoreMenu"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermissionsStore } from '@/stores/permissions'
import { usePermissions } from '@/composables/usePermissions'
import { getIconPath } from '@/assets/icons'
import type { NavigationItem } from '@/types/router'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const permissionsStore = usePermissionsStore()

// ✅ RBAC: используем permissions
const { canCreateRequests, can } = usePermissions()
const isRequester = computed(() => canCreateRequests.value)

// Состояние меню
const showMoreMenu = ref(false)
const showReportsMenu = ref(false)
const showReferenceDataMenu = ref(false)

// ✅ RBAC: проверка через permissions
const canManageUsers = computed(() => can('employees', 'edit'))

// Управление меню
const toggleMoreMenu = () => {
  showMoreMenu.value = !showMoreMenu.value
  if (!showMoreMenu.value) {
    showReportsMenu.value = false
    showReferenceDataMenu.value = false
  }
}

const closeMoreMenu = () => {
  showMoreMenu.value = false
  showReportsMenu.value = false
  showReferenceDataMenu.value = false
}

const toggleReportsMenu = () => {
  showReportsMenu.value = !showReportsMenu.value
  if (showReportsMenu.value) {
    showReferenceDataMenu.value = false
  }
}

const toggleReferenceDataMenu = () => {
  showReferenceDataMenu.value = !showReferenceDataMenu.value
  if (showReferenceDataMenu.value) {
    showReportsMenu.value = false
  }
}

// Build navigation from router configuration (синхронизация с desktop)
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

// Reference Data - справочники (синхронизация с desktop)
const referenceData = computed(() => {
  return navigationItems.value.filter(item => 
    ['reference_data'].includes(item.category || '')
  )
})

</script>

<style scoped>
/* Мобильная навигация - фиксированная внизу */
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
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

.mobile-nav-more {
  cursor: pointer;
}

/* Дополнительное меню */
.mobile-more-menu {
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
}

.mobile-more-menu.open {
  transform: translateY(0);
  opacity: 1;
  visibility: visible;
  overflow-y: auto;
}

.mobile-more-content {
  padding: 1rem;
}

.mobile-more-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  color: hsl(var(--bc));
  text-decoration: none;
  transition: all 0.2s ease;
  margin-bottom: 0.25rem;
}

.mobile-more-item:hover {
  background: hsl(var(--b2));
}

.mobile-more-item.active {
  color: hsl(var(--p));
  background: hsl(var(--p) / 0.1);
}

.mobile-more-submenu {
  justify-content: space-between;
}

.mobile-more-divider {
  height: 1px;
  background: hsl(var(--b3));
  margin: 0.5rem 0;
}

/* Подменю отчетов */
.mobile-reports-submenu {
  margin-left: 2rem;
  margin-top: 0.5rem;
}

.mobile-submenu-item {
  display: block;
  padding: 0.5rem 0.75rem;
  color: hsl(var(--bc) / 0.7);
  text-decoration: none;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.mobile-submenu-item:hover {
  background: hsl(var(--b2));
  color: hsl(var(--bc));
}

/* Overlay */
.mobile-nav-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: -1;
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

.mobile-more-menu.open {
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
}
</style>
