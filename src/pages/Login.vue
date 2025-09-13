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

        <form @submit.prevent="submit" class="grid gap-3">
          <label class="form-control">
            <span class="label-text mb-1">Логин</span>
            <input v-model.trim="username" class="input input-bordered" required/>
          </label>
          <label class="form-control">
            <span class="label-text mb-1">Пароль</span>
            <input v-model="password" type="password" class="input input-bordered" required/>
          </label>
          <button :disabled="auth.loading" class="btn btn-primary">Войти</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useAuthStore} from '@/stores/auth'
import {useRoute, useRouter} from 'vue-router'
import {useUiStore} from '@/stores/ui'

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
    }
    await auth.login(username.value, password.value)
    ui.toast({type: 'success', text: 'Добро пожаловать!'})
  } catch (e: any) {
    ui.toast({type: 'error', text: e?.response?.data?.detail ?? 'Ошибка входа'})
  }
}
</script>
