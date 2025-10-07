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
      <!-- Business Operations -->
      <div v-if="businessOperations.length > 0" class="mb-6">
        <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center">
          <i class="material-icons mr-2 text-sm">business</i>
          Операции
        </h3>
        <ul class="space-y-1">
          <li v-for="item in businessOperations" :key="item.name">
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

      <!-- Inventory Management -->
      <div v-if="inventoryManagement.length > 0" class="mb-6">
        <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center">
          <i class="material-icons mr-2 text-sm">inventory</i>
          Склад
        </h3>
        <ul class="space-y-1">
          <li v-for="item in inventoryManagement" :key="item.name">
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

      <!-- Analytics & Reports -->
      <div v-if="analyticsReports.length > 0" class="mb-6">
        <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center">
          <i class="material-icons mr-2 text-sm">analytics</i>
          Аналитика
        </h3>
        <ul class="space-y-1">
          <li v-for="item in analyticsReports" :key="item.name">
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

      <!-- Administration -->
      <div v-if="administration.length > 0" class="mb-6">
        <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center">
          <i class="material-icons mr-2 text-sm">admin_panel_settings</i>
          Администрирование
        </h3>
        <ul class="space-y-1">
          <li v-for="item in administration" :key="item.name">
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

      <!-- Archive -->
      <div v-if="archive.length > 0" class="mb-6">
        <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center">
          <i class="material-icons mr-2 text-sm">archive</i>
          Архив
        </h3>
        <ul class="space-y-1">
          <li v-for="item in archive" :key="item.name">
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

      <!-- Reference Data -->
      <div v-if="referenceData.length > 0" class="mb-6">
        <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center">
          <i class="material-icons mr-2 text-sm">menu_book</i>
          Справочники
        </h3>
        <ul class="space-y-1">
          <li v-for="item in referenceData" :key="item.name">
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

// Business Operations - основные бизнес-операции
const businessOperations = computed(() => {
  return navigation.value.filter(item => 
    ['purchases', 'objects', 'writeoffs'].includes(item.category || '')
  )
})

// Inventory Management - управление складом и материалами
const inventoryManagement = computed(() => {
  return navigation.value.filter(item => 
    ['inventory'].includes(item.category || '')
  )
})

// Analytics & Reports - аналитика и отчеты
const analyticsReports = computed(() => {
  return navigation.value.filter(item => 
    ['reports'].includes(item.category || '')
  )
})

// Administration - администрирование системы
const administration = computed(() => {
  return navigation.value.filter(item => 
    ['users', 'settings'].includes(item.category || '')
  )
})

// Archive - архивные данные
const archive = computed(() => {
  return navigation.value.filter(item => 
    ['archive'].includes(item.category || '')
  )
})

// Reference Data - справочники
const referenceData = computed(() => {
  return navigation.value.filter(item => 
    ['reference_data'].includes(item.category || '')
  )
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
  
  return authStore.role ? roleTitles[authStore.role as UserRole] : 'Пользователь'
})

// Функция больше не нужна, так как используем фиксированные разделы
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

