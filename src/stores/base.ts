/**
 * Базовый store с CRUD операциями для entity stores
 * 
 * Использование:
 * 1. Создание store:
 *    export const useMyStore = createBaseStore<Entity, CreateRequest, UpdateRequest>({
 *      endpoint: endpoints.myEntity,
 *      entityName: 'myEntity',
 *      entityNamePlural: 'мои сущности'
 *    })
 * 
 * 2. Использование в компонентах:
 *    const myStore = useMyStore()
 *    await myStore.fetchList()
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import api from '@/api/client'
import { buildQuery } from '@/api/endpoints'
import { handleApiErrorAsync, parseApiError } from '@/utils/errorHandler'
import { findById } from '@/utils/arrayHelpers'
import { getOptimalPageSize } from '@/utils/device'

// ============================================================================
// Сигнализация усечённого справочника (F-510)
// ============================================================================

/** Доля page_size, начиная с которой справочник считаем «на грани усечения». */
export const PAGE_SIZE_ALARM_RATIO = 0.8

/**
 * F-510. Экраны грузят справочники как `fetchList({ page_size: 1000 })` и молча считают,
 * что пришло ВСЁ. Это допущение, а не гарантия: когда записей станет больше лимита, ответ
 * тихо обрежется — селект просто не покажет часть материалов/объектов, а колонка вместо
 * названия напечатает ID (тот же класс, что F-501). Никакой ошибки при этом не будет.
 *
 * Пока лимит не убран (см. ARCHITECTURE.md, «Известные ограничения»), ставим сигнализацию:
 * в dev шумим в консоль, когда ответ подошёл к границе. `next !== null` — уже доказанное
 * усечение, доля от page_size — предупреждение заранее.
 *
 * Только dev: в проде это не ошибка пользователя и молчит.
 */
export function warnIfNearPageSize(
  endpoint: string,
  count: number,
  pageSize: number,
  hasNext: boolean,
): void {
  if (!import.meta.env.DEV) { return }
  if (!pageSize || !count) { return }
  if (hasNext) {
    console.warn(
      `[F-510] ${endpoint}: ответ УСЕЧЁН (count=${count} > page_size=${pageSize}, есть next). ` +
      'Экран, который считает этот справочник полным, покажет не все записи. ' +
      'Нужна подгрузка/серверный поиск вместо page_size.',
    )
    return
  }
  if (count >= pageSize * PAGE_SIZE_ALARM_RATIO) {
    console.warn(
      `[F-510] ${endpoint}: count=${count} — это ≥${Math.round(PAGE_SIZE_ALARM_RATIO * 100)}% ` +
      `от page_size=${pageSize}. Справочник вот-вот перестанет помещаться в один запрос ` +
      'и начнёт молча обрезаться. См. ARCHITECTURE.md → «Известные ограничения».',
    )
  }
}

// ============================================================================
// Types
// ============================================================================

export interface PaginationState {
  count: number
  page: number
  pageSize: number
  next: string | null
  previous: string | null
}

export interface BaseFilters {
  search: string
  ordering: string
  [key: string]: any
}

export interface BaseStoreConfig<T> {
  endpoint: {
    list: string
    one: (id: number) => string
  }
  entityName: string
  entityNamePlural: string
  defaultOrdering?: string
  defaultPageSize?: number
  // FE-6/F-564: кастомная метка для selectOptions (напр. ФИО сотрудника вместо item.name).
  labelFn?: (item: T) => string
}

export interface BaseStoreState<T> {
  items: Ref<T[]>
  current: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  pagination: Ref<PaginationState>
  filters: Ref<BaseFilters>
}

export interface BaseStoreGetters<T> {
  getById: ComputedRef<(id: number) => T | undefined>
  exists: ComputedRef<(id: number) => boolean>
  selectOptions: ComputedRef<{ value: number; label: string }[]>
}

export interface BaseStoreActions<T, C, U> {
  fetchList: (params?: Record<string, any>) => Promise<T[]>
  fetchOne: (id: number) => Promise<T>
  create: (data: C) => Promise<T>
  update: (id: number, data: U) => Promise<T>
  remove: (id: number) => Promise<any>
  setCurrent: (item: T | null) => void
  setFilters: (newFilters: Partial<BaseFilters>) => Promise<void>
  resetFilters: () => Promise<void>
  clearError: () => void
  setPageSize: (size: number) => Promise<void>
  setPage: (page: number) => Promise<void>
  search: (query: string) => Promise<T[]>
}

// ============================================================================
// Factory Function
// ============================================================================

