// F-1109: правка документа архивного (неактивного) объекта — поле «Объект» было пустым: формы показывают только
// активные объекты. Текущий объект документа остаётся в списке с пометкой «(в архиве)».
import { describe, it, expect } from 'vitest'
import { withCurrentObject } from '@/utils/currentObjectOption'

const ACTIVE = [{ value: 1, label: 'Гостиница' }]

describe('withCurrentObject', () => {
  it('объект документа вне списка — добавляется с пометкой', () => {
    expect(withCurrentObject(ACTIVE, 7, 'Офис Медцентр')).toEqual([...ACTIVE, { value: 7, label: 'Офис Медцентр (в архиве)' }])
  })
  it('уже в списке — без изменений', () => {
    expect(withCurrentObject(ACTIVE, 1, 'Гостиница')).toEqual(ACTIVE)
  })
  it('нет объекта (новый документ) — без изменений', () => {
    expect(withCurrentObject(ACTIVE, null, undefined)).toEqual(ACTIVE)
    expect(withCurrentObject(ACTIVE, 0, '')).toEqual(ACTIVE)
  })
  it('без имени — «объект №id»', () => {
    expect(withCurrentObject([], 7, undefined)).toEqual([{ value: 7, label: 'объект №7 (в архиве)' }])
  })
})
