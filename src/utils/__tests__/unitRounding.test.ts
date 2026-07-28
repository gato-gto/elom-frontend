// F-717: контракт «умного» вывода количеств/остатков (выбор владельца F-867) — одно удобное число.
// Смысл: остаток «9750000 м» показывать как «9 750 км», «250000 м» → «250 км», а неконвертируемое —
// исходное значение с разделителями тысяч (не сырьё без пробелов). Сверяемся с самим formatNumber,
// чтобы тест не зависел от символа-разделителя локали.
import { describe, it, expect } from 'vitest'
import { smartConvert, formatSmartQuantity } from '@/utils/unitRounding'
import { formatNumber } from '@/utils/formatters'

describe('F-717/F-868 умное сокращение количеств/остатков', () => {
  it('smartConvert укрупняет целые кратные', () => {
    expect(smartConvert(9750000, 'м')).toMatchObject({ value: 9750, unit: 'км', converted: true })
    expect(smartConvert(250000, 'м')).toMatchObject({ value: 250, unit: 'км', converted: true })
    expect(smartConvert(2000, 'г')).toMatchObject({ value: 2, unit: 'кг', converted: true })
  })

  it('F-868 (решение владельца): укрупняет и «красивые» дроби — 1500 м → 1,5 км', () => {
    expect(smartConvert(1500, 'г')).toMatchObject({ value: 1.5, unit: 'кг', converted: true })
    expect(smartConvert(1500, 'м')).toMatchObject({ value: 1.5, unit: 'км', converted: true })
    expect(smartConvert(1250, 'г')).toMatchObject({ value: 1.25, unit: 'кг', converted: true })
    expect(smartConvert(1750, 'г')).toMatchObject({ value: 1.75, unit: 'кг', converted: true })
  })

  it('F-868: НЕ укрупняет, если значение неточное (точность важнее — «видно реально»)', () => {
    // 1499,9 м → 1,4999 км: округлилось бы до «1,5 км» и исказило реальное число → оставляем
    expect(smartConvert(1499.9, 'м').converted).toBe(false)
    // 1,05 кг — кратно 0,05, но «некрасивая» дробь → оставляем 1050 г
    expect(smartConvert(1050, 'г').converted).toBe(false)
    // 0,25 кг < 1 → короче как «250 г»
    expect(smartConvert(250, 'г').converted).toBe(false)
  })

  it('formatSmartQuantity: остаток одним удобным числом с укрупнённой единицей', () => {
    // целые НЕ обзаводятся дробью (min=0): совпадает с 2-знаковым formatNumber для целого
    expect(formatSmartQuantity(9750000, 'м')).toBe(`${formatNumber(9750)} км`)
    expect(formatSmartQuantity('250000', 'м')).toBe(`${formatNumber(250)} км`)
  })

  it('неконвертируемое значение — исходное с разделителями тысяч, а не сырьё', () => {
    // 1123 г не делится «красиво» → остаётся в граммах, но с группировкой разрядов
    expect(formatSmartQuantity(1123, 'г')).toBe(`${formatNumber(1123)} г`)
    expect(smartConvert(1123, 'г').converted).toBe(false)
  })

  it('F-876: сохраняет точность (не округляет 0,001 т до «0 т»)', () => {
    // BE quantity/current_balance = decimal_places 3..6; раньше formatNumber(max 2) прятал реальный
    // остаток («0,001 т» → «0 т»). Теперь до 6 знаков (regex — независимо от разделителя локали).
    expect(formatSmartQuantity(0.001, 'т')).toMatch(/^0[.,]001 т$/)
    expect(formatSmartQuantity(2.5005, 'кг')).toMatch(/^2[.,]5005 кг$/)
    expect(formatSmartQuantity(0, 'т')).toBe('0 т')            // ноль без хвостовых нулей
    // целые НЕ обзаводятся дробью (min=0): для целого == 2-знаковый formatNumber
    expect(formatSmartQuantity(9750000, 'м')).toBe(`${formatNumber(9750)} км`)
  })

  it('пустые/нечисловые значения → прочерк', () => {
    expect(formatSmartQuantity(null)).toBe('—')
    expect(formatSmartQuantity(undefined)).toBe('—')
    expect(formatSmartQuantity('')).toBe('—')
    expect(formatSmartQuantity('abc', 'м')).toBe('—')
  })
})
