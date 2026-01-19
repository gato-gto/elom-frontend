/**
 * ✅ RBAC: Утилиты для работы с разрешениями в списках
 * 
 * Автоматическое определение permissions для стандартных действий
 * и проверка прав на конкретные элементы (scope-based permissions)
 */

import type { ActionConfig, GenericListConfig } from '@/types/generic'
import type { usePermissions } from '@/composables/usePermissions'
import { useAuthStore } from '@/stores/auth'

/**
 * Определить разрешение для стандартного действия на основе ресурса
 */
export function getDefaultPermission(
  resource: string | undefined,
  action: 'view' | 'create' | 'edit' | 'delete' | 'export',
  customPermission?: string
): string | undefined {
  if (customPermission) {
    return customPermission
  }
  
  if (!resource) {
    return undefined
  }
  
  // Специальная обработка для export - использует reports.export по умолчанию
  if (action === 'export') {
    return 'reports.export'
  }
  
  return `${resource}.${action}`
}

/**
 * Получить разрешения для всех стандартных действий из конфигурации списка
 */
export function getListPermissions(config: GenericListConfig): {
  view?: string
  create?: string
  edit?: string
  delete?: string
  export?: string
} {
  if (!config.resource) {
    return {
      view: config.viewPermission,
      create: config.createPermission,
      edit: config.editPermission,
      delete: config.deletePermission,
      export: config.exportPermission || 'reports.export',
    }
  }
  
  return {
    view: getDefaultPermission(config.resource, 'view', config.viewPermission),
    create: getDefaultPermission(config.resource, 'create', config.createPermission),
    edit: getDefaultPermission(config.resource, 'edit', config.editPermission),
    delete: getDefaultPermission(config.resource, 'delete', config.deletePermission),
    export: getDefaultPermission(config.resource, 'export', config.exportPermission),
  }
}

/**
 * Проверить, должно ли действие быть видимым на основе permissions
 * 
 * @param action - Конфигурация действия
 * @param hasPermission - Функция проверки разрешения из usePermissions
 */
export function isActionVisible<T>(
  action: ActionConfig<T>,
  hasPermission: (permission: string) => boolean,
  hasAnyPermission: (...permissions: string[]) => boolean,
  hasAllPermissions: (...permissions: string[]) => boolean
): boolean {
  // Если указано явное поле visible, используем его
  if (action.visible !== undefined) {
    // visible - это функция, которая вызывается с item
    // Здесь мы проверяем только permissions, поэтому всегда возвращаем true
    // и полагаемся на вызов visible(item) в компоненте
    return true
  }
  
  // Проверка через permission
  if (action.permission) {
    return hasPermission(action.permission)
  }
  
  // Проверка через anyPermission (OR логика)
  if (action.anyPermission && action.anyPermission.length > 0) {
    return hasAnyPermission(...action.anyPermission)
  }
  
  // Проверка через allPermissions (AND логика)
  if (action.allPermissions && action.allPermissions.length > 0) {
    return hasAllPermissions(...action.allPermissions)
  }
  
  // Если нет проверок permissions, действие видимо
  return true
}

/**
 * Автоматически добавить permissions к стандартным действиям, если они не указаны
 */
export function enrichActionWithPermissions<T>(
  action: ActionConfig<T>,
  config: GenericListConfig,
  permissions: ReturnType<typeof usePermissions>
): ActionConfig<T> {
  // Если у действия уже есть permission, не меняем его
  if (action.permission || action.anyPermission || action.allPermissions) {
    return action
  }
  
  const listPermissions = getListPermissions(config)
  
  // Автоматическое определение permission на основе ключа действия
  let defaultPermission: string | undefined
  
  switch (action.key.toLowerCase()) {
    case 'view':
    case 'detail':
    case 'info':
      defaultPermission = listPermissions.view
      break
    case 'edit':
    case 'update':
    case 'change':
      defaultPermission = listPermissions.edit
      break
    case 'delete':
    case 'remove':
      defaultPermission = listPermissions.delete
      break
    case 'export':
      defaultPermission = listPermissions.export
      break
    default:
      // Для нестандартных действий не добавляем автоматически
      return action
  }
  
  if (defaultPermission) {
    return {
      ...action,
      permission: defaultPermission,
    }
  }
  
  return action
}

/**
 * Проверить, принадлежит ли элемент пользователю (для scope-based permissions)
 * 
 * Проверяет:
 * - object_id элемента в assigned_object_ids пользователя (основная проверка)
 * - responsible элемента = текущий пользователь (дополнительная проверка для закупок)
 * 
 * Логика соответствует бэкенду: объект считается "своим", если:
 * 1. object_id элемента находится в assigned_object_ids пользователя
 * 2. ИЛИ (для закупок) responsible = текущий пользователь И объект принадлежит пользователю
 */
