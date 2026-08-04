import { describe, it, expect } from 'vitest'
import { computeEstimate, type CalcLine } from '@/utils/estimateCalc'
import cases from './parity_cases.json'

// Property-паритет BE↔FE: 800 случайных смет сгенерены + посчитаны BE estimates/calc.py
// (scratchpad/gen_parity.py, seed 20260804). Здесь FE computeEstimate обязан выдать ТЕ ЖЕ total и
// contributions на каждом входе — иначе live-превью формы разойдётся с сохранённой сметой.
type Case = { lines: CalcLine[]; total: number; contributions: (number | null)[] }

describe('BE↔FE property-паритет (800 случайных смет)', () => {
  it('total и contributions FE == BE на КАЖДОМ входе', () => {
    let mismatches = 0
    let checked = 0
    for (let ci = 0; ci < (cases as Case[]).length; ci++) {
      const c = (cases as Case[])[ci]
      const { total, contributions } = computeEstimate(c.lines)
      if (total !== c.total) { mismatches++; expect(total, `case ${ci} total`).toBe(c.total) }
      expect(contributions.length, `case ${ci} len`).toBe(c.contributions.length)
      for (let i = 0; i < contributions.length; i++) {
        if (contributions[i] !== c.contributions[i]) {
          mismatches++
          expect(contributions[i], `case ${ci} contrib[${i}]`).toBe(c.contributions[i])
        }
      }
      checked++
    }
    expect(mismatches).toBe(0)
    expect(checked).toBe(800)
  })
})
