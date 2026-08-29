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
          <!-- F-635: было чтение несуществующих display_value/display_unit → пусто. Общий
               SmartUnitValue как в списках (укрупнённая единица + исходное значение рядом). -->
          <SmartUnitValue
            :smart-quantity="stock.smart_quantity"
            class-name="font-medium font-mono ml-2"
          />
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
import { stageLabel } from '@/constants/stages'
import { StockSnapshot } from '@/api/types/stocks'
import MobileCard from '@/components/MobileCard.vue'
import SmartUnitValue from '@/components/SmartUnitValue.vue'
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

// F-910 → F-1033: подписи этапов из единого источника src/constants/stages.ts (раньше —
// рукописная карта, которая расходилась с desktop-списком и печатала сырой код).
const getStageLabel = (stage: string) => stageLabel(stage)

const getSourceTypeLabel = () => {
  // F-910: BE source_type = 'purchase_item' | 'writeoff' (не 'purchase'/'transfer'/'adjustment').
  const sourceMap: Record<string, string> = {
    'purchase_item': 'Закупка',
    'writeoff': 'Списание'
  }
  return sourceMap[props.stock.source_type] || props.stock.source_type
}

const getSourceTypeBadgeClass = () => {
  // F-910: ключи по BE source_type ('purchase_item'/'writeoff'), а не 'purchase'/'transfer'.
  const classMap: Record<string, string> = {
    'purchase_item': 'badge-success',
    'writeoff': 'badge-error'
  }
  return classMap[props.stock.source_type] || 'badge-neutral'
}
</script>