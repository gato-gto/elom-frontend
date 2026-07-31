/**
 * Store смет по объекту. Object-scoped на BE (view_all → все; иначе свои объекты).
 * Create/update принимают ВЛОЖЕННЫЕ lines одним запросом (BE: PATCH с lines заменяет все строки,
 * всё в одной transaction.atomic; ответ — read-сериализатор со снапшотом + amount + total).
 */
import { endpoints } from '@/api/endpoints'
import { createBaseStore } from './base'
import type { Estimate, EstimateWriteRequest } from '@/api/types/estimates'

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
