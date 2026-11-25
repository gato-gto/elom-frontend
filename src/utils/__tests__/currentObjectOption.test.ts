// F-1109: правка документа архивного (неактивного) объекта — поле «Объект» было пустым: формы показывают только
// активные объекты. Текущий объект документа остаётся в списке с пометкой «(в архиве)».
import { describe, it, expect } from 'vitest'
import { isArchivedObject, withCurrentObject } from '@/utils/currentObjectOption'

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
  // F-1115 (ревью): объект вне списка может быть и активным (фильтр по назначениям) — тогда без пометки
  it('активный объект вне списка — без пометки', () => {
    expect(withCurrentObject(ACTIVE, 7, 'Офис', false)).toEqual([...ACTIVE, { value: 7, label: 'Офис' }])
  })
})

describe('isArchivedObject (F-1115)', () => {
  const items = [{ id: 1, is_active: true }, { id: 2, is_active: false }]
  it('активный — нет, неактивный — да, неизвестный (формы грузят только активные) — да', () => {
    expect([isArchivedObject(items, 1), isArchivedObject(items, 2), isArchivedObject(items, 9)]).toEqual([false, true, true])
  })
})
