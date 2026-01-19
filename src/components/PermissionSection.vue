<!-- src/components/PermissionSection.vue -->
<template>
  <div v-if="hasAccess" :class="sectionClass">
    <div v-if="title || $slots.header" class="section-header">
      <h3 v-if="title" class="section-title">{{ title }}</h3>
      <slot name="header" />
    </div>
    <div class="section-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePermissions } from '@/composables/usePermissions'

/**
 * Секция UI с проверкой прав доступа
 * 
 * Использование:
 *   <PermissionSection 
 *     permission="reports.view"
 *     title="Отчеты"
 *   >
 *     <ReportList />
 *   </PermissionSection>
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
  /** Заголовок секции */
  title?: string
  /** Дополнительные классы */
  class?: string
  /** Показывать границы */
  bordered?: boolean
  /** Показывать фон */
  background?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  bordered: true,
  background: false
})

const { hasPermission, hasAnyPermission, hasAllPermissions, can } = usePermissions()

// Проверка доступа
const hasAccess = computed(() => {
  // Проверка через одно разрешение
  if (props.permission) {
    return hasPermission(props.permission)
  }
  
  // Проверка через любое из разрешений
  if (props.any && props.any.length > 0) {
    return hasAnyPermission(...props.any)
  }
  
  // Проверка через все разрешения
  if (props.all && props.all.length > 0) {
    return hasAllPermissions(...props.all)
  }
  
  // Проверка через resource + action
  if (props.resource && props.action) {
    return can(props.resource, props.action)
  }
  
  // Если ничего не указано, показываем
  return true
})

// Классы секции
const sectionClass = computed(() => {
  const base = 'permission-section'
  const classes = [base]
  
  if (props.bordered) {
    classes.push('border rounded-lg p-4')
  }
  
  if (props.background) {
    classes.push('bg-base-200')
  }
  
  if (props.class) {
    classes.push(props.class)
  }
  
  return classes.join(' ')
})
</script>

<style scoped>
.section-header {
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: hsl(var(--bc));
  margin: 0;
}

.section-content {
  /* Контент секции */
}
</style>