export function createBaseStore<T extends { id: number; name?: string; title?: string }, C, U>(
  config: BaseStoreConfig<T>
) {
  return defineStore(config.entityName, () => {
    // ========================================================================
    // State
    // ========================================================================
    const items = ref<T[]>([]) as Ref<T[]>
    const current = ref<T | null>(null) as Ref<T | null>
    const loading = ref(false)
    const error = ref<string | null>(null)
    // Используем адаптивный размер страницы для мобильных устройств
    const initialPageSize = config.defaultPageSize || 20
    const pagination = ref<PaginationState>({
      count: 0,
      page: 1,
      pageSize: getOptimalPageSize(initialPageSize),
      next: null,
      previous: null
    })
    const filters = ref<BaseFilters>({
      search: '',
      ordering: config.defaultOrdering || 'id'
    })

    // ========================================================================
    // Getters
    // ========================================================================
    const getById = computed(() => (id: number) => {
      return findById(items.value, id)
    })

    const exists = computed(() => (id: number) => {
      return items.value.some(item => item.id === id)
    })

    const selectOptions = computed(() => {
      return items.value.map(item => ({
        value: item.id,
        label: config.labelFn ? config.labelFn(item) : (item.name || item.title || `Item ${item.id}`)
      }))
    })

    // ========================================================================
    // Actions
    // ========================================================================
    
    // F-636 (H12): монотонный токен поколения fetchList — при конкурентных вызовах коммитим
    // items/pagination ТОЛЬКО из самого свежего запроса. Иначе медленный устаревший ответ
    // (last-writer-wins) перезатирал список и откатывал fetchOne (строка снова «pending» после
    // success-тоста). Транзиентно, но видимо при быстрых approve/reject подряд.
    let fetchListGen = 0
    const fetchList = async (params?: Record<string, any>): Promise<T[]> => {
      loading.value = true
      error.value = null
      const gen = ++fetchListGen

      try {
        const queryParams: Record<string, any> = {
          page: params?.page || pagination.value.page,
          page_size: params?.page_size || pagination.value.pageSize,
          ...filters.value,
          ...(params?.search !== undefined && { search: params.search }),
          ...(params?.ordering !== undefined && { ordering: params.ordering }),
          ...params
        }

        // Remove empty values
        Object.keys(queryParams).forEach(key => {
          if (queryParams[key] === undefined || queryParams[key] === '') {
            delete queryParams[key]
          }
        })

        const query = buildQuery(queryParams)
        const { data } = await api.get(config.endpoint.list + query)

        // H12: более новый fetchList уже стартовал → ответ устарел, список не перезаписываем.
        if (gen !== fetchListGen) { return items.value }
        items.value = data.results || data
        pagination.value = {
          count: data.count || (Array.isArray(data) ? data.length : 0),
          page: queryParams.page,
          pageSize: queryParams.page_size,
          next: data.next || null,
          previous: data.previous || null
        }
        warnIfNearPageSize(
          config.endpoint.list,
          pagination.value.count,
          Number(queryParams.page_size),
          !!pagination.value.next,
        )

        if (params) {
          Object.assign(filters.value, params)
        }

        return items.value
      } catch (err: any) {
        const parsedError = parseApiError(err)
        
        // ✅ Обработка ошибки 404 для несуществующей страницы пагинации
        if (err?.response?.status === 404) {
          // EH-FE-4 (F-553): 404 на списке со страницей > 1 = выход за границы пагинации
          // (напр. удалили последнюю запись на последней странице). Условие машинное
          // (status + page), без разбора текста ошибки — хрупкого к локали/формулировке DRF.
          if (pagination.value.page > 1) {
            // Автоматически перенаправляем на первую страницу
            pagination.value.page = 1
            // Повторяем запрос с первой страницей
            try {
              const queryParams: Record<string, any> = {
                page: 1,
                page_size: pagination.value.pageSize,
                ...filters.value
              }
              
              // Remove empty values
              Object.keys(queryParams).forEach(key => {
                if (queryParams[key] === undefined || queryParams[key] === '') {
                  delete queryParams[key]
                }
              })
              
              const query = buildQuery(queryParams)
              const { data } = await api.get(config.endpoint.list + query)

              if (gen !== fetchListGen) { return items.value }
              items.value = data.results || data
              pagination.value = {
                count: data.count || (Array.isArray(data) ? data.length : 0),
                page: 1,
                pageSize: queryParams.page_size,
                next: data.next || null,
                previous: data.previous || null
              }
              warnIfNearPageSize(
                config.endpoint.list,
                pagination.value.count,
                Number(queryParams.page_size),
                !!pagination.value.next,
              )
              
              // Обновляем URL без параметра page или с page=1
              if (typeof window !== 'undefined' && window.history) {
                const url = new URL(window.location.href)
                url.searchParams.set('page', '1')
                window.history.replaceState({}, '', url.toString())
              }
              
              error.value = null
              return items.value
            } catch (retryErr: any) {
              // Если повторный запрос тоже не удался, показываем ошибку
              const retryParsedError = parseApiError(retryErr)
              error.value = retryParsedError.detail
              await handleApiErrorAsync(retryErr, { operation: 'dataLoading', entity: config.entityName })
              throw retryErr
            }
          }
        }
        
        error.value = parsedError.detail
        await handleApiErrorAsync(err, { operation: 'dataLoading', entity: config.entityName })
        throw err
      } finally {
        // H12: только самый свежий запрос управляет спиннером (устаревший не гасит его раньше).
        if (gen === fetchListGen) { loading.value = false }
      }
    }

    const fetchOne = async (id: number): Promise<T> => {
      loading.value = true
      error.value = null

      try {
        const { data } = await api.get<T>(config.endpoint.one(id))
        current.value = data

        const index = items.value.findIndex(item => item.id === id)
        if (index !== -1) {
          items.value[index] = data
        }

        return data
      } catch (err: any) {
        current.value = null
        const parsedError = parseApiError(err)
        error.value = parsedError.detail
        await handleApiErrorAsync(err, { operation: 'dataLoading', entity: config.entityName })
        throw err
      } finally {
        loading.value = false
      }
    }

    const create = async (data: C): Promise<T> => {
      loading.value = true
      error.value = null

      try {
        const { data: newItem } = await api.post<T>(config.endpoint.list, data)
        items.value.unshift(newItem)
        pagination.value.count++
        return newItem
      } catch (err: any) {
        const parsedError = parseApiError(err)
        error.value = parsedError.detail
        await handleApiErrorAsync(err, { operation: 'formValidation', entity: config.entityName })
        throw err
      } finally {
        loading.value = false
      }
    }

    const update = async (id: number, data: U): Promise<T> => {
      loading.value = true
      error.value = null

      try {
        const { data: updatedItem } = await api.patch<T>(config.endpoint.one(id), data)
        
        const index = items.value.findIndex(item => item.id === id)
        if (index !== -1) {
          items.value[index] = updatedItem
        }

        if (current.value?.id === id) {
          current.value = updatedItem
        }

        return updatedItem
      } catch (err: any) {
        const parsedError = parseApiError(err)
        error.value = parsedError.detail
        await handleApiErrorAsync(err, { operation: 'formValidation', entity: config.entityName })
        throw err
      } finally {
        loading.value = false
      }
    }

    const remove = async (id: number): Promise<any> => {
      loading.value = true
      error.value = null

      try {
        const response = await api.delete(config.endpoint.one(id))
        
        const wasDeactivated = response.status === 200 && response.data?.action === 'deactivated'
        
        if (wasDeactivated) {
          const index = items.value.findIndex(item => item.id === id)
          if (index !== -1) {
            (items.value[index] as any).is_active = false
          }
        } else {
          items.value = items.value.filter(item => item.id !== id)
          pagination.value.count--
        }

        if (current.value?.id === id) {
          current.value = null
        }

        return response.data || { action: 'deleted' }
      } catch (err: any) {
        const parsedError = parseApiError(err)
        error.value = parsedError.detail
        await handleApiErrorAsync(err, { operation: 'delete', entity: config.entityName })
        throw err
      } finally {
        loading.value = false
      }
    }

    const setCurrent = (item: T | null) => {
      current.value = item
    }

    const setFilters = async (newFilters: Partial<BaseFilters>) => {
      Object.assign(filters.value, newFilters)
      pagination.value.page = 1
      await fetchList()
    }

    const resetFilters = async () => {
      const resetObj: BaseFilters = {
        search: '',
        ordering: config.defaultOrdering || 'id'
      }
      
      Object.keys(filters.value).forEach(key => {
        if (key !== 'search' && key !== 'ordering') {
          resetObj[key] = ''
        }
      })
      
      filters.value = resetObj
      pagination.value.page = 1
      await fetchList()
    }

    const clearError = () => {
      error.value = null
    }

    const setPageSize = async (size: number) => {
      pagination.value.pageSize = size
      pagination.value.page = 1
      await fetchList()
    }

    const setPage = async (page: number) => {
      pagination.value.page = page
      await fetchList()
    }

    const search = async (query: string): Promise<T[]> => {
      if (query.length < 2) {return []}
      
      try {
        // На мобильных используем меньше результатов для поиска
        const searchPageSize = getOptimalPageSize(15)
        const { data } = await api.get(config.endpoint.list + `?search=${encodeURIComponent(query)}&page_size=${searchPageSize}`)
        return data.results || data
      } catch (err: any) {
        await handleApiErrorAsync(err, { operation: 'search', entity: config.entityName })
        return []
      }
    }

    // ========================================================================
    // Return
    // ========================================================================
    return {
      // State
      items,
      current,
      loading,
      error,
      pagination,
      filters,

      // Getters
      getById,
      exists,
      selectOptions,

      // Actions
      fetchList,
      fetchOne,
      create,
      update,
      remove,
      setCurrent,
      setFilters,
      resetFilters,
      clearError,
      setPageSize,
      setPage,
      search
    }
  })
}
