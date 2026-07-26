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
            <option v-if="!hasSingleObject" value="" disabled>— выберите объект —</option>
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
            :disabled="isLimitedAccess"
          >
            <option value="" disabled>— выберите ответственного —</option>
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
     
        <h2 class="text-lg font-semibold text-base-content mb-2">
          Позиции
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
                        :object-id="formData.object || null"
                        :date="formData.date || null"
                        :filter-by-balance="true"
                        :exclude-materials="addedMaterialIds.filter(id => id !== item.material)"
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
                      <div class="text-sm text-muted font-mono p-2" :class="{ 'border-error bg-error/10': getItemFieldError(idx, 'unit') }">
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
                        type="number" inputmode="decimal" 
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
                      <div class="font-mono">{{ formatNumberClean(item.currentBalance) }}</div>
                      <div class="text-xs text-muted">{{ getUnitName(item.unit) || '' }}</div>
                    </div>
                    <div v-else class="text-sm text-subtle">—</div>
                  </td>
                  <td>
                    <div v-if="item.currentBalance !== null && item.material" class="text-sm">
                      <div
                        class="font-mono"
                        :class="{
                          'text-error font-bold': getFutureBalance(item) < 0,
                          'text-warning': getFutureBalance(item) >= 0 && getFutureBalance(item) < item.currentBalance * 0.1
                        }"
                      >
                        {{ formatNumberClean(getFutureBalance(item)) }}
                      </div>
                      <div class="text-xs text-muted">{{ getUnitName(item.unit) || '' }}</div>
                      <div v-if="getFutureBalance(item) < 0" class="text-xs text-error mt-1">
                        Отрицательный остаток!
                      </div>
                    </div>
                    <div v-else class="text-sm text-subtle">—</div>
                  </td>
                  <td class="text-right">
                    <button type="button" class="btn btn-error btn-xs btn-square" @click="removeItem(idx)">
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
              <div v-for="(item, idx) in items" :key="item._k" class="bg-base-200 rounded-lg p-2">
                <div class="">
                  <div class="flex justify-between items-start mb-3">
                    <h3 class="font-medium text-sm">Позиция {{ idx + 1 }}</h3>
                    <button type="button" class="btn btn-error btn-xs btn-square" @click="removeItem(idx)">
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
                        :object-id="formData.object || null"
                        :date="formData.date || null"
                        :filter-by-balance="true"
                        :exclude-materials="addedMaterialIds.filter(id => id !== item.material)"
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
                      <div class="text-sm text-muted font-mono p-2  rounded border" :class="{ 'border-error bg-error/10': getItemFieldError(idx, 'unit') }">
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
                        type="number" inputmode="decimal" 
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
                      <div v-if="item.currentBalance !== null && item.material" class="text-sm font-mono p-2  rounded border">
                        {{ formatNumberClean(item.currentBalance) }} {{ getUnitName(item.unit) || '' }}
                      </div>
                      <div v-else class="text-sm text-subtle p-2  rounded border">
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
                          'bg-warning/10 border-warning text-warning': getFutureBalance(item) >= 0 && getFutureBalance(item) < item.currentBalance * 0.1,
                          '': getFutureBalance(item) >= item.currentBalance * 0.1
                        }"
                      >
                        {{ formatNumberClean(getFutureBalance(item)) }} {{ getUnitName(item.unit) || '' }}
                        <div v-if="getFutureBalance(item) < 0" class="text-xs mt-1 font-bold">
                          Отрицательный остаток!
                        </div>
                      </div>
                      <div v-else class="text-sm text-subtle p-2  rounded border">
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
import { useEmployeesStore, getByObject, getResponsibleEmployees, canBeResponsible } from '@/stores/employees'
import { useUnitsStore } from '@/stores/units'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useUiStore } from '@/stores/ui'
import { formatNumberClean } from '@/utils/formatters'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { DUPLICATE_MATERIAL_MESSAGE } from '@/constants/validation'
import type { 
  WriteOff, 
  WriteOffCreateRequest, 
  WriteOffUpdateRequest,
  SiteObject, 
  Material, 
  Employee,
  Unit
} from '@/api/types'

const writeOffsStore = useWriteOffsStore()
const objectsStore = useObjectsStore()
const materialsStore = useMaterialsStore()
const employeesStore = useEmployeesStore()
const unitsStore = useUnitsStore()
const authStore = useAuthStore()
const { handleFormError, errors, clearErrors } = useErrorHandler()
const ui = useUiStore()

// ✅ RBAC: проверяем ограниченный доступ через permissions
const { canCreateRequests } = usePermissions()
// Пользователь с ограниченным доступом (как requester/brigadier) - может только себе назначать
const isLimitedAccess = computed(() => canCreateRequests.value)
const currentUserId = computed(() => authStore.me?.id)

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
// Backend уже фильтрует объекты для бригадира через get_user_objects()
// Дополнительно фильтруем только активные объекты
const objectOptions = computed(() => {
  const objects = (objectsStore.items as SiteObject[]).filter((obj: SiteObject) => obj.is_active)
  
  // Если только один объект - не показываем placeholder
  if (objects.length === 1) {
    return objects.map((obj: SiteObject) => ({ value: obj.id, label: obj.name }))
  }
  
  return [
    { value: 0, label: '— выберите объект —' },
    ...objects.map((obj: SiteObject) => ({ value: obj.id, label: obj.name }))
  ]
})

