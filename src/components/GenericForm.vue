<template>
  <form class="grid gap-2 md:gap-4" autocomplete="off" @submit.prevent="submit">
    <!-- Form Sections as Cards -->
    <div v-if="config.sections && config.sections.length > 0">
      <div
        v-for="(section, index) in sections"
        :key="index"
        class=""
      >
        <div class="">
          <h2 class="card-title text-lg mb-4">{{ section.title }}</h2>
          <p v-if="section.description" class="text-base-content/70 text-sm mb-4">{{ section.description }}</p>

          <div class="grid md:grid-cols-2 gap-2 md:gap-4">
            <template v-for="field in getSectionFields(index)" :key="field.key">
              <!-- Проверяем условие отображения поля -->
              <template v-if="!field.condition || field.condition()">
                <!-- Custom field slot -->
                <div v-if="field.type === 'custom'" :class="{ 'md:col-span-2': field.width === 'full' }">
                  <slot :name="`field-${field.key}`" :field="field" :value="form[field.key]" :error="getFieldError(field.key)" :disabled="field.disabled || isSubmitting" />
                </div>
              <!-- Regular FormField -->
              <FormField
                v-else
                v-model="form[field.key]"
                :label="field.label"
                :type="field.type"
                :placeholder="field.placeholder"
                :required="field.required"
                :disabled="field.disabled || isSubmitting"
                :error="getFieldError(field.key) || undefined"
                :options="field.options"
                :help="field.help"
                :rows="field.rows"
                :step="field.step"
                :min="field.validation?.min"
                :max="field.validation?.max"
                :accept="field.accept"
                :multiple="field.multiple"
                :checkboxLabel="field.checkboxLabel"
                :switchLabel="field.switchLabel"
                :customClass="field.customClass"
                :autocomplete="field.autocomplete"
                :class="{
                  'md:col-span-2': field.width === 'full'
                }"
                @update:model-value="handleFieldChange(field.key, $event)"
              />
              </template>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Simple Form (no sections) as Single Card -->
    <div v-else class="">
      <div class="">
        <p v-if="config.subtitle" class="text-base-content/70 text-sm mb-4">{{ config.subtitle }}</p>

        <div class="grid md:grid-cols-2 gap-4">
          <template v-for="field in sortedFields" :key="field.key">
            <!-- Проверяем условие отображения поля -->
            <template v-if="!field.condition || field.condition()">
              <!-- Custom field slot -->
              <div v-if="field.type === 'custom'" :class="{ 'md:col-span-2': field.width === 'full' }">
                <slot :name="`field-${field.key}`" :field="field" :value="form[field.key]" :error="getFieldError(field.key)" :disabled="field.disabled || isSubmitting" />
              </div>
              <!-- Regular FormField -->
              <FormField
                v-else
                v-model="form[field.key]"
                :label="field.label"
                :type="field.type"
                :placeholder="field.placeholder"
                :required="field.required"
                :disabled="field.disabled || isSubmitting"
                :error="getFieldError(field.key) || undefined"
                :options="field.options"
                :help="field.help"
                :rows="field.rows"
                :step="field.step"
                :min="field.validation?.min"
                :max="field.validation?.max"
                :accept="field.accept"
                :multiple="field.multiple"
                :checkboxLabel="field.checkboxLabel"
                :switchLabel="field.switchLabel"
                :customClass="field.customClass"
                :autocomplete="field.autocomplete"
                :class="{
                  'md:col-span-2': field.width === 'full'
                }"
                @update:model-value="handleFieldChange(field.key, $event)"
              />
            </template>
          </template>
        </div>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="flex justify-end gap-2">
      <button
        v-if="config.showCancel"
        type="button"
        class="btn btn-outline"
        @click="handleCancel"
        :disabled="isSubmitting"
      >
        {{ config.cancelText || 'Отмена' }}
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="isSubmitting"
      >
        <svg v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        {{ isSubmitting ? 'Сохранение...' : (config.submitText || 'Сохранить') }}
      </button>
    </div>

    <!-- Non-field errors -->
    <div v-if="getFieldError('non_field_errors')" class="alert alert-error">
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="font-medium">{{ getFieldError('non_field_errors') }}</span>
    </div>

    <!-- Form Status -->
    <div v-if="isDirty && !isSubmitting" class="alert alert-info">
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="font-medium">Форма содержит несохраненные изменения</span>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import type { GenericFormConfig, FieldConfig } from '@/types/generic'
import { useGenericForm, useFormSections } from '@/composables/useGenericForm'
import FormField from './FormField.vue'

// Props
interface Props<T = any> {
  config: GenericFormConfig<T>
  initialData?: Partial<T>
  onSubmit: (data: T) => Promise<void>
  onCancel?: () => void
  validateOnChange?: boolean
  resetOnSubmit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  validateOnChange: true,
  resetOnSubmit: false
})

// Emits
const emit = defineEmits<{
  saved: [data: any]
  cancelled: []
  'field-change': [key: string, value: any]
}>()

// Use composables
const {
  form,
  errors,
  isSubmitting,
  isDirty,
  isValid,
  submit: submitForm,
  reset: resetForm,
  setFieldValue,
  setFieldError,
  clearErrors,
  validate,
  getFieldValue,
  getFieldError,
  isFieldTouched
} = useGenericForm({
  initialData: props.initialData,
  config: props.config,
  onSubmit: props.onSubmit,
  onCancel: props.onCancel,
  validateOnChange: props.validateOnChange,
  resetOnSubmit: props.resetOnSubmit
})

const {
  activeSection,
  sections,
  currentSection,
  sectionErrors,
  hasSectionErrors,
  nextSection,
  previousSection,
  goToSection,
  getSectionFields,
  validateSection
} = useFormSections(props.config)

// Computed
const sortedFields = computed(() => {
  const fields = [...props.config.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
  const materialField = fields.find(f => f.key === 'material')
  if (materialField) {
    console.log('GenericForm sortedFields - material field options:', materialField.options?.length || 0)
  }
  return fields
})

// Methods
async function submit() {
  try {
    await submitForm()
    emit('saved', form.value)
  } catch (error) {
    console.error('Form submission error:', error)
  }
}

function reset() {
  resetForm()
}

function handleCancel() {
  if (props.onCancel) {
    props.onCancel()
  }
  emit('cancelled')
}

function handleFieldChange(key: string, value: any) {
  setFieldValue(key, value)
  emit('field-change', key, value)
}

// Watch for config changes to update form fields
         watch(() => props.config, (newConfig) => {
           // Force re-render of form fields when config changes
           // This ensures that dynamic options (like material options) are updated
         }, { deep: true })

// Lifecycle
onMounted(() => {
  // Don't validate on mount to avoid showing errors immediately
  // Validation will happen on user interaction or form submission
})
</script>

<style scoped>
.generic-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .generic-form {
    gap: 1.5rem;
  }
}

/* All form styles moved to template classes */

.form-sections {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .form-sections {
    gap: 1.5rem;
  }
}

/* All section styles moved to template classes */

/* All remaining styles moved to template classes */
</style>