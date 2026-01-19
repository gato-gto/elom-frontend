/**
 * Общие типы для утилит
 */

/**
 * Функция проверки прав доступа
 */
export interface PermissionChecker {
  hasPermission: (codename: string) => boolean
  hasAnyPermission: (...codenames: string[]) => boolean
  hasAllPermissions: (...codenames: string[]) => boolean
  can: (resource: string, action: string) => boolean
}
