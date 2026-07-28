import { ref, onMounted, onUnmounted } from 'vue'
import { formatAmountWithCurrency, formatDate as formatDateValue } from '@/utils/formatters'
import { getStatusBadgeClass, getStatusLabel } from '@/utils/statusHelpers'
import { throttle } from '@/utils/debounce'

/**
 * Композабл для определения мобильного режима отображения таблиц
 * Автоматически переключает между табличным и карточным представлением
 */
export function useResponsiveTable() {
  // F-865 (mobile-audit): инициализируем СРАЗУ правильным значением (было ref(false) → значение
  // ставилось только в onMounted) — убирает FOUC (мигание desktop-таблицы на телефоне) и гонку.
  const isMobile = ref(typeof window !== 'undefined' && window.innerWidth < 768)
  
  // Проверка является ли устройство мобильным (меньше md breakpoint)
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768 // md breakpoint в Tailwind
  }
  
  // Throttled версия для оптимизации производительности на мобильных
  const throttledCheckMobile = throttle(checkMobile, 150)
  
  // Инициализация и подписка на изменения размера окна
  onMounted(() => {
    checkMobile()
    window.addEventListener('resize', throttledCheckMobile, { passive: true })
  })
  
  // Очистка слушателя при размонтировании
  onUnmounted(() => {
    window.removeEventListener('resize', throttledCheckMobile)
  })
  
  return {
    isMobile
  }
}

/**
 * Хелперы для мобильных карточек
 */
export function useMobileCardHelpers() {
  // Форматирование суммы
  const formatAmount = (amount: string | number, currency = 'UZS') => {
    return formatAmountWithCurrency(amount, currency)
  }
  
  // Форматирование даты
  const formatDate = (date: string | null) => {
    return date ? formatDateValue(date) : '—'
  }
  
  // Получение класса для бейджа статуса
  const getStatusBadgeClassLocal = (status: string) => {
    return getStatusBadgeClass(status)
  }
  
  // Получение текста статуса
  const getStatusLabelLocal = (status: string) => {
    return getStatusLabel(status)
  }
  
  // Усечение длинного текста
  const truncateText = (text: string, maxLength = 50) => {
    if (!text || text.length <= maxLength) {return text}
    return text.substring(0, maxLength) + '...'
  }
  
  return {
    formatAmount,
    formatDate,
    getStatusBadgeClass: getStatusBadgeClassLocal,
    getStatusLabel: getStatusLabelLocal,
    truncateText
  }
}


