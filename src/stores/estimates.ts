/**
 * Store смет по объекту. Object-scoped на BE (view_all → все; иначе свои объекты).
 * Create/update принимают ВЛОЖЕННЫЕ lines одним запросом (BE: PATCH с lines заменяет все строки,
 * всё в одной transaction.atomic; ответ — read-сериализатор со снапшотом + amount + total).
 */
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { createBaseStore } from './base'
import type {
  Estimate, EstimateWriteRequest, EstimateImportPreview, EstimateImportResult,
} from '@/api/types/estimates'

export const useEstimatesStore = createBaseStore<
  Estimate,
  EstimateWriteRequest,
  Partial<EstimateWriteRequest>
>({
  endpoint: endpoints.estimates,
  entityName: 'estimates',
  entityNamePlural: 'сметы',
  defaultOrdering: '-id',
})

// ============================================================================
// Custom Actions — импорт «отчёта цен» (F-997 ↔ BE F-766), стиль purchases.uploadPhoto
// ============================================================================

/** Шаг 1: разбор xlsx без записи — превью (группы/строки/новые позиции/warnings/идемпотентность). */
export async function importEstimateDryRun(file: File): Promise<EstimateImportPreview> {
  const fd = new FormData()
  fd.append('file', file)
  const resp = await api.post(endpoints.estimates.importDryRun, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return resp.data as EstimateImportPreview
}

/** Шаг 2: создать смету из файла. 201 → {id,…}; повтор того же файла → 200 already imported (без id). */
export async function importEstimateCommit(
  file: File, objectId: number, title?: string,
): Promise<EstimateImportResult> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('object', String(objectId))
  if (title) { fd.append('title', title) }
  const resp = await api.post(endpoints.estimates.importCommit, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return resp.data as EstimateImportResult
}
