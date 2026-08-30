/**
 * Store пресетов коэффициентов (F-1036 ↔ BE F-794): справочник «имя + множитель (+ подсказка зоны)» для диалога
 * «+ Добавить коэффициент» сметы. НЕ позиции каталога (F-740): в смете коэффициент остаётся ad-hoc строкой, пресет
 * лишь подставляет имя/множитель. Права — как у позиций каталога (work_items.*): руководство правит, все читают.
 */
import { endpoints } from '@/api/endpoints'
import { createBaseStore } from './base'
import type { CoefficientPreset, CoefficientPresetRequest } from '@/api/types/estimates'

export const useCoefficientPresetsStore = createBaseStore<
  CoefficientPreset,
  CoefficientPresetRequest,
  Partial<CoefficientPresetRequest>
>({
  endpoint: endpoints.coefficientPresets,
  entityName: 'coefficientPresets',
  entityNamePlural: 'пресеты коэффициентов',
  defaultOrdering: 'order',
})
