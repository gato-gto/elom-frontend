<template>
  <div class="category-card">
    <div class="card-header">
      <div class="category-icon">
        <div class="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl border flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
      </div>
      <div class="category-info">
        <h3 class="category-name">{{ category.name }}</h3>
        <p v-if="category.parent_name" class="category-parent">
          Родительская: {{ category.parent_name }}
        </p>
        <p v-else class="category-parent">Корневая категория</p>
      </div>
    </div>
    
    <div class="card-stats">
      <div class="stat-item">
        <div class="stat-icon">
          <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ category.materials_count }}</span>
          <span class="stat-label">материалов</span>
        </div>
      </div>
      
      <div class="stat-item">
        <div class="stat-icon">
          <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ category.children_count }}</span>
          <span class="stat-label">подкатегорий</span>
        </div>
      </div>
    </div>
    
    <div class="card-actions">
      <button 
        class="action-btn action-btn-ghost"
        @click="$emit('view', category)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Просмотр
      </button>
      
      <button 
        class="action-btn action-btn-outline"
        @click="$emit('edit', category)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Редактировать
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MaterialCategory } from '@/api/types'

interface Props {
  category: MaterialCategory
}

defineProps<Props>()

defineEmits<{
  view: [category: MaterialCategory]
  edit: [category: MaterialCategory]
  delete: [category: MaterialCategory]
}>()
</script>

<style scoped>
.category-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

:root.dark .category-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.8) 100%);
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.category-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

:root.dark .category-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.category-icon {
  flex-shrink: 0;
}

.category-info {
  flex: 1;
  min-width: 0;
}

.category-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

:root.dark .category-name {
  color: #e2e8f0;
}

.category-parent {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

:root.dark .category-parent {
  color: #94a3b8;
}

.card-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 0.75rem;
  border: 1px solid rgba(59, 130, 246, 0.1);
}

:root.dark .card-stats {
  background: linear-gradient(135deg, rgba(51, 65, 85, 0.8) 0%, rgba(71, 85, 105, 0.8) 100%);
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.stat-icon {
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

:root.dark .stat-value {
  color: #e2e8f0;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

:root.dark .stat-label {
  color: #94a3b8;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: none;
  position: relative;
  overflow: hidden;
  flex: 1;
  justify-content: center;
}

.action-btn::before {
  content: '';
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

.action-btn-ghost {
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.action-btn-ghost:hover {
  background: #f1f5f9;
  color: #3b82f6;
  border-color: #3b82f6;
  transform: translateY(-1px);
}

:root.dark .action-btn-ghost {
  color: #94a3b8;
  border-color: #475569;
}

:root.dark .action-btn-ghost:hover {
  background: rgba(51, 65, 85, 0.8);
  color: #60a5fa;
  border-color: #60a5fa;
}

.action-btn-outline {
  background: transparent;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.action-btn-outline:hover {
  background: #3b82f6;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

:root.dark .action-btn-outline {
  color: #60a5fa;
  border-color: #60a5fa;
}

:root.dark .action-btn-outline:hover {
  background: #60a5fa;
  color: #1e293b;
}
</style>
