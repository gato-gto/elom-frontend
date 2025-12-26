<!-- src/pages/Objects/ObjectForm.vue -->
<template>
  <div>
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
import {computed, onMounted} from 'vue'
import {useObjectsStore} from '@/stores/objects'
import {useEmployeesStore, getBrigadierOptions} from '@/stores/employees'
import {useAuthStore} from '@/stores/auth'
import type {Object, ObjectRequest} from '@/api/types'
import type {GenericFormConfig} from '@/types/generic'
import GenericForm from '@/components/GenericForm.vue'
import {useErrorHandler} from '@/composables/useErrorHandler'

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
const {handleFormError} = useErrorHandler()

// Проверка, является ли текущий пользователь бригадиром
const isBrigadier = computed(() => auth.me?.role === 'brigadier')

// ВАЖНО: backend ждёт EmployeeProfile.id, а не User.id
const currentUserProfileId = computed<number | undefined>(() => auth.me?.profile_id)

// Stage options
const stageOptions = [
  {value: 'acceptance', label: 'Приемка'},
  {value: 'request', label: 'Заявка'},
  {value: 'delivery_fixed', label: 'Доставка'},
  {value: 'post_rough', label: 'После черновых'},
  {value: 'handover', label: 'Сдача'}
]

// Computed options (responsible options должны содержать profile_id)
const employeeOptions = computed(() => {
  // Для бригадира показываем только его самого (profile_id)
  if (isBrigadier.value && auth.me) {
    const currentUserName =
        `${auth.me.first_name || ''} ${auth.me.last_name || ''}`.trim() || auth.me.username

    return [{value: auth.me.profile_id, label: currentUserName}]
  }

  // getBrigadierOptions() уже должен отдавать value = emp.profile_id
  const options = [...getBrigadierOptions()]

  // Если редактируем объект — добавим текущего responsible (profile_id) в options, если его там нет
  const responsibleProfileId = props.initial?.responsible
  if (responsibleProfileId) {
    const exists = options.some(o => o.value === responsibleProfileId)
    if (!exists) {
      // Пытаемся найти сотрудника по profile_id
      const emp = employeesStore.items.find((e: any) => e.profile_id === responsibleProfileId)
      if (emp) {
        options.push({
          value: emp.profile_id,
          label: `${emp.first_name} ${emp.last_name}`.trim() || emp.username
        })
      } else {
        // Фолбэк: хотя бы показываем ID, чтобы селект не был пустым
        options.push({
          value: responsibleProfileId,
          label: `ID: ${responsibleProfileId}`
        })
      }
    }
  }

  return options
})

// Form configuration
const formConfig = computed<GenericFormConfig<ObjectRequest>>(() => ({
  title: props.initial ? 'Редактировать объект' : 'Новый объект',
  subtitle: 'Заполните информацию об объекте',
  sections: [],
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
      required: true,
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
      required: true, // ✅ чтобы не уходило пустым
      validation: {
        minLength: 1,
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
      required: true, // ✅ чтобы не уходило пустым
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

// Initial form data
const initialFormData = computed<ObjectRequest>(() => {
  const myProfileId = currentUserProfileId.value

  const safeName = (s?: string | null) => (s && s.trim() ? s.trim() : 'Не указано')
  const safeContacts = (s?: string | null) => (s && s.trim() ? s.trim() : 'Не указано')

  if (props.initial) {
    return {
      name: props.initial.name,
      address: props.initial.address || '',
      is_active: props.initial.is_active,
      location_url: props.initial.location_url || '',
      // ✅ Для бригадиров ответственный всегда они сами (profile_id)
      responsible: isBrigadier.value ? myProfileId : props.initial.responsible,
      current_stage: props.initial.current_stage || 'acceptance',
      // ✅ не пусто
      key_person_name: safeName(props.initial.key_person_name),
      key_person_contacts: safeContacts(props.initial.key_person_contacts),
      date_start: props.initial.date_start,
      date_end: props.initial.date_end
    }
  }

  return {
    name: '',
    address: '',
    is_active: true,
    location_url: '',
    // ✅ Для новых объектов: если бригадир — ставим profile_id
    responsible: isBrigadier.value ? myProfileId : undefined,
    current_stage: 'acceptance',
    // ✅ чтобы не ловить "не может быть пустым"
    key_person_name: 'Не указано',
    key_person_contacts: 'Не указано',
    date_start: undefined,
    date_end: undefined
  }
})

// Methods
async function handleSubmit(formData: ObjectRequest) {
  try {
    // ✅ Нормализуем данные перед отправкой
    const payload: ObjectRequest = {
      ...formData,
      // backend ждёт строки непустые
      key_person_name: (formData.key_person_name || '').trim() || 'Не указано',
      key_person_contacts: (formData.key_person_contacts || '').trim() || 'Не указано',
      // location_url пусть будет строкой, но без пробелов
      location_url: (formData.location_url || '').trim()
    }

    // Для бригадира на всякий случай принудительно профиль
    if (isBrigadier.value) {
      payload.responsible = currentUserProfileId.value
    }

    if (props.initial) {
      await objectsStore.update(props.initial.id, payload)
    } else {
      await objectsStore.create(payload)
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
  if (employeesStore.items.length === 0) {
    await employeesStore.fetchList({ordering: 'username'})
  }
})
</script>
