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

    <!-- Ошибки -->
    <div v-if="formError" class="alert alert-error">
      <span>{{ formError }}</span>
    </div>

    <!-- Шапка -->
    <div class="card bg-base-100 border">
      <div class="card-body grid md:grid-cols-4 gap-4">
        <fieldset class="fieldset">
          <legend class="fieldset-legend sr-only">Основные поля</legend>
          <label class="label" for="p-date"><span class="label-text">Дата*</span></label>
          <input id="p-date" v-model="model.date" type="date" class="input input-bordered input-sm" required />
        </fieldset>

        <fieldset class="fieldset">
          <label class="label" for="p-object"><span class="label-text">Объект*</span></label>
          <select id="p-object" v-model.number="model.object" class="select select-bordered select-sm" required>
            <option :value="undefined" disabled>Выберите объект</option>
            <option v-for="o in objects" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
        </fieldset>

        <fieldset class="fieldset">
          <label class="label" for="p-resp"><span class="label-text">Ответственный*</span></label>
          <select id="p-resp" v-model.number="model.responsible" class="select select-bordered select-sm" required>
            <option :value="undefined" disabled>Выберите сотрудника</option>
            <option v-for="e in employees" :key="e.id" :value="e.id">
              {{ e.first_name || e.username }} {{ e.last_name || '' }}
            </option>
          </select>
        </fieldset>

        <fieldset class="fieldset">
          <label class="label" for="p-supplier"><span class="label-text">Поставщик</span></label>
          <input id="p-supplier" v-model.trim="model.supplier" class="input input-bordered input-sm" placeholder="ИП Иванов" />
        </fieldset>

        <fieldset class="fieldset">
          <label class="label" for="p-invoice"><span class="label-text">№ накладной/чека</span></label>
          <input id="p-invoice" v-model.trim="model.invoice_number" class="input input-bordered input-sm" placeholder="A-12345" />
        </fieldset>

        <fieldset class="fieldset">
          <label class="label" for="p-vat"><span class="label-text">НДС включён?</span></label>
          <select id="p-vat" v-model="model.vat_included" class="select select-bordered select-sm">
            <option :value="undefined">Не указано</option>
            <option :value="true">Да</option>
            <option :value="false">Нет</option>
          </select>
        </fieldset>

        <fieldset class="fieldset md:col-span-4">
          <label class="label" for="p-comment"><span class="label-text">Комментарий</span></label>
          <textarea id="p-comment" v-model.trim="model.comment" class="textarea textarea-bordered textarea-sm w-full" rows="2" />
<!--          <label class="label"><span class="label-text-alt text-base-content/60">Необязательно</span></label>-->
        </fieldset>
      </div>
    </div>


    <!-- Позиции -->
    <div class="card bg-base-100 border">
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
                  <option v-for="u in units" :key="u.id" :value="u.id">
                    {{ u.code }} — {{ u.name }}
                  </option>
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
              <td colspan="6" class="text-center text-base-content/60">Добавьте хотя бы одну позицию</td>
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
    <div class="card bg-base-100 border">
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
        <p class="text-xs text-base-content/60 mt-2">Фото загрузятся после сохранения закупки.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref, computed} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {Employee, Material, ObjectLite, PageResponse, Purchase, Unit} from '@/api/types'

const route = useRoute()
const router = useRouter()
const idParam = route.params.id ? Number(route.params.id) : null
const isEdit = !!idParam

const saving = ref(false)
const formError = ref<string | null>(null)

const model = reactive<Partial<Purchase>>({
  date: new Date().toISOString().slice(0, 10),
  object: undefined,
  supplier: '',
  invoice_number: '',
  vat_included: undefined,
  comment: '',
  responsible: undefined,
})

type ItemForm = {
  _k: number
  material?: number
  unit?: number
  quantity: string // decimal-as-string
  price: string    // decimal-as-string
  amount: string   // decimal-as-string
}
const items = ref<ItemForm[]>([])

const objects = ref<ObjectLite[]>([])
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
  // при выборе материала подставляем дефолтную единицу, если пусто
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
    api.get<PageResponse<ObjectLite>>(endpoints.objects.list + buildQuery({page_size: 1000})),
    api.get<PageResponse<Employee>>(endpoints.employees.list + buildQuery({page_size: 1000})),
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
  // заполняем шапку
  model.date = data.date
  model.object = data.object
  model.supplier = data.supplier
  model.invoice_number = data.invoice_number
  model.vat_included = data.vat_included
  model.comment = data.comment
  model.responsible = data.responsible
  // заполняем позиции
  items.value = data.items.map((x) => ({
    _k: Date.now() + Math.random(),
    material: x.material,
    unit: x.unit,
    quantity: x.quantity,
    price: x.price,
    amount: x.amount,
  }))
}

async function onSubmit() {
  formError.value = null
  if (!model.date || !model.object || !model.responsible) {
    formError.value = 'Заполните дату, объект и ответственного'
    return
  }
  if (items.value.length === 0) {
    formError.value = 'Добавьте хотя бы одну позицию'
    return
  }

  saving.value = true
  try {
    const payload = {
      date: model.date,
      object: model.object,
      supplier: model.supplier || undefined,
      invoice_number: model.invoice_number || undefined,
      vat_included: model.vat_included,
      comment: model.comment || undefined,
      responsible: model.responsible,
      items: items.value.map(it => ({
        material: it.material!,
        unit: it.unit!,
        quantity: it.quantity,
        price: it.price,
      })),
    }

    let id = idParam
    if (isEdit) {
      const {data} = await api.patch<Purchase>(endpoints.purchases.one(idParam!), payload)
      id = data.id
    } else {
      const {data} = await api.post<Purchase>(endpoints.purchases.list, payload)
      id = data.id
    }

    // Фото
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
