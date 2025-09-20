<template>
  <form class="grid gap-4" @submit.prevent="submit">

    <!-- Основная информация -->
    <div class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Основная информация</h2>
        <div class="grid gap-4">
          <!-- Название -->
          <FormField
            v-model="form.name"
            label="Название единицы"
            type="input"
            placeholder="Введите название единицы измерения"
            :error="errors.name"
            required
          />

          <!-- Код -->
          <FormField
            v-model="form.code"
            label="Код единицы"
            type="input"
            placeholder="Введите код единицы (например: кг, м, шт)"
            :error="errors.code"
            :help="getCodeHelpText()"
            required
            class="font-mono"
          />
        </div>
      </div>
    </div>

    <!-- Информация о конвертации -->
    <div v-if="form.code" class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Умная конвертация</h2>
        <div class="alert" :class="getSmartConversionAlertClass()">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <h3 class="font-bold">{{ getSmartConversionTitle() }}</h3>
            <div class="text-sm">{{ getSmartConversionDescription() }}</div>
          </div>
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
import { useUnitsStore } from '@/stores/units'
import { useUiStore } from '@/stores/ui'
import type { Unit, UnitRequest } from '@/api/types'
import FormField from '@/components/FormField.vue'
import { ErrorHandlers } from '@/utils/errorHandler'

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
    const errorResult = ErrorHandlers.formValidation(error)
    
    // Устанавливаем ошибки полей
    Object.keys(errorResult.fieldErrors).forEach(field => {
      errors[field] = errorResult.fieldErrors[field]
    })
  } finally {
    loading.value = false
  }
}

// Функции для подсказок по умной конвертации
function isUsedInSmartConversion(unitCode: string): boolean {
  const smartConversionUnits = [
    // Масса
    'г', 'кг', 'т',
    // Длина
    'мм', 'см', 'м', 'км',
    // Площадь
    'см²', 'м²', 'га',
    // Объем
    'см³', 'м³', 'л', 'мл'
  ]
  
  return smartConversionUnits.includes(unitCode)
}

function getCodeHelpText(): string {
  if (!form.code) {
    return 'Короткий код для использования в системе (например: кг, м, шт)'
  }
  
  const isSmart = isUsedInSmartConversion(form.code)
  if (isSmart) {
    return '✅ Этот код поддерживает умную конвертацию'
  }
  
  return 'Код будет использоваться как есть, без автоматической конвертации'
}

function getSmartConversionAlertClass(): string {
  if (!form.code) return 'alert-info'
  
  const isSmart = isUsedInSmartConversion(form.code)
  return isSmart ? 'alert-success' : 'alert-warning'
}

function getSmartConversionTitle(): string {
  if (!form.code) return 'Введите код единицы'
  
  const isSmart = isUsedInSmartConversion(form.code)
  return isSmart ? 'Умная конвертация поддерживается' : 'Умная конвертация не поддерживается'
}

function getSmartConversionDescription(): string {
  if (!form.code) return 'После ввода кода здесь появится информация о поддержке умной конвертации'
  
  const isSmart = isUsedInSmartConversion(form.code)
  
  if (isSmart) {
    return `Единица "${form.code}" будет автоматически конвертироваться (например, 1000г → 1кг). Пользователи увидят удобные значения.`
  }
  
  return `Единица "${form.code}" будет отображаться как есть, без автоматической конвертации. Рекомендуется использовать стандартные коды: г, кг, т, мм, см, м, км, см², м², га, мл, л, м³.`
}

onMounted(() => {
  loadInitial()
})
</script>