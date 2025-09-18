import { computed } from 'vue'
import api from '@/api/client'
import { endpoints, buildQuery } from '@/api/endpoints'
import { createBaseStore, reactivityUtils } from './base'
import type { 
  Material, 
  MaterialRequest, 
  PatchedMaterialRequest,
  PaginatedMaterialList 
} from '@/api/types'

// Типы для фильтров материалов
interface MaterialFilters {
  search: string
  name: string
  sku: string
  category: string
  default_unit: string
  ordering: string
}

// Дефолтные фильтры
const defaultFilters: MaterialFilters = {
  search: '',
  name: '',
  sku: '',
  category: '',
  default_unit: '',
  ordering: 'name'
}

// Создаем оптимизированный store
export const useMaterialsStoreOptimized = createBaseStore<Material, MaterialFilters>(
  'materials-optimized',
  defaultFilters
)

// Расширяем store специфичными для материалов методами
export const useMaterialsStore = defineStore('materials-optimized', () => {
  const baseStore = useMaterialsStoreOptimized()

  // Специфичные computed для материалов
  const getByCategory = computed(() => (categoryId: number) => {
    return baseStore.items.value.filter(item => item.category === categoryId)
  })

  const materialsWithPhotos = computed(() => {
    return baseStore.items.value.filter(item => item.photo_url)
  })

  const materialsWithoutPhotos = computed(() => {
    return baseStore.items.value.filter(item => !item.photo_url)
  })

  // Оптимизированные actions
  const fetchList = async (params?: Partial<MaterialFilters & { page?: number }>) => {
    baseStore.setLoading(true)
    baseStore.setError(null)

    try {
      // Создаем ключ для кэширования
      const cacheKey = `materials-${JSON.stringify(params || baseStore.filters.value)}`
      const cachedData = baseStore.getCachedData(cacheKey)
      
      if (cachedData && !params) {
        // Используем кэшированные данные если нет новых параметров
        baseStore.items.value = cachedData.results
        baseStore.pagination.value = cachedData.pagination
        baseStore.setLoading(false)
        return cachedData
      }

      const queryParams = {
        page: params?.page || baseStore.pagination.value.page,
        page_size: baseStore.pagination.value.pageSize,
        search: params?.search ?? baseStore.filters.value.search ?? undefined,
        name: params?.name ?? baseStore.filters.value.name ?? undefined,
        sku: params?.sku ?? baseStore.filters.value.sku ?? undefined,
        category: params?.category ?? baseStore.filters.value.category ?? undefined,
        default_unit: params?.default_unit ?? baseStore.filters.value.default_unit ?? undefined,
        ordering: params?.ordering ?? baseStore.filters.value.ordering
      }

      const query = buildQuery(queryParams)
      const { data } = await api.get<PaginatedMaterialList>(endpoints.materials.list + query)

      // Обновляем данные
      baseStore.items.value = data.results
      baseStore.pagination.value = {
        count: data.count,
        page: queryParams.page,
        pageSize: baseStore.pagination.value.pageSize,
        next: data.next,
        previous: data.previous
      }

      // Кэшируем данные
      baseStore.setCachedData(cacheKey, {
        results: data.results,
        pagination: baseStore.pagination.value
      })

      // Обновляем фильтры если переданы новые
      if (params) {
        baseStore.setFilters(params)
      }

      return data
    } catch (error: any) {
      // Обработка ошибок пагинации
      if (error?.response?.data?.detail === 'Неправильная страница' || 
          error?.response?.status === 404) {
        console.warn('Invalid page requested, redirecting to page 1')
        return fetchList({ ...params, page: 1 })
      }
      
      baseStore.setError(error?.response?.data?.detail || 'Ошибка загрузки материалов')
      throw error
    } finally {
      baseStore.setLoading(false)
    }
  }

  const fetchOne = async (id: number) => {
    baseStore.setLoading(true)
    baseStore.setError(null)

    try {
      // Проверяем кэш
      const cacheKey = `material-${id}`
      const cachedData = baseStore.getCachedData(cacheKey)
      
      if (cachedData) {
        baseStore.setCurrent(cachedData)
        baseStore.updateItemInList(cachedData)
        baseStore.setLoading(false)
        return cachedData
      }

      const { data } = await api.get<Material>(endpoints.materials.one(id))
      
      baseStore.setCurrent(data)
      baseStore.updateItemInList(data)
      baseStore.setCachedData(cacheKey, data)

      return data
    } catch (error: any) {
      baseStore.setError(error?.response?.data?.detail || 'Ошибка загрузки материала')
      throw error
    } finally {
      baseStore.setLoading(false)
    }
  }

  const create = async (data: MaterialRequest) => {
    baseStore.setLoading(true)
    baseStore.setError(null)

    try {
      const formData = new FormData()
      formData.append('name', data.name)
      if (data.sku) formData.append('sku', data.sku)
      if (data.category) formData.append('category', data.category.toString())
      formData.append('default_unit', data.default_unit.toString())
      if (data.created_date) formData.append('created_date', data.created_date)

      const { data: newMaterial } = await api.post<Material>(endpoints.materials.list, formData)
      
      baseStore.addItemToList(newMaterial)
      baseStore.clearCache() // Очищаем кэш при добавлении нового элемента

      return newMaterial
    } catch (error: any) {
      baseStore.setError(error?.response?.data?.detail || 'Ошибка создания материала')
      throw error
    } finally {
      baseStore.setLoading(false)
    }
  }

  const update = async (id: number, data: PatchedMaterialRequest) => {
    baseStore.setLoading(true)
    baseStore.setError(null)

    try {
      const formData = new FormData()
      if (data.name) formData.append('name', data.name)
      if (data.sku !== undefined) formData.append('sku', data.sku)
      if (data.category !== undefined) formData.append('category', data.category?.toString() || '')
      if (data.default_unit) formData.append('default_unit', data.default_unit.toString())
      if (data.created_date) formData.append('created_date', data.created_date)

      const { data: updatedMaterial } = await api.post<Material>(endpoints.materials.one(id), formData)
      
      baseStore.updateItemInList(updatedMaterial)
      
      if (baseStore.current.value?.id === id) {
        baseStore.setCurrent(updatedMaterial)
      }

      // Обновляем кэш
      baseStore.setCachedData(`material-${id}`, updatedMaterial)
      baseStore.clearCache() // Очищаем кэш списков

      return updatedMaterial
    } catch (error: any) {
      baseStore.setError(error?.response?.data?.detail || 'Ошибка обновления материала')
      throw error
    } finally {
      baseStore.setLoading(false)
    }
  }

  const deleteMaterial = async (id: number) => {
    baseStore.setLoading(true)
    baseStore.setError(null)

    try {
      await api.delete(endpoints.materials.one(id))
      
      baseStore.removeItemFromList(id)
      
      if (baseStore.current.value?.id === id) {
        baseStore.setCurrent(null)
      }

      // Очищаем кэш
      baseStore.setCachedData(`material-${id}`, null)
      baseStore.clearCache()

      return true
    } catch (error: any) {
      baseStore.setError(error?.response?.data?.detail || 'Ошибка удаления материала')
      throw error
    } finally {
      baseStore.setLoading(false)
    }
  }

  const uploadPhoto = async (id: number, photo: File) => {
    baseStore.setLoading(true)
    baseStore.setError(null)

    try {
      const formData = new FormData()
      formData.append('photo', photo)

      const { data } = await api.post<{ photo_url: string }>(
        endpoints.materials.uploadPhoto(id), 
        formData
      )

      // Обновляем материал с новой фотографией
      const updatedMaterial = { ...baseStore.getById.value(id), photo_url: data.photo_url }
      if (updatedMaterial) {
        baseStore.updateItemInList(updatedMaterial)
        
        if (baseStore.current.value?.id === id) {
          baseStore.setCurrent(updatedMaterial)
        }
      }

      return data.photo_url
    } catch (error: any) {
      baseStore.setError(error?.response?.data?.detail || 'Ошибка загрузки фото')
      throw error
    } finally {
      baseStore.setLoading(false)
    }
  }

  const deletePhoto = async (id: number) => {
    baseStore.setLoading(true)
    baseStore.setError(null)

    try {
      await api.delete(endpoints.materials.uploadPhoto(id))

      // Обновляем материал, убирая фотографию
      const updatedMaterial = { ...baseStore.getById.value(id), photo_url: undefined }
      if (updatedMaterial) {
        baseStore.updateItemInList(updatedMaterial)
        
        if (baseStore.current.value?.id === id) {
          baseStore.setCurrent(updatedMaterial)
        }
      }

      return true
    } catch (error: any) {
      baseStore.setError(error?.response?.data?.detail || 'Ошибка удаления фото')
      throw error
    } finally {
      baseStore.setLoading(false)
    }
  }

  const setPage = async (page: number) => {
    await fetchList({ page })
  }

  // Настраиваем автоматическое обновление при изменении фильтров
  baseStore.setupAutoRefresh(() => fetchList())

  return {
    // Базовые свойства
    ...baseStore,
    
    // Специфичные computed
    getByCategory,
    materialsWithPhotos,
    materialsWithoutPhotos,
    
    // Actions
    fetchList,
    fetchOne,
    create,
    update,
    delete: deleteMaterial,
    uploadPhoto,
    deletePhoto,
    setPage
  }
})
