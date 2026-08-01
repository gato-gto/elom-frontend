<template>
    <!-- Мобильная навигация - фиксированная внизу -->
    <div class="mobile-nav lg:hidden">
      <!-- Основная панель навигации -->
      <div class="mobile-nav-bar">
        <nav class="mobile-nav-items">
          <!-- Топ-5 основных элементов -->
          <router-link 
            v-for="item in topNavItems" 
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
              <!-- F-870 (владелец): точка-индикатор активного пункта убрана — активность
                   уже видна по .active (цвет иконки/подписи); точка была лишней. -->
            </div>
            <span class="mobile-nav-label">{{ item.title }}</span>
          </router-link>
  
          <!-- Кнопка "Еще" для открытия полноэкранного меню -->
          <button 
            class="mobile-nav-item mobile-nav-more"
            :class="{ 'active': showFullMenu }"
            @click="toggleFullMenu"
          >
            <div class="relative">
              <svg class="mobile-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <!-- F-870: та же точка-индикатор у кнопки «Еще» убрана (согласованно с пунктами). -->
            </div>
            <span class="mobile-nav-label">Еще</span>
          </button>
        </nav>
      </div>
  
      <!-- Полноэкранное меню (drawer) -->
      <Teleport to="body">
        <div 
          v-if="showFullMenu" 
          class="mobile-full-menu-overlay"
          @click="closeFullMenu"
        >
          <div
            ref="fullMenuRef"
            class="mobile-full-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Меню"
            @click.stop
          >
            <!-- Заголовок меню -->
            <div class="mobile-menu-header">
              <h2 class="mobile-menu-title">Меню</h2>
              <button 
                class="mobile-menu-close"
                @click="closeFullMenu"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
  
            <!-- Контент меню с прокруткой -->
            <div class="mobile-menu-content">
              <!-- Business Operations -->
              <div v-if="businessOperations.length > 0" class="mobile-menu-section">
                <h3 class="mobile-menu-section-title">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Операции
                </h3>
                <div class="mobile-menu-items">
                  <router-link 
                    v-for="item in businessOperations" 
                    :key="item.name"
                    :to="item.path" 
                    class="mobile-menu-item"
                    :class="{ 'active': isActive(item.path) }"
                    @click="closeFullMenu"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath(item.icon || '')" />
                    </svg>
                    <span>{{ item.title }}</span>
                  </router-link>
                </div>
              </div>
  
              <!-- Inventory Management -->
              <div v-if="inventoryManagement.length > 0" class="mobile-menu-section">
                <h3 class="mobile-menu-section-title">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Склад
                </h3>
                <div class="mobile-menu-items">
                  <router-link 
                    v-for="item in inventoryManagement" 
                    :key="item.name"
                    :to="item.path" 
                    class="mobile-menu-item"
                    :class="{ 'active': isActive(item.path) }"
                    @click="closeFullMenu"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath(item.icon || '')" />
                    </svg>
                    <span>{{ item.title }}</span>
                  </router-link>
                </div>
              </div>
  
              <!-- Analytics & Reports -->
              <div v-if="analyticsReports.length > 0" class="mobile-menu-section">
                <h3 class="mobile-menu-section-title">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Аналитика
                </h3>
                <div class="mobile-menu-items">
                  <router-link 
                    v-for="item in analyticsReports" 
                    :key="item.name"
                    :to="item.path" 
                    class="mobile-menu-item"
                    :class="{ 'active': isActive(item.path) }"
                    @click="closeFullMenu"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath(item.icon || '')" />
                    </svg>
                    <span>{{ item.title }}</span>
                  </router-link>
                </div>
              </div>
  
              <!-- Tools -->
              <div v-if="tools.length > 0" class="mobile-menu-section">
                <h3 class="mobile-menu-section-title">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath('build')" />
                  </svg>
                  Инструменты
                </h3>
                <div class="mobile-menu-items">
                  <router-link 
                    v-for="item in tools" 
                    :key="item.name"
                    :to="item.path" 
                    class="mobile-menu-item"
                    :class="{ 'active': isActive(item.path) }"
                    @click="closeFullMenu"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath(item.icon || '')" />
                    </svg>
                    <span>{{ item.title }}</span>
                  </router-link>
                </div>
              </div>
  
              <!-- Administration -->
              <div v-if="administration.length > 0" class="mobile-menu-section">
                <h3 class="mobile-menu-section-title">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Администрирование
                </h3>
                <div class="mobile-menu-items">
                  <router-link 
                    v-for="item in administration" 
                    :key="item.name"
                    :to="item.path" 
                    class="mobile-menu-item"
                    :class="{ 'active': isActive(item.path) }"
                    @click="closeFullMenu"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath(item.icon || '')" />
                    </svg>
                    <span>{{ item.title }}</span>
                  </router-link>
                </div>
              </div>
  
              <!-- Reference Data -->
              <div v-if="referenceData.length > 0" class="mobile-menu-section">
                <h3 class="mobile-menu-section-title">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
                  </svg>
                  Справочники
                </h3>
                <div class="mobile-menu-items">
                  <router-link 
                    v-for="item in referenceData" 
                    :key="item.name"
                    :to="item.path" 
                    class="mobile-menu-item"
                    :class="{ 'active': isActive(item.path) }"
                    @click="closeFullMenu"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath(item.icon || '')" />
                    </svg>
                    <span>{{ item.title }}</span>
                  </router-link>
                </div>
              </div>

              <!-- User info and actions -->
              <div class="mobile-menu-user-section">
                <div class="mobile-menu-divider"></div>
                
                <!-- Horizontal layout for theme, user, and logout -->
                <div class="mobile-menu-actions">
                  <!-- Theme toggle -->
                  <button
                    class="mobile-menu-action-btn"
                    @click="toggleTheme"
                    :title="isDark ? 'Светлая тема' : 'Темная тема'"
                    :aria-label="isDark ? 'Светлая тема' : 'Темная тема'"
                  >
                    <svg v-if="isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </button>

                  <!-- User info -->
                  <div class="mobile-menu-user-info">
                    <div class="mobile-menu-user-avatar">
                      {{ userInitials }}
                    </div>
                    <div class="mobile-menu-user-details">
                      <div class="mobile-menu-user-name">{{ auth.me?.username }}</div>
                      <div class="mobile-menu-user-role">{{ roleDisplayName }}</div>
                    </div>
                  </div>

                  <!-- Logout button -->
                  <button 
                    class="mobile-menu-action-btn mobile-menu-logout"
                    @click="handleLogout"
                    title="Выйти"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
  import { lockBodyScroll, unlockBodyScroll } from '@/utils/scrollLock'
  import { useRoute, useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { usePermissionsStore } from '@/stores/permissions'
  import { usePermissions } from '@/composables/usePermissions'
  import { useThemeStore } from '@/stores/theme'
  import { useUiStore } from '@/stores/ui'
  import { getIconPath } from '@/assets/icons'
  import type { NavigationItem } from '@/types/router'
  
  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()
  const permissionsStore = usePermissionsStore()
  const theme = useThemeStore()
  const ui = useUiStore()
  const { canCreateRequests } = usePermissions()
  
  // Загружаем разрешения при монтировании
  onMounted(() => {
    permissionsStore.fetchPermissions()
  })
  
  // Состояние полноэкранного меню
  const showFullMenu = ref(false)
  
  const toggleFullMenu = () => {
    showFullMenu.value = !showFullMenu.value
  }
  
  const closeFullMenu = () => {
    showFullMenu.value = false
  }

  // F-922 (a11y): полноэкранное меню было обычным <div>, а не модалкой — фокус оставался на кнопке
  // «Еще» под оверлеем, Tab перебирал фон, Escape не закрывал, фон прокручивался на iOS. Зеркалим
  // паттерн Modal.vue: focus-trap + Escape + scroll-lock + возврат фокуса на триггер.
  const fullMenuRef = ref<HTMLElement | null>(null)
  let lastActive: HTMLElement | null = null
  let menuScrollLocked = false

  const menuFocusables = (): HTMLElement[] => {
    if (!fullMenuRef.value) { return [] }
    const sel = 'a[href], button:not([disabled]), textarea:not([disabled]), ' +
      'input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    return Array.from(fullMenuRef.value.querySelectorAll<HTMLElement>(sel)).filter((el) => el.offsetParent !== null)
  }

  const onMenuKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeFullMenu()
      return
    }
    if (e.key !== 'Tab') { return }
    const items = menuFocusables()
    if (items.length === 0) { e.preventDefault(); fullMenuRef.value?.focus(); return }
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement as HTMLElement | null
    const inside = !!fullMenuRef.value && !!active && fullMenuRef.value.contains(active)
    if (e.shiftKey && (active === first || !inside)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  watch(showFullMenu, async (isOpen, wasOpen) => {
    if (isOpen) {
      lastActive = document.activeElement as HTMLElement | null
      document.addEventListener('keydown', onMenuKeydown)
      lockBodyScroll()
      menuScrollLocked = true
      await nextTick()
      ;(menuFocusables()[0] || fullMenuRef.value)?.focus()
    } else if (wasOpen !== undefined) {
      document.removeEventListener('keydown', onMenuKeydown)
      if (menuScrollLocked) { unlockBodyScroll(); menuScrollLocked = false }
      lastActive?.focus?.()
      lastActive = null
    }
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onMenuKeydown)
    if (menuScrollLocked) { unlockBodyScroll(); menuScrollLocked = false }
  })

  // Проверка активного маршрута
  const isActive = (path: string): boolean => {
    return route.path.startsWith(path)
  }
  
  // Build navigation from router configuration (та же логика, что и в AutoNavigation)
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
  
  // Топ-5 элементов для основной панели (используем порядок из роутера, как в десктопной версии)
  const topNavItems = computed(() => {
    // Берем первые элементы из каждой категории в порядке приоритета (как в десктопной версии)
    const categoryPriority = ['purchases', 'objects', 'inventory', 'writeoffs', 'reports']
    const topItems: NavigationItem[] = []
    const usedNames = new Set<string>()
    
    // Сначала берем первые элементы из приоритетных категорий
    for (const category of categoryPriority) {
      const categoryItems = navigationItems.value
        .filter(item => item.category === category && !usedNames.has(item.name))
        .sort((a, b) => (a.order || 999) - (b.order || 999))
      
      if (categoryItems.length > 0) {
        const firstItem = categoryItems[0]
        // Для requester изменяем название "Закупки" на "Заявки"
        if (category === 'purchases' && canCreateRequests.value && firstItem.name === 'purchases') {
          topItems.push({
            ...firstItem,
            title: 'Заявки'
          })
        } else {
          topItems.push(firstItem)
        }
        usedNames.add(firstItem.name)
        // F-581: макс 4 основных пункта (+ «Еще» = 5 всего) — стандарт iOS tab-bar (Apple HIG).
        // 6 пунктов на 393px налезали друг на друга («СписанияПоставщики»); лишний уходит в «Еще».
        if (topItems.length >= 4) {break}
      }
    }

    // Если не набрали 4, добавляем остальные по порядку (order)
    if (topItems.length < 4) {
      const remaining = navigationItems.value
        .filter(item => !usedNames.has(item.name))
        .sort((a, b) => {
          if (a.order !== b.order) {
            return (a.order || 999) - (b.order || 999)
          }
          return a.title.localeCompare(b.title)
        })
        .slice(0, 4 - topItems.length)

      topItems.push(...remaining)
    }

    return topItems.slice(0, 4)
  })
  
  // Business Operations
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
  
  // Inventory Management
  const inventoryManagement = computed(() => {
    return navigationItems.value.filter(item => 
      ['inventory'].includes(item.category || '')
    )
  })
  
  // Analytics & Reports
  const analyticsReports = computed(() => {
    return navigationItems.value.filter(item => 
      ['reports'].includes(item.category || '')
    )
  })
  
  // Tools
  const tools = computed(() => {
    return navigationItems.value.filter(item => 
      ['tools'].includes(item.category || '')
    )
  })
  
  // Administration
  const administration = computed(() => {
    return navigationItems.value.filter(item => 
      ['users', 'settings', 'administration'].includes(item.category || '')
    )
  })
  
  // Reference Data
  const referenceData = computed(() => {
    return navigationItems.value.filter(item => 
      ['reference_data'].includes(item.category || '')
    )
  })

  // User info
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

  // Theme state
  const isDark = computed(() => theme.isDark)

  // Toggle theme function
  const toggleTheme = () => {
    theme.toggleTheme()
  }

  // Logout function
  const handleLogout = async () => {
    try {
      closeFullMenu()
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
  
  <style scoped>
  /* Основная панель навигации (фиксированная внизу) */
  .mobile-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 40;
    background: hsl(var(--b1));
    border-top: 1px solid hsl(var(--b3));
    box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .mobile-nav-bar {
    padding: 0.5rem;
  }
  
  .mobile-nav-items {
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
  
  .mobile-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    /* F-581: уже по горизонтали — больше места подписи (чтобы «Материалы» помещалось без «…»). */
    padding: 0.5rem 0.25rem;
    min-height: 44px; /* F-865 (mobile-audit): было 42px (<44 тач-минимум); держится и в @max-width:360 */
    justify-content: center;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    color: hsl(var(--tx-2));
    text-decoration: none;
    min-width: 0;
    flex: 1;
    background: none;
    border: none;
    cursor: pointer;
  }
  
  .mobile-nav-item:hover {
    background: hsl(var(--b2));
    color: hsl(var(--bc));
  }
  
  .mobile-nav-item.active {
    color: hsl(var(--p));
    background: hsl(var(--p) / 0.15);
  }
  
  .mobile-nav-icon {
    width: 1.25rem;
    height: 1.25rem;
    margin-bottom: 0.25rem;
  }
  
  .mobile-nav-label {
    font-size: 0.7rem;
    font-weight: 500;
    text-align: center;
    line-height: 1;
    /* F-581: не даём длинным подписям налезать на соседей — обрезаем в пределах ячейки
       (страховка; при 5 пунктах на 393px обычные подписи помещаются целиком). */
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .mobile-nav-more {
    cursor: pointer;
  }
  
  /* Полноэкранное меню */
  .mobile-full-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 100;
    animation: fadeIn 0.2s ease;
  }
  
  .mobile-full-menu {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: hsl(var(--b1));
    z-index: 101;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s ease;
    /* APPLE-3 (F-514): dvh вместо vh — не прыгает под адресной строкой iOS (фолбэк vh для Safari <15.4). */
    max-height: 100vh;
    max-height: 100dvh;
    /* APPLE-1 (F-514): шапка меню не уходит под часы/чёлку, низ — над home-indicator. */
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    overflow: hidden;
  }
  
  .mobile-menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid hsl(var(--b3));
    flex-shrink: 0;
  }
  
  .mobile-menu-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: hsl(var(--bc));
  }
  
  .mobile-menu-close {
    padding: 0.5rem;
    border-radius: 0.5rem;
    color: hsl(var(--bc));
    background: hsl(var(--b2));
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .mobile-menu-close:hover {
    background: hsl(var(--b3));
  }
  
  .mobile-menu-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    padding-bottom: 5rem; /* Отступ для нижней панели */
  }
  
  .mobile-menu-section {
    margin-bottom: 2rem;
  }
  
  .mobile-menu-section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: hsl(var(--tx-2));
    margin-bottom: 0.75rem;
    padding: 0 0.5rem;
  }
  
  .mobile-menu-items {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .mobile-menu-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    border-radius: 0.5rem;
    color: hsl(var(--bc));
    text-decoration: none;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    flex: 1;
    min-width: calc(50% - 0.25rem);
    justify-content: flex-start;
  }
  
  .mobile-menu-item:hover {
    background: hsl(var(--b2));
  }
  
