/**
 * Store для управления архивными периодами
 */
import { createBaseStore } from './base'
import api from '@/api/client'
import endpoints from '@/api/endpoints'
import type { ArchivePeriod, ArchivePeriodRequest } from '@/api/types/archive'

// Конфигурация для createBaseStore
const config = {
  endpoint: {
    list: '/api/v1/archive/periods/',
    one: (id: number) => `/api/v1/archive/periods/${id}/`,
  },
  entityName: 'archive',
  entityNamePlural: 'archives'
}

// Создаем базовый store
export const useArchiveStore = createBaseStore<ArchivePeriod, ArchivePeriodRequest, ArchivePeriodRequest>(config)

// Специфичные для архива действия
export const closePeriod = async (data: ArchivePeriodRequest) => {
  useArchiveStore.loading = true
  useArchiveStore.error = null

  try {
    const result = await api.post(endpoints.archive.periods.close, data)
    
    // Обновляем список после успешного закрытия
    await useArchiveStore.fetchList()
    
    return result.data
  } catch (err: any) {
    useArchiveStore.error = err?.response?.data?.detail || 'Ошибка при закрытии периода'
    throw err
  } finally {
    useArchiveStore.loading = false
  }
}

export const reopenPeriod = async (data: { month: string; object: number }) => {
  useArchiveStore.loading = true
  useArchiveStore.error = null

  try {
    const result = await api.post(endpoints.archive.periods.reopen, data)
    
    // Обновляем список после успешного открытия
    await useArchiveStore.fetchList()
    
    return result.data
  } catch (err: any) {
    useArchiveStore.error = err?.response?.data?.detail || 'Ошибка при открытии периода'
    throw err
  } finally {
    useArchiveStore.loading = false
  }
}

// Проверка возможности закрытия периода
export const canClosePeriod = (month: string, objectId: number) => {
  // Проверяем, не закрыт ли уже период
  // month в формате YYYY-MM, item.month в формате YYYY-MM-DD
  const existingPeriod = useArchiveStore.items.find(
    (item: ArchivePeriod) => {
      const itemMonth = typeof item.month === 'string' 
        ? item.month.substring(0, 7) // Берем первые 7 символов (YYYY-MM)
        : new Date(item.month).toISOString().substring(0, 7)
      return itemMonth === month && item.object === objectId
    }
  )
  return !existingPeriod
}

// Получение статистики архива
export const getArchiveStats = () => {
  const totalPeriods = useArchiveStore.items.length
  const thisYear = new Date().getFullYear()
  const thisYearPeriods = useArchiveStore.items.filter(
    (item: ArchivePeriod) => new Date(item.month).getFullYear() === thisYear
  ).length

  return {
    total: totalPeriods,
    thisYear: thisYearPeriods,
    lastPeriod: useArchiveStore.items.length > 0 ? useArchiveStore.items[0] : null
  }
}