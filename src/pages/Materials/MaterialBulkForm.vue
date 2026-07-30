<template>
  <Modal
    :size="'6xl'"
    :model-value="isOpen"
    title="Массовое добавление материалов"
    @close="closeModal"
  >
    <div class="space-y-6">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Позиции материалов -->
        <div class="space-y-6">
          <h2 class="text-lg font-semibold text-base-content mb-2">
            Материалы
          </h2>
          
          <!-- Desktop table view -->
          <div class="hidden md:block overflow-auto">
            <table class="table w-full">
              <thead>
                <tr>
                  <th style="min-width: 200px">Название *</th>
                  <th style="min-width: 120px">SKU</th>
                  <th style="min-width: 150px">Категория</th>
                  <th style="min-width: 150px">Ед. изм. *</th>
                  <th style="min-width: 150px">Производитель</th>
                  <th class="text-right" style="min-width: 80px">Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in items" :key="item._k">
                  <td>
                    <div>
                      <input
                        v-model="item.name"
                        type="text"
                        required
                        class="input input-bordered input-sm w-full"
                        :class="{ 'input-error': getItemFieldError(idx, 'name') }"
                        placeholder="Название материала"
                      />
                      <div v-if="getItemFieldError(idx, 'name')" class="text-error text-xs mt-1">
                        {{ getItemFieldError(idx, 'name') }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <input
                        v-model="item.sku"
                        type="text"
                        class="input input-bordered input-sm w-full"
                        :class="{ 'input-error': getItemFieldError(idx, 'sku') }"
                        placeholder="Артикул"
                      />
                      <div v-if="getItemFieldError(idx, 'sku')" class="text-error text-xs mt-1">
                        {{ getItemFieldError(idx, 'sku') }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <select
                        v-model.number="item.category"
                        class="select select-bordered select-sm w-full"
                        :class="{ 'select-error': getItemFieldError(idx, 'category') }"
                      >
                        <option :value="undefined">— не выбрано —</option>
                        <option
                          v-for="cat in categoryOptions"
                          :key="cat.value"
                          :value="cat.value"
                        >
                          {{ cat.label }}
                        </option>
                      </select>
                      <div v-if="getItemFieldError(idx, 'category')" class="text-error text-xs mt-1">
                        {{ getItemFieldError(idx, 'category') }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <select
                        v-model.number="item.default_unit"
                        required
                        class="select select-bordered select-sm w-full"
                        :class="{ 'select-error': getItemFieldError(idx, 'default_unit') }"
                      >
                        <option :value="0">— выберите единицу —</option>
                        <option
                          v-for="unit in unitOptions"
                          :key="unit.value"
                          :value="unit.value"
                        >
                          {{ unit.label }}
                        </option>
                      </select>
                      <div v-if="getItemFieldError(idx, 'default_unit')" class="text-error text-xs mt-1">
                        {{ getItemFieldError(idx, 'default_unit') }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <input
                        v-model="item.manufacturer"
                        type="text"
                        class="input input-bordered input-sm w-full"
                        :class="{ 'input-error': getItemFieldError(idx, 'manufacturer') }"
                        placeholder="Производитель"
                      />
                      <div v-if="getItemFieldError(idx, 'manufacturer')" class="text-error text-xs mt-1">
                        {{ getItemFieldError(idx, 'manufacturer') }}
                      </div>
                    </div>
                  </td>
                  <td class="text-right">
                    <button type="button" class="btn btn-error btn-xs" aria-label="Удалить позицию" title="Удалить" @click="removeItem(idx)">
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
                  <h3 class="font-medium text-sm">Материал {{ idx + 1 }}</h3>
                  <button type="button" class="btn btn-error btn-xs" aria-label="Удалить позицию" title="Удалить" @click="removeItem(idx)">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
                
                <div class="space-y-3">
                  <!-- Название -->
                  <div>
                    <label class="label">
                      <span class="label-text text-xs">Название *</span>
                    </label>
                    <input
                      v-model="item.name"
                      type="text"
                      required
                      class="input input-bordered input-sm w-full"
                      :class="{ 'input-error': getItemFieldError(idx, 'name') }"
                      placeholder="Название материала"
                    />
                    <div v-if="getItemFieldError(idx, 'name')" class="text-error text-xs mt-1">
                      {{ getItemFieldError(idx, 'name') }}
                    </div>
                  </div>
                  
                  <!-- SKU -->
                  <div>
                    <label class="label">
                      <span class="label-text text-xs">SKU</span>
                    </label>
                    <input
                      v-model="item.sku"
                      type="text"
                      class="input input-bordered input-sm w-full"
                      :class="{ 'input-error': getItemFieldError(idx, 'sku') }"
                      placeholder="Артикул"
                    />
                    <div v-if="getItemFieldError(idx, 'sku')" class="text-error text-xs mt-1">
                      {{ getItemFieldError(idx, 'sku') }}
                    </div>
                  </div>
                  
                  <!-- Категория -->
                  <div>
                    <label class="label">
                      <span class="label-text text-xs">Категория</span>
                    </label>
                    <select
                      v-model.number="item.category"
                      class="select select-bordered select-sm w-full"
                      :class="{ 'select-error': getItemFieldError(idx, 'category') }"
                    >
                      <option :value="undefined">— не выбрано —</option>
                      <option
                        v-for="cat in categoryOptions"
                        :key="cat.value"
                        :value="cat.value"
                      >
                        {{ cat.label }}
                      </option>
                    </select>
                    <div v-if="getItemFieldError(idx, 'category')" class="text-error text-xs mt-1">
                      {{ getItemFieldError(idx, 'category') }}
                    </div>
                  </div>
                  
                  <!-- Единица измерения -->
                  <div>
                    <label class="label">
                      <span class="label-text text-xs">Единица измерения *</span>
                    </label>
                    <select
                      v-model.number="item.default_unit"
                      required
                      class="select select-bordered select-sm w-full"
                      :class="{ 'select-error': getItemFieldError(idx, 'default_unit') }"
                    >
                      <option :value="0">— выберите единицу —</option>
                      <option
                        v-for="unit in unitOptions"
                        :key="unit.value"
                        :value="unit.value"
                      >
                        {{ unit.label }}
                      </option>
                    </select>
                    <div v-if="getItemFieldError(idx, 'default_unit')" class="text-error text-xs mt-1">
                      {{ getItemFieldError(idx, 'default_unit') }}
                    </div>
                  </div>
                  
                  <!-- Производитель -->
                  <div>
                    <label class="label">
                      <span class="label-text text-xs">Производитель</span>
                    </label>
                    <input
                      v-model="item.manufacturer"
                      type="text"
                      class="input input-bordered input-sm w-full"
                      :class="{ 'input-error': getItemFieldError(idx, 'manufacturer') }"
                      placeholder="Производитель"
                    />
                    <div v-if="getItemFieldError(idx, 'manufacturer')" class="text-error text-xs mt-1">
                      {{ getItemFieldError(idx, 'manufacturer') }}
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
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Добавить материал
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
            {{ isSubmitting ? 'Сохранение...' : 'Создать материалы' }}
          </button>
        </div>
      </form>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { todayLocal } from '@/utils/formatters'
import Modal from '@/components/Modal.vue'
import { useMaterialsStore } from '@/stores/materials'
import { useUnitsStore } from '@/stores/units'
import { useMaterialCategoriesStore } from '@/stores/materialCategories'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useUiStore } from '@/stores/ui'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { Material } from '@/api/types'

const _materialsStore = useMaterialsStore()
const unitsStore = useUnitsStore()
const materialCategoriesStore = useMaterialCategoriesStore()
const uiStore = useUiStore()
const { handleFormError, errors, clearErrors } = useErrorHandler()

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

// Items - позиции материалов
interface MaterialItem {
  _k: string
  name: string
  sku: string
  category: number | undefined
  default_unit: number
  manufacturer: string
  description: string
  created_date: string
  is_active: boolean
}

const items = ref<MaterialItem[]>([])

// Item errors
const itemErrors = reactive<Record<string, string>>({})

// Loading states
const isSubmitting = ref(false)

// Options
const categoryOptions = computed(() => materialCategoriesStore.selectOptions)

const unitOptions = computed(() => [
  { value: 0, label: '— выберите единицу —' },
  ...unitsStore.items.map(unit => ({ 
    value: unit.id, 
    label: `${unit.name} (${unit.code})` 
  }))
])

// Item management
function addItem() {
  const newItem: MaterialItem = {
    _k: Math.random().toString(36).substr(2, 9),
    name: '',
    sku: '',
    category: undefined,
    default_unit: 0,
    manufacturer: '',
    description: '',
    // Значения по умолчанию: дата создания - текущая дата, статус - активный
    created_date: todayLocal(),
    is_active: true
  }
  items.value.push(newItem)
}

function removeItem(index: number) {
  items.value.splice(index, 1)
  
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

// Function to get general items error
function getItemsGeneralError(): string {
  for (const [key, value] of Object.entries(itemErrors)) {
    if (key.startsWith('items[') && typeof value === 'string') {
      return value
    }
  }
  return ''
}

// Form handlers
const handleSubmit = async () => {
  isSubmitting.value = true
  clearErrors()
  Object.keys(itemErrors).forEach(key => delete itemErrors[key])
  
  try {
    // FE-2/F-563: пустая хвостовая строка (без названия И без единицы) — не позиция.
    // Раньше валидировали ВСЕ строки с early-return → пустой плейсхолдер блокировал сохранение,
    // а фильтр пропуска пустых ниже уже не выполнялся.
    const isEmptyMaterialRow = (it: any) => (!it.name || !it.name.trim()) && (!it.default_unit || it.default_unit === 0)
    if (items.value.every(isEmptyMaterialRow)) {
      errors.value.non_field_errors = ['Добавьте хотя бы один материал']
      isSubmitting.value = false
      return
    }

    // Валидация: проверка обязательных полей ТОЛЬКО для заполненных позиций
    const invalidItems: number[] = []
    items.value.forEach((item, index) => {
      if (isEmptyMaterialRow(item)) { return }  // пропускаем пустой плейсхолдер
      if (!item.name || item.name.trim() === '') {
        itemErrors[`items[${index}].name`] = 'Название материала обязательно'
        invalidItems.push(index)
      }
      if (!item.default_unit || item.default_unit === 0) {
        itemErrors[`items[${index}].default_unit`] = 'Единица измерения обязательна'
        invalidItems.push(index)
      }
    })
    
    if (invalidItems.length > 0) {
      isSubmitting.value = false
      return
    }
    
    // F-856: РЕТРАЙ-БЕЗОПАСНОЕ поштучное создание (у materials нет атомарного bulk-эндпоинта).
    // Раньше Promise.all: при падении одной строки остальные уже создавались на бэке, форма
    // оставалась открытой, повторный сабмит слал ВСЕ строки → ДУБЛИ; и построчные 400
    // (name/sku/default_unit/non_field_errors) никуда не мапились. Теперь каждый POST в своём
    // try/catch со знанием display-индекса: успех → item._created (ретрай пропускает), ошибка →
    // itemErrors[items[idx].field]. Успешные строки сохраняются; повтор шлёт только несозданные.
    const pending = items.value
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => !(item as any)._created
        && item.name && item.name.trim() !== '' && item.default_unit && item.default_unit !== 0)

    let createdCount = 0
    let failedCount = 0
    await Promise.all(pending.map(async ({ item, idx }) => {
      const itemAny = item as any
      const formData = new FormData()
      formData.append('name', item.name.trim())
      if (item.sku?.trim()) { formData.append('sku', item.sku.trim()) }
      if (item.category) { formData.append('category', item.category.toString()) }
      formData.append('default_unit', item.default_unit.toString())
      if (item.manufacturer?.trim()) { formData.append('manufacturer', item.manufacturer.trim()) }
      if (item.description?.trim()) { formData.append('description', item.description.trim()) }
      formData.append('created_date', todayLocal())
      formData.append('is_active', 'true')
      try {
        await api.post<Material>(endpoints.materials.list, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        itemAny._created = true
        createdCount++
      } catch (err) {
        failedCount++
        const parsed = await handleFormError(err, 'материал')
        Object.keys(parsed.fieldErrors || {}).forEach(field => {
          const fe = (parsed.fieldErrors as any)[field]
          const msg = Array.isArray(fe) ? fe[0] : fe
          const target = field === 'non_field_errors' ? 'name' : field
          itemErrors[`items[${idx}].${target}`] = msg
        })
      }
    }))

    if (createdCount > 0) {
      uiStore.toast({ type: 'success', text: `Успешно добавлено материалов: ${createdCount}` })
    }
    if (failedCount > 0) {
      uiStore.toast({ type: 'error', text: `Не создано строк: ${failedCount} — исправьте выделенные и повторите` })
      return  // форма открыта; _created строки при повторе пропустятся (без дублей)
    }

    emit('success')
  } catch (error) {
    // непредвиденная (не построчная) ошибка — общий обработчик
    await handleFormError(error, 'материал')
  } finally {
    isSubmitting.value = false
  }
}

const closeModal = () => {
  // Сбрасываем форму при закрытии
  items.value = []
  clearErrors()
  Object.keys(itemErrors).forEach(key => delete itemErrors[key])
  emit('close')
}

// Initialize form
onMounted(async () => {
  // Загружаем единицы измерения и категории
  // F-718: units=14 > мобильного page_size 10 → на МОБИЛЕ селект единиц в строках резался (нет метров).
  // Грузим единицы полным списком БЕЗУСЛОВНО (guard length===0 оставлял усечённый стор).
  // F-901 (sweep, класс F-718): категории — dropdown в строках bulk-формы, нужен ПОЛНЫЙ список.
  // Guard length===0 оставлял усечённый (≤20) стор с чужого экрана, а fetchList без page_size усёк
  // бы при >20 категориях. Грузим безусловно полным списком (как units в F-718).
  const promises: Promise<unknown>[] = [
    unitsStore.fetchList({ page_size: 1000 }),
    materialCategoriesStore.fetchList({ page_size: 1000 } as any),
  ]
  
  if (promises.length > 0) {
    await Promise.all(promises)
  }
  
  // Добавляем первую позицию по умолчанию
  if (items.value.length === 0) {
    addItem()
  }
})

// Watch for modal open to reset form
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    items.value = []
    clearErrors()
    Object.keys(itemErrors).forEach(key => delete itemErrors[key])
    addItem()
  }
})
</script>

