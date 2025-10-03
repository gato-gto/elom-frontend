import { defineStore } from 'pinia'
import { computed } from 'vue'
import api from '@/api/client'
import { endpoints, buildQuery } from '@/api/endpoints'
import { createBaseStore } from '@/stores/base'
import type { 
  Purchase, 
  PurchaseRequest, 
  PatchedPurchaseRequest,
  PurchasePhotoUploadRequest,
  PaginatedPurchaseList,
  PurchaseListFilters 
} from '@/api/types'

export const usePurchasesStore = createBaseStore<Purchase, PurchaseRequest, PatchedPurchaseRequest>({
  endpoint: endpoints.purchases,
  entityName: 'закупка',
  entityNamePlural: 'закупки'
})

// Custom getters for purchases
export const getByObject = (objectId: number) => {
  return usePurchasesStore.items.filter((item: Purchase) => item.object === objectId)
}

export const getByResponsible = (responsibleId: number) => {
  return usePurchasesStore.items.filter((item: Purchase) => item.responsible === responsibleId)
}

export const activePurchases = computed(() => {
  return usePurchasesStore.items.filter((item: Purchase) => !item.is_archived)
})

export const archivedPurchases = computed(() => {
  return usePurchasesStore.items.filter((item: Purchase) => item.is_archived)
})

export const totalAmount = computed(() => {
  return usePurchasesStore.items.reduce((sum: number, purchase: Purchase) => {
    return sum + parseFloat(purchase.total_amount || '0')
  }, 0)
})

// Custom actions for purchases
export const uploadPhoto = async (id: number, data: PurchasePhotoUploadRequest) => {
  usePurchasesStore.loading = true
  usePurchasesStore.error = null

  try {
    const formData = new FormData()
    if (data.photo) {
      formData.append('photo', data.photo)
    }
    if (data.is_cover !== undefined) {
      formData.append('is_cover', data.is_cover.toString())
    }
    if (data.photo_type) {
      formData.append('photo_type', data.photo_type)
    }

    await api.post(endpoints.purchases.uploadPhoto(id), formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    // Refresh the purchase to get updated photos
    await usePurchasesStore.fetchOne(id)

    return true
  } catch (error: any) {
    usePurchasesStore.error = error?.response?.data?.detail || 'Ошибка загрузки фото'
    throw error
  } finally {
    usePurchasesStore.loading = false
  }
}

export const deletePhoto = async (id: number, photoId: number) => {
  usePurchasesStore.loading = true
  usePurchasesStore.error = null

  try {
    await api.delete(endpoints.purchases.deletePhoto(id, photoId))

    // Refresh the purchase to get updated photos
    await usePurchasesStore.fetchOne(id)

    return true
  } catch (error: any) {
    usePurchasesStore.error = error?.response?.data?.detail || 'Ошибка удаления фото'
    throw error
  } finally {
    usePurchasesStore.loading = false
  }
}

export const exportToExcel = async (params?: Partial<PurchaseListFilters>) => {
  usePurchasesStore.loading = true
  usePurchasesStore.error = null

  try {
    const queryParams = {
      ...usePurchasesStore.filters,
      ...params,
      export: 'xlsx' as const
    }

    const query = buildQuery(queryParams)
    const response = await api.get(endpoints.purchases.list + query, {
      responseType: 'blob'
    })

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `purchases_${new Date().toISOString().split('T')[0]}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    return true
  } catch (error: any) {
    usePurchasesStore.error = error?.response?.data?.detail || 'Ошибка экспорта закупок'
    throw error
  } finally {
    usePurchasesStore.loading = false
  }
}

