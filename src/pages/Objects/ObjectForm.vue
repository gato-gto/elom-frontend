<!-- src/pages/Objects/ObjectForm.vue -->
<template>
  <div>
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
import { useEmployeesStore, getBrigadierOptions } from '@/stores/employees'
import { useAuthStore } from '@/stores/auth'
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

const objectsStore = useObjectsStore()
const employeesStore = useEmployeesStore()
const auth = useAuthStore()
const { handleFormError } = useErrorHandler()

// Проверка, является ли текущий пользователь бригадиром
const isBrigadier = computed(() => auth.me?.role === 'brigadier')

// Form configuration
const formConfig = computed<GenericFormConfig<ObjectRequest>>(() => ({
  title: props.initial ? 'Редактировать объект' : 'Новый объект',
  subtitle: 'Заполните информацию об объекте',
  sections: [

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
      width: 'half',
      // Для бригадиров поле заблокировано - они всегда ответственные за свои объекты
      disabled: isBrigadier.value,
      help: isBrigadier.value ? 'Вы автоматически назначены ответственным за этот объект' : undefined
    },
    {
      key: 'address',
      type: 'textarea',
      label: 'Адрес',
      placeholder: 'Введите адрес объекта',
      order: 3,
      width: 'full',
      rows: 2,
      validation: {
        maxLength: 500
      },
      customClass: 'min-h-0'
    },
    {
      key: 'key_person_name',
      type: 'input',
      label: 'Ключевое лицо',
      placeholder: 'Введите имя ключевого лица (прораба)',
      order: 4,
      width: 'half',
      validation: {
        maxLength: 128
      },
      help: 'Имя прораба или другого ключевого лица на объекте'
    },
    {
      key: 'current_stage',
      type: 'select',
      label: 'Текущий этап работ',
      placeholder: '— выберите этап —',
      options: stageOptions,
      required: true,
      order: 5,
      width: 'half',
      help: 'Текущий этап строительных работ на объекте'
    },
    {
      key: 'key_person_contacts',
      type: 'textarea',
      label: 'Контакты',
      placeholder: 'Введите контакты ключевого лица (телефон, email и т.д.)',
      order: 6,
      width: 'full',
      required: true,
      validation: {
        minLength: 1,
        maxLength: 500
      },
      help: 'Контактная информация ключевого лица'
    },
    {
      key: 'location_url',
      type: 'input',
      label: 'Ссылка на карту',
      placeholder: 'https://yandex.ru/maps/... или https://maps.google.com/...',
      order: 7,
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
      order: 8,
      width: 'half'
    },
    {
      key: 'date_end',
      type: 'date',
      label: 'Дата окончания работ',
      order: 9,
      width: 'half'
    },
    {
      key: 'is_active',
      type: 'checkbox',
      label: 'Активный объект',
      order: 10,
      width: 'full'
    }
  ],
  submitText: props.initial ? 'Обновить' : 'Создать',
  cancelText: 'Отмена',
  showCancel: true
}))

// Stage options
const stageOptions = [
  { value: 'acceptance', label: 'Приемка' },
  { value: 'request', label: 'Заявка' },
  { value: 'delivery_fixed', label: 'Доставка' },
  { value: 'post_rough', label: 'После черновых' },
  { value: 'handover', label: 'Сдача' }
]

// Initial form data
const initialFormData = computed<ObjectRequest>(() => {
  const currentUserProfileId = auth.me?.profile_id // ✅ профиль, не user id

  if (props.initial) {
    return {
      name: props.initial.name,
      address: props.initial.address || '',
      is_active: props.initial.is_active,
      location_url: props.initial.location_url,
      // Для бригадиров ответственный всегда они сами
      responsible: isBrigadier.value ? currentUserProfileId : props.initial.responsible,
      current_stage: props.initial.current_stage || 'acceptance',
      key_person_name: props.initial.key_person_name || '',
      key_person_contacts: props.initial.key_person_contacts || '',
      date_start: props.initial.date_start,
      date_end: props.initial.date_end
    }
  }

  // Для новых объектов: если текущий пользователь - бригадир, автоматически назначаем его ответственным
  return {
    name: '',
    address: '',
    is_active: true,
    location_url: undefined,
    responsible: isBrigadier.value ? currentUserProfileId : undefined,
    current_stage: 'acceptance',
    key_person_name: '',
    key_person_contacts: '',
    date_start: undefined,
    date_end: undefined
  }
})

// Computed options
const employeeOptions = computed(() => {
  // Для бригадиров показываем только их самих
  if (isBrigadier.value && auth.me) {
    const currentUserName =
      `${auth.me.first_name || ''} ${auth.me.last_name || ''}`.trim() || auth.me.username

    return [
      // ✅ value должен быть profile_id (число)
      { value: Number(auth.me.profile_id), label: currentUserName }
    ]
  }

  const allEmployees = employeesStore.items

  const options = allEmployees
    .filter((emp: any) => emp.is_active && (emp.role === 'brigadier' || emp.role === 'admin'))
    .map((emp: any) => ({
      value: Number(emp.profile_id), // Убеждаемся, что это число
      label: `${emp.first_name} ${emp.last_name}`.trim() || emp.username
    }))

  if (props.initial?.responsible) {
    const responsibleProfileId = props.initial.responsible

    const hasAlready = options.some(o => o.value === Number(responsibleProfileId))
    if (!hasAlready) {
      const responsibleEmployee = allEmployees.find((emp: any) => emp.profile_id === responsibleProfileId)
      if (responsibleEmployee) {
        options.push({
          value: Number(responsibleEmployee.profile_id),
          label:
            `${responsibleEmployee.first_name} ${responsibleEmployee.last_name}`.trim() ||
            responsibleEmployee.username
        })
      } else {
        // fallback чтобы select не ломался
        options.push({ value: Number(responsibleProfileId), label: `ID профиля: ${responsibleProfileId}` })
      }
    }
  }

  return options
})


// Methods
async function handleSubmit(formData: ObjectRequest) {
  try {
    // Подготовка данных для отправки
    const submitData: ObjectRequest = {
      ...formData,
      // Конвертируем responsible в число, если это строка
      responsible: formData.responsible 
        ? (typeof formData.responsible === 'string' 
          ? parseInt(formData.responsible, 10) 
          : Number(formData.responsible))
        : undefined,
      // Убеждаемся, что key_person_contacts не пустое (т.к. поле обязательное)
      // Если поле пустое, валидация формы должна была его отклонить
      key_person_contacts: formData.key_person_contacts?.trim() || '',
      // Не отправляем location_url, если оно пустое
      location_url: formData.location_url?.trim() || undefined
    }

    if (props.initial) {
      await objectsStore.update(props.initial.id, submitData)
    } else {
      await objectsStore.create(submitData)
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