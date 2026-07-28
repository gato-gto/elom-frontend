/**
 * Store для управления остатками материалов
 */
import { ref } from 'vue'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { createBaseStore } from './base'
import { handleApiErrorAsync, parseApiError } from '@/utils/errorHandler'
import type { MaterialBalance, ObjectBalance } from '@/api/types/stocks'

// Создаём базовый store
export const useBalancesStore = createBaseStore<ObjectBalance & { id: number }, any, any>({
  endpoint: {
    list: endpoints.stockSnapshots.byObjects,
    one: (id: number) => `${endpoints.stockSnapshots.byObjects}${id}/`
  },
  entityName: 'balances',
  entityNamePlural: 'остатки',
  defaultOrdering: 'object_name'
})

// Расширенные фильтры для остатков
const extendedFilters = ref({
  search: '',
  object: '',
  date: new Date().toISOString().split('T')[0]
})

// ============================================================================
// Custom Actions
// ============================================================================

export const fetchBalancesList = async (params?: {
  page?: number
  search?: string
  object?: string
  date?: string
}) => {
  const store = useBalancesStore()
  store.loading = true
  store.error = null

  try {
    // F-855: единый источник object/date — params (явный вызов) > store.filters (его ведёт URL/
    // useUrlFilters, напр. кнопка «Назад») > extendedFilters (дефолт). Раньше читали ТОЛЬКО
    // module-level extendedFilters → Back менял store.filters/URL, но запрос слал старый object → данные ≠ URL.
    const src: any = { ...extendedFilters.value, ...(store.filters || {}), ...(params || {}) }
    const apiParams = new URLSearchParams()
    if (src.object) {
      apiParams.append('object_id', String(src.object))
    }
    if (src.date) {
      apiParams.append('date', String(src.date))
    }
    // F-583: отправляем ordering (BE by-objects поддерживает object_name|total_materials, ±) —
    // раньше не клали, поэтому сортировка из UI была мёртвой (PROJECT_STATE «Осталось у B»).
    const ordering = store.filters?.ordering
    if (ordering) {
      apiParams.append('ordering', String(ordering))
    }

    const response = await api.get(`${endpoints.stockSnapshots.byObjects}?${apiParams}`)
    
    const objectsData: (ObjectBalance & { id: number })[] = []
    if (response.data.objects) {
      response.data.objects.forEach((obj: any) => {
        objectsData.push({
          id: obj.object_id,
          object_id: obj.object_id,
          object_name: obj.object_name,
          object_address: obj.object_address,
          materials: obj.materials.map((material: any) => ({
            material_id: material.material_id,
            material_name: material.material_name,
            unit_code: material.unit_code,
            current_balance: material.current_balance,
            total_purchased: material.total_purchased,
            total_written_off: material.total_written_off
          } as MaterialBalance)),
          total_materials: obj.materials.length
        })
      })
    }
    
    store.items = objectsData
    store.pagination.count = objectsData.length
    store.pagination.page = 1
    store.pagination.next = null
    store.pagination.previous = null

    if (params) {
      Object.assign(extendedFilters.value, params)
    }
  } catch (error: any) {
    // EH-FE-2 (F-544): не глушить сбой в статичную строку без тоста (класс F-538).
    // Пробрасываем реальный detail и показываем тост, как базовый стор — иначе
    // 403/500/сеть на «Остатках» выглядят как молча пустой список.
    store.error = parseApiError(error).detail
    await handleApiErrorAsync(error, { operation: 'dataLoading', entity: 'остатки' })
    throw error
  } finally {
    store.loading = false
  }
}

export const setBalancesFilters = async (newFilters: any) => {
  const store = useBalancesStore()
  Object.assign(extendedFilters.value, newFilters)
  store.filters = {
    ...extendedFilters.value,
    // F-583: НЕ перетираем НОВОЕ ordering старым — оно уже в extendedFilters после Object.assign
    // (сортировка из GenericList приходит как { ordering }); иначе сохраняем текущее / дефолт.
    ordering: (extendedFilters.value as any).ordering || store.filters?.ordering || 'object_name'
  }
  store.pagination.page = 1
  await fetchBalancesList()
}

export const resetBalancesFilters = async () => {
  const store = useBalancesStore()
  Object.assign(extendedFilters.value, {
    search: '',
    object: '',
    date: new Date().toISOString().split('T')[0]
  })
  store.filters = {
    ...extendedFilters.value,
    ordering: store.filters?.ordering || 'object_name'
  }
  store.pagination.page = 1
  await fetchBalancesList()
}

// ============================================================================
// Helper Functions
// ============================================================================

export const getBalancesFilters = () => {
  return extendedFilters
}
