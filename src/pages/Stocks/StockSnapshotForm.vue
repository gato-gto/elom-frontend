<template>
  <form class="grid gap-4" @submit.prevent="onSubmit">

    <!-- Основная информация -->
    <div class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Основная информация</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <!-- Дата -->
          <FormField
            v-model="model.date"
            label="Дата движения"
            type="date"
            :error="errors.date"
            required
          />

          <!-- Объект -->
          <FormField
            v-model="model.object"
            label="Объект"
            type="select"
            :options="objectOptions"
            :error="errors.object"
            placeholder="— выберите объект —"
            required
          />

          <!-- Материал -->
          <FormField
            v-model="model.material"
            label="Материал"
            type="select"
            :options="materialOptions"
            :error="errors.material"
            placeholder="— выберите материал —"
            required
          />

          <!-- Единица измерения -->
          <FormField
            v-model="model.unit"
            label="Единица измерения"
            type="select"
            :options="unitOptions"
            :error="errors.unit"
            placeholder="— выберите единицу —"
            required
          />
        </div>
      </div>
    </div>

    <!-- Детали движения -->
    <div class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Детали движения</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <!-- Количество -->
          <FormField
            v-model="model.quantity_signed"
            label="Количество"
            type="number"
            step="0.000001"
            :error="errors.quantity_signed"
            placeholder="Положительное для прихода, отрицательное для расхода"
            required
          />

          <!-- Этап работ -->
          <FormField
            v-model="model.stage"
            label="Этап работ"
            type="select"
            :options="stageOptions"
            :error="errors.stage"
            placeholder="— выберите этап —"
            required
          />

          <!-- Тип источника -->
          <FormField
            v-model="model.source_type"
            label="Тип источника"
            type="select"
            :options="sourceTypeOptions"
            :error="errors.source_type"
            placeholder="— выберите тип —"
            required
          />

          <!-- Ответственный -->
          <FormField
            v-model="model.responsible"
            label="Ответственный"
            type="select"
            :options="employeeOptions"
            :error="errors.responsible"
            placeholder="— выберите ответственного —"
            required
          />
        </div>
      </div>
    </div>

    <!-- Дополнительная информация -->
    <div class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Дополнительная информация</h2>
        <div class="grid gap-4">
          <!-- ID источника -->
          <FormField
            v-model="model.source_id"
            label="ID источника"
            type="number"
            :error="errors.source_id"
            placeholder="ID закупки или списания"
          />

          <!-- Комментарий -->
          <FormField
            v-model="model.comment"
            label="Комментарий"
            type="textarea"
            :error="errors.comment"
            placeholder="Дополнительная информация о движении..."
            :rows="3"
          />
        </div>
      </div>
    </div>


    <!-- Кнопки действий -->
    <div class="flex justify-end gap-2">
      <button 
        type="button" 
        class="btn btn-outline" 
        @click="$emit('cancel')"
        :disabled="loading"
      >
        Отмена
      </button>
      <button 
        type="submit" 
        class="btn btn-primary" 
        :disabled="loading"
      >
        <svg v-if="loading" class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        {{ loading ? 'Сохранение...' : (isEdit ? 'Обновить' : 'Создать') }}
      </button>
    </div>
  </form>
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
import FormField from '@/components/FormField.vue'
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

const isEdit = computed(() => !!props.initial)

const model = reactive<StockSnapshotCreateRequest>({
  date: new Date().toISOString().split('T')[0],
  object: 0,
  material: 0,
  unit: 0,
  quantity_signed: '0',
  stage: 'acceptance',
  source_type: 'purchase_item',
  source_id: 0,
  responsible: 0,
  comment: '',
})

// Computed options
const objectOptions = computed(() => [
  { value: 0, label: '— выберите объект —' },
  ...objectsStore.items.map((o: SiteObject) => ({ value: o.id, label: o.name }))
])

const materialOptions = computed(() => [
  { value: 0, label: '— выберите материал —' },
  ...materialsStore.items.map((m: Material) => ({ value: m.id, label: m.name }))
])

const employeeOptions = computed(() => [
  { value: 0, label: '— выберите ответственного —' },
  ...employeesStore.items.map((e: Employee) => ({ 
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

function resetForm() {
  model.date = new Date().toISOString().split('T')[0]
  model.object = 0
  model.material = 0
  model.unit = 0
  model.quantity_signed = '0'
  model.stage = 'acceptance'
  model.source_type = 'purchase_item'
  model.source_id = 0
  model.responsible = 0
  model.comment = ''
  Object.keys(errors).forEach(key => delete errors[key])
}

function loadInitial() {
  if (props.initial) {
    model.date = props.initial.date
    model.object = props.initial.object
    model.material = props.initial.material
    model.unit = props.initial.unit
    model.quantity_signed = props.initial.quantity_signed
    model.stage = props.initial.stage
    model.source_type = props.initial.source_type
    model.source_id = props.initial.source_id
    model.responsible = props.initial.responsible
    model.comment = props.initial.comment || ''
  } else {
    resetForm()
  }
}


async function onSubmit() {
  loading.value = true
  Object.keys(errors).forEach(key => delete errors[key])
  
  try {
    if (isEdit.value && props.initial) {
      const updateData: StockSnapshotUpdateRequest = { ...model }
      await stockSnapshotsStore.update(props.initial.id, updateData)
    } else {
      await stockSnapshotsStore.create(model)
    }
    
    emit('saved')
  } catch (error: any) {
    const errorResult = ErrorHandlers.formValidation(error)
    
    // Устанавливаем ошибки полей
    Object.keys(errorResult.fieldErrors).forEach(field => {
      errors[field] = errorResult.fieldErrors[field]
    })
  } finally {
    loading.value = false
  }
}

// Load data on mount
onMounted(async () => {
  loadInitial()
  
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
