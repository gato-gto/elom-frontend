// src/composables/usePermissions.ts
import { computed } from 'vue'
import { usePermissionsStore } from '@/stores/permissions'
import { useAuthStore } from '@/stores/auth'

/**
 * Composable для работы с разрешениями RBAC
 * 
 * ВАЖНО: Используйте permissions для проверки доступа, а не имена ролей!
 * Роли могут изменяться, удаляться, добавляться без изменения кода.
 */
export function usePermissions() {
  const permissionsStore = usePermissionsStore()
  const authStore = useAuthStore()
  
  /**
   * Проверить, есть ли у пользователя разрешение
   * 
   * @param codename - Код разрешения (например: 'materials.create')
   */
  const hasPermission = (codename: string): boolean => {
    if (authStore.me?.is_superuser) {
      return true // Суперпользователь имеет все права
    }
    // hasPermission в store это computed, который возвращает функцию
    // В Pinia computed автоматически разворачивается при экспорте из store
    // Поэтому permissionsStore.hasPermission это уже функция, а не computed ref
    return permissionsStore.hasPermission(codename)
  }
  
  /**
   * Проверить, есть ли хотя бы одно из разрешений
   * 
   * @param codenames - Коды разрешений
   */
  const hasAnyPermission = (...codenames: string[]): boolean => {
    if (authStore.me?.is_superuser) { return true } // Суперпользователь имеет все права
    return permissionsStore.hasAnyPermission(...codenames)
  }
  
  /**
   * Проверить, есть ли все указанные разрешения
   * 
   * @param codenames - Коды разрешений
   */
  const hasAllPermissions = (...codenames: string[]): boolean => {
    if (authStore.me?.is_superuser) { return true } // Суперпользователь имеет все права
    return permissionsStore.hasAllPermissions(...codenames)
  }
  
  /**
   * Проверить доступ к ресурсу с действием
   * 
   * @param resource - Ресурс (например: 'materials')
   * @param action - Действие (например: 'create')
   */
  const can = (resource: string, action: string): boolean => {
    return hasPermission(`${resource}.${action}`)
  }
  
  /**
   * Получить роли пользователя (только для отображения в UI!)
   * 
   * ВАЖНО: Не используйте для логики доступа!
   * Используйте permissions для проверки доступа.
   */
  const getUserRoles = computed(() => permissionsStore.roles)
  
  /**
   * Проверить, есть ли у пользователя роль (только для UI!)
   * 
   * ВАЖНО: Используйте только для отображения, не для логики доступа!
   * Для проверки доступа используйте hasPermission/can.
   */
  const hasRole = (roleName: string): boolean => {
    return permissionsStore.roles.some(r => r.name === roleName)
  }
  
  /**
   * Проверить, есть ли хотя бы одна из ролей (только для UI!)
   * 
   * ВАЖНО: Используйте только для отображения, не для логики доступа!
   */
  const hasAnyRole = (...roleNames: string[]): boolean => {
    const userRoleNames = new Set(permissionsStore.roles.map(r => r.name))
    return roleNames.some(name => userRoleNames.has(name))
  }
  
  // ============================================================
  // Специальные проверки для бизнес-логики
  // Эти методы используют permissions, но скрывают детали реализации
  // ============================================================
  
  /**
   * Может ли пользователь создавать заявки (requester функционал).
   *
   * F-517: раньше проверяли ТОЛЬКО `purchases.create`. Но у роли «Заявитель» право называется
   * `purchases.create_request` (создание заявки, не полноценной закупки) — с одним `create` она
   * получала canCreateRequests=false и оставалась БЕЗ кнопки создания: роль, смысл которой
   * подавать заявки, не могла подать ни одной (замерено вживую на проде: 0 кнопок создания на
   * /purchases). Бэкенд POST-заявку по create_request уже принимает
   * (PurchasesPermission: create ИЛИ create_request), то есть доступ реально был — прятал его
   * фронт. Тот же класс, что F-512: фронт-гард проверял не тот вариант права. Модель прав не
   * меняем — выравниваем фронт с уже существующим и соблюдаемым бэком доступом.
   */
  const canCreateRequests = computed(() =>
    (hasPermission('purchases.create') || hasPermission('purchases.create_request')) &&
    !hasPermission('purchases.approve')
  )
  
  /**
   * Может ли пользователь только просматривать (без редактирования)
   */
  const isViewOnly = computed(() => 
    !hasAnyPermission('purchases.create', 'purchases.edit', 'materials.create', 'materials.edit')
  )
  
  /**
   * Может ли пользователь одобрять закупки
   */
  const canApprovePurchases = computed(() => hasPermission('purchases.approve'))
  
  /**
   * Может ли пользователь управлять сотрудниками
   */
  const canManageEmployees = computed(() => hasPermission('employees.edit'))
  
  /**
   * Может ли пользователь видеть отчеты
   */
  const canViewReports = computed(() => hasPermission('reports.view'))
  
  /**
   * Может ли пользователь экспортировать отчеты/данные
   */
  const canExportReports = computed(() => hasPermission('reports.export'))
  
  /**
   * Может ли пользователь управлять ролями RBAC
   */
  const canManageRoles = computed(() => hasPermission('rbac.manage_roles'))
  
  /**
   * Может ли пользователь управлять ролями пользователей (назначать/отзывать роли)
   */
  const canManageUserRoles = computed(() => {
    return hasPermission('rbac.manage_user_roles')
  })
  
  /**
   * Может ли пользователь управлять пользователями
   */
  const canManageUsers = computed(() => hasPermission('employees.edit'))
  
  return {
    // Основные методы проверки доступа (используйте эти!)
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    
    // Специальные проверки для бизнес-логики
    canCreateRequests,
    isViewOnly,
    canApprovePurchases,
    canManageEmployees,
    canViewReports,
    canExportReports,
    canManageRoles,
    canManageUserRoles,
    canManageUsers,
    
    // Методы для работы с ролями (только для UI!)
    getUserRoles,
    hasRole,
    hasAnyRole,
  }
}
