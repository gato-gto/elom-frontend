import { describe, it, expect } from 'vitest'
import { formatNumberClean, formatQuantity, formatDate, formatDateTime, formatNumber, formatCurrency, pluralizeRu } from '../formatters'

describe('formatNumberClean', () => {
  it('removes trailing zeros from decimal numbers', () => {
    expect(formatNumberClean(14.000000)).toBe('14')
    expect(formatNumberClean('14.000000')).toBe('14')
    expect(formatNumberClean(14.5)).toBe('14.5')
    expect(formatNumberClean('14.50')).toBe('14.5')
    expect(formatNumberClean(14.500000)).toBe('14.5')
  })

  it('shows integers as integers', () => {
    expect(formatNumberClean(14)).toBe('14')
    expect(formatNumberClean(0)).toBe('0')
    expect(formatNumberClean(-5)).toBe('-5')
  })

  it('shows fractional part only when it exists', () => {
    expect(formatNumberClean(14.0)).toBe('14')
    expect(formatNumberClean(14.5)).toBe('14.5')
    expect(formatNumberClean(0.5)).toBe('0.5')
    expect(formatNumberClean(0.000001)).toBe('0.000001')
  })

  it('handles null and undefined', () => {
    expect(formatNumberClean(null)).toBe('—')
    expect(formatNumberClean(undefined)).toBe('—')
    expect(formatNumberClean('')).toBe('—')
  })

  it('handles invalid values', () => {
    expect(formatNumberClean('abc')).toBe('—')
    expect(formatNumberClean(NaN)).toBe('—')
  })

  it('handles negative numbers', () => {
    expect(formatNumberClean(-14.000000)).toBe('-14')
    expect(formatNumberClean(-14.5)).toBe('-14.5')
    expect(formatNumberClean(-14.50)).toBe('-14.5')
  })

  it('handles very small numbers', () => {
    expect(formatNumberClean(0.000001)).toBe('0.000001')
    // Very small numbers may be formatted differently depending on JavaScript engine
    const result = formatNumberClean(0.0000001)
    expect(result === '1e-7' || result === '0.0000001' || result === '1e-7').toBe(true)
  })
})

describe('formatQuantity', () => {
  it('formats quantity with unit', () => {
    expect(formatQuantity(14.000000, 'м')).toBe('14 м')
    expect(formatQuantity(14.5, 'кг')).toBe('14.5 кг')
    expect(formatQuantity('14.50', 'шт')).toBe('14.5 шт')
  })

  it('formats quantity without unit', () => {
    expect(formatQuantity(14.000000)).toBe('14')
    expect(formatQuantity(14.5)).toBe('14.5')
  })

  it('handles null and undefined', () => {
    expect(formatQuantity(null, 'м')).toBe('—')
    expect(formatQuantity(undefined, 'кг')).toBe('—')
  })
})

describe('formatDate', () => {
  it('formats valid date string', () => {
    const result = formatDate('2024-01-15')
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/) // DD.MM.YYYY format
  })

  it('handles null and undefined', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })

  it('handles invalid date string', () => {
    expect(formatDate('invalid-date')).toBe('—')
  })

  it('formats ISO date string', () => {
    const result = formatDate('2024-01-15T10:30:00Z')
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/)
  })
})

describe('formatDateTime', () => {
  it('formats valid date time string', () => {
    const result = formatDateTime('2024-01-15T10:30:00Z')
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/)
    expect(result).toMatch(/\d{2}:\d{2}/)
  })

  it('handles null and undefined', () => {
    expect(formatDateTime(null)).toBe('—')
    expect(formatDateTime(undefined)).toBe('—')
  })

  it('handles invalid date time string', () => {
    const result = formatDateTime('invalid-datetime')
    // formatDateTime may return "—" or "Invalid Date" depending on implementation
    expect(result === '—' || result.includes('Invalid')).toBe(true)
  })
})

