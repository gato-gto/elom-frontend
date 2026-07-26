/**
 * Store для управления RBAC ролями и разрешениями
 * Используется для назначения ролей пользователям
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { parseApiError } from '@/utils/errorHandler'
import type { Role, UserRoleAssignment, UserRoleRequest, RoleWithPermissions, Permission } from '@/api/types/rbac'

export const useRbacStore = defineStore('rbac', () => {
  // ========================================================================
  // State
  // ========================================================================
  const roles = ref<Role[]>([])
  const userRoles = ref<Record<number, UserRoleAssignment[]>>({}) // user_id -> UserRoleAssignment[]
  const permissions = ref<Permission[]>([]) // Все разрешения системы
  const roleDetails = ref<Record<number, RoleWithPermissions>>({}) // Кэш деталей ролей с разрешениями
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ========================================================================
  // Actions
  // ========================================================================
  
  /**
   * Загрузить все роли из системы
   */
  const fetchRoles = async (): Promise<void> => {
    loading.value = true
    error.value = null
    
    try {
      console.log('[RBAC Store] Fetching roles from:', endpoints.rbac.roles.list)
      const { data } = await api.get<Role[] | { count: number; results: Role[]; next: string | null; previous: string | null }>(
        endpoints.rbac.roles.list
      )
      console.log('[RBAC Store] Roles received:', data)
      
      // ✅ API может возвращать как массив, так и пагинированный объект
      let rolesArray: Role[] = []
      if (Array.isArray(data)) {
        rolesArray = data
      } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        rolesArray = data.results
      }
      
      roles.value = rolesArray
      console.log('[RBAC Store] Roles stored:', roles.value.length, roles.value)
    } catch (err: any) {
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
      console.error('[RBAC Store] Failed to fetch roles:', err)
      console.error('[RBAC Store] Error details:', parsedError)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Загрузить роли пользователя
   * @param userId - ID пользователя
   * @param includeInactive - Не используется (оставлено для обратной совместимости)
   */
  const fetchUserRoles = async (userId: number, includeInactive: boolean = false): Promise<UserRoleAssignment[]> => {
    loading.value = true
    error.value = null
    
    try {
      // ✅ Упрощено: is_active больше не используется - роль либо есть, либо нет
      // Загружаем все роли пользователя
      const url = `${endpoints.rbac.userRoles.list}?user=${userId}`
      
      const { data } = await api.get<{ results?: UserRoleAssignment[], count?: number } | UserRoleAssignment[]>(url)
      
      // Обрабатываем пагинированный ответ или обычный массив
      const roles = Array.isArray(data) ? data : (data?.results || [])
      userRoles.value[userId] = roles
      console.log(`[RBAC Store] Fetched ${roles.length} user roles for user ${userId} (includeInactive: ${includeInactive})`)
      return roles
    } catch (err: any) {
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
      console.error('Failed to fetch user roles:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Назначить роль пользователю
   */
  const assignRole = async (userId: number, roleId: number, expiresAt?: string): Promise<UserRoleAssignment> => {
    loading.value = true
    error.value = null
    
    try {
      const payload: UserRoleRequest = {
        user: userId,
        role_id: roleId,
        ...(expiresAt && { expires_at: expiresAt })
      }
      
      console.log('[RBAC Store] Assigning role:', { userId, roleId, payload })
      
      const { data } = await api.post<UserRoleAssignment>(
        endpoints.rbac.userRoles.create,
        payload
      )
      
      console.log('[RBAC Store] Role assigned successfully:', data)
      
      // Обновляем локальный кэш
      if (!userRoles.value[userId]) {
        userRoles.value[userId] = []
      }
      
      // ✅ Упрощено: проверяем, нет ли уже такой роли (is_active больше не используется)
      const existingIndex = userRoles.value[userId].findIndex(ur => ur.role_id === roleId)
      if (existingIndex !== -1) {
        // Обновляем существующую запись
        userRoles.value[userId][existingIndex] = data
        console.log('[RBAC Store] Updated existing role in cache')
      } else {
        // Добавляем новую запись
        userRoles.value[userId].push(data)
        console.log('[RBAC Store] Added new role to cache, total:', userRoles.value[userId].length)
      }
      
      return data
    } catch (err: any) {
      // EH-FE-3 (F-546): назначение роли идемпотентно на бэке — повтор возвращает 200 с
      // существующей записью (успешный путь выше). Прежняя детекция «роль уже назначена»
      // по ПОДСТРОКЕ текста ошибки (уже/unique/«должны производить массив») удалена как
      // хрупкая к локали/формулировке. Любая ошибка здесь — настоящая, пробрасываем.
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
      console.error('[RBAC Store] Failed to assign role:', parsedError)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Отозвать роль у пользователя
   */
  const revokeRole = async (userRoleId: number, userId: number): Promise<void> => {
    loading.value = true
    error.value = null
    
    try {
      console.log('[RBAC Store] Revoking role:', { userRoleId, userId })
      
      await api.delete(endpoints.rbac.userRoles.delete(userRoleId))
      
      console.log('[RBAC Store] Role revoked successfully')
      
      // ✅ Упрощено: обновляем локальный кэш - удаляем запись (is_active больше не используется)
      if (userRoles.value[userId]) {
        userRoles.value[userId] = userRoles.value[userId].filter(ur => ur.id !== userRoleId)
        console.log('[RBAC Store] Removed role from cache, remaining:', userRoles.value[userId].length)
      }
      
      // Очищаем кэш для этого пользователя, чтобы при следующем запросе данные обновились
      clearUserRoles(userId)
    } catch (err: any) {
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
      console.error('[RBAC Store] Failed to revoke role:', err)
      console.error('[RBAC Store] Error response:', err?.response?.data)
      console.error('[RBAC Store] Parsed error:', parsedError)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Получить роли пользователя (из кэша или загрузить)
   */
  const getUserRoles = async (userId: number, forceReload: boolean = false, includeInactive: boolean = true): Promise<UserRoleAssignment[]> => {
    if (!forceReload && userRoles.value[userId]) {
      return userRoles.value[userId]
    }
    return await fetchUserRoles(userId, includeInactive)
  }

  /**
   * Проверить, назначена ли роль пользователю
   */
  const hasRole = (userId: number, roleId: number): boolean => {
    const userRolesList = userRoles.value[userId]
    if (!Array.isArray(userRolesList)) {
      return false
    }
    // ✅ Упрощено: is_active больше не используется - роль либо есть, либо нет
    return userRolesList.some(ur => ur && ur.role_id === roleId)
  }

  /**
   * Очистить кэш ролей пользователя
   */
  const clearUserRoles = (userId?: number): void => {
    if (userId) {
      delete userRoles.value[userId]
    } else {
      userRoles.value = {}
    }
  }

  // ========================================================================
  // Getters
  // ========================================================================
  
  /**
   * Получить роль по ID
   */
  const getRoleById = computed(() => (roleId: number): Role | undefined => {
    // ✅ Проверяем, что roles.value - это массив
    const rolesArray = Array.isArray(roles.value) ? roles.value : []
    return rolesArray.find(r => r && r.id === roleId)
  })

  /**
   * Получить роль по имени
   */
  const getRoleByName = computed(() => (roleName: string): Role | undefined => {
    // ✅ Проверяем, что roles.value - это массив
    const rolesArray = Array.isArray(roles.value) ? roles.value : []
    return rolesArray.find(r => r && r.name === roleName)
  })

  /**
   * Получить активные роли пользователя
   */
  const getActiveUserRoles = computed(() => (userId: number): UserRoleAssignment[] => {
    const userRolesList = userRoles.value[userId]
    if (!Array.isArray(userRolesList)) {
      return []
    }
    // ✅ Упрощено: is_active больше не используется - возвращаем все роли (они все активны)
    return userRolesList.filter(ur => ur != null)
  })

  // ========================================================================
  // Permission Management Actions
  // ========================================================================

  /**
   * Загрузить все разрешения из системы
   */
  const fetchPermissions = async (): Promise<void> => {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await api.get<Permission[] | { count: number; results: Permission[]; next: string | null; previous: string | null }>(
        endpoints.rbac.permissions.list
      )
      
      // Обрабатываем пагинированный ответ или обычный массив
      const permissionsArray = Array.isArray(data) ? data : (data?.results || [])
      permissions.value = permissionsArray.filter(p => p.is_active)
    } catch (err: any) {
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
      console.error('[RBAC Store] Failed to fetch permissions:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Загрузить роль с разрешениями
   */
  const fetchRoleWithPermissions = async (roleId: number): Promise<RoleWithPermissions> => {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await api.get<RoleWithPermissions>(
        endpoints.rbac.roles.one(roleId)
      )
      
      // Сохраняем в кэш
      roleDetails.value[roleId] = data
      
      return data
    } catch (err: any) {
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
      console.error('[RBAC Store] Failed to fetch role with permissions:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Создать роль
   */
  const createRole = async (roleData: {
    name: string
    display_name: string
    description?: string
    permission_ids?: number[]
  }): Promise<RoleWithPermissions> => {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await api.post<RoleWithPermissions>(
        endpoints.rbac.roles.create,
        roleData
      )
      
      // Обновляем список ролей
      await fetchRoles()
      
      // Сохраняем детали в кэш
      roleDetails.value[data.id] = data
      
      return data
    } catch (err: any) {
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
      console.error('[RBAC Store] Failed to create role:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Обновить роль (включая разрешения)
   */
  const updateRole = async (roleId: number, roleData: {
    name?: string
    display_name?: string
    description?: string
    permission_ids?: number[]
  }): Promise<RoleWithPermissions> => {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await api.patch<RoleWithPermissions>(
        endpoints.rbac.roles.update(roleId),
        roleData
      )
      
      // Обновляем список ролей
      await fetchRoles()
      
      // Обновляем детали в кэше
      roleDetails.value[roleId] = data
      
      return data
    } catch (err: any) {
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
      console.error('[RBAC Store] Failed to update role:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Удалить роль
   */
  const deleteRole = async (roleId: number): Promise<void> => {
    loading.value = true
    error.value = null
    
    try {
      await api.delete(endpoints.rbac.roles.delete(roleId))
      
      // Обновляем список ролей
      await fetchRoles()
      
      // Удаляем из кэша
      delete roleDetails.value[roleId]
    } catch (err: any) {
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
      console.error('[RBAC Store] Failed to delete role:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ========================================================================
  // Permission Getters
  // ========================================================================

  /**
   * Получить разрешение по ID
   */
  const getPermissionById = computed(() => (permissionId: number): Permission | undefined => {
    return permissions.value.find(p => p.id === permissionId)
  })

  /**
   * Получить разрешения по ресурсу
   */
  const getPermissionsByResource = computed(() => (resource: string): Permission[] => {
    return permissions.value.filter(p => p.resource === resource)
  })

  /**
   * Получить все ресурсы (уникальные)
   */
  const getResources = computed(() => (): string[] => {
    const resources = new Set(permissions.value.map(p => p.resource))
    return Array.from(resources).sort()
  })

  return {
    // State
    roles,
    userRoles,
    permissions,
    roleDetails,
    loading,
    error,
    
    // Actions
    fetchRoles,
    fetchUserRoles,
    assignRole,
    revokeRole,
    getUserRoles,
    hasRole,
    clearUserRoles,
    
    // Permission Management Actions
    fetchPermissions,
    fetchRoleWithPermissions,
    createRole,
    updateRole,
    deleteRole,
    
    // Getters
    getRoleById,
    getRoleByName,
    getActiveUserRoles,
    getPermissionById,
    getPermissionsByResource,
    getResources,
  }
})
