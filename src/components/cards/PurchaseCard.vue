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
          <span class="text-muted">Дата:</span>
          <span class="font-medium ml-2 font-mono">{{ formatDate(purchase.date) }}</span>
        </div>
        
        <div v-if="purchase.object_name">
          <span class="text-muted">Объект:</span>
          <span class="font-medium ml-2">{{ purchase.object_name }}</span>
        </div>
        
        <div v-if="purchase.supplier_name">
          <span class="text-muted">Поставщик:</span>
          <!-- F-909: было {{ purchase.supplier }} — сырой ID поставщика (FK), а не имя. supplier_name
               = source='supplier.name' в сериализаторе; как в desktop-списке и на детальной. -->
          <span class="font-medium ml-2">{{ purchase.supplier_name }}</span>
        </div>

        <div>
          <span class="text-muted">Сумма:</span>
          <!-- F-909: сумма с разделителями разрядов (было «12500000.00» против «12 500 000» на детальной). -->
          <span class="font-medium ml-2 text-success font-mono">{{ formatNumber(purchase.total_amount) }} {{ purchase.currency }}</span>
        </div>
        
        <div v-if="purchase.responsible_name">
          <span class="text-muted">Ответственный:</span>
          <span class="font-medium ml-2">{{ purchase.responsible_name }}</span>
        </div>
        
        <div v-if="purchase.invoice_number">
          <span class="text-muted">№ счета:</span>
          <span class="font-medium ml-2 font-mono">{{ purchase.invoice_number }}</span>
        </div>

        <div>
          <span class="text-muted">Позиций:</span>
          <span class="font-medium ml-2 font-mono">{{ purchase.items?.length || 0 }}</span>
        </div>

        <div>
          <span class="text-muted">Фото:</span>
          <span class="font-medium ml-2 font-mono">{{ purchase.photos?.length || 0 }}</span>
        </div>
        
        <div v-if="purchase.comment">
          <span class="text-muted">Комментарий:</span>
          <span class="font-medium ml-2">{{ truncateText(purchase.comment, 100) }}</span>
        </div>
        
        <div v-if="purchase.is_archived">
          <span class="text-muted">Статус:</span>
          <span class="badge badge-warning badge-sm ml-2">Архив</span>
        </div>

        <!-- F-271/D-019: завершена, но фото-отчёт не приложен -->
        <div v-if="purchase.status === 'completed' && purchase.has_report_photos === false">
          <span class="text-muted">Фото-отчёт:</span>
          <span class="badge badge-warning badge-sm ml-2">нет фото</span>
        </div>

        <!-- F-621/D-012: «новая» закупка датой в закрытом периоде — одобрить (завершить) нельзя -->
        <div v-if="purchase.status === 'new' && purchase.is_period_closed">
          <span class="text-muted">Период:</span>
          <span class="badge badge-error badge-sm ml-2" title="Период закрыт — нельзя одобрить закупку задним числом">закрыт</span>
        </div>
      </div>
    </template>

    <template #extra>
      <div class="flex justify-between items-center text-xs text-muted font-mono">
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
import { formatDate, formatNumber } from '@/utils/formatters'
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