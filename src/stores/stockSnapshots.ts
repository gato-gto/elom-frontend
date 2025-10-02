import { defineStore } from 'pinia'
import { computed } from 'vue'
import { endpoints } from '@/api/endpoints'
import { createBaseStore } from '@/stores/base'
import type { 
  StockSnapshot, 
  StockSnapshotCreateRequest, 
  StockSnapshotUpdateRequest
} from '@/api/types'

export const useStockSnapshotsStore = createBaseStore<StockSnapshot, StockSnapshotCreateRequest, StockSnapshotUpdateRequest>({
  endpoint: endpoints.stockSnapshots,
  entityName: 'движение остатков',
  entityNamePlural: 'движения остатков'
})

// Custom getters for stockSnapshots
export const getBySourceType = (sourceType: string) => {
  return useStockSnapshotsStore.items.filter((item: StockSnapshot) => item.source_type === sourceType)
}

export const getByStage = (stage: string) => {
  return useStockSnapshotsStore.items.filter((item: StockSnapshot) => item.stage === stage)
}

export const getByObject = (objectId: number) => {
  return useStockSnapshotsStore.items.filter((item: StockSnapshot) => item.object === objectId)
}

export const getByMaterial = (materialId: number) => {
  return useStockSnapshotsStore.items.filter((item: StockSnapshot) => item.material === materialId)
}

// Computed для статистики
export const totalIncome = computed(() =>
  useStockSnapshotsStore.items
    .filter((item: StockSnapshot) => parseFloat(item.quantity_signed) > 0)
    .reduce((sum: number, item: StockSnapshot) => sum + parseFloat(item.quantity_signed), 0)
)

export const totalOutcome = computed(() => 
  useStockSnapshotsStore.items
    .filter((item: StockSnapshot) => parseFloat(item.quantity_signed) < 0)
    .reduce((sum: number, item: StockSnapshot) => sum + Math.abs(parseFloat(item.quantity_signed)), 0)
)

export const uniqueObjects = computed(() => 
  new Set(useStockSnapshotsStore.items.map((item: StockSnapshot) => item.object)).size
)

export const uniqueMaterials = computed(() => 
  new Set(useStockSnapshotsStore.items.map((item: StockSnapshot) => item.material)).size
)