<template>
  <div class="form-control w-full" :class="fieldClasses">
    <!-- Field Label -->
    <label v-if="field.label && field.type !== 'checkbox'" class="label">
      <span class="label-text font-medium text-base-content">{{ field.label }}</span>
      <span v-if="field.required" class="label-text-alt text-error font-semibold">*</span>
    </label>

    <!-- Text Input -->
    <input
      v-if="field.type === 'input'"
      :type="inputType"
      :value="String(value || '')"
      :placeholder="field.placeholder"
      :required="field.required"
      :disabled="disabled"
      :readonly="field.readonly"
      class="input input-bordered w-full transition-all duration-200 hover:border-primary focus:border-primary focus:outline-offset-0"
      :class="[
        { 'input-error hover:border-error focus:border-error': hasError },
        { 'input-success': !hasError && touched },
        { 'bg-base-200 cursor-not-allowed': disabled }
      ]"
      @input="handleInput"
      @blur="handleBlur"
    />

    <!-- Textarea -->
    <textarea
      v-else-if="field.type === 'textarea'"
      :value="String(value || '')"
      :placeholder="field.placeholder"
      :required="field.required"
      :disabled="disabled"
      :readonly="field.readonly"
      :rows="field.rows || 4"
      class="textarea textarea-bordered w-full resize-y min-h-[100px] transition-all duration-200 hover:border-primary focus:border-primary focus:outline-offset-0"
      :class="[
        { 'textarea-error hover:border-error focus:border-error': hasError },
        { 'textarea-success': !hasError && touched },
        { 'bg-base-200 cursor-not-allowed': disabled }
      ]"
      @input="handleTextareaInput"
      @blur="handleBlur"
    ></textarea>

    <!-- Number Input -->
    <input
      v-else-if="field.type === 'number'"
      type="number"
      :value="Number(value) || ''"
      :placeholder="field.placeholder"
      :required="field.required"
      :disabled="disabled"
      :readonly="field.readonly"
      :min="field.validation?.min"
      :max="field.validation?.max"
      :step="field.step || 1"
      class="input input-bordered w-full transition-all duration-200 hover:border-primary focus:border-primary focus:outline-offset-0"
      :class="[
        { 'input-error hover:border-error focus:border-error': hasError },
        { 'input-success': !hasError && touched },
        { 'bg-base-200 cursor-not-allowed': disabled }
      ]"
      @input="handleNumberInput"
      @blur="handleBlur"
    />

    <!-- Date Input -->
    <input
      v-else-if="field.type === 'date'"
      type="date"
      :value="value ? formatDateForInput(value) : ''"
      :required="field.required"
      :disabled="disabled"
      :readonly="field.readonly"
      class="input input-bordered w-full transition-all duration-200 hover:border-primary focus:border-primary focus:outline-offset-0"
      :class="[
        { 'input-error hover:border-error focus:border-error': hasError },
        { 'input-success': !hasError && touched },
        { 'bg-base-200 cursor-not-allowed': disabled }
      ]"
      @input="handleDateInput"
      @blur="handleBlur"
    />

    <!-- Select -->
    <select
      v-else-if="field.type === 'select'"
      :value="value"
      :required="field.required"
      :disabled="disabled"
      class="select select-bordered w-full transition-all duration-200 hover:border-primary focus:border-primary focus:outline-offset-0"
      :class="[
        { 'select-error hover:border-error focus:border-error': hasError },
        { 'select-success': !hasError && touched },
        { 'bg-base-200 cursor-not-allowed': disabled }
      ]"
      @change="handleSelectChange"
      @blur="handleBlur"
    >
      <option value="" disabled class="text-base-content/50">{{ field.placeholder || 'Выберите...' }}</option>
      <option
        v-for="option in field.options"
        :key="String(option.value)"
        :value="option.value"
        class="text-base-content"
      >
        {{ option.label }}
      </option>
    </select>

    <!-- Multiselect -->
    <div v-else-if="field.type === 'multiselect'" class="space-y-2">
      <select
        :value="Array.isArray(value) ? value : []"
        :required="field.required"
        :disabled="disabled"
        multiple
        class="select select-bordered w-full min-h-[120px] transition-all duration-200 hover:border-primary focus:border-primary focus:outline-offset-0"
        :class="[
          { 'select-error hover:border-error focus:border-error': hasError },
          { 'select-success': !hasError && touched },
          { 'bg-base-200 cursor-not-allowed': disabled }
        ]"
        @change="handleMultiselectChange"
        @blur="handleBlur"
      >
        <option
          v-for="option in field.options"
          :key="String(option.value)"
          :value="option.value"
          class="text-base-content"
        >
          {{ option.label }}
        </option>
      </select>
      
      <!-- Selected Values Display -->
      <div v-if="Array.isArray(value) && value.length > 0" class="flex flex-wrap gap-2">
        <div
          v-for="(val, index) in value"
          :key="index"
          class="badge badge-primary gap-2"
        >
          {{ getOptionLabel(val) }}
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-circle"
            @click="removeValue(val)"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Checkbox -->
    <div v-else-if="field.type === 'checkbox'" class="form-control">
      <label class="label cursor-pointer justify-start gap-3 hover:bg-base-200/50 p-3 rounded-lg transition-colors duration-200">
        <input
          type="checkbox"
          :checked="Boolean(value)"
          :required="field.required"
          :disabled="disabled"
          :readonly="field.readonly"
          class="checkbox checkbox-primary transition-all duration-200"
          :class="[
            { 'checkbox-error': hasError },
            { 'cursor-not-allowed opacity-50': disabled }
          ]"
          @change="handleCheckboxChange"
          @blur="handleBlur"
        />
        <div class="flex flex-col">
          <span class="label-text font-medium text-base-content">{{ field.label }}</span>
          <span v-if="field.required" class="label-text-alt text-error font-semibold">*</span>
        </div>
      </label>
    </div>

    <!-- File Input -->
    <div v-else-if="field.type === 'file'" class="space-y-3">
      <input
        type="file"
        :required="field.required"
        :disabled="disabled"
        :multiple="field.multiple"
        :accept="field.accept"
        class="file-input file-input-bordered w-full transition-all duration-200 hover:border-primary focus:border-primary focus:outline-offset-0"
        :class="[
          { 'file-input-error hover:border-error focus:border-error': hasError },
          { 'file-input-success': !hasError && touched },
          { 'bg-base-200 cursor-not-allowed': disabled }
        ]"
        @change="handleFileChange"
        @blur="handleBlur"
      />
      
      <!-- File List -->
      <div v-if="fileList.length > 0" class="space-y-2">
        <div
          v-for="(file, index) in fileList"
          :key="index"
          class="card bg-base-100 border border-base-300 p-3"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-base-content/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <div class="font-medium text-sm">{{ file.name }}</div>
                <div class="text-xs text-base-content/70">{{ formatFileSize(file.size) }}</div>
              </div>
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-circle"
              @click="removeFile(index)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Field Help Text -->
    <label v-if="field.help && !hasError" class="label">
      <span class="label-text-alt text-base-content/70 text-sm leading-relaxed">{{ field.help }}</span>
    </label>

    <!-- Field Error -->
    <label v-if="hasError" class="label">
      <span class="label-text-alt text-error font-medium text-sm flex items-center gap-1">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.304 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        {{ error }}
      </span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FieldConfig } from '@/types/generic'

