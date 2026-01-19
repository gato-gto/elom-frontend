/**
 * Store для управления материалами
 */
import api from '@/api/client'
import { endpoints, buildQuery } from '@/api/endpoints'
import { createBaseStore } from './base'
import { parseApiError } from '@/utils/errorHandler'
import type { 
  Material, 
  MaterialRequest, 
  PatchedMaterialRequest,
  PaginatedMaterialList 
} from '@/api/types'

// Создаём store
export const useMaterialsStore = createBaseStore<Material, MaterialRequest, PatchedMaterialRequest>({
  endpoint: endpoints.materials,
  entityName: 'materials',
  entityNamePlural: 'материалы',
  defaultOrdering: 'name'
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
    console.error('Error getting materials by object:', error)
    return []
  }
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
    console.error('Error searching materials:', error)
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
