<template>
  <div v-if="modelValue" class="modal modal-open">
    <div class="modal-box w-full max-w-none mx-4 my-4" :class="sizeClass">
      <div v-if="title || $slots.header" class="flex items-center justify-between mb-4">
        <h3 v-if="title" class="font-bold text-lg">{{ title }}</h3>
        <slot name="header" />
        <button
          v-if="closable"
          class="btn btn-sm btn-circle btn-ghost"
          @click="handleClose"
        >
          ✕
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
