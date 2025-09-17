<!-- src/pages/Employees/EmployeeForm.vue -->
<template>
  <div class="card bg-white shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl mb-6">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
        </svg>
        {{ props.initial ? 'Редактировать сотрудника' : 'Новый сотрудник' }}
      </h2>
      
      <form class="space-y-6" @submit.prevent="submit">
        <!-- Имя -->
        <label class="grid gap-1">
          <span class="text-sm font-semibold">
            Имя
            <span class="text-error">*</span>
          </span>
          <input 
            v-model.trim="form.first_name" 
            type="text" 
            class="input input-bordered" 
            :class="{ 'input-error': errors.first_name }"
            placeholder="Введите имя"
            required
          />
          <span v-if="errors.first_name" class="text-xs text-error">{{ errors.first_name }}</span>
        </label>

        <!-- Фамилия -->
        <label class="grid gap-1">
          <span class="text-sm font-semibold">
            Фамилия
            <span class="text-error">*</span>
          </span>
          <input 
            v-model.trim="form.last_name" 
            type="text" 
            class="input input-bordered" 
            :class="{ 'input-error': errors.last_name }"
            placeholder="Введите фамилию"
            required
          />
          <span v-if="errors.last_name" class="text-xs text-error">{{ errors.last_name }}</span>
        </label>

        <!-- Email -->
        <label class="grid gap-1">
          <span class="text-sm font-semibold">
            Email
            <span class="text-error">*</span>
          </span>
          <input 
            v-model.trim="form.email" 
            type="email" 
            class="input input-bordered" 
            :class="{ 'input-error': errors.email }"
            placeholder="Введите email"
            required
          />
          <span v-if="errors.email" class="text-xs text-error">{{ errors.email }}</span>
        </label>

        <!-- Роль -->
        <label class="grid gap-1">
          <span class="text-sm font-semibold">
            Роль
            <span class="text-error">*</span>
          </span>
          <select 
            v-model="form.role" 
            class="select select-bordered" 
            :class="{ 'select-error': errors.role }"
            required
          >
            <option value="" disabled>— выберите роль —</option>
            <option value="admin">Администратор</option>
            <option value="director">Директор</option>
            <option value="manager">Менеджер</option>
            <option value="employee">Сотрудник</option>
          </select>
          <span v-if="errors.role" class="text-xs text-error">{{ errors.role }}</span>
        </label>

        <!-- Пароль (только для новых сотрудников) -->
        <label v-if="!props.initial" class="grid gap-1">
          <span class="text-sm font-semibold">
            Пароль
            <span class="text-error">*</span>
          </span>
          <input 
            v-model.trim="form.password" 
            type="password" 
            class="input input-bordered" 
            :class="{ 'input-error': errors.password }"
            placeholder="Введите пароль"
            :required="!props.initial"
          />
          <span v-if="errors.password" class="text-xs text-error">{{ errors.password }}</span>
          <span class="text-xs text-gray-700-60">Минимум 8 символов</span>
        </label>

        <!-- Кнопки действий -->
        <div class="flex justify-end gap-2 mt-6">
          <button 
            type="button" 
            class="btn btn-ghost" 
            @click="$emit('cancel')"
            :disabled="submitting"
          >
            Отмена
          </button>
          <button 
            type="submit" 
            class="btn btn-primary" 
            :disabled="submitting || !isFormValid"
          >
            {{ submitting ? 'Сохранение...' : (props.initial ? 'Обновить' : 'Создать') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive, ref, watchEffect, computed} from 'vue'
import api from '@/api/client'
import {endpoints} from '@/api/endpoints'
import type {Employee, EmployeeRequest, PatchedEmployeeRequest} from '@/api/types'
import {useUiStore} from '@/stores/ui'

const props = defineProps<{ initial: Employee | null }>()
const emit = defineEmits<{ (e: 'saved'): void; (e: 'cancel'): void }>()

const ui = useUiStore()

const form = reactive<{ 
  first_name: string; 
  last_name: string; 
  email: string; 
  role: string;
  password: string;
}>({
  first_name: '', 
  last_name: '', 
  email: '', 
  role: '',
  password: ''
})

const errors = reactive<{ 
  first_name: string | null; 
  last_name: string | null; 
  email: string | null; 
  role: string | null;
  password: string | null;
}>({
  first_name: null, 
  last_name: null, 
  email: null, 
  role: null,
  password: null
})

const submitting = ref(false)

const isFormValid = computed(() => {
  const baseValid = form.first_name.trim() && form.last_name.trim() && form.email.trim() && form.role
  if (props.initial) {
    return baseValid
  } else {
    return baseValid && form.password.trim()
  }
})

watchEffect(() => {
  if (props.initial) {
    form.first_name = props.initial.first_name
    form.last_name = props.initial.last_name
    form.email = props.initial.email
    form.role = props.initial.role
    form.password = ''
  } else {
    form.first_name = ''
    form.last_name = ''
    form.email = ''
    form.role = ''
    form.password = ''
  }
  // Очищаем ошибки
  Object.keys(errors).forEach(key => (errors as any)[key] = null)
})

function pickError(payload: any, key: string): string | null {
  const v = payload?.[key]
  if (Array.isArray(v) && v.length) return String(v[0])
  if (typeof v === 'string') return v

  const nested = payload?.errors?.[key]
  if (Array.isArray(nested) && nested.length) return String(nested[0])
  if (typeof nested === 'string') return nested

  return null
}

async function submit() {
  submitting.value = true
  
  // Очищаем ошибки
  Object.keys(errors).forEach(key => (errors as any)[key] = null)
  
  try {
    if (props.initial) {
      const payload: PatchedEmployeeRequest = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        role: form.role as any
      }
      await api.patch(endpoints.employees.one(props.initial.id), payload)
      ui.toast({type: 'success', text: 'Сотрудник обновлен'})
    } else {
      const payload: EmployeeRequest = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        role: form.role as any,
        password: form.password
      }
      await api.post(endpoints.employees.list, payload)
      ui.toast({type: 'success', text: 'Сотрудник создан'})
    }
    emit('saved')
  } catch (e: any) {
    const data = e?.response?.data || {}
    errors.first_name = pickError(data, 'first_name')
    errors.last_name = pickError(data, 'last_name')
    errors.email = pickError(data, 'email')
    errors.role = pickError(data, 'role')
    errors.password = pickError(data, 'password')
    
    // Если нет конкретных ошибок полей, показываем общую ошибку
    const hasFieldErrors = Object.values(errors).some(error => error !== null)
    if (!hasFieldErrors && data?.detail && typeof data.detail === 'string') {
      errors.email = data.detail
    }
    
    if (!hasFieldErrors) {
      ui.toast({type: 'error', text: 'Ошибка сохранения сотрудника'})
    }
  } finally {
    submitting.value = false
  }
}
</script>


