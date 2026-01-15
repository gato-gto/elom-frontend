/**
 * Утилиты для форматирования данных
 */

/**
 * Нормализует входную дату
 */
function toValidDate(value: string | Date | number | null | undefined): Date | null {
  if (!value) { return null }
  const date = value instanceof Date ? value : new Date(value)
  return isNaN(date.getTime()) ? null : date
}

/**
 * Форматирует дату с настраиваемыми опциями
 */
export function formatDateWithOptions(
  value: string | Date | number | null | undefined,
  options: Intl.DateTimeFormatOptions,
  locale: string = 'ru-RU'
): string {
  const date = toValidDate(value)
  if (!date) { return '—' }
  return date.toLocaleDateString(locale, options)
}

/**
 * Форматирует дату в читаемый вид
 */
export function formatDate(dateString: string | Date | number | null | undefined): string {
  return formatDateWithOptions(dateString, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Форматирует дату и время в читаемый вид
 */
export function formatDateTime(dateString: string | Date | number | null | undefined): string {
  const date = toValidDate(dateString)
  if (!date) { return '—' }
  return date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Форматирует число с разделителями тысяч
 */
export function formatNumberWithOptions(
  value: number | string | null | undefined,
  options: Intl.NumberFormatOptions = {},
  locale: string = 'ru-RU'
): string {
  if (value === null || value === undefined || value === '') { return '—' }

  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) { return '—' }

  return new Intl.NumberFormat(locale, options).format(num)
}

/**
 * Форматирует число с разделителями тысяч
 */
export function formatNumber(value: number | string | null | undefined): string {
  return formatNumberWithOptions(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

/**
 * Форматирует валюту
 */
export function formatCurrencyWithCode(
  value: number | string | null | undefined,
  currency: string = 'RUB',
  options: Intl.NumberFormatOptions = {}
): string {
  return formatNumberWithOptions(value, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  })
}

/**
 * Форматирует валюту
 */
export function formatCurrency(value: number | string | null | undefined): string {
  return formatCurrencyWithCode(value, 'RUB')
}

/**
 * Форматирует сумму с валютным кодом рядом
 */
export function formatAmountWithCurrency(
  value: number | string | null | undefined,
  currency: string = 'UZS'
): string {
  const formatted = formatNumberWithOptions(value)
  if (formatted === '—') { return '—' }
  return `${formatted} ${currency}`
}

/**
 * Форматирует число, убирая лишние нули в конце
 * Если число целое, показывает как целое
 * Показывает дробную часть только если она действительно есть
 * 
 * Примеры:
 * - 14.000000 -> "14"
 * - 14.5 -> "14.5"
 * - 14.50 -> "14.5"
 * - 0.5 -> "0.5"
 * - 0 -> "0"
 */
export function formatNumberClean(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') { return '—' }
  
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) { return '—' }
  
  // Если число целое, возвращаем как целое
  if (Number.isInteger(num)) {
    return num.toString()
  }
  
  // Для дробных чисел убираем лишние нули в конце
  // Используем toFixed с достаточным количеством знаков, затем убираем нули
  const str = num.toString()
  
  // Если число в научной нотации, конвертируем в обычный формат
  if (str.includes('e') || str.includes('E')) {
    // Используем toFixed для больших чисел
    const fixed = num.toFixed(10)
    return fixed.replace(/\.?0+$/, '')
  }
  
  // Убираем завершающие нули после точки
  // Сначала убираем завершающие нули, затем убираем точку если она осталась одна
  return str.replace(/\.?0+$/, '')
}

/**
 * Форматирует количество с единицей измерения
 * Использует умное форматирование без лишних нулей
 */
export function formatQuantity(value: number | string | null | undefined, unit?: string): string {
  const formatted = formatNumberClean(value)
  if (formatted === '—') { return '—' }
  
  return unit ? `${formatted} ${unit}` : formatted
}

/**
 * Получает CSS класс для статуса
 */
export function getStatusClass(status: boolean | string | null | undefined): string {
  if (status === true || status === 'active' || status === 'open') {
    return 'badge-success'
  }
  if (status === false || status === 'inactive' || status === 'closed' || status === 'archived') {
    return 'badge-ghost'
  }
  return 'badge-neutral'
}

/**
 * Получает текст для статуса
 */
export function getStatusText(status: boolean | string | null | undefined): string {
  if (status === true || status === 'active' || status === 'open') {
    return 'Активен'
  }
  if (status === false || status === 'inactive' || status === 'closed' || status === 'archived') {
    return 'Неактивен'
  }
  return '—'
}
