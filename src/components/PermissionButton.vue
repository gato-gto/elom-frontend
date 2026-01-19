<!-- src/components/PermissionButton.vue -->
<template>
  <component
    :is="tag"
    v-if="hasAccess"
    :class="buttonClass"
    :disabled="disabled || loading"
    :type="type"
    :to="to"
    :href="href"
    @click="handleClick"
  >
    <slot name="icon">
      <svg v-if="icon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icon" />
      </svg>
    </slot>
    <span v-if="$slots.default || label">
      <slot>{{ label }}</slot>
    </span>
    <LoadingSpinner v-if="loading" size="sm" class="ml-2" />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePermissions } from '@/composables/usePermissions'
import LoadingSpinner from './LoadingSpinner.vue'

/**
 * Универсальная кнопка с проверкой прав доступа
 * 
 * Использование:
 *   <PermissionButton 
 *     permission="materials.create"
 *     label="Создать материал"
 *     @click="handleCreate"
 *   />
 * 
 *   <PermissionButton 
 *     resource="purchases"
 *     action="approve"
 *     variant="success"
 *     :item="purchase"
 *     :show="item => item.status === 'new'"
 *   />
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
  /** Текст кнопки */
  label?: string
  /** Иконка (SVG path) */
  icon?: string
  /** Вариант стиля */
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'outline' | 'ghost'
  /** Размер */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** HTML тег (button, a, router-link) */
  tag?: 'button' | 'a' | 'router-link'
  /** Тип кнопки (для button) */
  type?: 'button' | 'submit' | 'reset'
  /** Router link to */
  to?: string | object
  /** Href для ссылки */
  href?: string
  /** Отключена ли кнопка */
  disabled?: boolean
  /** Загрузка */
  loading?: boolean
  /** Дополнительные классы */
  class?: string
  /** Элемент данных для проверки show функции */
  item?: any
  /** Функция для дополнительной проверки видимости */
  show?: (item?: any) => boolean
  /** Показывать только иконку (без текста) */
  iconOnly?: boolean
  /** Показывать tooltip при iconOnly */
  tooltip?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  tag: 'button',
  type: 'button',
  iconOnly: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const { hasPermission, hasAnyPermission, hasAllPermissions, can } = usePermissions()

// Проверка доступа
const hasAccess = computed(() => {
  // Дополнительная проверка через show функцию
  if (props.show && !props.show(props.item)) {
    return false
  }

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
  
  // Если ничего не указано, показываем (для обратной совместимости)
  return true
})

// Классы кнопки
const buttonClass = computed(() => {
  const base = 'btn inline-flex items-center gap-2 transition-all'
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    error: 'btn-error',
    warning: 'btn-warning',
    info: 'btn-info',
    outline: 'btn-outline',
    ghost: 'btn-ghost'
  }
  const sizes = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  }
  
  return [
    base,
    variants[props.variant],
    sizes[props.size],
    props.iconOnly && 'btn-square',
    props.class
  ].filter(Boolean).join(' ')
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>
