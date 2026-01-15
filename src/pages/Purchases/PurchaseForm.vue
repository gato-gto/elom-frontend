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
        <div class=" rounded-lg">
          <div class="">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h2 class="text-lg font-semibold">{{ field.label }}</h2>
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
        <div class=" rounded-lg">
          <div class="">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h2 class="text-lg font-semibold">{{ field.label }}</h2>
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
        <div class=" ">
          <div class="">
            <div class="mb-4">
              <h2 class="text-lg font-semibold">{{ field.label }}</h2>
            </div>

            <!-- Desktop table view -->
            <div class="hidden md:block overflow-auto">
              <table class="table w-full">
                <thead>
                <tr>
                  <th style="min-width: 240px">Материал</th>
                  <th style="min-width: 120px">Ед.</th>
                  <th style="min-width: 120px">Количество</th>
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
                      :placeholder="isEdit ? '— выберите материал —' : '— выберите или введите материал —'"
                      size="sm"
                      :class="{ 'border-error': getItemFieldError(idx, 'material') }"
                      :is-success="!!(it.isNewMaterial && it.material_name && !getItemFieldError(idx, 'material'))"
                      :exclude-materials="addedMaterialIds.filter(id => id !== it.material)"
                      :allow-custom="!isEdit"
                      @change="onMaterialChange(it, $event)"
                      @custom-material="onCustomMaterial(it, $event)"
                      @input="onMaterialInput(it, $event)"
                    />
                      <div v-if="getItemFieldError(idx, 'material')" class="text-error text-xs mt-1">
                        {{ getItemFieldError(idx, 'material') }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <!-- Если материал выбран из списка - показываем единицу (disabled) -->
                      <!-- При редактировании всегда disabled -->
                      <div v-if="(it.material && !it.isNewMaterial) || isEdit" class="text-sm text-gray-600 p-2 bg-base-200 rounded border" :class="{ 'border-error bg-error/10': getItemFieldError(idx, 'unit') }">
                        {{ getUnitName(it.unit) || '—' }}
                      </div>
                      <!-- Если новый материал (или материал не выбран) и не редактирование - выпадающий список единиц -->
                      <select
                        v-else
                        v-model.number="it.unit"
                        class="select select-bordered select-sm w-full"
                        :class="[
                          { 'select-error': getItemFieldError(idx, 'unit') },
                          { 'select-success': it.isNewMaterial && it.material_name && it.unit && it.unit > 0 && !getItemFieldError(idx, 'unit') }
                        ]"
                        :disabled="!it.isNewMaterial && !isEdit"
                      >
                        <option :value="0">— выберите единицу —</option>
                        <option v-for="unit in units" :key="unit.id" :value="unit.id">
                          {{ unit.code }} ({{ unit.name }})
                        </option>
                      </select>
                      <input v-if="(it.material && !it.isNewMaterial) || isEdit" type="hidden" v-model.number="it.unit" />
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
              <div v-for="(it, idx) in items" :key="it._k" class="bg-base-200 rounded-lg">
                <div class="">
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
                        :placeholder="isEdit ? '— выберите материал —' : '— выберите или введите материал —'"
                        size="sm"
                        :class="{ 'border-error': getItemFieldError(idx, 'material') }"
                        :is-success="!!(it.isNewMaterial && it.material_name && !getItemFieldError(idx, 'material'))"
                        :exclude-materials="addedMaterialIds.filter(id => id !== it.material)"
                        :allow-custom="!isEdit"
                        @change="onMaterialChange(it, $event)"
                        @custom-material="onCustomMaterial(it, $event)"
                        @input="onMaterialInput(it, $event)"
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
                      <!-- Если материал выбран из списка - показываем единицу (disabled) -->
                      <!-- При редактировании всегда disabled -->
                      <div v-if="(it.material && !it.isNewMaterial) || isEdit" class="text-sm text-gray-600 p-2  rounded border bg-base-200" :class="{ 'border-error bg-error/10': getItemFieldError(idx, 'unit') }">
                        {{ getUnitName(it.unit) || '—' }}
                      </div>
                      <!-- Если новый материал (или материал не выбран) и не редактирование - выпадающий список единиц -->
                      <select
                        v-else
                        v-model.number="it.unit"
                        class="select select-bordered select-sm w-full"
                        :class="[
                          { 'select-error': getItemFieldError(idx, 'unit') },
                          { 'select-success': it.isNewMaterial && it.material_name && it.unit && it.unit > 0 && !getItemFieldError(idx, 'unit') }
                        ]"
                        :disabled="!it.isNewMaterial && !isEdit"
                      >
                        <option :value="0">— выберите единицу —</option>
                        <option v-for="unit in units" :key="unit.id" :value="unit.id">
                          {{ unit.code }} ({{ unit.name }})
                        </option>
                      </select>
                      <input v-if="(it.material && !it.isNewMaterial) || isEdit" type="hidden" v-model.number="it.unit" />
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
                      <div class="text-lg font-mono text-primary p-2  rounded border">
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

    <!-- Modal для подтверждения новых материалов -->
    <Modal v-model="confirmNewMaterialsModalOpen" title="Подтверждение создания новых материалов" size="lg" :closable="true">
      <div class="space-y-4">
        <div class="alert alert-warning">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Будут созданы следующие новые материалы:</span>
        </div>
        
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>Название</th>
                <th>Единица измерения</th>
                <th>Количество</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(material, idx) in newMaterialsToConfirm" :key="idx">
                <td>{{ material.name }}</td>
                <td>{{ material.unit }}</td>
                <td>{{ material.quantity }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="alert alert-info">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm">Материалы будут созданы автоматически с SKU формата AUTO-{uuid}</span>
        </div>
        
        <div class="flex justify-end gap-2">
          <button class="btn btn-ghost" @click="cancelNewMaterials">Отменить</button>
          <button class="btn btn-primary" @click="confirmNewMaterials">Подтвердить и создать</button>
        </div>
      </div>
    </Modal>
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
import Modal from '@/components/Modal.vue'
import type { Purchase, PurchaseRequest, PurchaseItemRequest, Employee, Material, PurchasePhoto } from '@/api/types'
import type { GenericFormConfig } from '@/types/generic'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useItemsForm } from '@/composables/useItemsForm'
import type { BaseItem } from '@/composables/useItemsForm'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'
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

