<template>
  <div class="filter-field">
    <label v-if="label" class="filter-label">
      {{ label }}
      <span v-if="required" class="required-mark">*</span>
    </label>
    
    <!-- Text Input -->
    <input
      v-if="type === 'text' || type === 'email' || type === 'password'"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="filter-input"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    
    <!-- Number Input -->
    <input
      v-else-if="type === 'number'"
      type="number"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      class="filter-input"
      @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
    />
    
    <!-- Date Input -->
    <input
      v-else-if="type === 'date'"
      type="date"
      :value="modelValue"
      :disabled="disabled"
      :min="min"
      :max="max"
      class="filter-input"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    
    <!-- Month Input -->
    <input
      v-else-if="type === 'month'"
      type="month"
      :value="modelValue"
      :disabled="disabled"
      :min="min"
      :max="max"
      class="filter-input"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    
    <!-- Select -->
    <select
      v-else-if="type === 'select'"
      :value="String(modelValue || '')"
      :disabled="disabled"
      class="filter-select"
      @change="handleSelectChange"
    >
      <option v-for="option in options" :key="String(option.value)" :value="String(option.value || '')">
        {{ option.label }}
      </option>
    </select>
    
    <!-- Textarea -->
    <textarea
      v-else-if="type === 'textarea'"
      :value="String(modelValue || '')"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      class="filter-textarea"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
interface Option {
  value: string | number | boolean | undefined
  label: string
}

interface Props {
  modelValue?: string | number | boolean | null
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'month' | 'select' | 'textarea'
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: Option[]
  min?: string | number
  max?: string | number
  step?: number
  rows?: number
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
  rows: 3
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | boolean | null]
}>()

function handleSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<style scoped>
.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

:root.dark .filter-label {
  color: #e2e8f0;
}

.required-mark {
  color: #ef4444;
  font-weight: 600;
}

.filter-input,
.filter-select,
.filter-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  color: #374151;
}

:root.dark .filter-input,
:root.dark .filter-select,
:root.dark .filter-textarea {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #e2e8f0;
}

.filter-input:focus,
.filter-select:focus,
.filter-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.filter-input:hover:not(:disabled),
.filter-select:hover:not(:disabled),
.filter-textarea:hover:not(:disabled) {
  border-color: #9ca3af;
}

.filter-input:disabled,
.filter-select:disabled,
.filter-textarea:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.filter-select {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1rem;
  padding-right: 2.5rem;
}

.filter-textarea {
  resize: vertical;
  min-height: 5rem;
}
</style>
