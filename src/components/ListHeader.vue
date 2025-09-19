<template>
  <div class="list-header">
    <div class="header-content">
      <div class="header-title-section">
        <h1 class="list-title">
          <svg v-if="icon" class="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icon" />
          </svg>
          {{ title }}
        </h1>
        <p v-if="subtitle" class="list-subtitle">{{ subtitle }}</p>
      </div>
      
      <div class="header-actions">
        <slot name="actions" />
        
        <button
          v-if="showCreate && canCreate"
          class="action-btn action-btn-primary"
          @click="$emit('create')"
          :disabled="loading"
        >
          <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ createText }}
        </button>
      </div>
    </div>
    
    <div v-if="showStats" class="header-stats">
      <div class="stat-item">
        <span class="stat-label">Всего записей:</span>
        <span class="stat-value">{{ totalCount }}</span>
      </div>
      <div v-if="filteredCount !== totalCount" class="stat-item">
        <span class="stat-label">На странице:</span>
        <span class="stat-value">{{ filteredCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
  icon?: string
  showCreate?: boolean
  createText?: string
  canCreate?: boolean
  loading?: boolean
  showStats?: boolean
  totalCount?: number
  filteredCount?: number
}

withDefaults(defineProps<Props>(), {
  showCreate: true,
  createText: 'Добавить',
  canCreate: true,
  loading: false,
  showStats: false,
  totalCount: 0,
  filteredCount: 0
})

defineEmits<{
  create: []
}>()
</script>

<style scoped>
.list-header {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
}

.list-header::before {
  
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  gap: 1rem;
}

.header-title-section {
  flex: 1;
  min-width: 0;
}

.list-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.2;
}

.title-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #3b82f6;
  flex-shrink: 0;
}

.list-subtitle {
  margin: 0.5rem 0 0 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.action-btn {
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
  text-decoration: none;
}

.action-btn::before {
  
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.action-btn:hover::before {
  opacity: 1;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.action-btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

.action-btn-outline {
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.action-btn-outline:hover:not(:disabled) {
  background: #f1f5f9;
  color: #3b82f6;
  border-color: #3b82f6;
  transform: translateY(-1px);
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

.header-stats {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-top: 1px solid rgba(59, 130, 246, 0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.stat-value {
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 600;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .header-actions {
    justify-content: flex-end;
  }
  
  .header-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
