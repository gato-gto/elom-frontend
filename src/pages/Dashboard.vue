<!-- src/pages/Dashboard.vue -->
<template>
  <div class="grid md:grid-cols-2 gap-6">
    <div class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg">Состояние API</h2>
        <pre class="bg-base-200 rounded-xl p-3 text-sm overflow-auto">{{ health }}</pre>
        <button class="btn btn-outline mt-3" @click="load">Обновить</button>
      </div>
    </div>

    <div class="card bg-base-100 border">
      <div class="card-body">
        <h2 class="card-title text-lg">Текущий пользователь</h2>
        <pre class="bg-base-200 rounded-xl p-3 text-sm overflow-auto">{{ me }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue'
import api from '@/api/client'
import {endpoints} from '@/api/endpoints'

const health = ref<any>(null)
const me = ref<any>(null)

async function load() {
  const h = await api.get(endpoints.health);
  health.value = h.data
  const u = await api.get(endpoints.auth.me);
  me.value = u.data
}

onMounted(load)
</script>

<style scoped>
/* no @apply */
</style>
