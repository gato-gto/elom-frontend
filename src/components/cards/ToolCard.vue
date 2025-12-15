<template>
  <div class="card bg-base-100 shadow-sm border border-base-200 mobile-card">
    <div class="card-body p-3 md:p-4">
      <!-- Header -->
      <div class="flex items-start justify-between gap-2 mb-3">
        <div class="flex-1 min-w-0">
          <h3 class="font-mono font-bold text-primary text-base md:text-lg mb-1 break-words">
            {{ tool.inventory_number }}
          </h3>
          <p class="text-sm md:text-base font-medium text-base-content break-words">
            {{ [
              tool.category?.split(',')[0]?.trim(),
              tool.brand,
              tool.name
            ].filter(Boolean).join(' ') }}
          </p>
        </div>
        <div class="badge badge-sm md:badge-md flex-shrink-0" :class="getConditionBadgeClass(tool.condition)">
          {{ tool.condition_display || getConditionDisplayName(tool.condition) }}
        </div>
      </div>

      <!-- Details -->
      <div class="mt-3 space-y-2 text-sm text-base-content/70">
        <div v-if="tool.category" class="flex items-start gap-2">
          <span class="font-medium text-base-content/80 flex-shrink-0">Категория:</span>
          <span class="break-words">{{ tool.category }}</span>
        </div>
        <div v-if="tool.brand" class="flex items-start gap-2">
          <span class="font-medium text-base-content/80 flex-shrink-0">Марка:</span>
          <span class="break-words">{{ tool.brand }}</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="font-medium text-base-content/80 flex-shrink-0">Местоположение:</span>
          <div class="flex-1 min-w-0">
            <span v-if="tool.current_holder_name" class="break-words">
              {{ tool.current_holder_name }}
              <span v-if="tool.current_object_name" class="text-xs text-base-content/60 block mt-1">
                ({{ tool.current_object_name }})
              </span>
            </span>
            <span v-else class="badge badge-success badge-xs">На складе</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="actions && actions.length > 0" class="card-actions justify-end mt-4 gap-2 flex-wrap">
        <button
          v-for="action in actions"
          :key="action.key"
          class="btn btn-sm md:btn-md"
          :class="action.class || 'btn-outline'"
          :disabled="action.disabled"
          @click="$emit('action', action.key)"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tool } from '@/api/types/tools'

defineProps<{
  tool: Tool
  actions?: Array<{
    key: string
    label: string
    class?: string
    disabled?: boolean
  }>
}>()

defineEmits<{
  action: [key: string]
}>()

function getConditionDisplayName(condition: string): string {
  const conditions: Record<string, string> = {
    'new': 'Новый',
    'good': 'Хорошее',
    'after_repair': 'После ремонта',
    'needs_repair': 'Требует ремонта',
    'broken': 'Сломан',
    'lost': 'Утерян'
  }
  return conditions[condition] || condition
}

function getConditionBadgeClass(condition: string): string {
  const badges: Record<string, string> = {
    'new': 'badge-success',
    'good': 'badge-info',
    'after_repair': 'badge-primary',
    'needs_repair': 'badge-warning',
    'broken': 'badge-error',
    'lost': 'badge-ghost'
  }
  return badges[condition] || 'badge-ghost'
}
</script>

