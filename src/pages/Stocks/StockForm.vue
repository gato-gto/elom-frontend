<template>
  <div class="stock-form">
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
import { ref, computed, onMounted } from 'vue'
import { useStockSnapshotsStore } from '@/stores/stockSnapshots'
import { useObjectsStore } from '@/stores/objects'
import { useMaterialsStore } from '@/stores/materials'
import { useEmployeesStore, getResponsibleEmployees } from '@/stores/employees'
import { useUnitsStore } from '@/stores/units'
import { useUiStore } from '@/stores/ui'
import type { 
  StockSnapshot, 
  StockSnapshotCreateRequest, 
  StockSnapshotUpdateRequest,
  SiteObject,
  Material,
  Employee,
  Unit
} from '@/api/types'
import type { GenericFormConfig } from '@/types/generic'
import GenericForm from '@/components/GenericForm.vue'
import { useFormErrorHandler } from '@/composables/useErrorHandler'

const stockSnapshotsStore = useStockSnapshotsStore()
const objectsStore = useObjectsStore()
const materialsStore = useMaterialsStore()
const employeesStore = useEmployeesStore()
const unitsStore = useUnitsStore()
const ui = useUiStore()

const props = defineProps<{
  initial?: StockSnapshot | null
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const isEdit = computed(() => !!props.initial)

// Form error handler
const { submitForm, loading } = useFormErrorHandler()

// Computed options
const objectOptions = computed(() => [
  ...objectsStore.items.map((o: SiteObject) => ({ value: o.id, label: o.name }))
])

const materialOptions = computed(() => [
  ...materialsStore.items.map((m: Material) => ({ value: m.id, label: m.name }))
])

// Используем централизованную функцию для получения ответственных
const employeeOptions = computed(() => [
  { value: 0, label: '— выберите ответственного —' },
  ...getResponsibleEmployees().map((e: Employee) => ({ 
      value: e.id, 
      label: `${e.first_name || e.username} ${e.last_name || ''}`.trim()
    }))
])

const unitOptions = computed(() => [
  { value: 0, label: '— выберите единицу —' },
  ...unitsStore.items.map((u: Unit) => ({ value: u.id, label: `${u.name} (${u.code})` }))
])

const stageOptions = computed(() => [
  { value: 'acceptance', label: 'Приемка' },
  { value: 'request', label: 'Заявка' },
  { value: 'delivery_fixed', label: 'Доставка' },
  { value: 'post_rough', label: 'После черновых' },
  { value: 'handover', label: 'Сдача' }
])

const sourceTypeOptions = computed(() => [
  { value: 'purchase_item', label: 'Закупка' },
  { value: 'writeoff', label: 'Списание' }
])

// Form configuration
const formConfig = computed(() => ({
  title: isEdit.value ? 'Редактировать внесение остатков' : 'Внести остатки',
  subtitle: isEdit.value ? 'Изменение данных о движении остатков' : 'Добавление нового движения остатков',
  fields: [
    {
      key: 'date',
      label: 'Дата внесения',
      type: 'date' as const,
      required: true,
      validation: {
        custom: (value: any) => !value ? 'Дата обязательна для заполнения' : null
      }
    },
    {
      key: 'object',
      label: 'Объект',
      type: 'select' as const,
      required: true,
      options: objectOptions.value,
      placeholder: '— выберите объект —',
      validation: {
        custom: (value: any) => !value || value === 0 ? 'Объект обязателен для заполнения' : null
      }
    },
    {
      key: 'material',
      label: 'Материал',
      type: 'select' as const,
      required: true,
      options: materialOptions.value,
      placeholder: '— выберите материал —',
      validation: {
        custom: (value: any) => !value || value === 0 ? 'Материал обязателен для заполнения' : null
      },
      onChange: (value: number | null) => {
        if (value === null || value === 0) {
          return { unit: 0 }
        }
        
        const material = materialsStore.items.find(m => m.id === value)
        if (material && material.default_unit) {
          return { unit: material.default_unit }
        }
        return {}
      }
    },
    {
      key: 'unit',
      label: 'Единица измерения',
      type: 'select' as const,
      required: true,
      options: unitOptions.value,
      placeholder: '— выберите единицу —',
      disabled: true,
      validation: {
        custom: (value: any) => !value || value === 0 ? 'Единица измерения обязательна для заполнения' : null
      }
    },
    {
      key: 'quantity_signed',
      label: 'Количество',
      type: 'number' as const,
      required: true,
      step: 0.000001,
      placeholder: 'Положительное для прихода, отрицательное для расхода',
      validation: {
        custom: (value: any) => !value || value === '' ? 'Количество обязательно для заполнения' : null
      }
    },
    {
      key: 'stage',
      label: 'Этап работ',
      type: 'select' as const,
      required: true,
      options: stageOptions.value,
      placeholder: '— выберите этап —',
      validation: {
        custom: (value: any) => !value ? 'Этап работ обязателен для заполнения' : null
      }
    },
    {
      key: 'source_type',
      label: 'Тип источника',
      type: 'select' as const,
      required: true,
      options: sourceTypeOptions.value,
      placeholder: '— выберите тип —',
      validation: {
        custom: (value: any) => !value ? 'Тип источника обязателен для заполнения' : null
      }
    },
    {
      key: 'responsible',
      label: 'Ответственный',
      type: 'select' as const,
      required: true,
      options: employeeOptions.value,
      placeholder: '— выберите ответственного —',
      validation: {
        custom: (value: any) => !value || value === 0 ? 'Ответственный обязателен для заполнения' : null
      }
    },
    {
      key: 'source_id',
      label: 'ID источника',
      type: 'number' as const,
      placeholder: 'ID закупки или списания'
    },
    {
      key: 'comment',
      label: 'Комментарий',
      type: 'textarea' as const,
      rows: 3,
      placeholder: 'Дополнительная информация о движении...'
    }
  ],
  submitText: isEdit.value ? 'Обновить' : 'Создать',
  cancelText: 'Отмена'
}))

// Initial form data
const initialFormData = computed<StockSnapshotCreateRequest>(() => {
  if (props.initial) {
    return {
      date: props.initial.date,
      object: props.initial.object,
      material: props.initial.material,
      unit: props.initial.unit,
      quantity_signed: props.initial.quantity_signed,
      stage: props.initial.stage,
      source_type: props.initial.source_type,
      source_id: props.initial.source_id,
      responsible: props.initial.responsible,
      comment: props.initial.comment || ''
    }
  } else {
    return {
      date: new Date().toISOString().split('T')[0],
      object: 0,
      material: null,
      unit: 0,
      quantity_signed: '0',
      stage: 'acceptance',
      source_type: 'purchase_item',
      source_id: 0,
      responsible: 0,
      comment: ''
    }
  }
})

// Form handlers
async function handleSubmit(formData: StockSnapshotCreateRequest) {
  await submitForm(async () => {
    if (isEdit.value && props.initial) {
      const updateData: StockSnapshotUpdateRequest = { ...formData }
      await stockSnapshotsStore.update(props.initial.id, updateData)
    } else {
      await stockSnapshotsStore.create(formData)
    }
    
    emit('saved')
  }, { entity: 'stock-snapshot' })
}

function handleCancel() {
  emit('cancel')
}

// Load data on mount
onMounted(async () => {
  // Load reference data if not already loaded
  const promises = []
  if (objectsStore.items.length === 0) {
    promises.push(objectsStore.fetchList({ page_size: 1000 } as any))
  }
  if (materialsStore.items.length === 0) {
    promises.push(materialsStore.fetchList({ page_size: 1000 } as any))
  }
  if (employeesStore.items.length === 0) {
    promises.push(employeesStore.fetchList({ page_size: 1000 } as any))
  }
  if (unitsStore.items.length === 0) {
    promises.push(unitsStore.fetchList({ page_size: 1000 } as any))
  }
  
  if (promises.length > 0) {
    try {
      await Promise.all(promises)
    } catch (error) {
      ui.toast({ type: 'error', text: 'Ошибка загрузки справочников' })
    }
  }
})
</script>

<style scoped>
/* Все стили теперь используют DaisyUI классы */

/* Мобильная оптимизация для формы внесения остатков */
@media (max-width: 768px) {
  .stock-form :deep(.form-field) {
    margin-bottom: 1rem;
  }
  
  .stock-form :deep(.form-field input),
  .stock-form :deep(.form-field select),
  .stock-form :deep(.form-field textarea) {
    min-height: 3rem;
    font-size: 16px; /* Предотвращает zoom на iOS */
    padding: 0.75rem 1rem;
  }
  
  .stock-form :deep(.form-field label) {
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }
  
  .stock-form :deep(.btn) {
    min-height: 3rem;
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
  }
  
  /* Улучшение для выпадающих списков на мобильных */
  .stock-form :deep(select) {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 1.5em 1.5em;
    padding-right: 2.5rem;
  }
  
  /* Улучшение отображения ошибок на мобильных */
  .stock-form :deep(.error-message) {
    font-size: 0.875rem;
    margin-top: 0.5rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
  }
}

/* Улучшения для touch-устройств */
@media (hover: none) and (pointer: coarse) {
  .stock-form :deep(.form-field input),
  .stock-form :deep(.form-field select),
  .stock-form :deep(.form-field textarea) {
    min-height: 3.5rem;
    padding: 1rem;
  }
  
  .stock-form :deep(.btn) {
    min-height: 3.5rem;
    padding: 1rem 1.5rem;
  }
  
  /* Увеличенные области нажатия для кнопок */
  .stock-form :deep(.btn) {
    touch-action: manipulation;
  }
}
</style>
