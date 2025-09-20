<template>
  <form class="grid gap-4" @submit.prevent="onSubmit">

    <!-- Шапка -->
    <div class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Основная информация</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Дата -->
          <FormField
            v-model="model.date"
            label="Дата"
            type="date"
            :error="errors.date"
            required
          />

          <!-- Объект -->
          <FormField
            v-model="model.object"
            label="Объект"
            type="select"
            :error="errors.object"
            placeholder="Выберите объект"
            :options="objectOptions"
            required
          />

          <!-- Ответственный -->
          <FormField
            v-model="model.responsible"
            label="Ответственный"
            type="select"
            :error="errors.responsible"
            placeholder="Не указан"
            :options="employeeOptions"
          />

          <!-- Поставщик -->
          <FormField
            v-model="model.supplier"
            label="Поставщик"
            type="text"
            placeholder="ИП Иванов"
            :error="errors.supplier"
          />

          <!-- Номер накладной -->
          <FormField
            v-model="model.invoice_number"
            label="№ накладной/чека"
            type="text"
            placeholder="A-12345"
            :error="errors.invoice_number"
          />

          <!-- Номер закупки -->
          <FormField
            v-model="model.purchase_no"
            label="№ закупки"
            type="text"
            placeholder="P0001"
            :error="errors.purchase_no"
          />

          <!-- НДС -->
          <FormField
            v-model="model.vat_included"
            label="НДС включён?"
            type="select"
            :error="errors.vat_included"
            placeholder="Не указано"
            :options="vatOptions"
          />

          <!-- Комментарий -->
          <div class="md:col-span-2">
            <FormField
              v-model="model.comment"
              label="Комментарий"
              type="textarea"
              :rows="2"
              :error="errors.comment"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Позиции -->
    <div class="card bg-base-100 border">
      <div class="card-body">
        <div class="flex items-center justify-between mb-4">
          <h2 class="card-title text-lg">Позиции</h2>
          <button class="btn btn-sm btn-primary" @click="addItem">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Добавить позицию
          </button>
        </div>

        <div class="overflow-auto">
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
                <select v-model.number="it.material" class="select select-bordered select-sm w-full" @change="onMaterialChange(it)">
                  <option :value="undefined" disabled>— выберите —</option>
                  <option v-for="m in materials" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
              </td>
              <td>
                <div class="text-sm text-gray-600 p-2">
                  {{ getUnitName(it.unit) || '—' }}
                </div>
                <input type="hidden" v-model.number="it.unit" />
              </td>
              <td>
                <input v-model="it.quantity" type="number" step="0.001" min="0" class="input input-bordered input-sm w-full" @input="recalc(it)"/>
              </td>
              <td>
                <input v-model="it.price" type="number" step="0.01" min="0" class="input input-bordered input-sm w-full" @input="recalc(it)"/>
              </td>
              <td class="text-right font-mono">{{ formatMoney(it.total) }}</td>
              <td class="text-right">
                <button class="btn btn-error btn-xs" @click="removeItem(idx)">
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
      </div>
    </div>

    <!-- Фото документов -->
    <div class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Фото документов</h2>
        
        <!-- Current photos -->
        <div v-if="currentPhotos.length > 0" class="mb-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="(photo, idx) in currentPhotos" :key="idx" class="relative">
              <img 
                :src="photo" 
                alt="Документ" 
                class="h-24 w-full object-cover rounded-lg border"
              />
              <button 
                type="button" 
                class="absolute -top-2 -right-2 btn btn-error btn-xs btn-circle"
                :disabled="deletingPhoto" 
                @click="onDeletePhoto(idx)"
                title="Удалить фото"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <p class="text-xs text-base-content-60 mt-2">Текущие фото документов</p>
        </div>
        
        <!-- File input -->
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          class="file-input file-input-bordered w-full"
          @change="onPhotoChange"
          :disabled="deletingPhoto"
        />
      </div>
    </div>

    <!-- Кнопки действий -->
    <div class="flex justify-end gap-2">
      <button 
        type="button" 
        class="btn btn-outline" 
        @click="$emit('cancel')"
        :disabled="saving"
      >
        Отмена
      </button>
      <button 
        type="button" 
        class="btn btn-primary" 
        :disabled="saving" 
        @click="onSubmit"
      >
        <svg v-if="saving" class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        {{ saving ? 'Сохранение...' : 'Сохранить' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePurchasesStore } from '@/stores/purchases'
import { useMaterialsStore } from '@/stores/materials'
import { useUnitsStore } from '@/stores/units'
import { useObjectsStore } from '@/stores/objects'
import { useEmployeesStore } from '@/stores/employees'
import { useUiStore } from '@/stores/ui'
import { useNotificationsStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'

// Props
const props = defineProps<{
  initial?: Purchase | null
}>()

// Emits
const emit = defineEmits<{
  saved: []
  cancel: []
}>()
import type { Purchase, PurchaseRequest, PurchaseItemRequest, Employee } from '@/api/types'
import FormField from '@/components/FormField.vue'
import { ErrorHandlers } from '@/utils/errorHandler'

const router = useRouter()
const route = useRoute()


const purchasesStore = usePurchasesStore()
const materialsStore = useMaterialsStore()
const unitsStore = useUnitsStore()
const objectsStore = useObjectsStore()
const employeesStore = useEmployeesStore()
const ui = useUiStore()
const notifications = useNotificationsStore()
const auth = useAuthStore()

const saving = ref(false)
const deletingPhoto = ref(false)
const errors = reactive<Record<string, string>>({})

const isEdit = computed(() => !!props.initial || !!route.params.id)

const model = reactive<PurchaseRequest>({
  date: new Date().toISOString().split('T')[0],
  object: 0, // Will be set from form
  responsible: 0, // Will be set from form
  supplier: '',
  invoice_number: '',
  purchase_no: '',
  vat_included: false,
  currency: 'UZS',
  comment: '',
  items: []
})

const items = ref<Array<PurchaseItemRequest & { _k: string, total: number, quantity: string, price: string }>>([])
const photoFiles = ref<File[]>([])
const currentPhotos = ref<string[]>([])

const materials = computed(() => materialsStore.items)
const units = computed(() => unitsStore.items)
const objects = computed(() => objectsStore.items)
const employees = computed(() => employeesStore.items)

const objectOptions = computed(() => 
  objects.value.map(obj => ({ value: obj.id, label: obj.name }))
)

const employeeOptions = computed(() => 
  employees.value.map((emp: Employee) => ({ 
    value: emp.id, 
    label: `${emp.first_name || emp.username} ${emp.last_name || ''}`.trim()
  }))
)

const vatOptions = [
  { value: true, label: 'Да' },
  { value: false, label: 'Нет' }
]

const total = computed(() => {
  return items.value.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
})

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2
  }).format(amount)
}

