import { ref, computed, watch, nextTick } from 'vue'
import type { GenericFormConfig, UseGenericFormOptions, UseGenericFormReturn } from '@/types/generic'
import { useErrorHandler } from './useErrorHandler'

/**
 * Composable for managing generic forms with validation, submission, and error handling
 */
export function useGenericForm<T extends Record<string, any>>(
  options: UseGenericFormOptions<T>
): UseGenericFormReturn<T> {
  const { handleFormError } = useErrorHandler()
  
  // State
  const form = ref<T>({ ...options.initialData } as T)
  const errors = ref<Record<string, string>>({})
  const isSubmitting = ref(false)
  const isDirty = ref(false)
  const touched = ref<Set<string>>(new Set())

  // Computed
  const isValid = computed(() => {
    // Don't validate on computed property to avoid showing errors immediately
    // Just check if there are no current errors
    return Object.keys(errors.value).length === 0
  })

  // Methods
  function setFieldValue(key: string, value: any) {
    form.value[key] = value
    isDirty.value = true
    touched.value.add(key)
    
    // Clear error for this field when user starts typing
    if (errors.value[key]) {
      delete errors.value[key]
    }
    
    // Validate field if validation is enabled
    if (options.validateOnChange) {
      validateField(key)
    }
  }

  function setFieldError(key: string, error: string) {
    errors.value[key] = error
  }

  function clearErrors() {
    errors.value = {}
  }

  function validateField(key: string): boolean {
    const field = options.config.fields.find(f => f.key === key)
    if (!field) return true

    const value = form.value[key]
    let isValid = true

    // Required validation - only show error if field is touched or form is being submitted
    if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
      // Only show required field error if field has been touched or form is being submitted
      if (touched.value.has(key) || isSubmitting.value) {
        setFieldError(key, `${field.label} обязательно для заполнения`)
        isValid = false
      }
    }

    // Type-specific validation - only show errors if field is touched or form is being submitted
    if (value && field.validation && (touched.value.has(key) || isSubmitting.value)) {
      const validation = field.validation

      // String length validation
      if (typeof value === 'string') {
        if (validation.minLength && value.length < validation.minLength) {
          setFieldError(key, `${field.label} должно содержать минимум ${validation.minLength} символов`)
          isValid = false
        }
        if (validation.maxLength && value.length > validation.maxLength) {
          setFieldError(key, `${field.label} должно содержать максимум ${validation.maxLength} символов`)
          isValid = false
        }
      }

      // Number validation
      if (typeof value === 'number') {
        if (validation.min !== undefined && value < validation.min) {
          setFieldError(key, `${field.label} должно быть не менее ${validation.min}`)
          isValid = false
        }
        if (validation.max !== undefined && value > validation.max) {
          setFieldError(key, `${field.label} должно быть не более ${validation.max}`)
          isValid = false
        }
      }

      // Pattern validation
      if (validation.pattern && typeof value === 'string' && !validation.pattern.test(value)) {
        setFieldError(key, `${field.label} имеет неверный формат`)
        isValid = false
      }

      // Custom validation
      if (validation.custom) {
        const customError = validation.custom(value)
        if (customError) {
          setFieldError(key, customError)
          isValid = false
        }
      }
    }

    return isValid
  }

  function validateForm(): boolean {
    let isValid = true
    clearErrors()

    // Mark all fields as touched when validating the entire form
    for (const field of options.config.fields) {
      touched.value.add(field.key)
    }

    for (const field of options.config.fields) {
      if (!validateField(field.key)) {
        isValid = false
      }
    }

    return isValid
  }

  async function submit() {
    if (!validateForm()) {
      return
    }

    isSubmitting.value = true
    try {
      await options.onSubmit(form.value)
      
      if (options.resetOnSubmit) {
        reset()
      }
    } catch (error) {
      const parsedError = await handleFormError(error, 'form')
      
      // Устанавливаем ошибки полей в форме
      Object.keys(parsedError.fieldErrors).forEach(field => {
        const fieldError = parsedError.fieldErrors[field]
        setFieldError(field, Array.isArray(fieldError) ? fieldError[0] : fieldError)
      })
    } finally {
      isSubmitting.value = false
    }
  }

  function reset() {
    form.value = { ...options.initialData } as T
    errors.value = {}
    isDirty.value = false
    touched.value.clear()
  }

  function setFormData(data: Partial<T>) {
    form.value = { ...form.value, ...data }
    isDirty.value = true
  }

  function getFieldValue(key: string) {
    return form.value[key]
  }

  function hasFieldError(key: string): boolean {
    return !!errors.value[key]
  }

  function getFieldError(key: string): string {
    // Проверяем прямую ошибку
    if (errors.value[key]) {
      return errors.value[key]
    }
    
    // Проверяем вложенные ошибки для массивов (например, items[0].material)
    const arrayMatch = key.match(/^(.+)\[(\d+)\]\.(.+)$/)
    if (arrayMatch) {
      const [, arrayKey, index, fieldKey] = arrayMatch
      const nestedKey = `${arrayKey}[${index}].${fieldKey}`
      return errors.value[nestedKey] || ''
    }
    
    // Проверяем вложенные ошибки для объектов (например, object.name)
    const objectMatch = key.match(/^(.+)\.(.+)$/)
    if (objectMatch) {
      const [, objectKey, fieldKey] = objectMatch
      const nestedKey = `${objectKey}.${fieldKey}`
      return errors.value[nestedKey] || ''
    }
    
    return ''
  }

  function isFieldTouched(key: string): boolean {
    return touched.value.has(key)
  }

  function isFieldDirty(key: string): boolean {
    return form.value[key] !== options.initialData?.[key]
  }

  // Watch for form changes to update dirty state
  watch(
    form,
    (newForm) => {
      isDirty.value = JSON.stringify(newForm) !== JSON.stringify(options.initialData)
    },
    { deep: true }
  )

  return {
    form: form as Ref<T>,
    errors,
    isSubmitting,
    isDirty,
    isValid,
    submit,
    reset,
    setFieldValue,
    setFieldError,
    clearErrors,
    validate: validateForm,
    setFormData,
    getFieldValue,
    // hasFieldError,
    getFieldError,
    isFieldTouched,
    // isFieldDirty
  }
}

