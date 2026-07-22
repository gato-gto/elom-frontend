<template>
  <div class="loading-spinner-container" :class="{ 'loading-overlay': overlay }">
    <div class="loading-spinner" :class="[`spinner-${size}`, `spinner-${variant}`]">
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
    </div>
    <div v-if="text" class="loading-text">{{ text }}</div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  text?: string
  overlay?: boolean
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'primary',
  overlay: false
})
</script>

<style scoped>
.loading-spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: hsl(var(--b1) / 0.92);
  z-index: 50;
  border-radius: 0.375rem;
}

:root.dark .loading-overlay {
  background: rgba(15, 23, 42, 0.9);
}

.loading-spinner {
  position: relative;
  display: inline-block;
}

.spinner-ring {
  position: absolute;
  border: 3px solid transparent;
  border-top: 3px solid currentColor;
  border-radius: 50%;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.spinner-ring:nth-child(1) {
  animation-delay: -0.45s;
}

.spinner-ring:nth-child(2) {
  animation-delay: -0.3s;
}

.spinner-ring:nth-child(3) {
  animation-delay: -0.15s;
}

/* Размеры */
.spinner-sm {
  width: 1.5rem;
  height: 1.5rem;
}

.spinner-sm .spinner-ring {
  width: 1.5rem;
  height: 1.5rem;
  border-width: 2px;
}

.spinner-md {
  width: 2rem;
  height: 2rem;
}

.spinner-md .spinner-ring {
  width: 2rem;
  height: 2rem;
  border-width: 3px;
}

.spinner-lg {
  width: 3rem;
  height: 3rem;
}

.spinner-lg .spinner-ring {
  width: 3rem;
  height: 3rem;
  border-width: 4px;
}

.spinner-xl {
  width: 4rem;
  height: 4rem;
}

.spinner-xl .spinner-ring {
  width: 4rem;
  height: 4rem;
  border-width: 5px;
}

/* Варианты цветов */
.spinner-primary {
  color: hsl(var(--p));
}

.spinner-secondary {
  color: hsl(var(--bc) / 0.55);
}

.spinner-success {
  color: var(--color-success);
}

.spinner-warning {
  color: var(--color-warning);
}

.spinner-error {
  color: var(--color-error);
}

.loading-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--bc) / 0.6);
  text-align: center;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
