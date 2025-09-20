<template>
  <form class="grid gap-4" @submit.prevent="onSubmit">
    <!-- Основная информация -->
    <div class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Основная информация</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <!-- Дата списания -->
          <FormField
            v-model="model.date"
            label="Дата списания"
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

          <!-- Количество -->
          <FormField
            v-model="model.quantity"
            label="Количество"
            type="number"
            step="0.000001"
            :error="errors.quantity"
            placeholder="Введите количество"
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
              На объекте "{{ objectName(model.object) }}" материала "{{ materialName(model.material) }}" 
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

    <!-- Дополнительная информация -->
    <div class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Дополнительная информация</h2>
        <div class="grid gap-4">
          <!-- Комментарий -->
          <FormField
            v-model="model.comment"
            label="Комментарий"
            type="textarea"
            :error="errors.comment"
            placeholder="Дополнительная информация о списании..."
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
        :disabled="loading || validationWarnings.length > 0"
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWriteOffsStore } from '@/stores/writeOffs'
import { useObjectsStore } from '@/stores/objects'
import { useMaterialsStore } from '@/stores/materials'
import { useEmployeesStore } from '@/stores/employees'
import { useUnitsStore } from '@/stores/units'
import type { 
  WriteOff, 
  WriteOffCreateRequest, 
  WriteOffUpdateRequest,
  SiteObject, 
  Material, 
  Employee,
  Unit
} from '@/api/types'
import FormField from '@/components/FormField.vue'
import { ErrorHandlers } from '@/utils/errorHandler'

const route = useRoute()
const router = useRouter()

// Stores
const writeOffsStore = useWriteOffsStore()
const objectsStore = useObjectsStore()
const materialsStore = useMaterialsStore()
const employeesStore = useEmployeesStore()
const unitsStore = useUnitsStore()

// Состояние
const loading = ref(false)
const errors = ref<Record<string, string>>({})
const currentBalance = ref<number | null>(null)
const validationWarnings = ref<string[]>([])

// Определяем режим редактирования
const isEdit = computed(() => !!route.params.id)

// Модель формы
const model = reactive<WriteOffCreateRequest>({
  date: new Date().toISOString().split('T')[0],
  object: 0,
  material: 0,
  unit: 0,
  quantity: '0',
  stage: 'post_rough',
  responsible: 0,
  comment: ''
})

// Computed для справочников
const objects = computed(() => objectsStore.items)
const materials = computed(() => materialsStore.items)
const employees = computed(() => employeesStore.items)
const units = computed(() => unitsStore.items)

// Опции для селектов
const objectOptions = computed(() => [
  { value: 0, label: 'Выберите объект' },
  ...objects.value.map((o: SiteObject) => ({ value: o.id, label: o.name }))
])

const materialOptions = computed(() => [
  { value: 0, label: 'Выберите материал' },
  ...materials.value.map((m: Material) => ({ value: m.id, label: m.name }))
])

const employeeOptions = computed(() => [
  { value: 0, label: 'Выберите ответственного' },
  ...employees.value.map((e: Employee) => ({ 
    value: e.id, 
    label: `${e.first_name || e.username} ${e.last_name || ''}`.trim()
  }))
])

const unitOptions = computed(() => [
  { value: 0, label: 'Выберите единицу' },
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
const materialName = (id: number) => materials.value.find((m: Material) => m.id === id)?.name
const unitCode = computed(() => {
  const unit = units.value.find((u: Unit) => u.id === model.unit)
  return unit?.code || ''
})

// Загрузка данных
async function loadData() {
  if (isEdit.value) {
    const id = parseInt(route.params.id as string)
    try {
      const writeOff = await writeOffsStore.fetchOne(id)
      if (writeOff) {
        model.date = writeOff.date
        model.object = writeOff.object
        model.material = writeOff.material
        model.unit = writeOff.unit
        model.quantity = writeOff.quantity
        model.stage = writeOff.stage
        model.responsible = writeOff.responsible
        model.comment = writeOff.comment || ''
        currentBalance.value = parseFloat(writeOff.current_balance)
        validationWarnings.value = writeOff.validation_warnings
      }
    } catch (error) {
      console.error('Error loading write-off:', error)
      router.push('/writeoffs')
    }
  }
}

async function loadRefs() {
  await Promise.all([
    objectsStore.fetchList({ page_size: 1000, ordering: 'name' } as any),
    materialsStore.fetchList({ page_size: 1000, ordering: 'name' } as any),
    employeesStore.fetchList({ page_size: 1000, ordering: 'username' } as any),
    unitsStore.fetchList({ page_size: 1000, ordering: 'name' } as any)
  ])
}

// Валидация
function validateForm() {
  errors.value = {}
  
  if (!model.date) {
    errors.value.date = 'Дата обязательна'
  }
  
  if (!model.object) {
    errors.value.object = 'Объект обязателен'
  }
  
  if (!model.material) {
    errors.value.material = 'Материал обязателен'
  }
  
  if (!model.unit) {
    errors.value.unit = 'Единица измерения обязательна'
  }
  
  if (!model.quantity || parseFloat(model.quantity) <= 0) {
    errors.value.quantity = 'Количество должно быть больше 0'
  }
  
  if (!model.stage) {
    errors.value.stage = 'Этап работ обязателен'
  }
  
  if (!model.responsible) {
    errors.value.responsible = 'Ответственный обязателен'
  }
  
  // Проверка остатка
  if (currentBalance.value !== null && parseFloat(model.quantity) > currentBalance.value) {
    errors.value.quantity = `Количество не может превышать остаток (${currentBalance.value})`
  }
  
  return Object.keys(errors.value).length === 0
}

// Отправка формы
async function onSubmit() {
  if (!validateForm()) {
    return
  }
  
  loading.value = true
  errors.value = {}
  
  try {
    if (isEdit.value) {
      const id = parseInt(route.params.id as string)
      const updateData: WriteOffUpdateRequest = {
        date: model.date,
        object: model.object,
        material: model.material,
        unit: model.unit,
        quantity: model.quantity,
        stage: model.stage,
        responsible: model.responsible,
        comment: model.comment
      }
      await writeOffsStore.update(id, updateData)
    } else {
      await writeOffsStore.create(model)
    }
    
    router.push('/writeoffs')
  } catch (error: any) {
    const errorResult = ErrorHandlers.formValidation(error)
    
    // Устанавливаем ошибки полей
    Object.keys(errorResult.fieldErrors).forEach(field => {
      errors.value[field] = errorResult.fieldErrors[field]
    })
  } finally {
    loading.value = false
  }
}

// Watcher для автоматического выбора единицы измерения при выборе материала
watch(() => model.material, (materialId) => {
  if (materialId) {
    const material = materials.value.find((m: Material) => m.id === materialId)
    if (material) {
      model.unit = material.default_unit
    }
  }
})

onMounted(async () => {
  await loadRefs()
  await loadData()
})
</script>

<style scoped>
.form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.form-header {
  margin-bottom: 2rem;
}

.form-content {
  background: white;
  border-radius: 0.5rem;
  padding: 2rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

:root.dark .form-content {
  background: #1f2937;
}
</style>
