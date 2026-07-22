<template>
  <div v-if="modelValue" class="modal modal-open">
    <div class="modal-box w-full max-w-none mx-4 my-4" :class="sizeClass">
      <div v-if="title || $slots.header" class="modal-header flex items-center justify-between mb-4 no-print">
        <h3 v-if="title" class="font-bold text-lg modal-title">{{ title }}</h3>
        <slot name="header" />
        <button
          v-if="closable"
          class="btn btn-sm btn-circle btn-ghost"
          aria-label="Закрыть"
          @click="handleClose"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      
      <div class="modal-content">
        <slot />
      </div>
      
      <div v-if="$slots.footer" class="modal-action">
        <slot name="footer" />
      </div>
    </div>
    <div v-if="backdrop" class="modal-backdrop" @click="handleBackdropClick"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'
  closable?: boolean
  backdrop?: boolean
  closeOnBackdrop?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'update:modelValue', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
  backdrop: true,
  closeOnBackdrop: true
})

const emit = defineEmits<Emits>()

const sizeClass = computed(() => {
  const sizeMap = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '3xl': 'sm:max-w-3xl',
    '4xl': 'sm:max-w-4xl',
    '5xl': 'sm:max-w-5xl',
    '6xl': 'sm:max-w-6xl',
    '7xl': 'sm:max-w-7xl'
  }
  return sizeMap[props.size]
})

const handleClose = () => {
  emit('close')
  emit('update:modelValue', false)
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    handleClose()
  }
}

// Закрытие по Escape
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && props.closable) {
          handleClose()
        }
      }
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }
)
</script>

<style scoped>
@media print {
  /* КРИТИЧНО: Показываем модальное окно с максимальной специфичностью */
  html body .modal,
  html body .modal.modal-open,
  body #app .modal,
  body #app .modal.modal-open,
  #app .modal,
  #app .modal.modal-open,
  body .modal,
  body .modal.modal-open,
  .modal.modal-open,
  .modal {
    position: static !important;
    background: transparent !important;
    display: block !important;
    visibility: visible !important;
    padding: 0 !important;
    margin: 0 !important;
    inset: auto !important;
    z-index: auto !important;
    opacity: 1 !important;
    height: auto !important;
    width: 100% !important;
  }

  /* Показываем modal-box с максимальной специфичностью */
  html body .modal .modal-box,
  html body .modal.modal-open .modal-box,
  body #app .modal .modal-box,
  body #app .modal.modal-open .modal-box,
  #app .modal .modal-box,
  #app .modal.modal-open .modal-box,
  body .modal .modal-box,
  body .modal.modal-open .modal-box,
  .modal.modal-open .modal-box,
  .modal .modal-box,
  .modal-box {
    position: static !important;
    background: white !important;
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
    display: block !important;
    visibility: visible !important;
    height: auto !important;
    overflow: visible !important;
  }

  /* Показываем modal-content с максимальной специфичностью */
  html body .modal .modal-box .modal-content,
  html body .modal.modal-open .modal-box .modal-content,
  body #app .modal .modal-box .modal-content,
  body #app .modal.modal-open .modal-box .modal-content,
  #app .modal .modal-box .modal-content,
  #app .modal.modal-open .modal-box .modal-content,
  body .modal .modal-box .modal-content,
  body .modal.modal-open .modal-box .modal-content,
  .modal.modal-open .modal-box .modal-content,
  .modal .modal-box .modal-content,
  .modal-box .modal-content,
  .modal-content {
    display: block !important;
    visibility: visible !important;
    padding: 0 !important;
    margin: 0 !important;
    height: auto !important;
    width: 100% !important;
    overflow: visible !important;
  }

  .no-print {
    display: none !important;
    visibility: hidden !important;
  }
}
</style>