function addItem() {
  items.value.push({
    _k: Math.random().toString(36).substr(2, 9),
    material: 0,
    unit: 0,
    quantity: '0',
    price: '0',
    amount: '0',
    total: 0
  })
}

function removeItem(index: number) {
  items.value.splice(index, 1)
}

function onMaterialChange(item: any) {
  const material = materials.value.find(m => m.id === item.material)
  if (material?.default_unit) {
    item.unit = material.default_unit
  }
}

function getUnitName(unitId: number) {
  const unit = units.value.find(u => u.id === unitId)
  return unit ? unit.code : null
}

function recalc(item: any) {
  const quantity = parseFloat(item.quantity || '0')
  const price = parseFloat(item.price || '0')
  item.total = quantity * price
}

function onPhotoChange(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files) {
    photoFiles.value = Array.from(files)
  }
}

async function onDeletePhoto(index: number) {
  if (!isEdit.value) return
  
  deletingPhoto.value = true
  try {
    const purchaseId = Number(route.params.id)
    const purchase = purchasesStore.current
    
    if (purchase && purchase.photos && purchase.photos[index]) {
      const photoId = purchase.photos[index].id
      await purchasesStore.deletePhoto(purchaseId, photoId)
      ui.toast({ type: 'success', text: 'Фото удалено' })
    }
  } catch (error) {
    ui.toast({ type: 'error', text: 'Ошибка удаления фото' })
    console.error('Error deleting photo:', error)
  } finally {
    deletingPhoto.value = false
  }
}

async function onSubmit() {
  saving.value = true
  Object.keys(errors).forEach(key => delete errors[key])
  
  try {
    // Prepare purchase data
    const purchaseData: PurchaseRequest = {
      date: model.date,
      object: model.object,
      responsible: model.responsible,
      supplier: model.supplier,
      invoice_number: model.invoice_number,
      purchase_no: model.purchase_no,
      vat_included: model.vat_included,
      currency: model.currency,
      comment: model.comment,
      items: items.value.map((item: any) => ({
        material: item.material,
        unit: item.unit,
        quantity: item.quantity,
        price: item.price,
        amount: item.amount
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
    
    // Upload photos if any
    if (photoFiles.value.length > 0) {
      for (const photoFile of photoFiles.value) {
        try {
          await purchasesStore.uploadPhoto(purchaseId, {
            photo: photoFile,
            is_cover: false // First photo will be cover by default
          })
        } catch (error) {
          console.error('Error uploading photo:', error)
          ui.toast({ type: 'error', text: 'Ошибка загрузки фото' })
        }
      }
    }
    
    ui.toast({ type: 'success', text: 'Закупка сохранена' })
    emit('saved')
  } catch (error: any) {
    const errorResult = ErrorHandlers.formValidation(error)
    
    // Устанавливаем ошибки полей
    Object.keys(errorResult.fieldErrors).forEach(field => {
      errors[field] = errorResult.fieldErrors[field]
    })
    
    // Уведомление об ошибке
    notifications.notifyPurchaseError(
      isEdit.value ? Number(route.params.id) : 0, 
      errorResult.detail
    )
  } finally {
    saving.value = false
  }
}

async function loadData() {
  // Load reference data
  await Promise.all([
    materialsStore.fetchList(),
    unitsStore.fetchList(),
    objectsStore.fetchList(),
    employeesStore.fetchList()
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
        console.log('Loading purchase with ID:', route.params.id)
        purchase = await purchasesStore.fetchOne(Number(route.params.id))
        console.log('Loaded purchase:', purchase)
      }
      
      if (purchase) {
        model.date = purchase.date
        model.object = purchase.object
        model.responsible = purchase.responsible
        model.supplier = purchase.supplier || ''
        model.invoice_number = purchase.invoice_number || ''
        model.purchase_no = purchase.purchase_no || ''
        model.vat_included = purchase.vat_included
        model.comment = purchase.comment || ''
        
        // Load items
        items.value = purchase.items?.map(item => ({
          _k: Math.random().toString(36).substr(2, 9),
          material: item.material,
          unit: item.unit,
          quantity: item.quantity,
          price: item.price || '0',
          amount: item.amount,
          total: parseFloat(item.quantity) * parseFloat(item.price || '0')
        })) || []
        
        // Load photos
        if (purchase.photos) {
          currentPhotos.value = purchase.photos.map(photo => photo.url)
        }
      }
    } catch (error) {
      ui.toast({ type: 'error', text: 'Ошибка загрузки закупки' })
      console.error('Error loading purchase:', error)
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