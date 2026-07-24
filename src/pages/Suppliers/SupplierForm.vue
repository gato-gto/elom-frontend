<template>
  <div class="supplier-form">
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
import { computed } from 'vue'
import { useSuppliersStore } from '@/stores/suppliers'
import type { 
  PurchaseSupplier, 
  PurchaseSupplierCreateRequest, 
  PurchaseSupplierUpdateRequest
} from '@/api/types'
import type { GenericFormConfig } from '@/types/generic'
import GenericForm from '@/components/GenericForm.vue'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useUiStore } from '@/stores/ui'

const suppliersStore = useSuppliersStore()
const { handleFormError } = useErrorHandler()
const ui = useUiStore()

const props = defineProps<{
  initial?: PurchaseSupplier | null
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

// Form configuration
const formConfig = computed<GenericFormConfig<PurchaseSupplierCreateRequest>>(() => ({
  title: props.initial ? 'Редактировать поставщика' : 'Новый поставщик',
  subtitle: 'Заполните информацию о поставщике',
  sections: [
    {
      title: 'Основная информация',
      description: 'Основные данные поставщика',
      fields: ['name', 'is_active'],
      order: 1
    },
    {
      title: 'Контактная информация',
      description: 'Контактные данные поставщика',
      fields: ['contact_person', 'phone', 'email', 'address'],
      order: 2
    }
  ],
  fields: [
    {
      key: 'name',
      type: 'input',
      label: 'Название поставщика',
      placeholder: 'Название организации',
      required: true,
      order: 1,
      width: 'full',
      validation: {
        minLength: 2,
        maxLength: 200
      }
    },
    {
      key: 'is_active',
      type: 'checkbox',
      label: 'Активный поставщик',
      order: 2,
      width: 'full'
    },
    {
      key: 'contact_person',
      type: 'input',
      label: 'Контактное лицо',
      placeholder: 'ФИО контактного лица',
      order: 3,
      width: 'half',
      validation: {
        maxLength: 100
      }
    },
    {
      key: 'phone',
      type: 'tel',
      label: 'Телефон',
      placeholder: '+998 90 123 45 67',
      order: 4,
      width: 'half',
      validation: {
        maxLength: 20,
        // F-234: выравниваем с бэкендом (^\+?[1-9]\d{7,14}$ по цифрам) — 8–15 цифр,
        // не начинается с 0; форматирующие символы допускаются.
        custom: (v: any) => {
          if (!v || !String(v).trim()) {return null}
          const digits = String(v).replace(/\D/g, '')
          if (digits.length < 8 || digits.length > 15) {return 'Телефон должен содержать 8–15 цифр'}
          if (!/^[1-9]/.test(digits)) {return 'Номер не может начинаться с 0'}
          return null
        }
      }
    },
    {
      key: 'email',
      type: 'input',
      label: 'Email',
      placeholder: 'email@example.com',
      order: 5,
      width: 'half',
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        maxLength: 100
      }
    },
    {
      key: 'address',
      type: 'textarea',
      label: 'Адрес',
      placeholder: 'Юридический адрес поставщика',
      order: 6,
      width: 'full',
      validation: {
        maxLength: 500
      }
    }
  ],
  submitText: props.initial ? 'Обновить' : 'Создать',
  cancelText: 'Отмена',
  showCancel: true
}))

// Initial form data
const initialFormData = computed<PurchaseSupplierCreateRequest>(() => {
  if (props.initial) {
    return {
      name: props.initial.name,
      contact_person: props.initial.contact_person || '',
      phone: props.initial.phone || '',
      email: props.initial.email || '',
      address: props.initial.address || '',
      is_active: props.initial.is_active
    }
  }
  
  return {
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    is_active: true
  }
})

// Methods
async function handleSubmit(formData: PurchaseSupplierCreateRequest) {
  // F-266: бэкенд требует хотя бы один способ связи (контактное лицо / телефон / email);
  // раньше форма помечала обязательным только name → name-only create падал на 400.
  const hasContact = [formData.contact_person, formData.phone, formData.email]
    .some(v => v && String(v).trim())
  if (!hasContact) {
    ui.toast({ type: 'error', text: 'Укажите хотя бы один способ связи: контактное лицо, телефон или email.' })
    throw new Error('supplier: at least one contact method required')
  }
  try {
    if (props.initial) {
      const updateData: PurchaseSupplierUpdateRequest = { ...formData }
      await suppliersStore.update(props.initial.id, updateData)
    } else {
      await suppliersStore.create(formData)
    }
    
    emit('saved')
  } catch (error) {
    await handleFormError(error, 'supplier')
    throw error
  }
}

function handleCancel() {
  emit('cancel')
}
</script>

<style scoped>
/* Все стили теперь используют DaisyUI классы */
</style>