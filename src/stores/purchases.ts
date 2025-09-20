import { defineStore } from 'pinia'
import api from '@/api/client'
import { endpoints, buildQuery } from '@/api/endpoints'
import type { 
  Purchase, 
  PurchaseRequest, 
  PatchedPurchaseRequest,
  PurchasePhotoUploadRequest,
  PaginatedPurchaseList,
  PurchaseListFilters 
} from '@/api/types'

export const usePurchasesStore = defineStore('purchases', {
  state: () => ({
    items: [] as Purchase[],
    current: null as Purchase | null,
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
      date_after: '',
      date_before: '',
      object: null as number | null,
      material: null as number | null,
      responsible: null as number | null,
      search: '',
      is_archived: null as boolean | null,
      ordering: '-date' as string
    }
  }),

  getters: {
    // Get purchase by ID
    getById: (state) => (id: number) => {
      return state.items.find(item => item.id === id)
    },

    // Get purchases by object
    getByObject: (state) => (objectId: number) => {
      return state.items.filter(item => item.object === objectId)
    },

    // Get purchases by responsible
    getByResponsible: (state) => (responsibleId: number) => {
      return state.items.filter(item => item.responsible === responsibleId)
    },

    // Get active purchases (not archived)
    activePurchases: (state) => {
      return state.items.filter(item => !item.is_archived)
    },

    // Get archived purchases
    archivedPurchases: (state) => {
      return state.items.filter(item => item.is_archived)
    },

    // Check if purchase exists
    exists: (state) => (id: number) => {
      return state.items.some(item => item.id === id)
    },

    // Calculate total amount for current purchases
    totalAmount: (state) => {
      return state.items.reduce((sum, purchase) => {
        return sum + parseFloat(purchase.total_amount || '0')
      }, 0)
    }
  },

  actions: {
    // Fetch purchases list
    async fetchList(params?: Partial<PurchaseListFilters>) {
      this.loading = true
      this.error = null

      try {
        const queryParams = {
          page: params?.page || this.pagination.page,
          page_size: this.pagination.pageSize,
          date_after: (params as any)?.date_after ?? (this.filters as any).date_after ?? undefined,
          date_before: (params as any)?.date_before ?? (this.filters as any).date_before ?? undefined,
          object: params?.object ?? this.filters.object ?? undefined,
          material: (params as any)?.material ?? (this.filters as any).material ?? undefined,
          responsible: params?.responsible ?? this.filters.responsible ?? undefined,
          search: params?.search ?? this.filters.search ?? undefined,
          is_archived: params?.is_archived ?? this.filters.is_archived ?? undefined,
          ordering: params?.ordering ?? this.filters.ordering
        }

        const query = buildQuery(queryParams)
        const { data } = await api.get<PaginatedPurchaseList>(endpoints.purchases.list + query)

        this.items = data.results
        this.pagination = {
          count: data.count,
          page: queryParams.page || 1,
          pageSize: this.pagination.pageSize,
          next: data.next || null,
          previous: data.previous || null
        }

        // Update filters
        if (params) {
          Object.assign(this.filters, params)
        }

        return data
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка загрузки закупок'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch single purchase
    async fetchOne(id: number) {
      this.loading = true
      this.error = null

      try {
        console.log('Fetching purchase from API:', endpoints.purchases.one(id))
        const { data } = await api.get<Purchase>(endpoints.purchases.one(id))
        console.log('API response:', data)
        this.current = data

        // Update in list if exists
        const index = this.items.findIndex(item => item.id === id)
        if (index !== -1) {
          this.items[index] = data
        }

        return data
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка загрузки закупки'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Create new purchase
    async create(data: PurchaseRequest) {
      this.loading = true
      this.error = null

      try {
        const { data: newPurchase } = await api.post<Purchase>(endpoints.purchases.list, data)
        
        // Add to list
        this.items.unshift(newPurchase)
        this.pagination.count++

        return newPurchase
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка создания закупки'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Update purchase
    async update(id: number, data: PatchedPurchaseRequest) {
      this.loading = true
      this.error = null

      try {
        const { data: updatedPurchase } = await api.patch<Purchase>(endpoints.purchases.one(id), data)
        
        // Update in list
        const index = this.items.findIndex(item => item.id === id)
        if (index !== -1) {
          this.items[index] = updatedPurchase
        }

        // Update current if it's the same
        if (this.current?.id === id) {
          this.current = updatedPurchase
        }

        return updatedPurchase
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка обновления закупки'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Delete purchase
    async delete(id: number) {
      this.loading = true
      this.error = null

      try {
        await api.delete(endpoints.purchases.one(id))
        
        // Remove from list
        this.items = this.items.filter(item => item.id !== id)
        this.pagination.count--

        // Clear current if it's the same
        if (this.current?.id === id) {
          this.current = null
        }

        return true
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка удаления закупки'
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

    // Upload photo for purchase
    async uploadPhoto(id: number, data: PurchasePhotoUploadRequest) {
      this.loading = true
      this.error = null

      try {
        const formData = new FormData()
        if (data.photo) {
          formData.append('photo', data.photo)
        }
        if (data.is_cover !== undefined) {
          formData.append('is_cover', data.is_cover.toString())
        }

        await api.post(endpoints.purchases.uploadPhoto(id), formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        // Refresh the purchase to get updated photos
        await this.fetchOne(id)

        return true
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка загрузки фото'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Delete photo for purchase
    async deletePhoto(id: number, photoId: number) {
      this.loading = true
      this.error = null

      try {
        await api.delete(endpoints.purchases.deletePhoto(id, photoId))

        // Refresh the purchase to get updated photos
        await this.fetchOne(id)

        return true
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка удаления фото'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Export purchases to Excel
    async exportToExcel(params?: Partial<PurchaseListFilters>) {
      this.loading = true
      this.error = null

      try {
        const queryParams = {
          ...this.filters,
          ...params,
          export: 'xlsx' as const
        }

        const query = buildQuery(queryParams)
        const response = await api.get(endpoints.purchases.list + query, {
          responseType: 'blob'
        })

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `purchases_${new Date().toISOString().split('T')[0]}.xlsx`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        return true
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка экспорта закупок'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Set filters
    setFilters(filters: Partial<typeof this.filters>) {
      Object.assign(this.filters, filters)
    },

    // Reset filters
    resetFilters() {
      this.filters = {
        date_after: '',
        date_before: '',
        object: null,
        material: null,
        responsible: null,
        search: '',
        is_archived: null,
        ordering: '-date'
      }
    },

    // Set current purchase
    setCurrent(purchase: Purchase | null) {
      this.current = purchase
    },

    // Clear error
    clearError() {
      this.error = null
    }
  }
})

