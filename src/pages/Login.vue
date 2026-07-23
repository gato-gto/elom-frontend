<template>
  <div class="login-bg min-h-screen relative">
    <!-- Main content -->
    <div class="relative min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <!-- Brand section -->
        <div class="text-center mb-7">
          <div class="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary/30 rounded mb-4">
            <svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h1 class="text-3xl font-semibold tracking-tight text-base-content mb-1">ELOM</h1>
          <p class="text-sm text-muted">Система учёта материалов</p>
        </div>

        <!-- Login card -->
        <div class="login-card bg-base-100 rounded-md border border-base-300 p-8">
          <div class="mb-6">
            <h2 class="text-xl font-semibold text-base-content mb-1">Вход в систему</h2>
            <p class="text-sm text-muted">Введите логин и пароль</p>
          </div>

          <!-- Alerts -->
          <div v-if="sessionExpired" class="mb-5 p-3 rounded border border-warning/40 bg-warning/10 flex items-center">
            <svg class="w-5 h-5 text-warning mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <span class="text-sm text-base-content">Сессия истекла. Войдите снова.</span>
          </div>

          <div v-if="auth.error" class="mb-5 p-3 rounded border border-error/40 bg-error/10 flex items-center">
            <svg class="w-5 h-5 text-error mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="text-sm text-base-content">{{ auth.error }}</span>
          </div>

          <!-- Form -->
          <form @submit.prevent="submit" class="login-form">
            <!-- Username field -->
            <div class="space-y-1.5">
              <label class="text-xs font-medium uppercase tracking-wide text-muted">Логин</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <input
                  v-model.trim="username"
                  type="text"
                  class="login-input w-full pl-10 pr-4 py-3 rounded border border-control bg-base-100 text-base-content transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  placeholder="Введите логин"
                  required
                />
              </div>
            </div>

            <!-- Password field -->
            <div class="space-y-1.5">
              <label class="text-xs font-medium uppercase tracking-wide text-muted">Пароль</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <input
                  v-model="password"
                  type="password"
                  class="login-input w-full pl-10 pr-4 py-3 rounded border border-control bg-base-100 text-base-content transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  placeholder="Введите пароль"
                  required
                />
              </div>
            </div>

            <!-- Submit button -->
            <button
              type="submit"
              :disabled="auth.loading"
              class="btn btn-primary w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="auth.loading" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Вход…
              </span>
              <span v-else>Войти</span>
            </button>
          </form>

          <!-- Footer -->
          <div class="mt-7 pt-5 border-t border-base-300 text-center">
            <p class="text-xs text-subtle">
              © <span class="font-mono">{{ new Date().getFullYear() }}</span>
              <a href="https://elom.uz" target="_blank" class="text-primary hover:underline">Energy Life</a>. Все права защищены.
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

<style scoped>
/* Signature: a faint "schedule paper" hairline grid — the installer's world,
   not a gradient blob. Steel base, restrained. */
.login-bg {
  background-color: hsl(var(--b2));
  background-image:
    linear-gradient(hsl(var(--bc) / 0.04) 1px, transparent 1px),
    linear-gradient(90deg, hsl(var(--bc) / 0.04) 1px, transparent 1px);
  background-size: 24px 24px;
}

.login-card {
  box-shadow: 0 6px 20px rgba(14, 20, 23, 0.14);
  position: relative;
}

/* copper top-rule — the one accent */
.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: hsl(var(--p));
  border-radius: 0.375rem 0.375rem 0 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.login-input {
  font-size: 16px; /* ≥16px avoids iOS zoom on focus */
}

@media (prefers-reduced-motion: reduce) {
  .animate-spin { animation: none; }
}
</style>

