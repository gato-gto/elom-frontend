/**
 * Типы для архивных периодов
 */

// Основная модель архивного периода
export interface ArchivePeriod {
  id: number
  month: string // YYYY-MM-DD
  object: number
  object_name: string
  closed_at: string // ISO datetime
  closed_by: number
  closed_by_name: string
  is_closed: boolean
}

// Запрос на создание архивного периода
export interface ArchivePeriodRequest {
  month: string // YYYY-MM
  object: number
}

// Запрос на открытие периода
export interface ArchiveReopenRequest {
  month: string // YYYY-MM
  object: number
}

// Фильтры для списка архивных периодов
export interface ArchiveListQuery {
  month?: string
  month_from?: string
  month_to?: string
  object?: number
  object_name?: string
  closed_by?: number
  closed_by_name?: string
  closed_at_from?: string
  closed_at_to?: string
  year?: number
  month_number?: number
  ordering?: string
}

// Статистика архива
export interface ArchiveStats {
  total: number
  thisYear: number
  lastPeriod: ArchivePeriod | null
}

// Опции для фильтров
export interface ArchiveFilterOptions {
  objects: Array<{ id: number; name: string }>
  users: Array<{ id: number; name: string }>
  years: number[]
  months: Array<{ value: number; label: string }>
}