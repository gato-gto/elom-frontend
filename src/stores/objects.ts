import { defineStore } from 'pinia'
import { computed } from 'vue'
import { endpoints } from '@/api/endpoints'
import { createBaseStore } from '@/stores/base'
import type { 
  Object, 
  ObjectRequest, 
  PatchedObjectRequest
} from '@/api/types'

export const useObjectsStore = createBaseStore<Object, ObjectRequest, PatchedObjectRequest>({
  endpoint: endpoints.objects,
  entityName: 'objects',
  entityNamePlural: 'объекты'
})

// Custom getters for objects
export const activeObjects = computed(() => {
  return useObjectsStore.items.filter((item: Object) => item.is_active)
})