<template>
  <div class="role-assignment">
    <!-- Header -->
    <div class="mb-4">
      <label class="label">
        <span class="label-text font-semibold">Роли пользователя</span>
        <span class="label-text-alt text-base-content/70">
          Выберите роли для назначения. Можно выбрать несколько ролей.
        </span>
      </label>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md"></span>
      <span class="ml-3 text-base-content/70">Загрузка ролей...</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="alert alert-error mb-4">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <div class="flex-1">
        <div class="font-semibold">Ошибка загрузки ролей</div>
        <div class="text-sm">{{ error }}</div>
      </div>
      <button @click="handleRefreshRoles" class="btn btn-sm btn-ghost">Повторить</button>
    </div>

    <!-- Roles list -->
    <div v-else class="space-y-2">
      <!-- Available roles -->
      <template v-for="role in availableRoles" :key="role.id">
          <div 
          class="group flex items-start gap-3 p-3 border border-base-300 rounded-lg hover:bg-base-200 hover:border-primary transition-all cursor-pointer"
          @click="handleDivClick(role, $event)"
        >
          <input
            type="checkbox"
            :id="`role-${role.id}`"
            :checked="isRoleAssigned(role.id)"
            :disabled="getCheckboxDisabledForRole(role)"
            @change.stop="handleCheckboxChange(role, $event)"
            @click.stop="handleCheckboxClick(role, $event)"
            class="checkbox checkbox-primary checkbox-sm mt-0.5"
          />
          <label :for="`role-${role.id}`" class="cursor-pointer flex-1" @click.stop="handleLabelClick(role, $event)">
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ role.display_name || 'Неизвестная роль' }}</span>
              <span v-if="isRoleSystem(role)" class="badge badge-info badge-xs">Системная</span>
              <span v-if="isRoleAssigned(role.id)" class="badge badge-success badge-xs">Выбрана</span>
            </div>
            <div v-if="role.description" class="text-sm text-base-content/70 mt-1">
              {{ role.description }}
            </div>
            <div v-else class="text-xs text-base-content/50 mt-1 italic">
              Нет описания
            </div>
          </label>
        </div>
      </template>

      <!-- No roles message -->
      <div v-if="availableRoles.length === 0 && !loading && !error" class="text-center py-8 text-base-content/50">
        <svg class="w-12 h-12 mx-auto mb-3 text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
        <p class="text-base-content/70 font-medium">Нет доступных ролей</p>
        <p class="text-sm text-base-content/50 mt-1">
          Роли могут быть еще не загружены или не настроены в системе.
        </p>
        <button 
          v-if="!loading && canManageRoles"
          @click="handleRefreshRoles"
          class="btn btn-sm btn-outline mt-3"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Обновить список
        </button>
      </div>
    </div>

    <!-- Selected roles summary -->
    <div v-if="selectedRoleIds.length > 0" class="mt-4 p-3 bg-base-200 rounded-lg">
      <div class="text-sm font-semibold mb-2">
        Выбранные роли ({{ selectedRoleIds.length }}):
      </div>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="roleId in selectedRoleIds"
          :key="roleId"
          class="badge badge-primary badge-lg gap-1"
        >
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          {{ getRoleDisplayName(roleId) }}
        </span>
      </div>
    </div>

    <!-- Help text -->
    <div class="mt-4 text-xs text-base-content/60 border-t border-base-300 pt-3">
      <p class="flex items-start gap-2">
        <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>Роли определяют набор разрешений пользователя. Можно назначить несколько ролей одновременно.</span>
      </p>
      <p v-if="!canManageRoles" class="mt-2 text-warning flex items-start gap-2">
        <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span>
          Для назначения ролей требуется разрешение <code class="bg-base-300 px-1 rounded text-xs">rbac.manage_user_roles</code>
          <span class="text-xs block mt-1 text-base-content/50">
            Текущие разрешения: {{ permissionsStore.permissions.map(p => p.codename).join(', ') || 'не загружены' }}
          </span>
        </span>
      </p>
      <p v-if="props.disabled" class="mt-2 text-base-content/50 flex items-start gap-2">
        <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        <span>Редактирование ролей отключено</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRbacStore } from '@/stores/rbac'
import { parseApiError } from '@/utils/errorHandler'
import { usePermissions } from '@/composables/usePermissions'
import { usePermissionsStore } from '@/stores/permissions'
import type { Role } from '@/api/types/rbac'

interface Props {
  userId?: number  // ID пользователя (для редактирования)
  selectedRoleIds?: number[]  // Предвыбранные роли (для синхронизации с формой)
  disabled?: boolean
}

interface Emits {
  (e: 'update:selectedRoleIds', value: number[]): void
  (e: 'change', roleIds: number[]): void
}

const props = withDefaults(defineProps<Props>(), {
  selectedRoleIds: () => [],
  disabled: false
})

const emit = defineEmits<Emits>()

const rbacStore = useRbacStore()
const { can, canManageUserRoles } = usePermissions()
const permissionsStore = usePermissionsStore()

// Проверка прав доступа - используем computed напрямую
const canManageRoles = canManageUserRoles


// Local state
const loading = ref(false)
const error = ref<string | null>(null)
const localSelectedRoleIds = ref<number[]>([])

// Sync with prop
watch(() => props.selectedRoleIds, (newVal) => {
  localSelectedRoleIds.value = [...newVal]
}, { immediate: true })

