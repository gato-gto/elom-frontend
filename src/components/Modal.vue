<!-- src/components/Modal.vue -->
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal modal-open">
      <div class="modal-box max-w-xl">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-base">{{ title }}</h3>
          <button class="btn btn-ghost btn-sm" @click="close">✕</button>
        </div>
        <div class="space-y-2">
          <slot/>
        </div>
        <div class="modal-action">
          <slot name="actions">
            <button class="btn btn-ghost" @click="close">Закрыть</button>
          </slot>
        </div>
      </div>
      <div class="modal-backdrop" @click="close"></div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: boolean; title?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

function close() {
  emit('update:modelValue', false)
}
</script>
