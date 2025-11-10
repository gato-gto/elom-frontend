<template>
  <div class="purchase-form">
    <!-- Generic Form -->
    <GenericForm
      :config="formConfig"
      :initial-data="initialData"
      :on-submit="onSaved"
      :on-cancel="handleCancel"
      :validate-on-change="true"
      :reset-on-submit="false"
      @field-change="onFieldChange"
    >
      <!-- Custom instruction photos field -->
      <template #field-instruction_photos="{ field, value, error, disabled }">
        <div class="card bg-base-100 border">
          <div class="card-body">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h2 class="card-title text-lg">{{ field.label }}</h2>
                <p v-if="field.help" class="text-sm text-base-content/70">{{ field.help }}</p>
              </div>
              <input
                type="file"
                ref="instructionPhotosInput"
                multiple
                accept="image/*"
                class="file-input file-input-bordered file-input-sm w-full sm:w-auto"
                @change="onInstructionPhotosChange"
                :disabled="disabled"
              />
            </div>

            <!-- Existing photos -->
            <div v-if="existingInstructionPhotos.length > 0" class="mb-4">
              <h4 class="text-sm font-medium text-base-content/70 mb-2">Существующие фотоинструкции:</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div v-for="photo in existingInstructionPhotos" :key="photo.id" class="relative">
                  <img
                    :src="photo.url"
                    :alt="`Фотоинструкция ${photo.id}`"
                    class="w-full h-24 object-cover rounded-lg border"
                  />
                  <div class="absolute top-1 right-1">
                    <span class="badge badge-xs badge-info">Существующее</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- New photo previews -->
            <div v-if="instructionPhotos.length > 0" class="mb-4">
              <h4 class="text-sm font-medium text-base-content/70 mb-2">Новые фотоинструкции:</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div v-for="(photo, index) in instructionPhotos" :key="index" class="relative">
                  <img
                    :src="getPhotoPreview(photo)"
                    :alt="`Фотоинструкция ${index + 1}`"
                    class="w-full h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    class="absolute -top-2 -right-2 btn btn-error btn-xs btn-circle"
                    @click="removeInstructionPhoto(index)"
                    :disabled="disabled"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="existingInstructionPhotos.length === 0 && instructionPhotos.length === 0" class="text-center py-8 text-base-content/50">
              <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <p>Фотоинструкции не загружены</p>
            </div>
          </div>
        </div>
      </template>

      <!-- Custom report photos field -->
      <template #field-report_photos="{ field, value, error, disabled }">
        <div class="card bg-base-100 border">
          <div class="card-body">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h2 class="card-title text-lg">{{ field.label }}</h2>
                <p v-if="field.help" class="text-sm text-base-content/70">{{ field.help }}</p>
                <div class="alert alert-info mt-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="text-sm">Для завершенных закупок обязательны фотоотчеты</span>
                </div>
              </div>
              <input
                type="file"
                ref="reportPhotosInput"
                multiple
                accept="image/*"
                class="file-input file-input-bordered file-input-sm w-full sm:w-auto"
                @change="onReportPhotosChange"
                :disabled="disabled"
              />
            </div>

            <!-- Existing photos -->
            <div v-if="existingReportPhotos.length > 0" class="mb-4">
              <h4 class="text-sm font-medium text-base-content/70 mb-2">Существующие фотоотчеты:</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div v-for="photo in existingReportPhotos" :key="photo.id" class="relative">
                  <img
                    :src="photo.url"
                    :alt="`Фотоотчет ${photo.id}`"
                    class="w-full h-24 object-cover rounded-lg border"
                  />
                  <div class="absolute top-1 right-1">
                    <span class="badge badge-xs badge-success">Существующий</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- New photo previews -->
            <div v-if="reportPhotos.length > 0" class="mb-4">
              <h4 class="text-sm font-medium text-base-content/70 mb-2">Новые фотоотчеты:</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div v-for="(photo, index) in reportPhotos" :key="index" class="relative">
                  <img
                    :src="getPhotoPreview(photo)"
                    :alt="`Фотоотчет ${index + 1}`"
                    class="w-full h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    class="absolute top-2 right-2 btn btn-error btn-xs btn-circle"
                    @click="removeReportPhoto(index)"
                    :disabled="disabled"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="existingReportPhotos.length === 0 && reportPhotos.length === 0" class="text-center py-8 text-base-content/50">
              <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <p>Фотоотчеты не загружены</p>
            </div>
          </div>
        </div>
      </template>

      <!-- Custom items field -->
      <template #field-items="{ field, value, error, disabled }">
        <div class="card bg-base-100 border">
          <div class="card-body">
            <div class="mb-4">
              <h2 class="card-title text-lg">{{ field.label }}</h2>
            </div>

            <!-- Desktop table view -->
            <div class="hidden md:block overflow-auto">
              <table class="table w-full">
                <thead>
                <tr>
                  <th style="min-width: 240px">Материал</th>
                  <th style="min-width: 120px">Ед.</th>
                  <th style="min-width: 120px">Кол-во</th>
                  <th style="min-width: 120px">Цена</th>
                  <th class="text-right" style="min-width: 120px">Сумма</th>
                  <th class="text-right" style="min-width: 80px">Действия</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(it, idx) in items" :key="it._k">
                  <td>
                    <div>
                    <MaterialSearchSelect
                      v-model="it.material"
                      placeholder="— выберите материал —"
                      size="sm"
                        :class="{ 'border-error': getItemFieldError(idx, 'material') }"
                      @change="onMaterialChange(it, $event)"
                    />
                      <div v-if="getItemFieldError(idx, 'material')" class="text-error text-xs mt-1">
                        {{ getItemFieldError(idx, 'material') }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div class="text-sm text-gray-600 p-2" :class="{ 'border-error bg-error/10': getItemFieldError(idx, 'unit') }">
                      {{ getUnitName(it.unit) || '—' }}
                    </div>
                    <input type="hidden" v-model.number="it.unit" />
                      <div v-if="getItemFieldError(idx, 'unit')" class="text-error text-xs mt-1">
                        {{ getItemFieldError(idx, 'unit') }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <input 
                        v-model="it.quantity" 
                        type="number" 
                        step="0.001" 
                        min="0" 
                        class="input input-bordered input-sm w-full"
                        :class="{ 'input-error': getItemFieldError(idx, 'quantity') }"
                        @input="recalc(it)"
                      />
                      <div v-if="getItemFieldError(idx, 'quantity')" class="text-error text-xs mt-1">
                        {{ getItemFieldError(idx, 'quantity') }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <input 
                        v-model="it.price" 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        class="input input-bordered input-sm w-full"
                        :class="{ 'input-error': getItemFieldError(idx, 'price') }"
                        @input="recalc(it)"
                      />
                      <div v-if="getItemFieldError(idx, 'price')" class="text-error text-xs mt-1">
                        {{ getItemFieldError(idx, 'price') }}
                      </div>
                    </div>
                  </td>
                  <td class="text-right font-mono">{{ formatMoney(it.total) }}</td>
                  <td class="text-right">
                    <button type="button" class="btn btn-error btn-xs" @click="removeItem(idx)">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
                </tbody>
                <tfoot>
                <tr class="font-bold">
                  <td colspan="4" class="text-right">Итого:</td>
                  <td class="text-right font-mono">{{ formatMoney(total) }}</td>
                  <td></td>
                </tr>
                </tfoot>
              </table>
            </div>

            <!-- Mobile card view -->
            <div class="md:hidden space-y-4">
              <div v-for="(it, idx) in items" :key="it._k" class="card bg-base-200 border">
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
                        v-model="it.material"
                        placeholder="— выберите материал —"
                        size="sm"
                        :class="{ 'border-error': getItemFieldError(idx, 'material') }"
                        @change="onMaterialChange(it, $event)"
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
                        {{ getUnitName(it.unit) || '—' }}
                      </div>
                      <input type="hidden" v-model.number="it.unit" />
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
                        v-model="it.quantity" 
                        type="number" 
                        step="0.001" 
                        min="0" 
                        class="input input-bordered input-sm w-full"
                        :class="{ 'input-error': getItemFieldError(idx, 'quantity') }"
                        placeholder="0.000"
                        @input="recalc(it)"
                      />
                      <div v-if="getItemFieldError(idx, 'quantity')" class="text-error text-xs mt-1">
                        {{ getItemFieldError(idx, 'quantity') }}
                      </div>
                    </div>
                    
                    <!-- Цена -->
                    <div>
                      <label class="label">
                        <span class="label-text text-xs">Цена за единицу</span>
                      </label>
                      <input 
                        v-model="it.price" 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        class="input input-bordered input-sm w-full"
                        :class="{ 'input-error': getItemFieldError(idx, 'price') }"
                        placeholder="0.00"
                        @input="recalc(it)"
                      />
                      <div v-if="getItemFieldError(idx, 'price')" class="text-error text-xs mt-1">
                        {{ getItemFieldError(idx, 'price') }}
                      </div>
                    </div>
                    
                    <!-- Сумма -->
                    <div>
                      <label class="label">
                        <span class="label-text text-xs">Сумма</span>
                      </label>
                      <div class="text-lg font-mono text-primary p-2 bg-base-100 rounded border">
                        {{ formatMoney(it.total) }}
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
                :disabled="disabled"
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

            <div v-if="error" class="label">
              <span class="label-text-alt text-error">{{ error }}</span>
            </div>
          </div>
        </div>
      </template>
    </GenericForm>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePurchasesStore } from '@/stores/purchases'
import { useMaterialsStore } from '@/stores/materials'
import { useUnitsStore } from '@/stores/units'
import { useObjectsStore } from '@/stores/objects'
import { useEmployeesStore } from '@/stores/employees'
import { useSuppliersStore } from '@/stores/suppliers'
import { useUiStore } from '@/stores/ui'
import { useNotificationsStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'
import MaterialSearchSelect from '@/components/MaterialSearchSelect.vue'
import GenericForm from '@/components/GenericForm.vue'
import type { Purchase, PurchaseRequest, PurchaseItemRequest, Employee, Material, PurchasePhoto } from '@/api/types'
import type { GenericFormConfig } from '@/types/generic'
import { useErrorHandler } from '@/composables/useErrorHandler'
import api from '@/api/client'
import { calculateItemAmount, calculatePurchaseTotal, formatCurrency } from '@/utils/calculations'

// Props
const props = defineProps<{
  initial?: Purchase | null
}>()

// Emits
const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const router = useRouter()
const route = useRoute()

const purchasesStore = usePurchasesStore
const materialsStore = useMaterialsStore
const unitsStore = useUnitsStore
const objectsStore = useObjectsStore
const employeesStore = useEmployeesStore
const suppliersStore = useSuppliersStore
const ui = useUiStore()
const notifications = useNotificationsStore()
const auth = useAuthStore()
const { handleFormError, errors: formErrors, clearErrors } = useErrorHandler()

const saving = ref(false)
const errors = reactive<Record<string, string>>({})

const isEdit = computed(() => !!props.initial || !!route.params.id)

// Form data for tracking status changes
const formData = ref({
  status: 'new'
})

// Function to get item field error
function getItemFieldError(itemIndex: number, fieldName: string): string {
  const errorKey = `items[${itemIndex}].${fieldName}`
  return errors[errorKey] || ''
}

// Function to get general items error (like duplicate materials)
function getItemsGeneralError(): string {
  // Ищем ошибки дублирования материалов в любой позиции
  for (const [key, value] of Object.entries(errors)) {
    if (key.startsWith('items[') && typeof value === 'string' && value.includes('Нельзя добавлять один материал несколько раз')) {
      return value
    }
  }
  return ''
}

// Function to clear duplicate material errors
function clearItemsDuplicateErrors() {
  // Удаляем все ошибки дублирования материалов
  Object.keys(errors).forEach(key => {
    if (key.startsWith('items[') && errors[key] && errors[key].includes('Нельзя добавлять один материал несколько раз')) {
      delete errors[key]
    }
  })
}

// Photo management functions
function getPhotoPreview(file: File): string {
  return URL.createObjectURL(file)
}

function onInstructionPhotosChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    const newPhotos = Array.from(target.files)
    instructionPhotos.value.push(...newPhotos)
  }
  // Очищаем input для возможности повторной загрузки тех же файлов
  target.value = ''
}

function removeInstructionPhoto(index: number) {
  instructionPhotos.value.splice(index, 1)
}

function onReportPhotosChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    const newPhotos = Array.from(target.files)
    reportPhotos.value.push(...newPhotos)
  }
  // Очищаем input для возможности повторной загрузки тех же файлов
  target.value = ''
}

