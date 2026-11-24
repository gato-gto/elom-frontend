import { describe, it, expect } from 'vitest'
import {
  canDeletePurchase, canDeleteWriteOff, purchaseDeleteQuestion, writeOffDeleteQuestion, type DeletePerms,
} from '../deleteRules'

// F-1093 (T3; ответы владельца 1 и 2): то же правило, что на сервере (purchases/tests_f1084_delete_policy.py).
const perms = (codes: string[], meId = 7, isSuperuser = false): DeletePerms =>
  ({ isSuperuser, meId, has: (c: string) => codes.includes(c) })
const MANAGER = perms(['purchases.delete', 'purchases.delete_all', 'writeoffs.delete', 'writeoffs.delete_all'])
const BRIG = perms(['purchases.delete', 'purchases.delete_own', 'writeoffs.delete', 'writeoffs.delete_own'])
const WAREHOUSE = perms([])

describe('canDeletePurchase', () => {
  it('manager — любую, в т.ч. проведённую чужую', () => {
    expect(canDeletePurchase({ id: 1, status: 'completed', created_by: 99 }, MANAGER)).toBe(true)
  })
  it('суперпользователь — любую', () => {
    expect(canDeletePurchase({ id: 1, status: 'completed', created_by: 99 }, perms([], 7, true))).toBe(true)
  })
  it('бригадир — свой черновик', () => {
    expect(canDeletePurchase({ id: 1, status: 'new', created_by: 7 }, BRIG)).toBe(true)
  })
  it('бригадир — не свою проведённую, не чужой черновик, не свою проведённую', () => {
    expect(canDeletePurchase({ id: 1, status: 'completed', created_by: 99 }, BRIG)).toBe(false)
    expect(canDeletePurchase({ id: 1, status: 'new', created_by: 99 }, BRIG)).toBe(false)
    expect(canDeletePurchase({ id: 1, status: 'completed', created_by: 7 }, BRIG)).toBe(false)
  })
  it('склад — ничего', () => {
    expect(canDeletePurchase({ id: 1, status: 'new', created_by: 7 }, WAREHOUSE)).toBe(false)
  })
  it('архив (закрытый период) — никто', () => {
    expect(canDeletePurchase({ id: 1, status: 'new', created_by: 7, is_archived: true }, MANAGER)).toBe(false)
  })
  it('нет автора у закупки → бригадир не удаляет', () => {
    expect(canDeletePurchase({ id: 1, status: 'new', created_by: null }, BRIG)).toBe(false)
    expect(canDeletePurchase({ id: 1, status: 'new', created_by: 7 }, { ...BRIG, meId: null })).toBe(false)
  })
})

describe('canDeleteWriteOff', () => {
  it('manager — любое; бригадир — своё; склад — ничего; архив — никто', () => {
    expect(canDeleteWriteOff({ created_by: 99 }, MANAGER)).toBe(true)
    expect(canDeleteWriteOff({ created_by: 7 }, BRIG)).toBe(true)
    expect(canDeleteWriteOff({ created_by: 99 }, BRIG)).toBe(false)
    expect(canDeleteWriteOff({ created_by: 7 }, WAREHOUSE)).toBe(false)
    expect(canDeleteWriteOff({ created_by: 7, is_archived: true }, MANAGER)).toBe(false)
  })
})

describe('вопросы перед удалением', () => {
  it('проведённая закупка — предупреждает про остаток объекта', () => {
    expect(purchaseDeleteQuestion({ id: 5, purchase_no: 'P0005', status: 'completed', object_name: 'Медцентр 01' }))
      .toBe('Удалить закупку P0005? Её приход уйдёт с остатка объекта «Медцентр 01».')
  })
  it('черновик — без слов про остаток; без номера — по id', () => {
    expect(purchaseDeleteQuestion({ id: 5, status: 'new' })).toBe('Удалить закупку № 5?')
  })
  it('списание — сколько и чего вернётся на остаток', () => {
    expect(writeOffDeleteQuestion({ quantity: '5.000000', unit_code: 'м', material_name: 'Кабель', object_name: 'Гостиница' }))
      .toBe('Удалить списание? Остаток объекта «Гостиница» увеличится на 5 м «Кабель».')
    expect(writeOffDeleteQuestion({ quantity: '1500.5', unit_code: 'м', material_name: 'Кабель', object_name: 'Г' }))
      .toBe('Удалить списание? Остаток объекта «Г» увеличится на 1\u00a0500,5 м «Кабель».')
  })
})
