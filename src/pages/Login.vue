<template>
  <div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
    <!-- Background decoration -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style="animation-delay: 2s;"></div>
      <div class="absolute top-40 left-40 w-60 h-60 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style="animation-delay: 4s;"></div>
    </div>

    <!-- Main content -->
    <div class="relative min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <!-- Logo/Brand section -->
        <div class="text-center mb-8 animate-fade-in">
          <div class="login-logo inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg animate-float">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h1 class="login-title text-3xl font-bold text-gray-900 mb-2">ELOM</h1>
          <p class="text-gray-600">Система учета материалов</p>
        </div>

        <!-- Login form -->
        <div class="login-card bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 animate-slide-up">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Добро пожаловать</h2>
            <p class="text-gray-600">Войдите в свой аккаунт</p>
          </div>

          <!-- Alerts -->
          <div v-if="sessionExpired" class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-shake">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-amber-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <span class="text-amber-800 text-sm">Сессия истекла. Пожалуйста, войдите снова.</span>
            </div>
          </div>

          <div v-if="auth.error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-shake">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-red-800 text-sm">{{ auth.error }}</span>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="submit" class="login-form space-y-6">
            <!-- Username field -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">Логин</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <input 
                  v-model.trim="username" 
                  type="text"
                  class="login-form-input w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Введите ваш логин"
                  required
                />
              </div>
            </div>

            <!-- Password field -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">Пароль</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <input 
                  v-model="password" 
                  type="password"
                  class="login-form-input w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Введите ваш пароль"
                  required
                />
              </div>
            </div>

            <!-- Submit button -->
            <button 
              type="submit"
              :disabled="auth.loading"
              class="login-form-button w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              <span v-if="auth.loading" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Вход...
              </span>
              <span v-else>Войти</span>
            </button>
          </form>

          <!-- Footer -->
          <div class="mt-8 text-center">
            <p class="text-sm text-gray-500">
              © {{new Date().getFullYear()}}.
              <a href="https://elom.uz" target="_blank" class="text-blue-600 hover:text-blue-700">Energy Life</a>
              <span class="text-gray-500">Все права защищены.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useAuthStore} from '@/stores/auth'
import {useRoute, useRouter} from 'vue-router'
import {useUiStore} from '@/stores/ui'
import { ErrorHandlers } from '@/utils/errorHandler'

const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()
const router = useRouter()

const username = ref('')
const password = ref('')

const sessionExpired = computed(() => route.query.session === 'expired')

onMounted(() => {
  if (auth.isAuthenticated) {
    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  }
})

async function submit() {
  try {
    if (auth.isAuthenticated) {
      const redirect = (route.query.redirect as string) || '/'
      await router.replace(redirect)
      return
    }
    
    const success = await auth.login(username.value, password.value)
    if (success) {
      ui.toast({type: 'success', text: 'Добро пожаловать!'})
      const redirect = (route.query.redirect as string) || '/'
      await router.replace(redirect)
    } else {
      // Ошибка уже установлена в auth.error
      ui.toast({type: 'error', text: auth.error || 'Ошибка входа'})
    }
  } catch (e: any) {
    ErrorHandlers.auth(e)
  }
}
</script>

