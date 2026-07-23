<template>
  <MobileCard
    :title="unit.name"
    badge="Единица измерения"
    badge-class="badge-neutral"
    :actions="actions"
    @action="$emit('action', $event)"
  >
    <template #content>
      <div class="space-y-2 text-sm">
        <div>
          <span class="text-muted">Код единицы:</span>
          <span class="font-medium ml-2 text-primary">{{ unit.code }}</span>
        </div>
        
        <div>
          <span class="text-muted">Название:</span>
          <span class="font-medium ml-2">{{ unit.name }}</span>
        </div>
        
        <div v-if="unit.materials_count">
          <span class="text-muted">Материалов:</span>
          <span class="font-medium ml-2 font-mono">{{ unit.materials_count }}</span>
        </div>
        
        <div v-if="unit.conversions_count">
          <span class="text-muted">Конверсий:</span>
          <span class="font-medium ml-2 font-mono">{{ unit.conversions_count }}</span>
        </div>
        
        <div v-if="unit.purchases_count">
          <span class="text-muted">В закупках:</span>
          <span class="font-medium ml-2 font-mono">{{ unit.purchases_count }}</span>
        </div>
        
        <div v-if="unit.writeoffs_count">
          <span class="text-muted">В списаниях:</span>
          <span class="font-medium ml-2 font-mono">{{ unit.writeoffs_count }}</span>
        </div>
        
        <div v-if="unit.conversions && unit.conversions.length > 0">
          <span class="text-muted">Конверсии:</span>
          <div class="font-medium ml-2">
            <div class="space-y-1 mt-1">
              <div 
                v-for="conversion in unit.conversions.slice(0, 3)" 
                :key="conversion.id"
                class="text-xs font-mono"
              >
                1 {{ unit.code }} = {{ conversion.factor }} {{ conversion.to_unit_code }}
              </div>
              <div v-if="unit.conversions.length > 3" class="text-xs text-muted">
                +{{ unit.conversions.length - 3 }} еще...
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="unit.example_materials && unit.example_materials.length > 0">
          <span class="text-muted">Используется в материалах:</span>
          <div class="font-medium ml-2">
            <div class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="material in unit.example_materials.slice(0, 4)"
                :key="material"
                class="badge badge-outline badge-xs"
              >
                {{ truncateText(material, 15) }}
              </span>
              <span
                v-if="unit.example_materials.length > 4"
                class="badge badge-ghost badge-xs"
              >
                +{{ unit.example_materials.length - 4 }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
    
    <template #extra>
      <div class="flex justify-between items-center text-xs text-muted">
        <span class="font-mono">Создана: {{ formatDate(unit.created_at || null) }}</span>
        <span v-if="unit.updated_at !== unit.created_at" class="font-mono">
          Обновлена: {{ formatDate(unit.updated_at || null) }}
        </span>
      </div>
    </template>
  </MobileCard>
</template>

<script setup lang="ts">
import { Unit } from '@/api/types/common'
import MobileCard from '@/components/MobileCard.vue'
import { useMobileCardHelpers } from '@/composables/useResponsiveTable'
import { formatDate } from '@/utils/formatters'

interface Props {
  unit: Unit & {
    conversions?: Array<{
      id: number
      factor: number
      to_unit_code: string
    }>
    example_materials?: string[]
    materials_count?: number
    conversions_count?: number
    purchases_count?: number
    writeoffs_count?: number
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