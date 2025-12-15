<template>
  <div class="tool-form">
    <!-- Generic Form -->
    <GenericForm
      :config="formConfig"
      :initial-data="initialFormData"
      :on-submit="handleSubmit"
      :on-cancel="handleCancel"
      :validate-on-change="true"
      :reset-on-submit="false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useToolsStore } from '@/stores/tools'
import type { Tool, ToolRequest } from '@/api/types/tools'
import type { GenericFormConfig } from '@/types/generic'
import GenericForm from '@/components/GenericForm.vue'
import { useErrorHandler } from '@/composables/useErrorHandler'

const props = defineProps<{
  initial?: Tool | null
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const toolsStore = useToolsStore()
const { handleFormError } = useErrorHandler()

// Categories for autocomplete
const categories = ref<string[]>([])

onMounted(async () => {
  categories.value = await toolsStore.fetchCategories()
})

// Condition options
const conditionOptions = [
  { value: 'new', label: 'Новый' },
  { value: 'good', label: 'Хорошее' },
  { value: 'after_repair', label: 'После ремонта' },
  { value: 'needs_repair', label: 'Требует ремонта' },
  { value: 'broken', label: 'Сломан' },
  { value: 'lost', label: 'Утерян' }
]

// Form configuration
const formConfig = computed<GenericFormConfig<ToolRequest>>(() => ({
  title: props.initial ? 'Редактировать инструмент' : 'Новый инструмент',
  subtitle: 'Заполните информацию об инструменте',
  sections: [
    {
      title: 'Основная информация',
      description: 'Идентификация инструмента',
      fields: ['inventory_number', 'name', 'category', 'brand'],
      order: 1
    },
    {
      title: 'Состояние',
      description: 'Текущее состояние инструмента',
      fields: ['condition'],
      order: 2
    }
  ],
  fields: [
    {
      key: 'inventory_number',
      type: 'input',
      label: 'Инвентарный номер',
      placeholder: 'INV001',
      required: true,
      order: 1,
      width: 'half',
      validation: {
        minLength: 1,
        maxLength: 128
      }
    },
    {
      key: 'name',
      type: 'input',
      label: 'Название',
      placeholder: 'Перфоратор Makita HR2470',
      required: true,
      order: 2,
      width: 'half',
      validation: {
        minLength: 1,
        maxLength: 256
      }
    },
    {
      key: 'category',
      type: 'input',
      label: 'Категория',
      placeholder: 'Перфоратор, SDS-Plus',
      order: 3,
      width: 'half',
      help: 'Можно указать несколько через запятую',
      datalist: categories.value
    },
    {
      key: 'brand',
      type: 'input',
      label: 'Марка',
      placeholder: 'Makita',
      order: 4,
      width: 'half',
      validation: {
        maxLength: 128
      }
    },
    {
      key: 'condition',
      type: 'select',
      label: 'Состояние',
      placeholder: '— выберите состояние —',
      options: conditionOptions,
      required: !props.initial,
      order: 5,
      width: 'full'
    }
  ],
  submitText: props.initial ? 'Обновить' : 'Создать',
  cancelText: 'Отмена',
  showCancel: true
}))

// Initial form data
const initialFormData = computed<ToolRequest>(() => {
  if (props.initial) {
    return {
      inventory_number: props.initial.inventory_number,
      name: props.initial.name,
      category: props.initial.category || '',
      brand: props.initial.brand || '',
      condition: props.initial.condition
    }
  }
  
  return {
    inventory_number: '',
    name: '',
    category: '',
    brand: '',
    condition: 'new'
  }
})

// Methods
async function handleSubmit(formData: ToolRequest) {
  try {
    if (props.initial) {
      await toolsStore.update(props.initial.id, formData)
    } else {
      await toolsStore.create(formData)
    }
    
    emit('saved')
  } catch (error) {
    await handleFormError(error, 'tool')
    throw error
  }
}

function handleCancel() {
  emit('cancel')
}
</script>

