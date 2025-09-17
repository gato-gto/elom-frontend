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
          rows="3"
        />

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
import { ref, reactive, onMounted } from 'vue'
import { useObjectsStore } from '@/stores/objects'
import { useUiStore } from '@/stores/ui'
import type { Object, ObjectRequest } from '@/api/types'
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

const form = reactive<ObjectRequest>({
  name: '',
  address: '',
  is_active: true
})

function resetForm() {
  form.name = ''
  form.address = ''
  form.is_active = true
  Object.keys(errors).forEach(key => delete errors[key])
}

function loadInitial() {
  if (props.initial) {
    form.name = props.initial.name
    form.address = props.initial.address || ''
    form.is_active = props.initial.is_active
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