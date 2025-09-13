<!-- src/components/TopbarProgress.vue -->
<template>
  <div v-show="busy" class="fixed left-0 top-0 right-0 z-50 h-0.5 overflow-hidden">
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
