<!-- src/pages/Purchases/PurchaseForm.vue -->
<template>
  <form class="grid gap-4" @submit.prevent="submit">
    <div class="grid md:grid-cols-2 gap-4">
      <label class="form-control">
        <span class="label-text text-sm">Дата</span>
        <input v-model="form.date" type="date" class="input input-bordered" required />
        <span v-if="errors.date" class="text-xs text-error mt-1">{{ errors.date }}</span>
      </label>

      <label class="form-control">
        <span class="label-text text-sm">Объект</span>
        <select v-model="form.object" class="select select-bordered" required>
          <option value="" disabled>— выберите объект —</option>
          <option v-for="o in objects" :key="o.id" :value="String(o.id)">{{ o.name }}</option>
        </select>
        <span v-if="errors.object" class="text-xs text-error mt-1">{{ errors.object }}</span>
      </label>

      <label class="form-control">
        <span class="label-text text-sm">Поставщик</span>
        <input v-model.trim="form.supplier" class="input input-bordered" placeholder="ООО Ромашка" />
        <span v-if="errors.supplier" class="text-xs text-error mt-1">{{ errors.supplier }}</span>
      </label>

      <label class="form-control">
        <span class="label-text text-sm">Ответственный</span>
        <select v-model="form.responsible" class="select select-bordered">
          <option value="">— не выбран —</option>
          <option v-for="e in employees" :key="e.id" :value="String(e.id)">{{ e.name }}</option>
        </select>
        <span v-if="errors.responsible" class="text-xs text-error mt-1">{{ errors.responsible }}</span>
      </label>
    </div>

    <label class="form-control">
      <span class="label-text text-sm">Комментарий</span>
      <textarea v-model.trim="form.comment" class="textarea textarea-bordered" rows="3" placeholder="Примечание..."></textarea>
      <span v-if="errors.comment" class="text-xs text-error mt-1">{{ errors.comment }}</span>
    </label>

    <div class="grid gap-2">
      <span class="text-sm">Фото чеков/документов</span>
      <input ref="photosEl" type="file" class="file-input file-input-bordered file-input-sm w-full max-w-md"
             accept="image/*" multiple @change="onPhotosChange" />
      <div class="flex flex-wrap gap-2">
        <div v-for="(url, idx) in previewPhotos" :key="idx" class="w-28 h-28 bg-base-200 rounded-lg overflow-hidden">
          <img :src="url" class="w-full h-full object-cover" alt="photo" />
        </div>
      </div>
      <p class="text-xs opacity-60">Поддерживаются изображения, лимит по размеру — {{ maxPhotoMb }} МБ на файл.</p>
      <span v-if="errors.photos" class="text-xs text-error">{{ errors.photos }}</span>
    </div>

    <div class="flex justify-end gap-2">
      <button type="button" class="btn btn-ghost" @click="$emit('cancel')">Отмена</button>
      <button type="submit" class="btn btn-primary" :disabled="submitting">
        {{ submitting ? 'Сохранение…' : (initial ? 'Сохранить' : 'Создать') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watchEffect } from 'vue'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'

type Obj = { id: number; name: string }
type Emp = { id: number; name: string }

const props = defineProps<{ initial: any | null }>()
const emit = defineEmits<{ (e:'saved'): void; (e:'cancel'): void }>()

const objects = ref<Obj[]>([])
const employees = ref<Emp[]>([])

const form = reactive<{ date: string; object: string; supplier?: string; responsible: string; comment?: string }>({
  date: '', object: '', supplier: '', responsible: '', comment: '',
})
const errors = reactive<Record<string, string | null>>({
  date: null, object: null, supplier: null, responsible: null, comment: null, photos: null
})
const submitting = ref(false)

const photosEl = ref<HTMLInputElement | null>(null)
const photoFiles = ref<File[]>([])
const previewPhotos = ref<string[]>([])
const maxPhotoMb = 8

onMounted(async () => {
  await Promise.all([loadObjects(), loadEmployees()])
  if (!form.date) form.date = new Date().toISOString().slice(0,10)
})

watchEffect(() => {
  if (props.initial) {
    form.date = props.initial.date || new Date().toISOString().slice(0,10)
    form.object = props.initial.object ? String(props.initial.object) : (props.initial.object_id ? String(props.initial.object_id) : '')
    form.supplier = props.initial.supplier || ''
    form.responsible = props.initial.responsible ? String(props.initial.responsible) : (props.initial.responsible_id ? String(props.initial.responsible_id) : '')
    form.comment = props.initial.comment || ''
  } else {
    form.date = new Date().toISOString().slice(0,10)
    form.object = ''; form.supplier = ''; form.responsible = ''; form.comment = ''
  }
  photoFiles.value = []; previewPhotos.value = []
  if (photosEl.value) photosEl.value = null
  for (const k of Object.keys(errors)) (errors as any)[k] = null
})

async function loadObjects() {
  const { data } = await api.get<any>(endpoints.objects)
  objects.value = Array.isArray(data.results) ? data.results : data
}
async function loadEmployees() {
  try {
    const { data } = await api.get<any>('/api/v1/employees/')
    employees.value = Array.isArray(data.results) ? data.results : data
  } catch { employees.value = [] }
}

function onPhotosChange(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  const max = maxPhotoMb * 1024 * 1024
  for (const f of files) {
    if (f.size > max) { errors.photos = `Файл ${f.name} превышает ${maxPhotoMb} МБ`; return }
    if (!f.type.startsWith('image/')) { errors.photos = `Недопустимый тип файла: ${f.name}`; return }
  }
  errors.photos = null
  photoFiles.value = files
  previewPhotos.value = files.map(f => URL.createObjectURL(f))
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

function clientValidate(): boolean {
  let ok = true
  errors.date = null
  errors.object = null
  if (!form.date) { errors.date = 'Укажите дату'; ok = false }
  if (!form.object) { errors.object = 'Выберите объект'; ok = false }
  return ok
}

async function submit() {
  for (const k of Object.keys(errors)) (errors as any)[k] = null
  if (!clientValidate()) return

  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('date', form.date)
    if (form.object) fd.append('object', form.object)
    if (form.supplier) fd.append('supplier', form.supplier)
    if (form.responsible) fd.append('responsible', form.responsible)
    if (form.comment) fd.append('comment', form.comment)

    let id: number
    if (props.initial?.id) {
      await api.patch(`${endpoints.purchases}${props.initial.id}/`, fd)
      id = props.initial.id
    } else {
      const { data } = await api.post<any>(endpoints.purchases, fd)
      id = data?.id
    }

    if (id && photoFiles.value.length) {
      const photosFd = new FormData()
      for (const f of photoFiles.value) photosFd.append('photos', f)
      await api.post(endpoints.purchasePhotos(id), photosFd)
    }

    emit('saved')
  } catch (e: any) {
    const d = e?.response?.data || {}
    errors.date = pickError(d, 'date')
    errors.object = pickError(d, 'object')
    errors.supplier = pickError(d, 'supplier')
    errors.responsible = pickError(d, 'responsible')
    errors.comment = pickError(d, 'comment')
    if (!Object.values(errors).some(Boolean) && d?.detail) errors.date = d.detail
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* no @apply */
</style>
