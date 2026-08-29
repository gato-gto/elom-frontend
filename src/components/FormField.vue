<template>
  <div class="form-control w-full">
    <!-- Label -->
    <label v-if="label" class="label">
      <span class="label-text font-medium text-base-content">{{ label }}</span>
      <span v-if="required" class="label-text-alt text-primary font-semibold">*</span>
    </label>
    
    <!-- Input -->
    <input
      v-if="type === 'input' || type === 'text' || type === 'email' || type === 'password' || type === 'number' || type === 'date' || type === 'tel'"
      :value="modelValue"
      :type="getInputType()"
      :inputmode="resolvedInputMode"
      :autocapitalize="resolvedAutocapitalize"
      :autocorrect="resolvedAutocorrect"
      :spellcheck="resolvedSpellcheck"
      :name="uniqueFieldName"
      class="input input-bordered w-full transition-all duration-200 hover:border-primary focus:border-primary focus:outline-offset-0"
      :class="[
        { 'input-error hover:border-error focus:border-error': hasError || error || errorMessage },
        { 'input-xs': size === 'xs' },
        { 'input-sm': size === 'sm' },
        { 'input-md': size === 'md' || !size },
        { 'input-lg': size === 'lg' },
        { '': !disabled },
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
      :autocomplete="autocomplete || 'off'"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    />
    
    <!-- Textarea -->
    <textarea
      v-else-if="type === 'textarea'"
      :value="modelValue"
      class="textarea textarea-bordered w-full transition-all duration-200 hover:border-primary focus:border-primary focus:outline-offset-0 resize-y"
      :class="[
        { 'textarea-error hover:border-error focus:border-error': hasError || error || errorMessage },
        { 'textarea-xs': size === 'xs' },
        { 'textarea-sm': size === 'sm' },
        { 'textarea-md': size === 'md' || !size },
        { 'textarea-lg': size === 'lg' },
        { '': !disabled },
        { 'bg-base-200 cursor-not-allowed': disabled },
        // Применяем min-h только если rows не задан или >= 4, и customClass не переопределяет min-h
        { 'min-h-[100px]': (!rows || rows >= 4) && !customClass?.includes('min-h') },
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
        { '': !disabled },
        { 'bg-base-200 cursor-not-allowed': disabled },
        customClass
      ]"
      :disabled="disabled"
      @change="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    >
      <!-- F-1035: value="" (не :value="undefined" — Vue снимал атрибут, значением опции становился её текст, и при
           пустом modelValue селект оставался без выбранной опции → пустое поле вместо плейсхолдера на WebKit) -->
      <option v-if="placeholder" value="" disabled selected class="text-subtle">{{ placeholder }}</option>
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
        { '': !disabled },
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
          :name="uniqueFieldName + '_search'"
          class="input input-bordered w-full transition-all duration-200 hover:border-primary focus:border-primary focus:outline-offset-0 pr-10"
          :class="[
            { 'input-error hover:border-error focus:border-error': hasError || error || errorMessage },
            { 'input-xs': size === 'xs' },
            { 'input-sm': size === 'sm' },
            { 'input-md': size === 'md' || !size },
            { 'input-lg': size === 'lg' },
            { '': !disabled },
            { 'bg-base-200 cursor-not-allowed': disabled },
            customClass
          ]"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          autocomplete="off"
          @input="handleInput"
          @blur="handleBlur"
          @focus="handleFocus"
        />
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg class="w-4 h-4 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div class="flex flex-wrap gap-2 md:gap-4">
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
      <span class="label-text-alt text-muted text-sm leading-relaxed">{{ helpText }}</span>
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
import { watch, computed } from 'vue'
import { selectAllOnFocus } from '@/utils/numberInput'  // F-1017: тап в числовое поле выделяет значение

// Generate unique field name to prevent browser autocomplete recognition
const uniqueFieldName = `field_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`

interface Option {
  value: string | number | boolean | null
  label: string
}

interface Props {
  modelValue?: any
  type?: 'input' | 'text' | 'email' | 'password' | 'number' | 'date' | 'tel' | 'textarea' | 'select' | 'file' | 'checkbox' | 'radio' | 'switch' | 'range' | 'multiselect' | 'search'
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
  /** A-05 (F-522): iOS-клавиатура. Явное значение перекрывает авто-вывод по типу. */
  inputmode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url' | 'none'
  /** A-08 (F-522): поле-код (артикул/№/инвентарный) — iOS не должен капитализировать/исправлять. */
  code?: boolean
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
  if (props.type === 'tel') { return 'tel' }
  if (props.type === 'search') { return 'search' }
  return props.inputType
}

// A-05/A-08/A-10 (F-522): iOS-корректные атрибуты ввода.
// Кодовые/спец-типы не должны автокапитализироваться/автокорректироваться (артикулы, e-mail, коды).
const CODE_TYPES = ['number', 'email', 'password', 'tel', 'search', 'url']
const isCodeLike = computed(() =>
  !!props.code || CODE_TYPES.includes(String(props.type)) || CODE_TYPES.includes(String(props.inputType)),
)
type InputMode = 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url' | 'none'
const resolvedInputMode = computed<InputMode | undefined>(() => {
  if (props.inputmode) { return props.inputmode }
  switch (props.type) {
    case 'number': return 'decimal' // цифры + разделитель для цены/дробных
    case 'tel': return 'tel'
    case 'email': return 'email'
    default: return undefined
  }
})
const resolvedAutocapitalize = computed(() => (isCodeLike.value ? 'off' : undefined))
const resolvedAutocorrect = computed(() => (isCodeLike.value ? 'off' : undefined))
const resolvedSpellcheck = computed<boolean | undefined>(() => (isCodeLike.value ? false : undefined))

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

const handleFocus = (e?: Event) => {
  // F-1017: для числовых полей тап выделяет всё значение — ввод перезаписывает «0»/«1»/префилл
  // без ручного стирания (задача владельца). Остальные типы не трогаем (курсор-позиция важна).
  if (props.type === 'number' && e) { selectAllOnFocus(e) }
  emit('focus')
}

// Watch for options changes to force re-render
watch(() => props.options, () => {
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