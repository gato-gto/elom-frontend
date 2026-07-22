<template>
  <MobileCard
    :title="`Закупка ${purchase.purchase_no || '#' + purchase.id}`"
    :badge="statusLabel(purchase.status)"
    :badge-class="getStatusBadgeClass(purchase.status)"
    :actions="actions"
    @action="$emit('action', $event)"
  >
    <template #content>
      <div class="space-y-2 text-sm">
        <div>
          <span class="text-gray-500">Дата:</span>
          <span class="font-medium ml-2">{{ formatDate(purchase.date) }}</span>
        </div>
        
        <div v-if="purchase.object_name">
          <span class="text-gray-500">Объект:</span>
          <span class="font-medium ml-2">{{ purchase.object_name }}</span>
        </div>
        
        <div v-if="purchase.supplier">
          <span class="text-gray-500">Поставщик:</span>
          <span class="font-medium ml-2">{{ purchase.supplier }}</span>
        </div>
        
        <div>
          <span class="text-gray-500">Сумма:</span>
          <span class="font-medium ml-2 text-success">{{ purchase.total_amount }} {{ purchase.currency }}</span>
        </div>
        
        <div v-if="purchase.responsible_name">
          <span class="text-gray-500">Ответственный:</span>
          <span class="font-medium ml-2">{{ purchase.responsible_name }}</span>
        </div>
        
        <div v-if="purchase.invoice_number">
          <span class="text-gray-500">№ счета:</span>
          <span class="font-medium ml-2">{{ purchase.invoice_number }}</span>
        </div>
        
        <div>
          <span class="text-gray-500">Позиций:</span>
          <span class="font-medium ml-2">{{ purchase.items?.length || 0 }}</span>
        </div>
        
        <div>
          <span class="text-gray-500">Фото:</span>
          <span class="font-medium ml-2">{{ purchase.photos?.length || 0 }}</span>
        </div>
        
        <div v-if="purchase.comment">
          <span class="text-gray-500">Комментарий:</span>
          <span class="font-medium ml-2">{{ truncateText(purchase.comment, 100) }}</span>
        </div>
        
        <div v-if="purchase.is_archived">
          <span class="text-gray-500">Статус:</span>
          <span class="badge badge-warning badge-sm ml-2">Архив</span>
        </div>

        <!-- F-271/D-019: завершена, но фото-отчёт не приложен -->
        <div v-if="purchase.status === 'completed' && purchase.has_report_photos === false">
          <span class="text-gray-500">Фото-отчёт:</span>
          <span class="badge badge-warning badge-sm ml-2">нет фото</span>
        </div>
      </div>
    </template>

    <template #extra>
      <div class="flex justify-between items-center text-xs text-gray-500">
        <span>Создано: {{ formatDate(purchase.created_at) }}</span>
        <span v-if="purchase.updated_at !== purchase.created_at">
          Обновлено: {{ formatDate(purchase.updated_at) }}
        </span>
      </div>
    </template>
  </MobileCard>
</template>

<script setup lang="ts">
import { Purchase } from '@/api/types/purchases'
import MobileCard from '@/components/MobileCard.vue'
import { useMobileCardHelpers } from '@/composables/useResponsiveTable'
import { formatDate } from '@/utils/formatters'
import { getStatusBadgeClass, getStatusLabel } from '@/utils/statusHelpers'

interface Props {
  purchase: Purchase
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

const { truncateText } = useMobileCardHelpers()

const statusLabel = (status: string) =>
  getStatusLabel(status, { completed: 'Завершена' })
</script>