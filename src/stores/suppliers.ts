/**
 * Store для управления поставщиками
 */
import { endpoints } from '@/api/endpoints'
import { createBaseStore } from './base'
import type { 
  PurchaseSupplier, 
  PurchaseSupplierCreateRequest, 
  PurchaseSupplierUpdateRequest
} from '@/api/types'

// Создаём store
export const useSuppliersStore = createBaseStore<PurchaseSupplier, PurchaseSupplierCreateRequest, PurchaseSupplierUpdateRequest>({
  endpoint: endpoints.suppliers,
  entityName: 'suppliers',
  entityNamePlural: 'поставщики',
  defaultOrdering: 'name'
})

// ============================================================================
// Helper Functions
// ============================================================================

export const getActiveSuppliers = () => {
  const store = useSuppliersStore()
  return store.items.filter(item => item.is_active)
}

export const getSearchOptions = () => {
  const store = useSuppliersStore()
  return store.items
    .filter(item => item.is_active)
    .map(item => ({
      value: item.id,
      label: item.name,
      subtitle: item.contact_person || item.phone || ''
    }))
}
