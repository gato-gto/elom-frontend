<!-- src/pages/Login.vue -->
<template>
  <div class="min-h-screen grid place-items-center p-4">
    <div class="w-full max-w-md card bg-base-100 border shadow-sm">
      <div class="card-body">
        <h1 class="text-xl font-semibold mb-1">Вход</h1>
        <p class="text-base-content/70 text-sm mb-4">Введите логин и пароль, чтобы продолжить.</p>

        <div v-if="sessionExpired" class="alert alert-warning py-2 mb-3">
          <span>Сессия истекла. Пожалуйста, войдите снова.</span>
        </div>

        <div v-if="auth.error" class="alert alert-error py-2 mb-3">
          <span>{{ auth.error }}</span>
        </div>

        <form @submit.prevent="onSubmit" class="grid gap-3">
          <label class="grid gap-1">
            <span class="text-sm">Логин</span>
            <input v-model.trim="username" type="text" autocomplete="username" class="input input-bordered" required/>
          </label>

          <label class="grid gap-1">
            <span class="text-sm">Пароль</span>
            <input v-model="password" type="password" autocomplete="current-password" class="input input-bordered" required/>
          </label>

          <button type="submit" class="btn btn-primary mt-2" :disabled="auth.loading">
            <span v-if="auth.loading">Вход…</span><span v-else>Войти</span>
          </button>
        </form>

        <p class="mt-4 text-xs text-base-content/60">Версия UI: Frontend Auth Sprint 0</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {useAuthStore} from '@/stores/auth'
import {useRoute, useRouter} from 'vue-router'
import {ref, computed, onMounted} from 'vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const username = ref('');
const password = ref('')
const sessionExpired = computed(() => route.query.session === 'expired')
onMounted(() => {
  if (auth.isAuthenticated) {
    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  }
})

async function onSubmit() {
  const ok = await auth.login(username.value, password.value)
  if (!ok) return
  const redirect = (route.query.redirect as string) || '/'
  await router.replace(redirect)
}
</script>

<style scoped>
/* no @apply */
</style>
