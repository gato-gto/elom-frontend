/**
 * Универсальная обработка ошибок API
 * Согласно схеме API: {"detail": "...", "errors": {...}}
 */

export interface ApiErrorResponse {
  detail: string
  errors: Record<string, string[]>
}

export interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  fallbackMessage?: string
}

/**
 * Обрабатывает ошибку API и возвращает структурированные данные
 */
export function handleApiError(
  error: any,
  options: ErrorHandlerOptions = {}
): {
  detail: string
  fieldErrors: Record<string, string>
  hasErrors: boolean
} {
  const {
    showToast = true,
    logError = true,
    fallbackMessage = 'Произошла ошибка'
  } = options

  if (logError) {
    console.error('API Error:', error)
  }

  // Инициализация результата
  const result = {
    detail: fallbackMessage,
    fieldErrors: {} as Record<string, string>,
    hasErrors: false
  }

  // Проверяем наличие response с данными об ошибке
  if (error?.response?.data) {
    const data = error.response.data

    // Обрабатываем структуру {"detail": "...", "errors": {...}}
    if (typeof data === 'object' && data.detail !== undefined) {
      result.detail = data.detail || fallbackMessage
      
      // Обрабатываем ошибки полей
      if (data.errors && typeof data.errors === 'object') {
        Object.keys(data.errors).forEach(field => {
          const fieldError = data.errors[field]
          if (Array.isArray(fieldError) && fieldError.length > 0) {
            result.fieldErrors[field] = fieldError[0] // Берем первую ошибку
          } else if (typeof fieldError === 'string') {
            result.fieldErrors[field] = fieldError
          }
        })
      }
      
      result.hasErrors = true
    }
    // Обрабатываем старую структуру DRF (прямые ошибки полей)
    else if (typeof data === 'object') {
      Object.keys(data).forEach(field => {
        const fieldError = data[field]
        if (Array.isArray(fieldError) && fieldError.length > 0) {
          result.fieldErrors[field] = fieldError[0]
        } else if (typeof fieldError === 'string') {
          result.fieldErrors[field] = fieldError
        }
      })
      
      if (Object.keys(result.fieldErrors).length > 0) {
        result.detail = 'Ошибка валидации'
        result.hasErrors = true
      }
    }
  }
  // Обрабатываем ошибки без response (сетевые ошибки и т.д.)
  else if (error?.message) {
    result.detail = error.message
    result.hasErrors = true
  }

  // Показываем toast уведомление если нужно
  if (showToast && result.hasErrors) {
    // Импортируем ui store динамически чтобы избежать циклических зависимостей
    import('@/stores/ui').then(({ useUiStore }) => {
      const ui = useUiStore()
      ui.toast({ type: 'error', text: result.detail })
    })
  }

  return result
}

/**
 * Специальные обработчики для конкретных типов ошибок
 */
export const ErrorHandlers = {
  /**
   * Обработка ошибок валидации форм
   */
  formValidation: (error: any) => {
    const result = handleApiError(error, { 
      showToast: false, // Не показываем общий toast, показываем ошибки полей
      fallbackMessage: 'Ошибка валидации формы'
    })
    
    // Показываем toast для каждой ошибки поля
    if (result.hasErrors) {
      import('@/stores/ui').then(({ useUiStore }) => {
        const ui = useUiStore()
        Object.values(result.fieldErrors).forEach(fieldError => {
          ui.toast({ type: 'error', text: fieldError })
        })
      })
    }
    
    return result
  },

  /**
   * Обработка ошибок загрузки данных
   */
  dataLoading: (error: any) => {
    return handleApiError(error, {
      fallbackMessage: 'Ошибка загрузки данных'
    })
  },

  /**
   * Обработка ошибок сохранения
   */
  save: (error: any) => {
    return handleApiError(error, {
      fallbackMessage: 'Ошибка сохранения'
    })
  },

  /**
   * Обработка ошибок удаления
   */
  delete: (error: any) => {
    return handleApiError(error, {
      fallbackMessage: 'Ошибка удаления'
    })
  },

  /**
   * Обработка ошибок авторизации
   */
  auth: (error: any) => {
    return handleApiError(error, {
      fallbackMessage: 'Ошибка авторизации'
    })
  },

  /**
   * Обработка ошибок архивирования
   */
  archive: (error: any) => {
    return handleApiError(error, {
      fallbackMessage: 'Ошибка архивирования'
    })
  }
}

/**
 * Проверяет, является ли ошибка конкретным типом
 */
export function isErrorType(error: any, type: string): boolean {
  if (!error?.response?.data?.detail) return false
  
  const detail = error.response.data.detail.toLowerCase()
  return detail.includes(type.toLowerCase())
}

/**
 * Проверяет, является ли ошибка связанной с архивированными данными
 */
export function isArchivedError(error: any): boolean {
  return isErrorType(error, 'archived') || isErrorType(error, 'read-only')
}

/**
 * Проверяет, является ли ошибка связанной с валидацией
 */
export function isValidationError(error: any): boolean {
  return error?.response?.status === 400
}

/**
 * Проверяет, является ли ошибка связанной с правами доступа
 */
export function isPermissionError(error: any): boolean {
  return error?.response?.status === 403
}

/**
 * Проверяет, является ли ошибка связанной с отсутствием ресурса
 */
export function isNotFoundError(error: any): boolean {
  return error?.response?.status === 404
}
