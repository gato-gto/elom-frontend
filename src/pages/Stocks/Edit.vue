<template>
  <div class="page-container">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Редактировать движение остатков</h1>
        <div class="text-sm breadcrumbs">
          <ul>
            <li><router-link to="/stocks" class="text-primary hover:text-primary-focus">Остатки</router-link></li>
            <li>Редактировать</li>
          </ul>
        </div>
      </div>
      <router-link to="/stocks" class="btn btn-outline">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Назад к списку
      </router-link>
    </div>

    <!-- Error message -->
    <div v-if="error" class="alert alert-error mb-4">
      <span>{{ error }}</span>
    </div>

    <!-- Loading -->
    <LoadingSpinner 
      v-if="loadingStock"
      size="lg"
      variant="primary"
      text="Загрузка данных движения..."
      :overlay="false"
    />

    <!-- Form -->
    <div v-else-if="stockSnapshot" class="max-w-4xl mx-auto">
      <StockForm 
        :initial="stockSnapshot" 
        @saved="onSaved" 
        @cancel="onCancel" 
      />
    </div>

    <!-- Not found -->
    <div v-else class="text-center py-12">
      <div class="flex flex-col items-center gap-4">
        <svg class="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div class="text-gray-500">
          <h3 class="text-lg font-medium mb-2">Движение не найдено</h3>
          <p class="text-sm">Движение с указанным ID не существует или было удалено</p>
        </div>
        <router-link to="/stocks" class="btn btn-primary">
          Назад к списку
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStockSnapshotsStore } from '@/stores/stockSnapshots'
import { useUiStore } from '@/stores/ui'
import type { StockSnapshot } from '@/api/types'
import StockForm from './StockForm.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { ErrorHandlers } from '@/utils/errorHandler'

const route = useRoute()
const router = useRouter()
const stockSnapshotsStore = useStockSnapshotsStore
const ui = useUiStore()

const stockSnapshot = ref<StockSnapshot | null>(null)
const loadingStock = ref(false)
const error = ref<string | null>(null)

async function loadStockSnapshot() {
  const id = parseInt(route.params.id as string)
  
  if (isNaN(id)) {
    error.value = 'Некорректный ID движения'
    return
  }
  
  loadingStock.value = true
  error.value = null
  
  try {
    stockSnapshot.value = await stockSnapshotsStore.fetchOne(id)
  } catch (err: any) {
    const errorResult = await ErrorHandlers.formValidation(err)
    error.value = errorResult.detail
    console.error('Error loading stock snapshot:', err)
  } finally {
    loadingStock.value = false
  }
}

function onSaved() {
  ui.toast({ 
    type: 'success', 
    text: 'Движение остатков успешно обновлено' 
  })
  router.push('/stocks')
}

function onCancel() {
  router.push('/stocks')
}

onMounted(() => {
  loadStockSnapshot()
})
</script>

<style scoped>
.page-container {
  padding: 1rem;
  max-width: none;
}

@media (min-width: 768px) {
  .page-container {
    padding: 1.5rem;
  }
}
</style>
