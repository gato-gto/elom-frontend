/**
 * Store для управления закупками
 */
import api from '@/api/client'
import {endpoints, buildQuery} from '@/api/endpoints'
import {createBaseStore} from './base'
import { parseApiError } from '@/utils/errorHandler'
import type {
    Purchase,
    PurchaseRequest,
    PatchedPurchaseRequest,
    PurchasePhotoUploadRequest,
    PurchaseListFilters
} from '@/api/types'

// Создаём store
export const usePurchasesStore = createBaseStore<Purchase, PurchaseRequest, PatchedPurchaseRequest>({
    endpoint: endpoints.purchases,
    entityName: 'purchases',
    entityNamePlural: 'закупки',
    defaultOrdering: '-date'
})

// ============================================================================
// Custom Actions
// ============================================================================

export const uploadPhoto = async (id: number, data: PurchasePhotoUploadRequest) => {
    const store = usePurchasesStore()
    store.loading = true
    store.error = null

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

        await store.fetchOne(id)
        return true
    } catch (error: any) {
        const parsedError = parseApiError(error)
        store.error = parsedError.detail
        throw error
    } finally {
        store.loading = false
    }
}

export const deletePhoto = async (id: number, photoId: number) => {
    const store = usePurchasesStore()
    store.loading = true
    store.error = null

    try {
        await api.delete(endpoints.purchases.deletePhoto(id, photoId))
        await store.fetchOne(id)
        return true
    } catch (error: any) {
        store.error = error?.response?.data?.detail || 'Ошибка удаления фото'
        throw error
    } finally {
        store.loading = false
    }
}

export const exportToExcel = async (params?: Partial<PurchaseListFilters>) => {
    const store = usePurchasesStore()
    store.loading = true
    store.error = null

    try {
        const queryParams = {
            ...store.filters,
            ...params,
            export: 'xlsx' as const
        }

        const query = buildQuery(queryParams)
        const response = await api.get(endpoints.purchases.list + query, {
            responseType: 'blob'
        })

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
        const parsedError = parseApiError(error)
        store.error = parsedError.detail
        throw error
    } finally {
        store.loading = false
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

export const getByObject = (objectId: number) => {
    const store = usePurchasesStore()
    return store.items.filter((item: Purchase) => item.object === objectId)
}

export const getByResponsible = (responsibleId: number) => {
    const store = usePurchasesStore()
    return store.items.filter((item: Purchase) => item.responsible === responsibleId)
}

export const getActivePurchases = () => {
    const store = usePurchasesStore()
    return store.items.filter((item: Purchase) => !item.is_archived)
}

export const getArchivedPurchases = () => {
    const store = usePurchasesStore()
    return store.items.filter((item: Purchase) => item.is_archived)
}

export const getTotalAmount = () => {
    const store = usePurchasesStore()
    return store.items.reduce((sum: number, purchase: Purchase) => {
        return sum + parseFloat(String(purchase.total_amount || '0'))
    }, 0)
}

// ============================================================================
// Request Approval Actions
// ============================================================================

export const approvePurchase = async (id: number): Promise<Purchase> => {
    const store = usePurchasesStore()
    store.loading = true
    store.error = null

    try {
        const response = await api.post<Purchase>(`${endpoints.purchases.one(id)}approve/`)
        // Обновить в store
        await store.fetchOne(response.data.id)
        return response.data
    } catch (error: any) {
        const parsedError = parseApiError(error)
        store.error = parsedError.detail
        throw error
    } finally {
        store.loading = false
    }
}

export const rejectPurchase = async (id: number, reason?: string): Promise<Purchase> => {
    const store = usePurchasesStore()
    store.loading = true
    store.error = null

    try {
        const response = await api.post<Purchase>(
            `${endpoints.purchases.one(id)}reject/`,
            reason ? {rejection_reason: reason} : {}
        )
        // Обновить в store
        await store.fetchOne(response.data.id)
        return response.data
    } catch (error: any) {
        const parsedError = parseApiError(error)
        store.error = parsedError.detail
        throw error
    } finally {
        store.loading = false
    }
}