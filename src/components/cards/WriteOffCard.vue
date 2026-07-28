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
            -{{ formatQuantity(writeOff.quantity) }}
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
            {{ getBalanceBefore() }}
          </span>
        </div>
        
        <div>
          <span class="text-muted">Остаток после списания:</span>
          <span class="font-medium ml-2 text-success font-mono">
            {{ formatQuantity(writeOff.current_balance) }}
          </span>
        </div>
        
        <div v-if="writeOff.comment">
          <span class="text-muted">Комментарий:</span>
          <span class="font-medium ml-2">{{ truncateText(writeOff.comment, 80) }}</span>
        </div>
        
        
        <div v-if="writeOff.smart_quantity">
          <span class="text-muted">Умная конвертация:</span>
          <!-- F-635: карточка читала несуществующие smart_quantity.display_value/display_unit
               (бэкенд шлёт value/unit) → рендерила пусто. Используем общий SmartUnitValue как
               в списках: показывает укрупнённую единицу + исходное значение рядом. -->
          <SmartUnitValue
            :smart-quantity="writeOff.smart_quantity"
            class-name="font-medium font-mono ml-2"
          />
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
import SmartUnitValue from '@/components/SmartUnitValue.vue'
import { useMobileCardHelpers } from '@/composables/useResponsiveTable'
import { formatDate } from '@/utils/formatters'
import { formatSmartQuantity } from '@/utils/unitRounding'

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

// F-867: умная единица одним числом (250000 м → «250 км»), включает единицу измерения.
const formatQuantity = (quantity: string) => {
  return formatSmartQuantity(parseFloat(quantity), props.writeOff.unit_code)
}

// current_balance с бэкенда = остаток НА ДАТУ списания, УЖЕ включающий это списание
// (Σ снапшотов date__lte, снапшот списания входит), т.е. это остаток ПОСЛЕ списания.
// Значит «до» = current + qty. Раньше карточка показывала current как «до», а «после»
// = current − qty (двойное вычитание): на Баку выходило 9 500 000 против верных
// 9 750 000 в /balances — карточка противоречила странице остатков.
const getBalanceBefore = () => {
  const current = parseFloat(props.writeOff.current_balance)
  const writeOffQty = parseFloat(props.writeOff.quantity)
  return formatSmartQuantity(current + writeOffQty, props.writeOff.unit_code)
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