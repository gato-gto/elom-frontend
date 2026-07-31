/**
 * Store категорий работ прайс-каталога (двухуровневые A→B).
 * Правит только руководство (RBAC ресурс work_categories.*).
 */
import api from '@/api/client'
import { endpoints, buildQuery } from '@/api/endpoints'
import { createBaseStore } from './base'
import { handleApiErrorAsync } from '@/utils/errorHandler'
import type { WorkCategory, WorkCategoryRequest } from '@/api/types/estimates'

export const useWorkCategoriesStore = createBaseStore<
  WorkCategory,
  WorkCategoryRequest,
  Partial<WorkCategoryRequest>
>({
  endpoint: endpoints.workCategories,
  entityName: 'workCategories',
  entityNamePlural: 'категории работ',
  defaultOrdering: 'order',
})

// ── Хелперы каскада A→B (для формы сметы и справочника) ──
// Сбой ПРОБРАСЫВАЕТ (как getMaterialsByObject): вызывающий отличит ошибку от «пусто».

/** Корневые категории (A-разделы). */
export const fetchRootCategories = async (): Promise<WorkCategory[]> => {
  const { data } = await api.get(
    endpoints.workCategories.list + buildQuery({ parent__isnull: true, is_active: true, page_size: 1000 }),
  )
  return data.results || data
}

/** Подразделы (B) выбранного A-раздела. */
export const fetchChildCategories = async (parentId: number): Promise<WorkCategory[]> => {
  if (!parentId) { return [] }
  const { data } = await api.get(
    endpoints.workCategories.list + buildQuery({ parent: parentId, is_active: true, page_size: 1000 }),
  )
  return data.results || data
}

/** Мягкий вариант для дропдаунов: сбой → тост + [] (не роняет форму). */
export const fetchRootCategoriesSafe = async (): Promise<WorkCategory[]> => {
  try {
    return await fetchRootCategories()
  } catch (error: any) {
    await handleApiErrorAsync(error, { operation: 'dataLoading', entity: 'категории работ' })
    return []
  }
}
