import { describe, it, expect } from 'vitest'
import { calculateItemAmount, calculatePurchaseTotal, formatCurrency, formatNumber } from '../calculations'

describe('calculations utilities', () => {
  describe('calculateItemAmount', () => {
    it('multiplies numeric quantity and price', () => {
      expect(calculateItemAmount(2, 5)).toBe(10)
    })

    it('parses string inputs', () => {
      expect(calculateItemAmount('2.5', '3.2')).toBeCloseTo(8.0, 6)
    })

    it('returns 0 for NaN inputs', () => {
      // @ts-expect-error intentionally wrong input
      expect(calculateItemAmount('x', 3)).toBe(0)
      // @ts-expect-error intentionally wrong input
      expect(calculateItemAmount(2, 'y')).toBe(0)
    })
  })

  describe('calculatePurchaseTotal', () => {
    it('sums amounts across items', () => {
      const items = [
        { quantity: 2, price: 5 },
        { quantity: '1.5', price: '4' },
        { quantity: 'x', price: 10 }, // invalid -> 0
      ]
      expect(calculatePurchaseTotal(items)).toBeCloseTo(2 * 5 + 1.5 * 4, 6)
    })
  })

  describe('formatCurrency', () => {
    it('formats number as currency (RUB by default)', () => {
      const s = formatCurrency(1234.5)
      // Examples: "1 234,50 ₽" depending on environment locale symbols
      expect(s).toMatch(/1[\s\u00A0]234[,\.]50/)
    })

    it('supports different currency code', () => {
      const s = formatCurrency(99.9, 'USD')
      expect(s).toMatch(/99[,\.]90/)
    })
  })

  describe('formatNumber', () => {
    it('formats number with default 2 decimals', () => {
      expect(formatNumber(12.3456)).toMatch(/12[,\.]35/)
    })

    it('formats number with custom decimals', () => {
      expect(formatNumber(12.3456, 3)).toMatch(/12[,\.]346/)
    })
  })
})


