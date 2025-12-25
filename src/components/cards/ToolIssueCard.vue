<template>
  <div class="card shadow-sm border border-base-200 mobile-card">
    <div class="card-body p-3 md:p-4">
      <!-- Header -->
      <div class="flex items-start justify-between gap-2 mb-3">
        <div class="flex-1 min-w-0">
          <h3 class="font-mono font-bold text-primary text-base md:text-lg mb-1 break-words">
            {{ issue.tool_inventory_number }}
          </h3>
          <p class="text-sm md:text-base font-medium text-base-content break-words">
            {{ [
              issue.tool_category?.split(',')[0]?.trim(),
              issue.tool_brand,
              issue.tool_name
            ].filter(Boolean).join(' ') }}
          </p>
        </div>
        <div class="badge badge-sm md:badge-md flex-shrink-0" :class="issue.is_open ? 'badge-warning' : 'badge-success'">
          {{ issue.is_open ? 'Активна' : 'Закрыта' }}
        </div>
      </div>

      <!-- Details -->
      <div class="mt-3 space-y-2 text-sm text-base-content/70">
        <div class="flex items-start gap-2">
          <span class="font-medium text-base-content/80 flex-shrink-0">Кому:</span>
          <span class="break-words">{{ issue.issued_to_name }}</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="font-medium text-base-content/80 flex-shrink-0">Выдано:</span>
          <span class="break-words">{{ formatDate(issue.issued_at) }}</span>
        </div>
        <div v-if="issue.return_date" class="flex items-start gap-2">
          <span class="font-medium text-base-content/80 flex-shrink-0">Возвращено:</span>
          <span class="break-words">{{ formatDate(issue.return_date) }}</span>
        </div>
        <div class="flex items-start gap-2 flex-wrap">
          <span class="font-medium text-base-content/80 flex-shrink-0">Состояние:</span>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="badge badge-xs md:badge-sm" :class="getConditionBadgeClass(issue.issue_condition)">
              {{ issue.issue_condition_display || getConditionDisplayName(issue.issue_condition) }}
            </span>
            <span v-if="issue.return_condition" class="text-base-content/50">→</span>
            <span v-if="issue.return_condition" class="badge badge-xs md:badge-sm" :class="getConditionBadgeClass(issue.return_condition)">
              {{ issue.return_condition_display || getConditionDisplayName(issue.return_condition) }}
            </span>
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
import type { ToolIssue } from '@/api/types/tools'
import { formatDate as formatDateUtil } from '@/utils/formatters'

defineProps<{
  issue: ToolIssue
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return formatDateUtil(dateStr)
}

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