function removeReportPhoto(index: number) {
  reportPhotos.value.splice(index, 1)
}

// Upload purchase photo
async function uploadPurchasePhoto(purchaseId: number, file: File, type: 'instructions' | 'report') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  formData.append('purchase', purchaseId.toString())
  
  try {
    const response = await api.post('/purchase-photos/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  } catch (error) {
    console.error('Error uploading photo:', error)
    throw error
  }
}

// Items management
const items = ref<Array<PurchaseItemRequest & { _k: string, quantity: string, amount: string, price?: string, total?: number }>>([])

// Photo management
const instructionPhotos = ref<File[]>([])
const reportPhotos = ref<File[]>([])
const instructionPhotosInput = ref<HTMLInputElement>()
const reportPhotosInput = ref<HTMLInputElement>()

// Existing photos from the purchase
const existingInstructionPhotos = ref<PurchasePhoto[]>([])
const existingReportPhotos = ref<PurchasePhoto[]>([])

// Computed properties for form options
const materials = computed(() => materialsStore.items)
const units = computed(() => unitsStore.items)
const objects = computed(() => objectsStore.items)
const employees = computed(() => employeesStore.items)
const suppliers = computed(() => suppliersStore.items)

const objectOptions = computed(() => {
  // Фильтруем объекты по текущему пользователю
  const userObjects = objects.value.filter((obj: any) => {
    // Если у объекта есть ответственный, проверяем совпадение с текущим пользователем
    if (obj.responsible && auth.me) {
      return obj.responsible === auth.me.id
    }
    // Если у объекта нет ответственного, показываем всем
    return true
  })
  
  return userObjects.map((obj: any) => ({ 
    value: obj.id, 
    label: obj.name 
  }))
})

