<template>
  <MobileCard
    :title="estimate.title || 'Без названия'"
    :badge="estimate.currency"
    badge-class="badge-info"
    :actions="actions"
    @action="$emit('action', $event)"
  >
    <template #content>
      <div class="space-y-2 text-sm">
        <div>
          <span class="text-muted">Объект:</span>
          <span class="font-medium ml-2">{{ estimate.object_name }}</span>
        </div>
        <div>
          <span class="text-muted">Дата:</span>
          <span class="font-medium ml-2 font-mono">{{ estimate.date ? formatDate(estimate.date) : 'НЗ' }}</span>
        </div>
        <div>
          <span class="text-muted">Итого:</span>
          <span class="font-medium ml-2 text-success font-mono">{{ formatNumber(estimate.total) }} {{ estimate.currency }}</span>
        </div>
        <div>
          <span class="text-muted">Позиций:</span>
          <span class="font-medium ml-2 font-mono">{{ estimate.lines?.length ?? 0 }}</span>
        </div>
        <div v-if="estimate.created_by_name">
          <span class="text-muted">Автор:</span>
          <span class="font-medium ml-2">{{ estimate.created_by_name }}</span>
        </div>
      </div>
    </template>

    <template #extra>
      <div class="flex justify-between items-center text-xs text-muted font-mono">
        <span>Создано: {{ formatDate(estimate.created_at) }}</span>
        <span v-if="estimate.updated_at !== estimate.created_at">Обновлено: {{ formatDate(estimate.updated_at) }}</span>
      </div>
    </template>
  </MobileCard>
</template>

<script setup lang="ts">
import type { Estimate } from '@/api/types/estimates'
import MobileCard from '@/components/MobileCard.vue'
import { formatDate, formatNumber } from '@/utils/formatters'

interface Props {
  estimate: Estimate
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

defineProps<Props>()
defineEmits<{ (e: 'action', action: string): void }>()
</script>
