<template>
  <MobileCard
    :title="category.name"
    :badge="category.parent_name || 'Корневая категория'"
    badge-class="badge-secondary"
    :actions="actions"
    @action="$emit('action', $event)"
  >
    <template #content>
      <div class="space-y-2 text-sm">
        <div v-if="category.parent_name">
          <span class="text-muted">Родительская категория:</span>
          <span class="font-medium ml-2">{{ category.parent_name }}</span>
        </div>
        <div v-else>
          <span class="text-muted">Тип:</span>
          <span class="font-medium ml-2">Корневая категория</span>
        </div>
        
        <div class="flex items-center gap-4 mt-3 pt-3 border-t border-base-300">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <div class="flex flex-col">
              <span class="text-xs text-muted">Материалов</span>
              <span class="font-semibold font-mono">{{ category.materials_count }}</span>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <div class="flex flex-col">
              <span class="text-xs text-muted">Подкатегорий</span>
              <span class="font-semibold font-mono">{{ category.children_count }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="category.full_path" class="mt-2">
          <span class="text-muted">Полный путь:</span>
          <span class="font-medium ml-2 text-xs font-mono">{{ category.full_path }}</span>
        </div>
      </div>
    </template>
    
    <template #extra>
      <div class="flex justify-between items-center text-xs text-muted">
        <span>Создано: {{ formatDate(category.created_at) }}</span>
        <span v-if="category.updated_at !== category.created_at">
          Обновлено: {{ formatDate(category.updated_at) }}
        </span>
      </div>
    </template>
  </MobileCard>
</template>

<script setup lang="ts">
import type { MaterialCategory } from '@/api/types/common'
import MobileCard from '@/components/MobileCard.vue'
import { formatDate } from '@/utils/formatters'

interface Props {
  category: MaterialCategory
  actions?: Array<{
    key: string
    label: string
    shortLabel?: string
    class?: string
    disabled?: boolean
    tooltip?: string
    icon?: any
  }>
}

interface Emits {
  (e: 'action', action: string): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
/* Стили теперь в MobileCard компоненте */
</style>
