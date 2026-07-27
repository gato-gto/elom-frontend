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
        // EH-FE-9 (F-552): через parseApiError — безопасное приведение не-строкового detail,
        // локализованный fallback по типу и разбор errors (а не сырой data.detail).
        store.error = parseApiError(error).detail
        throw error
    } finally {
        store.loading = false
    }
}

// F-616: догрузка одного фото-отчёта через тот же живой путь, что и форма закупки
// (PurchasePhotoViewSet.create, поля FormData: file/type/purchase) — НЕ /photos/upload/,
// который использует лишь юнит-тест. Используется диалогом «Одобрить» в списке: фото-отчёт
// прикладывается опционально ДО одобрения. Ошибку прокидываем вызывающему (диалог сам решает
// не одобрять при неудачной загрузке и показать её через parseApiError).
export const uploadReportPhoto = async (purchaseId: number, file: File): Promise<void> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'report')
    formData.append('purchase', String(purchaseId))
    await api.post('/purchase-photos/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
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

// F-616: одобрение с опциональным фото-отчётом одним вызовом (диалог «Одобрить» в списке).
// Фото грузим ДО одобрения; при сбое загрузки approvePurchase НЕ вызывается — не должно быть
// «одобрено, но обещанное фото не приложилось». approve — фиксирующий шаг после успешных загрузок.
// Пустой files → обычное одобрение (фото-отчёт необязателен, D-019).
// M3 (FE-hunt): onUploaded вызывается ПОСЛЕ каждой успешной загрузки, чтобы вызывающий убрал
// файл из списка на ретрай. Без этого: f1 загрузилось, f2 упало → цикл бросил ДО approve; ретрай
// слал f1 повторно = ДУБЛИКАТ PurchasePhoto (серверного unique-констрейнта нет), копится с каждым
// ретраем. Теперь ретрай шлёт только непросохранённые файлы.
// F-636: одобряем СНАЧАЛА, потом грузим фото-отчёт. Раньше фото грузились ДО approve → при отказе
// approve (закрытый период 400) фото оставались сиротами на 'new'-закупке, а M3-дедуп убирал их из
// диалога → ре-селект → дубли (у PurchasePhoto нет серверного unique). Фото-отчёт опционален и
// догружаем после завершения (F-621), поэтому approve-first безопасен: сбой загрузки НЕ откатывает
// одобрение (возвращаем счётчики — вызывающий подскажет догрузить), а approve при успехе больше НЕ
// повторяется на ретрае → дублей нет.
export const approvePurchaseWithReport = async (
    purchaseId: number,
    files: File[] = []
): Promise<{ purchase: Purchase; uploaded: number; failed: number }> => {
    const purchase = await approvePurchase(purchaseId)   // бросает ТОЛЬКО при отказе одобрения
    let uploaded = 0
    let failed = 0
    for (const file of files) {
        try {
            await uploadReportPhoto(purchaseId, file)
            uploaded++
        } catch {
            failed++
        }
    }
    return { purchase, uploaded, failed }
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