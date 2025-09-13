<!--
  - Path: C:/Users/HVC/WebstormProjects/elom-frontend/src/pages/Items/Edit.vue
  - File: Edit.vue
  - Project: elom-frontend
  -
  -->

<template>
  <div class="space-y-4" v-if="item">
    <div class="card p-5">
      <h2 class="text-lg font-semibold mb-4">Редактирование: {{ item.name }}</h2>
      <form @submit.prevent="save">
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="label">Название</label>
            <input class="input" v-model="item.name" required/>
          </div>
          <div>
            <label class="label">SKU</label>
            <input class="input" v-model="item.sku"/>
          </div>
          <div>
            <label class="label">Ед. изм.</label>
            <input class="input" v-model="item.unit"/>
          </div>
          <div>
            <label class="label">Фото</label>
            <input type="file" @change="onFile" accept="image/*"/>
            <div v-if="newPhoto" class="mt-2">
              <img :src="URL.createObjectURL(newPhoto)" class="h-20 rounded-lg border"/>
            </div>
          </div>
        </div>
        <div class="mt-4">
          <button class="btn">Сохранить</button>
          <router-link class="btn ml-2 bg-gray-500 hover:bg-gray-600" to="/items">Назад</router-link>
        </div>
      </form>
      <p class="text-sm text-red-600 mt-2" v-if="error">{{ error }}</p>
    </div>
  </div>
</template>
<script setup lang="ts">
const URL = window.URL;
import {ref, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import api from '@/api/client'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)
const item = ref<any>(null)
const newPhoto = ref<File | null>(null)
const error = ref('')

function onFile(e: Event) {
  const input = e.target as HTMLInputElement;
  newPhoto.value = input.files?.[0] || null
}

async function load() {
  const {data} = await api.get(`/items/${id}/`);
  item.value = data
}

const saving = ref(false)

async function save() {
  try {
    const fd = new FormData()
    fd.append('name', item.value.name || '')
    fd.append('sku', item.value.sku || '')
    fd.append('unit', item.value.unit || 'шт')
    if (newPhoto.value) fd.append('photo', newPhoto.value)
    await api.patch(`/items/${id}/`, fd, {headers: {'Content-Type': 'multipart/form-data'}})
    await router.push({name: 'items'})
  } catch (e: any) {
    error.value = e?.response?.data?.detail || 'Ошибка сохранения'
  } finally {
    saving.value = false
  }

}

onMounted(load)
</script>
