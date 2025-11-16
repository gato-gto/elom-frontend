<template>
  <div class="form-control w-full">
    <!-- Label -->
    <label v-if="label" class="label">
      <span class="label-text font-medium text-base-content">{{ label }}</span>
      <span v-if="required" class="label-text-alt text-primary font-semibold">*</span>
    </label>
    
    <!-- Input -->
    <input
      v-if="type === 'input' || type === 'text' || type === 'email' || type === 'password' || type === 'number' || type === 'date'"
      :value="modelValue"
      :type="getInputType()"
      class="input input-bordered w-full transition-all duration-200 hover:border-primary focus:border-primary focus:outline-offset-0"
      :class="[
        { 'input-error hover:border-error focus:border-error': hasError || error || errorMessage },
        { 'input-xs': size === 'xs' },
        { 'input-sm': size === 'sm' },
        { 'input-md': size === 'md' || !size },
        { 'input-lg': size === 'lg' },
        { 'bg-base-100': !disabled },
        { 'bg-base-200 cursor-not-allowed': disabled },
        customClass
      ]"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :readonly="readonly"
      :min="min"
      :max="max"
      :step="step"
      :autocomplete="autocomplete"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    />
    
    <!-- Textarea -->
    <textarea
      v-else-if="type === 'textarea'"
      :value="modelValue"
      class="textarea textarea-bordered w-full transition-all duration-200 hover:border-primary focus:border-primary focus:outline-offset-0 resize-y min-h-[100px]"
      :class="[
        { 'textarea-error hover:border-error focus:border-error': hasError || error || errorMessage },
        { 'textarea-xs': size === 'xs' },
        { 'textarea-sm': size === 'sm' },
        { 'textarea-md': size === 'md' || !size },
        { 'textarea-lg': size === 'lg' },
        { 'bg-base-100': !disabled },
        { 'bg-base-200 cursor-not-allowed': disabled },
        customClass
      ]"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :rows="rows || 4"
      :maxlength="maxlength"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    ></textarea>
    
    <!-- Select -->
    <select
      v-else-if="type === 'select'"
      :value="modelValue"
      class="select select-bordered w-full transition-all duration-200 hover:border-primary focus:border-primary focus:outline-offset-0"
      :class="[
        { 'select-error hover:border-error focus:border-error': hasError || error || errorMessage },
        { 'select-xs': size === 'xs' },
        { 'select-sm': size === 'sm' },
        { 'select-md': size === 'md' || !size },
        { 'select-lg': size === 'lg' },
        { 'bg-base-100': !disabled },
        { 'bg-base-200 cursor-not-allowed': disabled },
        customClass
      ]"
      :disabled="disabled"
      @change="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    >
      <option v-if="placeholder" :value="undefined" disabled selected class="text-base-content/50">{{ placeholder }}</option>
      <slot name="options">
        <option
          v-for="option in options"
          :key="String(option.value)"
          :value="option.value"
          class="text-base-content"
        >
          {{ option.label }}
        </option>
      </slot>
    </select>
    
    
    <!-- File Input -->
    <input
      v-else-if="type === 'file'"
      type="file"
      class="file-input file-input-bordered w-full transition-all duration-200 hover:border-primary focus:border-primary focus:outline-offset-0"
      :class="[
        { 'file-input-error hover:border-error focus:border-error': hasError || error || errorMessage },
        { 'file-input-xs': size === 'xs' },
        { 'file-input-sm': size === 'sm' },
        { 'file-input-md': size === 'md' || !size },
        { 'file-input-lg': size === 'lg' },
        { 'bg-base-100': !disabled },
        { 'bg-base-200 cursor-not-allowed': disabled },
        customClass
      ]"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      @change="handleFileChange"
    />
    
    <!-- Search Input -->
    <div v-else-if="type === 'search'" class="form-control">
      <div class="relative">
        <input
          :value="modelValue"
          type="text"
          class="input input-bordered w-full transition-all duration-200 hover:border-primary focus:border-primary focus:outline-offset-0 pr-10"
          :class="[
            { 'input-error hover:border-error focus:border-error': hasError || error || errorMessage },
            { 'input-xs': size === 'xs' },
            { 'input-sm': size === 'sm' },
            { 'input-md': size === 'md' || !size },
            { 'input-lg': size === 'lg' },
            { 'bg-base-100': !disabled },
            { 'bg-base-200 cursor-not-allowed': disabled },
            customClass
          ]"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          @input="handleInput"
          @blur="handleBlur"
          @focus="handleFocus"
        />
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg class="w-4 h-4 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>
    </div>
    
    <!-- Checkbox -->
    <div v-else-if="type === 'checkbox'" class="form-control">
      <label class="label cursor-pointer justify-start gap-3 hover:bg-base-200/50 p-3 rounded-lg transition-colors duration-200">
        <input
          :checked="modelValue"
          type="checkbox"
          class="checkbox checkbox-primary transition-all duration-200"
          :class="[
            { 'checkbox-error': hasError || error || errorMessage },
            { 'checkbox-xs': size === 'xs' },
            { 'checkbox-sm': size === 'sm' },
            { 'checkbox-md': size === 'md' || !size },
            { 'checkbox-lg': size === 'lg' },
            { 'cursor-not-allowed opacity-50': disabled },
            customClass
          ]"
          :disabled="disabled"
          @change="handleInput"
        />
        <span class="label-text font-medium text-base-content">{{ checkboxLabel || label }}</span>
      </label>
    </div>
    
    <!-- Radio Group -->
    <div v-else-if="type === 'radio'" class="form-control">
      <div class="flex flex-wrap gap-4">
        <label
          v-for="option in options"
          :key="String(option.value)"
          class="label cursor-pointer"
        >
          <input
            :checked="modelValue === option.value"
            type="radio"
            :value="option.value"
            class="radio"
            :class="[
              { 'radio-error': hasError || error || errorMessage },
              { 'radio-xs': size === 'xs' },
              { 'radio-sm': size === 'sm' },
              { 'radio-md': size === 'md' },
              { 'radio-lg': size === 'lg' },
              customClass
            ]"
            :disabled="disabled"
            @change="handleInput"
          />
          <span class="label-text ml-2">{{ option.label }}</span>
        </label>
      </div>
    </div>
    
    <!-- Switch -->
    <div v-else-if="type === 'switch'" class="form-control">
      <label class="label cursor-pointer">
        <input
          :checked="modelValue"
          type="checkbox"
          class="toggle toggle-primary"
          :class="[
            { 'toggle-error': hasError || error || errorMessage },
            { 'toggle-xs': size === 'xs' },
            { 'toggle-sm': size === 'sm' },
            { 'toggle-md': size === 'md' },
            { 'toggle-lg': size === 'lg' },
            customClass
          ]"
          :disabled="disabled"
          @change="handleInput"
        />
        <span class="label-text ml-2">{{ switchLabel || label }}</span>
      </label>
    </div>
    
    <!-- Range -->
    <input
      v-else-if="type === 'range'"
      :value="modelValue"
      type="range"
      class="range range-primary"
      :class="[
        { 'range-error': hasError || error || errorMessage },
        { 'range-xs': size === 'xs' },
        { 'range-sm': size === 'sm' },
        { 'range-md': size === 'md' },
        { 'range-lg': size === 'lg' },
        customClass
      ]"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    />
    
    <!-- Help text -->
    <label v-if="helpText && !(error || errorMessage)" class="label">
      <span class="label-text-alt text-base-content/70 text-sm leading-relaxed">{{ helpText }}</span>
    </label>
    
    <!-- Error message -->
    <label v-if="error || errorMessage" class="label">
      <span class="label-text-alt text-error font-medium text-sm flex items-center gap-1">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.304 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        {{ error || errorMessage }}
      </span>
    </label>
    
    <!-- Character count for textarea -->
    <label v-if="type === 'textarea' && maxlength" class="label">
      <span class="label-text-alt text-base-content-60">
        {{ (modelValue || '').length }}/{{ maxlength }}
      </span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'

