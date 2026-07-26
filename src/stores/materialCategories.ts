/**
 * Store для управления категориями материалов
 */
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { createBaseStore } from './base'
import type { MaterialCategory, MaterialCategoryLite } from '@/api/types/common'

// Создаём store
export const useMaterialCategoriesStore = createBaseStore<MaterialCategory, any, any>({
  endpoint: endpoints.materialCategories,
  entityName: 'materialCategories',
  entityNamePlural: 'категории материалов',
  defaultOrdering: '-id'
})

// ============================================================================
// Custom Actions
// ============================================================================

export const fetchLite = async (): Promise<MaterialCategoryLite[]> => {
  try {
    // material-categories has no `lite` action; the plain list is already lightweight (F-055)
    const { data } = await api.get<MaterialCategoryLite[] | { results: MaterialCategoryLite[] }>(endpoints.materialCategories.list)
    // API может возвращать либо массив, либо объект с results
    return Array.isArray(data) ? data : (data?.results || [])
  } catch (error: any) {
    console.error('Error fetching lite categories:', error)
    return []
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

export const getCategorySelectOptions = () => {
  const store = useMaterialCategoriesStore()
  return store.items.map((category: MaterialCategory) => ({
    value: category.id,
    label: category.name
  }))
}
