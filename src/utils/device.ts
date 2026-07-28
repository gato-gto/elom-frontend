/**
 * Утилиты для определения типа устройства и оптимизации для мобильных
 */

/**
 * Проверяет, является ли устройство мобильным
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') {return false}
  return window.innerWidth < 768 // md breakpoint в Tailwind
}

/**
 * Получает оптимальный размер страницы в зависимости от устройства
 * На мобильных устройствах используем меньше элементов для лучшей производительности
 */
export function getOptimalPageSize(defaultSize: number = 20): number {
  if (isMobileDevice()) {
    // На мобильных используем меньше элементов (10 вместо 20)
    return Math.min(defaultSize, 10)
  }
  return defaultSize
}

/**
 * Проверяет, является ли устройство планшетом
 */
export function isTabletDevice(): boolean {
  if (typeof window === 'undefined') {return false}
  return window.innerWidth >= 768 && window.innerWidth < 1024
}

/**
 * Проверяет, является ли устройство десктопом
 */
export function isDesktopDevice(): boolean {
  if (typeof window === 'undefined') {return false}
  return window.innerWidth >= 1024
}

/**
 * F-866: платформа клиента для АДАПТИВНОГО CSV-экспорта (владелец: «в нужном формате для MAC/Windows»).
 * Windows Excel хочет разделитель «;»+CRLF+BOM; Mac Excel/Numbers — «,»+LF+BOM. iOS → 'mac' (Numbers).
 * Универсальный формат без этих плясок — XLSX (его platform не касается).
 */
export function getClientPlatform(): 'windows' | 'mac' | 'other' {
  if (typeof navigator === 'undefined') { return 'other' }
  const uaData = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData
  const p = (uaData?.platform || navigator.platform || navigator.userAgent || '').toLowerCase()
  if (p.includes('win')) { return 'windows' }
  if (p.includes('mac') || p.includes('iphone') || p.includes('ipad') || p.includes('ipod')) { return 'mac' }
  return 'other'
}
