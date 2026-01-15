import { ref, onMounted, onUnmounted } from 'vue'
import { formatAmountWithCurrency, formatDate as formatDateValue } from '@/utils/formatters'
import { getStatusBadgeClass, getStatusLabel } from '@/utils/statusHelpers'

/**
 * Композабл для определения мобильного режима отображения таблиц
 * Автоматически переключает между табличным и карточным представлением
 */
export function useResponsiveTable() {
  const isMobile = ref(false)
  
  // Проверка является ли устройство мобильным (меньше md breakpoint)
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768 // md breakpoint в Tailwind
  }
  
  // Инициализация и подписка на изменения размера окна
  onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
  })
  
  // Очистка слушателя при размонтировании
  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
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


