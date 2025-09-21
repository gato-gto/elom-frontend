<!-- src/App.vue -->
<template>
  <TopbarProgress/>
  <ToastCenter/>
  <BrowserWarning/>
  <AppLayout v-if="showLayout" />
  <router-view v-else />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import TopbarProgress from '@/components/TopbarProgress.vue'
import ToastCenter from '@/components/ToastCenter.vue'
import BrowserWarning from '@/components/BrowserWarning.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

// Show layout for all routes except login
const showLayout = computed(() => {
  return route.name !== 'Login'
})

onMounted(async () => {
  // Инициализируем авторизацию при загрузке приложения
  try {
    await auth.tryHydrate()
  } catch (e: any) {
    // Ошибки авторизации обрабатываются в auth store
    // console.warn('Auth initialization failed:', e) // Удалено для продакшена
  }
})
</script>

