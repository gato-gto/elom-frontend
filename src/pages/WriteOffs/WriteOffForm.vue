<template>
  <div class="writeoff-form-container">
    <!-- Unit Display -->
    <div v-if="selectedMaterialUnit" class="card bg-base-100 border mb-6">
      <div class="card-body">
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

    <!-- GenericForm -->
    <GenericForm
      :config="formConfig"
      :initial-data="initialData"
      :on-submit="onSaved"
      :on-cancel="handleCancel"
      :validate-on-change="true"
      :reset-on-submit="false"
      @field-change="onFieldChange"
    />

    <!-- Информация об остатке -->
    <div v-if="currentBalance !== null" class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Информация об остатке</h2>
        <div class="alert alert-info">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="font-bold">Текущий остаток</h3>
            <div class="text-sm">
              На объекте "{{ objectName(formData.object) }}" материала "{{ materialName(formData.material) }}" 
              остаток составляет: <span class="font-mono font-bold">{{ currentBalance }} {{ unitCode }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Предупреждения валидации -->
    <div v-if="validationWarnings.length > 0" class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Предупреждения валидации</h2>
        <div class="alert alert-warning">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 class="font-bold">Внимание!</h3>
            <ul class="text-sm space-y-1">
              <li v-for="warning in validationWarnings" :key="warning" class="flex items-start gap-2">
                <span class="text-warning mt-0.5">•</span>
                <span>{{ warning }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWriteOffsStore } from '@/stores/writeOffs'
import { useObjectsStore } from '@/stores/objects'
import { useMaterialsStore } from '@/stores/materials'
import { useEmployeesStore } from '@/stores/employees'
import { useUnitsStore } from '@/stores/units'
import { useUiStore } from '@/stores/ui'
import GenericForm from '@/components/GenericForm.vue'
import type { 
  WriteOff, 
  WriteOffCreateRequest, 
  WriteOffUpdateRequest,
  SiteObject, 
  Material, 
  Employee,
  Unit
} from '@/api/types'
import type { GenericFormConfig } from '@/types/generic'
import { ErrorHandlers } from '@/utils/errorHandler'

const route = useRoute()
const router = useRouter()

// Stores
const writeOffsStore = useWriteOffsStore
const objectsStore = useObjectsStore
const materialsStore = useMaterialsStore()
const employeesStore = useEmployeesStore
const unitsStore = useUnitsStore
const ui = useUiStore()

// Props
const props = defineProps<{
  initial?: WriteOff | null
}>()

// Emits
const emit = defineEmits<{
  saved: []
  cancel: []
}>()

// Состояние
const loading = ref(false)
const errors = reactive<Record<string, string>>({})
const currentBalance = ref<number | null>(null)
const validationWarnings = ref<string[]>([])
const selectedMaterialId = ref<number>(0)
const formData = reactive<WriteOffCreateRequest>({
  date: new Date().toISOString().split('T')[0],
  object: 0,
  material: null, // nullable according to API
  unit: 0,
  quantity: '0',
  stage: 'post_rough',
  responsible: 0,
  comment: ''
})

// Определяем режим редактирования
const isEdit = computed(() => !!props.initial || !!route.params.id)

// Computed property for selected material unit
const selectedMaterialUnit = computed(() => {
  if (selectedMaterialId.value === 0) return null
  const material = materialsStore.items.find(m => m.id === selectedMaterialId.value)
  return material?.default_unit_code || null
})

// Computed для справочников
const objects = computed(() => objectsStore.items)
const materials = computed(() => materialsStore.items)
const employees = computed(() => employeesStore.items)
const units = computed(() => unitsStore.items)

// Опции для селектов
const objectOptions = computed(() => [
  ...objects.value.map((o: SiteObject) => ({ value: o.id, label: o.name }))
])

const materialOptions = computed(() => [
  ...materials.value.map((m: Material) => ({ value: m.id, label: m.name }))
])

const employeeOptions = computed(() => [
  ...employees.value.map((e: Employee) => ({ 
    value: e.id, 
    label: `${e.first_name || e.username} ${e.last_name || ''}`.trim()
  }))
])

const unitOptions = computed(() => [
  { value: 0, label: '— выберите единицу —' },
  ...units.value.map((u: Unit) => ({ value: u.id, label: `${u.name} (${u.code})` }))
])

const stageOptions = [
  { value: 'acceptance', label: 'Приемка' },
  { value: 'request', label: 'Заявка' },
  { value: 'delivery_fixed', label: 'Доставка' },
  { value: 'post_rough', label: 'После черновых' },
  { value: 'handover', label: 'Сдача' }
]

// Computed для отображения
const objectName = (id: number) => objects.value.find((o: SiteObject) => o.id === id)?.name
const materialName = (id: number | null) => id ? materials.value.find((m: Material) => m.id === id)?.name : 'Не выбран'
const unitCode = computed(() => {
  const unit = units.value.find((u: Unit) => u.id === formData.unit)
  return unit?.code || ''
})

// GenericForm configuration
const formConfig = computed<GenericFormConfig<WriteOffCreateRequest>>(() => ({
  title: isEdit.value ? 'Редактировать списание' : 'Новое списание',
  subtitle: 'Управление списанием материалов с объектов',
  sections: [
    {
      title: 'Основная информация',
      description: 'Основные данные о списании',
      fields: ['date', 'object', 'material', 'unit', 'quantity'],
      order: 1
    },
    {
      title: 'Детали списания',
      description: 'Параметры списания',
      fields: ['stage', 'responsible'],
      order: 2
    },
    {
      title: 'Дополнительная информация',
      description: 'Дополнительные сведения о списании',
      fields: ['comment'],
      order: 3
    }
  ],
  fields: [
    {
      key: 'date',
      type: 'date',
      label: 'Дата списания',
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
      width: 'half'
    },
    {
      key: 'unit',
      type: 'select',
      label: 'Единица измерения',
      placeholder: '— выберите единицу —',
      required: true,
      options: unitOptions.value,
      order: 4,
      width: 'half',
      disabled: true
    },
    {
      key: 'quantity',
      type: 'number',
      label: 'Количество',
      placeholder: 'Введите количество',
      required: true,
      validation: {
        min: 0.000001,
        step: 0.000001
      },
      order: 5,
      width: 'full'
    },
    {
      key: 'stage',
      type: 'select',
      label: 'Этап работ',
      placeholder: '— выберите этап —',
      required: true,
      options: stageOptions,
      order: 6,
      width: 'half'
    },
    {
      key: 'responsible',
      type: 'select',
      label: 'Ответственный',
      placeholder: '— выберите ответственного —',
      required: true,
      options: employeeOptions.value,
      order: 7,
      width: 'half'
    },
    {
      key: 'comment',
      type: 'textarea',
      label: 'Комментарий',
      placeholder: 'Дополнительная информация о списании...',
      order: 8,
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
      quantity: props.initial.quantity,
      stage: props.initial.stage,
      responsible: props.initial.responsible,
      comment: props.initial.comment || ''
    }
  }
  return {
    date: new Date().toISOString().split('T')[0],
    object: 0,
    material: 0,
    unit: 0,
    quantity: '0',
    stage: 'post_rough',
    responsible: 0,
    comment: ''
  }
})

// Form submission handler
async function onSaved(data: WriteOffCreateRequest) {
  loading.value = true
  Object.keys(errors).forEach(key => delete errors[key])
  
  // Update formData for display purposes
  Object.assign(formData, data)
  
  try {
    if (isEdit.value) {
      if (props.initial) {
        const updateData: WriteOffUpdateRequest = { ...data }
        await writeOffsStore.update(props.initial.id, updateData)
      } else {
        const id = parseInt(route.params.id as string)
        const updateData: WriteOffUpdateRequest = { ...data }
        await writeOffsStore.update(id, updateData)
      }
    } else {
      await writeOffsStore.create(data)
    }
    
    emit('saved')
  } catch (error: unknown) {
    const errorResult = await ErrorHandlers.formValidation(error)
    
    // Устанавливаем ошибки полей
    Object.keys(errorResult.fieldErrors).forEach(field => {
      const fieldError = errorResult.fieldErrors[field]
      errors[field] = Array.isArray(fieldError) ? fieldError[0] : fieldError
    })
    
    // Если есть общая ошибка (например, 403), показываем её отдельно
    if (errorResult.detail && Object.keys(errorResult.fieldErrors).length === 0) {
      ui.toast({ type: 'error', text: errorResult.detail })
    }
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  emit('cancel')
}

// Watcher для автоматического выбора единицы измерения при выборе материала
watch(() => formData.material, (materialId) => {
  if (materialId) {
    const material = materials.value.find((m: Material) => m.id === materialId)
    if (material) {
      formData.unit = material.default_unit
    }
  }
})

// Load data on mount
onMounted(async () => {
  // Load reference data if not already loaded
  const promises = []
  if (objectsStore.items.length === 0) {
    promises.push(objectsStore.fetchList({ page_size: 1000, ordering: 'name' } as any))
  }
  if (materialsStore.items.length === 0) {
    promises.push(materialsStore.fetchList({ page_size: 1000, ordering: 'name' } as any))
  }
  if (employeesStore.items.length === 0) {
    promises.push(employeesStore.fetchList({ page_size: 1000, ordering: 'username' } as any))
  }
  if (unitsStore.items.length === 0) {
    promises.push(unitsStore.fetchList({ page_size: 1000, ordering: 'name' } as any))
  }
  
  if (promises.length > 0) {
    try {
      await Promise.all(promises)
    } catch (error) {
      ui.toast({ type: 'error', text: 'Ошибка загрузки справочников' })
    }
  }
  
  // Load initial data if editing
  if (isEdit.value && props.initial) {
    Object.assign(formData, {
      date: props.initial.date,
      object: props.initial.object,
      material: props.initial.material,
      unit: props.initial.unit,
      quantity: props.initial.quantity,
      stage: props.initial.stage,
      responsible: props.initial.responsible,
      comment: props.initial.comment || ''
    })
    currentBalance.value = parseFloat(props.initial.current_balance)
    validationWarnings.value = props.initial.validation_warnings
  }
})

// Handle field changes
function onFieldChange(key: string, value: any) {
  // Auto-fill unit when material is selected
  if (key === 'material' && value) {
    selectedMaterialId.value = value
    const material = materialsStore.items.find(m => m.id === value)
    if (material && material.default_unit) {
      formData.unit = material.default_unit
    }
  } else if (key === 'material' && (value === null || value === 0)) {
    selectedMaterialId.value = 0
    formData.unit = 0
  }
}
</script>

<style scoped>
/* Все стили теперь используют DaisyUI классы */
.writeoff-form-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>