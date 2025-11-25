<template>
  <MobileCard
    :title="balance.object_name"
    :badge="`${balance.total_materials} материалов`"
    badge-class="badge-info"
  >
    <template #content>
      <div class="space-y-3 text-sm">
        <div>
          <span class="text-gray-500">Адрес:</span>
          <span class="font-medium ml-2">{{ balance.object_address || '—' }}</span>
        </div>
        
        <div>
          <span class="text-gray-500">Общий остаток:</span>
          <span class="font-medium ml-2 text-success">
            {{ formatQuantity(calculateTotalBalance(balance.materials)) }}
          </span>
        </div>

        <!-- Кнопка раскрытия материалов -->
        <div v-if="balance.materials && balance.materials.length > 0" class="pt-2 border-t border-base-300">
          <button
            @click="toggleExpanded"
            class="btn btn-sm btn-ghost w-full justify-between"
          >
            <span class="flex items-center gap-2">
              <span>{{ expanded ? 'Скрыть' : 'Показать' }} материалы</span>
              <span class="badge badge-sm badge-info">{{ balance.materials.length }}</span>
            </span>
            <svg
              class="w-4 h-4 transition-transform"
              :class="{ 'rotate-180': expanded }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Раскрытый список материалов -->
          <div v-if="expanded" class="mt-3 space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="material in sortMaterials(balance.materials)"
              :key="material.material_id"
              class="p-3 bg-base-200 dark:bg-base-300 rounded-lg border border-base-300"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {{ material.material_name }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ material.unit_code }}</div>
                </div>
                <div class="ml-2 text-right flex-shrink-0">
                  <div class="font-semibold text-success dark:text-success">
                    {{ formatQuantity(material.current_balance) }} {{ material.unit_code }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Приход: <span class="text-info">{{ formatQuantity(material.total_purchased) }}</span>
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    Расход: <span class="text-error">{{ formatQuantity(material.total_written_off) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Пустое состояние, если нет материалов -->
        <div v-else class="pt-2 border-t border-base-300 text-center text-sm text-gray-500">
          Нет материалов
        </div>
      </div>
    </template>
  </MobileCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ObjectBalance, MaterialBalance } from '@/api/types/stocks'
import MobileCard from '@/components/MobileCard.vue'
import { formatNumberClean } from '@/utils/formatters'

interface Props {
  balance: ObjectBalance
  materialsSortBy?: string
  materialsSortOrder?: 'asc' | 'desc'
}

const props = withDefaults(defineProps<Props>(), {
  materialsSortBy: 'material_name',
  materialsSortOrder: 'asc'
})

const expanded = ref(false)

function formatQuantity(quantity: string): string {
  return formatNumberClean(quantity)
}

function calculateTotalBalance(materials: MaterialBalance[]): string {
  const total = materials.reduce((sum, material) => {
    return sum + parseFloat(material.current_balance || '0')
  }, 0)
  return total.toString()
}

function toggleExpanded() {
  expanded.value = !expanded.value
}

function sortMaterials(materials: MaterialBalance[]): MaterialBalance[] {
  return [...materials].sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (props.materialsSortBy) {
      case 'material_name':
        aValue = a.material_name.toLowerCase()
        bValue = b.material_name.toLowerCase()
        break
      case 'current_balance':
        aValue = parseFloat(a.current_balance || '0')
        bValue = parseFloat(b.current_balance || '0')
        break
      case 'total_purchased':
        aValue = parseFloat(a.total_purchased || '0')
        bValue = parseFloat(b.total_purchased || '0')
        break
      case 'total_written_off':
        aValue = parseFloat(a.total_written_off || '0')
        bValue = parseFloat(b.total_written_off || '0')
        break
      default:
        return 0
    }
    
    if (aValue < bValue) {return props.materialsSortOrder === 'asc' ? -1 : 1}
    if (aValue > bValue) {return props.materialsSortOrder === 'asc' ? 1 : -1}
    return 0
  })
}
</script>

<style scoped>
.rotate-180 {
  transform: rotate(180deg);
}

/* Стили для прокрутки материалов */
.max-h-96 {
  max-height: 24rem;
}

/* Плавная анимация раскрытия */
.mt-3 {
  transition: all 0.3s ease;
}
</style>

