<template>
  <MobileCard
    :title="material.name"
    :badge="material.category_name || 'Без категории'"
    badge-class="badge-secondary"
    :actions="actions"
    @action="$emit('action', $event)"
  >
    <template #content>
      <div class="space-y-2 text-sm">
        <div v-if="material.sku">
          <span class="text-gray-500">SKU:</span>
          <span class="font-medium ml-2">{{ material.sku }}</span>
        </div>
        
        <div>
          <span class="text-gray-500">Единица измерения:</span>
          <span class="font-medium ml-2">{{ material.unit_code }}</span>
        </div>
        
        <div v-if="material.purchases_count">
          <span class="text-gray-500">Количество закупок:</span>
          <span class="font-medium ml-2">{{ material.purchases_count }}</span>
        </div>
        
        <div v-if="material.manufacturer">
          <span class="text-gray-500">Производитель:</span>
          <span class="font-medium ml-2">{{ material.manufacturer }}</span>
        </div>
        
        <div v-if="material.current_stock !== undefined">
          <span class="text-gray-500">Текущий остаток:</span>
          <span class="font-medium ml-2">{{ material.current_stock }} {{ material.unit_code }}</span>
        </div>
        
        <div v-if="material.average_price">
          <span class="text-gray-500">Средняя цена:</span>
          <span class="font-medium ml-2">{{ material.average_price }}</span>
        </div>
        
        <div>
          <span class="text-gray-500">Статус:</span>
          <span class="font-medium ml-2">
            <span class="badge badge-sm" :class="material.is_active ? 'badge-success' : 'badge-error'">
              {{ material.is_active ? 'Активен' : 'Неактивен' }}
            </span>
          </span>
        </div>
        
        <div v-if="material.description">
          <span class="text-gray-500">Описание:</span>
          <span class="font-medium ml-2">{{ truncateText(material.description, 100) }}</span>
        </div>
        
        <div v-if="material.total_purchased">
          <span class="text-gray-500">Куплено всего:</span>
          <span class="font-medium ml-2">{{ material.total_purchased }} {{ material.unit_code }}</span>
        </div>
        
        <div v-if="material.last_purchase_date">
          <span class="text-gray-500">Последняя закупка:</span>
          <span class="font-medium ml-2">{{ formatDate(material.last_purchase_date) }}</span>
        </div>
      </div>
    </template>
    
    <template #extra>
      <div class="flex justify-between items-center text-xs text-gray-500">
        <span>Создан: {{ formatDate(material.created_at) }}</span>
        <span v-if="material.updated_at !== material.created_at">
          Обновлен: {{ formatDate(material.updated_at) }}
        </span>
      </div>
    </template>
  </MobileCard>
</template>

<script setup lang="ts">
import { Material } from '@/api/types'
import MobileCard from '@/components/MobileCard.vue'
import { useMobileCardHelpers } from '@/composables/useResponsiveTable'
import { formatDate } from '@/utils/formatters'

interface Props {
  material: Material & {
    unit_code?: string
    current_stock?: number
    average_price?: string
    total_purchased?: number
    last_purchase_date?: string
    purchases_count?: number
  }
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
</script>