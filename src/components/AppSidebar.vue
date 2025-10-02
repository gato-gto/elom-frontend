<template>
  <aside class="bg-white dark:bg-gray-800 shadow-lg h-full flex flex-col">
    <!-- Logo/Brand -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h1 class="text-xl font-bold text-gray-800 dark:text-white">
        ELOM
      </h1>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Система управления
      </p>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto p-4 space-y-2">
      <!-- Main Navigation -->
      <div v-if="mainNavigation.length > 0" class="mb-6">
        <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Основное
        </h3>
        <ul class="space-y-1">
          <li v-for="item in mainNavigation" :key="item.name">
            <router-link
              :to="item.path"
              :class="[
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isRouteActive(item.path)
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              ]"
            >
              <i v-if="item.icon" class="material-icons mr-3 text-lg">
                {{ item.icon }}
              </i>
              <span>{{ item.title }}</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Secondary Navigation -->
      <div v-if="secondaryNavigation.length > 0" class="mb-6">
        <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Дополнительно
        </h3>
        <ul class="space-y-1">
          <li v-for="item in secondaryNavigation" :key="item.name">
            <router-link
              :to="item.path"
              :class="[
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isRouteActive(item.path)
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              ]"
            >
              <i v-if="item.icon" class="material-icons mr-3 text-lg">
                {{ item.icon }}
              </i>
              <span>{{ item.title }}</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Category-based Navigation -->
      <div v-for="category in categories" :key="category.name" class="mb-6">
        <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          {{ category.title }}
        </h3>
        <ul class="space-y-1">
          <li v-for="item in category.items" :key="item.name">
            <router-link
              :to="item.path"
              :class="[
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isRouteActive(item.path)
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              ]"
            >
              <i v-if="item.icon" class="material-icons mr-3 text-lg">
                {{ item.icon }}
              </i>
              <span>{{ item.title }}</span>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <!-- User Info -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span class="text-white text-sm font-medium">
              {{ userInitials }}
            </span>
          </div>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ authStore.me?.first_name }} {{ authStore.me?.last_name }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ roleTitle }}
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppRouter } from '@/composables/useRouter'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/api/types/common'

const { navigation, isRouteActive } = useAppRouter()
const authStore = useAuthStore()

// Filter navigation items
const mainNavigation = computed(() => {
  return navigation.value.filter(item => 
    ['main', 'inventory', 'purchases', 'objects', 'suppliers'].includes(item.category || '')
  )
})

const secondaryNavigation = computed(() => {
  return navigation.value.filter(item => 
    ['users', 'settings', 'archive', 'reports'].includes(item.category || '')
  )
})

// Group remaining items by category
const categories = computed(() => {
  const categoryMap = new Map<string, { name: string; title: string; items: any[] }>()
  
  navigation.value.forEach(item => {
    if (item.category && 
        !['main', 'inventory', 'purchases', 'objects', 'suppliers', 'users', 'settings', 'archive', 'reports'].includes(item.category)) {
      
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, {
          name: item.category,
          title: getCategoryTitle(item.category),
          items: []
        })
      }
      
      categoryMap.get(item.category)!.items.push(item)
    }
  })
  
  return Array.from(categoryMap.values())
})

// User info
const userInitials = computed(() => {
  const firstName = authStore.me?.first_name || ''
  const lastName = authStore.me?.last_name || ''
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
})

const roleTitle = computed(() => {
  const roleTitles: Record<UserRole, string> = {
    admin: 'Администратор',
    director: 'Директор',
    coordinator: 'Координатор',
    site_manager: 'Менеджер объекта',
    brigadier: 'Бригадир',
    buyer: 'Покупатель'
  }
  
  return authStore.role ? roleTitles[authStore.role] : 'Пользователь'
})

function getCategoryTitle(category: string): string {
  const titles: Record<string, string> = {
    'main': 'Основное',
    'inventory': 'Склад',
    'purchases': 'Закупки',
    'objects': 'Объекты',
    'suppliers': 'Поставщики',
    'users': 'Пользователи',
    'settings': 'Настройки',
    'archive': 'Архив',
    'reports': 'Отчеты',
    'import': 'Импорт',
    'other': 'Прочее'
  }
  
  return titles[category] || category
}
</script>

<style scoped>
/* Custom scrollbar for navigation */
nav::-webkit-scrollbar {
  width: 4px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 2px;
}

nav::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* Dark mode scrollbar */
.dark nav::-webkit-scrollbar-thumb {
  background: #4a5568;
}

.dark nav::-webkit-scrollbar-thumb:hover {
  background: #718096;
}
</style>

