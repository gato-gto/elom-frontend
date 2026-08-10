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
      type="number" inputmode="decimal"
      @focus="selectAllOnFocus"
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
      :value="modelValue === undefined ? 'undefined' : String(modelValue || '')"
      :disabled="disabled"
      class="filter-select"
      @change="handleSelectChange"
    >
      <option v-for="option in options" :key="String(option.value)" :value="option.value === undefined ? 'undefined' : String(option.value || '')">
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
    
    <!-- Checkbox -->
    <div v-else-if="type === 'checkbox'" class="filter-checkbox">
      <!-- F-865 (mobile-audit): py-2 → высота ряда ~36px (было ~20px, тонковато для тапа) -->
      <label class="flex items-center gap-2 cursor-pointer py-2">
        <input
          type="checkbox"
          :checked="Boolean(modelValue)"
          :disabled="disabled"
          class="checkbox checkbox-sm"
          @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
        />
        <span class="text-sm">{{ label }}</span>
      </label>
    </div>
    
    <!-- Multiselect -->
    <div v-else-if="type === 'multiselect'" class="filter-multiselect">
      <select
        :value="Array.isArray(modelValue) ? modelValue : []"
        :disabled="disabled"
        multiple
        class="filter-select"
        @change="handleMultiselectChange"
      >
        <option
          v-for="option in options"
          :key="String(option.value)"
          :value="String(option.value)"
        >
          {{ option.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { selectAllOnFocus } from '@/utils/numberInput'  // F-1017: тап выделяет значение

interface Option {
  value: string | number | boolean | undefined
  label: string
}

interface Props {
  modelValue?: string | number | boolean | null | (string | number)[]
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'month' | 'select' | 'textarea' | 'checkbox' | 'multiselect'
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
  'update:modelValue': [value: string | number | boolean | null | undefined | (string | number)[]]
}>()

function handleSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const value = target.value
  
  // Если значение пустое или равно 'undefined', возвращаем undefined
  if (value === '' || value === 'undefined') {
    emit('update:modelValue', undefined)
  } else {
    // Проверяем, является ли значение числом
    const numValue = Number(value)
    if (!isNaN(numValue) && value !== '') {
      emit('update:modelValue', numValue)
    } else {
      emit('update:modelValue', value)
    }
  }
}

function handleMultiselectChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const selectedValues = Array.from(target.selectedOptions).map(option => option.value)
  emit('update:modelValue', selectedValues)
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
  color: hsl(var(--bc));
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.required-mark {
  color: hsl(var(--er));
  font-weight: 600;
}

.filter-input,
.filter-select,
.filter-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid hsl(var(--control-border));  /* F-313: видимая граница ≥3:1 (было --b3 = 1.41:1) */
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  background: hsl(var(--b1));
  color: hsl(var(--bc));
}

/* APPLE-4 (F-516): на мобильных поля фильтров ≥16px — иначе iOS зумит страницу при фокусе.
   Замерено ВЖИВУЮ под ролью на проде: .filter-input/.filter-select рендерились 14px → зум.
   Правило в scoped-стилях компонента (та же специфичность, что базовое, но позже в каскаде),
   иначе глобальное правило не перебивало scoped-селектор. Десктоп остаётся на 14px (плотность). */
/* F-1011: + pointer:coarse (sibling components.css) — iPad-ландшафт шире 1023px, но зумит так же. */
@media (max-width: 1023px), (pointer: coarse) {
  .filter-input,
  .filter-select,
  .filter-textarea {
    font-size: 16px;
  }
}

/* F-313: плейсхолдеры фильтр-полей — сплошной третичный токен (не наследуют .input-правило) */
.filter-input::placeholder,
.filter-textarea::placeholder {
  color: hsl(var(--tx-3));
  opacity: 1;
}

/* copper focus ring — design mandate for field visibility */
.filter-input:focus,
.filter-select:focus,
.filter-textarea:focus {
  outline: none;
  border-color: hsl(var(--p));
  box-shadow: 0 0 0 2px hsl(var(--p) / 0.3);
}

.filter-input:hover:not(:disabled),
.filter-select:hover:not(:disabled),
.filter-textarea:hover:not(:disabled) {
  border-color: hsl(var(--tx-3));  /* F-313: заметный hover (было bc/0.4 = 2.4:1) */
}

.filter-input:disabled,
.filter-select:disabled,
.filter-textarea:disabled {
  background: hsl(var(--b2));
  color: hsl(var(--tx-3));
  cursor: not-allowed;
}

.filter-select {
  cursor: pointer;
  /* прячем нативную стрелку <select> — иначе двойная стрелка рядом с кастомной */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%235C6B74' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
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
