<!-- src/pages/Objects/ObjectForm.vue -->
<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl mb-6">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
        {{ props.initial ? 'Редактировать объект' : 'Новый объект' }}
      </h2>
      
      <form class="space-y-6" @submit.prevent="submit">
        <!-- Название -->
        <FormField
          v-model="form.name"
          label="Название объекта"
          type="text"
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
          :help="'Необязательно'"
          :rows="3"
        />

        <!-- Координаты -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            v-model="coordinates.latitude"
            label="Широта"
            type="number"
            placeholder="41.3111"
            :help="'Необязательно'"
            step="0.000001"
          />
          <FormField
            v-model="coordinates.longitude"
            label="Долгота"
            type="number"
            placeholder="69.2797"
            :help="'Необязательно'"
            step="0.000001"
          />
        </div>

        <!-- Даты работ -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            v-model="form.start_date"
            label="Дата начала работ"
            type="date"
            :help="'Необязательно'"
          />
          <FormField
            v-model="form.end_date"
            label="Дата окончания работ"
            type="date"
            :help="'Необязательно'"
          />
        </div>

        <!-- Статус объекта -->
        <FormField
          v-model="form.status"
          label="Статус объекта"
          type="select"
          :options="statusOptions"
          :help="'Необязательно'"
        />

        <!-- Ответственное лицо -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            v-model="form.responsible_person"
            label="Ответственное лицо"
            type="text"
            placeholder="ФИО ответственного"
            :help="'Необязательно'"
          />
          <FormField
            v-model="form.responsible_phone"
            label="Телефон ответственного"
            type="text"
            placeholder="+998 90 123 45 67"
            :help="'Необязательно'"
          />
        </div>

        <!-- Статус активности -->
        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text">Активный объект</span>
            <input 
              type="checkbox" 
              v-model="form.is_active" 
              class="checkbox checkbox-primary" 
            />
          </label>
        </div>

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
import { ref, reactive, onMounted, computed } from 'vue'
import { useObjectsStore } from '@/stores/objects'
import { useUiStore } from '@/stores/ui'
import type { Object, ObjectRequest, ObjectStatus } from '@/api/types'
import FormField from '@/components/FormField.vue'

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

// Опции статусов объектов
const statusOptions = computed(() => [
  { value: '', label: 'Не выбран' },
  { value: 'planning', label: 'Планирование' },
  { value: 'active', label: 'Активный' },
  { value: 'completed', label: 'Завершен' },
  { value: 'on_hold', label: 'Приостановлен' },
  { value: 'cancelled', label: 'Отменен' }
])

// Отдельные ref для координат
const coordinates = reactive({
  latitude: 0,
  longitude: 0
})

const form = reactive<ObjectRequest>({
  name: '',
  address: '',
  is_active: true,
  start_date: '',
  end_date: '',
  status: undefined,
  responsible_person: '',
  responsible_phone: ''
})

function resetForm() {
  form.name = ''
  form.address = ''
  form.is_active = true
  form.start_date = ''
  form.end_date = ''
  form.status = undefined
  form.responsible_person = ''
  form.responsible_phone = ''
  coordinates.latitude = 0
  coordinates.longitude = 0
  Object.keys(errors).forEach(key => delete errors[key])
}

function loadInitial() {
  if (props.initial) {
    form.name = props.initial.name
    form.address = props.initial.address || ''
    form.is_active = props.initial.is_active
    form.start_date = props.initial.start_date || ''
    form.end_date = props.initial.end_date || ''
    form.status = props.initial.status
    form.responsible_person = props.initial.responsible_person || ''
    form.responsible_phone = props.initial.responsible_phone || ''
    coordinates.latitude = props.initial.coordinates?.latitude || 0
    coordinates.longitude = props.initial.coordinates?.longitude || 0
  } else {
    resetForm()
  }
}

async function submit() {
  loading.value = true
  Object.keys(errors).forEach(key => delete errors[key])
  
  try {
    // Подготавливаем данные с координатами
    const submitData = {
      ...form,
      coordinates: coordinates.latitude !== 0 || coordinates.longitude !== 0 
        ? { latitude: coordinates.latitude, longitude: coordinates.longitude }
        : undefined
    }
    
    if (props.initial) {
      await objectsStore.update(props.initial.id, submitData)
    } else {
      await objectsStore.create(submitData)
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
      ui.toast({ type: 'error', text: 'Ошибка сохранения объекта' })
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadInitial()
})
</script>