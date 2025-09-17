<template>
  <div class="grid md:grid-cols-2 gap-6">
    <div class="card bg-white border">
      <div class="card-body">
        <h2 class="card-title text-lg">Состояние API</h2>
        <pre class="bg-gray-50 rounded-xl p-3 text-sm overflow-auto">{{ health }}</pre>
        <button class="btn btn-outline mt-3" @click="load">Обновить</button>
      </div>
    </div>

    <div class="card bg-white border">
      <div class="card-body">
        <h2 class="card-title text-lg">Текущий пользователь</h2>
        <pre class="bg-gray-50 rounded-xl p-3 text-sm overflow-auto">{{ me }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue'
import api from '@/api/client'
import endpoints from '@/api/endpoints'

const health = ref<any>(null)
const me = ref<any>(null)

async function load() {
  try {
    const h = await api.get(endpoints.health)
    health.value = h.data
  } catch {
    health.value = {ok: false}
  }
  try {
    const u = await api.get(endpoints.users.me)
    me.value = u.data
  } catch {
    me.value = null
  }
}

onMounted(load)
</script>