const supplierOptions = computed(() => 
  suppliers.value
    .filter((supplier: any) => supplier.is_active)
    .map((supplier: any) => ({ value: supplier.id, label: supplier.name }))
)

const employeeOptions = computed(() => {
  // Получаем только бригадиров
  const brigadiers = employees.value.filter((emp: Employee) => emp.role === 'brigadier' && emp.is_active)
  
  // Добавляем текущего пользователя, если он не бригадир
  if (auth.me && auth.me.role !== 'brigadier') {
    const currentUser = {
      id: auth.me.id,
      first_name: auth.me.first_name,
      last_name: auth.me.last_name,
      username: auth.me.username,
      role: auth.me.role,
      is_active: true
    } as Employee
    
    // Проверяем, что текущий пользователь еще не в списке
    const isAlreadyInList = brigadiers.some((emp: any) => emp.id === auth.me!.id)
    if (!isAlreadyInList) {
      brigadiers.unshift(currentUser)
    }
  }
  
  // Сортируем так, чтобы текущий пользователь был первым
  const sortedEmployees = brigadiers.sort((a, b) => {
    if (auth.me && a.id === auth.me.id) {return -1}
    if (auth.me && b.id === auth.me.id) {return 1}
    return 0
  })
  
  return sortedEmployees.map((emp: Employee) => ({ 
    value: emp.id, 
    label: `${emp.first_name || emp.username} ${emp.last_name || ''}`.trim()
  }))
})

