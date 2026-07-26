<template>
  <div class="role-form">
    <GenericForm
      :config="formConfig"
      :initial-data="initialData"
      :on-submit="handleSubmit"
      :on-cancel="handleCancel"
    >
      <!-- Custom field for permissions -->
      <template #field-permissions="{ error, disabled }">
        <PermissionAssignment
          v-model:selectedPermissionIds="localPermissionIds"
          :disabled="disabled || !canManage"
        />
        <div v-if="error" class="text-error text-sm mt-1">{{ error }}</div>
      </template>
    </GenericForm>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRbacStore } from '@/stores/rbac'
import { usePermissions } from '@/composables/usePermissions'
import { useUiStore } from '@/stores/ui'
import { parseApiError } from '@/utils/errorHandler'
import type { Role } from '@/api/types/rbac'
import GenericForm from '@/components/GenericForm.vue'
import PermissionAssignment from '@/components/PermissionAssignment.vue'

interface Props {
  initial?: Role | null
}

interface Emits {
  (e: 'saved'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  initial: null
})

const emit = defineEmits<Emits>()

const rbacStore = useRbacStore()
const ui = useUiStore()
const { canManageRoles } = usePermissions()

const canManage = computed(() => canManageRoles.value === true)

const localPermissionIds = ref<number[]>([])

// Load role details with permissions if editing
onMounted(async () => {
  if (props.initial?.id) {
    try {
      // Загружаем детали роли с разрешениями
      const roleDetails = await rbacStore.fetchRoleWithPermissions(props.initial.id)
      if (roleDetails.permissions) {
        localPermissionIds.value = roleDetails.permissions.map(p => p.id)
      }
    } catch (error: any) {
      const parsedError = parseApiError(error)
      ui.toast({
        type: 'error',
        text: `Не удалось загрузить разрешения роли: ${parsedError.detail}`
      })
    }
  }

  // Загружаем все разрешения, если их нет
  if (rbacStore.permissions.length === 0) {
    try {
      await rbacStore.fetchPermissions()
    } catch (error) {
      // Игнорируем ошибки - разрешения могут быть уже загружены
      console.warn('Failed to fetch permissions:', error)
    }
  }
})

// Form configuration
const formConfig = computed(() => ({
  title: props.initial ? 'Редактировать роль' : 'Создать роль',
  sections: [
    {
      title: 'Основная информация',
      fields: ['name', 'display_name', 'description'],
      order: 1
    },
    {
      title: 'Разрешения',
      fields: ['permissions'],
      order: 2
    }
  ],
  fields: [
    {
      key: 'name',
      type: 'input' as const,
      label: 'Имя роли (код)',
      placeholder: 'admin, manager, warehouse',
      required: true,
      order: 1,
      width: 'half' as const,
      help: 'Уникальное имя роли на английском языке (используется в системе)',
      validation: {
        pattern: /^[a-z][a-z0-9_]*$/,
        maxLength: 50,  // F-258: зеркалим Role.name max_length=50
        message: 'Имя роли должно начинаться с буквы и содержать только строчные буквы, цифры и подчеркивания'
      }
    },
    {
      key: 'display_name',
      type: 'input' as const,
      label: 'Отображаемое название',
      placeholder: 'Администратор, Управляющий',
      required: true,
      order: 2,
      width: 'half' as const,
      help: 'Название роли, которое будет отображаться пользователям',
      validation: {
        maxLength: 100  // F-258: зеркалим Role.display_name max_length=100
      }
    },
    {
      key: 'description',
      type: 'textarea' as const,
      label: 'Описание',
      placeholder: 'Описание роли и её назначения',
      required: false,
      order: 3,
      width: 'full' as const,
      rows: 3,
      help: 'Подробное описание роли и её назначения в системе'
    },
    {
      key: 'permissions',
      type: 'custom' as const,
      label: 'Разрешения',
      required: false,
      order: 4,
      width: 'full' as const
    }
  ],
  submitText: props.initial ? 'Сохранить изменения' : 'Создать роль',
  cancelText: 'Отмена'
}))

const initialData = computed(() => {
  if (!props.initial) {
    return {
      name: '',
      display_name: '',
      description: '',
      permission_ids: []
    }
  }

  return {
    name: props.initial.name || '',
    display_name: props.initial.display_name || '',
    description: props.initial.description || '',
    permission_ids: localPermissionIds.value
  }
})

// Form submission
async function handleSubmit(formData: any) {
  try {
    // F-232 (owner D-014): иерархия ролей (parent) и is_active управляются ТОЛЬКО через admin/API,
    // а не через эту форму — RoleForm намеренно их не раскрывает (не расширяем UI). Роли создаются
    // активными (backend default is_active=True, F-251); системные роли редактируются лишь init_rbac.
    const roleData = {
      name: formData.name,
      display_name: formData.display_name,
      // F-258: очищенное описание шлём как '' (не undefined), иначе PATCH его пропускает
      // и снять описание невозможно; сериализатор допускает allow_blank.
      description: formData.description ?? '',
      permission_ids: localPermissionIds.value
    }

    if (props.initial?.id) {
      // Обновление существующей роли
      await rbacStore.updateRole(props.initial.id, roleData)
    } else {
      // Создание новой роли
      await rbacStore.createRole(roleData)
    }

    emit('saved')
  } catch (error: any) {
    const parsedError = parseApiError(error)
    ui.toast({
      type: 'error',
      text: `Не удалось сохранить роль: ${parsedError.detail}`
    })
    throw error
  }
}

function handleCancel() {
  emit('cancel')
}
</script>

<style scoped>
.role-form {
  @apply w-full;
}
</style>
