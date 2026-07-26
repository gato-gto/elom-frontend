/**
 * Store для управления единицами измерения
 */
import { endpoints } from '@/api/endpoints'
import { createBaseStore } from './base'
import type { 
  Unit, 
  UnitRequest, 
  PatchedUnitRequest
} from '@/api/types'

// Создаём store
export const useUnitsStore = createBaseStore<Unit, UnitRequest, PatchedUnitRequest>({
  endpoint: endpoints.units,
  entityName: 'units',
  entityNamePlural: 'единицы измерения',
  defaultOrdering: '-id'
})

// ============================================================================
// Helper Functions
// ============================================================================

export const getByCode = (code: string) => {
  const store = useUnitsStore()
  return store.items.find((item: Unit) => item.code === code)
}
