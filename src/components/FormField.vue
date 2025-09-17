<template>
  <div class="form-control">
    <!-- Label -->
    <label v-if="label" class="label">
      <span class="label-text font-medium">{{ label }}</span>
      <span v-if="required" class="label-text-alt text-error">*</span>
    </label>
    
    <!-- Input -->
    <input
      v-if="type === 'input' || type === 'text' || type === 'email' || type === 'password' || type === 'number'"
      :value="modelValue"
      :type="getInputType()"
      class="input input-bordered w-full"
      :class="[
        { 'input-error': hasError || error || errorMessage },
        { 'input-xs': size === 'xs' },
        { 'input-sm': size === 'sm' },
        { 'input-md': size === 'md' },
        { 'input-lg': size === 'lg' },
        customClass
      ]"
      :placeholder="placeholder"
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
      class="textarea textarea-bordered w-full"
      :class="[
        { 'textarea-error': hasError || error || errorMessage },
        { 'textarea-xs': size === 'xs' },
        { 'textarea-sm': size === 'sm' },
        { 'textarea-md': size === 'md' },
        { 'textarea-lg': size === 'lg' },
        customClass
      ]"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :rows="rows"
      :maxlength="maxlength"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    ></textarea>
    
    <!-- Select -->
    <select
      v-else-if="type === 'select'"
      :value="modelValue"
      class="select select-bordered w-full"
      :class="[
        { 'select-error': hasError || error || errorMessage },
        { 'select-xs': size === 'xs' },
        { 'select-sm': size === 'sm' },
        { 'select-md': size === 'md' },
        { 'select-lg': size === 'lg' },
        customClass
      ]"
      :disabled="disabled"
      @change="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    >
      <option v-if="placeholder" :value="undefined" disabled selected>{{ placeholder }}</option>
      <slot name="options">
        <option
          v-for="option in options"
          :key="String(option.value)"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </slot>
    </select>
    
    <!-- File Input -->
    <input
      v-else-if="type === 'file'"
      type="file"
      class="file-input file-input-bordered w-full"
      :class="[
        { 'file-input-error': hasError || error || errorMessage },
        { 'file-input-xs': size === 'xs' },
        { 'file-input-sm': size === 'sm' },
        { 'file-input-md': size === 'md' },
        { 'file-input-lg': size === 'lg' },
        customClass
      ]"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      @change="handleFileChange"
    />
    
    <!-- Checkbox -->
    <div v-else-if="type === 'checkbox'" class="form-control">
      <label class="label cursor-pointer">
        <input
          :checked="modelValue"
          type="checkbox"
          class="checkbox"
          :class="[
            { 'checkbox-error': hasError || error || errorMessage },
            { 'checkbox-xs': size === 'xs' },
            { 'checkbox-sm': size === 'sm' },
            { 'checkbox-md': size === 'md' },
            { 'checkbox-lg': size === 'lg' },
            customClass
          ]"
          :disabled="disabled"
          @change="handleInput"
        />
        <span class="label-text ml-2">{{ checkboxLabel || label }}</span>
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
    <label v-if="helpText" class="label">
      <span class="label-text-alt text-base-content-70">{{ helpText }}</span>
    </label>
    
    <!-- Error message -->
    <label v-if="error || errorMessage" class="label">
      <span class="label-text-alt text-error">{{ error || errorMessage }}</span>
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
import { computed } from 'vue'

interface Option {
  value: string | number | boolean
  label: string
}

interface Props {
  modelValue?: any
  type?: 'input' | 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select' | 'file' | 'checkbox' | 'radio' | 'switch' | 'range'
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
  if (props.type === 'email') return 'email'
  if (props.type === 'password') return 'password'
  if (props.type === 'number') return 'number'
  if (props.type === 'date') return 'date'
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

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files) {
    emit('update:modelValue', props.multiple ? Array.from(files) : files[0])
  }
}
</script>