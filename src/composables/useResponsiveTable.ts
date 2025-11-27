import { ref, onMounted, onUnmounted } from 'vue'

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
    if (!amount) {return '0'}
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('ru-RU').format(num) + ` ${currency}`
  }
  
  // Форматирование даты
  const formatDate = (date: string | null) => {
    if (!date) {return '—'}
    return new Date(date).toLocaleDateString('ru-RU')
  }
  
  // Получение класса для бейджа статуса
  const getStatusBadgeClass = (status: string) => {
    const statusClasses: Record<string, string> = {
      'new': 'badge-info',
      'completed': 'badge-success', 
      'cancelled': 'badge-error',
      'active': 'badge-success',
      'inactive': 'badge-error',
      'admin': 'badge-primary',
      'director': 'badge-secondary',
      'coordinator': 'badge-accent',
      'brigadier': 'badge-warning'
    }
    
    return statusClasses[status] || 'badge-neutral'
  }
  
  // Получение текста статуса
  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      'new': 'Новая',
      'completed': 'Выполнено',
      'cancelled': 'Отмена',
      'active': 'Активный',
      'inactive': 'Неактивный',
      'admin': 'Администратор',
      'director': 'Директор',
      'coordinator': 'Координатор',
      'brigadier': 'Бригадир',
      '': 'Роль не задана'
    }
    
    return statusLabels[status] || status
  }
  
  // Усечение длинного текста
  const truncateText = (text: string, maxLength = 50) => {
    if (!text || text.length <= maxLength) {return text}
    return text.substring(0, maxLength) + '...'
  }
  
  return {
    formatAmount,
    formatDate,
    getStatusBadgeClass,
    getStatusLabel,
    truncateText
  }
}


