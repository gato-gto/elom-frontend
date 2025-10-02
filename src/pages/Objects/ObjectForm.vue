<!-- src/pages/Objects/ObjectForm.vue -->
<template>
  <div class="object-form">
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
import { computed, onMounted } from 'vue'
import { useObjectsStore } from '@/stores/objects'
import { useEmployeesStore, brigadierOptions } from '@/stores/employees'
import type { Object, ObjectRequest } from '@/api/types'
import type { GenericFormConfig } from '@/types/generic'
import GenericForm from '@/components/GenericForm.vue'
import { useErrorHandler } from '@/composables/useErrorHandler'

const props = defineProps<{
  initial?: Object | null
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const objectsStore = useObjectsStore
const employeesStore = useEmployeesStore
const { handleFormError } = useErrorHandler()

// Form configuration
const formConfig = computed<GenericFormConfig<ObjectRequest>>(() => ({
  title: props.initial ? 'Редактировать объект' : 'Новый объект',
  subtitle: 'Заполните информацию об объекте',
  sections: [
    {
      title: 'Основная информация',
      description: 'Основные данные объекта',
      fields: ['name', 'responsible', 'address', 'location_url'],
      order: 1
    },
    {
      title: 'Временные рамки',
      description: 'Даты начала и окончания работ',
      fields: ['date_start', 'date_end', 'is_active'],
      order: 2
    }
  ],
  fields: [
    {
      key: 'name',
      type: 'input',
      label: 'Название объекта',
      placeholder: 'Введите название объекта',
      required: true,
      order: 1,
      width: 'half',
      validation: {
        minLength: 2,
        maxLength: 200
      }
    },
    {
      key: 'responsible',
      type: 'select',
      label: 'Ответственный',
      placeholder: '— выберите ответственного —',
      options: employeeOptions.value,
      order: 2,
      width: 'half'
    },
    {
      key: 'address',
      type: 'textarea',
      label: 'Адрес',
      placeholder: 'Введите адрес объекта',
      order: 3,
      width: 'full',
      validation: {
        maxLength: 500
      }
    },
    {
      key: 'location_url',
      type: 'input',
      label: 'Ссылка на карту',
      placeholder: 'https://yandex.ru/maps/... или https://maps.google.com/...',
      order: 4,
      width: 'full',
      help: 'Укажите ссылку на Яндекс.Карты или Google Maps для точного местоположения объекта',
      validation: {
        pattern: /^https?:\/\/.+/,
        maxLength: 500
      }
    },
    {
      key: 'date_start',
      type: 'date',
      label: 'Дата начала работ',
      order: 5,
      width: 'half'
    },
    {
      key: 'date_end',
      type: 'date',
      label: 'Дата окончания работ',
      order: 6,
      width: 'half'
    },
    {
      key: 'is_active',
      type: 'checkbox',
      label: 'Активный объект',
      order: 7,
      width: 'full'
    }
  ],
  submitText: props.initial ? 'Обновить' : 'Создать',
  cancelText: 'Отмена',
  showCancel: true
}))

// Initial form data
const initialFormData = computed<ObjectRequest>(() => {
  if (props.initial) {
    return {
      name: props.initial.name,
      address: props.initial.address || '',
      is_active: props.initial.is_active,
      location_url: props.initial.location_url,
      responsible: props.initial.responsible,
      date_start: props.initial.date_start,
      date_end: props.initial.date_end
    }
  }
  
  return {
    name: '',
    address: '',
    is_active: true,
    location_url: undefined,
    responsible: undefined,
    date_start: undefined,
    date_end: undefined
  }
})

// Computed options
const employeeOptions = computed(() => {
  const brigadiers = brigadierOptions.value
  const allEmployees = employeesStore.items
  const options = [...brigadiers]
  
  // Добавляем пользователя, указанного в значении "Ответственный", если он есть
  if (props.initial?.responsible) {
    const responsibleEmployee = allEmployees.find(emp => emp.id === props.initial?.responsible)
    if (responsibleEmployee) {
      const responsibleOption = {
        value: responsibleEmployee.id,
        label: `${responsibleEmployee.first_name} ${responsibleEmployee.last_name}`.trim() || responsibleEmployee.username
      }
      
      // Проверяем, что ответственный еще не в списке
      const isAlreadyInList = options.some(option => option.value === responsibleEmployee.id)
      if (!isAlreadyInList) {
        options.push(responsibleOption)
      }
    }
  }
  
  return options
})

// Methods
async function handleSubmit(formData: ObjectRequest) {
  try {
    if (props.initial) {
      await objectsStore.update(props.initial.id, formData)
    } else {
      await objectsStore.create(formData)
    }
    
    emit('saved')
  } catch (error) {
    await handleFormError(error, 'object')
    throw error
  }
}

function handleCancel() {
  emit('cancel')
}

// Load data on mount
onMounted(async () => {
  // Load all employees if not already loaded
  if (employeesStore.items.length === 0) {
    await employeesStore.fetchList({ ordering: 'username' })
  }
})
</script>