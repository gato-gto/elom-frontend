<template>
  <div v-if="showWarning" class="browser-warning">
    <div class="alert alert-warning">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <div>
        <h3 class="font-bold">Предупреждение о совместимости браузера</h3>
        <div class="text-xs">
          <p>Ваш браузер: <strong>{{ browserInfo.name }} {{ browserInfo.version }}</strong></p>
          <p v-if="recommendations.length > 0">Рекомендации:</p>
          <ul v-if="recommendations.length > 0" class="list-disc list-inside mt-1">
            <li v-for="rec in recommendations" :key="rec">{{ rec }}</li>
          </ul>
          <p class="mt-2">
            Для лучшего опыта рекомендуем использовать 
            <strong>Chrome 80+</strong>, <strong>Firefox 78+</strong>, 
            <strong>Safari 13.1+</strong> или <strong>Edge 80+</strong>.
          </p>
        </div>
      </div>
      <button @click="dismissWarning" class="btn btn-sm btn-ghost">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import browserSupport from '@/utils/browserSupport'

const showWarning = ref(false)
const browserInfo = ref({ name: 'Unknown', version: 'Unknown', isSupported: false })
const recommendations = ref<string[]>([])

onMounted(() => {
  // Проверяем, не было ли предупреждение уже отклонено
  const dismissed = localStorage.getItem('browser-warning-dismissed')
  if (dismissed) return

  // Получаем информацию о браузере
  browserInfo.value = browserSupport.getBrowserInfo()
  recommendations.value = browserSupport.getRecommendations()

  // Показываем предупреждение только если браузер не полностью поддерживается
  if (!browserSupport.isFullySupported()) {
    showWarning.value = true
  }
})

const dismissWarning = () => {
  showWarning.value = false
  localStorage.setItem('browser-warning-dismissed', 'true')
}
</script>

<style scoped>
.browser-warning {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  max-width: 400px;
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.alert {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

@media (max-width: 640px) {
  .browser-warning {
    top: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
    max-width: none;
  }
}
</style>
