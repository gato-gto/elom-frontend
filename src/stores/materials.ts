import { defineStore } from 'pinia'
import api from '@/api/client'
import { endpoints, buildQuery } from '@/api/endpoints'
import { createBaseStore } from '@/stores/base'
import type { 
  Material, 
  MaterialRequest, 
  PatchedMaterialRequest,
  PaginatedMaterialList 
} from '@/api/types'

// Create base store
export const useMaterialsStore = createBaseStore<Material, MaterialRequest, PatchedMaterialRequest>({
  endpoint: endpoints.materials,
  entityName: 'materials',
  entityNamePlural: 'материалы'
})

// Override getMaterialsByObject with actual implementation
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

// Override uploadPhoto with actual implementation
export const uploadPhoto = async (id: number, photo: File) => {
  useMaterialsStore.loading = true
  useMaterialsStore.error = null

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

    const index = useMaterialsStore.items.findIndex(item => item.id === id)
    if (index !== -1) {
      useMaterialsStore.items[index].photo_url = data.photo_url
    }

    if (useMaterialsStore.current?.id === id) {
      useMaterialsStore.current.photo_url = data.photo_url
    }

    return data.photo_url
  } catch (error: any) {
    useMaterialsStore.error = error?.response?.data?.detail || 'Ошибка загрузки фото'
    throw error
  } finally {
    useMaterialsStore.loading = false
  }
}

// Override deletePhoto with actual implementation
export const deletePhoto = async (id: number) => {
  useMaterialsStore.loading = true
  useMaterialsStore.error = null

  try {
    await api.delete(endpoints.materials.deletePhoto(id))

    const index = useMaterialsStore.items.findIndex(item => item.id === id)
    if (index !== -1) {
      useMaterialsStore.items[index].photo_url = undefined
    }

    if (useMaterialsStore.current?.id === id) {
      useMaterialsStore.current.photo_url = undefined
    }

    return true
  } catch (error: any) {
    useMaterialsStore.error = error?.response?.data?.detail || 'Ошибка удаления фото'
    throw error
  } finally {
    useMaterialsStore.loading = false
  }
}

// Override searchMaterials with materials-specific implementation
export const searchMaterials = async (query: string): Promise<Material[]> => {
  try {
    const queryParams = {
      search: query,
      page_size: 20,
      ordering: 'name'
    }

    const queryString = buildQuery(queryParams)
    const { data } = await api.get<PaginatedMaterialList>(endpoints.materials.list + queryString)
    
    return data.results
  } catch (error: any) {
    console.error('Error searching materials:', error)
    return []
  }
}

// Custom getters for materials
export const getByCategory = (categoryId: number) => {
  return useMaterialsStore.items.filter((item: Material) => item.category === categoryId)
}

