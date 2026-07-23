<template>
  <MobileCard
    :title="stock.material_name"
    :badge="getStageLabel(stock.stage)"
    badge-class="badge-accent"
    :actions="actions"
    @action="$emit('action', $event)"
  >
    <template #content>
      <div class="space-y-2 text-sm">
        <div>
          <span class="text-muted">Дата:</span>
          <span class="font-medium ml-2 font-mono">{{ formatDate(stock.date) }}</span>
        </div>
        
        <div>
          <span class="text-muted">Объект:</span>
          <span class="font-medium ml-2">{{ stock.object_name }}</span>
        </div>
        
        <div>
          <span class="text-muted">Количество:</span>
          <span class="font-medium ml-2 font-mono" :class="getQuantityColorClass()">
            {{ formatQuantityWithSign() }} {{ stock.unit_code }}
          </span>
        </div>
        
        <div>
          <span class="text-muted">Тип операции:</span>
          <span class="font-medium ml-2">{{ isIncome() ? 'Приход' : 'Расход' }}</span>
        </div>
        
        <div v-if="stock.responsible_name">
          <span class="text-muted">Ответственный:</span>
          <span class="font-medium ml-2">{{ stock.responsible_name }}</span>
        </div>
        
        <div>
          <span class="text-muted">Источник:</span>
          <span class="font-medium ml-2">
            <span class="badge badge-sm" :class="getSourceTypeBadgeClass()">
              {{ getSourceTypeLabel() }}
            </span>
          </span>
        </div>
        
        <div>
          <span class="text-muted">Этап:</span>
          <span class="font-medium ml-2">{{ getStageLabel(stock.stage) }}</span>
        </div>
        
        <div v-if="stock.source_description">
          <span class="text-muted">Описание источника:</span>
          <span class="font-medium ml-2">{{ truncateText(stock.source_description, 50) }}</span>
        </div>
        
        <div v-if="stock.comment">
          <span class="text-muted">Комментарий:</span>
          <span class="font-medium ml-2">{{ truncateText(stock.comment, 80) }}</span>
        </div>
        
        <div v-if="stock.smart_quantity">
          <span class="text-muted">Умная конвертация:</span>
          <span class="font-medium ml-2">
            <span class="font-mono">{{ stock.smart_quantity.display_value }}</span> {{ stock.smart_quantity.display_unit }}
            <span v-if="stock.smart_quantity.conversion_applied" class="text-xs text-info ml-1">
              (конвертировано)
            </span>
          </span>
        </div>
      </div>
    </template>
    
    <template #extra>
      <div class="flex justify-between items-center text-xs text-muted">
        <span>Создано: <span class="font-mono">{{ formatDate(stock.created_at) }}</span></span>
        <span v-if="stock.updated_at !== stock.created_at">
          Обновлено: <span class="font-mono">{{ formatDate(stock.updated_at) }}</span>
        </span>
      </div>
    </template>
  </MobileCard>
</template>

<script setup lang="ts">
import { StockSnapshot } from '@/api/types/stocks'
import MobileCard from '@/components/MobileCard.vue'
import { useMobileCardHelpers } from '@/composables/useResponsiveTable'
import { formatDate, formatNumberClean } from '@/utils/formatters'

interface Props {
  stock: StockSnapshot
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

const props = defineProps<Props>()
defineEmits<Emits>()

const { truncateText } = useMobileCardHelpers()

const formatQuantityWithSign = () => {
  const quantity = parseFloat(props.stock.quantity_signed)
  const formatted = formatNumberClean(quantity)
  return quantity > 0 ? `+${formatted}` : formatted
}

const isIncome = () => {
  return parseFloat(props.stock.quantity_signed) > 0
}

const getQuantityColorClass = () => {
  return isIncome() ? 'text-success' : 'text-error'
}

const getStageLabel = (stage: string) => {
  const stageMap: Record<string, string> = {
    'planning': 'Планирование',
    'procurement': 'Закупка',
    'delivery': 'Доставка',
    'storage': 'Хранение',
    'installation': 'Монтаж',
    'completion': 'Завершение'
  }
  return stageMap[stage] || stage
}

const getSourceTypeLabel = () => {
  const sourceMap: Record<string, string> = {
    'purchase': 'Закупка',
    'transfer': 'Перемещение',
    'adjustment': 'Корректировка',
    'writeoff': 'Списание'
  }
  return sourceMap[props.stock.source_type] || props.stock.source_type
}

const getSourceTypeBadgeClass = () => {
  const classMap: Record<string, string> = {
    'purchase': 'badge-success',
    'transfer': 'badge-info',
    'adjustment': 'badge-warning',
    'writeoff': 'badge-error'
  }
  return classMap[props.stock.source_type] || 'badge-neutral'
}
</script>