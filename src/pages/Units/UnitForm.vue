<template>
  <div class="unit-form">
    <!-- Generic Form -->
    <GenericForm
      :config="formConfig"
      :initial-data="initialFormData"
      :on-submit="handleSubmit"
      :on-cancel="handleCancel"
      :validate-on-change="true"
      :reset-on-submit="false"
    />

    <!-- Информация о конвертации -->
    <div v-if="currentCode" class="bg-base-100 rounded-lg mt-6">
      <div class="">
        <h2 class="text-lg font-semibold mb-4">Умная конвертация</h2>
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useUnitsStore } from '@/stores/units'
import type { Unit, UnitRequest } from '@/api/types'
import type { GenericFormConfig } from '@/types/generic'
import GenericForm from '@/components/GenericForm.vue'
import { useErrorHandler } from '@/composables/useErrorHandler'

const props = defineProps<{
  initial?: Unit | null
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const unitsStore = useUnitsStore
const { handleFormError } = useErrorHandler()

// Track current code for smart conversion display
const currentCode = ref('')

// Form configuration
const formConfig = computed<GenericFormConfig<UnitRequest>>(() => ({
  title: props.initial ? 'Редактировать единицу' : 'Новая единица',
  subtitle: 'Заполните информацию о единице измерения',
  sections: [
    {
      title: 'Основная информация',
      description: 'Название и код единицы измерения',
      fields: ['name', 'code'],
      order: 1
    }
  ],
  fields: [
    {
      key: 'name',
      type: 'input',
      label: 'Название единицы',
      placeholder: 'Введите название единицы измерения',
      required: true,
      order: 1,
      width: 'full',
      validation: {
        minLength: 2,
        maxLength: 100
      }
    },
    {
      key: 'code',
      type: 'input',
      label: 'Код единицы',
      placeholder: 'Введите код единицы (например: кг, м, шт)',
      required: true,
      order: 2,
      width: 'full',
      help: getCodeHelpText(),
      validation: {
        minLength: 1,
        maxLength: 10,
        pattern: /^[а-яёА-ЯЁa-zA-Z0-9²³]+$/
      }
    }
  ],
  submitText: props.initial ? 'Обновить' : 'Создать',
  cancelText: 'Отмена',
  showCancel: true
}))

// Initial form data
const initialFormData = computed<UnitRequest>(() => {
  if (props.initial) {
    currentCode.value = props.initial.code
    return {
      name: props.initial.name,
      code: props.initial.code
    }
  }
  
  currentCode.value = ''
  return {
    name: '',
    code: ''
  }
})

// Watch for code changes to update currentCode
watch(() => initialFormData.value.code, (newCode) => {
  currentCode.value = newCode || ''
}, { immediate: true })

// Methods
async function handleSubmit(formData: UnitRequest) {
  try {
    currentCode.value = formData.code
    
    if (props.initial) {
      await unitsStore.update(props.initial.id, formData)
    } else {
      await unitsStore.create(formData)
    }
    
    emit('saved')
  } catch (error) {
    await handleFormError(error, 'unit')
    throw error
  }
}

function handleCancel() {
  emit('cancel')
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
  if (!currentCode.value) {
    return 'Короткий код для использования в системе (например: кг, м, шт)'
  }
  
  const isSmart = isUsedInSmartConversion(currentCode.value)
  if (isSmart) {
    return '✅ Этот код поддерживает умную конвертацию'
  }
  
  return 'Код будет использоваться как есть, без автоматической конвертации'
}

function getSmartConversionAlertClass(): string {
  if (!currentCode.value) {return 'alert-info'}
  
  const isSmart = isUsedInSmartConversion(currentCode.value)
  return isSmart ? 'alert-success' : 'alert-warning'
}

function getSmartConversionTitle(): string {
  if (!currentCode.value) {return 'Введите код единицы'}
  
  const isSmart = isUsedInSmartConversion(currentCode.value)
  return isSmart ? 'Умная конвертация поддерживается' : 'Умная конвертация не поддерживается'
}

function getSmartConversionDescription(): string {
  if (!currentCode.value) {return 'После ввода кода здесь появится информация о поддержке умной конвертации'}
  
  const isSmart = isUsedInSmartConversion(currentCode.value)
  
  if (isSmart) {
    return `Единица "${currentCode.value}" будет автоматически конвертироваться (например, 1000г → 1кг). Пользователи увидят удобные значения.`
  }
  
  return `Единица "${currentCode.value}" будет отображаться как есть, без автоматической конвертации. Рекомендуется использовать стандартные коды: г, кг, т, мм, см, м, км, см², м², га, мл, л, м³.`
}
</script>