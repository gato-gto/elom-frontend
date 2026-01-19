/**
 * Утилиты для создания конфигураций действий с проверкой прав
 * 
 * Использование:
 *   import { createActionConfig, createActionsConfig } from '@/utils/permissionActions'
 *   import { usePermissions } from '@/composables/usePermissions'
 * 
 *   const { can } = usePermissions()
 * 
 *   const actions = createActionsConfig([
 *     {
 *       key: 'edit',
 *       label: 'Редактировать',
 *       permission: 'materials.edit',
 *       variant: 'primary'
 *     },
 *     {
 *       key: 'delete',
 *       label: 'Удалить',
 *       permission: 'materials.delete',
 *       variant: 'error',
 *       requireConfirm: true
 *     }
 *   ], can)
 */

// Тип PermissionChecker определен ниже в этом файле

/**
 * Конфигурация одного действия
 */
export interface ActionConfig {
  key: string
  label: string
  shortLabel?: string
  icon?: string
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'outline' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  class?: string
  
  // Проверка прав
  permission?: string
  any?: string[]
  all?: string[]
  resource?: string
  action?: string
  
  // Условное отображение
  show?: (item: any) => boolean
  disabled?: (item: any) => boolean
  
  // Дополнительные опции
  requireConfirm?: boolean
  confirmMessage?: string
  tooltip?: string
  iconOnly?: boolean
}

/**
 * Результат конфигурации действия (с проверкой прав)
 */
export interface ResolvedActionConfig extends ActionConfig {
  visible: (item?: any) => boolean
  enabled: (item?: any) => boolean
}

/**
 * Создать конфигурацию одного действия с проверкой прав
 */
export function createActionConfig(
  config: ActionConfig,
  permissionChecker: PermissionChecker
): ResolvedActionConfig {
  const { hasPermission, hasAnyPermission, hasAllPermissions, can } = permissionChecker

  // Функция проверки прав
  const hasAccess = (): boolean => {
    if (config.permission) {
      return hasPermission(config.permission)
    }
    if (config.any && config.any.length > 0) {
      return hasAnyPermission(...config.any)
    }
    if (config.all && config.all.length > 0) {
      return hasAllPermissions(...config.all)
    }
    if (config.resource && config.action) {
      return can(config.resource, config.action)
    }
    // Если нет проверки прав, показываем
    return true
  }

  return {
    ...config,
    visible: (item?: any) => {
      // Проверка прав
      if (!hasAccess()) {
        return false
      }
      // Дополнительная проверка через show
      if (config.show) {
        return config.show(item)
      }
      return true
    },
    enabled: (item?: any) => {
      // Проверка disabled функции
      if (config.disabled) {
        return !config.disabled(item)
      }
      return true
    }
  }
}

/**
 * Создать конфигурацию нескольких действий с проверкой прав
 */
export function createActionsConfig(
  configs: ActionConfig[],
  permissionChecker: PermissionChecker
): ResolvedActionConfig[] {
  return configs
    .map(config => createActionConfig(config, permissionChecker))
    .filter(action => action.visible()) // Фильтруем действия без доступа
}

/**
 * Тип для функции проверки прав
 */
export interface PermissionChecker {
  hasPermission: (codename: string) => boolean
  hasAnyPermission: (...codenames: string[]) => boolean
  hasAllPermissions: (...codenames: string[]) => boolean
  can: (resource: string, action: string) => boolean
}

/**
 * Создать конфигурацию действий для GenericList
 * 
 * @example
 * const listActions = createListActions([
 *   {
 *     key: 'view',
 *     label: 'Просмотр',
 *     permission: 'purchases.view'
 *   },
 *   {
 *     key: 'edit',
 *     label: 'Редактировать',
 *     permission: 'purchases.edit',
 *     show: (item) => item.status !== 'archived'
 *   }
 * ], usePermissions())
 */
export function createListActions(
  configs: ActionConfig[],
  permissionChecker: PermissionChecker
) {
  return createActionsConfig(configs, permissionChecker).map(action => ({
    key: action.key,
    label: action.label,
    shortLabel: action.shortLabel,
    class: action.class || `btn-${action.variant || 'outline'} btn-${action.size || 'sm'}`,
    show: action.visible,
    disabled: (item: any) => !action.enabled(item),
    requireConfirm: action.requireConfirm,
    confirmMessage: action.confirmMessage,
    tooltip: action.tooltip
  }))
}
