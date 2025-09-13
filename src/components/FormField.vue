<!-- src/components/FormField.vue -->
<template>
  <label class="form-control w-full">
    <div v-if="label" class="label">
      <span class="label-text">{{ label }}</span>
      <span v-if="hint" class="label-text-alt opacity-70">{{ hint }}</span>
    </div>

    <slot/>

    <div class="label h-6" v-if="error || help">
      <span class="label-text-alt text-error" v-if="error">{{ error }}</span>
      <span class="label-text-alt opacity-60" v-else-if="help">{{ help }}</span>
    </div>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  hint?: string
  help?: string
  error?: string | null
}>()
</script>
