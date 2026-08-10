<template>
  <!-- F-1009 (Apple-LOW): top через env — в standalone-PWA полоса рисовалась в строке статус-бара
       (под часами). Фиксед-контейнер остаётся transform-free (гард APPLE-2); анимация на ребёнке. -->
  <div v-show="busy" class="fixed left-0 right-0 z-50 h-0.5 overflow-hidden" style="top: env(safe-area-inset-top, 0px)">
    <div class="h-full bg-primary animate-topbar"></div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {useUiStore} from '@/stores/ui'

const ui = useUiStore()
const busy = computed(() => ui.busy)
</script>

<style scoped>
@keyframes topbar {
  0% {
    transform: translateX(-100%);
  }
  20% {
    transform: translateX(-70%);
  }
  40% {
    transform: translateX(-35%);
  }
  60% {
    transform: translateX(-15%);
  }
  100% {
    transform: translateX(0);
  }
}

.animate-topbar {
  width: 100%;
  animation: topbar 1.2s ease-in-out infinite;
}
</style>

