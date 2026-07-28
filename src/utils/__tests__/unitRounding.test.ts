// F-717: контракт «умного» вывода количеств/остатков (выбор владельца F-867) — одно удобное число.
// Смысл: остаток «9750000 м» показывать как «9 750 км», «250000 м» → «250 км», а неконвертируемое —
// исходное значение с разделителями тысяч (не сырьё без пробелов). Сверяемся с самим formatNumber,
// чтобы тест не зависел от символа-разделителя локали.
import { describe, it, expect } from 'vitest'
import { smartConvert, formatSmartQuantity } from '@/utils/unitRounding'
import { formatNumber } from '@/utils/formatters'

describe('F-717 умное сокращение количеств/остатков', () => {
  it('smartConvert укрупняет единицу только при делении НАЦЕЛО на фактор', () => {
    expect(smartConvert(9750000, 'м')).toMatchObject({ value: 9750, unit: 'км', converted: true })
    expect(smartConvert(250000, 'м')).toMatchObject({ value: 250, unit: 'км', converted: true })
    expect(smartConvert(2000, 'г')).toMatchObject({ value: 2, unit: 'кг', converted: true })
    // не кратно фактору (1500 % 1000 ≠ 0) → НЕ укрупняем, чтобы не терять точность
    expect(smartConvert(1500, 'г').converted).toBe(false)
  })

  it('formatSmartQuantity: остаток одним удобным числом с укрупнённой единицей', () => {
    expect(formatSmartQuantity(9750000, 'м')).toBe(`${formatNumber(9750)} км`)
    expect(formatSmartQuantity(250000, 'м')).toBe(`${formatNumber(250)} км`)
    // строковый вход (API отдаёт строки) обрабатывается так же
    expect(formatSmartQuantity('250000', 'м')).toBe(`${formatNumber(250)} км`)
  })

  it('неконвертируемое значение — исходное с разделителями тысяч, а не сырьё', () => {
    // 1123 г не делится «красиво» → остаётся в граммах, но с группировкой разрядов
    expect(formatSmartQuantity(1123, 'г')).toBe(`${formatNumber(1123)} г`)
    expect(smartConvert(1123, 'г').converted).toBe(false)
  })

  it('пустые/нечисловые значения → прочерк', () => {
    expect(formatSmartQuantity(null)).toBe('—')
    expect(formatSmartQuantity(undefined)).toBe('—')
    expect(formatSmartQuantity('')).toBe('—')
    expect(formatSmartQuantity('abc', 'м')).toBe('—')
  })
})
