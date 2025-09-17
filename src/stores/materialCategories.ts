import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/client'
import endpoints, { buildQuery } from '@/api/endpoints'
import type { MaterialCategoryLite, PageResponse } from '@/api/types'

export const useMaterialCategoriesStore = defineStore('materialCategories', () => {
  const items = ref<MaterialCategoryLite[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const selectOptions = computed(() => 
    items.value.map(category => ({
      value: category.id,
      label: category.name
    }))
  )

  async function fetchList() {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await api.get<PageResponse<MaterialCategoryLite>>(
        endpoints.materialCategories.list + buildQuery({ page_size: 1000, ordering: 'name' })
      )
      items.value = data.results
    } catch (err: any) {
      error.value = err.message || 'Ошибка загрузки категорий'
      console.error('Error fetching material categories:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: number) {
    try {
      const { data } = await api.get<MaterialCategoryLite>(endpoints.materialCategories.one(id))
      return data
    } catch (err: any) {
      error.value = err.message || 'Ошибка загрузки категории'
      console.error('Error fetching material category:', err)
      throw err
    }
  }

  async function create(categoryData: { name: string; parent?: number }) {
    try {
      const { data } = await api.post<MaterialCategoryLite>(endpoints.materialCategories.list, categoryData)
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
      const { data } = await api.patch<MaterialCategoryLite>(endpoints.materialCategories.one(id), categoryData)
      const index = items.value.findIndex(item => item.id === id)
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
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value.splice(index, 1)
      }
    } catch (err: any) {
      error.value = err.message || 'Ошибка удаления категории'
      console.error('Error deleting material category:', err)
      throw err
    }
  }

  return {
    items,
    loading,
    error,
    selectOptions,
    fetchList,
    fetchOne,
    create,
    update,
    remove
  }
})
