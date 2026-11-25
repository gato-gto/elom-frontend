// F-1109: формы документов показывают в «Объекте» только активные объекты. Документ архивного (неактивного)
// объекта при правке показывал пустое поле — его объект остаётся в списке с пометкой «(в архиве)».
export interface ObjectOption { value: number; label: string }

// F-1115 (ревью F-1109): пометка — только если объект действительно в архиве. Объект может не попасть в список и
// активным (руководство с назначениями, заявитель, снятый с объекта) — тогда он показывается без пометки.
export function withCurrentObject(options: ObjectOption[], objectId: number | null | undefined,
  objectName: string | null | undefined, archived = true): ObjectOption[] {
  if (!objectId || options.some(o => o.value === objectId)) { return options }
  const name = objectName || `объект №${objectId}`
  return [...options, { value: objectId, label: archived ? `${name} (в архиве)` : name }]
}

/** Архивный ли объект по известному списку: нет в списке (формы грузят только активные) — считаем архивным. */
export function isArchivedObject(items: Array<{ id: number; is_active?: boolean }>, objectId: number | null | undefined): boolean {
  const found = items.find(o => o.id === objectId)
  return found ? found.is_active === false : true
}
