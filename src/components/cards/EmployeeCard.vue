<template>
  <MobileCard
    :title="getEmployeeFullName()"
    :badge="getRoleDisplayName()"
    :badge-class="getRoleBadgeClass()"
    :actions="actions"
    @action="$emit('action', $event)"
  >
    <template #content>
      <div class="space-y-2 text-sm">
        <div>
          <span class="text-base-content/60">Логин:</span>
          <span class="font-medium ml-2">{{ employee.username }}</span>
        </div>
        
        <div v-if="employee.email">
          <span class="text-base-content/60">Email:</span>
          <span class="font-medium ml-2">{{ employee.email }}</span>
        </div>
        
        <div v-if="employee.phone">
          <span class="text-base-content/60">Телефон:</span>
          <span class="font-medium ml-2">{{ employee.phone }}</span>
        </div>
        
        <div v-if="employee.roles && employee.roles.length > 0">
          <span class="text-base-content/60">Роли:</span>
          <span class="font-medium ml-2">
            <span
              v-for="role in employee.roles"
              :key="role.id"
              class="badge badge-sm badge-primary mr-1"
            >
              {{ role.display_name }}
            </span>
          </span>
        </div>
        <div v-else>
          <span class="text-base-content/60">Роль:</span>
          <span class="font-medium ml-2">
            <span class="badge badge-sm badge-ghost">Нет роли</span>
          </span>
        </div>
        
        <div>
          <span class="text-base-content/60">Статус:</span>
          <span class="font-medium ml-2">
            <span class="badge badge-sm" :class="employee.is_active ? 'badge-success' : 'badge-error'">
              {{ employee.is_active ? 'Активен' : 'Неактивен' }}
            </span>
          </span>
        </div>
        
        <div v-if="employee.assigned_objects_count">
          <span class="text-base-content/60">Назначенных объектов:</span>
          <span class="font-medium ml-2 font-mono">{{ employee.assigned_objects_count }}</span>
        </div>
        
        <div v-if="employee.last_login">
          <span class="text-base-content/60">Последний вход:</span>
          <span class="font-medium ml-2 font-mono">{{ formatDate(employee.last_login) }}</span>
        </div>
        
        <div v-if="employee.assigned_objects && employee.assigned_objects.length > 0">
          <span class="text-base-content/60">Назначенные объекты:</span>
          <div class="font-medium ml-2">
            <div class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="objectName in employee.assigned_objects.slice(0, 3)"
                :key="objectName"
                class="badge badge-outline badge-xs"
              >
                {{ truncateText(objectName, 15) }}
              </span>
              <span
                v-if="employee.assigned_objects.length > 3"
                class="badge badge-ghost badge-xs"
              >
                +{{ employee.assigned_objects.length - 3 }}
              </span>
            </div>
          </div>
        </div>
        
        <div v-if="employee.purchases_count">
          <span class="text-base-content/60">Закупок:</span>
          <span class="font-medium ml-2 font-mono">{{ employee.purchases_count }}</span>
        </div>
        
        <div v-if="employee.total_purchases_amount">
          <span class="text-base-content/60">Общая сумма закупок:</span>
          <span class="font-medium ml-2 font-mono">{{ employee.total_purchases_amount }}</span>
        </div>
      </div>
    </template>
    
    <template #extra>
      <div class="flex justify-between items-center text-xs text-base-content/60">
        <span>Создан: <span class="font-mono">{{ formatDate(employee.created_at || null) }}</span></span>
        <span v-if="employee.updated_at !== employee.created_at">
          Обновлен: <span class="font-mono">{{ formatDate(employee.updated_at || null) }}</span>
        </span>
      </div>
    </template>
  </MobileCard>
</template>

<script setup lang="ts">
import { User } from '@/api/types/employees'
import MobileCard from '@/components/MobileCard.vue'
import { useMobileCardHelpers } from '@/composables/useResponsiveTable'
import { formatDate } from '@/utils/formatters'
import { getStatusBadgeClass, getStatusLabel } from '@/utils/statusHelpers'

interface Props {
  employee: User & {
    phone?: string
    assigned_objects?: string[]
    assigned_objects_count?: number
    last_login?: string
    purchases_count?: number
    total_purchases_amount?: string
  }
  actions?: Array<{
    key: string
    label: string
    shortLabel?: string
    class?: string
    disabled?: boolean
    tooltip?: string
    icon?: any
  }>
}

interface Emits {
  (e: 'action', action: string): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const { truncateText } = useMobileCardHelpers()

const getEmployeeFullName = () => {
  const parts = [props.employee.first_name, props.employee.last_name].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : props.employee.username
}

// ✅ RBAC: Используем роли из RBAC
const getRoleDisplayName = (): string => {
  if (props.employee.roles && props.employee.roles.length > 0) {
    return props.employee.roles.map(r => r.display_name).join(', ')
  }
  return 'Нет роли'
}

const getRoleBadgeClass = (): string => {
  if (props.employee.roles && props.employee.roles.length > 0) {
    return 'badge-primary'
  }
  return 'badge-ghost'
}
</script>