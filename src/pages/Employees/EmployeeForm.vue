<!-- src/pages/Employees/EmployeeForm.vue -->
<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl mb-6">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
        </svg>
        {{ props.initial ? 'Редактировать сотрудника' : 'Новый сотрудник' }}
      </h2>
      
      <form class="space-y-6" @submit.prevent="submit">
        <!-- Имя -->
        <FormField
          v-model="form.first_name"
          label="Имя"
          type="text"
          placeholder="Введите имя"
          :error="errors.first_name"
          required
        />

        <!-- Фамилия -->
        <FormField
          v-model="form.last_name"
          label="Фамилия"
          type="text"
          placeholder="Введите фамилию"
          :error="errors.last_name"
          required
        />

        <!-- Email -->
        <FormField
          v-model="form.email"
          label="Email"
          type="email"
          placeholder="Введите email"
          :error="errors.email"
          required
        />

        <!-- Username -->
        <FormField
          v-model="form.username"
          label="Имя пользователя"
          type="text"
          placeholder="Введите имя пользователя"
          :error="errors.username"
          required
        />

        <!-- Роль -->
        <FormField
          v-model="form.role"
          label="Роль"
          type="select"
          :error="errors.role"
          placeholder="Выберите роль"
          :options="roleOptions"
          required
        />

        <!-- Кнопки действий -->
        <div class="flex justify-end gap-2 mt-6">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useEmployeesStore } from '@/stores/employees'
import { useUiStore } from '@/stores/ui'
import type { Employee, EmployeeRequest } from '@/api/types'
import FormField from '@/components/FormField.vue'

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
  role: 'buyer'
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
  Object.keys(errors).forEach(key => delete errors[key])
}

function loadInitial() {
  if (props.initial) {
    form.first_name = props.initial.first_name
    form.last_name = props.initial.last_name
    form.email = props.initial.email
    form.username = props.initial.username
    form.role = props.initial.role
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
    if (error.response?.status === 400 && error.response?.data) {
      const data = error.response.data
      if (typeof data === 'object') {
        Object.keys(data).forEach(key => {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            errors[key] = data[key][0]
          }
        })
      }
    } else {
      ui.toast({ type: 'error', text: 'Ошибка сохранения сотрудника' })
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadInitial()
})
</script>