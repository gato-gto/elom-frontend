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
