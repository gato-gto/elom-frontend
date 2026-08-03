import { describe, it, expect } from 'vitest'
import { computeEstimate, type CalcLine } from '@/utils/estimateCalc'

// Зеркало BE estimates/calc.py — числа ОБЯЗАНЫ совпадать с tests_coeff.py (тот же компаундинг/округление).
const work = (sec: string, sub: string, amt: number): CalcLine =>
  ({ kind: 'work', quantity: '1', unit_price: String(amt), section_name: sec, subcategory_name: sub })
const mat = (sec: string, amt: number): CalcLine =>
  ({ kind: 'material', quantity: '1', unit_price: String(amt), section_name: sec })
const coeff = (k: number, scope: string, name: string): CalcLine =>
  ({ kind: 'coefficient', quantity: '1', unit_price: String(k), coeff_scope: scope, coeff_scope_name: name })

describe('estimateCalc — зеркало BE calc.py (Фаза 1)', () => {
  it('раздел ×1.2 затем ×1.1 на тот же раздел → компаунд k1×k2 (== BE 960000)', () => {
    const lines = [
      work('Монтаж', 'Прокладка', 500000),
      mat('Монтаж', 300000),
      coeff(1.2, 'section', 'Монтаж'),
      coeff(1.1, 'section', 'Монтаж'),
    ]
    const { total, contributions } = computeEstimate(lines)
    expect(total).toBe(960000)        // работы 500k→600k→660k + материалы 300k
    expect(contributions[2]).toBe(100000)
    expect(contributions[3]).toBe(60000)  // компаунд на 600k
    expect(contributions[0]).toBeNull()
    expect(contributions[1]).toBeNull()
  })

  it('только работы: материал не тронут', () => {
    const { total, contributions } = computeEstimate([work('A', '', 100), mat('A', 100), coeff(2, 'all', '')])
    expect(total).toBe(300)           // работа 100→200 + материал 100
    expect(contributions[2]).toBe(100)
  })

  it('section изолирует по имени раздела', () => {
    const { total, contributions } = computeEstimate([work('A', '', 100), work('B', '', 100), coeff(1.5, 'section', 'A')])
    expect(total).toBe(250)
    expect(contributions[2]).toBe(50)
  })

  it('subcategory scope по имени подраздела', () => {
    const { total, contributions } = computeEstimate([work('A', 'S1', 100), work('A', 'S2', 100), coeff(1.5, 'subcategory', 'S1')])
    expect(total).toBe(250)
    expect(contributions[2]).toBe(50)
  })

  it('округление до целого сума (== BE 383)', () => {
    const { total, contributions } = computeEstimate([work('A', '', 333), coeff(1.15, 'all', '')])
    expect(total).toBe(383)           // round(382.95)
    expect(contributions[1]).toBe(50)
  })

  it("'' и 'selection' не применяются (Фаза 1)", () => {
    const { total, contributions } = computeEstimate([work('A', '', 100), coeff(2, '', ''), coeff(2, 'selection', '')])
    expect(total).toBe(100)
    expect(contributions[1]).toBeNull()
    expect(contributions[2]).toBeNull()
  })
})