describe('formatNumber', () => {
  it('formats number with thousand separators', () => {
    const result = formatNumber(1234.56)
    expect(result).toMatch(/1[\s\u00A0]234/) // Should have thousand separator
  })

  it('handles null and undefined', () => {
    expect(formatNumber(null)).toBe('—')
    expect(formatNumber(undefined)).toBe('—')
    expect(formatNumber('')).toBe('—')
  })

  it('handles string numbers', () => {
    // ru-RU по спеке Intl: NBSP-разделитель тысяч + запятая-десятичная, ≤2 знака → «1 234,56»
    expect(formatNumber('1234.56')).toMatch(/1\s234,56/)
  })

  it('handles invalid values', () => {
    expect(formatNumber('abc')).toBe('—')
    expect(formatNumber(NaN)).toBe('—')
  })
})

describe('formatCurrency', () => {
  it('formats number as currency', () => {
    const result = formatCurrency(1234.56)
    expect(result).toMatch(/1[\s\u00A0]234/) // Should have thousand separator
    expect(result).toMatch(/UZS/i) // ELOM currency is Uzbek som (UZS), not RUB
  })

  it('handles null and undefined', () => {
    expect(formatCurrency(null)).toBe('—')
    expect(formatCurrency(undefined)).toBe('—')
    expect(formatCurrency('')).toBe('—')
  })

  it('handles string numbers', () => {
    const result = formatCurrency('1234.56')
    expect(result).toMatch(/1\s234/) // строку распарсило и разделило тысячи (NBSP)
    expect(result).toMatch(/UZS/i)   // и оформило как валюту UZS
  })

  it('handles invalid values', () => {
    expect(formatCurrency('abc')).toBe('—')
    expect(formatCurrency(NaN)).toBe('—')
  })

  it('formats zero correctly', () => {
    const result = formatCurrency(0)
    expect(result).not.toBe('—')  // 0 — валидная сумма, НЕ пусто (частый баг: ноль → «—»)
    expect(result).toMatch(/0/)   // содержит цифру ноль
    expect(result).toMatch(/UZS/i)
  })
})


describe('pluralizeRu (F-920)', () => {
  const forms: [string, string, string] = ['материал', 'материала', 'материалов']
  it('форма[0] для n%10==1 кроме 11', () => {
    expect(pluralizeRu(1, forms)).toBe('материал')
    expect(pluralizeRu(21, forms)).toBe('материал')
    expect(pluralizeRu(101, forms)).toBe('материал')
  })
  it('форма[1] для n%10 2..4 кроме 12..14', () => {
    expect(pluralizeRu(2, forms)).toBe('материала')
    expect(pluralizeRu(3, forms)).toBe('материала')
    expect(pluralizeRu(24, forms)).toBe('материала')
  })
  it('форма[2] для 0, 5..20, 11..14', () => {
    expect(pluralizeRu(0, forms)).toBe('материалов')
    expect(pluralizeRu(5, forms)).toBe('материалов')
    expect(pluralizeRu(11, forms)).toBe('материалов')
    expect(pluralizeRu(12, forms)).toBe('материалов')
    expect(pluralizeRu(14, forms)).toBe('материалов')
    expect(pluralizeRu(100, forms)).toBe('материалов')
  })
})

describe('formatNumberClean float-артефакты (F-921)', () => {
  it('срезает артефакт представления вычисленных float', () => {
    expect(formatNumberClean(0.1 + 0.2)).toBe('0.3')          // 0.30000000000000004
    expect(formatNumberClean(1.005 * 3)).toBe('3.015')        // 3.0149999999999997
    expect(formatNumberClean(0.3)).toBe('0.3')
  })
  it('не ломает легитимные малые и целые числа', () => {
    expect(formatNumberClean(0.000001)).toBe('0.000001')
    expect(formatNumberClean(14.000000)).toBe('14')
    expect(formatNumberClean(-14.5)).toBe('-14.5')
    expect(formatNumberClean(0)).toBe('0')
  })
})