const purchasesStore = usePurchasesStore()
const materialsStore = useMaterialsStore()
const unitsStore = useUnitsStore()
const objectsStore = useObjectsStore()
const employeesStore = useEmployeesStore()
const suppliersStore = useSuppliersStore()
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
// getItemFieldError теперь из useItemsForm composable

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
// clearItemsDuplicateErrors теперь из useItemsForm composable

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
  if (!purchaseId || Number.isNaN(purchaseId)) {
    ui.toast({ type: 'error', text: 'Невозможно загрузить фото: закупка не создана' })
    return
  }
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  formData.append('purchase', String(purchaseId))
  
  try {
    // Используем endpoint /purchase-photos/ (PurchasePhotoViewSet.create)
    // который правильно обрабатывает FormData с полями file, type, purchase
    const response = await api.post('/purchase-photos/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    console.log('Photo uploaded successfully:', response.data)
    return response.data
  } catch (error: any) {
    console.error('Error uploading photo:', error)
    console.error('Error response:', error?.response)
    console.error('Error response data:', error?.response?.data)
    
    // Более детальная обработка ошибок
    let errorMessage = 'Ошибка загрузки фото'
    if (error?.response?.data) {
      if (error.response.data.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response.data.file) {
        errorMessage = Array.isArray(error.response.data.file) 
          ? error.response.data.file[0] 
          : error.response.data.file
      } else if (error.response.data.type) {
        errorMessage = Array.isArray(error.response.data.type) 
          ? error.response.data.type[0] 
          : error.response.data.type
      } else if (error.response.data.purchase) {
        errorMessage = Array.isArray(error.response.data.purchase) 
          ? error.response.data.purchase[0] 
          : error.response.data.purchase
      } else if (typeof error.response.data === 'string') {
        errorMessage = error.response.data
      } else {
        // Показываем все ошибки валидации
        const errors = Object.entries(error.response.data)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value[0] : value}`)
          .join(', ')
        errorMessage = errors || errorMessage
      }
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    ui.toast({ type: 'error', text: errorMessage })
    throw error
  }
}

// Items management using composable
interface PurchaseItem extends BaseItem {
  material_name?: string
  price?: string
  amount: string
  total?: number
  isNewMaterial?: boolean
}

const {
  items,
  itemErrors,
  addItem: addItemBase,
  removeItem: removeItemBase,
  getItemFieldError,
  clearItemsDuplicateErrors,
  usedMaterialIds: addedMaterialIds
} = useItemsForm<PurchaseItem>({
  createNewItem: () => ({
    _k: Math.random().toString(36).substr(2, 9),
    material: undefined,
    material_name: undefined,
    unit: 0,
    quantity: '0',
    amount: '0',
    price: '0',
    total: 0,
    isNewMaterial: false
  }),
  recalculate: (item) => recalc(item)
})

// Photo management
const instructionPhotos = ref<File[]>([])
const reportPhotos = ref<File[]>([])
const instructionPhotosInput = ref<HTMLInputElement>()
const reportPhotosInput = ref<HTMLInputElement>()

// Existing photos from the purchase
const existingInstructionPhotos = ref<PurchasePhoto[]>([])
const existingReportPhotos = ref<PurchasePhoto[]>([])

// Modal для подтверждения новых материалов
const confirmNewMaterialsModalOpen = ref(false)
const newMaterialsToConfirm = ref<Array<{name: string, unit: string, quantity: string}>>([])
let newMaterialsConfirmResolve: ((value: boolean) => void) | null = null

// Computed properties for form options
const materials = computed(() => materialsStore.items)
const units = computed(() => unitsStore.items)
const objects = computed(() => objectsStore.items)
const employees = computed(() => employeesStore.items)
const suppliers = computed(() => suppliersStore.items)

const isRequester = computed(() => auth.me?.role === 'requester')

const objectOptions = computed(() => {
  // Для requester показываем только назначенные объекты
  if (isRequester.value) {
    const assignedIds = auth.me?.assigned_object_ids || []
    const list = objects.value.filter((obj: any) => assignedIds.includes(obj.id) && obj.is_active)
    return list.map((obj: any) => ({
      value: obj.id,
      label: obj.name
    }))
  }
  
  // Для остальных ролей: если у пользователя есть список назначенных объектов, показываем только их
  const assignedIds = auth.me?.assigned_object_ids || []
  const list = assignedIds.length > 0
    ? objects.value.filter((obj: any) => assignedIds.includes(obj.id) && obj.is_active)
    : objects.value.filter((obj: any) => obj.is_active)

  return list.map((obj: any) => ({
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
  // Получаем бригадиров и администраторов
  const brigadiers = employees.value.filter((emp: Employee) => (emp.role === 'brigadier' || emp.role === 'admin') && emp.is_active)
  
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
  title: isRequester.value
    ? (isEdit.value ? 'Редактировать заявку' : 'Новая заявка')
    : (isEdit.value ? 'Редактировать закупку' : 'Новая закупка'),

  subtitle: isRequester.value
    ? 'Создание заявки на материалы'
    : 'Управление закупками материалов и поставщиками',

  // ✅ важно: не "[]", иначе будет never[]
  sections: [] as any[],

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
    // responsible убран - устанавливается автоматически из объекта (бригадир объекта)
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

    // ✅ вместо ...(isRequester ? [] : [ ... ])
    {
      key: 'status',
      type: 'select',
      label: 'Статус',
      placeholder: '— выберите статус —',
      options: statusOptions,
      order: 7,
      width: 'half',
      condition: () => !isRequester.value
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
      width: 'full',
      rows: 1
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
      // поле видно всегда
    },
    {
      key: 'report_photos',
      type: 'custom',
      label: 'Фотоотчеты',
      help: 'Обязательные фото отчета при завершении закупки',
      order: 12,
      width: 'full',
      condition: () => isEdit.value && formData.value.status === 'completed'
    }
  ],

  submitText: 'Сохранить',
  cancelText: 'Отмена',
  showCancel: true,
  validateOnChange: true,
  resetOnSubmit: false

  // ✅ важно: mode удалить полностью
  // mode: isEdit.value ? 'edit' : 'create'
}))

// Initial data for form
const initialData = computed(() => {
  if (props.initial) {
    return {
      date: props.initial.date,
      object: props.initial.object,
      // responsible убран - устанавливается автоматически из объекта
      supplier: props.initial.supplier,
      invoice_number: props.initial.invoice_number || '',
      purchase_no: props.initial.purchase_no || '',
      status: isRequester.value ? 'new' : (props.initial.status || 'new'), // Для requester всегда 'new'
      currency: props.initial.currency || 'UZS',
      comment: props.initial.comment || '',
      items: props.initial.items || []
    }
  }
  return {
    date: new Date().toISOString().split('T')[0],
    object: 0,
    // responsible убран - устанавливается автоматически из объекта
    supplier: 0,
    invoice_number: '',
    purchase_no: '',
    status: 'new', // Для requester всегда 'new'
    currency: 'UZS',
    comment: '',
    items: []
  }
})

// ========== Вспомогательные функции для onSaved ==========

/**
 * Валидация позиций закупки
 * @returns Объект с ошибками валидации (пустой если ошибок нет)
 */
function validatePurchaseItems(): Record<string, string> {
  const validationErrors: Record<string, string> = {}
  
  items.value.forEach((item, idx) => {
    // Проверка материала
    if (!item.material && !item.material_name) {
      validationErrors[`items[${idx}].material`] = 'Материал обязателен'
    }
    
    // Если новый материал - проверяем единицу измерения
    if (item.isNewMaterial && item.material_name) {
      if (!item.unit || item.unit === 0) {
        validationErrors[`items[${idx}].unit`] = 'Единица измерения обязательна для нового материала'
      }
    }
    
    // Проверка количества
    const quantityValue = typeof item.quantity === 'string' ? item.quantity : String(item.quantity)
    if (!item.quantity || parseFloat(quantityValue) <= 0) {
      validationErrors[`items[${idx}].quantity`] = 'Количество должно быть больше 0'
    }
  })
  
  return validationErrors
}

/**
 * Подготовка данных закупки для отправки на сервер
 */
function preparePurchaseData(data: PurchaseRequest): PurchaseRequest {
  return {
    date: data.date,
    object: data.object,
    supplier: data.supplier,
    invoice_number: data.invoice_number,
    // Если purchase_no не задан или пустой - не передаём его, чтобы бэкенд сгенерировал автоматически
    ...(data.purchase_no?.trim() ? { purchase_no: data.purchase_no.trim() } : {}),
    status: data.status,
    currency: data.currency || 'UZS',
    comment: data.comment,
    items: items.value.map((item) => {
      const itemData: any = {
        unit: item.unit,
        quantity: item.quantity,
        amount: item.amount,
        price: item.price || '0'
      }
      
      // Если материал новый - передаём material_name, иначе material
      if (item.isNewMaterial && item.material_name) {
        itemData.material_name = item.material_name
      } else if (item.material) {
        itemData.material = item.material
      }
      
      return itemData
    })
  }
}

/**
 * Загрузка фотографий для закупки
 * @returns Количество успешно загруженных и неудачных фото
 */
async function uploadPhotos(
  purchaseId: number, 
  photos: File[], 
  type: 'instructions' | 'report'
): Promise<{ uploaded: number, failed: number }> {
  let uploadedCount = 0
  let failedCount = 0
  
  if (import.meta.env.DEV) {
    console.log(`Uploading ${type} photos:`, photos.length, 'photos for purchase', purchaseId)
  }
  
  for (const photo of photos) {
    try {
      await uploadPurchasePhoto(purchaseId, photo, type)
      uploadedCount++
      if (import.meta.env.DEV) {
        console.log(`Successfully uploaded ${type} photo:`, photo.name)
      }
    } catch (error) {
      failedCount++
      if (import.meta.env.DEV) {
        console.error(`Failed to upload ${type} photo:`, photo.name, error)
      }
    }
  }
  
  return { uploaded: uploadedCount, failed: failedCount }
}

/**
 * Создание или обновление закупки
 * @returns ID созданной или обновленной закупки
 */
async function createOrUpdatePurchase(purchaseData: PurchaseRequest): Promise<number> {
  let purchaseId: number
  
  if (isEdit.value) {
    // Режим редактирования
    purchaseId = props.initial?.id || Number(route.params.id)
    await purchasesStore.update(purchaseId, purchaseData)
    
    // Уведомление об изменении закупки
    notifications.notifyPurchaseEdit(purchaseId, auth.me?.username || 'Неизвестный пользователь')
  } else {
    // Режим создания
    const newPurchase = await purchasesStore.create(purchaseData)
    
    if (import.meta.env.DEV) {
      console.log('Created purchase response:', newPurchase)
    }
    
    purchaseId = newPurchase?.id
    
    // Проверяем, что ответ содержит id
    if (!purchaseId || Number.isNaN(purchaseId)) {
      if (import.meta.env.DEV) {
        console.error('Purchase ID not found in response:', newPurchase)
      }
      throw new Error('Failed to get purchase ID from API response')
    }
    
    if (import.meta.env.DEV) {
      console.log('Created purchase with ID:', purchaseId)
    }
  }
  
  return purchaseId
}

// ========== Основной обработчик отправки формы ==========

/**
 * Обработчик сохранения закупки
 */
async function onSaved(data: PurchaseRequest) {
  saving.value = true
  Object.keys(errors).forEach(key => delete errors[key])
  
  // Для requester автоматически устанавливаем status='new' и responsible
  if (isRequester.value) {
    data.status = 'new'
    // responsible устанавливается автоматически на backend из текущего пользователя
  }
  
  // 1. Валидация позиций
  const validationErrors = validatePurchaseItems()
  if (Object.keys(validationErrors).length > 0) {
    Object.assign(errors, validationErrors)
    saving.value = false
    ui.toast({ type: 'error', text: 'Пожалуйста, исправьте ошибки в позициях' })
    return
  }
  
  // 2. Проверка на новые материалы (только при создании, не при редактировании)
  if (!isEdit.value) {
    const newMaterials = items.value.filter(item => 
      item.isNewMaterial && item.material_name && item.material_name.trim()
    )
    
    if (newMaterials.length > 0) {
      // Показываем модальное окно подтверждения
      const confirmed = await showNewMaterialsConfirmModal(newMaterials)
      if (!confirmed) {
        saving.value = false
        return // Пользователь отменил
      }
    }
  }
  
  try {
    // 2. Подготовка данных
    const purchaseData = preparePurchaseData(data)
    
    // 3. Создание или обновление закупки
    const purchaseId = await createOrUpdatePurchase(purchaseData)
    
    // 4. Загрузка фотоинструкций
    if (instructionPhotos.value.length > 0) {
      const { uploaded, failed } = await uploadPhotos(purchaseId, instructionPhotos.value, 'instructions')
      
      if (uploaded > 0) {
        ui.toast({ 
          type: 'success', 
          text: `Загружено фотоинструкций: ${uploaded}${failed > 0 ? ` (не загружено: ${failed})` : ''}` 
        })
      }
      if (failed > 0 && uploaded === 0) {
        ui.toast({ type: 'error', text: `Не удалось загрузить фотоинструкции (${failed})` })
      }
    }
    
    // 5. Загрузка фотоотчетов (только при редактировании и статусе "completed")
    if (isEdit.value && data.status === 'completed' && reportPhotos.value.length > 0) {
      await uploadPhotos(purchaseId, reportPhotos.value, 'report')
    }
    
    // 6. Валидация фотоотчетов для завершенных закупок
    if (isEdit.value && data.status === 'completed' && reportPhotos.value.length === 0) {
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
        if (import.meta.env.DEV) {
          console.error('Error validating purchase:', error)
        }
      }
    }
    
    // 7. Успешное завершение
    ui.toast({ type: 'success', text: isEdit.value ? 'Закупка обновлена' : 'Закупка создана' })
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

// Items management - обертки над composable
function addItem() {
  addItemBase()
}

function removeItem(index: number) {
  removeItemBase(index)
}

function onMaterialChange(item: PurchaseItem, material: Material | null) {
  if (material) {
    // Материал выбран из списка
    item.material = material.id
    item.material_name = undefined
    item.isNewMaterial = false
    if (material.default_unit) {
      item.unit = material.default_unit
    }
  } else {
    // Материал сброшен
    item.material = undefined
    item.material_name = undefined
    item.isNewMaterial = false
    item.unit = 0
  }
  // Recalculate total when material changes
  recalc(item)
  
  // Очищаем ошибки дублирования материалов при изменении материала
  clearItemsDuplicateErrors()
}

function onCustomMaterial(item: PurchaseItem, materialName: string) {
  // При редактировании не разрешаем создавать новые материалы
  if (isEdit.value) {
    return
  }
  
  // Пользователь ввёл новый материал
  item.material = undefined
  item.material_name = materialName.trim()
  item.isNewMaterial = true
  item.unit = 0 // Сбрасываем единицу, пользователь должен выбрать
  
  // Очищаем ошибки
  clearItemsDuplicateErrors()
}

function onMaterialInput(item: PurchaseItem, query: string) {
  // При редактировании не обрабатываем ввод текста для создания новых материалов
  if (isEdit.value) {
    return
  }
  
  // Пользователь вводит текст - проверяем, есть ли точное совпадение
  const trimmedQuery = query.trim()
  
  if (trimmedQuery.length >= 2) {
    // Ищем точное совпадение (case-insensitive)
    const exactMatch = materials.value.find((m: Material) => 
      m.name.toLowerCase() === trimmedQuery.toLowerCase()
    )
    
    if (exactMatch) {
      // Найдено точное совпадение - автоматически выбираем материал
      item.material = exactMatch.id
      item.material_name = undefined
      item.isNewMaterial = false
      if (exactMatch.default_unit) {
        item.unit = exactMatch.default_unit
      }
      recalc(item)
    } else {
      // Точного совпадения нет - это потенциально новый материал
      // Но только если пользователь не выбрал материал из списка
      if (item.material && !item.isNewMaterial) {
        // Был выбран материал из списка, но теперь введён другой текст - сбрасываем
        item.material = undefined
        item.material_name = trimmedQuery
        item.isNewMaterial = true
        item.unit = 0 // Сбрасываем единицу для нового материала
      } else if (!item.material || item.isNewMaterial) {
        // Материал не был выбран ИЛИ уже был новый материал - обновляем название
        item.material_name = trimmedQuery
        item.isNewMaterial = true
        // Единицу не сбрасываем, если она уже выбрана пользователем
        // Но если единица не выбрана, оставляем 0
      }
    }
  } else if (trimmedQuery.length === 0) {
    // Поле очищено - сбрасываем всё
    item.material = undefined
    item.material_name = undefined
    item.isNewMaterial = false
    item.unit = 0
  }
}

function getUnitName(unitId: number) {
  const unit = units.value.find((u: any) => u.id === unitId)
  return unit ? unit.code : null
}

// Calculate total for an item
function recalc(item: PurchaseItem) {
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
        // Загружаем материалы из позиций закупки в store (включая неактивные)
        // Это нужно для того, чтобы MaterialSearchSelect мог их отобразить
        if (purchase.items && purchase.items.length > 0) {
          const materialIds = purchase.items
            .map(item => item.material)
            .filter((id): id is number => id !== null && id !== undefined)
          
          // Загружаем каждый материал по отдельности, чтобы получить даже неактивные
          for (const materialId of materialIds) {
            try {
              // Проверяем, есть ли материал уже в store
              const existingMaterial = materialsStore.items.find(m => m.id === materialId)
              if (!existingMaterial) {
                // Загружаем материал по ID (даже если он неактивен)
                const material = await materialsStore.fetchOne(materialId)
                // Убеждаемся, что материал добавлен в список items
                if (material && !materialsStore.items.find(m => m.id === materialId)) {
                  materialsStore.items.push(material)
                }
              }
            } catch (error) {
              console.warn(`Failed to load material ${materialId}:`, error)
              // Продолжаем загрузку других материалов
            }
          }
        }
        
        // Load items
        items.value = purchase.items?.map(item => {
          const newItem = {
          _k: Math.random().toString(36).substr(2, 9),
          material: item.material,
          material_name: undefined,
          unit: item.unit,
          quantity: item.quantity,
          amount: item.amount || '0',
          price: item.price || '0',
          total: 0,
          isNewMaterial: false // При редактировании все материалы уже существуют
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

// Функции для модального окна подтверждения новых материалов
function showNewMaterialsConfirmModal(materials: PurchaseItem[]): Promise<boolean> {
  return new Promise((resolve) => {
    newMaterialsToConfirm.value = materials.map(item => ({
      name: item.material_name || '',
      unit: getUnitName(item.unit) || '—',
      quantity: String(item.quantity)
    }))
    newMaterialsConfirmResolve = resolve
    confirmNewMaterialsModalOpen.value = true
  })
}

function confirmNewMaterials() {
  if (newMaterialsConfirmResolve) {
    newMaterialsConfirmResolve(true)
    newMaterialsConfirmResolve = null
  }
  confirmNewMaterialsModalOpen.value = false
}

function cancelNewMaterials() {
  if (newMaterialsConfirmResolve) {
    newMaterialsConfirmResolve(false)
    newMaterialsConfirmResolve = null
  }
  confirmNewMaterialsModalOpen.value = false
}

onMounted(() => {
  loadData()
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



textarea.textarea[rows="1"],textarea.textarea[rows="2"] {
    min-height: auto !important;
}
</style>