// Проверка, есть ли только один объект
const hasSingleObject = computed(() => {
  const objects = (objectsStore.items as SiteObject[]).filter((obj: SiteObject) => obj.is_active)
  return objects.length === 1
})

const unitOptions = computed(() => [
  { value: 0, label: '— выберите единицу —' },
  ...unitsStore.items.map((unit: Unit) => ({ value: unit.id, label: `${unit.name} (${unit.code})` }))
])

const responsibleOptions = ref([
  { value: 0, label: '— выберите ответственного —' }
])

// Computed для уже добавленных материалов (для исключения из подсказок)
const addedMaterialIds = computed(() => {
  return items.value
    .map(item => item.material)
    .filter((id): id is number => id !== null && id !== 0)
})

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
    if (key.startsWith('items[') && itemErrors[key]?.startsWith(DUPLICATE_MATERIAL_MESSAGE)) {
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
    
    let balance = parseFloat(data.current_balance || 0)
    // F-229: в edit-режиме /balance возвращает остаток, УЖЕ уменьшенный на собственный снапшот
    // этого списания, поэтому getFutureBalance вычитал бы количество ДВАЖДЫ. Возвращаем своё
    // количество обратно (только для отображения «текущий/будущий остаток»; сабмит не затрагивается).
    if (props.initial && item.material === props.initial.material) {
      balance += parseFloat(String(props.initial.quantity)) || 0
    }
    item.currentBalance = balance
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
    // FE-12: показываем ошибку, а не молча пустой список — иначе пользователь думает, что на
    // объекте нет материалов, тогда как это сбой загрузки.
    console.error('Error loading materials by object:', error)
    loadedMaterialsByObject.value = []
    ui.toast({ type: 'error', text: 'Не удалось загрузить материалы объекта. Проверьте соединение и повторите.' })
  } finally {
    materialsLoading.value = false
  }
}

