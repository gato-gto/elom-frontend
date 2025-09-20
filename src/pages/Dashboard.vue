<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Дашборд</h1>
        <p class="text-gray-600 mt-1">Обзор системы управления материалами и закупками</p>
      </div>
      <button 
        class="btn btn-outline btn-sm"
        @click="load"
        :disabled="loading"
      >
        <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {{ loading ? 'Обновление...' : 'Обновить' }}
      </button>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Materials Count -->
      <div class="card bg-base-100 border">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Материалы</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.materials || 0 }}</p>
            </div>
            <div class="p-3 bg-blue-100 rounded-full">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div class="mt-2">
            <router-link to="/materials" class="text-sm text-blue-600 hover:text-blue-800">
              Посмотреть все →
            </router-link>
          </div>
        </div>
      </div>

      <!-- Purchases Count -->
      <div class="card bg-base-100 border">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Закупки</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.purchases || 0 }}</p>
            </div>
            <div class="p-3 bg-green-100 rounded-full">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </div>
          </div>
          <div class="mt-2">
            <router-link to="/purchases" class="text-sm text-green-600 hover:text-green-800">
              Посмотреть все →
            </router-link>
          </div>
        </div>
      </div>

      <!-- Objects Count -->
      <div class="card bg-base-100 border">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Объекты</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.objects || 0 }}</p>
            </div>
            <div class="p-3 bg-purple-100 rounded-full">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div class="mt-2">
            <router-link to="/objects" class="text-sm text-purple-600 hover:text-purple-800">
              Посмотреть все →
            </router-link>
          </div>
        </div>
      </div>

      <!-- Stocks Count -->
      <div class="card bg-base-100 border">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Движения</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.stocks || 0 }}</p>
            </div>
            <div class="p-3 bg-orange-100 rounded-full">
              <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div class="mt-2">
            <router-link to="/stocks" class="text-sm text-orange-600 hover:text-orange-800">
              Посмотреть все →
            </router-link>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue'
import api from '@/api/client'
import endpoints from '@/api/endpoints'

const loading = ref(false)
const stats = ref({
  materials: 0,
  purchases: 0,
  objects: 0,
  stocks: 0
})

async function load() {
  loading.value = true
  
  try {
    // Load statistics
    const [materialsRes, purchasesRes, objectsRes, stocksRes] = await Promise.allSettled([
      api.get(endpoints.materials.list),
      api.get(endpoints.purchases.list),
      api.get(endpoints.objects.list),
      api.get(endpoints.stockSnapshots.list)
    ])

    if (materialsRes.status === 'fulfilled') {
      stats.value.materials = materialsRes.value.data.count || 0
    }
    if (purchasesRes.status === 'fulfilled') {
      stats.value.purchases = purchasesRes.value.data.count || 0
    }
    if (objectsRes.status === 'fulfilled') {
      stats.value.objects = objectsRes.value.data.count || 0
    }
    if (stocksRes.status === 'fulfilled') {
      stats.value.stocks = stocksRes.value.data.count || 0
    }
  } catch (error) {
    console.error('Error loading statistics:', error)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>


