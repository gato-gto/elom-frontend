import { describe, it, expect } from 'vitest'
import { computeEstimate, type CalcLine } from '@/utils/estimateCalc'

// Зеркало BE estimates/calc.py — числа ОБЯЗАНЫ совпадать с tests_coeff.py (тот же компаундинг/округление).
const work = (sec: string, sub: string, amt: number): CalcLine =>
  ({ kind: 'work', quantity: '1', unit_price: String(amt), section_name: sec, subcategory_name: sub })
const mat = (sec: string, amt: number): CalcLine =>
  ({ kind: 'material', quantity: '1', unit_price: String(amt), section_name: sec })
const coeff = (k: number, scope: string, name: string, section = ''): CalcLine =>
  ({ kind: 'coefficient', quantity: '1', unit_price: String(k), coeff_scope: scope, coeff_scope_name: name, coeff_scope_section: section })

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

  it('subcategory scope по имени подраздела (квалиф. разделом)', () => {
    const { total, contributions } = computeEstimate([work('A', 'S1', 100), work('A', 'S2', 100), coeff(1.5, 'subcategory', 'S1', 'A')])
    expect(total).toBe(250)
    expect(contributions[2]).toBe(50)
  })

  it('M4: коллизия «Общие» в 2 разделах → зона бьёт только по своему разделу (== BE)', () => {
    const { total, contributions } = computeEstimate([
      work('Разд1', 'Общие', 100), work('Разд2', 'Общие', 200), coeff(1.5, 'subcategory', 'Общие', 'Разд1')])
    expect(contributions[2]).toBe(50)   // только Разд1, НЕ 150
    expect(total).toBe(350)
  })

  it('Фаза 2 selection: коэффициент бьёт только по выбранным uid (== BE)', () => {
    const lines: CalcLine[] = [
      { kind: 'work', quantity: '1', unit_price: '100', section_name: 'A', uid: 'u1' },
      { kind: 'work', quantity: '1', unit_price: '200', section_name: 'A', uid: 'u2' },
      { kind: 'work', quantity: '1', unit_price: '400', section_name: 'A', uid: 'u3' },
      { kind: 'coefficient', quantity: '1', unit_price: '1.5', coeff_scope: 'selection', coeff_targets: ['u1', 'u3'] },
    ]
    const { total, contributions } = computeEstimate(lines)
    expect(contributions[3]).toBe(250)   // (100+400)*0.5
    expect(total).toBe(950)              // 150+200+600
  })

  it('F2-3: пустой uid работы НЕ матчится в selection даже при "" в targets (== BE)', () => {
    const lines: CalcLine[] = [
      { kind: 'work', quantity: '1', unit_price: '100', section_name: 'A', uid: '' },
      { kind: 'coefficient', quantity: '1', unit_price: '1.5', coeff_scope: 'selection', coeff_targets: [''] },
    ]
    const { total, contributions } = computeEstimate(lines)
    expect(total).toBe(100)
    expect(contributions[1]).toBe(0)
  })

  it('F2-7: selection поверх section компаундится ×1.2×1.1 (== BE)', () => {
    const lines: CalcLine[] = [
      { kind: 'work', quantity: '1', unit_price: '100000', section_name: 'Монтаж', uid: 'w1' },
      { kind: 'coefficient', quantity: '1', unit_price: '1.2', coeff_scope: 'section', coeff_scope_name: 'Монтаж' },
      { kind: 'coefficient', quantity: '1', unit_price: '1.1', coeff_scope: 'selection', coeff_targets: ['w1'] },
    ]
    const { total, contributions } = computeEstimate(lines)
    expect(contributions[1]).toBe(20000)
    expect(contributions[2]).toBe(12000)
    expect(total).toBe(132000)
  })

  it('M1: множитель ≤0 (каталожный null→0) — no-op, работы не обнуляются', () => {
    const { total, contributions } = computeEstimate([work('A', '', 500000), coeff(0, 'section', 'A')])
    expect(total).toBe(500000)
    expect(contributions[1]).toBeNull()
  })

  it('N1 паритет BE↔FE: десятичное HALF_UP на точных .5 (== Python Decimal)', () => {
    // база .5: 0.7×45 = 31.5 → 32 (Math.round(float) давал 31)
    expect(computeEstimate([work('A', '', 0)].map(() => ({ kind: 'work', quantity: '0.7', unit_price: '45' })) as CalcLine[]).total).toBe(32)
    // шаг коэффициента .5: 50×1.15=57.5→58; 210×1.15=241.5→242; 90×1.15=103.5→104
    const cases: [number, number, number][] = [[50, 1.15, 58], [210, 1.15, 242], [90, 1.15, 104], [170, 1.15, 196]]
    for (const [base, k, expected] of cases) {
      const { total } = computeEstimate([
        { kind: 'work', quantity: '1', unit_price: String(base), section_name: 'A' },
        coeff(k, 'section', 'A'),
      ])
      expect(total, `${base}×${k}`).toBe(expected)
    }
  })

  it('округление до целого сума (== BE 383)', () => {
    const { total, contributions } = computeEstimate([work('A', '', 333), coeff(1.15, 'all', '')])
    expect(total).toBe(383)           // round(382.95)
    expect(contributions[1]).toBe(50)
  })

  it("'' (нет зоны) не применяется", () => {
    const { total, contributions } = computeEstimate([work('A', '', 100), coeff(2, '', '')])
    expect(total).toBe(100)
    expect(contributions[1]).toBeNull()
  })

  it('Т5-пин (аудит#3): коэффициент РАНЬШЕ работ в списке всё равно применяется (== BE 180000)', () => {
    // Все прежние вектора держали коэффициенты последними — стриминг-однопроходная регрессия прошла бы
    // незамеченной. Зеркало BE tests_coeff.test_coefficient_before_works_still_applies.
    const w1: CalcLine = { ...work('Монтаж', 'Прокладка', 100000), uid: 'w1' }
    const sel: CalcLine = { ...coeff(1.5, 'selection', ''), coeff_targets: ['w1'] }
    const { total, contributions } = computeEstimate([coeff(1.2, 'all', ''), w1, sel])
    expect(contributions[0]).toBe(20000)   // 100000×1.2 (коэфф ДО работы)
    expect(contributions[2]).toBe(60000)   // 120000×1.5 (компаунд)
    expect(contributions[1]).toBeNull()
    expect(total).toBe(180000)
  })
})
