// F-1109: формы документов показывают в «Объекте» только активные объекты. Документ архивного (неактивного)
// объекта при правке показывал пустое поле — его объект остаётся в списке с пометкой «(в архиве)».
export interface ObjectOption { value: number; label: string }

export function withCurrentObject(options: ObjectOption[], objectId: number | null | undefined,
  objectName: string | null | undefined): ObjectOption[] {
  if (!objectId || options.some(o => o.value === objectId)) { return options }
  return [...options, { value: objectId, label: `${objectName || `объект №${objectId}`} (в архиве)` }]
}
