/**
 * Store для управления объектами
 */
import { endpoints } from '@/api/endpoints'
import { createBaseStore } from './base'
import { parseApiError } from '@/utils/errorHandler'
import type { 
  SiteObject, 
  ObjectRequest, 
  PatchedObjectRequest,
  ObjectResponsible
} from '@/api/types'
import api from '@/api/client'

// Создаём store
export const useObjectsStore = createBaseStore<SiteObject, ObjectRequest, PatchedObjectRequest>({
  endpoint: endpoints.objects,
  entityName: 'objects',
  entityNamePlural: 'объекты',
  defaultOrdering: 'name'
})

// ============================================================================
// Custom Actions
// ============================================================================

export const fetchResponsibles = async (): Promise<ObjectResponsible[]> => {
  const store = useObjectsStore()
  store.loading = true
  store.error = null

  try {
    const response = await api.get(endpoints.objects.responsibles)
    return response.data
  } catch (err: any) {
    const parsedError = parseApiError(err)
    store.error = parsedError.detail
    throw err
  } finally {
    store.loading = false
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

export const getActiveObjects = () => {
  const store = useObjectsStore()
  return store.items.filter((item: SiteObject) => item.is_active)
}

