import { defineStore } from 'pinia'
import { computed } from 'vue'
import api from '@/api/client'
import { endpoints, buildQuery } from '@/api/endpoints'
import { createBaseStore } from '@/stores/base'
import type { MaterialCategory, MaterialCategoryLite } from '@/api/types/common'
import type { PageResponse } from '@/api/types/common'

export const useMaterialCategoriesStore = createBaseStore<MaterialCategory, any, any>({
  endpoint: endpoints.materialCategories,
  entityName: 'materialCategories',
  entityNamePlural: 'категории материалов'
})

// Custom getters for material categories
export const selectOptions = computed(() => 
  useMaterialCategoriesStore.items.map((category: MaterialCategory) => ({
    value: category.id,
    label: category.name
  }))
)

// Custom actions for material categories
export const fetchLite = async (): Promise<MaterialCategoryLite[]> => {
  try {
    const { data } = await api.get<MaterialCategoryLite[]>(endpoints.materialCategories.list + 'lite/')
    return data
  } catch (error: any) {
    console.error('Error fetching lite categories:', error)
    return []
  }
}