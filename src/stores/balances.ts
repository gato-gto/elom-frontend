import { ref } from 'vue'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { createBaseStore } from '@/stores/base'
import type { MaterialBalance, ObjectBalance } from '@/api/types/stocks'

// Создаем базовый store для остатков
export const useBalancesStore = createBaseStore<ObjectBalance, any, any>({
  endpoint: {
    list: endpoints.stockSnapshots.byObjects,
    one: (id: number) => `${endpoints.stockSnapshots.byObjects}${id}/`
  },
  entityName: 'balances',
  entityNamePlural: 'остатки'
})

// Расширяем фильтры для остатков
const extendedFilters = ref({
  search: '',
  object: '',
  date: new Date().toISOString().split('T')[0]
})

// Переопределяем fetchList для обработки специфичной структуры API остатков
export const fetchBalancesList = async (params?: {
  page?: number
  search?: string
  object?: string
  date?: string
}) => {
  useBalancesStore.loading = true
  useBalancesStore.error = null

  try {
    // Call the API to get balances
    const apiParams = new URLSearchParams()
    if (extendedFilters.value.object) {
      apiParams.append('object_id', extendedFilters.value.object)
    }
    if (extendedFilters.value.date) {
      apiParams.append('date', extendedFilters.value.date)
    }

    const response = await api.get(`${endpoints.stockSnapshots.byObjects}?${apiParams}`)
    
    // Keep the grouped data structure for expandable rows
    const objectsData: ObjectBalance[] = []
    if (response.data.objects) {
      response.data.objects.forEach((obj: any) => {
        objectsData.push({
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
        } as ObjectBalance)
      })
    }
    
    // Update the reactive refs properly
    useBalancesStore.items = objectsData
    useBalancesStore.pagination.count = objectsData.length
    useBalancesStore.pagination.page = 1
    useBalancesStore.pagination.next = null
    useBalancesStore.pagination.previous = null

    // Update filters
    if (params) {
      Object.assign(extendedFilters.value, params)
    }
  } catch (error: any) {
    useBalancesStore.error = 'Ошибка загрузки остатков'
    throw error
  } finally {
    useBalancesStore.loading = false
  }
}

// Расширенные методы для фильтров
export const setBalancesFilters = async (newFilters: any) => {
  Object.assign(extendedFilters.value, newFilters)
  useBalancesStore.pagination.page = 1
  await fetchBalancesList()
}

export const resetBalancesFilters = async () => {
  Object.assign(extendedFilters.value, {
    search: '',
    object: '',
    date: new Date().toISOString().split('T')[0]
  })
  useBalancesStore.pagination.page = 1
  await fetchBalancesList()
}

// Custom getters for balances
export const getBalancesFilters = () => {
  return extendedFilters
}