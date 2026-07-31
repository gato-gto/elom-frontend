/**
 * Store для управления списаниями
 */
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { createBaseStore } from './base'
import type {
  WriteOff,
  WriteOffCreateRequest,
  WriteOffUpdateRequest
} from '@/api/types'

// Создаём store
export const useWriteOffsStore = createBaseStore<WriteOff, WriteOffCreateRequest, WriteOffUpdateRequest>({
  endpoint: endpoints.writeOffs,
  entityName: 'writeOffs',
  entityNamePlural: 'списания',
  defaultOrdering: '-date'
})

// ============================================================================
// Custom Actions
// ============================================================================

// F-270: одна позиция пакетного «Нового списания» (общие object/date/responsible в шапке).
export interface WriteOffBulkItem {
  material: number
  unit: number
  quantity: string
  comment?: string
}

// F-270: тело POST /writeoffs/bulk-create/ — один object+date+responsible на массив позиций.
export interface WriteOffBulkPayload {
  object: number
  date: string
  responsible: number
  comment?: string
  // F-926/F-730: атомарный edit-путь — если задан, ПЕРВАЯ позиция items[0] обновляет существующее
  // списание (partial update), остальные создаются, ВСЁ в одной серверной transaction.atomic.
  // Без него — чистый bulk-create (поведение F-270 неизменно).
  update_id?: number
  items: WriteOffBulkItem[]
}

export interface WriteOffBulkResponse {
  count: number
  created: WriteOff[]
}

// F-270: атомарное массовое «Новое списание» — ОДИН запрос вместо N неатомарных create().
// Всё-или-ничего; при ошибке любой строки бэкенд откатывает все и возвращает 400 с
// errors.items[{index, detail}] (форма раскладывает их по позициям). Не бросаем в store.error —
// форма сама разбирает построчные ошибки и показывает тост.
export const createBulk = async (payload: WriteOffBulkPayload): Promise<WriteOffBulkResponse> => {
  const response = await api.post<WriteOffBulkResponse>(endpoints.writeOffs.bulkCreate, payload)
  return response.data
}

// ============================================================================
// Helper Functions
// ============================================================================

export const getByStage = (stage: string) => {
  const store = useWriteOffsStore()
  return store.items.filter((item: WriteOff) => item.stage === stage)
}

export const getByObject = (objectId: number) => {
  const store = useWriteOffsStore()
  return store.items.filter((item: WriteOff) => item.object === objectId)
}

export const getByMaterial = (materialId: number) => {
  const store = useWriteOffsStore()
  return store.items.filter((item: WriteOff) => item.material === materialId)
}

export const getByResponsible = (responsibleId: number) => {
  const store = useWriteOffsStore()
  return store.items.filter((item: WriteOff) => item.responsible === responsibleId)
}

export const getTotalQuantity = () => {
  const store = useWriteOffsStore()
  return store.items.reduce((sum: number, item: WriteOff) => sum + parseFloat(item.quantity), 0)
}

export const getUniqueObjectsCount = () => {
  const store = useWriteOffsStore()
  return new Set(store.items.map((item: WriteOff) => item.object)).size
}

export const getUniqueMaterialsCount = () => {
  const store = useWriteOffsStore()
  return new Set(store.items.map((item: WriteOff) => item.material)).size
}

export const getStageStats = () => {
  const store = useWriteOffsStore()
  const stats: Record<string, { count: number; quantity: number }> = {}
  
  store.items.forEach((item: WriteOff) => {
    const stage = item.stage || 'unknown'
    if (!stats[stage]) {
      stats[stage] = { count: 0, quantity: 0 }
    }
    stats[stage].count += 1
    stats[stage].quantity += parseFloat(item.quantity)
  })
  
  return stats
}
