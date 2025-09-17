<template>
  <div v-if="isOpen" class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg">{{ title }}</h3>
      <p class="py-4">{{ message }}</p>
      <div class="modal-action">
        <button
          class="btn btn-ghost"
          :disabled="loading"
          @click="handleCancel"
        >
          {{ cancelText }}
        </button>
        <button
          class="btn btn-primary"
          :class="{ 'loading': loading }"
          :disabled="loading"
          @click="handleConfirm"
        >
          <span v-if="!loading">{{ confirmText }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  variant?: 'primary' | 'error' | 'warning'
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'update:isOpen', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Подтверждение',
  confirmText: 'Подтвердить',
  cancelText: 'Отмена',
  loading: false,
  variant: 'primary'
})

const emit = defineEmits<Emits>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  emit('update:isOpen', false)
}

// Закрытие по Escape
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCancel()
        }
      }
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }
)
</script>


