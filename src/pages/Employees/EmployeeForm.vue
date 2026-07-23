<template>
  <div class="employee-form">
    <!-- Generic Form -->
    <GenericForm
      :config="formConfig"
      :initial-data="initialFormData"
      :on-submit="handleSubmit"
      :on-cancel="handleCancel"
      :validate-on-change="true"
      :reset-on-submit="false"
    >
      <!-- Custom field for RBAC role assignment -->
      <template #field-roles="{ field, value, error, disabled: fieldDisabled }">
        <!-- Игнорируем fieldDisabled из формы, используем только проверку разрешений -->
        <RoleAssignment
          :user-id="props.initial?.id"
          :selected-role-ids="selectedRoleIds"
          :disabled="roleAssignmentDisabled"
          @update:selected-role-ids="handleRolesChange"
        />
        <div v-if="error" class="label">
          <span class="label-text-alt text-error">{{ error }}</span>
        </div>
      </template>

      <!-- F-237: назначенные объекты (доступ/скоуп) -->
      <template #field-assigned_objects="{ error }">
        <div class="border border-control rounded max-h-56 overflow-y-auto divide-y divide-base-200">
          <label
            v-for="o in objectOptions"
            :key="o.id"
            class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-base-200/50"
          >
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              :checked="selectedObjectIds.includes(o.id)"
              @change="toggleObject(o.id)"
            />
            <span class="text-sm">{{ o.name }}</span>
          </label>
          <div v-if="objectOptions.length === 0" class="px-3 py-4 text-center text-sm text-subtle">
            Нет объектов
          </div>
        </div>
        <p class="text-xs text-subtle mt-1">
          Объекты, к которым у сотрудника есть доступ. Пусто — доступ определяется его ролью.
        </p>
        <div v-if="error" class="label"><span class="label-text-alt text-error">{{ error }}</span></div>
      </template>
    </GenericForm>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useEmployeesStore } from '@/stores/employees'
import { useRbacStore } from '@/stores/rbac'
import { useObjectsStore } from '@/stores/objects'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import type { Employee, EmployeeRequest, SiteObject } from '@/api/types'
import type { GenericFormConfig, FieldConfig } from '@/types/generic'
import GenericForm from '@/components/GenericForm.vue'
import RoleAssignment from '@/components/RoleAssignment.vue'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { parseApiError } from '@/utils/errorHandler'

