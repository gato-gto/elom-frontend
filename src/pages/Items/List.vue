<!--
  - Path: C:/Users/HVC/WebstormProjects/elom-frontend/src/pages/Items/List.vue
  - File: List.vue
  - Project: elom-frontend
  -
  -->


<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <input class="input max-w-sm" v-model="search" placeholder="Поиск по названию или SKU" @keyup.enter="load"/>
      <button class="btn" @click="load">Искать</button>
      <button class="btn" @click="openCreate">Добавить</button>
    </div>
    <div class="card overflow-hidden">
      <table class="table">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-2 text-left">Фото</th>
          <th class="px-4 py-2 text-left">Название</th>
          <th class="px-4 py-2">SKU</th>
          <th class="px-4 py-2">Ед.</th>
          <th class="px-4 py-2"></th>
        </tr>
        </thead>
        <TransitionGroup name="list" tag="tbody" class="divide-y divide-gray-200">
          <tr v-for="it in items" :key="it.id">
            <td class="px-4 py-2">
              <img v-if="it.photo_url" :src="it.photo_url" class="h-10 w-10 object-cover rounded-lg border"/>
            </td>
            <td class="px-4 py-2">{{ it.name }}</td>
            <td class="px-4 py-2 text-center">{{ it.sku }}</td>
            <td class="px-4 py-2 text-center">{{ it.unit }}</td>
            <td class="px-4 py-2 text-right">
              <router-link :to="{ name:'item-edit', params:{ id: it.id } }" class="text-emerald-700 hover:underline">Редактировать</router-link>
            </td>
          </tr>
        </TransitionGroup>
      </table>
    </div>

    <div v-if="showCreate" class="card p-5">
      <h3 class="text-lg font-semibold mb-3">Новый материал</h3>
      <form @submit.prevent="create">
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="label">Название</label>
            <input class="input" v-model="form.name" required/>
          </div>
          <div>
            <label class="label">SKU</label>
            <input class="input" v-model="form.sku"/>
          </div>
          <div>
            <label class="label">Ед. изм.</label>
            <input class="input" v-model="form.unit" placeholder="шт"/>
          </div>
          <div>
            <label class="label">Фото</label>
            <input type="file" @change="onFile" accept="image/*"/>
          </div>
        </div>
        <div class="mt-4">
          <button class="btn">Сохранить</button>
          <button type="button" class="btn ml-2 bg-gray-500 hover:bg-gray-600" @click="showCreate=false">Отмена</button>
        </div>
      </form>
      <p class="text-sm text-red-600 mt-2" v-if="error">{{ error }}</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import {ref, onMounted, watch} from 'vue'
import {useDebounceFn} from '@vueuse/core'
import api from '@/api/client'
import {useUiStore} from '@/stores/ui'

const ui = useUiStore()
const items = ref<any[]>([])
const search = ref('')
const showCreate = ref(false)
const error = ref('')
const form = ref({name: '', sku: '', unit: 'шт', photo: null as File | null})

function openCreate() {
  showCreate.value = true
}


const load = async () => {
  const params: any = {};
  if (search.value) params.search = search.value
  const {data} = await api.get('/items', {params})
  items.value = data.results || data
}

const debouncedLoad = useDebounceFn(load, 300)   // 300мс задержка

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  form.value.photo = input.files?.[0] || null
}

async function create() {
  error.value = ''
  try {
    const fd = new FormData()
    fd.append('name', form.value.name)
    if (form.value.sku) fd.append('sku', form.value.sku)
    if (form.value.unit) fd.append('unit', form.value.unit)
    if (form.value.photo) fd.append('photo', form.value.photo)
    await api.post('/items/', fd, {headers: {'Content-Type': 'multipart/form-data'}})
    ui.toast({type: 'success', text: 'Материал создан'})
    showCreate.value = false
    form.value = {name: '', sku: '', unit: 'шт', photo: null}
    await load()
  } catch (e: any) {
    error.value = e?.response?.data?.detail || 'Ошибка сохранения'
  }
}


watch(search, () => debouncedLoad())             // реагируем на ввод
onMounted(load)
onMounted(load)
</script>

<style>
.list-enter-active, .list-leave-active {
  transition: all .15s ease
}

.list-enter-from {
  opacity: 0;
  transform: translateY(4px)
}

.list-leave-to {
  opacity: 0;
  transform: translateY(4px)
}
</style>