// F-1142 · НДС в форме закупки (владелец 28.11): «с НДС или без — по галочке, пересчитать, в отдельной колонке
// показать сколько НДС; по умолчанию считаем с НДС, но НДС в системе пока не указываем».
//
// Храним, как и раньше, только цену С НДС (поле price). Ставка и галочка — помощник ввода, в БД не пишутся.
// Как в 1С («Цена включает НДС»): галочка снята — НДС выделяется из суммы (сумма × r/(100+r)); галочка «цены без
// НДС» — вводится цена без НДС, цена с НДС = цена × (100+r)/100. Округление — до тийина, ДЕСЯТИЧНОЕ HALF_UP на
// целых (BigInt), как в estimateCalc.ts и Python Decimal: float давал бы X.4999… на точных X.5.
import { normalizeDecimalInput } from '@/utils/numberInput'

export const VAT_RATES = [12, 6, 0] as const          // Узбекистан: основная 12 %, упрощённый НДС 6 % (с 01.06.2026)
export type VatRate = (typeof VAT_RATES)[number]
export const DEFAULT_VAT_RATE: VatRate = 12

// Точное десятичное без float (ревью-32 MED-2: Math.round(n × 100) давал двойное округление на 3+ знаках —
// 1.005 → 100.4999…): строка «целое.дробь» → (num, exp), значение = num / 10^exp. null — не число (пусто, «abc»,
// «1.000,50», «1e3», Infinity). Запятая-дробь и разряды — как у формы (normalizeDecimalInput).
interface Exact { num: bigint; exp: number }
function exact(v: number | string | null | undefined): Exact | null {
  if (v === null || v === undefined) { return null }
  if (typeof v === 'number' && !Number.isFinite(v)) { return null }
  const s = normalizeDecimalInput(String(v))
  const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(s)
  if (!m || (m[2] === '' && (m[3] ?? '') === '')) { return null }
  const frac = m[3] ?? ''
  const num = BigInt((m[2] || '0') + frac)
  return { num: m[1] === '-' ? -num : num, exp: frac.length }
}
const pow10 = (e: number) => 10n ** BigInt(e)

// HALF_UP(numer/denom) для целых, знак учитывается (отрицательных цен форма не пропускает, но расчёт честный).
function halfUp(numer: bigint, denom: bigint): bigint {
  const neg = numer < 0n
  const num = neg ? -numer : numer
  const q = num / denom
  const r = (num % denom) * 2n >= denom ? q + 1n : q
  return neg ? -r : r
}

function tiyinToString(t: bigint): string {
  const neg = t < 0n
  const a = neg ? -t : t
  const s = `${a / 100n}.${String(a % 100n).padStart(2, '0')}`
  return neg ? `-${s}` : s
}

/** Цена с НДС из цены без НДС (любое число знаков): HALF_UP(net × (100+r)/100) до тийина. '' — если не число. */
export function netToGrossPrice(net: number | string | null | undefined, rate: number): string {
  const n = exact(net)
  if (n === null) { return '' }
  // тийины = net × 100 × (100+r)/100 = num × (100+r) / 10^exp
  return tiyinToString(halfUp(n.num * (100n + BigInt(rate)), pow10(n.exp)))
}

/** Цена без НДС из цены с НДС: HALF_UP(gross × 100/(100+r)) до тийина. '' — если не число. */
export function grossToNetPrice(gross: number | string | null | undefined, rate: number): string {
  const g = exact(gross)
  if (g === null) { return '' }
  // тийины = gross × 100 × 100/(100+r) = num × 10^4 / ((100+r) × 10^exp)
  return tiyinToString(halfUp(g.num * 10000n, (100n + BigInt(rate)) * pow10(g.exp)))
}

/** НДС, входящий в сумму строки, в тийинах: HALF_UP(qty × price × 100 × r/(100+r)) — сумма точная, как на сервере. */
function lineVatTiyin(qty: number | string | null | undefined, priceGross: number | string | null | undefined,
  rate: number): bigint {
  const q = exact(qty)
  const p = exact(priceGross)
  if (q === null || p === null || rate === 0) { return 0n }
  const r = BigInt(rate)
  return halfUp(q.num * p.num * 100n * r, (100n + r) * pow10(q.exp + p.exp))
}

/** НДС, входящий в сумму строки (сумма × r/(100+r)), в сумах с 2 знаками; 0 — при ставке 0 или нечисловом вводе.
 *  Number точен до 2^53 тийинов (~90 трлн сум на закупку) — для показа хватает (ревью-32 р2, принято). */
export function lineVatIncluded(qty: number | string | null | undefined, priceGross: number | string | null | undefined,
  rate: number): number {
  return Number(lineVatTiyin(qty, priceGross, rate)) / 100
}

/** НДС по закупке — сумма построчно округлённых НДС (как в счёте-фактуре и 1С), в сумах с 2 знаками. */
export function totalVatIncluded(items: Array<{ quantity: number | string | null | undefined; price: number | string | null | undefined }>,
  rate: number): number {
  return Number(items.reduce((t, it) => t + lineVatTiyin(it.quantity, it.price, rate), 0n)) / 100
}

/** Не пустая строка, которая не разбирается как число (для проверки формы: мусор не должен стать ценой 0). */
export function isInvalidDecimal(v: number | string | null | undefined): boolean {
  return v !== null && v !== undefined && String(v).trim() !== '' && exact(v) === null
}