const props = defineProps<{
  initial?: Employee | null
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const employeesStore = useEmployeesStore()
const rbacStore = useRbacStore()
const objectsStore = useObjectsStore()
const ui = useUiStore()

// F-237: назначенные объекты (скоуп доступа) — управляется отдельно от formData, как roles
const selectedObjectIds = ref<number[]>([])
const objectOptions = computed(() => objectsStore.items.map((o: SiteObject) => ({ id: o.id, name: o.name })))
function toggleObject(id: number) {
  const i = selectedObjectIds.value.indexOf(id)
  if (i >= 0) {selectedObjectIds.value.splice(i, 1)}
  else {selectedObjectIds.value.push(id)}
}
const { handleFormError } = useErrorHandler()
const { canManageUserRoles } = usePermissions()
const authStore = useAuthStore()

// RBAC roles state
const selectedRoleIds = ref<number[]>([])
// Используем canManageUserRoles напрямую, без промежуточной переменной

// Computed для disabled prop
const roleAssignmentDisabled = computed(() => {
  return canManageUserRoles.value === false
})

// Form configuration
const formConfig = computed<GenericFormConfig<EmployeeRequest>>(() => ({
  title: props.initial ? 'Редактировать сотрудника' : 'Новый сотрудник',
  sections: [
    {
      title: 'Основная информация',
      fields: ['first_name', 'last_name', 'email', 'username', 'phone'],
      order: 1
    },
    {
      title: 'Доступ',
      fields: canManageUserRoles.value ? ['roles', 'password', 'is_active'] : ['password', 'is_active'],
      order: 2
    }
  ],
  fields: [
    {
      key: 'first_name',
      type: 'input' as const,
      label: 'Имя',
      placeholder: 'Введите имя',
      order: 1,
      width: 'half' as const,
      autocomplete: 'nope',
      validation: {
        maxLength: 50
      }
    },
    {
      key: 'last_name',
      type: 'input' as const,
      label: 'Фамилия',
      placeholder: 'Введите фамилию',
      order: 2,
      width: 'half' as const,
      autocomplete: 'nope',
      validation: {
        maxLength: 50
      }
    },
    {
      key: 'email',
      type: 'input' as const,
      label: 'Email',
      placeholder: 'Введите email',
      order: 3,
      width: 'half' as const,
      autocomplete: 'nope',
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        maxLength: 100
      }
    },
    {
      key: 'username',
      type: 'input' as const,
      label: 'Имя пользователя',
      placeholder: 'Введите имя пользователя',
      required: true,
      order: 4,
      width: 'half' as const,
      autocomplete: 'nope',
      validation: {
        minLength: 3,
        maxLength: 50,
        pattern: /^[a-zA-Z0-9_]+$/
      }
    },
    {
      key: 'phone',
      type: 'input' as const,
      label: 'Телефон',
      placeholder: '+998 XX XXX XX XX',
      order: 5,
      width: 'half' as const,
      autocomplete: 'nope',
      required: !props.initial,  // F-233: BE requires phone on create (new user has no roles yet)
      validation: {
        maxLength: 32
      }
    },
    ...(canManageUserRoles.value ? [{
      key: 'roles',
      type: 'custom' as const,
      label: 'Роли',
      required: false,
      order: 6,
      width: 'full' as const
    }] : []) as FieldConfig[],
    {
      key: 'password',
      type: 'password' as const,
      label: 'Пароль',
      placeholder: 'Введите пароль',
      required: !props.initial,
      order: 7,
      width: 'half' as const,
      autocomplete: 'new-password',
      validation: props.initial ? {} : {
        minLength: 6,
        maxLength: 128
      }
    },
    {
      key: 'is_active',
      type: 'checkbox' as const,
      label: 'Статус',
      checkboxLabel: 'Активен',
      order: 8,
      width: 'half' as const
    },
    {
      // F-237: назначенные объекты (доступ/скоуп) — раньше поле принималось бэком, но UI не было
      key: 'assigned_objects',
      type: 'custom' as const,
      label: 'Доступные объекты',
      required: false,
      order: 9,
      width: 'full' as const
    }
  ],
  submitText: props.initial ? 'Обновить' : 'Создать',
  cancelText: 'Отмена',
  showCancel: true
}))

// Initial form data
const initialFormData = computed<EmployeeRequest>(() => {
  // ✅ RBAC: Убираем legacy поле role, используем только RBAC роли
  if (props.initial) {
    return {
      first_name: props.initial.first_name || '',
      last_name: props.initial.last_name || '',
      email: props.initial.email || '',
      username: props.initial.username,
      phone: props.initial.phone || '',
      password: undefined,
      is_active: props.initial.is_active
    }
  }
  
  return {
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    phone: '',
    password: undefined,
    is_active: true
  }
})

// Handle roles change from RoleAssignment component
function handleRolesChange(roleIds: number[]) {
  selectedRoleIds.value = roleIds
}

