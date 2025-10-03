import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/client'
import endpoints, { buildQuery } from '@/api/endpoints'
import type { MaterialCategory, MaterialCategoryLite, PageResponse } from '@/api/types'

export const useMaterialCategoriesStore = defineStore('materialCategories', () => {
  const items = ref<MaterialCategory[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    count: 0,
    page: 1,
    pageSize: 1000,
    next: null as string | null,
    previous: null as string | null
  })
  const filters = ref({
    search: '',
    parent: '',
    ordering: 'name'
  })

  const selectOptions = computed(() => 
    items.value.map((category: MaterialCategory) => ({
      value: category.id,
      label: category.name
    }))
  )

  async function fetchList(params?: any) {
    loading.value = true
    error.value = null
    
    try {
      const queryParams = {
        page_size: 1000,
        ordering: params?.ordering || filters.value.ordering,
        search: params?.search || filters.value.search || undefined,
        parent: params?.parent || filters.value.parent || undefined
      }

      const { data } = await api.get<PageResponse<MaterialCategory>>(
        endpoints.materialCategories.list + buildQuery(queryParams)
      )
      items.value = data.results
      pagination.value = {
        count: data.count,
        page: 1,
        pageSize: 1000,
        next: data.next || null,
        previous: data.previous || null
      }
    } catch (err: any) {
      error.value = err.message || 'Ошибка загрузки категорий'
      console.error('Error fetching material categories:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: number) {
    try {
      const { data } = await api.get<MaterialCategory>(endpoints.materialCategories.one(id))
      return data
    } catch (err: any) {
      error.value = err.message || 'Ошибка загрузки категории'
      console.error('Error fetching material category:', err)
      throw err
    }
  }

  async function create(categoryData: { name: string; parent?: number }) {
    try {
      const { data } = await api.post<MaterialCategory>(endpoints.materialCategories.list, categoryData)
      items.value.push(data)
      return data
    } catch (err: any) {
      error.value = err.message || 'Ошибка создания категории'
      console.error('Error creating material category:', err)
      throw err
    }
  }

  async function update(id: number, categoryData: { name?: string; parent?: number }) {
    try {
      const { data } = await api.patch<MaterialCategory>(endpoints.materialCategories.one(id), categoryData)
      const index = items.value.findIndex((item: MaterialCategory) => item.id === id)
      if (index !== -1) {
        items.value[index] = data
      }
      return data
    } catch (err: any) {
      error.value = err.message || 'Ошибка обновления категории'
      console.error('Error updating material category:', err)
      throw err
    }
  }

  async function remove(id: number) {
    try {
      await api.delete(endpoints.materialCategories.one(id))
      const index = items.value.findIndex((item: MaterialCategory) => item.id === id)
      if (index !== -1) {
        items.value.splice(index, 1)
      }
    } catch (err: any) {
      error.value = err.message || 'Ошибка удаления категории'
      console.error('Error deleting material category:', err)
      throw err
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    items,
    loading,
    error,
    pagination,
    filters,
    selectOptions,
    fetchList,
    fetchOne,
    create,
    update,
    remove,
    clearError
  }
})
