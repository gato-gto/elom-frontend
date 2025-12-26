/**
 * Store для управления сотрудниками
 */
import { computed } from 'vue'
import { createBaseStore } from './base'
import { endpoints } from '@/api/endpoints'
import api from '@/api/client'
import type { 
  Employee, 
  EmployeeRequest, 
  PatchedEmployeeRequest,
  UserRole 
} from '@/api/types'

// Создаём store
export const useEmployeesStore = createBaseStore<Employee, EmployeeRequest, PatchedEmployeeRequest>({
  endpoint: endpoints.employees,
  entityName: 'employees',
  entityNamePlural: 'сотрудники',
  defaultOrdering: 'username'
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
    store.error = err?.response?.data?.detail || 'Ошибка установки пароля'
    throw err
  } finally {
    store.loading = false
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

export const getByRole = (role: UserRole) => {
  const store = useEmployeesStore()
  return store.items.filter((item: Employee) => item.role === role)
}

export const getActiveEmployees = () => {
  const store = useEmployeesStore()
  return store.items.filter((item: Employee) => item.is_active)
}

export const getBrigadierOptions = () => {
  const store = useEmployeesStore()
  return store.items
    .filter((item: Employee) => item.is_active && item.role === 'brigadier')
    .map((emp: Employee) => ({
      value: emp.profile_id, // ✅ ВАЖНО: теперь profile_id, не emp.id
      label: `${emp.first_name} ${emp.last_name}`.trim() || emp.username
    }))
}

export const getByObject = (objectId: number) => {
  const store = useEmployeesStore()
  return store.items.filter((item: Employee) => 
    item.assigned_object_ids.includes(objectId)
  )
}
