/**
 * Утилиты для форматирования данных
 */

/**
 * Форматирует дату в читаемый вид
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return '—'
  }
}

/**
 * Форматирует дату и время в читаемый вид
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '—'
  }
}

/**
 * Форматирует число с разделителями тысяч
 */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  
  return num.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

/**
 * Форматирует валюту
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  
  return num.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

/**
 * Форматирует количество с единицей измерения
 */
export function formatQuantity(value: number | string | null | undefined, unit?: string): string {
  const formatted = formatNumber(value)
  if (formatted === '—') return '—'
  
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
