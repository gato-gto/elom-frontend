// F-1033 (BE F-791, owner 2026-08-29): ЕДИНСТВЕННЫЙ источник этапов работ объекта на фронте — зеркало
// common.models.STAGE_CHOICES. До F-1033 список жил в шести рукописных копиях (ObjectForm, ObjectInfo,
// Stocks/List, WriteOffs/List, StockCard, WriteOffCard) и уже расходился (F-910/F-918: мобильная карточка
// печатала сырой код, desktop — подпись). Меняя этапы — менять ТОЛЬКО здесь и в BE; гард:
// src/test/architecture.guards.test.ts («этапы работ»).
// F-1034 (D-028a, поправка владельца): этапы — состояние САМОЙ стройки, она идёт независимо от нас; объект
// берём на любом этапе → «дефолтного» этапа нет (форма не предзаполняет), а порядок ниже — только порядок
// в селекте, не обязательная последовательность. «Приемка» — МЫ принимаем объект в работу, не заказчик.
export const STAGES = [
  { value: 'start', label: 'Начало работ', description: 'На объекте начинаются работы, подготовка площадки' },
  { value: 'installation', label: 'Монтажные работы', description: 'На объекте идёт монтаж' },
  { value: 'rework', label: 'Переделки', description: 'На объекте переделки по замечаниям' },
  { value: 'acceptance', label: 'Приемка', description: 'Объект принимается нами в работу (не заказчиком)' },
  { value: 'handover', label: 'Сдача', description: 'Объект сдаётся заказчику' }
] as const

export type Stage = (typeof STAGES)[number]['value']

export const STAGE_META: Record<Stage, { label: string; description: string }> = Object.fromEntries(
  STAGES.map(s => [s.value, { label: s.label, description: s.description }])
) as Record<Stage, { label: string; description: string }>

/** Подпись этапа. Неизвестный код — как есть (старые данные не должны ронять карточку), пустой — ''. */
export function stageLabel(code: string | null | undefined): string {
  if (!code) { return '' }
  return (STAGE_META as Record<string, { label: string }>)[code]?.label ?? code
}

/** Опции селекта в порядке владельца; withAll — первой «Все этапы» (фильтры списков). */
export function stageSelectOptions(withAll = false): Array<{ value: string; label: string }> {
  const opts = STAGES.map(s => ({ value: s.value as string, label: s.label as string }))
  return withAll ? [{ value: '', label: 'Все этапы' }, ...opts] : opts
}
