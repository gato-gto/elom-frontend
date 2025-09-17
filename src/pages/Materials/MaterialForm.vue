<!-- src/pages/Materials/MaterialForm.vue -->
<template>
  <form class="grid gap-4" @submit.prevent="submit">
    <!-- Название -->
    <FormField
      v-model="form.name"
      type="input"
      label="Название материала"
      placeholder="Введите название материала"
      required
      :error-message="errors.name"
      :has-error="!!errors.name"
    />

    <!-- SKU -->
    <FormField
      v-model="form.sku"
      type="input"
      label="SKU"
      placeholder="Артикул/код"
      help-text="Необязательно"
      :error-message="errors.sku"
      :has-error="!!errors.sku"
    />

    <!-- Категория -->
    <FormField
      v-model="form.category"
      type="select"
      label="Категория"
      placeholder="— без категории —"
      :options="categoryOptions"
      :error-message="errors.category"
      :has-error="!!errors.category"
    />

    <!-- Единица измерения -->
    <FormField
      v-model="form.default_unit"
      type="select"
      label="Единица по умолчанию"
      placeholder="— выберите единицу —"
      :options="unitOptions"
      required
      :error-message="errors.default_unit"
      :has-error="!!errors.default_unit"
    />

    <!-- Фото -->
    <div class="form-control">
      <label class="label">
        <span class="label-text">Фото (обложка)</span>
      </label>
      <FileInput 
        v-model="photoFile" 
        accept="image/*" 
        :maxSizeMb="8" 
        :existingUrl="currentPhotoUrl"
      />
      <div class="flex gap-2 mt-2">
        <button 
          v-if="currentPhotoUrl" 
          type="button" 
          class="btn btn-ghost btn-sm" 
          :disabled="deletingPhoto" 
          @click="onDeletePhoto"
        >
          {{ deletingPhoto ? 'Удаление…' : 'Удалить фото' }}
        </button>
        <span v-if="errors.photo" class="text-xs text-error">{{ errors.photo }}</span>
      </div>
      <label class="label">
        <span class="label-text-alt">
          Загрузка/замена фото происходит после сохранения карточки. Допустимы изображения, лимит 8 МБ.
        </span>
      </label>
    </div>

    <!-- Кнопки действий -->
    <div class="flex justify-end gap-2 mt-6">
      <button 
        type="button" 
        class="btn btn-ghost" 
        @click="$emit('cancel')"
        :disabled="submitting"
      >
        Отмена
      </button>
      <button 
        type="submit" 
        class="btn btn-primary" 
        :disabled="submitting"
      >
        {{ submitting ? 'Сохранение…' : 'Сохранить' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watchEffect, computed } from 'vue'
import type { Material, MaterialCategoryLite, Unit } from '@/api/types'
import FileInput from '@/components/FileInput.vue'
import FormField from '@/components/FormField.vue'
import { useUiStore } from '@/stores/ui'
import { useMaterialsStore } from '@/stores/materials'
import { useUnitsStore } from '@/stores/units'

const props = defineProps<{ initial: Material | null }>()
const emit = defineEmits<{ (e: 'saved'): void; (e: 'cancel'): void }>()

const ui = useUiStore()
const materialsStore = useMaterialsStore()
const unitsStore = useUnitsStore()

// Form data
const form = reactive<{
  name: string
  sku: string
  category: string
  default_unit: string
}>({
  name: '',
  sku: '',
  category: '',
  default_unit: '',
})

const errors = reactive<Record<string, string | null>>({
  name: null, 
  sku: null, 
  category: null, 
  default_unit: null, 
  photo: null,
})

const submitting = ref(false)
const photoFile = ref<File | null>(null)
const currentPhotoUrl = ref<string | null>(null)
const deletingPhoto = ref(false)

// Computed options for selects
const unitOptions = computed(() => {
  return unitsStore.selectOptions
})

const categoryOptions = computed(() => {
  // TODO: Implement material categories store
  return [
    { value: '', label: '— без категории —' }
  ]
})

// Load data on mount
onMounted(async () => {
  try {
    await unitsStore.fetchList()
    // TODO: Load categories when store is implemented
  } catch (error) {
    ui.toast({ type: 'error', text: 'Ошибка загрузки справочников' })
  }
})

// Watch for initial data changes
watchEffect(() => {
  if (props.initial) {
    form.name = props.initial.name || ''
    form.sku = props.initial.sku || ''
    form.category = props.initial.category ? String(props.initial.category) : ''
    form.default_unit = props.initial.default_unit ? String(props.initial.default_unit) : ''
    currentPhotoUrl.value = props.initial.photo_url || null
  } else {
    form.name = ''
    form.sku = ''
    form.category = ''
    form.default_unit = ''
    currentPhotoUrl.value = null
  }
  photoFile.value = null
  // Clear errors
  for (const k of Object.keys(errors)) (errors as any)[k] = null
})

// Helper function to extract errors from API response
function pickError(payload: any, key: string): string | null {
  const v = payload?.[key]
  if (Array.isArray(v) && v.length) return String(v[0])
  if (typeof v === 'string') return v

  const nested = payload?.errors?.[key]
  if (Array.isArray(nested) && nested.length) return String(nested[0])
  if (typeof nested === 'string') return nested

  return null
}

// Upload photo using store
async function uploadPhoto(materialId: number) {
  if (!photoFile.value) return
  
  try {
    await materialsStore.uploadPhoto(materialId, photoFile.value)
    currentPhotoUrl.value = materialsStore.current?.photo_url || null
    photoFile.value = null
    ui.toast({ type: 'success', text: 'Фото загружено' })
  } catch (e: any) {
    const d = e?.response?.data || {}
    errors.photo = pickError(d, 'photo') || d?.detail || 'Ошибка загрузки фото'
    throw e
  }
}

// Delete photo
async function onDeletePhoto() {
  if (!props.initial?.id && !currentPhotoUrl.value) return
  if (!confirm('Удалить фото материала?')) return
  
  deletingPhoto.value = true
  try {
    const id = props.initial?.id
    if (!id) {
      photoFile.value = null
      currentPhotoUrl.value = null
      return
    }
    
    // TODO: Implement delete photo in materials store
    // await materialsStore.deletePhoto(id)
    currentPhotoUrl.value = null
    ui.toast({ type: 'success', text: 'Фото удалено' })
  } catch (e: any) {
    const d = e?.response?.data || {}
    errors.photo = d?.detail || 'Не удалось удалить фото'
  } finally {
    deletingPhoto.value = false
  }
}

// Client-side validation
function clientValidate(): boolean {
  let ok = true
  errors.name = null
  errors.default_unit = null

  if (!form.name.trim()) {
    errors.name = 'Заполните название'
    ok = false
  }
  if (!form.default_unit) {
    errors.default_unit = 'Выберите единицу'
    ok = false
  }
  return ok
}

// Submit form
async function submit() {
  // Clear previous errors
  for (const k of Object.keys(errors)) (errors as any)[k] = null
  
  // Client validation
  if (!clientValidate()) return

  submitting.value = true
  try {
    const formData = {
      name: form.name,
      sku: form.sku || undefined,
      category: form.category ? Number(form.category) : undefined,
      default_unit: Number(form.default_unit)
    }

    let materialId: number
    if (props.initial?.id) {
      // Update existing material
      await materialsStore.update(props.initial.id, formData)
      materialId = props.initial.id
    } else {
      // Create new material
      const newMaterial = await materialsStore.create(formData)
      materialId = newMaterial.id
    }

    // Upload photo if selected
    if (photoFile.value) {
      await uploadPhoto(materialId)
    }

    emit('saved')
  } catch (e: any) {
    const d = e?.response?.data || {}
    // Extract field errors
    errors.name = pickError(d, 'name')
    errors.sku = pickError(d, 'sku')
    errors.category = pickError(d, 'category')
    errors.default_unit = pickError(d, 'default_unit')

    // If no specific field errors, show general error
    if (!errors.name && !errors.default_unit && d?.detail && typeof d.detail === 'string') {
      errors.name = d.detail
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* no @apply */
</style>

