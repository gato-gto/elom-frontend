<!-- src/pages/Units/UnitForm.vue -->
<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl mb-6">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        {{ props.initial ? 'Редактировать единицу' : 'Новая единица измерения' }}
      </h2>
      
      <form class="space-y-6" @submit.prevent="submit">
        <!-- Название -->
        <FormField
          v-model="form.name"
          label="Название единицы"
          type="text"
          placeholder="Введите название единицы измерения"
          :error="errors.name"
          required
        />

        <!-- Код -->
        <FormField
          v-model="form.code"
          label="Код единицы"
          type="text"
          placeholder="Введите код единицы (например: кг, м, шт)"
          :error="errors.code"
          :help="'Короткий код для использования в системе'"
          required
          class="font-mono"
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
import { useUnitsStore } from '@/stores/units'
import { useUiStore } from '@/stores/ui'
import type { Unit, UnitRequest } from '@/api/types'
import FormField from '@/components/FormField.vue'

const props = defineProps<{
  initial?: Unit | null
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const unitsStore = useUnitsStore()
const ui = useUiStore()

const loading = ref(false)
const errors = reactive<Record<string, string>>({})

const form = reactive<UnitRequest>({
  name: '',
  code: ''
})

function resetForm() {
  form.name = ''
  form.code = ''
  Object.keys(errors).forEach(key => delete errors[key])
}

function loadInitial() {
  if (props.initial) {
    form.name = props.initial.name
    form.code = props.initial.code
  } else {
    resetForm()
  }
}

async function submit() {
  loading.value = true
  Object.keys(errors).forEach(key => delete errors[key])
  
  try {
    if (props.initial) {
      await unitsStore.update(props.initial.id, form)
    } else {
      await unitsStore.create(form)
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
      ui.toast({ type: 'error', text: 'Ошибка сохранения единицы измерения' })
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadInitial()
})
</script>