/**
 * Composable для управления уведомлениями
 */
import { ref } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
}

const notifications = ref<Notification[]>([])

export function useNotifications() {
  const showNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      id,
      duration: 5000,
      persistent: false,
      ...notification
    }
    
    notifications.value.push(newNotification)
    
    // Автоматическое удаление через duration
    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
    
    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAllNotifications = () => {
    notifications.value = []
  }

  // Удобные методы для разных типов уведомлений
  const showSuccess = (message: string, title = 'Успешно') => {
    return showNotification({
      type: 'success',
      title,
      message
    })
  }

  const showError = (message: string, title = 'Ошибка') => {
    return showNotification({
      type: 'error',
      title,
      message,
      persistent: true // Ошибки не исчезают автоматически
    })
  }

  const showWarning = (message: string, title = 'Предупреждение') => {
    return showNotification({
      type: 'warning',
      title,
      message,
      duration: 7000
    })
  }

  const showInfo = (message: string, title = 'Информация') => {
    return showNotification({
      type: 'info',
      title,
      message
    })
  }

  return {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}
