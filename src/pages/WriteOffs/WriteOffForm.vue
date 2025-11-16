<template>
  <Modal
    :size="'6xl'"
    :model-value="isOpen"
    :title="props.initial ? 'Редактирование списания' : 'Новое списание'"
    @close="closeModal"
  >
    <div class="space-y-6">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid md:grid-cols-3 gap-4">
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
              :class="{ 'input-error': errors.date }"
            />
            <div v-if="errors.date" class="label">
              <span class="label-text-alt text-error">
                {{ errors.date[0] }}
              </span>
            </div>
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
    </div>

        <!-- Комментарий -->
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-medium">Комментарий</span>
          </label>
          <textarea
            v-model="formData.comment"
            rows="2"
            class="textarea textarea-bordered w-full"
            :class="{ 'textarea-error': errors.comment }"
          ></textarea>
          <div v-if="errors.comment" class="label">
            <span class="label-text-alt text-error">
              {{ errors.comment[0] }}
            </span>
          </div>
        </div>

        <!-- Позиции списания -->
        <div class="space-y-6">
     
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Позици
        </h2>
            <!-- Desktop table view -->
            <div class="hidden md:block overflow-auto">
              <table class="table w-full">
                <thead>
                <tr>
                  <th style="min-width: 240px">Материал</th>
                  <th style="min-width: 120px">Ед.</th>
                  <th style="min-width: 120px">Количество</th>
                  <th style="min-width: 150px">Текущий остаток</th>
                  <th style="min-width: 150px">Будущий остаток</th>
                  <th class="text-right" style="min-width: 80px">Действия</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(item, idx) in items" :key="item._k">
                  <td>
                    <div>
                      <MaterialSearchSelect
                        v-model="item.material"
                        placeholder="— выберите материал —"
                        size="sm"
                        :disabled="!formData.object || materialsLoading"
                        :class="{ 'border-error': getItemFieldError(idx, 'material') }"
                        @change="onItemMaterialChange(item, $event)"
                      />
                      <div v-if="getItemFieldError(idx, 'material')" class="text-error text-xs mt-1">
                        {{ getItemFieldError(idx, 'material') }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div class="text-sm text-gray-600 p-2" :class="{ 'border-error bg-error/10': getItemFieldError(idx, 'unit') }">
                        {{ getUnitName(item.unit) || '—' }}
                      </div>
                      <input type="hidden" v-model.number="item.unit" />
                      <div v-if="getItemFieldError(idx, 'unit')" class="text-error text-xs mt-1">
                        {{ getItemFieldError(idx, 'unit') }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <input 
                        v-model="item.quantity" 
                        type="number" 
                        step="0.000001" 
                        min="0.000001" 
                        class="input input-bordered input-sm w-full"
                        :class="{ 'input-error': getItemFieldError(idx, 'quantity') }"
                        placeholder="0.000000"
                        @input="onItemQuantityChange(item, idx)"
                      />
                      <div v-if="getItemFieldError(idx, 'quantity')" class="text-error text-xs mt-1">
                        {{ getItemFieldError(idx, 'quantity') }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div v-if="item.currentBalance !== null && item.material" class="text-sm">
                      <div class="font-mono">{{ item.currentBalance.toFixed(6) }}</div>
                      <div class="text-xs text-gray-500">{{ getUnitName(item.unit) || '' }}</div>
                    </div>
                    <div v-else class="text-sm text-gray-400">—</div>
                  </td>
                  <td>
                    <div v-if="item.currentBalance !== null && item.material" class="text-sm">
                      <div
                        class="font-mono"
                        :class="{
                          'text-error font-bold': getFutureBalance(item) < 0,
                          'text-warning': getFutureBalance(item) >= 0 && getFutureBalance(item) < parseFloat(item.currentBalance.toFixed(6)) * 0.1
                        }"
                      >
                        {{ getFutureBalance(item).toFixed(6) }}
                      </div>
                      <div class="text-xs text-gray-500">{{ getUnitName(item.unit) || '' }}</div>
                      <div v-if="getFutureBalance(item) < 0" class="text-xs text-error mt-1">
                        Отрицательный остаток!
                      </div>
                    </div>
                    <div v-else class="text-sm text-gray-400">—</div>
                  </td>
                  <td class="text-right">
                    <button type="button" class="btn btn-error btn-xs" @click="removeItem(idx)">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>

            <!-- Mobile card view -->
            <div class="md:hidden space-y-4">
              <div v-for="(item, idx) in items" :key="item._k" class="card bg-base-200 border">
                <div class="card-body p-4">
                  <div class="flex justify-between items-start mb-3">
                    <h3 class="font-medium text-sm">Позиция {{ idx + 1 }}</h3>
                    <button type="button" class="btn btn-error btn-xs" @click="removeItem(idx)">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div class="space-y-3">
                    <!-- Материал -->
                    <div>
                      <label class="label">
                        <span class="label-text text-xs">Материал</span>
                      </label>
                      <MaterialSearchSelect
                        v-model="item.material"
                        placeholder="— выберите материал —"
                        size="sm"
                        :disabled="!formData.object || materialsLoading"
                        :class="{ 'border-error': getItemFieldError(idx, 'material') }"
                        @change="onItemMaterialChange(item, $event)"
                      />
                      <div v-if="getItemFieldError(idx, 'material')" class="text-error text-xs mt-1">
                        {{ getItemFieldError(idx, 'material') }}
                      </div>
                    </div>
                    
                    <!-- Единица измерения -->
                    <div>
                      <label class="label">
                        <span class="label-text text-xs">Единица измерения</span>
                      </label>
                      <div class="text-sm text-gray-600 p-2 bg-base-100 rounded border" :class="{ 'border-error bg-error/10': getItemFieldError(idx, 'unit') }">
                        {{ getUnitName(item.unit) || '—' }}
                      </div>
                      <input type="hidden" v-model.number="item.unit" />
                      <div v-if="getItemFieldError(idx, 'unit')" class="text-error text-xs mt-1">
                        {{ getItemFieldError(idx, 'unit') }}
                      </div>
                    </div>
                    
                    <!-- Количество -->
                    <div>
                      <label class="label">
                        <span class="label-text text-xs">Количество</span>
                      </label>
                      <input 
                        v-model="item.quantity" 
                        type="number" 
                        step="0.000001" 
                        min="0.000001" 
                        class="input input-bordered input-sm w-full"
                        :class="{ 'input-error': getItemFieldError(idx, 'quantity') }"
                        placeholder="0.000000"
                        @input="onItemQuantityChange(item, idx)"
                      />
                      <div v-if="getItemFieldError(idx, 'quantity')" class="text-error text-xs mt-1">
                        {{ getItemFieldError(idx, 'quantity') }}
                      </div>
                    </div>
                    
                    <!-- Остаток -->
                    <div>
                      <label class="label">
                        <span class="label-text text-xs">Текущий остаток</span>
                      </label>
                      <div v-if="item.currentBalance !== null && item.material" class="text-sm font-mono p-2 bg-base-100 rounded border">
                        {{ item.currentBalance.toFixed(6) }} {{ getUnitName(item.unit) || '' }}
                      </div>
                      <div v-else class="text-sm text-gray-400 p-2 bg-base-100 rounded border">
                        —
                      </div>
                    </div>
                    
                    <!-- Будущий остаток -->
                    <div>
                      <label class="label">
                        <span class="label-text text-xs">Будущий остаток</span>
                      </label>
                      <div 
                        v-if="item.currentBalance !== null && item.material" 
                        class="text-sm font-mono p-2 rounded border"
                        :class="{
                          'bg-error/10 border-error text-error': getFutureBalance(item) < 0,
                          'bg-warning/10 border-warning text-warning': getFutureBalance(item) >= 0 && getFutureBalance(item) < parseFloat(item.currentBalance.toFixed(6)) * 0.1,
                          'bg-base-100': getFutureBalance(item) >= parseFloat(item.currentBalance.toFixed(6)) * 0.1
                        }"
                      >
                        {{ getFutureBalance(item).toFixed(6) }} {{ getUnitName(item.unit) || '' }}
                        <div v-if="getFutureBalance(item) < 0" class="text-xs mt-1 font-bold">
                          Отрицательный остаток!
                        </div>
                      </div>
                      <div v-else class="text-sm text-gray-400 p-2 bg-base-100 rounded border">
                        —
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Add item button -->
            <div class="mt-4">
              <button 
                type="button" 
                class="btn btn-sm btn-primary w-full" 
                @click="addItem"
                :disabled="!formData.object || materialsLoading"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Добавить позицию
              </button>
            </div>

            <!-- Общие ошибки для позиций -->
            <div v-if="getItemsGeneralError()" class="alert alert-error mb-4">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
              <span>{{ getItemsGeneralError() }}</span>
            </div>
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
            :disabled="isSubmitting || items.length === 0"
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
import { ref, computed, watch, onMounted, reactive } from 'vue'
import Modal from '@/components/Modal.vue'
import MaterialSearchSelect from '@/components/MaterialSearchSelect.vue'
import { useWriteOffsStore } from '@/stores/writeOffs'
import { useObjectsStore } from '@/stores/objects'
import { useMaterialsStore, getMaterialsByObject } from '@/stores/materials'
import { useEmployeesStore, getByObject } from '@/stores/employees'
import { useUnitsStore } from '@/stores/units'
import { useErrorHandler } from '@/composables/useErrorHandler'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'
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

// Form data - общие поля
const formData = ref({
  date: new Date().toISOString().split('T')[0],
  object: 0,
  responsible: 0,
  comment: ''
})

// Items - позиции списания
interface WriteOffItem {
  _k: string
  material: number | null
  unit: number
  quantity: string
  currentBalance: number | null
}

const items = ref<WriteOffItem[]>([])

// Item errors
const itemErrors = reactive<Record<string, string>>({})

// Loading states
const materialsLoading = ref(false)
const employeesLoading = ref(false)
const isSubmitting = ref(false)

// Сохраняем загруженные материалы для объекта для быстрого доступа
const loadedMaterialsByObject = ref<Material[]>([])

// Options
const objectOptions = computed(() => [
  { value: 0, label: '— выберите объект —' },
  ...objectsStore.items.map((obj: SiteObject) => ({ value: obj.id, label: obj.name }))
])

const unitOptions = computed(() => [
  { value: 0, label: '— выберите единицу —' },
  ...unitsStore.items.map((unit: Unit) => ({ value: unit.id, label: `${unit.name} (${unit.code})` }))
])

const responsibleOptions = ref([
  { value: 0, label: '— выберите ответственного —' }
])

// User modification tracking
const userModifiedFields = ref({
  responsible: false
})

// Item management
function addItem() {
  if (!formData.value.object) {
    return
  }
  
  const newItem: WriteOffItem = {
    _k: Math.random().toString(36).substr(2, 9),
    material: null,
    unit: 0,
    quantity: '0',
    currentBalance: null
  }
  items.value.push(newItem)
  
  // Очищаем ошибки дублирования материалов при добавлении новой позиции
  clearItemsDuplicateErrors()
}

function removeItem(index: number) {
  items.value.splice(index, 1)
  
  // Очищаем ошибки дублирования материалов при удалении позиции
  clearItemsDuplicateErrors()
  
  // Очищаем ошибки для удаленной позиции
  Object.keys(itemErrors).forEach(key => {
    if (key.startsWith(`items[${index}]`)) {
      delete itemErrors[key]
    }
  })
}

// Function to get item field error
function getItemFieldError(itemIndex: number, fieldName: string): string {
  const errorKey = `items[${itemIndex}].${fieldName}`
  return itemErrors[errorKey] || ''
}

// Function to get general items error (like duplicate materials)
function getItemsGeneralError(): string {
  for (const [key, value] of Object.entries(itemErrors)) {
    if (key.startsWith('items[') && typeof value === 'string' && value.includes('Нельзя добавлять один материал несколько раз')) {
      return value
    }
  }
  return ''
}

// Function to clear duplicate material errors
function clearItemsDuplicateErrors() {
  Object.keys(itemErrors).forEach(key => {
    if (key.startsWith('items[') && itemErrors[key] && itemErrors[key].includes('Нельзя добавлять один материал несколько раз')) {
      delete itemErrors[key]
    }
  })
}

// Balance functions
const loadCurrentBalance = async (item: WriteOffItem, index: number) => {
  if (!formData.value.object || !item.material) {
    item.currentBalance = null
    return
  }

  try {
    const { data } = await api.get(endpoints.stockSnapshots.balance, {
      params: {
        object_id: formData.value.object,
        material_id: item.material,
        date: formData.value.date
      }
    })
    
    item.currentBalance = parseFloat(data.current_balance || 0)
  } catch (error) {
    console.error('Error loading current balance:', error)
    item.currentBalance = null
  }
}

// Data loading functions
const loadMaterialsByObject = async (objectId: number) => {
  materialsLoading.value = true
  try {
    if (!objectId) {
      loadedMaterialsByObject.value = []
      return
    }

    const materials = await getMaterialsByObject(objectId)
    loadedMaterialsByObject.value = materials
  } catch (error) {
    console.error('Error loading materials by object:', error)
    loadedMaterialsByObject.value = []
  } finally {
    materialsLoading.value = false
  }
}

const loadEmployeesByObject = async (objectId: number) => {
  employeesLoading.value = true
  try {
    // Базовый список - все бригадиры
    const responsibleList = [
      { value: 0, label: '— выберите ответственного —' },
      ...employeesStore.items
        .filter((emp: any) => emp.role === 'brigadier')
        .map((emp: any) => ({ value: emp.id, label: emp.username }))
    ]

    if (!objectId) {
      responsibleOptions.value = responsibleList
      return
    }

    // Получаем объект для поиска его ответственного
    const selectedObject = objectsStore.items.find((obj: any) => obj.id === objectId)
    const objectResponsibleId = selectedObject?.responsible
    
    // Если у объекта есть ответственный, проверяем есть ли он в списке
    if (objectResponsibleId) {
      const objectResponsible = employeesStore.items.find((emp: any) => emp.id === objectResponsibleId)
      if (objectResponsible) {
        const alreadyInList = responsibleList.some(item => item.value === objectResponsibleId)
        if (!alreadyInList) {
          responsibleList.push({ 
            value: objectResponsible.id, 
            label: `${objectResponsible.username} (ответственный за объект)` 
          })
        }
      }
    }
    
    // При редактировании добавляем текущего ответственного, если его нет в списке
    if (props.initial && props.initial.responsible) {
      const currentResponsible = employeesStore.items.find((emp: any) => emp.id === props.initial!.responsible)
      if (currentResponsible && !responsibleList.some(item => item.value === props.initial!.responsible)) {
        responsibleList.push({ 
          value: currentResponsible.id, 
          label: `${currentResponsible.username} (текущий ответственный)` 
        })
      }
    }
    
    responsibleOptions.value = responsibleList
    
    // Получаем всех сотрудников объекта
    const objectEmployees = getByObject(objectId)
    const brigadiers = objectEmployees.filter((emp: any) => emp.role === 'brigadier')

    // Автозаполнение ответственного, если не изменен пользователем
    if (!userModifiedFields.value.responsible) {
      if (objectResponsibleId) {
        formData.value.responsible = objectResponsibleId
      } else if (brigadiers.length > 0) {
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
  clearErrors()
  Object.keys(itemErrors).forEach(key => delete itemErrors[key])
  
  // Сбрасываем позиции при изменении объекта
  items.value = []
  
  // Сбрасываем ответственного, если не изменен пользователем
  if (!userModifiedFields.value.responsible) {
    formData.value.responsible = 0
  }

  // Загружаем материалы и сотрудников для выбранного объекта
  await Promise.all([
    loadMaterialsByObject(formData.value.object),
    loadEmployeesByObject(formData.value.object)
  ])
  
  // Добавляем одну позицию по умолчанию, если объект выбран
  if (formData.value.object) {
    addItem()
  }
}

const onItemMaterialChange = async (item: WriteOffItem, material: Material | null) => {
  clearErrors()
  clearItemsDuplicateErrors()
  
  if (material) {
    item.material = material.id
  
  // Автозаполнение единицы измерения
    if (material.default_unit && !item.unit) {
      item.unit = material.default_unit
    }
    
    // Загружаем баланс для выбранного материала
    if (formData.value.object && item.material) {
      const index = items.value.findIndex(i => i._k === item._k)
      await loadCurrentBalance(item, index)
    }
  } else {
    item.material = null
    item.unit = 0
    item.currentBalance = null
  }
}

const onItemQuantityChange = async (item: WriteOffItem, index: number) => {
  // При изменении количества обновляем баланс, если нужно
  if (formData.value.object && item.material && formData.value.date) {
    // Баланс не зависит от количества списания, но можно обновить для актуальности
  }
}

const onResponsibleChange = () => {
  userModifiedFields.value.responsible = true
  clearErrors()
}

function getUnitName(unitId: number) {
  const unit = unitsStore.items.find((u: Unit) => u.id === unitId)
  return unit ? unit.code : null
}

// Вычисление будущего остатка для позиции
function getFutureBalance(item: WriteOffItem): number {
  if (item.currentBalance === null || !item.material) {
    return 0
  }
  const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity) : Number(item.quantity)
  const quantity = isNaN(qty) ? 0 : qty
  return item.currentBalance - quantity
}

// Form handlers
const handleSubmit = async () => {
  isSubmitting.value = true
  clearErrors()
  Object.keys(itemErrors).forEach(key => delete itemErrors[key])
  
  try {
    // Валидация: должна быть хотя бы одна позиция
    if (items.value.length === 0) {
      errors.value.non_field_errors = ['Добавьте хотя бы одну позицию списания']
      isSubmitting.value = false
      return
    }
    
    // Валидация: проверка дубликатов материалов
    const materialIds = items.value
      .map(item => item.material)
      .filter((id): id is number => id !== null && id !== 0)
    
    const duplicates = materialIds.filter((id, index) => materialIds.indexOf(id) !== index)
    if (duplicates.length > 0) {
      const duplicateMaterial = loadedMaterialsByObject.value.find(m => m.id === duplicates[0]) || 
                                materialsStore.items.find(m => m.id === duplicates[0])
      const duplicateName = duplicateMaterial?.name || 'материал'
      itemErrors[`items[0].material`] = `Нельзя добавлять один материал несколько раз: ${duplicateName}`
      isSubmitting.value = false
      return
    }
    
    if (props.initial) {
      // Редактирование - пока поддерживается только одна запись
      // TODO: Реализовать редактирование множественных записей
      const updateData: WriteOffUpdateRequest = {
        date: formData.value.date,
        object: formData.value.object,
        material: items.value[0]?.material || null,
        unit: items.value[0]?.unit || 0,
        quantity: items.value[0]?.quantity || '0',
        responsible: formData.value.responsible,
        comment: formData.value.comment
      }
      await writeOffsStore.update(props.initial.id, updateData)
    } else {
      // Создание - создаем множественные WriteOff записи
      const createPromises = items.value
        .filter(item => item.material && item.unit && parseFloat(item.quantity) > 0)
        .map(item => {
          const writeOffData: WriteOffCreateRequest = {
            date: formData.value.date,
            object: formData.value.object,
            material: item.material!,
            unit: item.unit,
            quantity: item.quantity,
            responsible: formData.value.responsible,
            comment: formData.value.comment || ''
          }
          return writeOffsStore.create(writeOffData)
        })
      
      await Promise.all(createPromises)
    }
    
    emit('success')
  } catch (error) {
    const errorResult = await handleFormError(error, 'списание')
    
    // Устанавливаем ошибки полей (включая вложенные)
    Object.keys(errorResult.fieldErrors).forEach(field => {
      const fieldError = errorResult.fieldErrors[field]
      if (field.startsWith('items[')) {
        itemErrors[field] = Array.isArray(fieldError) ? fieldError[0] : fieldError
      }
    })
  } finally {
    isSubmitting.value = false
  }
}

const closeModal = () => {
  emit('close')
}

// Initialize form
const initializeForm = async () => {
  clearErrors()
  Object.keys(itemErrors).forEach(key => delete itemErrors[key])
  
  if (props.initial) {
    // Редактирование - загружаем как одну позицию
    formData.value = {
      date: props.initial.date,
      object: props.initial.object,
      responsible: props.initial.responsible,
      comment: props.initial.comment || ''
    }
    
    items.value = [{
      _k: Math.random().toString(36).substr(2, 9),
      material: props.initial.material,
      unit: props.initial.unit,
      quantity: props.initial.quantity,
      currentBalance: null
    }]
    
    // Загружаем данные для выбранного объекта при редактировании
    if (props.initial.object) {
      userModifiedFields.value.responsible = true
      
      await Promise.all([
        loadMaterialsByObject(props.initial.object),
        loadEmployeesByObject(props.initial.object)
      ])
      
      // Загружаем баланс
      if (props.initial.material && items.value[0]) {
        await loadCurrentBalance(items.value[0], 0)
      }
    }
  } else {
    formData.value = {
    date: new Date().toISOString().split('T')[0],
    object: 0,
    responsible: 0,
    comment: ''
  }
    items.value = []
  }
  
  userModifiedFields.value = {
    responsible: false
  }
}

// Watchers
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await initializeForm()
  }
})

watch(() => props.initial, async () => {
  if (props.isOpen) {
    await initializeForm()
  }
})

// Watch for balance updates when date changes
watch(() => formData.value.date, async () => {
  if (formData.value.object) {
    for (let i = 0; i < items.value.length; i++) {
      const item = items.value[i]
      if (item.material) {
        await loadCurrentBalance(item, i)
      }
    }
  }
})

// Load data on mount
onMounted(async () => {
  const promises = []
  if (objectsStore.items.length === 0) {
    promises.push(objectsStore.fetchList({ page_size: 1000, ordering: 'name', is_active: true} as any))
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
/* Дополнительные стили для мобильной адаптации */
@media (max-width: 640px) {
  .card-body {
    padding: 1rem;
  }
  
  .table {
    font-size: 0.875rem;
  }
  
  .btn {
    min-height: 2.5rem;
  }
  
  .input {
    min-height: 2.5rem;
  }

}

textarea.textarea[rows="1"],textarea.textarea[rows="2"] {
    min-height: auto !important;
  }
</style>
