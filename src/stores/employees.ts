import { defineStore } from 'pinia'
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

export const useEmployeesStore = createBaseStore<Employee, EmployeeRequest, PatchedEmployeeRequest>({
  endpoint: endpoints.employees,
  entityName: 'employees',
  entityNamePlural: 'сотрудники'
})

// Custom getters for employees
export const getByRole = (role: UserRole) => {
  return useEmployeesStore.items.filter((item: Employee) => item.role === role)
}

export const activeEmployees = computed(() => {
  return useEmployeesStore.items.filter((item: Employee) => item.is_active)
})

export const brigadierOptions = computed(() => {
  return useEmployeesStore.items
    .filter((item: Employee) => item.is_active && item.role === 'brigadier')
    .map((emp: Employee) => ({
      value: emp.id,
      label: `${emp.first_name} ${emp.last_name}`.trim() || emp.username
    }))
})

export const getByObject = (objectId: number) => {
  return useEmployeesStore.items.filter((item: Employee) => 
    item.assigned_object_ids.includes(objectId)
  )
}

// Custom actions for employees
export const setPassword = async (id: number, password: string) => {
  useEmployeesStore.loading = true
  useEmployeesStore.error = null

  try {
    await api.post(endpoints.employees.setPassword(id), { password })
    return true
  } catch (err: any) {
    useEmployeesStore.error = err?.response?.data?.detail || 'Ошибка установки пароля'
    throw err
  } finally {
    useEmployeesStore.loading = false
  }
}


