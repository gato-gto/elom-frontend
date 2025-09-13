<!-- src/layouts/AppLayout.vue -->
<template>
  <header class="border-b bg-base-100 px-4 py-2 flex items-center gap-3">
    <button class="md:hidden btn btn-outline btn-sm" @click="toggleMenu">Меню</button>
    <div class="font-semibold flex-1">Energy Life</div>
    <ThemeToggle/>
  </header>
  <div class="min-h-screen grid md:grid-cols-[240px_1fr]">
    <!-- Sidebar Desktop -->
    <aside class="hidden md:block border-r bg-base-100">
      <div class="p-4 text-lg font-semibold">ELOM</div>
      <NavLinks/>
    </aside>

    <!-- Sidebar Mobile (drawer) -->
    <transition name="fade">
      <div v-if="mobileOpen" class="fixed inset-0 z-40 md:hidden">
        <div class="absolute inset-0 bg-black/40" @click="closeMenu"></div>
        <aside class="absolute inset-y-0 left-0 w-72 bg-base-100 border-r shadow-xl">
          <div class="p-4 flex items-center justify-between border-b">
            <div class="text-lg font-semibold">ELOM</div>
            <button class="btn btn-ghost btn-sm" @click="closeMenu">✕</button>
          </div>
          <NavLinks @navigate="closeMenu"/>
        </aside>
      </div>
    </transition>

    <!-- Main -->
    <div class="grid grid-rows-[auto_1fr]">
      <header class="border-b bg-base-100 px-4 py-2 flex items-center gap-3">
        <button class="md:hidden btn btn-outline btn-sm" @click="toggleMenu">Меню</button>
        <div class="font-semibold flex-1">Energy Life</div>
        <div v-if="auth.me" class="text-sm text-base-content">
          {{ auth.me.username }} <span class="opacity-60">({{ auth.me.role }})</span>
        </div>
        <button class="btn btn-outline btn-sm" @click="auth.logout(true)">Выйти</button>
      </header>

      <main class="p-4">
        <RouterView/>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import {useAuthStore} from '@/stores/auth'
import NavLinks from './partials/NavLinks.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

const auth = useAuthStore()
const mobileOpen = ref(false)

function toggleMenu() {
  mobileOpen.value = !mobileOpen.value
}

function closeMenu() {
  mobileOpen.value = false
}
</script>
<style scoped>
/* только анимация, БЕЗ @apply и без daisy-классов */
.fade-enter-active, .fade-leave-active {
  transition: opacity .15s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
