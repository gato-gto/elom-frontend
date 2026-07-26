/**
 * Store для управления материалами
 */
import api from '@/api/client'
import { endpoints, buildQuery } from '@/api/endpoints'
import { createBaseStore } from './base'
import { parseApiError, handleApiErrorAsync } from '@/utils/errorHandler'
import type {
  Material,
  MaterialRequest,
  PatchedMaterialRequest,
  PaginatedMaterialList
} from '@/api/types'
import type { MaterialBalance, BalancesByObjectsResponse } from '@/api/types/stocks'

// Создаём store
export const useMaterialsStore = createBaseStore<Material, MaterialRequest, PatchedMaterialRequest>({
  endpoint: endpoints.materials,
  entityName: 'materials',
  entityNamePlural: 'материалы',
  defaultOrdering: '-id'
})

// ============================================================================
// Custom Actions
// ============================================================================

export const getMaterialsByObject = async (objectId: number): Promise<Material[]> => {
  try {
    const queryParams = {
      object_id: objectId,
      is_active: true
    }

    const queryString = buildQuery(queryParams)
    const { data } = await api.get<Material[]>(endpoints.materials.byObject + queryString)

    return data
  } catch (error: any) {
    // FE-12: НЕ возвращаем [] — иначе сбой выглядит как «нет материалов» и молча блокирует
    // списание. Пробрасываем: вызывающий (WriteOffForm) покажет ошибку, отличив её от «пусто».
    console.error('Error getting materials by object:', error)
    throw error
  }
}

/**
 * Материалы, доступные к СПИСАНИЮ на объекте на дату — только те, что реально в наличии
 * (книжный остаток current_balance > 0). Единый источник для форм, которые списывают из
 * остатков: MaterialSearchSelect (filter-by-balance) и WriteOffByBalanceForm («Внести остатки»).
 * Закупки (добавляют новый материал) и фильтры списков сюда НЕ входят — там материал не обязан
 * быть в наличии. Баланс берётся из канонического /stock/snapshots/by-objects/ (net по всем
 * строкам, вкл. архивные, clamp ≥0 — см. BUSINESS_LOGIC.md / D-012/D-016).
 *
 * Без объекта/даты возвращает [] (запрос не делает). При сетевой ошибке ПРОБРАСЫВАЕТ исключение —
 * решение fail-open/fail-closed принимает вызывающий: MaterialSearchSelect показывает результаты
 * поиска как есть (fail-open, чтобы сбой by-objects не выглядел как «ничего не найдено»), а
 * WriteOffByBalanceForm оставляет список пустым (fail-closed — не предлагать то, чего нет).
 */
export const getMaterialsInStock = async (
  objectId: number,
  date: string,
): Promise<MaterialBalance[]> => {
  if (!objectId || !date) { return [] }
  const queryString = buildQuery({ object_id: objectId, date })
  const { data } = await api.get<BalancesByObjectsResponse>(
    endpoints.stockSnapshots.byObjects + queryString,
  )
  const objectData = data?.objects?.[0]
  if (!objectData?.materials) { return [] }
  return objectData.materials.filter(m => parseFloat(m.current_balance || '0') > 0)
}

export const uploadPhoto = async (id: number, photo: File) => {
  const store = useMaterialsStore()
  store.loading = true
  store.error = null

  try {
    const formData = new FormData()
    formData.append('photo', photo)

    const { data } = await api.post<{ photo_url: string }>(
      endpoints.materials.uploadPhoto(id), 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    const index = store.items.findIndex(item => item.id === id)
    if (index !== -1) {
      store.items[index].photo_url = data.photo_url
    }

    if (store.current?.id === id) {
      store.current.photo_url = data.photo_url
    }

    return data.photo_url
  } catch (error: any) {
    const parsedError = parseApiError(error)
    store.error = parsedError.detail
    throw error
  } finally {
    store.loading = false
  }
}

export const deletePhoto = async (id: number) => {
  const store = useMaterialsStore()
  store.loading = true
  store.error = null

  try {
    await api.delete(endpoints.materials.deletePhoto(id))

    const index = store.items.findIndex(item => item.id === id)
    if (index !== -1) {
      store.items[index].photo_url = undefined
    }

    if (store.current?.id === id) {
      store.current.photo_url = undefined
    }

    return true
  } catch (error: any) {
    const parsedError = parseApiError(error)
    store.error = parsedError.detail
    throw error
  } finally {
    store.loading = false
  }
}

export const searchMaterials = async (query: string): Promise<Material[]> => {
  try {
    const queryParams = {
      search: query,
      page_size: 20,
      ordering: 'name'
    }

    const queryString = buildQuery(queryParams)
    const { data } = await api.get<PaginatedMaterialList>(endpoints.materials.list + queryString)
    
    // API может возвращать либо объект с results, либо массив
    return Array.isArray(data) ? data : (data?.results || [])
  } catch (error: any) {
    // EH-FE-10 (F-552): показать тост, чтобы сбой поиска не выглядел как «ничего не найдено»
    // (как в base.ts search перед return []).
    await handleApiErrorAsync(error, { operation: 'search', entity: 'материалы' })
    return []
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

export const getByCategory = (categoryId: number) => {
  const store = useMaterialsStore()
  return store.items.filter((item: Material) => item.category === categoryId)
}
