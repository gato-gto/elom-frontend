<!-- src/components/PermissionFilter.vue -->
<template>
  <FilterField
    v-if="hasAccess"
    :model-value="modelValue"
    :type="type"
    :label="label"
    :placeholder="placeholder"
    :options="options"
    :required="required"
    :disabled="disabled"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePermissions } from '@/composables/usePermissions'
import FilterField from './FilterField.vue'

/**
 * Фильтр с проверкой прав доступа
 * 
 * Использование:
 *   <PermissionFilter
 *     permission="purchases.view_all"
 *     type="select"
 *     label="Ответственный"
 *     :options="employeeOptions"
 *   />
 */
interface Props {
  /** Проверить одно разрешение */
  permission?: string
  /** Проверить хотя бы одно из разрешений */
  any?: string[]
  /** Ресурс для проверки */
  resource?: string
  /** Действие для проверки */
  action?: string
  /** Тип поля */
  type: 'text' | 'select' | 'date' | 'number'
  /** Метка */
  label: string
  /** Placeholder */
  placeholder?: string
  /** Опции для select */
  options?: Array<{ value: any; label: string }>
  /** Обязательное поле */
  required?: boolean
  /** Отключено */
  disabled?: boolean
  /** Значение */
  modelValue?: any
}

const props = defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: any]
}>()

const { hasPermission, hasAnyPermission, can } = usePermissions()

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
  
  // F-070 (безопасность): неполная пара resource/action = fail-closed, не fail-open.
  if (props.resource || props.action) {
    return !!(props.resource && props.action) && can(props.resource, props.action)
  }

  // Никаких ограничений не задано — показываем.
  return true
})
</script>
