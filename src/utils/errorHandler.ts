import type { ParsedApiError, ErrorType, ErrorDisplayConfig, ErrorContext } from '@/api/types/errors'
import { ERROR_MESSAGES, STATUS_TO_ERROR_TYPE } from '@/api/types/errors'

/**
 * Парсит вложенные ошибки валидации
 * Обрабатывает структуры типа items[0].material, items[1].quantity и т.д.
 */
export function parseNestedErrors(errors: any): Record<string, string[]> {
  // Рекурсивный разбор произвольной вложенности DRF-ошибок в плоские ключи вида
  // items[0].material, companies[0].employees[0].contacts.email.
  // Раньше функция обрабатывала лишь один уровень и складывала вложенные объекты
  // как «массив ошибок» — отсюда баг «массив показан как object[0]».
  const result: Record<string, string[]> = {}
  const seen = new WeakSet<object>()

  const walk = (node: any, path: string) => {
    if (node && typeof node === 'object') {
      if (seen.has(node)) { return }  // защита от циклических ссылок
      seen.add(node)
    }
    if (Array.isArray(node)) {
      if (node.length > 0 && node.every((v) => typeof v === 'string')) {
        // массив строк — это ошибки для поля path
        if (path) { result[path] = node as string[] }
      } else {
        node.forEach((item, index) => walk(item, `${path}[${index}]`))
      }
    } else if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        walk(value, path ? `${path}.${key}` : key)
      }
    } else if (typeof node === 'string') {
      if (path) { result[path] = [node] }
    }
  }

  walk(errors || {}, '')
  return result
}

/**
 * Извлекает первое конкретное сообщение об ошибке из объекта errors
 * Используется для замены общего "Validation error" на конкретное сообщение
 */
function extractFirstErrorMessage(errors: any): string | null {
  if (!errors || typeof errors !== 'object') {
    return null
  }

  // Сначала проверяем non_field_errors и __all__
  if (Array.isArray(errors.non_field_errors) && errors.non_field_errors.length > 0) {
    return errors.non_field_errors[0]
  }
  if (Array.isArray(errors.__all__) && errors.__all__.length > 0) {
    return errors.__all__[0]
  }

  // Затем проверяем все остальные поля
  for (const [key, value] of Object.entries(errors)) {
    if (key === 'non_field_errors' || key === '__all__') {
      continue
    }

    if (Array.isArray(value) && value.length > 0) {
      // Если это массив строк - берем первую
      if (typeof value[0] === 'string') {
        return value[0]
      }
      // Если это массив объектов - рекурсивно ищем
      if (typeof value[0] === 'object' && value[0] !== null) {
        const nested = extractFirstErrorMessage(value[0])
        if (nested) {
          return nested
        }
      }
    } else if (typeof value === 'string' && value.trim()) {
      // Простая строка
      return value
    } else if (typeof value === 'object' && value !== null) {
      // Вложенный объект - рекурсивно ищем
      const nested = extractFirstErrorMessage(value)
      if (nested) {
        return nested
      }
    }
  }

  return null
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

  // FE-5: `detail` может прийти НЕ строкой (DRF отдаёт non_field_errors списком/объектом) —
  // тогда `detail.toLowerCase()` ниже падал «ошибкой при обработке ошибки». Приводим безопасно.
  // FE-4: НЕ используем `error.message` как текст пользователю (это англ. «Network Error» /
  // «Request failed with status code 500») — только локализованный fallback по типу; техн.
  // message остаётся в originalError для лога.
  const rawDetail = data?.detail
  let detail: string
  if (typeof rawDetail === 'string' && rawDetail.trim()) {
    detail = rawDetail
  } else if (Array.isArray(rawDetail) && typeof rawDetail[0] === 'string') {
    detail = rawDetail[0]
  } else {
    detail = extractFirstErrorMessage(data?.errors) || ERROR_MESSAGES[errorType] || ERROR_MESSAGES.unknown
  }
  const rawErrors = data?.errors || {}
  const fieldErrors = parseNestedErrors(rawErrors)
  
  // Извлекаем non_field_errors из разных мест
  const nonFieldErrors = data?.errors?.non_field_errors || data?.non_field_errors || []
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

  // Если detail это общее сообщение типа "Validation error", заменяем на конкретное
  const genericMessages = [
    'Validation error',
    'Ошибка валидации',
    'Bad request',
    'Invalid request'
  ]
  
  if (genericMessages.some(msg => detail.toLowerCase().includes(msg.toLowerCase()))) {
    // Сначала проверяем non_field_errors (приоритет)
    if (nonFieldErrors.length > 0) {
      detail = nonFieldErrors[0]
    } else if (allErrors.length > 0) {
      detail = allErrors[0]
    } else {
      // Затем ищем в других полях
      const firstError = extractFirstErrorMessage(rawErrors)
      if (firstError) {
        detail = firstError
      } else if (Object.keys(fieldErrors).length > 0) {
        // Берем первое сообщение из первого поля
        const firstField = Object.keys(fieldErrors)[0]
        const firstFieldErrors = fieldErrors[firstField]
        if (Array.isArray(firstFieldErrors) && firstFieldErrors.length > 0) {
          detail = firstFieldErrors[0]
        }
      }
    }
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
  // FE-13: единая таблица статус→тип (включает 401→permission и 422→validation, которых
  // раньше не было в switch). Один источник истины вместо двух расходящихся трактовок.
  return STATUS_TO_ERROR_TYPE[status] || 'unknown'
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