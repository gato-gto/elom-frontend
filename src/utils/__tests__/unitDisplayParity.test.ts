// F-1100 (ответ владельца 10): на экранах одно правило укрупнения — «только точные значения».
// Таблица unit_display_cases.json посчитана руками и проверяется ещё и сервером
// (common/tests_f1100_unit_display_parity.py, get_best_unit) — фронт и сервер не могут разойтись.
import { describe, it, expect } from 'vitest'
import { smartConvert, formatSmartQuantity } from '@/utils/unitRounding'
import { formatNumberWithOptions } from '@/utils/formatters'
import cases from './unit_display_cases.json'

type Case = { value: string; unit: string; expect: [string, string]; why: string }

describe('F-1100 · одно правило укрупнения (сервер = фронт)', () => {
  it('smartConvert совпадает с общей таблицей на каждом примере', () => {
    const wrong: string[] = []
    for (const c of cases as Case[]) {
      const r = smartConvert(parseFloat(c.value), c.unit)
      if (r.value !== parseFloat(c.expect[0]) || r.unit !== c.expect[1]) {
        wrong.push(`${c.value} ${c.unit} → ${r.value} ${r.unit}, ждали ${c.expect.join(' ')} (${c.why})`)
      }
    }
    expect(wrong).toEqual([])
    expect((cases as Case[]).length).toBeGreaterThanOrEqual(26)
  })

  it('строка с сервера «1500.000000» м → «1 500 м», не «1,5 км»', () => {
    expect(formatSmartQuantity('1500.000000', 'м')).toBe(`${formatNumberWithOptions(1500, { minimumFractionDigits: 0, maximumFractionDigits: 6 })} м`)
  })

  it('строка с сервера «3000.000000» л → «3 м³»', () => {
    expect(formatSmartQuantity('3000.000000', 'л')).toBe('3 м³')
  })
})