const loadEmployeesByObject = async (objectId: number) => {
  employeesLoading.value = true
  try {
    // Для бригадира: он автоматически становится ответственным
    if (isLimitedAccess.value && currentUserId.value) {
      const currentUser = employeesStore.items.find((emp: any) => emp.id === currentUserId.value)
      const userName = currentUser 
        ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username
        : authStore.me?.username || 'Вы'
      responsibleOptions.value = [
        { 
          value: currentUserId.value, 
          label: userName
        }
      ]
      formData.value.responsible = currentUserId.value
      return
    }
    
    // Для других ролей: стандартная логика (используем централизованную функцию)
    const responsibleList = [
      { value: 0, label: '— выберите ответственного —' },
      ...getResponsibleEmployees()
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
    
    // Получаем всех сотрудников объекта, которые могут быть ответственными
    const objectEmployees = getByObject(objectId)
    const brigadiers = objectEmployees.filter((emp: any) => canBeResponsible(emp))

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
  // Ответственный будет установлен автоматически в loadEmployeesByObject
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

    // Единица ВСЕГДА следует за материалом (unit — производное поле, показывается/скрытый input,
    // пользователь его не выбирает). Прежний guard `&& !item.unit` оставлял единицу от ПРЕДЫДУЩЕГО
    // материала при смене материала → неверная единица/конвертация/баланс. Как в PurchaseForm.
    if (material.default_unit) {
      item.unit = material.default_unit
    } else {
      // FE-5/F-563: нет единицы по умолчанию → сбрасываем и предупреждаем (не оставляем unit=0
      // или единицу от прошлого материала молча — «на мобиле единица не подгружается»).
      item.unit = 0
      ui.toast({ type: 'error', text: `У материала «${material.name || ''}» не задана единица измерения — укажите её в карточке материала` })
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
    // FE-3/F-563: считаем только ЗАПОЛНЕННЫЕ позиции (материал+единица+кол-во>0). Плейсхолдерная
    // строка присутствует всегда, поэтому старый guard items.length===0 не срабатывал → при
    // отправке одних пустых строк фильтр давал [] → Promise.all([]) резолвился → тост «Списание
    // создано» ПРИ НУЛЕ созданных записей (ложный успех / потеря данных).
    const filledItems = items.value.filter(
      item => item.material && item.unit && parseFloat(String(item.quantity)) > 0,
    )
    if (filledItems.length === 0) {
      errors.value.non_field_errors = ['Добавьте хотя бы одну заполненную позицию (материал, единица, количество > 0)']
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
      itemErrors[`items[0].material`] = `${DUPLICATE_MATERIAL_MESSAGE}: ${duplicateName}`
      isSubmitting.value = false
      return
    }

    // F-261: responsible=0 (плейсхолдер «— выберите ответственного —») — не валидный User PK.
    // Для full-access пользователя автозаполнение может не сработать (объект без ответственного,
    // нет доступных бригадиров) → сервер вернёт 400. Ловим на клиенте с понятной ошибкой.
    if (!formData.value.responsible || Number(formData.value.responsible) <= 0) {
      errors.value.responsible = ['Выберите ответственного']
      isSubmitting.value = false
      return
    }

    // F-306: не отправляем списание больше доступного остатка — сразу подсказываем на клиенте.
    // Бэкенд всё равно проверяет (WriteOff.clean → 400); это UX-ограничение, не замена бэк-проверке.
    const overItems = items.value.filter(
      (item) => item.material && item.unit && parseFloat(String(item.quantity)) > 0 && getFutureBalance(item) < 0,
    )
    if (overItems.length > 0) {
      errors.value.non_field_errors = ['Нельзя списать больше остатка — исправьте позиции с отрицательным будущим остатком.']
      ui.toast({ type: 'error', text: 'Нельзя списать больше остатка' })
      isSubmitting.value = false
      return
    }

    if (props.initial) {
      // F-072: списание — это одна строка (объект+материал+кол-во). Раньше при
      // редактировании сохранялась ТОЛЬКО items[0], остальные позиции молча
      // терялись. Теперь: первую позицию обновляем как текущую запись, остальные
      // добавленные позиции создаём как новые списания — данные не теряются.
      const validItems = filledItems
      const first = validItems[0]
      if (first) {
        const updateData: WriteOffUpdateRequest = {
          date: formData.value.date,
          object: formData.value.object,
          material: first.material,
          unit: first.unit,
          quantity: first.quantity,
          responsible: formData.value.responsible,
          comment: formData.value.comment,
        }
        await writeOffsStore.update(props.initial.id, updateData)
      }
      const extraCreates = validItems.slice(1).map(item =>
        writeOffsStore.create({
          date: formData.value.date,
          object: formData.value.object,
          material: item.material!,
          unit: item.unit,
          quantity: item.quantity,
          responsible: formData.value.responsible,
          comment: formData.value.comment || '',
        } as WriteOffCreateRequest),
      )
      await Promise.all(extraCreates)
    } else {
      // Создание - создаем множественные WriteOff записи (только заполненные — FE-3)
      const createPromises = filledItems
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
    
    // Уведомление об успехе
    ui.toast({ 
      type: 'success', 
      text: props.initial ? 'Списание обновлено' : 'Списание создано' 
    })
    
    emit('success')
  } catch (error) {
    const errorResult = await handleFormError(error, 'списание')
    
    // Устанавливаем ошибки полей (включая вложенные)
    Object.keys(errorResult.fieldErrors).forEach(field => {
      const fieldError = errorResult.fieldErrors[field]
      if (field.startsWith('items[')) {
        // Ошибки для позиций списания
        itemErrors[field] = Array.isArray(fieldError) ? fieldError[0] : String(fieldError)
      } else if (field === 'non_field_errors') {
        // Обрабатываем общие ошибки (включая __all__)
        errors.value.non_field_errors = Array.isArray(fieldError) ? fieldError : [String(fieldError)]
      } else {
        // Обрабатываем обычные ошибки полей
        errors.value[field] = Array.isArray(fieldError) ? fieldError : [String(fieldError)]
      }
    })
    
    // Если есть общие ошибки, но они не были обработаны выше
    if (errorResult.fieldErrors.non_field_errors && !errors.value.non_field_errors) {
      const nonFieldErrors = errorResult.fieldErrors.non_field_errors
      errors.value.non_field_errors = Array.isArray(nonFieldErrors) ? nonFieldErrors : [String(nonFieldErrors)]
    }
    
    // Уведомление об ошибке
    ui.toast({ 
      type: 'error', 
      text: errorResult.detail || 'Ошибка при сохранении списания' 
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
    // Для бригадира сразу устанавливаем его как ответственного
    const defaultResponsible = isLimitedAccess.value && currentUserId.value ? currentUserId.value : 0
    
    // Если только один объект - выбираем его автоматически
    const objects = objectsStore.items as SiteObject[]
    const defaultObject = objects.length === 1 ? objects[0].id : 0
    
    formData.value = {
      date: new Date().toISOString().split('T')[0],
      object: defaultObject,
      responsible: defaultResponsible,
      comment: ''
    }
    items.value = []
    
    // Для бригадира сразу заполняем опции ответственного
    if (isLimitedAccess.value && currentUserId.value) {
      const currentUser = employeesStore.items.find((emp: any) => emp.id === currentUserId.value)
      const userName = currentUser 
        ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username
        : authStore.me?.username || 'Вы'
      responsibleOptions.value = [
        { 
          value: currentUserId.value, 
          label: userName
        }
      ]
    }
    
    // Если объект был автоматически выбран, загружаем его данные
    if (defaultObject) {
      await Promise.all([
        loadMaterialsByObject(defaultObject),
        loadEmployeesByObject(defaultObject)
      ])
      // Добавляем одну пустую позицию
      addItem()
    }
  }
  
  userModifiedFields.value = {
    responsible: isLimitedAccess.value // Для бригадира считаем, что поле уже заполнено
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
