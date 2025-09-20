<template>
  <div class="filter-panel">
    <div class="filter-header">
      <h2 class="filter-title">
        <svg class="filter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Фильтры и поиск
      </h2>
    </div>
    
    <div class="filter-content">
      <div class="filter-grid" :class="gridClass">
        <slot />
      </div>
      
      <div class="filter-actions">
        <button 
          class="filter-btn filter-btn-outline" 
          @click="$emit('reset')"
          :disabled="loading"
        >
          <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Сбросить фильтры
        </button>
        
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  columns?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  columns: 4,
  loading: false
})

// const emit = defineEmits<{ // Не используется
//   reset: []
// }>()

const gridClass = computed(() => {
  const cols = props.columns
  if (cols === 1) { return 'filter-grid-1' }
  if (cols === 2) { return 'filter-grid-2' }
  if (cols === 3) { return 'filter-grid-3' }
  if (cols === 4) { return 'filter-grid-4' }
  if (cols === 5) { return 'filter-grid-5' }
  if (cols === 6) { return 'filter-grid-6' }
  return 'filter-grid-4'
})
</script>

<style scoped>
.filter-panel {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
}

:root.dark .filter-panel {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.8) 100%);
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.filter-panel::before {
  
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
}

.filter-header {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
  padding: 1rem 1.5rem;
}

:root.dark .filter-header {
  background: linear-gradient(135deg, rgba(51, 65, 85, 0.8) 0%, rgba(71, 85, 105, 0.8) 100%);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

:root.dark .filter-title {
  color: #e2e8f0;
}

.filter-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #3b82f6;
}

.filter-content {
  padding: 1.5rem;
}

.filter-grid {
  display: grid;
  gap: 1rem;
}

.filter-grid-1 {
  grid-template-columns: 1fr;
}

.filter-grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.filter-grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.filter-grid-4 {
  grid-template-columns: repeat(4, 1fr);
}

.filter-grid-5 {
  grid-template-columns: repeat(5, 1fr);
}

.filter-grid-6 {
  grid-template-columns: repeat(6, 1fr);
}

@media (max-width: 1024px) {
  .filter-grid-4,
  .filter-grid-5,
  .filter-grid-6 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .filter-grid-2,
  .filter-grid-3,
  .filter-grid-4,
  .filter-grid-5,
  .filter-grid-6 {
    grid-template-columns: 1fr;
  }
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(59, 130, 246, 0.1);
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: none;
  position: relative;
  overflow: hidden;
}

.filter-btn::before {
  
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.filter-btn:hover::before {
  opacity: 1;
}

.filter-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.filter-btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.filter-btn-outline {
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.filter-btn-outline:hover:not(:disabled) {
  background: #f1f5f9;
  color: #3b82f6;
  border-color: #3b82f6;
  transform: translateY(-1px);
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}
</style>
