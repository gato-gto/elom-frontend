/**
 * F-1015 — нормализация числового ввода (владелец: «фронт воспринимал дробную и точкой, и запятой»).
 *
 * ЗЕРКАЛО BE-правила импорта (F-768 ⑤): запятая — ВСЕГДА десятичный разделитель («1,000» = 1.0,
 * не тысяча), пробелы/NBSP — разряды («6 000» = 6000). Мотив: iOS RU-клавиатура даёт запятую, а
 * parseFloat('2,5') = 2 — ТИХОЕ усечение дробной части (превью сумм врало без ошибки).
 * Использовать ПЕРЕД любым parseFloat/Number над строкой из пользовательского поля.
 */
export function normalizeDecimalInput(value: string): string {
  return value
    .replace(/[\s\u00A0\u202F]/g, '') // пробелы/NBSP/узкий NBSP — разряды
    .replace(',', '.')                // первая запятая — дробь (вторая сделает NaN — честная ошибка)
}

/**
 * F-1017 — select-on-focus: тап/клик в числовое поле выделяет всё значение → ввод перезаписывает
 * (владелец: «не пришлось удалять 0 или 1»). Работает и для полезных префиллов («1» в смете, цена
 * из каталога): значение видно, но не мешает.
 */
export function selectAllOnFocus(e: Event): void {
  const t = e.target
  if (t instanceof HTMLInputElement) { t.select() }
}

/** Парс строки/числа с нормализацией; пусто/мусор → NaN (дефолт решает вызывающий). */
export function parseDecimalInput(value: string | number | null | undefined): number {
  if (typeof value === 'number') { return value }
  if (value === null || value === undefined) { return NaN }
  const s = normalizeDecimalInput(String(value))
  // F-1074: только обычная десятичная запись. Number() принимал «0x1A» (26), «0b11», «1e400»/«Infinity»
  // (бесконечность роняла расчёт сметы через BigInt) — такие значения ввод не должен пропускать.
  if (!DECIMAL_RE.test(s)) { return NaN }
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

const DECIMAL_RE = /^[+-]?(\d+(\.\d*)?|\.\d+)$/