// Load user roles when editing
onMounted(async () => {
  // F-237: справочник объектов + инициализация назначенных объектов при редактировании
  if (!objectsStore.items.length) {
    try { await objectsStore.fetchList({ page_size: 1000, ordering: 'name' } as any) } catch { /* ignore */ }
  }
  if (props.initial) {
    selectedObjectIds.value = [...(((props.initial as any).assigned_object_ids) || [])]
  }

  // Загружаем роли из системы, если их нет
  const currentRoles = Array.isArray(rbacStore.roles) ? rbacStore.roles : []
  if (currentRoles.length === 0 && canManageUserRoles.value) {
    try {
      await rbacStore.fetchRoles()
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    }
  }

  // Загружаем роли пользователя, если редактируем
  if (props.initial?.id && canManageUserRoles.value) {
    try {
      // ✅ Загружаем ВСЕ роли (включая неактивные) для правильного отображения
      await rbacStore.getUserRoles(props.initial.id, false, true) // forceReload=false, includeInactive=true
      
      // ✅ Упрощено: is_active больше не используется - получаем все назначенные роли
      const userRoles = rbacStore.userRoles[props.initial.id] || []
      if (Array.isArray(userRoles)) {
        // Используем role_id, если есть, иначе role.id
        selectedRoleIds.value = userRoles
          .filter(ur => ur && (ur.role_id || ur.role?.id))
          .map(ur => ur.role_id || ur.role?.id)
          .filter((id): id is number => typeof id === 'number')
      }
    } catch (error: any) {
      console.error('Failed to load user roles:', error)
      const parsedError = parseApiError(error)
      ui.toast({ 
        type: 'error', 
        text: `Не удалось загрузить роли пользователя: ${parsedError.detail}` 
      })
    }
  }
})

