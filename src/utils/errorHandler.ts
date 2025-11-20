import type { ParsedApiError, ErrorType, ErrorDisplayConfig, ErrorContext } from '@/api/types/errors'

/**
 * Парсит вложенные ошибки валидации
 * Обрабатывает структуры типа items[0].material, items[1].quantity и т.д.
 */
export function parseNestedErrors(errors: any): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  
  for (const [key, value] of Object.entries(errors)) {
    if (Array.isArray(value)) {
      // Проверяем, является ли это массивом ошибок для одного поля
      // (например, ["error1", "error2"]) или массивом объектов
      if (value.length > 0 && typeof value[0] === 'string') {
        // Это массив строк - ошибки для одного поля
        result[key] = value as string[]
      } else {
        // Это массив объектов - обрабатываем как вложенную структуру
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            // Обрабатываем объекты в массиве
            for (const [fieldKey, fieldErrors] of Object.entries(item)) {
              if (Array.isArray(fieldErrors)) {
                const nestedKey = `${key}[${index}].${fieldKey}`
                result[nestedKey] = fieldErrors as string[]
              }
            }
          } else if (typeof item === 'string') {
            // Простые строки в массиве
            result[`${key}[${index}]`] = [item]
          }
        })
      }
    } else if (typeof value === 'object' && value !== null) {
      // Обрабатываем объекты
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (Array.isArray(nestedValue)) {
          result[`${key}.${nestedKey}`] = nestedValue as string[]
        }
      }
    } else if (typeof value === 'string') {
      // Простые строки
      result[key] = [value]
    }
  }
  
  return result
}

/**
 * Парсит ошибку API и возвращает структурированную информацию
 */
export function parseApiError(error: any, context?: ErrorContext): ParsedApiError {
  // Определяем статус код
  const status = error?.response?.status || 0
  
  // Определяем тип ошибки
  const errorType: ErrorType = getErrorType(status, error)
  
  // Получаем данные ответа
  const data = error?.response?.data || {}
  
  // Парсим детали ошибки
  const detail = data?.detail || error?.message || 'Произошла неизвестная ошибка'
  const fieldErrors = parseNestedErrors(data?.errors || {})
  const nonFieldErrors = data?.non_field_errors || []
  const allErrors = data?.errors?.__all__ || []
  
  // Добавляем non_field_errors и __all__ к fieldErrors для отображения
  if (nonFieldErrors.length > 0) {
    fieldErrors['non_field_errors'] = nonFieldErrors
  }
  // Обрабатываем ошибки __all__ как non_field_errors
  if (allErrors.length > 0) {
    if (!fieldErrors['non_field_errors']) {
      fieldErrors['non_field_errors'] = []
    }
    fieldErrors['non_field_errors'].push(...allErrors)
  }

  // Создаем конфигурацию отображения
  const displayConfig: ErrorDisplayConfig = {
    showToast: true,
    logToConsole: true,
    fallbackMessage: detail,
    toastType: 'error'
  }

  return {
    detail,
    fieldErrors,
    hasErrors: Object.keys(fieldErrors).length > 0 || nonFieldErrors.length > 0,
    statusCode: status,
    errorType,
    displayConfig,
    originalError: error
  }
}

/**
 * Обрабатывает ошибку API с отображением пользователю
 */
export async function handleApiErrorAsync(
  error: any, 
  context?: ErrorContext
): Promise<ParsedApiError> {
  const parsedError = parseApiError(error, context)
  
  // Логируем в консоль если нужно
  if (parsedError.displayConfig?.logToConsole) {
    console.error('API Error:', parsedError)
  }

  // Показываем уведомление если нужно
  if (parsedError.displayConfig?.showToast) {
    const ui = await getUiStore()
    ui.toast({
      type: 'error',
      text: parsedError.detail
    })
  }

  return parsedError
}

/**
 * Определяет тип ошибки по статус коду
 */
function getErrorType(status: number, error: any): ErrorType {
  if (status === 0 || !error?.response) {
    return 'network'
  }
  
  switch (status) {
    case 400:
      return 'validation'
    case 403:
      return 'permission'
    case 404:
      return 'not_found'
    case 500:
    case 502:
    case 503:
    case 504:
      return 'server_error'
    default:
      return 'unknown'
  }
}

/**
 * Получает UI store для показа уведомлений
 */
async function getUiStore() {
  const { useUiStore } = await import('@/stores/ui')
  return useUiStore()
}

/**
 * Обработчики ошибок для разных операций
 */
export const ErrorHandlers = {
  // Обработка ошибок валидации форм
  formValidation: async (error: any, entity?: string): Promise<ParsedApiError> => {
    return handleApiErrorAsync(error, { 
      operation: 'formValidation',
      entity: entity || 'форма'
    })
  },

  // Обработка ошибок загрузки данных
  dataLoading: async (error: any, entity?: string): Promise<ParsedApiError> => {
    return handleApiErrorAsync(error, { 
      operation: 'dataLoading',
      entity: entity || 'данные'
    })
  },

  // Обработка ошибок сохранения
  save: async (error: any, entity?: string): Promise<ParsedApiError> => {
    return handleApiErrorAsync(error, { 
      operation: 'save',
      entity: entity || 'данные'
    })
  },

  // Обработка ошибок удаления
  delete: async (error: any, entity?: string): Promise<ParsedApiError> => {
    return handleApiErrorAsync(error, { 
      operation: 'delete',
      entity: entity || 'элемент'
    })
  },

  // Обработка ошибок аутентификации
  auth: async (error: any): Promise<ParsedApiError> => {
    return handleApiErrorAsync(error, { 
      operation: 'auth'
    })
  },

  // Обработка ошибок прав доступа
  permission: async (error: any): Promise<ParsedApiError> => {
    return handleApiErrorAsync(error, { 
      operation: 'permission'
    })
  },

  // Обработка ошибок экспорта
  export: async (error: any): Promise<ParsedApiError> => {
    return handleApiErrorAsync(error, { 
      operation: 'export'
    })
  }
}

// Обратная совместимость
export const handleApiError = parseApiError