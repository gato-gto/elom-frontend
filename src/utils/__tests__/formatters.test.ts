import { describe, it, expect } from 'vitest'
import { formatNumberClean, formatQuantity } from '../formatters'

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
    expect(formatNumberClean(0.0000001)).toBe('1e-7') // Scientific notation for very small numbers
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