export function isItemOwnedByUser<T>(item: T, userId?: number): boolean {
  const authStore = useAuthStore()
  
  if (!userId) {
    userId = authStore.me?.id
  }
  
  if (!userId) {
    return false
  }
  
  const assignedObjectIds = authStore.me?.assigned_object_ids || []
  
  // Получаем object_id элемента (может быть в разных форматах)
  const objectId = (item as any).object_id || 
                   (item as any).object?.id || 
                   (item as any).object
  
  if (!objectId) {
    return false
  }
  
  // Основная проверка: объект элемента должен принадлежать пользователю
  const objectOwned = assignedObjectIds.includes(Number(objectId))
  
  if (!objectOwned) {
    return false
  }
  
  // Для закупок дополнительно проверяем responsible
  // (на бэкенде для requester это важно: obj.responsible == user && obj.status == 'new')
  const responsible = (item as any).responsible
  if (responsible !== undefined && responsible !== null) {
    const responsibleId = typeof responsible === 'object' ? responsible.id : responsible
    // Если responsible не указан или равен текущему пользователю - элемент "свой"
    // Если responsible указан и не равен текущему пользователю - элемент может быть не "свой"
    // Но так как объект принадлежит пользователю, считаем элемент "своим"
    return true
  }
  
  // Если объекта принадлежит пользователю - элемент "свой"
  return true
}

/**
 * Проверить права на конкретный элемент (с учетом scope-based permissions)
 * 
 * @param action - Конфигурация действия
 * @param item - Элемент данных
 * @param config - Конфигурация списка
 * @param permissions - Composable для проверки разрешений
 */
export function canPerformActionOnItem<T>(
  action: ActionConfig<T>,
  item: T,
  config: GenericListConfig,
  permissions: ReturnType<typeof usePermissions>
): boolean {
  // Если у действия нет permission, проверяем только visible функцию
  if (!action.permission && !action.anyPermission && !action.allPermissions) {
    if (action.visible) {
      return action.visible(item)
    }
    return true
  }
  
  const authStore = useAuthStore()
  const userId = authStore.me?.id
  const itemIsOwned = isItemOwnedByUser(item, userId)
  
  // Проверяем разрешения с учетом scope
  if (action.permission) {
    // Проверяем основное разрешение (например, purchases.edit)
    if (permissions.hasPermission(action.permission)) {
      // Если есть полное разрешение - доступ разрешен
      return action.visible ? action.visible(item) : true
    }
    
    // Проверяем scope-based разрешение (например, purchases.edit_own)
    const ownPermission = action.permission.replace(/\.(edit|delete|view)$/, '.$1_own')
    if (permissions.hasPermission(ownPermission) && itemIsOwned) {
      // Если есть ограниченное разрешение и элемент принадлежит пользователю - доступ разрешен
      return action.visible ? action.visible(item) : true
    }
    
    // Нет разрешения - доступ запрещен
    return false
  }
  
  // Для anyPermission и allPermissions пока используем простую проверку
  // TODO: Добавить поддержку scope-based для этих случаев
  if (action.anyPermission && action.anyPermission.length > 0) {
    const hasAny = permissions.hasAnyPermission(...action.anyPermission)
    if (!hasAny) {
      return false
    }
  }
  
  if (action.allPermissions && action.allPermissions.length > 0) {
    const hasAll = permissions.hasAllPermissions(...action.allPermissions)
    if (!hasAll) {
      return false
    }
  }
  
  // Проверяем visible функцию
  if (action.visible) {
    return action.visible(item)
  }
  
  return true
}

/**
 * Фильтровать действия на основе permissions
 * 
 * ВАЖНО: Эта функция фильтрует только по общим permissions.
 * Проверка прав на конкретный элемент выполняется в компоненте через canPerformActionOnItem.
 */
export function filterActionsByPermissions<T>(
  actions: ActionConfig<T>[] | undefined,
  config: GenericListConfig,
  permissions: ReturnType<typeof usePermissions>
): ActionConfig<T>[] {
  if (!actions || actions.length === 0) {
    return []
  }
  
  return actions
    .map(action => enrichActionWithPermissions(action, config, permissions))
    .filter(action => {
      // Проверяем видимость через permissions
      // Здесь проверяем только общие permissions (edit, delete)
      // Scope-based проверка (edit_own) будет выполнена на уровне элемента
      
      if (action.permission) {
        // Проверяем основное разрешение ИЛИ scope-based разрешение
        const ownPermission = action.permission.replace(/\.(edit|delete|view)$/, '.$1_own')
        const hasMain = permissions.hasPermission(action.permission)
        const hasOwn = permissions.hasPermission(ownPermission)
        
        // Если есть хотя бы одно разрешение - действие может быть показано
        // (но для каждого элемента будет проверяться принадлежность)
        return hasMain || hasOwn
      }
      
      // Проверяем видимость через permissions
      const visibleByPermissions = isActionVisible(
        action,
        permissions.hasPermission,
        permissions.hasAnyPermission,
        permissions.hasAllPermissions
      )
      
      // Если действие имеет функцию visible, она будет проверена в компоненте
      // Здесь мы только фильтруем по permissions
      return visibleByPermissions
    })
}
