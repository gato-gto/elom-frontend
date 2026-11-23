<template>
  <!-- F-1046 (B6): type="number" теряет запятую в браузерах с «точечным» языком интерфейса («1,5» → 15,
       Chrome и Safari, en-US/en-GB; перепроверка 23.11). Текстовое поле + inputmode=decimal: показываем ровно
       набранное, в модель отдаём нормализованную строку (запятая → точка, пробелы-разряды убраны, F-1015). -->
  <input
    type="text"
    inputmode="decimal"
    autocomplete="off"
    :value="display"
    @input="onInput"
    @focus="selectAllOnFocus"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { normalizeDecimalInput, selectAllOnFocus } from '@/utils/numberInput'

const props = defineProps<{ modelValue: string | number | null | undefined }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const asText = (v: string | number | null | undefined): string => (v === null || v === undefined ? '' : String(v))
const display = ref(asText(props.modelValue))

// Внешнее изменение модели (префилл, сброс формы) обновляет поле; собственный ввод не перетираем
// (иначе «1,» превращалось бы в «1» посреди набора).
watch(() => props.modelValue, (v) => {
  if (normalizeDecimalInput(display.value) !== asText(v)) { display.value = asText(v) }
})

function onInput(e: Event) {
  display.value = (e.target as HTMLInputElement).value
  emit('update:modelValue', normalizeDecimalInput(display.value))
}
</script>
