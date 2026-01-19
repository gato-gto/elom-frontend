<!-- src/components/PermissionGuard.vue -->
<template>
  <slot v-if="hasAccess" />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePermissions } from '@/composables/usePermissions'
import { usePermissionsStore } from '@/stores/permissions'

/**
 * Компонент для условного рендеринга на основе разрешений RBAC
 * 
 * Использование:
 *   <PermissionGuard permission="materials.create">
 *     <button>Создать материал</button>
 *   </PermissionGuard>
 * 
 *   <PermissionGuard :any="['materials.create', 'materials.edit']">
 *     <button>Действие</button>
 *   </PermissionGuard>
 * 
 *   <PermissionGuard :all="['materials.create', 'materials.edit']">
 *     <button>Действие (требует оба права)</button>
 *   </PermissionGuard>
 * 
 *   <PermissionGuard resource="materials" action="create">
 *     <button>Создать</button>
 *   </PermissionGuard>
 * 
 *   <PermissionGuard permission="purchases.edit" :item="purchase" :show="item => item.status !== 'archived'">
 *     <button>Редактировать</button>
 *   </PermissionGuard>
 */
interface Props {
  /** Проверить одно разрешение */
  permission?: string
  /** Проверить хотя бы одно из разрешений */
  any?: string[]
  /** Проверить все указанные разрешения */
  all?: string[]
  /** Ресурс для проверки */
  resource?: string
  /** Действие для проверки */
  action?: string
  /** Элемент данных для проверки show функции */
  item?: any
  /** Функция для дополнительной проверки видимости */
  show?: (item?: any) => boolean
}

const props = defineProps<Props>()
const { hasPermission, hasAnyPermission, hasAllPermissions, can } = usePermissions()
const permissionsStore = usePermissionsStore()

// Загружаем разрешения при монтировании компонента
onMounted(() => {
  if (permissionsStore.permissions.length === 0) {
    permissionsStore.fetchPermissions()
  }
})

const hasAccess = computed(() => {
  let hasPermissionAccess = false

  // Проверка через одно разрешение
  if (props.permission) {
    hasPermissionAccess = hasPermission(props.permission)
  }
  // Проверка через любое из разрешений
  else if (props.any && props.any.length > 0) {
    hasPermissionAccess = hasAnyPermission(...props.any)
  }
  // Проверка через все разрешения
  else if (props.all && props.all.length > 0) {
    hasPermissionAccess = hasAllPermissions(...props.all)
  }
  // Проверка через resource + action
  else if (props.resource && props.action) {
    hasPermissionAccess = can(props.resource, props.action)
  }
  // Если ничего не указано, не показываем
  else {
    return false
  }

  // Дополнительная проверка через show функцию
  if (hasPermissionAccess && props.show) {
    return props.show(props.item)
  }

  return hasPermissionAccess
})
</script>
