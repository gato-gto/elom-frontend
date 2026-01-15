<template>
  <div v-if="issue" class="tool-issue-info">
    <!-- Tool Info -->
    <div class="card bg-base-200 mb-4">
      <div class="card-body">
        <h4 class="card-title text-sm">Инструмент</h4>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div><span class="font-semibold">Инв. номер:</span> {{ issue.tool_inventory_number }}</div>
          <div><span class="font-semibold">Название:</span> {{ issue.tool_name }}</div>
        </div>
      </div>
    </div>

    <!-- Issue Info -->
    <div class="card bg-base-200 mb-4">
      <div class="card-body">
        <h4 class="card-title text-sm">Выдача</h4>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div><span class="font-semibold">Кто выдал:</span> {{ issue.issued_by_name }}</div>
          <div><span class="font-semibold">Кому выдал:</span> {{ issue.issued_to_name }}</div>
          <div><span class="font-semibold">Дата выдачи:</span> {{ formatDateTime(issue.issued_at) }}</div>
          <div><span class="font-semibold">Объект:</span> {{ issue.object_name || 'Не указан' }}</div>
          <div>
            <span class="font-semibold">Состояние:</span>
            <span class="badge badge-sm ml-1" :class="getConditionBadgeClass(issue.issue_condition)">
              {{ issue.issue_condition_display || getConditionDisplayName(issue.issue_condition) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Return Info -->
    <div v-if="issue.return_date" class="card bg-base-200 mb-4">
      <div class="card-body">
        <h4 class="card-title text-sm">Возврат</h4>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div><span class="font-semibold">Дата возврата:</span> {{ formatDateTime(issue.return_date) }}</div>
          <div>
            <span class="font-semibold">Состояние:</span>
            <span class="badge badge-sm ml-1" :class="getConditionBadgeClass(issue.return_condition || '')">
              {{ issue.return_condition_display || getConditionDisplayName(issue.return_condition || '') }}
            </span>
          </div>
          <div><span class="font-semibold">Длительность:</span> {{ calculateDuration() }}</div>
        </div>
      </div>
    </div>

    <!-- Not returned warning -->
    <div v-else class="alert alert-warning">
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
      </svg>
      <span>Инструмент ещё не возвращён</span>
    </div>

    <!-- Actions -->
    <div class="modal-action">
      <button class="btn btn-ghost" @click="$emit('close')">Закрыть</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolIssue } from '@/api/types/tools'
import { formatDate as formatDateUtil } from '@/utils/formatters'

const props = defineProps<{
  issue: ToolIssue | null
}>()

defineEmits<{
  close: []
}>()

// Helper functions
function formatDateTime(dateStr: string | null): string {
  if (!dateStr) {return '—'}
  const date = new Date(dateStr)
  return `${formatDateUtil(dateStr)} ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
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

function calculateDuration(): string {
  if (!props.issue?.issued_at || !props.issue?.return_date) {return '—'}
  
  const issued = new Date(props.issue.issued_at)
  const returned = new Date(props.issue.return_date)
  const diffMs = returned.getTime() - issued.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {return 'Менее суток'}
  if (diffDays === 1) {return '1 день'}
  if (diffDays < 5) {return `${diffDays} дня`}
  return `${diffDays} дней`
}
</script>

