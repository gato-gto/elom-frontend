import { defineStore } from 'pinia'
import { computed } from 'vue'
import { endpoints } from '@/api/endpoints'
import { createBaseStore } from '@/stores/base'
import type { 
  Unit, 
  UnitRequest, 
  PatchedUnitRequest
} from '@/api/types'

export const useUnitsStore = createBaseStore<Unit, UnitRequest, PatchedUnitRequest>({
  endpoint: endpoints.units,
  entityName: 'units',
  entityNamePlural: 'единицы измерения'
})

// Custom getters for units
export const getByCode = (code: string) => {
  return useUnitsStore.items.find((item: Unit) => item.code === code)
}