// Error types based on API schema analysis

export interface ApiErrorResponse {
    detail: string
    errors: Record<string, string[]>
}

export interface ParsedApiError {
    detail: string
    fieldErrors: Record<string, string[]>
    hasErrors: boolean
    statusCode?: number
    errorType: ErrorType
    displayConfig?: ErrorDisplayConfig
    originalError?: unknown
}

export type ErrorType =
    | 'validation'      // 400 - Ошибки валидации
    | 'auth'            // 401 - Требуется вход / сессия истекла (EH-FE-14)
    | 'permission'      // 403 - Недостаточно прав
    | 'not_found'       // 404 - Ресурс не найден
    | 'server_error'    // 500+ - Ошибки сервера
    | 'network'         // Сетевые ошибки
    | 'unknown'         // Неизвестные ошибки

export interface ErrorDisplayConfig {
    showToast?: boolean
    showFieldErrors?: boolean
    logError?: boolean
    logToConsole?: boolean
    fallbackMessage?: string
    toastType?: 'error' | 'warning' | 'info'
}

export interface ErrorContext {
    operation: string
    entity?: string
    entityId?: number
    timestamp?: string
    userAgent?: string
    url?: string
    type?: string
}

// Error messages mapping
export const ERROR_MESSAGES = {
    validation: 'Ошибка валидации данных',
    auth: 'Требуется вход. Войдите снова.',
    permission: 'Недостаточно прав для выполнения данного действия',
    not_found: 'Запрашиваемый ресурс не найден',
    server_error: 'Внутренняя ошибка сервера',
    network: 'Ошибка сети. Проверьте подключение к интернету',
    unknown: 'Произошла неизвестная ошибка'
} as const

// HTTP status to error type mapping
export const STATUS_TO_ERROR_TYPE: Record<number, ErrorType> = {
    400: 'validation',
    401: 'auth',        // EH-FE-14: 401 — аутентификация/сессия, НЕ 403-права
    403: 'permission',
    404: 'not_found',
    422: 'validation',
    500: 'server_error',
    502: 'server_error',
    503: 'server_error',
    504: 'server_error'
} as const


