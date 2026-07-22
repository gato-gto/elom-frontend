/**
 * Store для управления сотрудниками
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { endpoints } from '@/api/endpoints'
import api from '@/api/client'
import { buildQuery } from '@/api/endpoints'
import { handleApiErrorAsync, parseApiError } from '@/utils/errorHandler'
import { findById } from '@/utils/arrayHelpers'
import { getOptimalPageSize } from '@/utils/device'
import type { 
  Employee, 
  EmployeeRequest, 
  PatchedEmployeeRequest,
  UserRole 
} from '@/api/types'
import type { PaginationState, BaseFilters } from './base'

// Создаём кастомный store с переопределённым selectOptions
export const useEmployeesStore = defineStore('employees', () => {
  // ========================================================================
  // State
  // ========================================================================
  const items = ref<Employee[]>([])
  const current = ref<Employee | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialPageSize = 20
  const pagination = ref<PaginationState>({
    count: 0,
    page: 1,
    pageSize: getOptimalPageSize(initialPageSize),
    next: null,
    previous: null
  })
  const filters = ref<BaseFilters>({
    search: '',
    ordering: 'username'
  })

  // ========================================================================
  // Getters
  // ========================================================================
  const getById = computed(() => (id: number) => {
    return findById(items.value, id)
  })

  const exists = computed(() => (id: number) => {
    return items.value.some(item => item.id === id)
  })

  // Переопределяем selectOptions для отображения полных имён или username
  const selectOptions = computed(() => {
    return items.value.map((item: Employee) => {
      const fullName = `${item.first_name} ${item.last_name}`.trim()
      return {
        value: item.id,
        label: fullName || item.username
      }
    })
  })

  // ========================================================================
  // Actions
  // ========================================================================
  
  const fetchList = async (params?: Record<string, any>): Promise<Employee[]> => {
    loading.value = true
    error.value = null

    try {
      const queryParams: Record<string, any> = {
        page: params?.page || pagination.value.page,
        page_size: params?.page_size || pagination.value.pageSize,
        ...filters.value,
        ...(params?.search !== undefined && { search: params.search }),
        ...(params?.ordering !== undefined && { ordering: params.ordering }),
        ...params
      }

      // Remove empty values
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined || queryParams[key] === '') {
          delete queryParams[key]
        }
      })

      const query = buildQuery(queryParams)
      const { data } = await api.get(endpoints.employees.list + query)

      items.value = data.results || data
      pagination.value = {
        count: data.count || (Array.isArray(data) ? data.length : 0),
        page: queryParams.page,
        pageSize: queryParams.page_size,
        next: data.next || null,
        previous: data.previous || null
      }

      if (params) {
        Object.assign(filters.value, params)
      }

      return items.value
    } catch (err: any) {
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
      await handleApiErrorAsync(err, { operation: 'dataLoading', entity: 'employees' })
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchOne = async (id: number): Promise<Employee> => {
    loading.value = true
    error.value = null

    try {
      const { data } = await api.get<Employee>(endpoints.employees.one(id))
      current.value = data

      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = data
      }

      return data
    } catch (err: any) {
      current.value = null
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
      await handleApiErrorAsync(err, { operation: 'dataLoading', entity: 'employees' })
      throw err
    } finally {
      loading.value = false
    }
  }

  const create = async (data: EmployeeRequest): Promise<Employee> => {
    loading.value = true
    error.value = null

    try {
      const { data: newItem } = await api.post<Employee>(endpoints.employees.list, data)
      items.value.unshift(newItem)
      pagination.value.count++
      return newItem
    } catch (err: any) {
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
      await handleApiErrorAsync(err, { operation: 'formValidation', entity: 'employees' })
      throw err
    } finally {
      loading.value = false
    }
  }

  const update = async (id: number, data: PatchedEmployeeRequest): Promise<Employee> => {
    loading.value = true
    error.value = null

    try {
      const { data: updatedItem } = await api.patch<Employee>(endpoints.employees.one(id), data)
      
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = updatedItem
      }

      if (current.value?.id === id) {
        current.value = updatedItem
      }

      return updatedItem
    } catch (err: any) {
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
      await handleApiErrorAsync(err, { operation: 'formValidation', entity: 'employees' })
      throw err
    } finally {
      loading.value = false
    }
  }

  const remove = async (id: number): Promise<any> => {
    loading.value = true
    error.value = null

    try {
      const response = await api.delete(endpoints.employees.one(id))
      
      const wasDeactivated = response.status === 200 && response.data?.action === 'deactivated'
      
      if (wasDeactivated) {
        const index = items.value.findIndex(item => item.id === id)
        if (index !== -1) {
          (items.value[index] as any).is_active = false
        }
      } else {
        items.value = items.value.filter(item => item.id !== id)
        pagination.value.count--
      }

      if (current.value?.id === id) {
        current.value = null
      }

      return response.data || { action: 'deleted' }
    } catch (err: any) {
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
      await handleApiErrorAsync(err, { operation: 'delete', entity: 'employees' })
      throw err
    } finally {
      loading.value = false
    }
  }

  const setCurrent = (item: Employee | null) => {
    current.value = item
  }

  const setFilters = async (newFilters: Partial<BaseFilters>) => {
    Object.assign(filters.value, newFilters)
    pagination.value.page = 1
    await fetchList()
  }

  const resetFilters = async () => {
    const resetObj: BaseFilters = {
      search: '',
      ordering: 'username'
    }
    
    Object.keys(filters.value).forEach(key => {
      if (key !== 'search' && key !== 'ordering') {
        resetObj[key] = ''
      }
    })
    
    filters.value = resetObj
    pagination.value.page = 1
    await fetchList()
  }

  const clearError = () => {
    error.value = null
  }

  const setPageSize = async (size: number) => {
    pagination.value.pageSize = size
    pagination.value.page = 1
    await fetchList()
  }

  const setPage = async (page: number) => {
    pagination.value.page = page
    await fetchList()
  }

  const search = async (query: string): Promise<Employee[]> => {
    if (query.length < 2) {return []}
    
    try {
      const searchPageSize = getOptimalPageSize(15)
      const { data } = await api.get(endpoints.employees.list + `?search=${encodeURIComponent(query)}&page_size=${searchPageSize}`)
      return data.results || data
    } catch (err: any) {
      await handleApiErrorAsync(err, { operation: 'search', entity: 'employees' })
      return []
    }
  }

  return {
    // State
    items,
    current,
    loading,
    error,
    pagination,
    filters,

    // Getters
    getById,
    exists,
    selectOptions,

    // Actions
    fetchList,
    fetchOne,
    create,
    update,
    remove,
    setCurrent,
    setFilters,
    resetFilters,
    clearError,
    setPageSize,
    setPage,
    search
  }
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
 * ✅ RBAC: Получить сотрудников, которые могут быть ответственными
 * (бригадиры и администраторы)
 * 
 * Используется в формах для выбора ответственного лица
 */
export const getResponsibleEmployees = () => {
  const store = useEmployeesStore()
  return store.items.filter((item: Employee) => {
    if (!item.is_active) {return false}
    // ✅ RBAC: Проверяем только через roles (legacy поле role удалено)
    if (item.roles && item.roles.length > 0) {
      return item.roles.some(r => r.name === 'brigadier' || r.name === 'admin')
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
export const canBeResponsible = (employee: Employee): boolean => {
  if (!employee.is_active) {return false}
  // ✅ RBAC: Проверяем только через roles (legacy поле role удалено)
  if (employee.roles && employee.roles.length > 0) {
    return employee.roles.some(r => r.name === 'brigadier' || r.name === 'admin')
  }
  return false  // ✅ Если нет RBAC ролей, возвращаем false (legacy поле role удалено)
}

export const getByObject = (objectId: number) => {
  const store = useEmployeesStore()
  return store.items.filter((item: Employee) => 
    item.assigned_object_ids.includes(objectId)
  )
}
