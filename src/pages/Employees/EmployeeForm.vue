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
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEmployeesStore } from '@/stores/employees'
import type { Employee, EmployeeRequest } from '@/api/types'
import type { GenericFormConfig } from '@/types/generic'
import GenericForm from '@/components/GenericForm.vue'
import { useErrorHandler } from '@/composables/useErrorHandler'

const props = defineProps<{
  initial?: Employee | null
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const employeesStore = useEmployeesStore
const { handleFormError } = useErrorHandler()

// Form configuration
const formConfig = computed<GenericFormConfig<EmployeeRequest>>(() => ({
  title: props.initial ? 'Редактировать сотрудника' : 'Новый сотрудник',
  subtitle: 'Заполните информацию о сотруднике',
  sections: [
    {
      title: 'Основная информация',
      description: 'Личные данные сотрудника',
      fields: ['first_name', 'last_name', 'email', 'username', 'phone'],
      order: 1
    },
    {
      title: 'Роль и доступы',
      description: 'Роль и права доступа',
      fields: ['role', 'password', 'is_active'],
      order: 2
    }
  ],
  fields: [
    {
      key: 'first_name',
      type: 'input',
      label: 'Имя',
      placeholder: 'Введите имя',
      order: 1,
      width: 'half',
      autocomplete: 'nope',
      validation: {
        maxLength: 50
      }
    },
    {
      key: 'last_name',
      type: 'input',
      label: 'Фамилия',
      placeholder: 'Введите фамилию',
      order: 2,
      width: 'half',
      autocomplete: 'nope',
      validation: {
        maxLength: 50
      }
    },
    {
      key: 'email',
      type: 'input',
      label: 'Email',
      placeholder: 'Введите email',
      order: 3,
      width: 'half',
      autocomplete: 'nope',
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        maxLength: 100
      }
    },
    {
      key: 'username',
      type: 'input',
      label: 'Имя пользователя',
      placeholder: 'Введите имя пользователя',
      required: true,
      order: 4,
      width: 'half',
      autocomplete: 'nope',
      validation: {
        minLength: 3,
        maxLength: 50,
        pattern: /^[a-zA-Z0-9_]+$/
      }
    },
    {
      key: 'phone',
      type: 'input',
      label: 'Телефон',
      placeholder: '+998 XX XXX XX XX',
      order: 5,
      width: 'half',
      autocomplete: 'nope',
      validation: {
        maxLength: 32
      },
      help: 'Обязательно для всех ролей кроме администратора и директора'
    },
    {
      key: 'role',
      type: 'select',
      label: 'Роль',
      placeholder: '— выберите роль —',
      options: roleOptions,
      required: true,
      order: 6,
      width: 'half'
    },
    {
      key: 'password',
      type: 'password',
      label: 'Пароль',
      placeholder: 'Введите пароль',
      required: !props.initial,
      order: 7,
      width: 'half',
      autocomplete: 'new-password',
      validation: props.initial ? {} : {
        minLength: 6,
        maxLength: 128
      }
    },
    {
      key: 'is_active',
      type: 'checkbox',
      label: 'Активный сотрудник',
      order: 8,
      width: 'full'
    }
  ],
  submitText: props.initial ? 'Обновить' : 'Создать',
  cancelText: 'Отмена',
  showCancel: true
}))

// Initial form data
const initialFormData = computed<EmployeeRequest>(() => {
  if (props.initial) {
    return {
      first_name: props.initial.first_name || '',
      last_name: props.initial.last_name || '',
      email: props.initial.email || '',
      username: props.initial.username,
      phone: props.initial.phone || '',
      role: props.initial.role,
      password: undefined, // Не загружаем пароль
      is_active: props.initial.is_active
    }
  }
  
  return {
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    phone: '',
    role: 'brigadier',
    password: undefined,
    is_active: true
  }
})

// Role options - только 4 роли
const roleOptions = [
  { value: 'admin', label: 'Администратор' },
  { value: 'director', label: 'Директор' },
  { value: 'coordinator', label: 'Координатор' },
  { value: 'brigadier', label: 'Бригадир' }
]

// Methods
async function handleSubmit(formData: EmployeeRequest) {
  try {
    if (props.initial) {
      await employeesStore.update(props.initial.id, formData)
    } else {
      await employeesStore.create(formData)
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