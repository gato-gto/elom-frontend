<!-- src/components/ToastCenter.vue -->
<template>
  <div class="toast toast-end toast-bottom z-50">
    <div v-for="t in toasts" :key="t.id" :class="alertClass(t.type)">
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

