<!-- src/pages/Admin/UnitConversionForm.vue -->
<template>
  <div class="space-y-6">
    <div v-if="formError" class="alert alert-error">
      <span>{{ formError }}</span>
    </div>

    <!-- Основная информация -->
    <div class="grid md:grid-cols-2 gap-4">
      <!-- Из единицы -->
      <FormField
        v-model="form.from_unit"
        label="Из единицы"
        type="select"
        :options="fromUnitOptions"
        :error="errors.from_unit"
        required
        @change="onFromUnitChange"
      />

      <!-- В единицу -->
      <FormField
        v-model="form.to_unit"
        label="В единицу"
        type="select"
        :options="toUnitOptions"
        :error="errors.to_unit"
        required
        @change="onToUnitChange"
      />
    </div>

    <!-- Коэффициент конвертации -->
    <div class="grid md:grid-cols-2 gap-4">
      <FormField
        v-model="form.conversion_factor"
        label="Коэффициент конвертации"
        type="number"
        placeholder="1.0"
        :error="errors.conversion_factor"
        :help="conversionHelp"
        step="0.000001"
        required
        @input="onFactorChange"
      />

      <!-- Предустановленные конвертации -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Быстрые конвертации</span>
        </label>
        <select 
          class="select select-bordered"
          @change="onPresetChange"
          :disabled="!form.from_unit || !form.to_unit"
        >
          <option value="">Выберите предустановку</option>
          <optgroup v-for="category in presetCategories" :key="category.name" :label="category.name">
            <option 
              v-for="preset in category.presets" 
              :key="preset.key"
              :value="preset.key"
            >
              {{ preset.description }}
            </option>
          </optgroup>
        </select>
      </div>
    </div>

    <!-- Описание конвертации -->
    <div v-if="conversionDescription" class="alert alert-info">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span>{{ conversionDescription }}</span>
    </div>

    <!-- Двунаправленная конвертация -->
    <div class="form-control">
      <label class="label cursor-pointer">
        <span class="label-text">Создать обратную конвертацию</span>
        <input 
          type="checkbox" 
          v-model="createReverse" 
          class="checkbox checkbox-primary" 
        />
      </label>
      <div class="label">
        <span class="label-text-alt">Автоматически создаст конвертацию в обратную сторону</span>
      </div>
    </div>

    <!-- Статус активности -->
    <div class="form-control">
      <label class="label cursor-pointer">
        <span class="label-text">Активная конвертация</span>
        <input 
          type="checkbox" 
          v-model="form.is_active" 
          class="checkbox checkbox-primary" 
        />
      </label>
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
        type="button" 
        class="btn btn-primary" 
        @click="submit"
        :disabled="loading || !isFormValid"
      >
        <svg v-if="loading" class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        {{ loading ? 'Сохранение...' : (props.initial ? 'Обновить' : 'Создать') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useUnitConversionsStore } from '@/stores/unitConversions'
import { useUiStore } from '@/stores/ui'
import type { UnitConversion, UnitConversionRequest, Unit } from '@/api/types'
import { 
  validateConversionFactor, 
  createConversionDescription,
  getPopularConversions,
  getCommonConversion
} from '@/utils/unitConverter'
import FormField from '@/components/FormField.vue'

const props = defineProps<{
  initial?: UnitConversion | null
  units: Unit[]
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const unitConversionsStore = useUnitConversionsStore()
const ui = useUiStore()

const loading = ref(false)
const formError = ref('')
const errors = reactive<Record<string, string>>({})
const createReverse = ref(false)

const form = reactive<UnitConversionRequest>({
  from_unit: 0,
  to_unit: 0,
  conversion_factor: 1,
  is_active: true
})

// Предустановленные конвертации
const popularConversions = getPopularConversions()
const presetCategories = computed(() => {
  const categories = new Map<string, Array<{ key: string; description: string; factor: number }>>()
  
  popularConversions.forEach(preset => {
    if (!categories.has(preset.category)) {
      categories.set(preset.category, [])
    }
    categories.get(preset.category)!.push({
      key: preset.key,
      description: preset.description,
      factor: preset.factor
    })
  })
  
  return Array.from(categories.entries()).map(([name, presets]) => ({ name, presets }))
})

// Опции для селектов единиц
const fromUnitOptions = computed(() => [
  { value: '', label: 'Выберите единицу' },
  ...props.units.map(unit => ({
    value: unit.id,
    label: unit.name,
    disabled: unit.id === form.to_unit
  }))
])

const toUnitOptions = computed(() => [
  { value: '', label: 'Выберите единицу' },
  ...props.units.map(unit => ({
    value: unit.id,
    label: unit.name,
    disabled: unit.id === form.from_unit
  }))
])

// Валидация формы
const isFormValid = computed(() => {
  return form.from_unit > 0 && 
         form.to_unit > 0 && 
         form.from_unit !== form.to_unit &&
         form.conversion_factor > 0
})

// Описание конвертации
const conversionDescription = computed(() => {
  if (!form.from_unit || !form.to_unit || !form.conversion_factor) return ''
  
  const fromUnit = props.units.find(u => u.id === form.from_unit)
  const toUnit = props.units.find(u => u.id === form.to_unit)
  
  if (!fromUnit || !toUnit) return ''
  
  return createConversionDescription(fromUnit.name, toUnit.name, form.conversion_factor)
})

// Справка по коэффициенту
const conversionHelp = computed(() => {
  if (!form.from_unit || !form.to_unit) return ''
  
  const fromUnit = props.units.find(u => u.id === form.from_unit)
  const toUnit = props.units.find(u => u.id === form.to_unit)
  
  if (!fromUnit || !toUnit) return ''
  
  return `1 ${fromUnit.name} = ${form.conversion_factor} ${toUnit.name}`
})

// Методы
function resetForm() {
  form.from_unit = 0
  form.to_unit = 0
  form.conversion_factor = 1
  form.is_active = true
  createReverse.value = false
  Object.keys(errors).forEach(key => delete errors[key])
  formError.value = ''
}

function loadInitial() {
  if (props.initial) {
    form.from_unit = props.initial.from_unit
    form.to_unit = props.initial.to_unit
    form.conversion_factor = props.initial.conversion_factor
    form.is_active = props.initial.is_active
  } else {
    resetForm()
  }
}

function onFromUnitChange() {
  if (form.from_unit === form.to_unit) {
    form.to_unit = 0
  }
  validateForm()
}

function onToUnitChange() {
  if (form.to_unit === form.from_unit) {
    form.from_unit = 0
  }
  validateForm()
}

function onFactorChange() {
  validateForm()
}

function onPresetChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const presetKey = target.value
  
  if (!presetKey) return
  
  const preset = getCommonConversion(presetKey)
  if (preset) {
    form.conversion_factor = preset.factor
    validateForm()
  }
  
  // Сбрасываем выбор
  target.value = ''
}

function validateForm() {
  Object.keys(errors).forEach(key => delete errors[key])
  
  if (form.from_unit === form.to_unit && form.from_unit > 0) {
    errors.to_unit = 'Единицы должны быть разными'
  }
  
  const factorValidation = validateConversionFactor(form.conversion_factor)
  if (!factorValidation.valid) {
    errors.conversion_factor = factorValidation.error
  }
}

async function submit() {
  loading.value = true
  formError.value = ''
  validateForm()
  
  if (Object.keys(errors).length > 0) {
    loading.value = false
    return
  }
  
  try {
    if (props.initial) {
      await unitConversionsStore.update(props.initial.id, form)
    } else {
      if (createReverse.value) {
        await unitConversionsStore.createBidirectionalConversion(form)
      } else {
        await unitConversionsStore.create(form)
      }
    }
    
    ui.toast({ type: 'success', text: 'Конвертация сохранена' })
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
      formError.value = 'Ошибка сохранения конвертации'
    }
  } finally {
    loading.value = false
  }
}

// Инициализация
loadInitial()

// Валидация при изменении полей
watch([() => form.from_unit, () => form.to_unit, () => form.conversion_factor], () => {
  validateForm()
})
</script>
