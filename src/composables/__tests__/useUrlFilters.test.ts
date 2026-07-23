/**
 * F-506 — страж механизма «URL ↔ фильтры».
 *
 * Ключевая хрупкость: значение из URL — ВСЕГДА строка, а опции select'ов числовые (id сущностей).
 * Если не привести тип, фильтр применится к запросу, но контрол покажется ПУСТЫМ («Все объекты»),
 * то есть пользователь увидит отфильтрованный список без признака фильтра. Тест это фиксирует.
 */
import { describe, it, expect } from 'vitest'
import { coerceFilterValue } from '@/composables/useUrlFilters'
import type { FilterConfig } from '@/types/generic'

const selectNumeric: FilterConfig = {
  key: 'object', type: 'select', label: 'Объект',
  options: [{ value: '', label: 'Все объекты' }, { value: 347, label: 'Doubletree' }, { value: 468, label: 'Узмакон' }],
}
const selectString: FilterConfig = {
  key: 'stage', type: 'select', label: 'Этап',
  options: [{ value: '', label: 'Все этапы' }, { value: 'handover', label: 'Сдача' }],
}

describe('coerceFilterValue — типы значений из URL', () => {
  it('select с ЧИСЛОВЫМИ опциями: "347" → 347 (иначе контрол пуст при применённом фильтре)', () => {
    expect(coerceFilterValue('347', selectNumeric)).toBe(347)
  })

  it('select со СТРОКОВЫМИ опциями: значение остаётся строкой', () => {
    expect(coerceFilterValue('handover', selectString)).toBe('handover')
  })

  it('multiselect: "347,468" → массив чисел', () => {
    const cfg: FilterConfig = { ...selectNumeric, type: 'multiselect' }
    expect(coerceFilterValue('347,468', cfg)).toEqual([347, 468])
  })

  it('number → число, а не строка (иначе бэк может отфильтровать иначе)', () => {
    expect(coerceFilterValue('42', { key: 'qty', type: 'number', label: 'Кол-во' })).toBe(42)
  })

  it('checkbox: "true"/"1" → true, остальное → false', () => {
    const cfg: FilterConfig = { key: 'is_active', type: 'checkbox', label: 'Активен' }
    expect(coerceFilterValue('true', cfg)).toBe(true)
    expect(coerceFilterValue('1', cfg)).toBe(true)
    expect(coerceFilterValue('false', cfg)).toBe(false)
  })

  it('date и text остаются строками (бэк ждёт ISO-строку)', () => {
    expect(coerceFilterValue('2026-07-23', { key: 'date_from', type: 'date', label: 'С' })).toBe('2026-07-23')
    expect(coerceFilterValue('кабель', { key: 'q', type: 'text', label: 'Поиск' })).toBe('кабель')
  })

  it('ПУСТОЙ параметр = без фильтрации (пустая строка), а не сброс в undefined/NaN', () => {
    expect(coerceFilterValue('', selectNumeric)).toBe('')
    expect(coerceFilterValue('', { key: 'qty', type: 'number', label: 'N' })).toBe('')
  })

  it('нечисловое значение в числовом select не превращается в NaN', () => {
    expect(coerceFilterValue('abc', selectNumeric)).toBe('abc')
    expect(coerceFilterValue('abc', { key: 'qty', type: 'number', label: 'N' })).toBe('abc')
  })

  it('ключи без конфига (search/ordering) — строки как есть', () => {
    expect(coerceFilterValue('-date', undefined)).toBe('-date')
  })
})