const statusOptions = [
  { value: 'new', label: 'Новая' },
  { value: 'completed', label: 'Выполнено' },
  { value: 'cancelled', label: 'Отмена' }
]

// GenericForm configuration
const formConfig = computed<GenericFormConfig<PurchaseRequest>>(() => ({
  title: isEdit.value ? 'Редактировать закупку' : 'Новая закупка',
  subtitle: 'Управление закупками материалов и поставщиками',
  sections: [  ],
  fields: [
    {
      key: 'date',
      type: 'date',
      label: 'Дата',
      required: true,
      order: 1,
      width: 'half'
    },
    {
      key: 'object',
      type: 'select',
      label: 'Объект',
      placeholder: 'Выберите объект',
      required: true,
      options: objectOptions.value,
      order: 2,
      width: 'half'
    },
    {
      key: 'responsible',
      type: 'select',
      label: 'Ответственный',
      placeholder: 'Не указан',
      options: employeeOptions.value,
      order: 3,
      width: 'half'
    },
    {
      key: 'supplier',
      type: 'select',
      label: 'Поставщик',
      placeholder: '— выберите поставщика —',
      options: supplierOptions.value,
      required: true,
      order: 4,
      width: 'half'
    },
    {
      key: 'invoice_number',
      type: 'input',
      label: '№ накладной/чека',
      placeholder: 'A-12345',
      order: 5,
      width: 'half'
    },
    {
      key: 'purchase_no',
      type: 'input',
      label: '№ закупки',
      placeholder: 'P0001',
      order: 6,
      width: 'half'
    },
    {
      key: 'status',
      type: 'select',
      label: 'Статус',
      placeholder: '— выберите статус —',
      options: statusOptions,
      order: 7,
      width: 'half'
    },
    {
      key: 'currency',
      type: 'select',
      label: 'Валюта',
      placeholder: '— выберите валюту —',
      options: [{ value: 'UZS', label: 'UZS (Узбекский сум)' }],
      required: true,
      order: 8,
      width: 'half'
    },
    {
      key: 'comment',
      type: 'textarea',
      label: 'Комментарий',
      order: 9,
      width: 'full'
    },
    {
      key: 'items',
          type: 'custom',
      label: 'Позиции',
      required: true,
          order: 10,
          width: 'full'
        },
        {
          key: 'instruction_photos',
          type: 'custom',
          label: 'Фотоинструкции',
          help: 'Необязательные фото с инструкциями по закупке',
          order: 11,
      width: 'full'
          // Убрали condition - поле видно всегда
        },
        {
          key: 'report_photos',
          type: 'custom',
          label: 'Фотоотчеты',
          help: 'Обязательные фото отчета при завершении закупки',
          order: 12,
          width: 'full',
          condition: () => isEdit.value && formData.value.status === 'completed' // Показывать только при редактировании и статусе "Выполнено"
    }
  ],
  submitText: 'Сохранить',
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
      responsible: props.initial.responsible,
      supplier: props.initial.supplier,
      invoice_number: props.initial.invoice_number || '',
      purchase_no: props.initial.purchase_no || '',
      status: props.initial.status || 'new',
      currency: props.initial.currency || 'UZS',
      comment: props.initial.comment || '',
      items: props.initial.items || []
    }
  }
  return {
    date: new Date().toISOString().split('T')[0],
    object: 0,
    responsible: auth.me?.id || 0, // По умолчанию текущий пользователь
    supplier: 0,
    invoice_number: '',
    purchase_no: '',
    status: 'new',
    currency: 'UZS',
    comment: '',
    items: []
  }
})

