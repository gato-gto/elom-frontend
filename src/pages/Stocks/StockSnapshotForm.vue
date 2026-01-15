<template>
  <div class="stock-snapshot-form">
    <!-- Unit Display -->
    <div v-if="selectedMaterialUnit" class=" rounded-lg mb-6">
      <div class="">
        <div class="alert alert-info">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="font-bold">Единица измерения</h3>
            <div class="text-sm">
              Для выбранного материала единица измерения: <span class="font-mono font-bold">{{ selectedMaterialUnit }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Generic Form -->
    <GenericForm
      :config="formConfig"
      :initial-data="initialData"
      :on-submit="onSubmit"
      :on-cancel="handleCancel"
      :validate-on-change="true"
      :reset-on-submit="false"
      @field-change="onFieldChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useStockSnapshotsStore } from '@/stores/stockSnapshots'
import { useObjectsStore } from '@/stores/objects'
import { useMaterialsStore } from '@/stores/materials'
import { useEmployeesStore } from '@/stores/employees'
import { useUnitsStore } from '@/stores/units'
import { useUiStore } from '@/stores/ui'
import type { 
  StockSnapshot, 
  StockSnapshotCreateRequest, 
  StockSnapshotUpdateRequest,
  SiteObject,
  Material,
  Employee,
  Unit,
  Stage,
  SourceType
} from '@/api/types'
import type { GenericFormConfig } from '@/types/generic'
import GenericForm from '@/components/GenericForm.vue'
import { ErrorHandlers } from '@/utils/errorHandler'

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

const loading = ref(false)
const errors = reactive<Record<string, string>>({})
const selectedMaterialId = ref<number>(0)

const isEdit = computed(() => !!props.initial)

// Computed property for selected material unit
const selectedMaterialUnit = computed(() => {
  if (selectedMaterialId.value === 0) {return null}
  const material = materialsStore.items.find(m => m.id === selectedMaterialId.value)
  return material?.default_unit_code || null
})

// Computed options
const objectOptions = computed(() => [
  ...objectsStore.items.map((o: SiteObject) => ({ value: o.id, label: o.name }))
])

const materialOptions = computed(() => [
  ...materialsStore.items.map((m: Material) => ({ value: m.id, label: m.name }))
])

const employeeOptions = computed(() => [
  ...employeesStore.items
    .filter((e: Employee) => e.is_active && (e.role === 'brigadier' || e.role === 'admin'))
    .map((e: Employee) => ({ 
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

// GenericForm configuration
const formConfig = computed<GenericFormConfig<StockSnapshotCreateRequest>>(() => ({
  title: isEdit.value ? 'Редактировать движение' : 'Новое движение остатков',
  subtitle: 'Управление движением остатков материалов',
  sections: [
    {
      title: 'Основная информация',
      description: 'Основные данные о движении',
      fields: ['date', 'object', 'material'],
      order: 1
    },
    {
      title: 'Детали движения',
      description: 'Параметры движения',
      fields: ['quantity_signed', 'stage', 'source_type', 'responsible'],
      order: 2
    },
    {
      title: 'Дополнительная информация',
      description: 'Дополнительные сведения о движении',
      fields: ['source_id', 'comment'],
      order: 3
    }
  ],
  fields: [
    {
      key: 'date',
      type: 'date',
      label: 'Дата движения',
      required: true,
      order: 1,
      width: 'half'
    },
    {
      key: 'object',
      type: 'select',
      label: 'Объект',
      placeholder: '— выберите объект —',
      required: true,
      options: objectOptions.value,
      order: 2,
      width: 'half'
    },
    {
      key: 'material',
      type: 'select',
      label: 'Материал',
      placeholder: '— выберите материал —',
      required: true,
      options: materialOptions.value,
      order: 3,
      width: 'full'
    },
    {
      key: 'quantity_signed',
      type: 'number',
      label: 'Количество',
      placeholder: 'Положительное для прихода, отрицательное для расхода',
      required: true,
      validation: {
        min: -999999,
        max: 999999,
        step: 0.000001
      },
      order: 5,
      width: 'half'
    },
    {
      key: 'stage',
      type: 'select',
      label: 'Этап работ',
      placeholder: '— выберите этап —',
      required: true,
      options: stageOptions.value,
      order: 6,
      width: 'half'
    },
    {
      key: 'source_type',
      type: 'select',
      label: 'Тип источника',
      placeholder: '— выберите тип —',
      required: true,
      options: sourceTypeOptions.value,
      order: 7,
      width: 'half'
    },
    {
      key: 'responsible',
      type: 'select',
      label: 'Ответственный',
      placeholder: '— выберите ответственного —',
      required: true,
      options: employeeOptions.value,
      order: 8,
      width: 'half'
    },
    {
      key: 'source_id',
      type: 'number',
      label: 'ID источника',
      placeholder: 'ID закупки или списания',
      order: 9,
      width: 'half'
    },
    {
      key: 'comment',
      type: 'textarea',
      label: 'Комментарий',
      placeholder: 'Дополнительная информация о движении...',
      order: 10,
      width: 'full'
    }
  ],
  submitText: isEdit.value ? 'Обновить' : 'Создать',
  cancelText: 'Отмена',
  showCancel: true,
  validateOnChange: true,
  resetOnSubmit: false,
  mode: isEdit.value ? 'edit' : 'create'
}))

// Initial data for form
const initialData = computed(() => {
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
  }
  return {
    date: new Date().toISOString().split('T')[0],
    object: 0,
    material: 0,
    unit: 0, // Will be auto-filled when material is selected
    quantity_signed: '0',
    stage: 'acceptance',
    source_type: 'purchase_item',
    source_id: 0,
    responsible: 0,
    comment: ''
  }
})

// Function to get unit from selected material
function getUnitFromMaterial(materialId: number): number {
  if (materialId === 0) {return 0}
  const material = materialsStore.items.find(m => m.id === materialId)
  return material?.default_unit || 0
}

// Handle field changes
function onFieldChange(key: string, value: any) {
  // Auto-fill unit when material is selected
  if (key === 'material' && value) {
    selectedMaterialId.value = value
    const unit = getUnitFromMaterial(value)
    // We need to update the form data directly
    // This will be handled in the onSubmit function
  }
}

async function onSubmit(data: StockSnapshotCreateRequest) {
  loading.value = true
  Object.keys(errors).forEach(key => delete errors[key])
  
  // Auto-fill unit from selected material if not set
  if (data.material && !data.unit) {
    data.unit = getUnitFromMaterial(data.material)
  }
  
  try {
    if (isEdit.value && props.initial) {
      const updateData: StockSnapshotUpdateRequest = { ...data }
      await stockSnapshotsStore.update(props.initial.id, updateData)
    } else {
      await stockSnapshotsStore.create(data)
    }
    
    emit('saved')
  } catch (error: any) {
    const errorResult = await ErrorHandlers.formValidation(error)
    
    // Устанавливаем ошибки полей
    Object.keys(errorResult.fieldErrors).forEach(field => {
      const fieldError = errorResult.fieldErrors[field]
      errors[field] = Array.isArray(fieldError) ? fieldError[0] : fieldError
    })
  } finally {
    loading.value = false
  }
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
</style>