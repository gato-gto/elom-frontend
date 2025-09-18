<!-- src/pages/Materials/MaterialForm.vue -->
<template>
  <form class="grid gap-4" @submit.prevent="submit">
    <!-- Основная информация -->
    <div class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Основная информация</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <!-- Название -->
          <FormField
            v-model="form.name"
            label="Название материала"
            type="input"
            placeholder="Введите название материала"
            :error="errors.name"
            required
          />

          <!-- SKU -->
          <FormField
            v-model="form.sku"
            label="SKU (Артикул)"
            type="input"
            placeholder="Введите артикул или код материала"
            :error="errors.sku"
          />

          <!-- Категория -->
          <FormField
            v-model="form.category"
            label="Категория"
            type="select"
            :error="errors.category"
            placeholder="— выберите категорию —"
            :options="categoryOptions"
          />

          <!-- Единица измерения -->
          <FormField
            v-model="form.default_unit"
            label="Единица измерения"
            type="select"
            :error="errors.default_unit"
            placeholder="— выберите единицу —"
            :options="unitOptions"
            required
          />

          <!-- Дата создания -->
          <FormField
            v-model="form.created_date"
            label="Дата создания"
            type="date"
            :error="errors.created_date"
            required
          />
        </div>
      </div>
    </div>

    <!-- Фото и документы -->
    <div class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Фото и документы</h2>
        
        <!-- Current photo preview -->
        <div v-if="currentPhotoUrl" class="mb-4">
          <div class="relative inline-block">
            <img 
              :src="currentPhotoUrl" 
              alt="Текущее фото" 
              class="h-24 w-24 object-cover rounded-lg border"
            />
            <button 
              type="button" 
              class="absolute -top-2 -right-2 btn btn-error btn-xs btn-circle"
              :disabled="deletingPhoto" 
              @click="onDeletePhoto"
              title="Удалить фото"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p class="text-xs text-base-content-60 mt-1">Текущее фото</p>
        </div>
        
        <!-- File input -->
        <FileInput 
          v-model="photoFile" 
          accept="image/*" 
          :maxSizeMb="8" 
          :preview="true"
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
        :disabled="loading || deletingPhoto"
      >
        Отмена
      </button>
      <button 
        type="submit" 
        class="btn btn-primary" 
        :disabled="loading || deletingPhoto"
      >
        <svg v-if="loading" class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        {{ loading ? 'Сохранение...' : (props.initial ? 'Обновить' : 'Создать') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useMaterialsStore } from '@/stores/materials'
import { useUnitsStore } from '@/stores/units'
import { useUnitConversionsStore } from '@/stores/unitConversions'
import { useMaterialCategoriesStore } from '@/stores/materialCategories'
import { useUiStore } from '@/stores/ui'
import type { Material, MaterialRequest } from '@/api/types'
import FormField from '@/components/FormField.vue'
import FileInput from '@/components/FileInput.vue'

const props = defineProps<{
  initial?: Material | null
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const materialsStore = useMaterialsStore()
const unitsStore = useUnitsStore()
const unitConversionsStore = useUnitConversionsStore()
const materialCategoriesStore = useMaterialCategoriesStore()
const ui = useUiStore()

const loading = ref(false)
const deletingPhoto = ref(false)
const errors = reactive<Record<string, string>>({})

const form = reactive<MaterialRequest>({
  name: '',
  sku: '',
  category: undefined,
  default_unit: 1, // Default to first unit
  created_date: new Date().toISOString().split('T')[0]
})

const photoFile = ref<File | null>(null)
const currentPhotoUrl = ref<string | null>(null)

const categoryOptions = computed(() => materialCategoriesStore.selectOptions)

const unitOptions = computed(() => {
  return unitsStore.selectOptions
})

function resetForm() {
  form.name = ''
  form.sku = ''
  form.category = undefined
  form.default_unit = 1
  form.created_date = new Date().toISOString().split('T')[0]
  photoFile.value = null
  currentPhotoUrl.value = null
  Object.keys(errors).forEach(key => delete errors[key])
}

function loadInitial() {
  if (props.initial) {
    form.name = props.initial.name
    form.sku = props.initial.sku || ''
    form.category = props.initial.category
    form.default_unit = props.initial.default_unit
    form.created_date = new Date().toISOString().split('T')[0] // Default to today for existing materials
    
    if (props.initial.photo_url) {
      currentPhotoUrl.value = props.initial.photo_url
    }
  } else {
    resetForm()
  }
}

async function onDeletePhoto() {
  if (!props.initial?.id) return
  
  deletingPhoto.value = true
  try {
    await materialsStore.deletePhoto(props.initial.id)
    currentPhotoUrl.value = null
    ui.toast({ type: 'success', text: 'Фото удалено' })
  } catch (error) {
    ui.toast({ type: 'error', text: 'Ошибка удаления фото' })
    console.error('Error deleting photo:', error)
  } finally {
    deletingPhoto.value = false
  }
}

async function submit() {
  loading.value = true
  Object.keys(errors).forEach(key => delete errors[key])
  
  try {
    let materialId: number
    
    // First, save the material data (without photo)
    if (props.initial) {
      await materialsStore.update(props.initial.id, form)
      materialId = props.initial.id
    } else {
      const newMaterial = await materialsStore.create(form)
      materialId = newMaterial.id
    }
    
    // Then, upload photo if exists
    if (photoFile.value) {
      await materialsStore.uploadPhoto(materialId, photoFile.value)
    }
    
    emit('saved')
  } catch (error: any) {
    if (error.response?.status === 400 && error.response?.data) {
      const data = error.response.data
      if (typeof data === 'object') {
        Object.keys(data).forEach(key => {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            errors[key] = data[key][0]
          }
        })
      }
    } else {
      ui.toast({ type: 'error', text: 'Ошибка сохранения материала' })
    }
  } finally {
    loading.value = false
  }
}

// Load data on mount
onMounted(async () => {
  loadInitial()
  
  // Load units and categories if not already loaded
  const promises = []
  if (unitsStore.items.length === 0) {
    promises.push(unitsStore.fetchList())
  }
  if (materialCategoriesStore.items.length === 0) {
    promises.push(materialCategoriesStore.fetchList())
  }
  if (unitConversionsStore.items.length === 0) {
    promises.push(unitConversionsStore.fetchList({ page_size: 1000 }))
  }
  
  if (promises.length > 0) {
    await Promise.all(promises)
  }
})
</script>