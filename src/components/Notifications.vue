<!-- src/components/Notifications.vue -->
<template>
  <div class="notifications-container">
    <!-- Кнопка уведомлений -->
    <div class="relative">
      <button 
        class="btn btn-ghost btn-circle relative"
        @click="toggleDropdown"
        :class="{ 'btn-primary': unreadCount > 0 }"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828zM4 7h8l-2 2H6l-2-2zM4 7V5a2 2 0 012-2h4a2 2 0 012 2v2M4 7v10a2 2 0 002 2h8a2 2 0 002-2V7"></path>
        </svg>
        <span 
          v-if="unreadCount > 0" 
          class="badge badge-error badge-xs absolute -top-1 -right-1"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>

      <!-- Dropdown с уведомлениями -->
      <div 
        v-if="showDropdown" 
        class="absolute right-0 mt-2 w-80 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden"
      >
        <!-- Header -->
        <div class="p-4 border-b border-base-300">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-lg">Уведомления</h3>
            <div class="flex gap-2">
              <button 
                v-if="unreadCount > 0"
                class="btn btn-xs btn-outline"
                @click="markAllAsRead"
              >
                Прочитать все
              </button>
              <button 
                class="btn btn-xs btn-ghost"
                @click="clearAll"
              >
                Очистить
              </button>
            </div>
          </div>
        </div>

        <!-- Список уведомлений -->
        <div class="max-h-80 overflow-y-auto">
          <div v-if="notifications.length === 0" class="p-4 text-center text-base-content-60">
            Нет уведомлений
          </div>
          
          <div v-else>
            <!-- Непрочитанные -->
            <div v-if="unreadNotifications.length > 0">
              <div class="px-4 py-2 bg-base-200 text-sm font-medium text-base-content-70">
                Непрочитанные ({{ unreadNotifications.length }})
              </div>
              <NotificationItem
                v-for="notification in unreadNotifications"
                :key="notification.id"
                :notification="notification"
                @read="markAsRead"
                @remove="removeNotification"
              />
            </div>

            <!-- Прочитанные -->
            <div v-if="readNotifications.length > 0">
              <div class="px-4 py-2 bg-base-200 text-sm font-medium text-base-content-70">
                Прочитанные
              </div>
              <NotificationItem
                v-for="notification in readNotifications"
                :key="notification.id"
                :notification="notification"
                @read="markAsRead"
                @remove="removeNotification"
              />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div v-if="notifications.length > 0" class="p-4 border-t border-base-300">
          <button 
            class="btn btn-sm btn-outline w-full"
            @click="showAllNotifications"
          >
            Показать все уведомления
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно со всеми уведомлениями -->
    <Modal v-model="showAllModal" title="Все уведомления" size="lg">
      <div class="space-y-4">
        <div class="flex gap-2">
          <button 
            v-if="unreadCount > 0"
            class="btn btn-sm btn-outline"
            @click="markAllAsRead"
          >
            Прочитать все
          </button>
          <button 
            class="btn btn-sm btn-ghost"
            @click="clearAll"
          >
            Очистить все
          </button>
        </div>

        <div class="space-y-2 max-h-96 overflow-y-auto">
          <NotificationItem
            v-for="notification in notifications"
            :key="notification.id"
            :notification="notification"
            :show-actions="true"
            @read="markAsRead"
            @remove="removeNotification"
          />
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'
import type { Notification, ID } from '@/api/types'
import NotificationItem from './NotificationItem.vue'
import Modal from './Modal.vue'

const notificationsStore = useNotificationsStore()

const showDropdown = ref(false)
const showAllModal = ref(false)

// Геттеры
const notifications = computed(() => notificationsStore.notifications)
const unreadCount = computed(() => notificationsStore.unreadCount)
const unreadNotifications = computed(() => notificationsStore.unreadNotifications)
const readNotifications = computed(() => notificationsStore.readNotifications)

// Методы
function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function markAsRead(notificationId: ID) {
  notificationsStore.markAsRead(notificationId)
}

function markAllAsRead() {
  notificationsStore.markAllAsRead()
}

function removeNotification(notificationId: ID) {
  notificationsStore.removeNotification(notificationId)
}

function clearAll() {
  notificationsStore.clearAll()
}

function showAllNotifications() {
  showDropdown.value = false
  showAllModal.value = true
}

// Закрытие dropdown при клике вне его
function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  if (!target.closest('.notifications-container')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.notifications-container {
  position: relative;
}
</style>
