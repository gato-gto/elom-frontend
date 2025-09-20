import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/client'
import endpoints, { buildQuery } from '@/api/endpoints'
import type { 
  WriteOff, 
  WriteOffCreateRequest, 
  WriteOffUpdateRequest,
  WriteOffFilterParams,
  PageResponse,
  PaginationState
} from '@/api/types'

// Базовые фильтры для WriteOff
const defaultFilters: WriteOffFilterParams = {
  search: '',
  ordering: '-date',
  page: 1,
  page_size: 20,
  object: undefined,
  material: undefined,
  stage: undefined,
  responsible: undefined,
  is_archived: false,
  date_from: undefined,
  date_to: undefined
}

export const useWriteOffsStore = defineStore('writeOffs', () => {
  // Базовое состояние
  const rows = ref<WriteOff[]>([])
  const current = ref<WriteOff | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<WriteOffFilterParams>({ ...defaultFilters })
  
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
  async function fetchList(params?: Partial<WriteOffFilterParams>) {
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

      const { data } = await api.get<PageResponse<WriteOff>>(
        endpoints.writeOffs.list + buildQuery(cleanParams)
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
      error.value = err.message || 'Ошибка загрузки списаний'
      console.error('Error fetching write-offs:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: number) {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await api.get<WriteOff>(endpoints.writeOffs.one(id))
      current.value = data
      return data
    } catch (err: any) {
      error.value = err.message || 'Ошибка загрузки списания'
      console.error('Error fetching write-off:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function create(data: WriteOffCreateRequest) {
    loading.value = true
    error.value = null
    
    try {
      const { data: result } = await api.post<WriteOff>(
        endpoints.writeOffs.list,
        data
      )
      
      // Добавляем в список
      rows.value.unshift(result)
      pagination.value.count += 1
      
      return result
    } catch (err: any) {
      error.value = err.message || 'Ошибка создания списания'
      console.error('Error creating write-off:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function update(id: number, data: WriteOffUpdateRequest) {
    loading.value = true
    error.value = null
    
    try {
      const { data: result } = await api.put<WriteOff>(
        endpoints.writeOffs.one(id),
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
      error.value = err.message || 'Ошибка обновления списания'
      console.error('Error updating write-off:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function remove(id: number) {
    loading.value = true
    error.value = null
    
    try {
      await api.delete(endpoints.writeOffs.one(id))
      
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
      error.value = err.message || 'Ошибка удаления списания'
      console.error('Error deleting write-off:', err)
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
  function setFilters(newFilters: Partial<WriteOffFilterParams>) {
    Object.assign(filters.value, newFilters)
    pagination.value.page = 1
    filters.value.page = 1
  }

  function resetFilters() {
    filters.value = { ...defaultFilters }
    pagination.value.page = 1
  }

  // Методы управления состоянием
  function setCurrent(writeOff: WriteOff | null) {
    current.value = writeOff
  }

  function clearError() {
    error.value = null
  }

  // Методы для работы с данными
  function getByStage(stage: string) {
    return rows.value.filter(item => item.stage === stage)
  }

  function getByObject(objectId: number) {
    return rows.value.filter(item => item.object === objectId)
  }

  function getByMaterial(materialId: number) {
    return rows.value.filter(item => item.material === materialId)
  }

  function getByResponsible(responsibleId: number) {
    return rows.value.filter(item => item.responsible === responsibleId)
  }

  function getWithWarnings() {
    return rows.value.filter(item => item.validation_warnings.length > 0)
  }

  // Computed для статистики
  const totalQuantity = computed(() =>
    rows.value.reduce((sum, item) => sum + parseFloat(item.quantity), 0)
  )

  const totalValue = computed(() => 
    rows.value.reduce((sum, item) => {
      // Предполагаем, что у нас есть цена материала
      // В реальном приложении это может быть вычислено по-другому
      return sum + (parseFloat(item.quantity) * (item.smart_quantity?.value || 0))
    }, 0)
  )

  const uniqueObjects = computed(() => 
    new Set(rows.value.map(item => item.object)).size
  )

  const uniqueMaterials = computed(() => 
    new Set(rows.value.map(item => item.material)).size
  )

  const uniqueResponsibles = computed(() => 
    new Set(rows.value.map(item => item.responsible)).size
  )

  // Статистика по этапам
  const stageStats = computed(() => {
    const stats: Record<string, { count: number; quantity: number }> = {}
    
    rows.value.forEach(item => {
      if (!stats[item.stage]) {
        stats[item.stage] = { count: 0, quantity: 0 }
      }
      stats[item.stage].count += 1
      stats[item.stage].quantity += parseFloat(item.quantity)
    })
    
    return stats
  })

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
    totalQuantity,
    totalValue,
    uniqueObjects,
    uniqueMaterials,
    uniqueResponsibles,
    stageStats,
    
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
    getByStage,
    getByObject,
    getByMaterial,
    getByResponsible,
    getWithWarnings
  }
})
