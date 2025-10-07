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
const baseStore = createBaseStore<ArchivePeriod, ArchivePeriodRequest, ArchivePeriodRequest>(config)

// Расширяем базовый store специфичной логикой архива
export const useArchiveStore = baseStore

// Специфичные для архива действия
export const closePeriod = async (data: ArchivePeriodRequest) => {
  baseStore.loading = true
  baseStore.error = null

  try {
    const result = await api.post(endpoints.archive.periods.close, data)
    
    // Обновляем список после успешного закрытия
    await baseStore.fetchList()
    
    return result.data
  } catch (err: any) {
    baseStore.error = err?.response?.data?.detail || 'Ошибка при закрытии периода'
    throw err
  } finally {
    baseStore.loading = false
  }
}

export const reopenPeriod = async (data: { month: string; object: number }) => {
  baseStore.loading = true
  baseStore.error = null

  try {
    const result = await api.post(endpoints.archive.periods.reopen, data)
    
    // Обновляем список после успешного открытия
    await baseStore.fetchList()
    
    return result.data
  } catch (err: any) {
    baseStore.error = err?.response?.data?.detail || 'Ошибка при открытии периода'
    throw err
  } finally {
    baseStore.loading = false
  }
}

// Проверка возможности закрытия периода
export const canClosePeriod = (month: string, objectId: number) => {
  // Проверяем, не закрыт ли уже период
  const existingPeriod = baseStore.items.find(
    (item: ArchivePeriod) => item.month === month && item.object === objectId
  )
  return !existingPeriod
}

// Получение статистики архива
export const getArchiveStats = () => {
  const totalPeriods = baseStore.items.length
  const thisYear = new Date().getFullYear()
  const thisYearPeriods = baseStore.items.filter(
    (item: ArchivePeriod) => new Date(item.month).getFullYear() === thisYear
  ).length

  return {
    total: totalPeriods,
    thisYear: thisYearPeriods,
    lastPeriod: baseStore.items.length > 0 ? baseStore.items[0] : null
  }
}