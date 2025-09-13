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
      <NavLinks @navigate="closeMenu"/>
    </aside>

    <!-- Sidebar Mobile (drawer) -->
    <transition name="fade">
      <div v-if="mobileOpen" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/30" @click="closeMenu"></div>
        <aside class="absolute left-0 top-0 bottom-0 w-72 bg-base-100 border-r p-2">
          <div class="p-4 text-lg font-semibold">ELOM</div>
          <NavLinks @navigate="closeMenu"/>
        </aside>
      </div>
    </transition>

    <div>
      <main class="p-4">
        <RouterView/>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import NavLinks from './partials/NavLinks.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

const mobileOpen = ref(false)

function toggleMenu() {
  mobileOpen.value = !mobileOpen.value
}

function closeMenu() {
  mobileOpen.value = false
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity .15s
}

.fade-enter-from, .fade-leave-to {
  opacity: 0
}
</style>
