import { defineStore } from 'pinia'
import api from '@/api/client'
import { endpoints, buildQuery } from '@/api/endpoints'
import type { 
  Unit, 
  UnitRequest, 
  PatchedUnitRequest,
  PaginatedUnitList 
} from '@/api/types'

export const useUnitsStore = defineStore('units', {
  state: () => ({
    items: [] as Unit[],
    current: null as Unit | null,
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
      code: '',
      name: '',
      ordering: 'code' as string
    }
  }),

  getters: {
    // Get unit by ID
    getById: (state) => (id: number) => {
      return state.items.find(item => item.id === id)
    },

    // Get unit by code
    getByCode: (state) => (code: string) => {
      return state.items.find(item => item.code === code)
    },

    // Check if unit exists
    exists: (state) => (id: number) => {
      return state.items.some(item => item.id === id)
    },

    // Get units for select options
    selectOptions: (state) => {
      return state.items.map(unit => ({
        value: unit.id,
        label: `${unit.name} (${unit.code})`
      }))
    }
  },

  actions: {
    // Fetch units list
    async fetchList(params?: {
      page?: number
      search?: string
      code?: string
      name?: string
      ordering?: string
    }): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const queryParams = {
          page: params?.page || this.pagination.page,
          page_size: this.pagination.pageSize,
          search: params?.search ?? this.filters.search ?? undefined,
          code: params?.code ?? this.filters.code ?? undefined,
          name: params?.name ?? this.filters.name ?? undefined,
          ordering: params?.ordering ?? this.filters.ordering
        }

        const query = buildQuery(queryParams)
        const { data } = await api.get<PaginatedUnitList>(endpoints.units.list + query)

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
        
        this.error = error?.response?.data?.detail || 'Ошибка загрузки единиц измерения'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch single unit
    async fetchOne(id: number) {
      this.loading = true
      this.error = null

      try {
        const { data } = await api.get<Unit>(endpoints.units.one(id))
        this.current = data

        // Update in list if exists
        const index = this.items.findIndex(item => item.id === id)
        if (index !== -1) {
          this.items[index] = data
        }

        return data
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка загрузки единицы измерения'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Create new unit
    async create(data: UnitRequest) {
      this.loading = true
      this.error = null

      try {
        const { data: newUnit } = await api.post<Unit>(endpoints.units.list, data)
        
        // Add to list
        this.items.unshift(newUnit)
        this.pagination.count++

        return newUnit
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка создания единицы измерения'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Update unit
    async update(id: number, data: PatchedUnitRequest) {
      this.loading = true
      this.error = null

      try {
        const { data: updatedUnit } = await api.patch<Unit>(endpoints.units.one(id), data)
        
        // Update in list
        const index = this.items.findIndex(item => item.id === id)
        if (index !== -1) {
          this.items[index] = updatedUnit
        }

        // Update current if it's the same
        if (this.current?.id === id) {
          this.current = updatedUnit
        }

        return updatedUnit
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка обновления единицы измерения'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Delete unit
    async delete(id: number) {
      this.loading = true
      this.error = null

      try {
        await api.delete(endpoints.units.one(id))
        
        // Remove from list
        this.items = this.items.filter(item => item.id !== id)
        this.pagination.count--

        // Clear current if it's the same
        if (this.current?.id === id) {
          this.current = null
        }

        return true
      } catch (error: any) {
        this.error = error?.response?.data?.detail || 'Ошибка удаления единицы измерения'
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
        code: '',
        name: '',
        ordering: 'code'
      }
    },

    // Set current unit
    setCurrent(unit: Unit | null) {
      this.current = unit
    },

    // Clear error
    clearError() {
      this.error = null
    }
  }
})