// Props
interface Props {
  field: FieldConfig
  value: any
  error?: string
  touched?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  error: '',
  touched: false,
  disabled: false
})

// Emits
const emit = defineEmits<{
  'update:value': [value: any]
  'blur': []
}>()

// State
const fileList = ref<File[]>([])

// Computed
const hasError = computed(() => !!props.error)
const touched = computed(() => props.touched)

const fieldClasses = computed(() => {
  const classes = ['field-wrapper']
  
  if (props.field.width) {
    classes.push(`field-${props.field.width}`)
  }
  
  if (props.field.group) {
    classes.push(`field-group-${props.field.group}`)
  }
  
  return classes
})

const inputType = computed(() => {
  // Determine input type based on field key or validation
  if (props.field.key.includes('email')) return 'email'
  if (props.field.key.includes('password')) return 'password'
  if (props.field.key.includes('url')) return 'url'
  if (props.field.key.includes('tel')) return 'tel'
  return 'text'
})

// Methods
function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:value', target.value)
}

function handleTextareaInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:value', target.value)
}

function handleNumberInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value ? Number(target.value) : null
  emit('update:value', value)
}

function handleDateInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:value', target.value)
}

function handleSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:value', target.value)
}

function handleMultiselectChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const selectedValues = Array.from(target.selectedOptions).map(option => option.value)
  emit('update:value', selectedValues)
}

function handleCheckboxChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:value', target.checked)
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  
  if (props.field.multiple) {
    fileList.value = [...fileList.value, ...files]
    emit('update:value', fileList.value)
  } else {
    fileList.value = files.slice(0, 1)
    emit('update:value', fileList.value[0] || null)
  }
}

function handleBlur() {
  emit('blur')
}

function removeValue(value: any) {
  if (Array.isArray(props.value)) {
    const newValue = props.value.filter(v => v !== value)
    emit('update:value', newValue)
  }
}

function removeFile(index: number) {
  fileList.value.splice(index, 1)
  if (props.field.multiple) {
    emit('update:value', fileList.value)
  } else {
    emit('update:value', fileList.value[0] || null)
  }
}

function getOptionLabel(value: any): string {
  const option = props.field.options?.find(opt => opt.value === value)
  return option?.label || String(value)
}

function formatDateForInput(date: any): string {
  if (!date) return ''
  if (typeof date === 'string') {
    return date.split('T')[0] // Extract date part from ISO string
  }
  if (date instanceof Date) {
    return date.toISOString().split('T')[0]
  }
  return String(date)
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