// Form submission handler
async function onSaved(data: PurchaseRequest) {
  saving.value = true
  Object.keys(errors).forEach(key => delete errors[key])
  
  try {
    // Prepare purchase data
    const purchaseData: PurchaseRequest = {
      date: data.date,
      object: data.object,
      responsible: data.responsible,
      supplier: data.supplier,
      invoice_number: data.invoice_number,
      purchase_no: data.purchase_no,
      status: data.status,
      currency: data.currency || 'UZS',
      comment: data.comment,
      items: items.value.map((item: PurchaseItemRequest & { _k: string, quantity: string, amount: string, price?: string, total?: number }) => ({
        material: item.material,
        unit: item.unit,
        quantity: item.quantity,
        amount: item.amount,
        price: item.price || '0'
      }))
    }
    
    let purchaseId: number
    
    if (isEdit.value) {
      if (props.initial) {
        purchaseId = props.initial.id
      } else {
        purchaseId = Number(route.params.id)
      }
      await purchasesStore.update(purchaseId, purchaseData)
      
      // Уведомление об изменении закупки
      notifications.notifyPurchaseEdit(purchaseId, auth.me?.username || 'Неизвестный пользователь')
    } else {
      const newPurchase = await purchasesStore.create(purchaseData)
      purchaseId = newPurchase.id
    }
    
    // Загружаем фотоинструкции если есть (всегда)
    if (instructionPhotos.value.length > 0) {
      for (const photo of instructionPhotos.value) {
        await uploadPurchasePhoto(purchaseId, photo, 'instructions')
      }
    }
    
    // Загружаем фотоотчеты если есть (только при редактировании и статусе "completed")
    if (isEdit.value && data.status === 'completed' && reportPhotos.value.length > 0) {
      for (const photo of reportPhotos.value) {
        await uploadPurchasePhoto(purchaseId, photo, 'report')
      }
    }
    
    // Валидация: если статус "completed", должны быть фотоотчеты (только при редактировании)
    if (isEdit.value && data.status === 'completed' && reportPhotos.value.length === 0) {
      // Проверяем, есть ли уже загруженные фотоотчеты
      try {
        const validationResponse = await api.get(`/purchases/${purchaseId}/validate/`)
        if (validationResponse.data.report_photos_count === 0) {
          ui.toast({ 
            type: 'error', 
            text: 'Для завершенных закупок обязательны фотоотчеты' 
          })
          return
        }
      } catch (error) {
        console.error('Error validating purchase:', error)
      }
    }
    
    ui.toast({ type: 'success', text: 'Закупка сохранена' })
    emit('saved')
  } catch (error: any) {
    const errorResult = await handleFormError(error, 'закупка')
    
    // Устанавливаем ошибки полей (включая вложенные)
    Object.keys(errorResult.fieldErrors).forEach(field => {
      const fieldError = errorResult.fieldErrors[field]
      errors[field] = Array.isArray(fieldError) ? fieldError[0] : fieldError
    })
    
    // Если есть общая ошибка (например, 403), показываем её отдельно
    if (errorResult.detail && Object.keys(errorResult.fieldErrors).length === 0) {
      ui.toast({ type: 'error', text: errorResult.detail })
    }
    
    // Уведомление об ошибке
    notifications.notifyPurchaseError(
      isEdit.value ? Number(route.params.id) : 0, 
      errorResult.detail
    )
    
    // Пробрасываем ошибку, чтобы GenericForm мог её обработать и показать в полях
    throw error
  } finally {
    saving.value = false
  }
}

