<!-- src/pages/Objects/ObjectForm.vue -->
<template>
  <form class="grid gap-4" @submit.prevent="submit">
    <!-- Основная информация -->
    <div class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Основная информация</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <!-- Название -->
          <FormField
            v-model="form.name"
            label="Название объекта"
            type="input"
            placeholder="Введите название объекта"
            :error="errors.name"
            required
          />

          <!-- Адрес -->
          <FormField
            v-model="form.address"
            label="Адрес"
            type="textarea"
            placeholder="Введите адрес объекта"
            :error="errors.address"
            :rows="3"
          />

          <!-- Координаты -->
          <FormField
            v-model="form.lat"
            label="Широта"
            type="input"
            placeholder="41.3111"
            :error="errors.lat"
          />
          <FormField
            v-model="form.lng"
            label="Долгота"
            type="input"
            placeholder="69.2797"
            :error="errors.lng"
          />

          <!-- Даты работ -->
          <FormField
            v-model="form.date_start"
            label="Дата начала работ"
            type="date"
            :error="errors.date_start"
          />
          <FormField
            v-model="form.date_end"
            label="Дата окончания работ"
            type="date"
            :error="errors.date_end"
          />

          <!-- Статус активности -->
          <FormField
            v-model="form.is_active"
            label="Активный объект"
            type="checkbox"
            :error="errors.is_active"
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
import { ref, reactive, onMounted, computed } from 'vue'
import { useObjectsStore } from '@/stores/objects'
import { useUiStore } from '@/stores/ui'
import type { Object, ObjectRequest } from '@/api/types'
import FormField from '@/components/FormField.vue'
import { ErrorHandlers } from '@/utils/errorHandler'

const props = defineProps<{
  initial?: Object | null
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const objectsStore = useObjectsStore()
const ui = useUiStore()

const loading = ref(false)
const errors = reactive<Record<string, string>>({})

const form = reactive<ObjectRequest>({
  name: '',
  address: '',
  is_active: true,
  lat: undefined,
  lng: undefined,
  date_start: undefined,
  date_end: undefined
})

function resetForm() {
  form.name = ''
  form.address = ''
  form.is_active = true
  form.lat = undefined
  form.lng = undefined
  form.date_start = undefined
  form.date_end = undefined
  Object.keys(errors).forEach(key => delete errors[key])
}

function loadInitial() {
  if (props.initial) {
    form.name = props.initial.name
    form.address = props.initial.address || ''
    form.is_active = props.initial.is_active
    form.lat = props.initial.lat
    form.lng = props.initial.lng
    form.date_start = props.initial.date_start
    form.date_end = props.initial.date_end
  } else {
    resetForm()
  }
}

async function submit() {
  loading.value = true
  Object.keys(errors).forEach(key => delete errors[key])
  
  try {
    if (props.initial) {
      await objectsStore.update(props.initial.id, form)
    } else {
      await objectsStore.create(form)
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