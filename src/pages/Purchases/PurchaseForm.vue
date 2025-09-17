<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">{{ isEdit ? 'Редактировать закупку' : 'Новая закупка' }}</h1>
      <div class="flex gap-2">
        <RouterLink class="btn btn-ghost" to="/purchases">К списку</RouterLink>
        <button class="btn btn-primary" :disabled="saving" @click="onSubmit">
          {{ saving ? 'Сохранение…' : 'Сохранить' }}
        </button>
      </div>
    </div>

    <div v-if="formError" class="alert alert-error"><span>{{ formError }}</span></div>

    <!-- Шапка -->
    <div class="card bg-white border">
      <div class="card-body grid md:grid-cols-4 gap-4">
        <fieldset class="fieldset">
          <span class="label-text">Дата*</span>
          <input v-model="model.date" type="date" class="input input-bordered" required/>
        </fieldset>
        <fieldset class="fieldset">
          <span class="label-text">Объект*</span>
          <select v-model.number="model.object" class="select select-bordered" required>
            <option :value="undefined" disabled>Выберите объект</option>
            <option v-for="o in objects" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <span class="label-text">Ответственный</span>
          <select v-model.number="model.responsible" class="select select-bordered">
            <option :value="undefined">Не указан</option>
            <option v-for="e in employees" :key="e.id" :value="e.id">
              {{ e.first_name || e.username }} {{ e.last_name || '' }}
            </option>
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <span class="label-text">Поставщик</span>
          <input v-model.trim="model.supplier" class="input input-bordered" placeholder="ИП Иванов"/>
        </fieldset>

        <fieldset class="fieldset">
          <span class="label-text">№ накладной/чека</span>
          <input v-model.trim="model.invoice_number" class="input input-bordered" placeholder="A-12345"/>
        </fieldset>

        <fieldset class="fieldset">
          <span class="label-text">НДС включён?</span>
          <select v-model="model.vat_included" class="select select-bordered">
            <option :value="undefined">Не указано</option>
            <option :value="true">Да</option>
            <option :value="false">Нет</option>
          </select>
        </fieldset>

        <fieldset class="fieldset w-100 md:col-span-2">
          <label class="label"><span class="label-text">Комментарий</span></label>
          <textarea v-model.trim="model.comment" class="textarea input" rows="1"/>
        </fieldset>
      </div>
    </div>

    <!-- Позиции -->
    <div class="card bg-white border">
      <div class="card-body">
        <div class="flex items-center justify-between mb-2">
          <h2 class="card-title text-lg">Позиции</h2>
          <button class="btn btn-sm" @click="addItem">Добавить позицию</button>
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
                <select v-model.number="it.unit" class="select select-bordered select-sm w-full">
                  <option :value="undefined">—</option>
                  <option v-for="u in units" :key="u.id" :value="u.id">{{ u.code ?? u.id }} — {{ u.name }}</option>
                </select>
              </td>
              <td>
                <input v-model="it.quantity" type="number" step="0.001" min="0" class="input input-bordered input-sm w-full" @input="recalc(it)"/>
              </td>
              <td>
                <input v-model="it.price" type="number" step="0.01" min="0" class="input input-bordered input-sm w-full" @input="recalc(it)"/>
              </td>
              <td class="text-right">{{ it.amount }}</td>
              <td class="text-right">
                <button class="btn btn-xs btn-ghost" @click="duplicateItem(idx)">Дублировать</button>
                <button class="btn btn-xs btn-error" @click="removeItem(idx)">Удалить</button>
              </td>
            </tr>
            <tr v-if="items.length===0">
              <td colspan="6" class="text-center text-gray-700-60">Добавьте хотя бы одну позицию</td>
            </tr>
            </tbody>
            <tfoot>
            <tr>
              <th colspan="4" class="text-right">Итого</th>
              <th class="text-right">{{ totalAmount }}</th>
              <th/>
            </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- Фото -->
    <div class="card bg-white border">
      <div class="card-body">
        <h2 class="card-title text-lg">Фото и документы</h2>
        <input type="file" class="file-input file-input-bordered w-full max-w-md" multiple @change="onPhotos"/>
        <div class="mt-3 flex flex-wrap gap-2">
          <div v-for="(f, i) in newPhotos" :key="i" class="avatar">
            <div class="w-16 rounded">
              <img :src="toObjectUrl(f)"/>
            </div>
          </div>
        </div>
        <p class="text-xs text-gray-700-60 mt-2">Фото загрузятся после сохранения закупки.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref, computed} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {
  Employee, Material, SiteObject, PageResponse, Purchase, PurchaseRequest, PatchedPurchaseRequest, PurchaseItemRequest, Unit
} from '@/api/types'

const route = useRoute()
const router = useRouter()
const idParam = route.params.id ? Number(route.params.id) : null
const isEdit = !!idParam

const saving = ref(false)
const formError = ref<string | null>(null)

const model = reactive<Partial<Purchase>>({
  date: new Date().toISOString().slice(0, 10),
  object: undefined as any,
  supplier: '',
  invoice_number: '',
  vat_included: undefined,
  comment: '',
  responsible: undefined as any,
})

