<template>
  <div class="form-field" :class="fieldClass">
    <!-- Label -->
    <label v-if="field.label" class="form-label" :for="fieldId">
      {{ field.label }}
      <span v-if="field.required" class="text-red-500 ml-1">*</span>
    </label>

    <!-- Input Field -->
    <div class="form-input-container">
      <!-- Text Input -->
      <input
        v-if="field.type === 'input'"
        :id="fieldId"
        v-model="localValue"
        :type="getInputType()"
        :placeholder="field.placeholder"
        :required="field.required"
        :disabled="field.disabled || disabled"
        :readonly="field.readonly"
        class="form-input"
        :class="{ 'input-error': error }"
        @blur="handleBlur"
        @input="handleInput"
      />

      <!-- Textarea -->
      <textarea
        v-else-if="field.type === 'textarea'"
        :id="fieldId"
        v-model="localValue"
        :placeholder="field.placeholder"
        :required="field.required"
        :disabled="field.disabled || disabled"
        :readonly="field.readonly"
        :rows="getTextareaRows()"
        class="form-textarea"
        :class="{ 'textarea-error': error }"
        @blur="handleBlur"
        @input="handleInput"
      />

      <!-- Select -->
      <select
        v-else-if="field.type === 'select'"
        :id="fieldId"
        v-model="localValue"
        :required="field.required"
        :disabled="field.disabled || disabled"
        class="form-select"
        :class="{ 'select-error': error }"
        @change="handleChange"
      >
        <option value="" disabled>{{ field.placeholder || '— выберите —' }}</option>
        <option
          v-for="option in field.options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>

      <!-- Multiselect -->
      <div
        v-else-if="field.type === 'multiselect'"
        class="form-multiselect"
        :class="{ 'multiselect-error': error }"
      >
        <div
          class="multiselect-trigger"
          :class="{ 'multiselect-disabled': field.disabled || disabled }"
          @click="toggleMultiselect"
        >
          <span v-if="selectedLabels.length === 0" class="multiselect-placeholder">
            {{ field.placeholder || '— выберите —' }}
          </span>
          <span v-else class="multiselect-selected">
            {{ selectedLabels.join(', ') }}
          </span>
          <svg class="multiselect-arrow" :class="{ 'multiselect-arrow-open': isMultiselectOpen }">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
        
        <div v-if="isMultiselectOpen" class="multiselect-dropdown">
          <div
            v-for="option in field.options"
            :key="option.value"
            class="multiselect-option"
            :class="{ 'multiselect-option-selected': isOptionSelected(option.value) }"
            @click="toggleOption(option.value)"
          >
            <input
              type="checkbox"
              :checked="isOptionSelected(option.value)"
              class="multiselect-checkbox"
              @change="toggleOption(option.value)"
            />
            <span>{{ option.label }}</span>
          </div>
        </div>
      </div>

      <!-- Date Input -->
      <input
        v-else-if="field.type === 'date'"
        :id="fieldId"
        v-model="localValue"
        type="date"
        :required="field.required"
        :disabled="field.disabled || disabled"
        class="form-input"
        :class="{ 'input-error': error }"
        @blur="handleBlur"
        @change="handleChange"
      />

      <!-- Number Input -->
      <input
        v-else-if="field.type === 'number'"
        :id="fieldId"
        v-model.number="localValue"
        type="number"
        :placeholder="field.placeholder"
        :required="field.required"
        :disabled="field.disabled || disabled"
        :readonly="field.readonly"
        :min="field.validation?.min"
        :max="field.validation?.max"
        :step="getNumberStep()"
        class="form-input"
        :class="{ 'input-error': error }"
        @blur="handleBlur"
        @input="handleInput"
      />

      <!-- Checkbox -->
      <div v-else-if="field.type === 'checkbox'" class="form-checkbox">
        <input
          :id="fieldId"
          v-model="localValue"
          type="checkbox"
          :required="field.required"
          :disabled="field.disabled || disabled"
          class="checkbox-input"
          :class="{ 'checkbox-error': error }"
          @change="handleChange"
        />
        <label :for="fieldId" class="checkbox-label">
          {{ field.label }}
        </label>
      </div>

      <!-- File Input -->
      <div v-else-if="field.type === 'file'" class="form-file">
        <input
          :id="fieldId"
          ref="fileInput"
          type="file"
          :accept="getFileAccept()"
          :multiple="field.multiple"
          :required="field.required"
          :disabled="field.disabled || disabled"
          class="file-input"
          :class="{ 'file-error': error }"
          @change="handleFileChange"
        />
        <label :for="fieldId" class="file-label">
          <svg class="file-icon">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
          </svg>
          <span class="file-text">
            {{ getFileLabel() }}
          </span>
        </label>
      </div>
    </div>

    <!-- Help Text -->
    <p v-if="field.help && !error" class="form-help">
      {{ field.help }}
    </p>

    <!-- Error Message -->
    <p v-if="error" class="form-error">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { FieldConfig } from '@/types/generic'

// Props
interface Props {
  field: FieldConfig
  value: any
  error?: string
  disabled?: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:value': [value: any]
}>()

// State
const localValue = ref(props.value)
const isMultiselectOpen = ref(false)
const fileInput = ref<HTMLInputElement>()

// Computed
const fieldId = computed(() => `field-${props.field.key}`)

