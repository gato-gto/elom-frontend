/**
 * F-1015 — нормализация числового ввода (зеркало BE F-768 ⑤: запятая = дробь, пробелы/NBSP = разряды).
 * Мотив: parseFloat('2,5') = 2 — ТИХОЕ усечение дробной части (iOS RU-клавиатура даёт запятую).
 */
import { describe, it, expect } from 'vitest'
import { normalizeDecimalInput, parseDecimalInput } from '@/utils/numberInput'

describe('normalizeDecimalInput (F-1015, зеркало BE F-768 ⑤)', () => {
  it('запятая — десятичный разделитель', () => {
    expect(normalizeDecimalInput('2,5')).toBe('2.5')
    expect(normalizeDecimalInput('1000,50')).toBe('1000.50')
  })
  it('«1,000» — это 1.0, НЕ тысяча (правило BE: запятая всегда дробь)', () => {
    expect(normalizeDecimalInput('1,000')).toBe('1.000')
  })
  it('пробелы и NBSP — разряды, вычищаются', () => {
    expect(normalizeDecimalInput('6 000')).toBe('6000')
    expect(normalizeDecimalInput('6 000,25')).toBe('6000.25')
  })
  it('обычные значения и края не трогаются', () => {
    expect(normalizeDecimalInput('2.5')).toBe('2.5')
    expect(normalizeDecimalInput('')).toBe('')
    expect(normalizeDecimalInput('-1,5')).toBe('-1.5')
    expect(normalizeDecimalInput('  7 ')).toBe('7')
  })
})

describe('parseDecimalInput', () => {
  it('парсит запятую как дробь (parseFloat давал бы 2)', () => {
    expect(parseDecimalInput('2,5')).toBe(2.5)
  })
  it('пусто/мусор → NaN (не 0 — вызывающий сам решает про дефолт)', () => {
    expect(Number.isNaN(parseDecimalInput(''))).toBe(true)
    expect(Number.isNaN(parseDecimalInput('abc'))).toBe(true)
  })
  it('число проходит как есть', () => {
    expect(parseDecimalInput(7)).toBe(7)
  })
})

describe('F-1074: parseDecimalInput — только десятичная запись, конечное число', () => {
  it('нормальные варианты разбираются', () => {
    expect(parseDecimalInput('1 000,5')).toBe(1000.5)
    expect(parseDecimalInput('0,5')).toBe(0.5)
    expect(parseDecimalInput('.5')).toBe(0.5)
    expect(parseDecimalInput('1.')).toBe(1)
    expect(parseDecimalInput('-2,25')).toBe(-2.25)
    expect(parseDecimalInput('+3')).toBe(3)
  })
  it('шестнадцатеричные, двоичные, экспонента и бесконечность — NaN (иначе 0x1A = 26, Infinity ронял смету)', () => {
    for (const v of ['0x1A', '0b11', '1e3', '1e400', 'Infinity', '-Infinity', '1,500,000', '1.2.3', 'abc']) {
      expect(Number.isNaN(parseDecimalInput(v)), v).toBe(true)
    }
  })
})

describe('F-1074: расчёт сметы разбирает числа так же строго, как форма', () => {
  it('«1.250.5» и бесконечность не превращаются в число', async () => {
    const { baseAmount } = await import('@/utils/estimateCalc')
    expect(baseAmount('1.250.5', '100')).toBe(0)
    expect(baseAmount('2', 'Infinity')).toBe(0)
    expect(baseAmount('1 000,5', '2')).toBe(2001)
  })
})
