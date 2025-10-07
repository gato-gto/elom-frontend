<template>
  <Modal
    :model-value="isOpen"
    :title="props.initial ? 'Редактирование списания' : 'Новое списание'"
    @close="closeModal"
  >
    <div class="space-y-6">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Информация о списании
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Все данные о списании материалов
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Дата списания -->
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-medium">Дата списания</span>
            <span class="label-text-alt text-primary font-semibold">*</span>
          </label>
          <input
            v-model="formData.date"
            type="date"
            required
            class="input input-bordered w-full"
          />
        </div>

        <!-- Объект -->
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-medium">Объект</span>
            <span class="label-text-alt text-primary font-semibold">*</span>
          </label>
          <select
            v-model="formData.object"
            @change="onObjectChange"
            required
            class="select select-bordered w-full"
            :class="{ 'select-error': errors.object }"
          >
            <option value="0" disabled>— выберите объект —</option>
            <option
              v-for="object in objectOptions"
              :key="object.value"
              :value="object.value"
            >
              {{ object.label }}
            </option>
          </select>
          <div v-if="errors.object" class="label">
            <span class="label-text-alt text-error">
              {{ errors.object[0] }}
            </span>
          </div>
        </div>

        <!-- Материал -->
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-medium">Материал</span>
            <span class="label-text-alt text-primary font-semibold">*</span>
          </label>
          <select
            v-model="formData.material"
            @change="onMaterialChange"
            required
            :disabled="!formData.object || materialsLoading"
            class="select select-bordered w-full"
            :class="{ 
              'select-disabled': !formData.object || materialsLoading,
              'select-error': errors.material 
            }"
          >
            <option value="0" disabled>— выберите материал —</option>
            <option
              v-for="material in materialOptions"
              :key="material.value"
              :value="material.value"
            >
              {{ material.label }}
            </option>
          </select>
          <div v-if="errors.material" class="label">
            <span class="label-text-alt text-error">
              {{ errors.material[0] }}
            </span>
          </div>
        </div>

        <!-- Единица измерения -->
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-medium">Единица измерения</span>
            <span class="label-text-alt text-primary font-semibold">*</span>
          </label>
          <select
            v-model="formData.unit"
            @change="onUnitChange"
            required
            :disabled="isUnitDisabled"
            class="select select-bordered w-full"
            :class="{ 
              'select-disabled': isUnitDisabled,
              'select-error': errors.unit 
            }"
          >
            <option value="0" disabled>— выберите единицу —</option>
            <option
              v-for="unit in unitOptions"
              :key="unit.value"
              :value="unit.value"
            >
              {{ unit.label }}
            </option>
          </select>
          <div v-if="errors.unit" class="label">
            <span class="label-text-alt text-error">
              {{ errors.unit[0] }}
            </span>
          </div>
        </div>

        <!-- Количество -->
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-medium">Количество</span>
            <span class="label-text-alt text-primary font-semibold">*</span>
          </label>
          <input
            v-model="formData.quantity"
            type="number"
            step="0.000001"
            required
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.quantity }"
          />
          <div v-if="errors.quantity" class="label">
            <span class="label-text-alt text-error">
              {{ errors.quantity[0] }}
            </span>
          </div>
        </div>

        <!-- Этап работ -->
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-medium">Этап работ</span>
            <span class="label-text-alt text-primary font-semibold">*</span>
          </label>
          <select
            v-model="formData.stage"
            required
            class="select select-bordered w-full"
          >
            <option value="acceptance">Приемка</option>
            <option value="request">Заявка</option>
            <option value="delivery_fixed">Доставка</option>
            <option value="post_rough">После черновых</option>
            <option value="handover">Сдача</option>
          </select>
        </div>

        <!-- Ответственный -->
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-medium">Ответственный</span>
            <span class="label-text-alt text-primary font-semibold">*</span>
          </label>
          <select
            v-model="formData.responsible"
            @change="onResponsibleChange"
            required
            class="select select-bordered w-full"
            :class="{ 'select-error': errors.responsible }"
          >
            <option value="0" disabled>— выберите ответственного —</option>
            <option
              v-for="responsible in responsibleOptions"
              :key="responsible.value"
              :value="responsible.value"
            >
              {{ responsible.label }}
            </option>
          </select>
          <div v-if="errors.responsible" class="label">
            <span class="label-text-alt text-error">
              {{ errors.responsible[0] }}
            </span>
          </div>
        </div>

        <!-- Комментарий -->
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-medium">Комментарий</span>
          </label>
          <textarea
            v-model="formData.comment"
            rows="3"
            class="textarea textarea-bordered w-full"
          ></textarea>
        </div>

        <!-- Общие ошибки -->
        <div v-if="errors.non_field_errors" class="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="font-bold">Ошибки валидации:</h3>
            <ul class="list-disc list-inside">
              <li v-for="error in errors.non_field_errors" :key="error">
                {{ error }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Кнопки -->
        <div class="flex justify-end gap-2 pt-4">
          <button
            type="button"
            @click="closeModal"
            class="btn btn-ghost"
          >
            Отмена
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="btn btn-primary"
            :class="{ 'loading': isSubmitting }"
          >
            {{ isSubmitting ? 'Сохранение...' : (props.initial ? 'Обновить' : 'Создать') }}
          </button>
        </div>
      </form>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '@/components/Modal.vue'
import { useWriteOffsStore } from '@/stores/writeOffs'
import { useObjectsStore } from '@/stores/objects'
import { useMaterialsStore, getMaterialsByObject } from '@/stores/materials'
import { useEmployeesStore, getByObject } from '@/stores/employees'
import { useUnitsStore } from '@/stores/units'
import { useErrorHandler } from '@/composables/useErrorHandler'
import type { 
  WriteOff, 
  WriteOffCreateRequest, 
  WriteOffUpdateRequest,
  SiteObject,
  Material,
  Employee,
  Unit
} from '@/api/types'

const writeOffsStore = useWriteOffsStore
const objectsStore = useObjectsStore
const materialsStore = useMaterialsStore
const employeesStore = useEmployeesStore
const unitsStore = useUnitsStore
const { handleFormError, errors, clearErrors } = useErrorHandler()

const props = defineProps<{
  isOpen: boolean
  initial?: WriteOff | null
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

// Reactive data
const formData = ref<WriteOffCreateRequest>({
  date: new Date().toISOString().split('T')[0],
  object: 0,
  material: null,
  unit: 0,
  quantity: '0',
  stage: 'acceptance',
  responsible: 0,
  comment: ''
})

// Loading states
const materialsLoading = ref(false)
const employeesLoading = ref(false)
const isSubmitting = ref(false)

// User modification tracking
const userModifiedFields = ref({
  material: false,
  unit: false,
  responsible: false
})

// Options
const objectOptions = computed(() => [
  { value: 0, label: '— выберите объект —' },
  ...objectsStore.items.map((obj: SiteObject) => ({ value: obj.id, label: obj.name }))
])

const materialOptions = ref([
  { value: 0, label: '— выберите материал —' }
])

const unitOptions = computed(() => [
  { value: 0, label: '— выберите единицу —' },
  ...unitsStore.items.map((unit: Unit) => ({ value: unit.id, label: `${unit.name} (${unit.code})` }))
])

const responsibleOptions = ref([
  { value: 0, label: '— выберите ответственного —' }
])

// Computed properties
const isUnitDisabled = computed(() => {
  if (!formData.value.material) return false
  const material = materialsStore.items.find((m: Material) => m.id === formData.value.material)
  return !!material?.default_unit
})

// Data loading functions
const loadMaterialsByObject = async (objectId: number) => {
  if (!objectId) {
    materialOptions.value = [
      { value: 0, label: '— выберите материал —' }
    ]
    return
  }

  materialsLoading.value = true
  try {
    const materials = await getMaterialsByObject(objectId)
    materialOptions.value = [
      { value: 0, label: '— выберите материал —' },
      ...materials.map((m: Material) => ({ value: m.id, label: m.name }))
    ]
  } catch (error) {
    console.error('Error loading materials by object:', error)
    materialOptions.value = [
      { value: 0, label: '— выберите материал —' }
    ]
  } finally {
    materialsLoading.value = false
  }
}

const loadEmployeesByObject = async (objectId: number) => {
  // Базовый список - все бригадиры
  let responsibleList = [
    { value: 0, label: '— выберите ответственного —' },
    ...employeesStore.items
      .filter((emp: any) => emp.role === 'brigadier')
      .map((emp: any) => ({ value: emp.id, label: emp.username }))
  ]

  if (!objectId) {
    responsibleOptions.value = responsibleList
    return
  }

  employeesLoading.value = true
  try {
    // Получаем объект для поиска его ответственного
    const selectedObject = objectsStore.items.find((obj: any) => obj.id === objectId)
    const objectResponsibleId = selectedObject?.responsible
    
    // Если у объекта есть ответственный, проверяем есть ли он в списке
    if (objectResponsibleId) {
      const objectResponsible = employeesStore.items.find((emp: any) => emp.id === objectResponsibleId)
      if (objectResponsible) {
        // Проверяем, есть ли уже в списке
        const alreadyInList = responsibleList.some(item => item.value === objectResponsibleId)
        if (!alreadyInList) {
          // Добавляем ответственного за объект в список
          responsibleList.push({ 
            value: objectResponsible.id, 
            label: `${objectResponsible.username} (ответственный за объект)` 
          })
        }
      }
    }
    
    responsibleOptions.value = responsibleList
    
    // Получаем всех сотрудников объекта
    const objectEmployees = getByObject(objectId)
    const brigadiers = objectEmployees.filter((emp: any) => emp.role === 'brigadier')

    // Автозаполнение ответственного, если не изменен пользователем
    if (!userModifiedFields.value.responsible) {
      // Сначала пытаемся найти ответственного за объект
      if (objectResponsibleId) {
        formData.value.responsible = objectResponsibleId
      } else if (brigadiers.length > 0) {
        // Если нет ответственного за объект, выбираем первого бригадира объекта
        formData.value.responsible = brigadiers[0].id
      }
    }
  } catch (error) {
    console.error('Error loading employees by object:', error)
  } finally {
    employeesLoading.value = false
  }
}

// Event handlers
const onObjectChange = async () => {
  const objectId = formData.value.object
  
  // Очищаем ошибки при изменении полей
  clearErrors()
  
  // Сбрасываем зависимые поля, если они не изменены пользователем
  if (!userModifiedFields.value.material) {
    formData.value.material = null
  }
  if (!userModifiedFields.value.unit) {
    formData.value.unit = 0
  }
  if (!userModifiedFields.value.responsible) {
    formData.value.responsible = 0
  }

  // Загружаем материалы и сотрудников для выбранного объекта
  await Promise.all([
    loadMaterialsByObject(objectId),
    loadEmployeesByObject(objectId)
  ])
}

const onMaterialChange = () => {
  userModifiedFields.value.material = true
  clearErrors()
  
  // Автозаполнение единицы измерения
  if (formData.value.material) {
    const material = materialsStore.items.find((m: Material) => m.id === formData.value.material)
    if (material && material.default_unit && !userModifiedFields.value.unit) {
      formData.value.unit = material.default_unit
    }
  }
}

const onUnitChange = () => {
  userModifiedFields.value.unit = true
  clearErrors()
}

const onResponsibleChange = () => {
  userModifiedFields.value.responsible = true
  clearErrors()
}

// Form handlers
const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    if (props.initial) {
      const updateData: WriteOffUpdateRequest = { ...formData.value }
      await writeOffsStore.update(props.initial.id, updateData)
    } else {
      await writeOffsStore.create(formData.value)
    }
    
    emit('success')
  } catch (error) {
    await handleFormError(error, 'списание')
  } finally {
    isSubmitting.value = false
  }
}

const closeModal = () => {
  emit('close')
}

// Initialize form
const initializeForm = () => {
  // Очищаем ошибки при инициализации формы
  clearErrors()
  
  if (props.initial) {
    formData.value = {
      date: props.initial.date,
      object: props.initial.object,
      material: props.initial.material,
      unit: props.initial.unit,
      quantity: props.initial.quantity,
      stage: props.initial.stage,
      responsible: props.initial.responsible,
      comment: props.initial.comment || ''
    }
  } else {
    formData.value = {
      date: new Date().toISOString().split('T')[0],
      object: 0,
      material: null,
      unit: 0,
      quantity: '0',
      stage: 'acceptance',
      responsible: 0,
      comment: ''
    }
  }
  
  // Reset user modification flags
  userModifiedFields.value = {
    material: false,
    unit: false,
    responsible: false
  }
}

// Watchers
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    initializeForm()
  }
})

watch(() => props.initial, () => {
  if (props.isOpen) {
    initializeForm()
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
      console.error('Error loading reference data:', error)
    }
  }
})
</script>

<style scoped>
/* Daisy UI стили уже применены через классы */
</style>