.mobile-menu-item.active {
  background: hsl(var(--p) / 0.1);
  color: hsl(var(--p));
  font-weight: 500;
}

/* User section */
.mobile-menu-user-section {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid hsl(var(--b3));
}

.mobile-menu-divider {
  height: 1px;
  background: hsl(var(--b3));
  margin: 1rem 0;
}

.mobile-menu-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
}

.mobile-menu-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background: hsl(var(--b2));
  color: hsl(var(--bc));
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

/* F-859 (a11y): на тач-устройствах кнопки темы/выхода поднимаем до тач-минимума 44px —
   кастомный класс не покрывался глобальным @media(pointer:coarse) для .btn. */
@media (pointer: coarse) {
  .mobile-menu-action-btn {
    width: 2.75rem;
    height: 2.75rem;
  }
}

.mobile-menu-action-btn:hover {
  background: hsl(var(--b3));
}

.mobile-menu-user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: hsl(var(--b2));
  flex: 1;
  min-width: 0;
}

.mobile-menu-user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: hsl(var(--p));
  color: hsl(var(--pc));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  flex-shrink: 0;
}

.mobile-menu-user-details {
  flex: 1;
  min-width: 0;
}

.mobile-menu-user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: hsl(var(--bc));
  margin-bottom: 0.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-menu-user-role {
  font-size: 0.75rem;
  color: hsl(var(--tx-2));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-menu-logout {
  color: hsl(var(--er));
}

.mobile-menu-logout:hover {
  background: hsl(var(--er) / 0.1);
  color: hsl(var(--er));
}
  
  /* Анимации */
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
  
  /* Адаптация для разных размеров экранов */
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

    .mobile-menu-item {
      min-width: 100%;
      font-size: 0.8125rem;
    }
  }

  @media (min-width: 480px) {
    .mobile-menu-item {
      min-width: calc(33.333% - 0.334rem);
    }
  }
  </style>
  