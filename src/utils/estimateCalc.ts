// Зеркало BE estimates/calc.py (#65 Фаза 1). ОБЯЗАНО совпадать с сервером: та же последовательность
// (коэффициенты по возрастанию порядка), то же округление до целого сума на каждом шаге, вклад =
// new_eff − eff_before. Иначе live-превью формы разойдётся с сохранённой сметой. См. COEFFICIENT_DESIGN.md.

export interface CalcLine {
  kind: string
  quantity: number | string
  unit_price: number | string
  section_name?: string
  subcategory_name?: string
  coeff_scope?: string
  coeff_scope_name?: string
}

const SCOPES_ACTIVE = new Set(['all', 'section', 'subcategory']) // Фаза 1; '' и 'selection' не применяются

function num(v: number | string | undefined): number {
  const n = typeof v === 'number' ? v : parseFloat((v as string) || '0')
  return isNaN(n) ? 0 : n
}

// целый сум; Math.round == Python Decimal ROUND_HALF_UP для неотрицательных (eff, k ≥ 0)
function roundSum(v: number): number { return Math.round(v) }

/**
 * Возвращает { total, contributions } — contributions[i] выровнен с lines: число (вклад применённого
 * коэффициента) или null (не-коэффициент / не-применённый коэффициент). Порядок lines = порядок отображения.
 */
export function computeEstimate(lines: CalcLine[]): { total: number, contributions: (number | null)[] } {
  const n = lines.length
  const contributions: (number | null)[] = new Array(n).fill(null)
  const eff: Record<number, number> = {}
  let baseNonwork = 0
  const workIdx: number[] = []

  lines.forEach((ln, i) => {
    if (ln.kind === 'coefficient') { return }
    const amt = roundSum(num(ln.quantity) * num(ln.unit_price))
    if (ln.kind === 'work') { eff[i] = amt; workIdx.push(i) } else { baseNonwork += amt }
  })

  lines.forEach((ln, i) => {
    if (ln.kind !== 'coefficient') { return }
    const scope = ln.coeff_scope || ''
    if (!SCOPES_ACTIVE.has(scope)) { return }
    const k = num(ln.unit_price)
    const name = ln.coeff_scope_name || ''
    let contrib = 0
    for (const wi of workIdx) {
      const w = lines[wi]
      const hit = scope === 'all'
        || (scope === 'section' && (w.section_name || '') === name)
        || (scope === 'subcategory' && (w.subcategory_name || '') === name)
      if (!hit) { continue }
      const before = eff[wi]
      const after = roundSum(before * k)
      contrib += (after - before)
      eff[wi] = after
    }
    contributions[i] = contrib
  })

  let total = baseNonwork
  for (const wi of workIdx) { total += eff[wi] }
  return { total, contributions }
}
