<template>
  <span :class="valueClass" :title="tooltip">
    {{ displayValue }}
    <span v-if="showOriginal && result.converted" class="text-xs text-gray-500 ml-1">
      ({{ formatValue(result.originalValue, result.originalUnit) }})
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { smartConvert, formatValueWithUnit } from '@/utils/unitRounding'
import type { SmartQuantity } from '@/api/types'

interface Props {
  // Вариант 1: Использование API smart_* полей
  smartQuantity?: SmartQuantity
  // Вариант 2: Ручная конвертация
  value?: number
  unit?: string
  // Настройки отображения
  precision?: number
  showOriginal?: boolean
  className?: string
  useApiValue?: boolean // Приоритет API значениям
}

const props = withDefaults(defineProps<Props>(), {
  precision: 2,
  showOriginal: false,
  className: 'font-mono',
  useApiValue: true
})

// Определяем, какое значение использовать
const result = computed(() => {
  // Если есть API значение и включен приоритет API
  if (props.smartQuantity && props.useApiValue) {
    return {
      value: props.smartQuantity.value,
      unit: props.smartQuantity.unit,
      originalValue: props.smartQuantity.original_value,
      originalUnit: props.smartQuantity.original_unit,
      converted: props.smartQuantity.value !== props.smartQuantity.original_value || 
                 props.smartQuantity.unit !== props.smartQuantity.original_unit,
      reason: 'API конвертация'
    }
  }
  
  // Если есть ручные значения
  if (props.value !== undefined && props.unit) {
    return smartConvert(props.value, props.unit)
  }
  
  // Fallback - возвращаем пустое значение
  return {
    value: 0,
    unit: '',
    originalValue: 0,
    originalUnit: '',
    converted: false,
    reason: 'Нет данных'
  }
})

// Форматированное значение для отображения
const displayValue = computed(() => {
  return formatValueWithUnit(result.value.value, result.value.unit, props.precision)
})

// Вспомогательная функция для форматирования
const formatValue = (value: number, unit: string) => {
  return formatValueWithUnit(value, unit, props.precision)
}

// CSS классы
const valueClass = computed(() => {
  const baseClass = props.className || 'font-mono'
  const convertedClass = result.value.converted ? 'text-blue-600 font-semibold' : ''
  return `${baseClass} ${convertedClass}`.trim()
})

// Tooltip с информацией о конвертации
const tooltip = computed(() => {
  if (!result.value.converted) {
    return `Оригинальное значение: ${formatValue(result.value.originalValue, result.value.originalUnit)}`
  }
  
  return `Конвертировано: ${formatValue(result.value.originalValue, result.value.originalUnit)} → ${formatValue(result.value.value, result.value.unit)}`
})
</script>
