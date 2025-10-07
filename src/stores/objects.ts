import { computed } from 'vue'
import { endpoints } from '@/api/endpoints'
import { createBaseStore } from '@/stores/base'
import type { 
  Object, 
  ObjectRequest, 
  PatchedObjectRequest,
  ObjectResponsible
} from '@/api/types'
import api from '@/api/client'

const objectsStore = createBaseStore<Object, ObjectRequest, PatchedObjectRequest>({
  endpoint: endpoints.objects,
  entityName: 'objects',
  entityNamePlural: 'объекты'
})

export const useObjectsStore = objectsStore

// Custom getters for objects
export const activeObjects = computed(() => {
  return objectsStore.items.filter((item: Object) => item.is_active)
})

// Custom actions for objects
export const fetchResponsibles = async (): Promise<ObjectResponsible[]> => {
  objectsStore.loading = true
  objectsStore.error = null

  try {
    const response = await api.get(endpoints.objects.responsibles)
    return response.data
  } catch (err: any) {
    objectsStore.error = err?.response?.data?.detail || 'Ошибка загрузки ответственных'
    throw err
  } finally {
    objectsStore.loading = false
  }
}