import { describe, it, expect } from 'vitest'
import { canTrash, purchaseTrashQuestion, writeOffTrashQuestion, TRASH_RETENTION_DAYS } from '../deleteRules'

// D-2 (корзина, 26.11): кто может отправить в корзину, решает сервер (поле can_trash: руководство — всё; ответственный
// и склад — своё в течение 3 ч; свой черновик — всегда). Окно в часах FE не считает — только показывает кнопку.
describe('canTrash', () => {
  it('кнопка есть, только если сервер разрешил', () => {
    expect(canTrash({ can_trash: true })).toBe(true)
    expect(canTrash({ can_trash: false })).toBe(false)
  })
  it('нет поля (старый ответ сервера) или null — кнопки нет', () => {
    expect(canTrash({})).toBe(false)
    expect(canTrash({ can_trash: null })).toBe(false)
  })
  it('архив (закрытый период) — кнопки нет, даже если поле пришло true', () => {
    expect(canTrash({ can_trash: true, is_archived: true })).toBe(false)
  })
})

describe('вопросы перед отправкой в корзину', () => {
  it('срок возврата — 7 дней, как на сервере (TRASH_RETENTION_DAYS)', () => {
    expect(TRASH_RETENTION_DAYS).toBe(7)
  })
  it('проведённая закупка — про остаток объекта и про возврат', () => {
    expect(purchaseTrashQuestion({ id: 5, purchase_no: 'P0005', status: 'completed', object_name: 'Медцентр 01' }))
      .toBe('Отправить закупку P0005 в корзину? Её приход уйдёт с остатка объекта «Медцентр 01». '
        + 'Руководство сможет вернуть её в течение 7 дней.')
  })
  it('проведённая закупка без названия объекта', () => {
    expect(purchaseTrashQuestion({ id: 5, purchase_no: 'P0005', status: 'completed' }))
      .toBe('Отправить закупку P0005 в корзину? Её приход уйдёт с остатка объекта. '
        + 'Руководство сможет вернуть её в течение 7 дней.')
  })
  it('черновик — без слов про остаток; без номера — по id', () => {
    expect(purchaseTrashQuestion({ id: 5, status: 'new' }))
      .toBe('Отправить закупку № 5 в корзину? Руководство сможет вернуть её в течение 7 дней.')
  })
  it('списание — сколько и чего вернётся на остаток, и про возврат', () => {
    expect(writeOffTrashQuestion({ quantity: '5.000000', unit_code: 'м', material_name: 'Кабель', object_name: 'Гостиница' }))
      .toBe('Отправить списание в корзину? Остаток объекта «Гостиница» увеличится на 5 м «Кабель». '
        + 'Руководство сможет вернуть его в течение 7 дней.')
    expect(writeOffTrashQuestion({ quantity: '1500.5', unit_code: 'м', material_name: 'Кабель', object_name: 'Г' }))
      .toBe('Отправить списание в корзину? Остаток объекта «Г» увеличится на 1 500,5 м «Кабель». '
        + 'Руководство сможет вернуть его в течение 7 дней.')
  })
  // F-1137: пробелы, найденные пилотом Stryker (мутанты в строках 49–51 не были покрыты или выживали)
  it('списание без единицы — число без хвостового пробела перед названием', () => {
    expect(writeOffTrashQuestion({ quantity: '5.000000', unit_code: '', material_name: 'Кабель', object_name: 'Г' }))
      .toBe('Отправить списание в корзину? Остаток объекта «Г» увеличится на 5 «Кабель». '
        + 'Руководство сможет вернуть его в течение 7 дней.')
  })
  it('списание без названий материала и объекта — без пустых кавычек, просто «объекта»', () => {
    expect(writeOffTrashQuestion({ quantity: '2', unit_code: 'шт' }))
      .toBe('Отправить списание в корзину? Остаток объекта увеличится на 2 шт. '
        + 'Руководство сможет вернуть его в течение 7 дней.')
  })
})
