import { defineStore } from 'pinia'
import api from '@/api/client'
import { endpoints, buildQuery } from '@/api/endpoints'
import type { 
  PurchaseSupplier, 
  PurchaseSupplierCreateRequest, 
  PurchaseSupplierUpdateRequest,
  PaginatedPurchaseSupplierList 
} from '@/api/types'

export const useSuppliersStore = defineStore('suppliers', {
  state: () => ({
    items: [] as PurchaseSupplier[],
    current: null as PurchaseSupplier | null,
    loading: false,
    error: null as string | null,
    pagination: {
      count: 0,
      page: 1,
      pageSize: 20,
      next: null as string | null,
      previous: null as string | null
    },
    filters: {
      search: '',
      is_active: true,
      ordering: 'name' as string
    }
  }),

  getters: {
    // Get supplier by ID
    getById: (state) => (id: number) => {
      return state.items.find(item => item.id === id)
    },

    // Get active suppliers only
    activeSuppliers: (state) => {
      return state.items.filter(item => item.is_active)
    },

    // Check if supplier exists
    exists: (state) => (id: number) => {
      return state.items.some(item => item.id === id)
    },

    // Select options for dropdowns
    selectOptions: (state) => {
      return state.items
        .filter(item => item.is_active)
        .map(item => ({
          value: item.id,
          label: item.name
        }))
    },

    // Search options for autocomplete
    searchOptions: (state) => {
      return state.items
        .filter(item => item.is_active)
        .map(item => ({
          value: item.id,
          label: item.name,
          subtitle: item.contact_person || item.phone || ''
        }))
    }
  },

  actions: {
    // Fetch suppliers list
    async fetchList(params?: {
      page?: number
      search?: string
      is_active?: boolean
      ordering?: string
    }): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const queryParams = {
          page: params?.page || this.pagination.page,
          page_size: this.pagination.pageSize,
          search: params?.search ?? this.filters.search ?? undefined,
          is_active: params?.is_active ?? this.filters.is_active ?? undefined,
          ordering: params?.ordering ?? this.filters.ordering
        }

        const query = buildQuery(queryParams)
        const { data } = await api.get<PaginatedPurchaseSupplierList>(endpoints.suppliers.list + query)

        this.items = data.results
        this.pagination = {
          count: data.count,
          page: queryParams.page,
          pageSize: this.pagination.pageSize,
          next: data.next || null,
          previous: data.previous || null
        }

        // Update filters
        if (params) {
          Object.assign(this.filters, params)
        }
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка загрузки поставщиков'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch single supplier
    async fetchOne(id: number) {
      this.loading = true
      this.error = null

      try {
        const { data } = await api.get<PurchaseSupplier>(endpoints.suppliers.one(id))
        this.current = data

        // Update in list if exists
        const index = this.items.findIndex(item => item.id === id)
        if (index !== -1) {
          this.items[index] = data
        }

        return data
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка загрузки поставщика'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Create new supplier
    async create(data: PurchaseSupplierCreateRequest) {
      this.loading = true
      this.error = null

      try {
        const { data: newSupplier } = await api.post<PurchaseSupplier>(endpoints.suppliers.list, data)
        
        // Add to list
        this.items.unshift(newSupplier)
        this.pagination.count++

        return newSupplier
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка создания поставщика'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Update supplier
    async update(id: number, data: PurchaseSupplierUpdateRequest) {
      this.loading = true
      this.error = null

      try {
        const { data: updatedSupplier } = await api.patch<PurchaseSupplier>(endpoints.suppliers.one(id), data)
        
        // Update in list
        const index = this.items.findIndex(item => item.id === id)
        if (index !== -1) {
          this.items[index] = updatedSupplier
        }

        // Update current if it's the same
        if (this.current?.id === id) {
          this.current = updatedSupplier
        }

        return updatedSupplier
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка обновления поставщика'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Delete supplier
    async delete(id: number) {
      this.loading = true
      this.error = null

      try {
        await api.delete(endpoints.suppliers.one(id))
        
        // Remove from list
        this.items = this.items.filter(item => item.id !== id)
        this.pagination.count--

        // Clear current if it's the same
        if (this.current?.id === id) {
          this.current = null
        }

        return true
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка удаления поставщика'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Set page
    async setPage(page: number) {
      await this.fetchList({ page })
    },

    // Set page size
    async setPageSize(size: number) {
      this.pagination.pageSize = size
      this.pagination.page = 1
      await this.fetchList()
    },

    // Set filters
    setFilters(filters: Partial<typeof this.filters>) {
      Object.assign(this.filters, filters)
    },

    // Reset filters
    resetFilters() {
      this.filters = {
        search: '',
        is_active: true,
        ordering: 'name'
      }
    },

    // Search suppliers
    async searchSuppliers(query: string): Promise<PurchaseSupplier[]> {
      try {
        const queryParams = {
          search: query,
          is_active: true,
          page_size: 20, // Limit results for search
          ordering: 'name'
        }

        const queryString = buildQuery(queryParams)
        const { data } = await api.get<PaginatedPurchaseSupplierList>(endpoints.suppliers.list + queryString)
        
        return data.results
      } catch (error: any) {
        console.error('Error searching suppliers:', error)
        return []
      }
    },

    // Set current supplier
    setCurrent(supplier: PurchaseSupplier | null) {
      this.current = supplier
    },

    // Clear error
    clearError() {
      this.error = null
    }
  }
})