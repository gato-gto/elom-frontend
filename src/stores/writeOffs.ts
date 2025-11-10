import { defineStore } from 'pinia'
import { computed } from 'vue'
import { endpoints } from '@/api/endpoints'
import { createBaseStore } from '@/stores/base'
import type { 
  WriteOff, 
  WriteOffCreateRequest, 
  WriteOffUpdateRequest
} from '@/api/types'

export const useWriteOffsStore = createBaseStore<WriteOff, WriteOffCreateRequest, WriteOffUpdateRequest>({
  endpoint: endpoints.writeOffs,
  entityName: 'списание',
  entityNamePlural: 'списания'
})

// Custom getters for writeOffs
export const getByStage = (stage: string) => {
  return useWriteOffsStore.items.filter((item: WriteOff) => item.stage === stage)
}

export const getByObject = (objectId: number) => {
  return useWriteOffsStore.items.filter((item: WriteOff) => item.object === objectId)
}

export const getByMaterial = (materialId: number) => {
  return useWriteOffsStore.items.filter((item: WriteOff) => item.material === materialId)
}

export const getByResponsible = (responsibleId: number) => {
  return useWriteOffsStore.items.filter((item: WriteOff) => item.responsible === responsibleId)
}


// Computed для статистики
export const totalQuantity = computed(() =>
  useWriteOffsStore.items.reduce((sum: number, item: WriteOff) => sum + parseFloat(item.quantity), 0)
)

export const totalValue = computed(() => 
  useWriteOffsStore.items.reduce((sum: number, item: WriteOff) => {
    // Предполагаем, что у нас есть цена материала
    // В реальном приложении это может быть вычислено по-другому
    return sum + (parseFloat(item.quantity) * (item.smart_quantity?.value || 0))
  }, 0)
)

export const uniqueObjects = computed(() => 
  new Set(useWriteOffsStore.items.map((item: WriteOff) => item.object)).size
)

export const uniqueMaterials = computed(() => 
  new Set(useWriteOffsStore.items.map((item: WriteOff) => item.material)).size
)

export const uniqueResponsibles = computed(() => 
  new Set(useWriteOffsStore.items.map((item: WriteOff) => item.responsible)).size
)

// Статистика по этапам
export const stageStats = computed(() => {
  const stats: Record<string, { count: number; quantity: number }> = {}
  
  useWriteOffsStore.items.forEach((item: WriteOff) => {
    const stage = item.stage || 'unknown'
    if (!stats[stage]) {
      stats[stage] = { count: 0, quantity: 0 }
    }
    stats[stage].count += 1
    stats[stage].quantity += parseFloat(item.quantity)
  })
  
  return stats
})