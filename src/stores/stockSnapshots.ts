/**
 * Store для управления движениями остатков
 */
import { endpoints } from '@/api/endpoints'
import { createBaseStore } from './base'
import type { 
  StockSnapshot, 
  StockSnapshotCreateRequest, 
  StockSnapshotUpdateRequest
} from '@/api/types'

// Создаём store
export const useStockSnapshotsStore = createBaseStore<StockSnapshot, StockSnapshotCreateRequest, StockSnapshotUpdateRequest>({
  endpoint: endpoints.stockSnapshots,
  entityName: 'stockSnapshots',
  entityNamePlural: 'движения остатков',
  defaultOrdering: '-date'
})

// ============================================================================
// Helper Functions
// ============================================================================

export const getBySourceType = (sourceType: string) => {
  const store = useStockSnapshotsStore()
  return store.items.filter((item: StockSnapshot) => item.source_type === sourceType)
}

export const getByStage = (stage: string) => {
  const store = useStockSnapshotsStore()
  return store.items.filter((item: StockSnapshot) => item.stage === stage)
}

export const getByObject = (objectId: number) => {
  const store = useStockSnapshotsStore()
  return store.items.filter((item: StockSnapshot) => item.object === objectId)
}

export const getByMaterial = (materialId: number) => {
  const store = useStockSnapshotsStore()
  return store.items.filter((item: StockSnapshot) => item.material === materialId)
}

export const getTotalIncome = () => {
  const store = useStockSnapshotsStore()
  return store.items
    .filter((item: StockSnapshot) => parseFloat(item.quantity_signed) > 0)
    .reduce((sum: number, item: StockSnapshot) => sum + parseFloat(item.quantity_signed), 0)
}

export const getTotalOutcome = () => {
  const store = useStockSnapshotsStore()
  return store.items
    .filter((item: StockSnapshot) => parseFloat(item.quantity_signed) < 0)
    .reduce((sum: number, item: StockSnapshot) => sum + Math.abs(parseFloat(item.quantity_signed)), 0)
}

export const getUniqueObjectsCount = () => {
  const store = useStockSnapshotsStore()
  return new Set(store.items.map((item: StockSnapshot) => item.object)).size
}

export const getUniqueMaterialsCount = () => {
  const store = useStockSnapshotsStore()
  return new Set(store.items.map((item: StockSnapshot) => item.material)).size
}