const fieldClass = computed(() => {
  const classes = ['form-field']
  
  if (props.field.width) {
    classes.push(`form-field-${props.field.width}`)
  }
  
  if (props.field.group) {
    classes.push(`form-field-group-${props.field.group}`)
  }
  
  return classes.join(' ')
})

const selectedLabels = computed(() => {
  if (props.field.type !== 'multiselect' || !Array.isArray(localValue.value)) {
    return []
  }
  
  return localValue.value
    .map(val => props.field.options?.find(opt => opt.value === val)?.label)
    .filter(Boolean)
})

// Methods
function getInputType(): string {
  // Could be extended to support different input types based on field configuration
  return 'text'
}

function getTextareaRows(): number {
  // Could be made configurable
  return 4
}

function getNumberStep(): number {
  return props.field.validation?.step || 1
}

function getFileAccept(): string {
  // Could be made configurable
  return '*/*'
}

function getFileLabel(): string {
  if (props.field.multiple && Array.isArray(localValue.value)) {
    return localValue.value.length > 0 
      ? `Выбрано файлов: ${localValue.value.length}`
      : 'Выберите файлы'
  }
  
  return localValue.value ? 'Файл выбран' : 'Выберите файл'
}

function isOptionSelected(value: any): boolean {
  if (props.field.type !== 'multiselect') return false
  return Array.isArray(localValue.value) && localValue.value.includes(value)
}

function toggleMultiselect() {
  if (props.field.disabled || props.disabled) return
  isMultiselectOpen.value = !isMultiselectOpen.value
}

function toggleOption(value: any) {
  if (!Array.isArray(localValue.value)) {
    localValue.value = []
  }
  
  const index = localValue.value.indexOf(value)
  if (index > -1) {
    localValue.value.splice(index, 1)
  } else {
    localValue.value.push(value)
  }
  
  emit('update:value', [...localValue.value])
}

function handleInput() {
  emit('update:value', localValue.value)
}

function handleChange() {
  emit('update:value', localValue.value)
}

function handleBlur() {
  // Could trigger validation here
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    if (props.field.multiple) {
      localValue.value = Array.from(target.files)
    } else {
      localValue.value = target.files[0] || null
    }
  }
  emit('update:value', localValue.value)
}

// Watch for external value changes
watch(() => props.value, (newValue) => {
  localValue.value = newValue
}, { deep: true })

// Close multiselect when clicking outside
function handleClickOutside(event: Event) {
  if (isMultiselectOpen.value && !(event.target as HTMLElement).closest('.form-multiselect')) {
    isMultiselectOpen.value = false
  }
}

// Lifecycle
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.form-field {
  @apply space-y-2;
}

.form-field-full {
  @apply col-span-full;
}

.form-field-half {
  @apply col-span-1 md:col-span-2;
}

.form-field-third {
  @apply col-span-1 md:col-span-1;
}

.form-field-quarter {
  @apply col-span-1 md:col-span-1;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-input-container {
  @apply relative;
}

.form-input,
.form-textarea,
.form-select {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm;
  @apply bg-white dark:bg-gray-800 text-gray-900 dark:text-white;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
  @apply disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  @apply ring-2 ring-blue-500 border-blue-500;
}

.input-error,
.textarea-error,
.select-error {
  @apply border-red-500 focus:ring-red-500 focus:border-red-500;
}

.form-textarea {
  @apply resize-vertical min-h-[100px];
}

/* Multiselect Styles */
.form-multiselect {
  @apply relative;
}

.multiselect-trigger {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm;
  @apply bg-white dark:bg-gray-800 text-gray-900 dark:text-white;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
  @apply cursor-pointer flex items-center justify-between;
}

.multiselect-disabled {
  @apply bg-gray-50 dark:bg-gray-700 text-gray-500 cursor-not-allowed;
}

.multiselect-placeholder {
  @apply text-gray-500 dark:text-gray-400;
}

.multiselect-selected {
  @apply text-gray-900 dark:text-white;
}

.multiselect-arrow {
  @apply w-4 h-4 text-gray-400 transition-transform duration-200;
}

.multiselect-arrow-open {
  @apply transform rotate-180;
}

.multiselect-dropdown {
  @apply absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto;
}

.multiselect-option {
  @apply px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center space-x-2;
}

.multiselect-option-selected {
  @apply bg-blue-50 dark:bg-blue-900/20;
}

.multiselect-checkbox {
  @apply w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded;
}

.multiselect-error .multiselect-trigger {
  @apply border-red-500 focus:ring-red-500 focus:border-red-500;
}

/* Checkbox Styles */
.form-checkbox {
  @apply flex items-center space-x-2;
}

.checkbox-input {
  @apply w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded;
}

.checkbox-label {
  @apply text-sm text-gray-700 dark:text-gray-300 cursor-pointer;
}

.checkbox-error {
  @apply border-red-500;
}

/* File Input Styles */
.form-file {
  @apply relative;
}

.file-input {
  @apply absolute inset-0 w-full h-full opacity-0 cursor-pointer;
}

.file-label {
  @apply flex items-center justify-center w-full px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md;
  @apply bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300;
  @apply hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer transition-colors;
}

.file-icon {
  @apply w-5 h-5 mr-2 text-gray-400;
}

.file-text {
  @apply text-sm;
}

.file-error .file-label {
  @apply border-red-500 text-red-500;
}

/* Help and Error Text */
.form-help {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.form-error {
  @apply text-sm text-red-600 dark:text-red-400;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .form-field-half,
  .form-field-third,
  .form-field-quarter {
    @apply col-span-full;
  }
}
</style>
