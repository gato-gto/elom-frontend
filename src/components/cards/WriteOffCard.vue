<template>
  <MobileCard
    :title="writeOff.material_name"
    :badge="writeOff.stage ? getStageLabel(writeOff.stage) : undefined"
    badge-class="badge-warning"
    :actions="actions"
    @action="$emit('action', $event)"
  >
    <template #content>
      <div class="space-y-2 text-sm">
        <div>
          <span class="text-muted">Дата:</span>
          <span class="font-medium ml-2 font-mono">{{ formatDate(writeOff.date) }}</span>
        </div>
        
        <div>
          <span class="text-muted">Объект:</span>
          <span class="font-medium ml-2">{{ writeOff.object_name }}</span>
        </div>
        
        <div>
          <span class="text-muted">Количество списания:</span>
          <span class="font-medium ml-2 text-error font-mono">
            -{{ formatQuantity(writeOff.quantity) }} {{ writeOff.unit_code }}
          </span>
        </div>
        
        <div v-if="writeOff.responsible_name">
          <span class="text-muted">Ответственный:</span>
          <span class="font-medium ml-2">{{ writeOff.responsible_name }}</span>
        </div>
        
        <div v-if="writeOff.stage">
          <span class="text-muted">Этап:</span>
          <span class="font-medium ml-2">{{ getStageLabel(writeOff.stage) }}</span>
        </div>
        
        <div>
          <span class="text-muted">Остаток до списания:</span>
          <span class="font-medium ml-2 text-info font-mono">
            {{ formatQuantity(writeOff.current_balance) }} {{ writeOff.unit_code }}
          </span>
        </div>
        
        <div>
          <span class="text-muted">Остаток после списания:</span>
          <span class="font-medium ml-2 text-success font-mono">
            {{ formatQuantity(getBalanceAfter()) }} {{ writeOff.unit_code }}
          </span>
        </div>
        
        <div v-if="writeOff.comment">
          <span class="text-muted">Комментарий:</span>
          <span class="font-medium ml-2">{{ truncateText(writeOff.comment, 80) }}</span>
        </div>
        
        
        <div v-if="writeOff.smart_quantity">
          <span class="text-muted">Умная конвертация:</span>
          <span class="font-medium ml-2 font-mono">
            {{ writeOff.smart_quantity.display_value }} {{ writeOff.smart_quantity.display_unit }}
            <span v-if="writeOff.smart_quantity.conversion_applied" class="text-xs text-warning ml-1">
              (конвертировано)
            </span>
          </span>
        </div>
      </div>
    </template>
    
    <template #extra>
      <div class="flex justify-between items-center text-xs text-muted">
        <span class="font-mono">Создано: {{ formatDate(writeOff.created_at) }}</span>
        <span v-if="writeOff.updated_at !== writeOff.created_at" class="font-mono">
          Обновлено: {{ formatDate(writeOff.updated_at) }}
        </span>
      </div>
    </template>
  </MobileCard>
</template>

<script setup lang="ts">
import { WriteOff } from '@/api/types/stocks'
import MobileCard from '@/components/MobileCard.vue'
import { useMobileCardHelpers } from '@/composables/useResponsiveTable'
import { formatDate, formatNumberClean } from '@/utils/formatters'

interface Props {
  writeOff: WriteOff
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

const formatQuantity = (quantity: string) => {
  return formatNumberClean(parseFloat(quantity))
}

const getBalanceAfter = () => {
  const current = parseFloat(props.writeOff.current_balance)
  const writeOffQty = parseFloat(props.writeOff.quantity)
  return formatNumberClean(current - writeOffQty)
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
</script>