<!--
  🎬 Универсальный компонент для анимированных таблиц
  Предоставляет единообразные анимации для всех таблиц в приложении
-->
<template>
  <div class="animated-table-container" :class="{ 'relative': loading }">
    <!-- Loading Overlay для первой загрузки -->
    <LoadingSpinner 
      v-if="loading && items.length === 0"
      :size="spinnerSize"
      :variant="spinnerVariant"
      :text="loadingText"
      :overlay="false"
    />
    
    <!-- Loading Overlay для обновления данных -->
    <div v-if="loading && items.length > 0" class="loading-overlay">
      <LoadingSpinner 
        :size="spinnerSize"
        :variant="spinnerVariant"
        :text="updatingText"
        :overlay="true"
      />
    </div>

    <table class="modern-table">
      <thead>
        <slot name="header" />
      </thead>
      
      <!-- Skeleton Loading -->
      <TableSkeleton 
        v-if="loading && items.length === 0"
        :rows="skeletonRows"
        :columns="skeletonColumns"
      />
      
      <!-- Actual Data -->
      <tbody v-else>
        <slot name="body" :items="items" />
        
        <!-- Empty State -->
        <tr v-if="!loading && items.length === 0">
          <td :colspan="skeletonColumns" class="text-center text-gray-500 py-8">
            <div class="flex flex-col items-center gap-2 empty-state">
              <slot name="empty-icon">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </slot>
              <span class="text-sm">
                <slot name="empty-text">
                  Нет данных
                </slot>
              </span>
            </div>
          </td>
        </tr>
      </tbody>
      
      <!-- Footer -->
      <tfoot v-if="$slots.footer">
        <slot name="footer" />
      </tfoot>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'
import TableSkeleton from './TableSkeleton.vue'

interface Props {
  items: any[]
  loading: boolean
  skeletonRows?: number
  skeletonColumns: number
  spinnerSize?: 'sm' | 'md' | 'lg'
  spinnerVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  loadingText?: string
  updatingText?: string
}

const props = withDefaults(defineProps<Props>(), {
  skeletonRows: 5,
  spinnerSize: 'lg',
  spinnerVariant: 'primary',
  loadingText: 'Загрузка данных...',
  updatingText: 'Обновление данных...'
})

// Computed свойства
const hasData = computed(() => props.items.length > 0)
const showSkeleton = computed(() => props.loading && !hasData.value)
const showOverlay = computed(() => props.loading && hasData.value)
</script>

<style scoped>
.animated-table-container {
  position: relative;
}

/* Импорт универсальных анимаций */
@import '@/styles/animations.css';
</style>
