// src/stores/notifications.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ID } from '@/api/types'

export interface Notification {
  id: ID
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  read: boolean
  created_at: string
  user_id?: ID
  related_type?: 'purchase' | 'object' | 'material' | 'stock'
  related_id?: ID
  action_url?: string
}

export interface NotificationRequest {
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  user_id?: ID
  related_type?: 'purchase' | 'object' | 'material' | 'stock'
  related_id?: ID
  action_url?: string
}

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const unreadCount = ref(0)

  // Геттеры
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.read)
  )

  const readNotifications = computed(() => 
    notifications.value.filter(n => n.read)
  )

  const notificationsByType = computed(() => {
    const grouped: Record<string, Notification[]> = {
      info: [],
      warning: [],
      error: [],
      success: []
    }
    
    notifications.value.forEach(notification => {
      grouped[notification.type].push(notification)
    })
    
    return grouped
  })

  // Действия
  function addNotification(notification: NotificationRequest) {
    const newNotification: Notification = {
      id: Date.now(), // Временный ID, в реальном приложении будет от сервера
      ...notification,
      read: false,
      created_at: new Date().toISOString()
    }
    
    notifications.value.unshift(newNotification)
    updateUnreadCount()
    
    // Автоматически удаляем уведомления старше 7 дней
    setTimeout(() => {
      removeOldNotifications()
    }, 100)
  }

  function markAsRead(notificationId: ID) {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification && !notification.read) {
      notification.read = true
      updateUnreadCount()
    }
  }

  function markAllAsRead() {
    notifications.value.forEach(notification => {
      notification.read = true
    })
    updateUnreadCount()
  }

  function removeNotification(notificationId: ID) {
    const index = notifications.value.findIndex(n => n.id === notificationId)
    if (index > -1) {
      notifications.value.splice(index, 1)
      updateUnreadCount()
    }
  }

  function clearAll() {
    notifications.value = []
    updateUnreadCount()
  }

  function removeOldNotifications() {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    notifications.value = notifications.value.filter(notification => {
      const notificationDate = new Date(notification.created_at)
      return notificationDate > sevenDaysAgo
    })
    
    updateUnreadCount()
  }

  function updateUnreadCount() {
    unreadCount.value = notifications.value.filter(n => !n.read).length
  }

  // Предустановленные уведомления для разных ситуаций
  function notifyPurchaseError(purchaseId: ID, error: string) {
    addNotification({
      type: 'error',
      title: 'Ошибка в закупке',
      message: `Обнаружена ошибка в закупке #${purchaseId}: ${error}`,
      related_type: 'purchase',
      related_id: purchaseId,
      action_url: `/purchases/${purchaseId}`
    })
  }

  function notifyPurchaseEdit(purchaseId: ID, editor: string) {
    addNotification({
      type: 'warning',
      title: 'Закупка изменена',
      message: `Закупка #${purchaseId} была изменена пользователем ${editor}`,
      related_type: 'purchase',
      related_id: purchaseId,
      action_url: `/purchases/${purchaseId}`
    })
  }

  function notifyObjectStatusChange(objectId: ID, objectName: string, newStatus: string) {
    addNotification({
      type: 'info',
      title: 'Изменение статуса объекта',
      message: `Статус объекта "${objectName}" изменен на "${newStatus}"`,
      related_type: 'object',
      related_id: objectId,
      action_url: `/objects/${objectId}`
    })
  }

  function notifyStockUpdate(objectId: ID, materialName: string, quantity: number) {
    addNotification({
      type: 'success',
      title: 'Обновление остатков',
      message: `Остатки материала "${materialName}" обновлены: ${quantity} ед.`,
      related_type: 'stock',
      related_id: objectId,
      action_url: `/stocks?object=${objectId}`
    })
  }

  function notifyMaterialLowStock(materialId: ID, materialName: string, quantity: number) {
    addNotification({
      type: 'warning',
      title: 'Низкие остатки',
      message: `Материал "${materialName}" заканчивается. Остаток: ${quantity} ед.`,
      related_type: 'material',
      related_id: materialId,
      action_url: `/materials/${materialId}`
    })
  }

  function notifyArchivePeriodClosed(periodId: ID, month: string, objectName: string) {
    addNotification({
      type: 'info',
      title: 'Период закрыт',
      message: `Период ${month} по объекту "${objectName}" закрыт для редактирования`,
      related_type: 'object',
      related_id: periodId
    })
  }

  return {
    // Состояние
    notifications,
    loading,
    unreadCount,
    
    // Геттеры
    unreadNotifications,
    readNotifications,
    notificationsByType,
    
    // Действия
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    removeOldNotifications,
    
    // Предустановленные уведомления
    notifyPurchaseError,
    notifyPurchaseEdit,
    notifyObjectStatusChange,
    notifyStockUpdate,
    notifyMaterialLowStock,
    notifyArchivePeriodClosed
  }
})
