// src/api/types/rbac.ts
/**
 * Типы для RBAC системы
 * 
 * ВАЖНО: Роли НЕ фиксируются здесь как константы!
 * Роли получаются динамически из API и могут изменяться.
 */

/**
 * Разрешение (Permission)
 */
export interface Permission {
  id: number
  codename: string  // materials.create, purchases.view
  resource: string  // materials, purchases, objects
  action: string    // view, create, edit, delete, export
  name: string     // "Создание материалов"
  description?: string
  is_active: boolean
}

/**
 * Роль (Role) - динамическая, получается из API
 * 
 * ВАЖНО: Не используйте имена ролей напрямую в коде!
 * Используйте permissions для проверки доступа.
 */
export interface Role {
  id: number
  name: string           // admin, manager, etc. (динамическое значение!)
  display_name: string  // "Администратор", "Управляющий"
  description?: string
  is_system?: boolean    // Системная роль (нельзя удалять)
}

/**
 * Ответ API с разрешениями текущего пользователя
 */
export interface UserPermissionsResponse {
  permissions: Permission[]
  roles: Role[]  // Роли только для отображения в UI, НЕ для логики доступа!
}

/**
 * Связь пользователя с ролью (UserRole)
 * 
 * ✅ Упрощено: поле is_active удалено - роль либо назначена (есть запись), либо нет (запись удалена)
 */
export interface UserRole {
  id: number
  user: number  // ID пользователя
  user_username?: string  // Имя пользователя (для отображения)
  role: Role  // Роль
  role_id: number  // ID роли (для записи)
  assigned_at: string  // Дата назначения
  assigned_by?: number  // ID пользователя, который назначил
  expires_at?: string  // Дата истечения (опционально)
  // ✅ is_active удалено - роль либо есть, либо нет
}

/**
 * Запрос на назначение роли пользователю
 */
export interface UserRoleRequest {
  user: number
  role_id: number
  expires_at?: string
}

/**
 * Расширенная роль с разрешениями
 */
export interface RoleWithPermissions extends Role {
  permissions?: Permission[]
  permission_ids?: number[]
  parent?: number
  is_system?: boolean
  is_active?: boolean
  created_at?: string
  updated_at?: string
}
