<template>
  <!-- Честный офлайн-баннер: данные могут быть неактуальны, изменения отключены -->
  <div v-if="!online" class="pwa-offline" role="status" aria-live="polite">
    <svg class="pwa-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M12 12h.01M3 3l18 18" />
    </svg>
    <span>Нет соединения. Данные могут быть неактуальны, изменения отключены.</span>
  </div>

  <!-- Обновление приложения: тихо не обновляемся, спрашиваем пользователя -->
  <div v-if="showUpdate" class="pwa-update" role="status" aria-live="polite">
    <span class="pwa-update-text">Доступна новая версия ELOM.</span>
    <div class="pwa-update-actions">
      <button class="btn btn-primary btn-sm" @click="applyUpdate">Обновить</button>
      <button class="btn btn-ghost btn-sm" @click="dismiss">Позже</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { usePwaUpdatePrompt } from '@/composables/usePwaUpdatePrompt'

// Регистрируем service worker; needRefresh становится true, когда собрана новая версия.
// F-1006 (Apple-аудит MED): периодический registration.update() — iOS-PWA живёт днями без
// перезапуска и БЕЗ него не узнаёт о новом dist (стейл-версия у бригадиров; симптом «баг у
// владельца, которого нет в коде»). Час — баланс свежесть/трафик.
let swUpdateTimer: ReturnType<typeof setInterval> | undefined
const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(_url, registration) {
    if (!registration) { return }
    swUpdateTimer = setInterval(() => { registration.update().catch(() => {}) }, 60 * 60 * 1000)
  },
})
onBeforeUnmount(() => { if (swUpdateTimer) { clearInterval(swUpdateTimer) } })

// F-511: «Позже» переживает перезагрузку (см. usePwaUpdatePrompt). applyUpdate(true) →
// перезагрузить страницу после активации нового SW.
const { showUpdate, applyUpdate, dismiss } = usePwaUpdatePrompt(
  needRefresh,
  () => updateServiceWorker(true),
)

// Онлайн/офлайн статус
const online = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
function syncOnline() {
  online.value = navigator.onLine
}
onMounted(() => {
  window.addEventListener('online', syncOnline)
  window.addEventListener('offline', syncOnline)
})
onBeforeUnmount(() => {
  window.removeEventListener('online', syncOnline)
  window.removeEventListener('offline', syncOnline)
})
</script>

<style scoped>
.pwa-offline {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: hsl(var(--bc));
  background: color-mix(in oklab, var(--color-warning) 22%, hsl(var(--b1)));
  border-bottom: 1px solid var(--color-warning);
  padding-top: max(0.5rem, env(safe-area-inset-top));
}

.pwa-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-warning);
  flex-shrink: 0;
}

.pwa-update {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 1.5rem;
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  border-radius: 0.375rem;
  background: hsl(var(--b1));
  border: 1px solid hsl(var(--b3));
  box-shadow: 0 6px 20px rgba(14, 20, 23, 0.14);
  max-width: calc(100vw - 2rem);
}

/* На мобильном поднимаем над нижней навигацией (её высота + отступ ≈ 6rem) */
@media (max-width: 1023px) {
  .pwa-update {
    bottom: calc(5.5rem + env(safe-area-inset-bottom));
  }
}

.pwa-update-text {
  font-size: 0.8125rem;
  font-weight: 500;
  color: hsl(var(--bc));
}

.pwa-update-actions {
  display: flex;
  gap: 0.375rem;
  flex-shrink: 0;
}
</style>
