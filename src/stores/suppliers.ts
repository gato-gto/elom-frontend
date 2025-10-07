import { defineStore } from 'pinia'
import api from '@/api/client'
import { endpoints, buildQuery } from '@/api/endpoints'
import { createBaseStore } from '@/stores/base'
import type { 
  PurchaseSupplier, 
  PurchaseSupplierCreateRequest, 
  PurchaseSupplierUpdateRequest,
  PaginatedPurchaseSupplierList 
} from '@/api/types'

export const useSuppliersStore = createBaseStore<PurchaseSupplier, PurchaseSupplierCreateRequest, PurchaseSupplierUpdateRequest>({
  endpoint: endpoints.suppliers,
  entityName: 'suppliers',
  entityNamePlural: 'поставщики'
})

// Custom getters for suppliers
export const activeSuppliers = () => {
  return useSuppliersStore.items.filter(item => item.is_active)
}

export const searchOptions = () => {
  return useSuppliersStore.items
    .filter(item => item.is_active)
    .map(item => ({
      value: item.id,
      label: item.name,
      subtitle: item.contact_person || item.phone || ''
    }))
}
