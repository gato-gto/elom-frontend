<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold mb-4">Пример использования новой системы обработки ошибок</h2>
    
    <!-- Форма с обработкой ошибок -->
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Название</label>
        <input 
          v-model="form.name" 
          type="text" 
          class="input input-bordered w-full"
          :class="{ 'input-error': errors.name }"
        />
        <div v-if="errors.name" class="text-error text-sm mt-1">{{ errors.name }}</div>
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-1">Email</label>
        <input 
          v-model="form.email" 
          type="email" 
          class="input input-bordered w-full"
          :class="{ 'input-error': errors.email }"
        />
        <div v-if="errors.email" class="text-error text-sm mt-1">{{ errors.email }}</div>
      </div>
      
      <button 
        type="submit" 
        class="btn btn-primary"
        :disabled="loading"
      >
        <span v-if="loading" class="loading loading-spinner loading-sm"></span>
        {{ loading ? 'Отправка...' : 'Отправить' }}
      </button>
    </form>

    <!-- Кнопки для тестирования разных типов ошибок -->
    <div class="mt-8 space-y-4">
      <h3 class="text-lg font-semibold">Тестирование ошибок:</h3>
      
      <div class="grid grid-cols-2 gap-4">
        <button @click="testValidationError" class="btn btn-outline">
          Тест ошибки валидации
        </button>
        
        <button @click="testPermissionError" class="btn btn-outline">
          Тест ошибки доступа
        </button>
        
        <button @click="testNotFoundError" class="btn btn-outline">
          Тест ошибки 404
        </button>
        
        <button @click="testServerError" class="btn btn-outline">
          Тест ошибки сервера
        </button>
        
        <button @click="testNetworkError" class="btn btn-outline">
          Тест сетевой ошибки
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFormErrorHandler } from '@/composables/useErrorHandler'
import { ErrorHandlers } from '@/utils/errorHandler'

// Используем новый композабл для обработки ошибок
const { errors, loading, clearErrors, submitForm } = useFormErrorHandler()

// Данные формы
const form = ref({
  name: '',
  email: ''
})

// Обработка отправки формы
const handleSubmit = async () => {
  const result = await submitForm(
    async () => {
      // Имитируем API вызов
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Имитируем ошибку валидации
      if (!form.value.name) {
        const error: any = new Error('Validation failed')
        error.response = {
          status: 400,
          data: {
            detail: 'Ошибка валидации формы',
            errors: {
              name: ['Это поле обязательно для заполнения'],
              email: ['Введите корректный email адрес']
            }
          }
        }
        throw error
      }
      
      return { success: true }
    },
    {
      entity: 'example',
      onSuccess: (data) => {
        console.log('Форма успешно отправлена:', data)
        form.value = { name: '', email: '' }
      },
      onError: (error) => {
        console.log('Ошибка при отправке формы:', error)
      }
    }
  )
}

// Тестирование разных типов ошибок
const testValidationError = async () => {
  const error: any = new Error('Validation failed')
  error.response = {
    status: 400,
    data: {
      detail: 'Ошибка валидации данных',
      errors: {
        field1: ['Поле не может быть пустым'],
        field2: ['Некорректное значение']
      }
    }
  }
  await ErrorHandlers.formValidation(error, 'test')
}

const testPermissionError = async () => {
  const error: any = new Error('Permission denied')
  error.response = {
    status: 403,
    data: {
      detail: 'У вас недостаточно прав для выполнения данного действия'
    }
  }
  await ErrorHandlers.auth(error)
}

const testNotFoundError = async () => {
  const error: any = new Error('Not found')
  error.response = {
    status: 404,
    data: {
      detail: 'Запрашиваемый ресурс не найден'
    }
  }
  await ErrorHandlers.dataLoading(error, 'test')
}

const testServerError = async () => {
  const error: any = new Error('Server error')
  error.response = {
    status: 500,
    data: {
      detail: 'Внутренняя ошибка сервера'
    }
  }
  await ErrorHandlers.save(error, 'test')
}

const testNetworkError = async () => {
  const error = new Error('Network error')
  // Нет response - это сетевая ошибка
  await ErrorHandlers.dataLoading(error, 'test')
}
</script>