// Items management
function addItem() {
  const newItem = {
    _k: Math.random().toString(36).substr(2, 9),
    material: 0,
    unit: 0,
    quantity: '0',
    amount: '0',
    price: '0',
    total: 0
  }
  items.value.push(newItem)
  recalc(newItem) // Calculate initial values
  
  // Очищаем ошибки дублирования материалов при добавлении новой позиции
  clearItemsDuplicateErrors()
}

function removeItem(index: number) {
  items.value.splice(index, 1)
  
  // Очищаем ошибки дублирования материалов при удалении позиции
  clearItemsDuplicateErrors()
}

function onMaterialChange(item: PurchaseItemRequest & { _k: string, quantity: string, amount: string, price?: string, total?: number }, material: Material | null) {
  if (material?.default_unit) {
    item.unit = material.default_unit
  }
  // Recalculate total when material changes
  recalc(item)
  
  // Очищаем ошибки дублирования материалов при изменении материала
  clearItemsDuplicateErrors()
}

function getUnitName(unitId: number) {
  const unit = units.value.find((u: any) => u.id === unitId)
  return unit ? unit.code : null
}

// Calculate total for an item
function recalc(item: PurchaseItemRequest & { _k: string, quantity: string, amount: string, price?: string, total?: number }) {
  const total = calculateItemAmount(item.quantity, item.price || '0')
  
  item.total = total
  item.amount = total.toFixed(2)
}

