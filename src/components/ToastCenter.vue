<!-- src/components/ToastCenter.vue -->
<template>
  <!-- F-859 (a11y): live-регион для скринридеров. role=status/aria-live=polite для обычных тостов;
       error-тост → role=alert (assertive), чтобы VoiceOver/TalkBack сразу озвучивали ошибку. -->
  <div v-if="toasts.length > 0" class="toast toast-top toast-end z-[9999]"
       role="status" aria-live="polite" aria-atomic="false">
    <div v-for="t in toasts" :key="t.id" :class="alertClass(t.type)"
         :role="t.type === 'error' ? 'alert' : undefined">
      <span>{{ t.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {storeToRefs} from 'pinia'
import {useUiStore} from '@/stores/ui'

const ui = useUiStore()
const {toasts} = storeToRefs(ui)

function alertClass(type?: 'success' | 'error' | 'info') {
  switch (type) {
    case 'success':
      return 'alert alert-success'
    case 'error':
      return 'alert alert-error'
    default:
      return 'alert alert-info'
  }
}
</script>

<style scoped>
/* Основные стили для toast */
.toast {
  top: 1rem;
  right: 1rem;
}

/* Улучшенные стили для мобильных устройств */
@media (max-width: 768px) {
  .toast {
    /* Увеличиваем размер для мобильных */
    min-width: 90vw;
    max-width: 90vw;
    margin: 0 5vw;
    font-size: 0.9rem;
    padding: 1rem;
    top: 0.5rem;
    right: 5vw;
  }
  
  .alert {
    /* Делаем более заметным на мобильных */
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    border: 2px solid;
  }
  
  .alert-error {
    border-color: var(--color-error);
    background-color: color-mix(in oklab, var(--color-error) 10%, var(--color-base-100));
  }

  .alert-success {
    border-color: var(--color-success);
    background-color: color-mix(in oklab, var(--color-success) 10%, var(--color-base-100));
  }

  .alert-info {
    border-color: var(--color-info);
    background-color: color-mix(in oklab, var(--color-info) 10%, var(--color-base-100));
  }
}

/* Дополнительные стили для очень маленьких экранов */
@media (max-width: 480px) {
  .toast {
    min-width: 95vw;
    max-width: 95vw;
    margin: 0 2.5vw;
    font-size: 0.85rem;
    padding: 0.8rem;
  }
}
</style>

