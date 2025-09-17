<template>
  <div class="form-control">
    <label v-if="label" class="label">
      <span class="label-text">{{ label }}</span>
      <span v-if="required" class="label-text-alt text-error">*</span>
    </label>
    
    <!-- Input -->
    <input
      v-if="type === 'input'"
      :value="modelValue"
      :type="inputType"
      class="input input-bordered input-sm"
      :class="{ 'input-error': hasError }"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      @input="handleInput"
      @blur="handleBlur"
    />
    
    <!-- Textarea -->
    <textarea
      v-else-if="type === 'textarea'"
      :value="modelValue"
      class="textarea textarea-bordered textarea-sm"
      :class="{ 'textarea-error': hasError }"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :rows="rows"
      @input="handleInput"
      @blur="handleBlur"
    ></textarea>
    
    <!-- Select -->
    <select
      v-else-if="type === 'select'"
      :value="modelValue"
      class="select select-bordered select-sm"
      :class="{ 'select-error': hasError }"
      :disabled="disabled"
      @change="handleInput"
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
    
    <!-- File Input -->
    <input
      v-else-if="type === 'file'"
      type="file"
      class="file-input file-input-bordered file-input-sm w-full"
      :class="{ 'file-input-error': hasError }"
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
          class="checkbox checkbox-sm"
          :class="{ 'checkbox-error': hasError }"
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
          :key="option.value"
          class="label cursor-pointer"
        >
          <input
            :checked="modelValue === option.value"
            type="radio"
            :value="option.value"
            class="radio radio-sm"
            :class="{ 'radio-error': hasError }"
            :disabled="disabled"
            @change="handleInput"
          />
          <span class="label-text ml-2">{{ option.label }}</span>
        </label>
      </div>
    </div>
    
    <!-- Custom slot content -->
    <slot v-if="$slots.default" />
    
    <!-- Help text -->
    <label v-if="helpText" class="label">
      <span class="label-text-alt">{{ helpText }}</span>
    </label>
    
    <!-- Error message -->
    <label v-if="errorMessage" class="label">
      <span class="label-text-alt text-error">{{ errorMessage }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Option {
  value: string | number
  label: string
}

interface Props {
  modelValue?: any
  type?: 'input' | 'textarea' | 'select' | 'file' | 'checkbox' | 'radio'
  inputType?: string
  label?: string
  placeholder?: string
  helpText?: string
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
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'blur'): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'input',
  inputType: 'text',
  required: false,
  disabled: false,
  readonly: false,
  hasError: false,
  options: () => [],
  rows: 3,
  multiple: false
})

const emit = defineEmits<Emits>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  let value: any = target.value
  
  if (props.type === 'checkbox') {
    value = (target as HTMLInputElement).checked
  } else if (props.type === 'radio') {
    value = (target as HTMLInputElement).value
  }
  
  emit('update:modelValue', value)
}

const handleBlur = () => {
  emit('blur')
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files) {
    emit('update:modelValue', props.multiple ? Array.from(files) : files[0])
  }
}
</script>