// Methods
async function handleSubmit(formData: EmployeeRequest) {
  try {
    let userId: number

    // ✅ RBAC: Убираем legacy поле role из запроса, если оно есть
    // Роли назначаются отдельно через RBAC API
    const cleanFormData: EmployeeRequest = { ...formData }
    delete (cleanFormData as any).role  // Убираем legacy поле role
    delete (cleanFormData as any).roles  // Не отправляем roles через API employees
    delete (cleanFormData as any).assigned_objects  // кастомное поле формы, не для API
    // F-237: сериализатор принимает assigned_object_ids (M2M объектов сотрудника)
    ;(cleanFormData as any).assigned_object_ids = [...selectedObjectIds.value]

    if (props.initial) {
      // Update existing employee
      await employeesStore.update(props.initial.id, cleanFormData)
      userId = props.initial.id
    } else {
      // Create new employee - get ID from response
      const created = await employeesStore.create(cleanFormData)
      userId = created.id
    }

    // Assign RBAC roles if can manage roles
    if (canManageUserRoles.value && userId && selectedRoleIds.value !== undefined) {
      try {
        // Get current user roles
        await rbacStore.getUserRoles(userId, true, true) // Force reload, includeInactive=true
        const currentUserRoles = rbacStore.getActiveUserRoles(userId)
        // Используем role_id, если есть, иначе role.id
        const currentRoleIds = currentUserRoles
          .map(ur => ur.role_id || ur.role?.id)
          .filter((id): id is number => typeof id === 'number')

        if (selectedRoleIds.value.length > 0) {
          // Find roles to add and remove
          // ✅ Упрощено: is_active больше не используется - роль либо есть, либо нет
          const rolesToAdd = selectedRoleIds.value.filter(id => !currentRoleIds.includes(id))
          const rolesToRemove = currentRoleIds.filter(id => !selectedRoleIds.value.includes(id))

          // Счетчики успешных операций
          let successfullyAdded = 0
          let successfullyRemoved = 0

          // Remove roles first
          for (const roleId of rolesToRemove) {
            // ✅ Упрощено: is_active больше не используется - ищем роль по role_id
            const userRole = currentUserRoles.find(ur => {
              const urRoleId = ur.role_id || ur.role?.id
              return urRoleId === roleId
            })
            if (userRole) {
              try {
                await rbacStore.revokeRole(userRole.id, userId)
                successfullyRemoved++
              } catch (revokeError: any) {
                const role = rbacStore.getRoleById(roleId)
                const roleName = role?.display_name || `Роль #${roleId}`
                const parsedError = parseApiError(revokeError)
                console.error(`[EmployeeForm] Failed to revoke role ${roleName}:`, revokeError)
                ui.toast({ 
                  type: 'error', 
                  text: `Не удалось отозвать роль "${roleName}": ${parsedError.detail}` 
                })
              }
            }
          }

          // Перезагружаем роли после удаления, чтобы получить актуальное состояние
          if (rolesToRemove.length > 0) {
            await rbacStore.getUserRoles(userId, true)
            const updatedUserRoles = rbacStore.getActiveUserRoles(userId)
            const updatedRoleIds = updatedUserRoles
              .map(ur => ur.role_id || ur.role?.id)
              .filter((id): id is number => typeof id === 'number')
            
            // Обновляем список ролей для добавления, исключая уже назначенные
            const finalRolesToAdd = rolesToAdd.filter(id => !updatedRoleIds.includes(id))
            
            // Add new roles
            for (const roleId of finalRolesToAdd) {
              try {
                // ✅ Упрощено: финальная проверка - роль либо есть, либо нет
                const finalCheck = rbacStore.getActiveUserRoles(userId)
                const alreadyAssigned = finalCheck.some(ur => {
                  const urRoleId = ur.role_id || ur.role?.id
                  return urRoleId === roleId
                })
                
                if (alreadyAssigned) {
                  console.log(`[EmployeeForm] Role ${roleId} is already assigned, skipping`)
                  continue
                }
                
                await rbacStore.assignRole(userId, roleId)
                successfullyAdded++
              } catch (assignError: any) {
                const role = rbacStore.getRoleById(roleId)
                const roleName = role?.display_name || `Роль #${roleId}`
                const parsedError = parseApiError(assignError)
                
                // Проверяем, может роль уже назначена (unique_together constraint)
                if (assignError?.response?.status === 400) {
                  const errorDetail = parsedError.detail
                  const nonFieldErrors = parsedError.fieldErrors['non_field_errors'] || []
                  
                  // Проверяем ошибки валидации unique constraint
                  const isUniqueError = errorDetail.includes('уже') || 
                                       errorDetail.includes('already') || 
                                       errorDetail.includes('unique') ||
                                       errorDetail.includes('уникальн') ||
                                       errorDetail.includes('должны производить массив') ||
                                       nonFieldErrors.some((e: string) => 
                                         e.includes('уже') || 
                                         e.includes('unique') || 
                                         e.includes('уникальн') ||
                                         e.includes('должны производить массив')
                                       )
                  
                  // Если ошибка связана с тем, что роль уже назначена - просто пропускаем
                  if (isUniqueError) {
                    console.log(`[EmployeeForm] Role ${roleName} is already assigned (unique constraint), skipping`)
                    // Синхронизируем кэш
                    try {
                      await rbacStore.getUserRoles(userId, true)
                    } catch (e) {
                      // Игнорируем ошибку синхронизации
                    }
                    continue // Пропускаем эту роль, не показываем ошибку
                  } else {
                    // Другая ошибка 400 - показываем пользователю
                    ui.toast({ 
                      type: 'error', 
                      text: `Не удалось назначить роль "${roleName}": ${errorDetail}` 
                    })
                  }
                } else {
                  // Другие ошибки (403, 404, 500 и т.д.)
                  ui.toast({ 
                    type: 'error', 
                    text: `Не удалось назначить роль "${roleName}": ${parsedError.detail}` 
                  })
                }
              }
            }
          } else {
            // Если не было удалений, просто добавляем роли
            for (const roleId of rolesToAdd) {
              try {
                // ✅ Упрощено: финальная проверка - роль либо есть, либо нет
                const finalCheck = rbacStore.getActiveUserRoles(userId)
                const alreadyAssigned = finalCheck.some(ur => {
                  const urRoleId = ur.role_id || ur.role?.id
                  return urRoleId === roleId
                })
                
                if (alreadyAssigned) {
                  console.log(`[EmployeeForm] Role ${roleId} is already assigned, skipping`)
                  continue
                }
                
                await rbacStore.assignRole(userId, roleId)
                successfullyAdded++
              } catch (assignError: any) {
                const role = rbacStore.getRoleById(roleId)
                const roleName = role?.display_name || `Роль #${roleId}`
                const parsedError = parseApiError(assignError)
                
                // Проверяем, может роль уже назначена (unique_together constraint)
                if (assignError?.response?.status === 400) {
                  const errorDetail = parsedError.detail
                  const nonFieldErrors = parsedError.fieldErrors['non_field_errors'] || []
                  
                  // Проверяем ошибки валидации unique constraint
                  const isUniqueError = errorDetail.includes('уже') || 
                                       errorDetail.includes('already') || 
                                       errorDetail.includes('unique') ||
                                       errorDetail.includes('уникальн') ||
                                       errorDetail.includes('должны производить массив') ||
                                       nonFieldErrors.some((e: string) => 
                                         e.includes('уже') || 
                                         e.includes('unique') || 
                                         e.includes('уникальн') ||
                                         e.includes('должны производить массив')
                                       )
                  
                  // Если ошибка связана с тем, что роль уже назначена - просто пропускаем
                  if (isUniqueError) {
                    console.log(`[EmployeeForm] Role ${roleName} is already assigned (unique constraint), skipping`)
                    // Синхронизируем кэш
                    try {
                      await rbacStore.getUserRoles(userId, true)
                    } catch (e) {
                      // Игнорируем ошибку синхронизации
                    }
                    continue // Пропускаем эту роль, не показываем ошибку
                  } else {
                    // Другая ошибка 400 - показываем пользователю
                    ui.toast({ 
                      type: 'error', 
                      text: `Не удалось назначить роль "${roleName}": ${errorDetail}` 
                    })
                  }
                } else {
                  // Другие ошибки (403, 404, 500 и т.д.)
                  ui.toast({ 
                    type: 'error', 
                    text: `Не удалось назначить роль "${roleName}": ${parsedError.detail}` 
                  })
                }
              }
            }
          }

          // Успешное сообщение, если были реальные изменения
          if (successfullyAdded > 0 || successfullyRemoved > 0) {
            ui.toast({ 
              type: 'success', 
              text: `Роли обновлены: ${successfullyAdded} добавлено, ${successfullyRemoved} отозвано` 
            })
            
            // Перезагружаем роли пользователя для синхронизации
            await rbacStore.getUserRoles(userId, true)
          }
        } else {
          // Remove all roles if none selected
          if (currentUserRoles.length > 0) {
            for (const userRole of currentUserRoles) {
              try {
                await rbacStore.revokeRole(userRole.id, userId)
              } catch (revokeError: any) {
                const role = rbacStore.getRoleById(userRole.role_id)
                const roleName = role?.display_name || `Роль #${userRole.role_id}`
                const parsedError = parseApiError(revokeError)
                console.error(`[EmployeeForm] Failed to revoke role ${roleName}:`, revokeError)
                ui.toast({ 
                  type: 'error', 
                  text: `Не удалось отозвать роль "${roleName}": ${parsedError.detail}` 
                })
              }
            }
            ui.toast({ 
              type: 'info', 
              text: 'Все роли отозваны у пользователя' 
            })
            
            // Перезагружаем роли пользователя
            await rbacStore.getUserRoles(userId, true)
          }
        }

        // Clear cache to force reload on next access
        rbacStore.clearUserRoles(userId)
      } catch (rbacError: any) {
        const parsedError = parseApiError(rbacError)
        ui.toast({ 
          type: 'error', 
          text: `Ошибка управления ролями: ${parsedError.detail}` 
        })
        // Не блокируем сохранение пользователя, если роли не удалось назначить
      }
    }
    
    emit('saved')
  } catch (error) {
    await handleFormError(error, 'employee')
    throw error
  }
}

function handleCancel() {
  emit('cancel')
}
</script>