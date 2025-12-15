/**
 * Тесты для форматтеров
 */

import { describe, it, expect } from 'vitest'
import { formatDate, formatTime, formatDateTime, formatCurrency, formatNumber } from '@/utils/formatters'

describe('Formatters', () => {
  describe('formatDate', () => {
    it('should format ISO date string', () => {
      const isoDate = '2024-01-15T14:30:00Z'
      const result = formatDate(isoDate)
      
      expect(result).toBe('15.01.2024')
    })

    it('should format Date object', () => {
      const date = new Date('2024-01-15T14:30:00Z')
      const result = formatDate(date)
      
      expect(result).toBe('15.01.2024')
    })

    it('should format date-only string', () => {
      const dateString = '2024-01-15'
      const result = formatDate(dateString)
      
      expect(result).toBe('15.01.2024')
    })

    it('should handle null input', () => {
      const result = formatDate(null)
      
      expect(result).toBe('—')
    })

    it('should handle undefined input', () => {
      const result = formatDate(undefined)
      
      expect(result).toBe('—')
    })

    it('should handle empty string', () => {
      const result = formatDate('')
      
      expect(result).toBe('—')
    })

    it('should handle invalid date', () => {
      const result = formatDate('invalid-date')
      
      expect(result).toBe('—')
    })

    it('should use custom format', () => {
      const date = '2024-01-15T14:30:00Z'
      const result = formatDate(date, 'yyyy-MM-dd')
      
      expect(result).toBe('2024-01-15')
    })

    it('should format different date patterns', () => {
      const testCases = [
        { input: '2024-01-01', expected: '01.01.2024' },
        { input: '2024-12-31', expected: '31.12.2024' },
        { input: '2024-02-29', expected: '29.02.2024' }, // Leap year
      ]

      testCases.forEach(({ input, expected }) => {
        expect(formatDate(input)).toBe(expected)
      })
    })
  })

  describe('formatTime', () => {
    it('should format ISO datetime to time', () => {
      const isoDate = '2024-01-15T14:30:00Z'
      const result = formatTime(isoDate)
      
      // Note: This might vary based on timezone
      expect(result).toMatch(/\d{2}:\d{2}/)
    })

    it('should format Date object to time', () => {
      const date = new Date('2024-01-15T14:30:00Z')
      const result = formatTime(date)
      
      expect(result).toMatch(/\d{2}:\d{2}/)
    })

    it('should handle null input', () => {
      const result = formatTime(null)
      
      expect(result).toBe('—')
    })

    it('should handle invalid time', () => {
      const result = formatTime('invalid-time')
      
      expect(result).toBe('—')
    })

    it('should format with seconds', () => {
      const date = '2024-01-15T14:30:45Z'
      const result = formatTime(date, true)
      
      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('formatDateTime', () => {
    it('should format ISO datetime', () => {
      const isoDate = '2024-01-15T14:30:00Z'
      const result = formatDateTime(isoDate)
      
      expect(result).toMatch(/15\.01\.2024 \d{2}:\d{2}/)
    })

    it('should handle null input', () => {
      const result = formatDateTime(null)
      
      expect(result).toBe('—')
    })

    it('should handle invalid datetime', () => {
      const result = formatDateTime('invalid-datetime')
      
      expect(result).toBe('—')
    })

    it('should format with custom separator', () => {
      const date = '2024-01-15T14:30:00Z'
      const result = formatDateTime(date, ' в ')
      
      expect(result).toMatch(/15\.01\.2024 в \d{2}:\d{2}/)
    })

    it('should format with seconds', () => {
      const date = '2024-01-15T14:30:45Z'
      const result = formatDateTime(date, ' ', true)
      
      expect(result).toMatch(/15\.01\.2024 \d{2}:\d{2}:\d{2}/)
    })
  })

  describe('formatCurrency', () => {
    it('should format number as currency', () => {
      const result = formatCurrency(1234.56)
      
      expect(result).toBe('1 234,56 ₽')
    })

    it('should format string number', () => {
      const result = formatCurrency('1234.56')
      
      expect(result).toBe('1 234,56 ₽')
    })

    it('should format zero', () => {
      const result = formatCurrency(0)
      
      expect(result).toBe('0,00 ₽')
    })

    it('should format negative number', () => {
      const result = formatCurrency(-1234.56)
      
      expect(result).toBe('-1 234,56 ₽')
    })

    it('should handle large numbers', () => {
      const result = formatCurrency(1234567.89)
      
      expect(result).toBe('1 234 567,89 ₽')
    })

    it('should handle very small numbers', () => {
      const result = formatCurrency(0.01)
      
      expect(result).toBe('0,01 ₽')
    })

    it('should handle null', () => {
      const result = formatCurrency(null)
      
      expect(result).toBe('0,00 ₽')
    })

    it('should handle undefined', () => {
      const result = formatCurrency(undefined)
      
      expect(result).toBe('0,00 ₽')
    })

    it('should use custom currency', () => {
      const result = formatCurrency(1234.56, 'USD', '$')
      
      expect(result).toBe('$1,234.56')
    })

    it('should format with different decimal places', () => {
      const result = formatCurrency(1234.5678, 'RUB', '₽', 4)
      
      expect(result).toBe('1 234,5678 ₽')
    })
  })

  describe('formatNumber', () => {
    it('should format integer', () => {
      const result = formatNumber(1234)
      
      expect(result).toBe('1 234')
    })

    it('should format decimal number', () => {
      const result = formatNumber(1234.56)
      
      expect(result).toBe('1 234,56')
    })

    it('should format with custom decimal places', () => {
      const result = formatNumber(1234.5678, 3)
      
      expect(result).toBe('1 234,568')
    })

    it('should format zero', () => {
      const result = formatNumber(0)
      
      expect(result).toBe('0')
    })

    it('should format negative number', () => {
      const result = formatNumber(-1234.56)
      
      expect(result).toBe('-1 234,56')
    })

    it('should handle string input', () => {
      const result = formatNumber('1234.56')
      
      expect(result).toBe('1 234,56')
    })

    it('should handle null', () => {
      const result = formatNumber(null)
      
      expect(result).toBe('0')
    })

    it('should handle undefined', () => {
      const result = formatNumber(undefined)
      
      expect(result).toBe('0')
    })

    it('should handle very large numbers', () => {
      const result = formatNumber(1234567890.123)
      
      expect(result).toBe('1 234 567 890,12')
    })

    it('should handle very small numbers', () => {
      const result = formatNumber(0.000123, 6)
      
      expect(result).toBe('0,000123')
    })

    it('should round correctly', () => {
      const testCases = [
        { input: 1.234, decimals: 2, expected: '1,23' },
        { input: 1.235, decimals: 2, expected: '1,24' }, // Banker's rounding might vary
        { input: 1.999, decimals: 2, expected: '2,00' }
      ]

      testCases.forEach(({ input, decimals, expected }) => {
        const result = formatNumber(input, decimals)
        expect(result).toBe(expected)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle Infinity values', () => {
      expect(formatNumber(Infinity)).toBe('∞')
      expect(formatNumber(-Infinity)).toBe('-∞')
      expect(formatCurrency(Infinity)).toBe('∞ ₽')
    })

    it('should handle NaN values', () => {
      expect(formatNumber(NaN)).toBe('—')
      expect(formatCurrency(NaN)).toBe('— ₽')
    })

    it('should handle very long decimal precision', () => {
      const result = formatNumber(1/3, 10)
      
      expect(result).toBe('0,3333333333')
    })

    it('should handle scientific notation', () => {
      const result = formatNumber(1e6)
      
      expect(result).toBe('1 000 000')
    })

    it('should handle negative zero', () => {
      const result = formatNumber(-0)
      
      expect(result).toBe('0')
    })
  })

  describe('Localization', () => {
    it('should format according to Russian locale', () => {
      const number = 1234567.89
      const result = formatNumber(number)
      
      // Russian locale uses space as thousands separator and comma as decimal separator
      expect(result).toBe('1 234 567,89')
    })

    it('should format currency according to Russian locale', () => {
      const amount = 1234567.89
      const result = formatCurrency(amount)
      
      expect(result).toBe('1 234 567,89 ₽')
    })

    it('should format dates according to Russian locale', () => {
      const date = '2024-01-15'
      const result = formatDate(date)
      
      // DD.MM.YYYY format
      expect(result).toBe('15.01.2024')
    })
  })
})

