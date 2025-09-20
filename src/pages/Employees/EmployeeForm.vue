<template>
  <form class="grid gap-4" @submit.prevent="submit">

    <!-- Основная информация -->
    <div class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Основная информация</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <!-- Имя -->
          <FormField
            v-model="form.first_name"
            label="Имя"
            type="input"
            placeholder="Введите имя"
            :error="errors.first_name"
          />

          <!-- Фамилия -->
          <FormField
            v-model="form.last_name"
            label="Фамилия"
            type="input"
            placeholder="Введите фамилию"
            :error="errors.last_name"
          />

          <!-- Email -->
          <FormField
            v-model="form.email"
            label="Email"
            type="email"
            placeholder="Введите email"
            :error="errors.email"
          />

          <!-- Username -->
          <FormField
            v-model="form.username"
            label="Имя пользователя"
            type="input"
            placeholder="Введите имя пользователя"
            :error="errors.username"
            required
          />
        </div>
      </div>
    </div>

    <!-- Роль и доступы -->
    <div class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Роль и доступы</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <!-- Роль -->
          <FormField
            v-model="form.role"
            label="Роль"
            type="select"
            :error="errors.role"
            placeholder="— выберите роль —"
            :options="roleOptions"
            required
          />

          <!-- Пароль (только для новых сотрудников) -->
          <FormField
            v-if="!props.initial"
            v-model="form.password"
            label="Пароль"
            type="password"
            placeholder="Введите пароль"
            :error="errors.password"
            required
          />
        </div>
      </div>
    </div>

    <!-- Кнопки действий -->
    <div class="flex justify-end gap-2">
      <button 
        type="button" 
        class="btn btn-outline" 
        @click="$emit('cancel')"
        :disabled="loading"
      >
        Отмена
      </button>
      <button 
        type="submit" 
        class="btn btn-primary" 
        :disabled="loading"
      >
        <svg v-if="loading" class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        {{ loading ? 'Сохранение...' : (props.initial ? 'Обновить' : 'Создать') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useEmployeesStore } from '@/stores/employees'
import { useUiStore } from '@/stores/ui'
import type { Employee, EmployeeRequest } from '@/api/types'
import FormField from '@/components/FormField.vue'
import { ErrorHandlers } from '@/utils/errorHandler'

const props = defineProps<{
  initial?: Employee | null
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const employeesStore = useEmployeesStore()
const ui = useUiStore()

const loading = ref(false)
const errors = reactive<Record<string, string>>({})

const form = reactive<EmployeeRequest>({
  first_name: '',
  last_name: '',
  email: '',
  username: '',
  role: 'buyer',
  password: undefined
})

const roleOptions = [
  { value: 'admin', label: 'Администратор' },
  { value: 'director', label: 'Директор' },
  { value: 'coordinator', label: 'Координатор' },
  { value: 'site_manager', label: 'Бригадир' },
  { value: 'buyer', label: 'Закупщик' }
]

function resetForm() {
    form.first_name = ''
    form.last_name = ''
    form.email = ''
  form.username = ''
  form.role = 'buyer'
  form.password = undefined
  Object.keys(errors).forEach(key => delete errors[key])
}

function loadInitial() {
  if (props.initial) {
    form.first_name = props.initial.first_name
    form.last_name = props.initial.last_name
    form.email = props.initial.email
    form.username = props.initial.username
    form.role = props.initial.role
    form.password = undefined // Не загружаем пароль
  } else {
    resetForm()
  }
}

async function submit() {
  loading.value = true
  Object.keys(errors).forEach(key => delete errors[key])
  
  try {
    if (props.initial) {
      await employeesStore.update(props.initial.id, form)
    } else {
      await employeesStore.create(form)
    }
    emit('saved')
  } catch (error: any) {
    const errorResult = ErrorHandlers.formValidation(error)
    
    // Устанавливаем ошибки полей
    Object.keys(errorResult.fieldErrors).forEach(field => {
      errors[field] = errorResult.fieldErrors[field]
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadInitial()
})
</script>