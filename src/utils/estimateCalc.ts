// Зеркало BE estimates/calc.py (#65 Фаза 1). ОБЯЗАНО совпадать с сервером по КАЖДОЙ цифре.
// N1 (аудит): округление — ДЕСЯТИЧНОЕ HALF_UP через целочисленную (BigInt) арифметику, а НЕ Math.round
// над float64 (float даёт X.4999… на точных X.5 → расходилось с Decimal ROUND_HALF_UP на ±1). qty ≤3 знака,
// цена/множитель ≤2 знака → масштабируем в целые и делим HALF_UP. См. COEFFICIENT_DESIGN.md.

export interface CalcLine {
  kind: string
  quantity: number | string
  unit_price: number | string
  section_name?: string
  subcategory_name?: string
  coeff_scope?: string
  coeff_scope_name?: string
  coeff_scope_section?: string
  uid?: string
  coeff_targets?: string[]
}

const SCOPES_ACTIVE = new Set(['all', 'section', 'subcategory', 'selection']) // Фаза 1 + Фаза 2 (selection)

// Точное целое из десятичного с ≤ log10(scale) знаками (float-ошибка *scale < 0.5 → Math.round точен).
function scaledInt(v: number | string | undefined, scale: number): number {
  const n = typeof v === 'number' ? v : parseFloat((v as string) || '0')
  return isNaN(n) ? 0 : Math.round(n * scale)
}

// HALF_UP(numer/denom) для целых BigInt — точное совпадение с Python Decimal.quantize(ROUND_HALF_UP).
function halfUpBig(numer: bigint, denom: bigint): number {
  const neg = numer < 0n
  const num = neg ? -numer : numer
  const q = num / denom
  const rem = num % denom
  const r = rem * 2n >= denom ? q + 1n : q
  return Number(neg ? -r : r)
}

// база строки = HALF_UP(qty × price); qty ≤3 знака, price ≤2 знака.
function baseAmount(qty: number | string, price: number | string): number {
  const qi = BigInt(scaledInt(qty, 1000))
  const pi = BigInt(scaledInt(price, 100))
  return halfUpBig(qi * pi, 100000n)
}

// шаг коэффициента = HALF_UP(before × k); before — целый сум, k ≤2 знака.
function applyK(before: number, k: number | string): number {
  const ki = BigInt(scaledInt(k, 100))
  return halfUpBig(BigInt(before) * ki, 100n)
}

function num(v: number | string | undefined): number {
  const n = typeof v === 'number' ? v : parseFloat((v as string) || '0')
  return isNaN(n) ? 0 : n
}

/**
 * { total, contributions } — contributions[i] выровнен с lines: вклад применённого коэффициента или null.
 * Порядок lines = порядок отображения (== BE Meta order,id). Числа — целый сум.
 */
export function computeEstimate(lines: CalcLine[]): { total: number, contributions: (number | null)[] } {
  const n = lines.length
  const contributions: (number | null)[] = new Array(n).fill(null)
  const eff: Record<number, number> = {}
  let baseNonwork = 0
  const workIdx: number[] = []

  lines.forEach((ln, i) => {
    if (ln.kind === 'coefficient') { return }
    const amt = baseAmount(ln.quantity, ln.unit_price)
    if (ln.kind === 'work') { eff[i] = amt; workIdx.push(i) } else { baseNonwork += amt }
  })

  lines.forEach((ln, i) => {
    if (ln.kind !== 'coefficient') { return }
    const scope = ln.coeff_scope || ''
    if (!SCOPES_ACTIVE.has(scope)) { return }
    const k = num(ln.unit_price)
    // M1 (аудит): множитель ≤ 0 (каталожный default_price=None→0) — no-op, иначе обнулил бы работы зоны.
    if (k <= 0) { return }
    const name = ln.coeff_scope_name || ''
    const section = ln.coeff_scope_section || ''
    // Фаза 2 (selection): целевые work по стабильному uid из coeff_targets.
    const targets = scope === 'selection' ? new Set(ln.coeff_targets || []) : null
    let contrib = 0
    for (const wi of workIdx) {
      const w = lines[wi]
      const wSec = w.section_name || ''
      const wSub = w.subcategory_name || ''
      // M4 (аудит): подраздел квалифицируем РАЗДЕЛОМ («Общие» есть в 5 разделах).
      const hit = scope === 'all'
        || (scope === 'section' && wSec === name)
        || (scope === 'subcategory' && wSec === section && wSub === name)
        || (scope === 'selection' && !!w.uid && targets!.has(w.uid))
      if (!hit) { continue }
      const before = eff[wi]
      const after = applyK(before, ln.unit_price)
      contrib += (after - before)
      eff[wi] = after
    }
    contributions[i] = contrib
  })

  let total = baseNonwork
  for (const wi of workIdx) { total += eff[wi] }
  return { total, contributions }
}
