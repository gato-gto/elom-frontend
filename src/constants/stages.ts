// F-1033 (BE F-791, owner 2026-08-29): ЕДИНСТВЕННЫЙ источник этапов работ объекта на фронте — зеркало
// common.models.STAGE_CHOICES (порядок = порядок владельца). До F-1033 список жил в шести рукописных
// копиях (ObjectForm, ObjectInfo, Stocks/List, WriteOffs/List, StockCard, WriteOffCard) и уже расходился
// (F-910/F-918: мобильная карточка печатала сырой код, desktop — подпись). Меняя этапы — менять ТОЛЬКО
// здесь и в BE; гард: src/test/architecture.guards.test.ts («этапы работ»).
export const STAGES = [
  { value: 'start', label: 'Начало работ', description: 'Открытие объекта, подготовка площадки' },
  { value: 'installation', label: 'Монтажные работы', description: 'Основной объём монтажа и расход материалов' },
  { value: 'rework', label: 'Переделки', description: 'Исправления и доработки по замечаниям' },
  { value: 'acceptance', label: 'Приемка', description: 'Проверка выполненных работ заказчиком' },
  { value: 'handover', label: 'Сдача', description: 'Передача объекта заказчику' }
] as const

export type Stage = (typeof STAGES)[number]['value']

export const DEFAULT_STAGE: Stage = 'start'

export const STAGE_META: Record<Stage, { label: string; description: string }> = Object.fromEntries(
  STAGES.map(s => [s.value, { label: s.label, description: s.description }])
) as Record<Stage, { label: string; description: string }>

/** Подпись этапа. Неизвестный код — как есть (старые данные не должны ронять карточку), пустой — ''. */
export function stageLabel(code: string | null | undefined): string {
  if (!code) return ''
  return (STAGE_META as Record<string, { label: string }>)[code]?.label ?? code
}

/** Опции селекта в порядке владельца; withAll — первой «Все этапы» (фильтры списков). */
export function stageSelectOptions(withAll = false): Array<{ value: string; label: string }> {
  const opts = STAGES.map(s => ({ value: s.value as string, label: s.label as string }))
  return withAll ? [{ value: '', label: 'Все этапы' }, ...opts] : opts
}
