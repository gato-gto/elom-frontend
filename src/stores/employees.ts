/**
 * Store для управления сотрудниками
 *
 * FE-6/F-564: раньше ~250 строк дубля base-стора (и уже отстал — без 404-page-recovery и
 * warnIfNearPageSize). Теперь createBaseStore (CRUD + пагинация + восстановление страницы +
 * деактивация в remove — base.remove уже её обрабатывает) + labelFn для selectOptions
 * (ФИО или username). Кастомные хелперы ниже используют store и не изменились.
 */
import { endpoints } from '@/api/endpoints'
import { createBaseStore } from './base'
import api from '@/api/client'
import { parseApiError } from '@/utils/errorHandler'
import type { Employee, EmployeeRequest, PatchedEmployeeRequest, UserRole } from '@/api/types'

export const useEmployeesStore = createBaseStore<Employee, EmployeeRequest, PatchedEmployeeRequest>({
  endpoint: endpoints.employees,
  entityName: 'employees',
  entityNamePlural: 'сотрудники',
  defaultOrdering: 'username',
  labelFn: (e: Employee) => `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.username,
})

// ============================================================================
// Custom Actions (используют store внутри)
// ============================================================================

export const setPassword = async (id: number, password: string) => {
  const store = useEmployeesStore()
  store.loading = true
  store.error = null

  try {
    await api.post(endpoints.employees.setPassword(id), { password })
    return true
  } catch (err: any) {
    const parsedError = parseApiError(err)
    store.error = parsedError.detail
    throw err
  } finally {
    store.loading = false
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * @deprecated Используйте фильтрацию через RBAC роли (item.roles)
 * Оставлено для обратной совместимости
 */
export const getByRole = (role: UserRole) => {
  const store = useEmployeesStore()
  // ✅ RBAC: Проверяем только через roles (legacy поле role удалено)
  return store.items.filter((item: Employee) => {
    if (item.roles && item.roles.length > 0) {
      return item.roles.some(r => r.name === role)
    }
    return false  // ✅ Если нет RBAC ролей, возвращаем false (legacy поле role удалено)
  })
}

export const getActiveEmployees = () => {
  const store = useEmployeesStore()
  return store.items.filter((item: Employee) => item.is_active)
}

/**
 * ✅ RBAC: Получить опции для выбора бригадиров
 * Проверяет наличие роли "brigadier" через RBAC
 */
export const getBrigadierOptions = () => {
  const store = useEmployeesStore()
  return store.items
    .filter((item: Employee) => {
      if (!item.is_active) {return false}
      // ✅ RBAC: Проверяем только через roles (legacy поле role удалено)
      if (item.roles && item.roles.length > 0) {
        return item.roles.some(r => r.name === 'brigadier')
      }
      return false  // ✅ Если нет RBAC ролей, возвращаем false (legacy поле role удалено)
    })
    .map((emp: Employee) => ({
      value: emp.profile_id,
      label: `${emp.first_name} ${emp.last_name}`.trim() || emp.username
    }))
}

/**
 * ✅ RBAC: Получить сотрудников, которые могут быть ответственными.
 * brigadierOnly=true → ТОЛЬКО бригадиры (инвариант F-184: ответственный ОБЪЕКТА/закупки = бригадир;
 * BE common/serializers.py validate_responsible принимает лишь brigadier → иначе FE предлагал бы админа,
 * а BE давал бы 400). brigadierOnly=false (дефолт) → бригадиры И админы (WriteOff: BE админа допускает,
 * на проде есть такой ответственный — не ломаем).
 *
 * Используется в формах для выбора ответственного лица.
 */
export const getResponsibleEmployees = (brigadierOnly = false) => {
  const store = useEmployeesStore()
  return store.items.filter((item: Employee) => {
    if (!item.is_active) {return false}
    // ✅ RBAC: Проверяем только через roles (legacy поле role удалено)
    if (item.roles && item.roles.length > 0) {
      return item.roles.some(r => r.name === 'brigadier' || (!brigadierOnly && r.name === 'admin'))
    }
    return false  // ✅ Если нет RBAC ролей, возвращаем false (legacy поле role удалено)
  })
}

/**
 * Получить опции для выбора ответственного в формах
 */
export const getResponsibleOptions = () => {
  return getResponsibleEmployees().map((emp: Employee) => ({
    value: emp.profile_id || emp.id,
    label: `${emp.first_name} ${emp.last_name}`.trim() || emp.username
  }))
}

/**
 * ✅ RBAC: Проверить, может ли сотрудник быть ответственным
 */
export const canBeResponsible = (employee: Employee, brigadierOnly = false): boolean => {
  if (!employee.is_active) {return false}
  // ✅ RBAC: Проверяем только через roles (legacy поле role удалено)
  if (employee.roles && employee.roles.length > 0) {
    return employee.roles.some(r => r.name === 'brigadier' || (!brigadierOnly && r.name === 'admin'))
  }
  return false  // ✅ Если нет RBAC ролей, возвращаем false (legacy поле role удалено)
}

export const getByObject = (objectId: number) => {
  const store = useEmployeesStore()
  return store.items.filter((item: Employee) =>
    item.assigned_object_ids.includes(objectId)
  )
}
