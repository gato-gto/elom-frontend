import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/client'
import endpoints, { buildQuery } from '@/api/endpoints'
import type { 
  StockSnapshot, 
  StockSnapshotCreateRequest, 
  StockSnapshotUpdateRequest,
  StockSnapshotFilterParams,
  PageResponse,
  PaginationState
} from '@/api/types'
// import { createBaseStore } from './base' // Не используется

// Базовые фильтры для StockSnapshot
const defaultFilters: StockSnapshotFilterParams = {
  search: '',
  ordering: '-date',
  page: 1,
  page_size: 20,
  object: undefined,
  material: undefined,
  stage: undefined,
  source_type: undefined,
  source_id: undefined,
  responsible: undefined,
  is_archived: false,
  date_from: undefined,
  date_to: undefined
}

export const useStockSnapshotsStore = defineStore('stockSnapshots', () => {
  // Базовое состояние
  const rows = ref<StockSnapshot[]>([])
  const current = ref<StockSnapshot | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<StockSnapshotFilterParams>({ ...defaultFilters })
  
  // Пагинация
  const pagination = ref<PaginationState>({
    count: 0,
    page: 1,
    pageSize: 20,
    next: null,
    previous: null
  })

  // Computed
  const count = computed(() => pagination.value.count)
  const page = computed(() => pagination.value.page)
  const pageSize = computed(() => pagination.value.pageSize)

  // Основные методы
  async function fetchList(params?: Partial<StockSnapshotFilterParams>) {
    loading.value = true
    error.value = null
    
    try {
      // Объединяем текущие фильтры с переданными параметрами
      const queryParams = { ...filters.value, ...params }
      
      // Очищаем undefined значения
      const cleanParams = Object.entries(queryParams).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, any>)

      // Отладочная информация (можно убрать в продакшене)
      // console.log('StockSnapshots fetchList - filters:', filters.value)
      // console.log('StockSnapshots fetchList - cleanParams:', cleanParams)

      const { data } = await api.get<PageResponse<StockSnapshot>>(
        endpoints.stockSnapshots.list + buildQuery(cleanParams)
      )

      rows.value = data.results
      pagination.value = {
        count: data.count,
        page: queryParams.page || 1,
        pageSize: queryParams.page_size || 20,
        next: data.next,
        previous: data.previous
      }
    } catch (err: any) {
      error.value = err.message || 'Ошибка загрузки движений'
      console.error('Error fetching stock snapshots:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: number) {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await api.get<StockSnapshot>(endpoints.stockSnapshots.one(id))
      current.value = data
      return data
    } catch (err: any) {
      error.value = err.message || 'Ошибка загрузки движения'
      console.error('Error fetching stock snapshot:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function create(data: StockSnapshotCreateRequest) {
    loading.value = true
    error.value = null
    
    try {
      const { data: result } = await api.post<StockSnapshot>(
        endpoints.stockSnapshots.list,
        data
      )
      
      // Добавляем в список
      rows.value.unshift(result)
      pagination.value.count += 1
      
      return result
    } catch (err: any) {
      error.value = err.message || 'Ошибка создания движения'
      console.error('Error creating stock snapshot:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, data: StockSnapshotUpdateRequest) {
    loading.value = true
    error.value = null
    
    try {
      const { data: result } = await api.put<StockSnapshot>(
        endpoints.stockSnapshots.one(id),
        data
      )
      
      // Обновляем в списке
      const index = rows.value.findIndex(item => item.id === id)
      if (index !== -1) {
        rows.value[index] = result
      }
      
      // Обновляем текущий элемент
      if (current.value?.id === id) {
        current.value = result
      }
      
      return result
    } catch (err: any) {
      error.value = err.message || 'Ошибка обновления движения'
      console.error('Error updating stock snapshot:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    loading.value = true
    error.value = null
    
    try {
      await api.delete(endpoints.stockSnapshots.one(id))
      
      // Удаляем из списка
      const index = rows.value.findIndex(item => item.id === id)
      if (index !== -1) {
        rows.value.splice(index, 1)
        pagination.value.count -= 1
      }
      
      // Очищаем текущий элемент если он был удален
      if (current.value?.id === id) {
        current.value = null
      }
    } catch (err: any) {
      error.value = err.message || 'Ошибка удаления движения'
      console.error('Error deleting stock snapshot:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Методы пагинации
  async function setPage(page: number) {
    pagination.value.page = page
    filters.value.page = page
    await fetchList()
  }

  async function setPageSize(size: number) {
    pagination.value.pageSize = size
    filters.value.page_size = size
    pagination.value.page = 1
    filters.value.page = 1
    await fetchList()
  }

  // Методы фильтрации
  function setFilters(newFilters: Partial<StockSnapshotFilterParams>) {
    // console.log('StockSnapshots setFilters - newFilters:', newFilters)
    Object.assign(filters.value, newFilters)
    pagination.value.page = 1
    filters.value.page = 1
    // console.log('StockSnapshots setFilters - updated filters:', filters.value)
    // Автоматически загружаем данные с новыми фильтрами
    fetchList()
  }

  function resetFilters() {
    filters.value = { ...defaultFilters }
    pagination.value.page = 1
    // Автоматически загружаем данные с сброшенными фильтрами
    fetchList()
  }

  // Методы управления состоянием
  function setCurrent(snapshot: StockSnapshot | null) {
    current.value = snapshot
  }

  function clearError() {
    error.value = null
  }

  // Методы для работы с данными
  function getBySourceType(sourceType: string) {
    return rows.value.filter(item => item.source_type === sourceType)
  }

  function getByStage(stage: string) {
    return rows.value.filter(item => item.stage === stage)
  }

  function getByObject(objectId: number) {
    return rows.value.filter(item => item.object === objectId)
  }

  function getByMaterial(materialId: number) {
    return rows.value.filter(item => item.material === materialId)
  }

  // Computed для статистики
  const totalIncome = computed(() =>
    rows.value
      .filter(item => parseFloat(item.quantity_signed) > 0)
      .reduce((sum, item) => sum + parseFloat(item.quantity_signed), 0)
  )

  const totalOutcome = computed(() => 
    rows.value
      .filter(item => parseFloat(item.quantity_signed) < 0)
      .reduce((sum, item) => sum + Math.abs(parseFloat(item.quantity_signed)), 0)
  )

  const uniqueObjects = computed(() => 
    new Set(rows.value.map(item => item.object)).size
  )

  const uniqueMaterials = computed(() => 
    new Set(rows.value.map(item => item.material)).size
  )

  return {
    // Состояние
    rows,
    current,
    loading,
    error,
    filters,
    pagination,
    
    // Computed
    count,
    page,
    pageSize,
    totalIncome,
    totalOutcome,
    uniqueObjects,
    uniqueMaterials,
    
    // Методы
    fetchList,
    fetchOne,
    create,
    update,
    remove,
    setPage,
    setPageSize,
    setFilters,
    resetFilters,
    setCurrent,
    clearError,
    
    // Утилиты
    getBySourceType,
    getByStage,
    getByObject,
    getByMaterial
  }
})
