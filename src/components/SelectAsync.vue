<template>
  <div class="form-control">
    <label v-if="label" class="label">
      <span class="label-text">{{ label }}</span>
      <span v-if="required" class="label-text-alt text-error">*</span>
    </label>
    <select
      v-model="selectedValue"
      class="select select-bordered select-sm"
      :class="{ 'select-error': hasError }"
      :disabled="loading || disabled"
      @change="handleChange"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <label v-if="helpText" class="label">
      <span class="label-text-alt">{{ helpText }}</span>
    </label>
    <div v-if="loading" class="loading loading-spinner loading-sm mt-2"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'

interface Option {
  value: string | number
  label: string
}

interface Props {
  modelValue?: string | number
  label?: string
  placeholder?: string
  helpText?: string
  required?: boolean
  hasError?: boolean
  disabled?: boolean
  options: Option[]
  loading?: boolean
  searchable?: boolean
  debounceMs?: number
}

interface Emits {
  (e: 'update:modelValue', value: string | number): void
  (e: 'search', query: string): void
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  hasError: false,
  disabled: false,
  loading: false,
  searchable: false,
  debounceMs: 300
})

const emit = defineEmits<Emits>()

const selectedValue = ref(props.modelValue || '')

const handleChange = () => {
  emit('update:modelValue', selectedValue.value)
}

// Синхронизация с внешними изменениями
watch(
  () => props.modelValue,
  (newValue) => {
    selectedValue.value = newValue || ''
  }
)

// Загрузка опций при монтировании
onMounted(() => {
  if (props.searchable && props.options.length === 0) {
    emit('search', '')
  }
})
</script>


