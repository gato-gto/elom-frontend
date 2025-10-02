/**
 * Композабл для работы с ошибками
 * Предоставляет удобный API для обработки ошибок в компонентах
 */

import { ref, computed } from 'vue'
import { handleApiErrorAsync, ErrorHandlers } from '@/utils/errorHandler'
import type { ParsedApiError } from '@/api/types/errors'

export function useErrorHandler() {
  const errors = ref<Record<string, string[]>>({})
  const loading = ref(false)
  const hasErrors = computed(() => Object.keys(errors.value).length > 0)

  /**
   * Очищает ошибки
   */
  const clearErrors = () => {
    errors.value = {}
  }

  /**
   * Устанавливает ошибку для конкретного поля
   */
  const setFieldError = (field: string, message: string) => {
    errors.value[field] = [message]
  }

  /**
   * Устанавливает ошибки полей
   */
  const setFieldErrors = (fieldErrors: Record<string, string[]>) => {
    errors.value = { ...fieldErrors }
  }

  /**
   * Обрабатывает ошибку и устанавливает состояние
   */
  const handleError = async (
    error: any,
    options: {
      operation: string
      entity?: string
      entityId?: number
      showToast?: boolean
    }
  ): Promise<ParsedApiError> => {
    const { operation, entity, entityId, showToast = true } = options

    const parsedError = await handleApiErrorAsync(error, {
      operation,
      entity,
      entityId
    })

    // Устанавливаем ошибки полей
    if (Object.keys(parsedError.fieldErrors).length > 0) {
      setFieldErrors(parsedError.fieldErrors)
    }

    return parsedError
  }

  /**
   * Обрабатывает ошибку валидации формы
   */
  const handleFormError = async (error: any, entity?: string) => {
    const parsedError = await ErrorHandlers.formValidation(error, entity)
    setFieldErrors(parsedError.fieldErrors)
    return parsedError
  }

  /**
   * Обрабатывает ошибку загрузки данных
   */
  const handleLoadingError = async (error: any, entity?: string) => {
    return ErrorHandlers.dataLoading(error, entity)
  }

  /**
   * Обрабатывает ошибку сохранения
   */
  const handleSaveError = async (error: any, entity?: string, entityId?: number) => {
    const parsedError = await ErrorHandlers.save(error, entity)
    setFieldErrors(parsedError.fieldErrors)
    return parsedError
  }

  /**
   * Обрабатывает ошибку удаления
   */
  const handleDeleteError = async (error: any, entity?: string, entityId?: number) => {
    return ErrorHandlers.delete(error, entity)
  }

  /**
   * Обрабатывает ошибку экспорта
   */
  const handleExportError = async (error: any, entity?: string) => {
    return ErrorHandlers.export(error)
  }

  /**
   * Выполняет операцию с обработкой ошибок
   */
  const executeWithErrorHandling = async <T>(
    operation: () => Promise<T>,
    options: {
      operation: string
      entity?: string
      entityId?: number
      showToast?: boolean
    }
  ): Promise<{ data?: T; error?: ParsedApiError }> => {
    loading.value = true
    clearErrors()

    try {
      const data = await operation()
      return { data }
    } catch (error) {
      const parsedError = await handleError(error, options)
      return { error: parsedError }
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    errors: computed(() => errors.value),
    loading: computed(() => loading.value),
    hasErrors,

    // Methods
    clearErrors,
    setFieldError,
    setFieldErrors,
    handleError,
    handleFormError,
    handleLoadingError,
    handleSaveError,
    handleDeleteError,
    handleExportError,
    executeWithErrorHandling
  }
}

/**
 * Специализированный композабл для форм
 */
export function useFormErrorHandler() {
  const { errors, loading, clearErrors, setFieldErrors, handleFormError, executeWithErrorHandling } = useErrorHandler()

  /**
   * Обрабатывает отправку формы с обработкой ошибок
   */
  const submitForm = async <T>(
    submitFn: () => Promise<T>,
    options: {
      entity?: string
      onSuccess?: (data: T) => void
      onError?: (error: ParsedApiError) => void
    } = {}
  ): Promise<{ success: boolean; data?: T; error?: ParsedApiError }> => {
    const { entity, onSuccess, onError } = options

    const result = await executeWithErrorHandling(submitFn, {
      operation: 'form_submit',
      entity,
      showToast: false // Управляем показом toast вручную
    })

    if (result.data) {
      clearErrors()
      onSuccess?.(result.data)
      return { success: true, data: result.data }
    } else {
      onError?.(result.error!)
      return { success: false, error: result.error }
    }
  }

  return {
    errors,
    loading,
    clearErrors,
    setFieldErrors,
    handleFormError,
    submitForm
  }
}






