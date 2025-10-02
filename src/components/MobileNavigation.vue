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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
            <div v-if="$route.path.startsWith('/purchases')" class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
          </div>
          <span class="mobile-nav-label">Закупки</span>
        </router-link>

        <!-- Objects -->
        <router-link 
          to="/objects" 
          class="mobile-nav-item"
          :class="{ 'active': $route.path.startsWith('/objects') }"
        >
          <div class="relative">
            <svg class="mobile-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div v-if="$route.path.startsWith('/objects')" class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
          </div>
          <span class="mobile-nav-label">Объекты</span>
        </router-link>

        <!-- Suppliers -->
        <router-link 
          to="/suppliers" 
          class="mobile-nav-item"
          :class="{ 'active': $route.path.startsWith('/suppliers') }"
        >
          <div class="relative">
            <svg class="mobile-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div v-if="$route.path.startsWith('/suppliers')" class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
          </div>
          <span class="mobile-nav-label">Поставщики</span>
        </router-link>

        <!-- More menu -->
        <div class="mobile-nav-item mobile-nav-more" @click="toggleMoreMenu">
          <div class="relative">
            <svg class="mobile-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
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
        <!-- Stocks -->
        <router-link 
          to="/stocks" 
          class="mobile-more-item"
          :class="{ 'active': $route.path.startsWith('/stocks') }"
          @click="closeMoreMenu"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>Остатки</span>
        </router-link>

        <!-- WriteOffs -->
        <router-link 
          to="/writeoffs" 
          class="mobile-more-item"
          :class="{ 'active': $route.path.startsWith('/writeoffs') }"
          @click="closeMoreMenu"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Списания</span>
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

        <!-- Admin section -->
        <template v-if="canManageUsers">
          <div class="mobile-more-divider"></div>
          
          <!-- Units -->
          <router-link 
            to="/units" 
            class="mobile-more-item"
            :class="{ 'active': $route.path.startsWith('/units') }"
            @click="closeMoreMenu"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2" />
            </svg>
            <span>Единицы</span>
          </router-link>

          <!-- Employees -->
          <router-link 
            to="/employees" 
            class="mobile-more-item"
            :class="{ 'active': $route.path.startsWith('/employees') }"
            @click="closeMoreMenu"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span>Сотрудники</span>
          </router-link>
        </template>
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
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// Состояние меню
const showMoreMenu = ref(false)
const showReportsMenu = ref(false)

// Проверка прав администратора
const canManageUsers = computed(() => {
  const role = auth.role
  return role === 'admin' || role === 'director'
})

// Управление меню
const toggleMoreMenu = () => {
  showMoreMenu.value = !showMoreMenu.value
  if (!showMoreMenu.value) {
    showReportsMenu.value = false
  }
}

const closeMoreMenu = () => {
  showMoreMenu.value = false
  showReportsMenu.value = false
}

const toggleReportsMenu = () => {
  showReportsMenu.value = !showReportsMenu.value
}
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