// Format money for display
function formatMoney(amount: number | string | undefined): string {
  if (!amount) {return '0.00'}
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return num.toLocaleString('ru-RU', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })
}

// Calculate total for all items
const total = computed(() => {
  return calculatePurchaseTotal(items.value.map(item => ({
    quantity: item.quantity,
    price: item.price || '0'
  })))
})

function handleCancel() {
  emit('cancel')
}

// Handle status change
function onStatusChange(newStatus: string) {
  formData.value.status = newStatus
}

// Handle field changes
function onFieldChange(key: string, value: any) {
  if (key === 'status') {
    onStatusChange(value)
  }
}

// Load data on mount
async function loadData() {
  // Load reference data
  await Promise.all([
    materialsStore.fetchList(),
    unitsStore.fetchList(),
    objectsStore.fetchList(),
    employeesStore.fetchList(),
    suppliersStore.fetchList()
  ])
  
  // Load purchase data if editing
  if (isEdit.value) {
    try {
      let purchase: Purchase | null = null
      
      if (props.initial) {
        // Use provided initial data
        purchase = props.initial
      } else if (route.params.id) {
        // Load from API
        purchase = await purchasesStore.fetchOne(Number(route.params.id))
      }
      
      if (purchase) {
        // Load items
        items.value = purchase.items?.map(item => {
          const newItem = {
          _k: Math.random().toString(36).substr(2, 9),
          material: item.material,
          unit: item.unit,
          quantity: item.quantity,
          amount: item.amount || '0',
          price: item.price || '0',
          total: 0
          }
          // Calculate total for loaded items
          recalc(newItem)
          return newItem
        }) || []
        
        // Load existing photos
        if (purchase.photos && purchase.photos.length > 0) {
          // Separate photos by type
          const instructionPhotos = purchase.photos.filter(photo => photo.type === 'instructions')
          const reportPhotos = purchase.photos.filter(photo => photo.type === 'report')
          
          // Store existing photos for display
          existingInstructionPhotos.value = instructionPhotos
          existingReportPhotos.value = reportPhotos
        }
      }
    } catch (error) {
      ui.toast({ type: 'error', text: 'Ошибка загрузки закупки' })
      // Error handling is done by ErrorHandlers
    }
  } else {
    // Add initial item for new purchase
    addItem()
  }
}

onMounted(() => {
  loadData()
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

/* Улучшения для touch-устройств */
@media (hover: none) and (pointer: coarse) {
  .btn {
    min-height: 3rem;
    padding: 0.75rem 1rem;
  }
  
  .input {
    min-height: 3rem;
    padding: 0.75rem;
  }
  
  .btn-xs {
    min-height: 2rem;
    padding: 0.5rem;
  }
}
</style>