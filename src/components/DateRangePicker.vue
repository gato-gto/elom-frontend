<template>
  <div class="form-control">
    <label v-if="label" class="label">
      <span class="label-text">{{ label }}</span>
      <span v-if="required" class="label-text-alt text-error">*</span>
    </label>
    <div class="input-group">
      <input
        v-model="startDate"
        type="date"
        class="input input-bordered input-sm"
        :class="{ 'input-error': hasError }"
        :placeholder="startPlaceholder"
        @input="handleStartChange"
      />
      <span class="bg-gray-50 px-2 flex items-center text-sm">—</span>
      <input
        v-model="endDate"
        type="date"
        class="input input-bordered input-sm"
        :class="{ 'input-error': hasError }"
        :placeholder="endPlaceholder"
        @input="handleEndChange"
      />
    </div>
    <label v-if="helpText" class="label">
      <span class="label-text-alt">{{ helpText }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  modelValue?: { start?: string; end?: string }
  label?: string
  startPlaceholder?: string
  endPlaceholder?: string
  helpText?: string
  required?: boolean
  hasError?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: { start?: string; end?: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  startPlaceholder: 'От',
  endPlaceholder: 'До',
  required: false,
  hasError: false
})

const emit = defineEmits<Emits>()

const startDate = ref(props.modelValue?.start || '')
const endDate = ref(props.modelValue?.end || '')

const handleStartChange = () => {
  emit('update:modelValue', { start: startDate.value, end: endDate.value })
}

const handleEndChange = () => {
  emit('update:modelValue', { start: startDate.value, end: endDate.value })
}

// Синхронизация с внешними изменениями
watch(
  () => props.modelValue,
  (newValue) => {
    startDate.value = newValue?.start || ''
    endDate.value = newValue?.end || ''
  },
  { deep: true }
)
</script>