interface Option {
  value: string | number | boolean | null
  label: string
}

interface Props {
  modelValue?: any
  type?: 'input' | 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select' | 'file' | 'checkbox' | 'radio' | 'switch' | 'range' | 'multiselect' | 'search'
  inputType?: string
  label?: string
  placeholder?: string
  helpText?: string
  error?: string
  errorMessage?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  hasError?: boolean
  options?: Option[]
  rows?: number
  accept?: string
  multiple?: boolean
  checkboxLabel?: string
  switchLabel?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  customClass?: string
  min?: number | string
  max?: number | string
  step?: number | string
  maxlength?: number
  autocomplete?: string
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'blur'): void
  (e: 'focus'): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  inputType: 'text',
  required: false,
  disabled: false,
  readonly: false,
  hasError: false,
  options: () => [],
  rows: 3,
  multiple: false,
  size: 'md'
})

const emit = defineEmits<Emits>()

const getInputType = () => {
  if (props.type === 'email') { return 'email' }
  if (props.type === 'password') { return 'password' }
  if (props.type === 'number') { return 'number' }
  if (props.type === 'date') { return 'date' }
  return props.inputType
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  let value: any = target.value
  
  if (props.type === 'checkbox' || props.type === 'switch') {
    value = (target as HTMLInputElement).checked
  } else if (props.type === 'radio') {
    value = (target as HTMLInputElement).value
  } else if (props.type === 'range') {
    value = parseFloat((target as HTMLInputElement).value)
  } else if (props.inputType === 'number') {
    value = target.value ? parseFloat(target.value) : undefined
  }
  
  emit('update:modelValue', value)
}

const handleBlur = () => {
  emit('blur')
}

const handleFocus = () => {
  emit('focus')
}

const handleMultiselectChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const selectedValues = Array.from(target.selectedOptions).map(option => option.value)
  emit('update:modelValue', selectedValues)
}

const removeMultiselectValue = (value: any) => {
  if (Array.isArray(props.modelValue)) {
    const newValue = props.modelValue.filter(v => v !== value)
    emit('update:modelValue', newValue)
  }
}

const getOptionLabel = (value: any): string => {
  const option = props.options?.find(opt => opt.value === value)
  return option?.label || String(value)
}

// Watch for options changes to force re-render
watch(() => props.options, (newOptions, oldOptions) => {
  // Force re-render when options change
}, { deep: true, immediate: true })

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files) {
    emit('update:modelValue', props.multiple ? Array.from(files) : files[0])
  }
}
</script>