/**
 * Composable for managing file uploads in forms
 */
export function useFileUpload() {
  const uploading = ref(false)
  const uploadProgress = ref(0)
  const uploadedFiles = ref<File[]>([])

  async function uploadFile(file: File, endpoint: string): Promise<string> {
    uploading.value = true
    uploadProgress.value = 0

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      uploadedFiles.value.push(file)
      return result.url || result.file_url
    } catch (error) {
      console.error('File upload error:', error)
      throw error
    } finally {
      uploading.value = false
      uploadProgress.value = 0
    }
  }

  function removeFile(file: File) {
    const index = uploadedFiles.value.indexOf(file)
    if (index > -1) {
      uploadedFiles.value.splice(index, 1)
    }
  }

  function clearFiles() {
    uploadedFiles.value = []
  }

  return {
    uploading,
    uploadProgress,
    uploadedFiles,
    uploadFile,
    removeFile,
    clearFiles
  }
}

/**
 * Composable for managing form sections and field grouping
 */
export function useFormSections<T extends Record<string, any>>(
  config: GenericFormConfig<T>
) {
  const activeSection = ref(0)
  const sectionErrors = ref<Record<number, number>>({})

  const sections = computed(() => {
    if (!config.sections) {
      return [{
        title: 'Основная информация',
        fields: config.fields.map(f => f.key)
      }]
    }
    return config.sections.sort((a, b) => (a.order || 0) - (b.order || 0))
  })

  const currentSection = computed(() => sections.value[activeSection.value])

  function nextSection() {
    if (activeSection.value < sections.value.length - 1) {
      activeSection.value++
    }
  }

  function previousSection() {
    if (activeSection.value > 0) {
      activeSection.value--
    }
  }

  function goToSection(index: number) {
    if (index >= 0 && index < sections.value.length) {
      activeSection.value = index
    }
  }

  function getSectionFields(sectionIndex: number) {
    const section = sections.value[sectionIndex]
    if (!section) return []
    
    return config.fields.filter(field => section.fields.includes(field.key))
  }

  function validateSection(sectionIndex: number, formData: T): boolean {
    const fields = getSectionFields(sectionIndex)
    let errorCount = 0

    for (const field of fields) {
      if (field.required && !formData[field.key]) {
        errorCount++
      }
    }

    sectionErrors.value[sectionIndex] = errorCount
    return errorCount === 0
  }

  const hasSectionErrors = computed(() => {
    return Object.values(sectionErrors.value).some(count => count > 0)
  })

  return {
    activeSection,
    sections,
    currentSection,
    sectionErrors,
    hasSectionErrors,
    nextSection,
    previousSection,
    goToSection,
    getSectionFields,
    validateSection: (sectionIndex: number) => validateSection(sectionIndex, {} as T)
  }
}

/**
 * Composable for managing form auto-save functionality
 */
export function useFormAutoSave<T extends Record<string, any>>(
  form: Ref<T>,
  saveKey: string,
  interval: number = 30000 // 30 seconds
) {
  const isAutoSaving = ref(false)
  const lastSaved = ref<Date | null>(null)
  const autoSaveEnabled = ref(true)

  let autoSaveTimer: NodeJS.Timeout | null = null

  function startAutoSave() {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
    }

    autoSaveTimer = setInterval(async () => {
      if (autoSaveEnabled.value && form.value) {
        await saveToLocalStorage()
      }
    }, interval)
  }

  function stopAutoSave() {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  async function saveToLocalStorage() {
    try {
      isAutoSaving.value = true
      localStorage.setItem(saveKey, JSON.stringify(form.value))
      lastSaved.value = new Date()
    } catch (error) {
      console.warn('Auto-save failed:', error)
    } finally {
      isAutoSaving.value = false
    }
  }

  function loadFromLocalStorage(): T | null {
    try {
      const saved = localStorage.getItem(saveKey)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.warn('Failed to load auto-saved data:', error)
      return null
    }
  }

  function clearAutoSave() {
    try {
      localStorage.removeItem(saveKey)
      lastSaved.value = null
    } catch (error) {
      console.warn('Failed to clear auto-saved data:', error)
    }
  }

  // Start auto-save when component mounts
  onMounted(() => {
    startAutoSave()
  })

  // Stop auto-save when component unmounts
  onUnmounted(() => {
    stopAutoSave()
  })

  return {
    isAutoSaving,
    lastSaved,
    autoSaveEnabled,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearAutoSave,
    startAutoSave,
    stopAutoSave
  }
}

// Import Vue types
import type { Ref } from 'vue'
import { onMounted, onUnmounted } from 'vue'