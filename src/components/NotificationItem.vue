<!-- src/components/NotificationItem.vue -->
<template>
  <div 
    class="notification-item p-4 border-b border-base-300 hover:bg-base-200 transition-colors"
    :class="{ 'bg-base-200': !notification.read }"
  >
    <div class="flex items-start gap-3">
      <!-- Иконка типа уведомления -->
      <div class="flex-shrink-0 mt-1">
        <div 
          class="w-8 h-8 rounded-full flex items-center justify-center"
          :class="getTypeClass(notification.type)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              v-if="notification.type === 'info'"
              stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <path 
              v-else-if="notification.type === 'warning'"
              stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
            <path 
              v-else-if="notification.type === 'error'"
              stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <path 
              v-else-if="notification.type === 'success'"
              stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <!-- Содержимое уведомления -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h4 class="font-medium text-sm" :class="notification.read ? 'text-base-content-70' : 'text-base-content'">
              {{ notification.title }}
            </h4>
            <p class="text-sm mt-1 text-base-content-70">
              {{ notification.message }}
            </p>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-xs text-base-content-50">
                {{ formatTime(notification.created_at) }}
              </span>
              <span 
                v-if="!notification.read" 
                class="w-2 h-2 bg-primary rounded-full"
              ></span>
            </div>
          </div>

          <!-- Действия -->
          <div v-if="showActions" class="flex gap-1 ml-2">
            <button 
              v-if="!notification.read"
              class="btn btn-xs btn-ghost"
              @click="$emit('read', notification.id)"
              title="Отметить как прочитанное"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </button>
            <button 
              class="btn btn-xs btn-ghost text-error"
              @click="$emit('remove', notification.id)"
              title="Удалить"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Ссылка на связанный объект -->
        <div v-if="notification.action_url" class="mt-2">
          <button 
            class="btn btn-xs btn-outline"
            @click="navigateToAction"
          >
            Перейти
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Notification, ID } from '@/api/types'
import { formatDateTime } from '@/utils/formatters'

interface Props {
  notification: Notification
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: false
})

const emit = defineEmits<{
  read: [id: ID]
  remove: [id: ID]
}>()

const router = useRouter()

// Методы
function getTypeClass(type: Notification['type']): string {
  const classes = {
    info: 'bg-info text-info-content',
    warning: 'bg-warning text-warning-content',
    error: 'bg-error text-error-content',
    success: 'bg-success text-success-content'
  }
  return classes[type] || 'bg-base-300 text-base-content'
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // Менее минуты
  if (diff < 60000) {
    return 'только что'
  }
  
  // Менее часа
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes} мин. назад`
  }
  
  // Менее дня
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours} ч. назад`
  }
  
  // Более дня - показываем дату
  return formatDateTime(dateString)
}

function navigateToAction() {
  if (props.notification.action_url) {
    router.push(props.notification.action_url)
  }
}
</script>

<style scoped>
.notification-item {
  transition: background-color 0.2s ease;
}

.notification-item:hover {
  background-color: var(--fallback-b2, var(--b2));
}
</style>
