/**
 * Store для управления списаниями
 */
import { endpoints } from '@/api/endpoints'
import { createBaseStore } from './base'
import type { 
  WriteOff, 
  WriteOffCreateRequest, 
  WriteOffUpdateRequest
} from '@/api/types'

// Создаём store
export const useWriteOffsStore = createBaseStore<WriteOff, WriteOffCreateRequest, WriteOffUpdateRequest>({
  endpoint: endpoints.writeOffs,
  entityName: 'writeOffs',
  entityNamePlural: 'списания',
  defaultOrdering: '-date'
})

// ============================================================================
// Helper Functions
// ============================================================================

export const getByStage = (stage: string) => {
  const store = useWriteOffsStore()
  return store.items.filter((item: WriteOff) => item.stage === stage)
}

export const getByObject = (objectId: number) => {
  const store = useWriteOffsStore()
  return store.items.filter((item: WriteOff) => item.object === objectId)
}

export const getByMaterial = (materialId: number) => {
  const store = useWriteOffsStore()
  return store.items.filter((item: WriteOff) => item.material === materialId)
}

export const getByResponsible = (responsibleId: number) => {
  const store = useWriteOffsStore()
  return store.items.filter((item: WriteOff) => item.responsible === responsibleId)
}

export const getTotalQuantity = () => {
  const store = useWriteOffsStore()
  return store.items.reduce((sum: number, item: WriteOff) => sum + parseFloat(item.quantity), 0)
}

export const getUniqueObjectsCount = () => {
  const store = useWriteOffsStore()
  return new Set(store.items.map((item: WriteOff) => item.object)).size
}

export const getUniqueMaterialsCount = () => {
  const store = useWriteOffsStore()
  return new Set(store.items.map((item: WriteOff) => item.material)).size
}

export const getStageStats = () => {
  const store = useWriteOffsStore()
  const stats: Record<string, { count: number; quantity: number }> = {}
  
  store.items.forEach((item: WriteOff) => {
    const stage = item.stage || 'unknown'
    if (!stats[stage]) {
      stats[stage] = { count: 0, quantity: 0 }
    }
    stats[stage].count += 1
    stats[stage].quantity += parseFloat(item.quantity)
  })
  
  return stats
}