type ItemForm = {
  _k: number
  material?: number
  unit?: number
  quantity: string // decimal-as-string
  price: string    // decimal-as-string | empty
  amount: string   // decimal-as-string
}
const items = ref<ItemForm[]>([])

const objects = ref<SiteObject[]>([])
const employees = ref<Employee[]>([])
const materials = ref<Material[]>([])
const units = ref<Unit[]>([])

function addItem() {
  items.value.push({_k: Date.now() + Math.random(), material: undefined, unit: undefined, quantity: '0', price: '0', amount: '0'})
}

function removeItem(idx: number) {
  items.value.splice(idx, 1)
}

function duplicateItem(idx: number) {
  const src = items.value[idx]
  items.value.splice(idx + 1, 0, {...src, _k: Date.now() + Math.random()})
}

function recalc(it: ItemForm) {
  const q = Number(it.quantity || '0')
  const p = Number(it.price || '0')
  const a = (isFinite(q) ? q : 0) * (isFinite(p) ? p : 0)
  it.amount = a.toFixed(2)
}

function onMaterialChange(it: ItemForm) {
  // дефолтная единица = unit материала (если есть и если в позиции пусто)
  const m = materials.value.find(x => x.id === it.material)
  if (m && !it.unit) it.unit = m.default_unit
}

function toObjectUrl(f: File) {
  return URL.createObjectURL(f)
}

const newPhotos = ref<File[]>([])

function onPhotos(e: Event) {
  const input = e.target as HTMLInputElement
  if (input?.files?.length) newPhotos.value = Array.from(input.files)
}

const totalAmount = computed(() => {
  const sum = items.value.reduce((acc, it) => acc + Number(it.amount || '0'), 0)
  return sum.toFixed(2)
})

async function loadRefs() {
  const [od, ed, md, ud] = await Promise.all([
    api.get<PageResponse<SiteObject>>(endpoints.objects.list + buildQuery({page_size: 1000, ordering: 'name'})),
    api.get<PageResponse<Employee>>(endpoints.employees.list + buildQuery({page_size: 1000, ordering: 'username'})),
    api.get<PageResponse<Material>>(endpoints.materials.list + buildQuery({page_size: 1000, ordering: 'name'})),
    api.get<PageResponse<Unit>>(endpoints.units.list + buildQuery({page_size: 1000, ordering: 'code'})),
  ])
  objects.value = od.data.results
  employees.value = ed.data.results
  materials.value = md.data.results
  units.value = ud.data.results
}

async function loadIfEdit() {
  if (!isEdit) return
  const {data} = await api.get<Purchase>(endpoints.purchases.one(idParam!))
  // шапка
  model.date = data.date
  model.object = data.object
  model.supplier = data.supplier ?? ''
  model.invoice_number = data.invoice_number ?? ''
  model.vat_included = data.vat_included
  model.comment = data.comment ?? ''
  model.responsible = data.responsible ?? undefined

  // позиции → строки
  items.value = (data.items ?? []).map((x) => ({
    _k: Date.now() + Math.random(),
    material: x.material,
    unit: x.unit,
    quantity: String(x.quantity ?? 0),
    price: String(x.price ?? 0),
    amount: String(x.amount ?? (Number(x.quantity ?? 0) * Number(x.price ?? 0))),
  }))
}

async function onSubmit() {
  formError.value = null
  if (!model.date || !model.object) {
    formError.value = 'Заполните дату и объект'
    return
  }
  if (items.value.length === 0) {
    formError.value = 'Добавьте хотя бы одну позицию'
    return
  }

  saving.value = true
  try {
    // Готовим DTO для серверной модели
    const payloadItems: PurchaseItemRequest[] = items.value.map(it => ({
      material: it.material!,
      unit: it.unit!,
      quantity: String(Number(it.quantity || 0)),
      price: it.price !== '' ? String(Number(it.price)) : undefined,
    }))

    let id = idParam
    if (isEdit) {
      const payload: PatchedPurchaseRequest = {
        date: model.date!,
        object: model.object!,
        supplier: model.supplier || undefined,
        invoice_number: model.invoice_number || undefined,
        vat_included: model.vat_included,
        comment: model.comment || undefined,
        responsible: model.responsible ?? undefined,
        items: payloadItems,
      }
      const {data} = await api.patch<Purchase>(endpoints.purchases.one(idParam!), payload)
      id = data.id
    } else {
      const payload: PurchaseRequest = {
        date: model.date!,
        object: model.object!,
        supplier: model.supplier || '',
        invoice_number: model.invoice_number || undefined,
        vat_included: model.vat_included,
        comment: model.comment || undefined,
        responsible: model.responsible!,
        items: payloadItems,
      }
      const {data} = await api.post<Purchase>(endpoints.purchases.list, payload)
      id = data.id
    }

    // Фото после сохранения
    if (newPhotos.value.length && id) {
      const fd = new FormData()
      newPhotos.value.forEach(f => fd.append('photos[]', f))
      await api.post(endpoints.purchases.uploadPhoto(id), fd)
    }

    await router.replace(`/purchases/${id}`)
  } catch (e: any) {
    formError.value = e?.response?.data?.detail || 'Ошибка сохранения'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadRefs()
  await loadIfEdit()
  if (!isEdit && items.value.length === 0) addItem()
})
</script>

