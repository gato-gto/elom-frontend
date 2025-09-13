<!-- src/pages/Materials/MaterialForm.vue -->
<template>
  <form class="grid gap-3" @submit.prevent="submit">
    <label class="grid gap-1">
      <span class="text-sm">Название</span>
      <input v-model.trim="form.name" class="input input-bordered" required/>
      <span v-if="errors.name" class="text-xs text-error">{{ errors.name }}</span>
    </label>

    <label class="grid gap-1">
      <span class="text-sm">SKU (опц.)</span>
      <input v-model.trim="form.sku" class="input input-bordered" placeholder="Артикул/код"/>
      <span v-if="errors.sku" class="text-xs text-error">{{ errors.sku }}</span>
    </label>

    <label class="grid gap-1">
      <span class="text-sm">Категория</span>
      <select v-model="form.category" class="select select-bordered">
        <option value="">— без категории —</option>
        <option v-for="c in categories" :key="c.id" :value="String(c.id)">{{ c.name }}</option>
      </select>
      <span v-if="errors.category" class="text-xs text-error">{{ errors.category }}</span>
    </label>

    <label class="grid gap-1">
      <span class="text-sm">Единица по умолчанию</span>
      <select v-model="form.default_unit" class="select select-bordered" required>
        <option value="" disabled>— выберите единицу —</option>
        <option v-for="u in units" :key="u.id" :value="String(u.id)">
          {{ u.name }} ({{ u.code }})
        </option>
      </select>
      <span v-if="errors.default_unit" class="text-xs text-error">{{ errors.default_unit }}</span>
    </label>

    <!-- Фото -->
    <div class="grid gap-2">
      <span class="text-sm">Фото (обложка)</span>
      <FileInput v-model="photoFile" accept="image/*" :maxSizeMb="8" :existingUrl="currentPhotoUrl"/>
      <div class="flex gap-2">
        <button v-if="currentPhotoUrl" type="button" class="btn btn-ghost btn-sm" :disabled="deletingPhoto"
                @click="onDeletePhoto">
          {{ deletingPhoto ? 'Удаление…' : 'Удалить фото' }}
        </button>
        <span v-if="errors.photo" class="text-xs text-error">{{ errors.photo }}</span>
      </div>
      <p class="text-xs text-base-content/60">
        Загрузка/замена фото происходит после сохранения карточки. Допустимы изображения, лимит 8 МБ.
      </p>
    </div>

    <div class="flex justify-end gap-2 mt-2">
      <button type="button" class="btn btn-ghost" @click="$emit('cancel')">Отмена</button>
      <button type="submit" class="btn btn-primary" :disabled="submitting">
        {{ submitting ? 'Сохранение…' : 'Сохранить' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref, watchEffect} from 'vue'
import api from '@/api/client'
import {endpoints} from '@/api/endpoints'
import type {Material, PageResponse, Unit} from '@/api/types'
import FileInput from '@/components/FileInput.vue'
import {useUiStore} from '@/stores/ui'

type Category = { id: number; name: string }

const props = defineProps<{ initial: Material | null }>()
const emit = defineEmits<{ (e: 'saved'): void; (e: 'cancel'): void }>()

const ui = useUiStore()
const categories = ref<Category[]>([])
const units = ref<Unit[]>([])

const form = reactive<{
  name: string
  sku: string
  category: string // храним как string для placeholder ""
  default_unit: string // string для корректной работы required у <select>
}>({
  name: '',
  sku: '',
  category: '',
  default_unit: '',
})

const errors = reactive<Record<string, string | null>>({
  name: null, sku: null, category: null, default_unit: null, photo: null,
})

const submitting = ref(false)
const photoFile = ref<File | null>(null)
const currentPhotoUrl = ref<string | null>(null)
const deletingPhoto = ref(false)

onMounted(async () => {
  await Promise.all([loadUnits(), loadCategories()])
})

watchEffect(() => {
  if (props.initial) {
    form.name = props.initial.name || ''
    form.sku = props.initial.sku || ''
    form.category = props.initial.category ? String(props.initial.category) : ''
    form.default_unit = props.initial.default_unit ? String(props.initial.default_unit) : ''
    currentPhotoUrl.value = (props.initial as any).photo_url || null
  } else {
    form.name = ''
    form.sku = ''
    form.category = ''
    form.default_unit = ''
    currentPhotoUrl.value = null
  }
  photoFile.value = null
  for (const k of Object.keys(errors)) (errors as any)[k] = null
})

async function loadUnits() {
  const {data} = await api.get<PageResponse<Unit>>(endpoints.units.list);
  units.value = data.results;
}

async function loadCategories() {
  const {data} = await api.get<any>(endpoints.materialCategories)
  categories.value = Array.isArray(data.results) ? data.results : data
}

function buildFormData(): FormData {
  const fd = new FormData()
  fd.append('name', form.name)
  if (form.sku) fd.append('sku', form.sku)
  if (form.category) fd.append('category', form.category)
  if (form.default_unit) fd.append('default_unit', form.default_unit)
  return fd
}

function pickError(payload: any, key: string): string | null {
  const v = payload?.[key]
  if (Array.isArray(v) && v.length) return String(v[0])
  if (typeof v === 'string') return v

  const nested = payload?.errors?.[key]
  if (Array.isArray(nested) && nested.length) return String(nested[0])
  if (typeof nested === 'string') return nested

  return null
}

async function uploadPhoto(materialId: number) {
  if (!photoFile.value) return
  const fd = new FormData()
  fd.append('photo', photoFile.value)
  try {
    const {data} = await api.post<{ photo_url: string }>(endpoints.materialsPhoto(materialId), fd)
    currentPhotoUrl.value = data.photo_url
    photoFile.value = null
    ui.toast({type: 'success', text: 'Фото загружено'})
  } catch (e: any) {
    const d = e?.response?.data || {}
    errors.photo = pickError(d, 'photo') || d?.detail || 'Ошибка загрузки фото'
    throw e
  }
}

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
    await api.delete(endpoints.materialsPhoto(id))
    currentPhotoUrl.value = null
    ui.toast({type: 'success', text: 'Фото удалено'})
  } catch (e: any) {
    const d = e?.response?.data || {}
    errors.photo = d?.detail || 'Не удалось удалить фото'
  } finally {
    deletingPhoto.value = false
  }
}

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

async function submit() {
  // клиентская валидация до запроса
  for (const k of Object.keys(errors)) (errors as any)[k] = null
  if (!clientValidate()) return

  submitting.value = true
  try {
    const fd = buildFormData()

    let materialId: number
    if (props.initial?.id) {
      await api.patch(`${endpoints.materials}${props.initial.id}/`, fd)
      materialId = props.initial.id
    } else {
      const { data } = await api.post<Material>(endpoints.materials.list, fd)
      materialId = Number((data as any)?.id)
    }

    if (photoFile.value) {
      await uploadPhoto(materialId)
    }

    emit('saved')
  } catch (e: any) {
    const d = e?.response?.data || {}
    // универсальный разбор с поддержкой {errors:{...}}
    errors.name = pickError(d, 'name')
    errors.sku = pickError(d, 'sku')
    errors.category = pickError(d, 'category')
    errors.default_unit = pickError(d, 'default_unit')

    if (!errors.name && !errors.default_unit && d?.detail && typeof d.detail === 'string') {
      // если сервер прислал только detail — покажем его под названием
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
