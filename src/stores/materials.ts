import { defineStore } from 'pinia'
import api from '@/api/client'
import { endpoints, buildQuery } from '@/api/endpoints'
import type { 
  Material, 
  MaterialRequest, 
  PatchedMaterialRequest,
  PageResponse,
  PaginatedMaterialList 
} from '@/api/types'

export const useMaterialsStore = defineStore('materials', {
  state: () => ({
    items: [] as Material[],
    current: null as Material | null,
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
      name: '',
      sku: '',
      category: '' as string,
      ordering: 'name' as string
    }
  }),

  getters: {
    // Get material by ID
    getById: (state) => (id: number) => {
      return state.items.find(item => item.id === id)
    },

    // Get materials by category
    getByCategory: (state) => (categoryId: number) => {
      return state.items.filter(item => item.category === categoryId)
    },

    // Check if material exists
    exists: (state) => (id: number) => {
      return state.items.some(item => item.id === id)
    },

    // Select options for dropdowns
    selectOptions: (state) => {
      return state.items.map(item => ({
        value: item.id,
        label: item.name
      }))
    }
  },

  actions: {
    // Fetch materials list
    async fetchList(params?: {
      page?: number
      search?: string
      name?: string
      sku?: string
      category?: string
      ordering?: string
    }): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const queryParams = {
          page: params?.page || this.pagination.page,
          page_size: this.pagination.pageSize,
          search: params?.search ?? this.filters.search ?? undefined,
          name: params?.name ?? this.filters.name ?? undefined,
          sku: params?.sku ?? this.filters.sku ?? undefined,
          category: params?.category ?? this.filters.category ?? undefined,
          ordering: params?.ordering ?? this.filters.ordering
        }

        const query = buildQuery(queryParams)
        const { data } = await api.get<PaginatedMaterialList>(endpoints.materials.list + query)

        this.items = data.results
        this.pagination = {
          count: data.count,
          page: queryParams.page,
          pageSize: this.pagination.pageSize,
          next: data.next,
          previous: data.previous
        }

        // Update filters
        if (params) {
          Object.assign(this.filters, params)
        }
      } catch (error: any) {
        // Если ошибка связана с неправильной страницей, возвращаемся на первую страницу
        if (error?.response?.data?.detail === 'Неправильная страница' || 
            error?.response?.status === 404) {
          console.warn('Invalid page requested, redirecting to page 1')
          // Рекурсивно вызываем fetchList с первой страницей
          return this.fetchList({ ...params, page: 1 })
        }
        
        this.error = error?.response?.data?.detail || 'Ошибка загрузки материалов'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch single material
    async fetchOne(id: number) {
      this.loading = true
      this.error = null

      try {
        const { data } = await api.get<Material>(endpoints.materials.one(id))
        this.current = data

        // Update in list if exists
        const index = this.items.findIndex(item => item.id === id)
        if (index !== -1) {
          this.items[index] = data
        }

        return data
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка загрузки материала'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Create new material
    async create(data: MaterialRequest) {
      this.loading = true
      this.error = null

      try {
        // Create FormData for multipart/form-data
        const formData = new FormData()
        formData.append('name', data.name)
        if (data.sku) formData.append('sku', data.sku)
        if (data.category) formData.append('category', data.category.toString())
        formData.append('default_unit', data.default_unit.toString())
        if (data.created_date) formData.append('created_date', data.created_date)

        const { data: newMaterial } = await api.post<Material>(endpoints.materials.list, formData)
        
        // Add to list
        this.items.unshift(newMaterial)
        this.pagination.count++

        return newMaterial
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка создания материала'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Update material
    async update(id: number, data: PatchedMaterialRequest) {
      this.loading = true
      this.error = null

      try {
        // Create FormData for multipart/form-data
        const formData = new FormData()
        if (data.name) formData.append('name', data.name)
        if (data.sku !== undefined) formData.append('sku', data.sku)
        if (data.category !== undefined) formData.append('category', data.category?.toString() || '')
        if (data.default_unit) formData.append('default_unit', data.default_unit.toString())
        if (data.created_date) formData.append('created_date', data.created_date)

        const { data: updatedMaterial } = await api.patch<Material>(endpoints.materials.one(id), formData)
        
        // Update in list
        const index = this.items.findIndex(item => item.id === id)
        if (index !== -1) {
          this.items[index] = updatedMaterial
        }

        // Update current if it's the same
        if (this.current?.id === id) {
          this.current = updatedMaterial
        }

        return updatedMaterial
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка обновления материала'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Delete material
    async delete(id: number) {
      this.loading = true
      this.error = null

      try {
        await api.delete(endpoints.materials.one(id))
        
        // Remove from list
        this.items = this.items.filter(item => item.id !== id)
        this.pagination.count--

        // Clear current if it's the same
        if (this.current?.id === id) {
          this.current = null
        }

        return true
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка удаления материала'
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
        name: '',
        sku: '',
        category: '',
        ordering: 'name'
      }
    },

    // Upload photo for material
    async uploadPhoto(id: number, photo: File) {
      this.loading = true
      this.error = null

      try {
        const formData = new FormData()
        formData.append('photo', photo)

        const { data } = await api.post<{ photo_url: string }>(
          endpoints.materials.uploadPhoto(id), 
          formData
        )

        // Update material in list with new photo_url
        const index = this.items.findIndex(item => item.id === id)
        if (index !== -1) {
          this.items[index].photo_url = data.photo_url
        }

        // Update current if it's the same
        if (this.current?.id === id) {
          this.current.photo_url = data.photo_url
        }

        return data.photo_url
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка загрузки фото'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Delete photo for material
    async deletePhoto(id: number) {
      this.loading = true
      this.error = null

      try {
        await api.delete(endpoints.materials.uploadPhoto(id))

        // Update material in list to remove photo_url
        const index = this.items.findIndex(item => item.id === id)
        if (index !== -1) {
          this.items[index].photo_url = undefined
        }

        // Update current if it's the same
        if (this.current?.id === id) {
          this.current.photo_url = undefined
        }

        return true
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка удаления фото'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Set current material
    setCurrent(material: Material | null) {
      this.current = material
    },

    // Clear error
    clearError() {
      this.error = null
    }
  }
})