// Load roles and permissions on mount
onMounted(async () => {
  // Загружаем разрешения при монтировании, если их нет
  // Используем force=true чтобы гарантировать актуальные данные
  if (permissionsStore.permissions.length === 0) {
    await permissionsStore.fetchPermissions(true)
  } else {
    // Обновляем разрешения в фоне, если они устарели
    permissionsStore.fetchPermissions(false).catch(() => {
      // Игнорируем ошибки фонового обновления
    })
  }
  
  const currentRoles = Array.isArray(rbacStore.roles) ? rbacStore.roles : []
  if (currentRoles.length === 0) {
    loading.value = true
    try {
      await rbacStore.fetchRoles()
    } catch (err: any) {
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
    } finally {
      loading.value = false
    }
  }

  // Load user roles if editing
  // ✅ Загружаем ВСЕ роли (включая неактивные) для отображения в компоненте
  // Неактивные роли можно будет увидеть и реактивировать
  if (props.userId) {
    try {
      await rbacStore.getUserRoles(props.userId, false, true) // forceReload=false, includeInactive=true для редактирования
      // Получаем все роли (активные и неактивные) для отображения
      const allUserRoles = rbacStore.userRoles[props.userId] || []
      
      // Показываем как активные, так и неактивные роли (для возможности реактивации)
      if (Array.isArray(allUserRoles)) {
        // ✅ Упрощено: is_active больше не используется - выбираем все назначенные роли
        const roleIds = allUserRoles
          .filter(ur => ur && ur.role_id)
          .map(ur => ur.role_id)
        
        localSelectedRoleIds.value = roleIds
        emit('update:selectedRoleIds', localSelectedRoleIds.value)
      }
    } catch (err) {
      console.error('Failed to load user roles:', err)
    }
  }
})

// Computed
const availableRoles = computed(() => {
  try {
    const roles = rbacStore.roles
    if (!roles || !Array.isArray(roles)) {
      return []
    }
    
    return roles.filter((role): role is Role => {
      return role != null && 
             typeof role === 'object' && 
             'id' in role && 
             typeof role.id === 'number' &&
             'name' in role &&
             Boolean(role.id)
    })
  } catch (err) {
    console.error('Error filtering roles:', err)
    return []
  }
})

const isRoleAssigned = (roleId: number): boolean => {
  return localSelectedRoleIds.value.includes(roleId)
}

const isRoleSystem = (role: Role): boolean => {
  // Проверяем через is_system из API
  return role?.is_system === true
}

const getCheckboxDisabled = (role: Role): boolean => {
  // Системные роли можно назначать пользователям, но нельзя редактировать/удалять сами роли
  // Поэтому проверяем только права доступа и props.disabled
  // Если canManageRoles.value === undefined, считаем что права еще не загружены, блокируем
  return props.disabled || canManageRoles.value !== true
}

const getRoleDisplayName = (roleId: number): string => {
  try {
    // ✅ getRoleById - это computed, который возвращает функцию
    // Вызываем функцию, переданную из computed
    const role = rbacStore.getRoleById(roleId)
    if (role && role.display_name) {
      return role.display_name
    }
    return 'Неизвестная роль'
  } catch (err) {
    console.error('Error getting role display name:', err)
    return 'Неизвестная роль'
  }
}

// Функция для получения disabled состояния для template
const getCheckboxDisabledForRole = (role: Role): boolean => {
  return getCheckboxDisabled(role)
}

// Event handlers
const handleDivClick = (role: Role, event: MouseEvent) => {
  // Only handle clicks on the div itself, not on input or label
  if ((event.target as HTMLElement)?.tagName === 'INPUT' || (event.target as HTMLElement)?.tagName === 'LABEL') {
    return
  }
  const disabled = getCheckboxDisabled(role)
  if (!disabled && canManageRoles.value === true) {
    toggleRole(role.id)
  }
}

const handleCheckboxChange = (role: Role, event: Event) => {
  const disabled = getCheckboxDisabled(role)
  if (!disabled) {
    toggleRole(role.id)
  }
}

const handleCheckboxClick = (role: Role, event: MouseEvent) => {
  // Don't prevent default - let the checkbox change naturally
}

const handleLabelClick = (role: Role, event: MouseEvent) => {
  // Label click will naturally trigger checkbox change, so we don't need to do anything here
  // But we stop propagation to prevent div click handler from firing
}

// Methods
const toggleRole = async (roleId: number) => {
  if (canManageRoles.value !== true || props.disabled) {
    return
  }

  const role = rbacStore.getRoleById(roleId)
  const isCurrentlyAssigned = isRoleAssigned(roleId)
  const isSystemRole = role ? isRoleSystem(role) : false

  // Предупреждение при отзыве критичных ролей
  if (isCurrentlyAssigned && isSystemRole) {
    const roleName = role?.display_name || 'роль'
    if (!confirm(`Вы уверены, что хотите отозвать системную роль "${roleName}"?\n\nЭто может повлиять на доступ пользователя к критичным функциям системы.`)) {
      return
    }
  }

  if (isCurrentlyAssigned) {
    // Remove role
    localSelectedRoleIds.value = localSelectedRoleIds.value.filter(id => id !== roleId)
  } else {
    // Add role
    localSelectedRoleIds.value = [...localSelectedRoleIds.value, roleId]
  }

  emit('update:selectedRoleIds', localSelectedRoleIds.value)
  emit('change', localSelectedRoleIds.value)
}

// Handle refresh roles button
const handleRefreshRoles = async () => {
  loading.value = true
  error.value = null
  try {
    await rbacStore.fetchRoles()
  } catch (err: any) {
    const parsedError = parseApiError(err)
    error.value = parsedError.detail
  } finally {
    loading.value = false
  }
}

// Watch for external changes
watch(() => props.selectedRoleIds, (newVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(localSelectedRoleIds.value)) {
    localSelectedRoleIds.value = [...newVal]
  }
})
</script>

<style scoped>
.role-assignment {
  @apply w-full;
}

/* Checkbox styling */
.checkbox {
  @apply transition-all;
}


</style>
