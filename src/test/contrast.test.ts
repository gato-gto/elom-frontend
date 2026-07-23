/**
 * F-312 — КЛАСС-СТРАЖ контраста токенов (WCAG AA).
 *
 * Читает РЕАЛЬНЫЕ значения токенов из src/assets/tailwind.css (короткие --bc/--b1/--tx-2/…
 * из :root и :root.dark) и проверяет контраст ключевых пар «фон↔текст» в ОБЕИХ темах.
 * Если кто-то поменяет токен так, что текст станет нечитаемым (как было с полупрозрачным
 * base-content: /60=4.09:1 в светлой), тест упадёт. Цели: обычный текст ≥4.5:1,
 * не-текст (фокус/граница) ≥3:1.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// vitest cwd = корень проекта; читаем реальный источник токенов.
const css = readFileSync(resolve(process.cwd(), 'src/assets/tailwind.css'), 'utf8')

/** Достаём переменные `--name: H S% L%;` из блока селектора (:root / :root.dark). */
function tokens(selector: string): Record<string, [number, number, number]> {
  // берём первый блок, начинающийся ровно с этого селектора и `{`
  const re = new RegExp(selector.replace('.', '\\.') + '\\s*\\{([\\s\\S]*?)\\}', 'm')
  const body = css.match(re)?.[1] ?? ''
  const out: Record<string, [number, number, number]> = {}
  for (const m of body.matchAll(/--([\w-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*;/g)) {
    out['--' + m[1]] = [parseFloat(m[2]), parseFloat(m[3]), parseFloat(m[4])]
  }
  return out
}

function hslToRgb([h, s, l]: [number, number, number]): [number, number, number] {
  s /= 100; l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return [f(0) * 255, f(8) * 255, f(4) * 255]
}
function relLum([r, g, b]: [number, number, number]): number {
  const c = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  const [R, G, B] = [c(r), c(g), c(b)]
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}
function contrast(fg: [number, number, number], bg: [number, number, number]): number {
  const L1 = relLum(fg), L2 = relLum(bg)
  const hi = Math.max(L1, L2), lo = Math.min(L1, L2)
  return (hi + 0.05) / (lo + 0.05)
}
const ratio = (t: Record<string, [number, number, number]>, fg: string, bg: string) =>
  contrast(hslToRgb(t[fg]), hslToRgb(t[bg]))

const THEMES = { light: tokens(':root'), dark: tokens(':root.dark') }
// Статусные цвета живут в @theme (триплеты --color-*); нужны для проверки текста бейджей.
const STATUS = { light: tokens('@theme'), dark: tokens('@theme dark') }

describe.each(Object.entries(THEMES))('token contrast — %s theme (WCAG AA)', (name, t) => {
  it('токены присутствуют', () => {
    for (const k of ['--bc', '--tx-2', '--tx-3', '--b1', '--b2', '--b3', '--p', '--pc'] as const) {
      expect(t[k], `${k} должен быть определён в ${name}`).toBeDefined()
    }
  })

  // Основной/вторичный/третичный текст на обеих поверхностях (base-100 и base-200) — ≥4.5:1.
  it.each([
    ['--bc', 'основной текст'],
    ['--tx-2', 'вторичный текст (метки/мета)'],
    ['--tx-3', 'третичный текст (приглушённый)'],
  ] as const)('%s (%s) читаем на base-100 и base-200', (fg) => {
    expect(ratio(t, fg, '--b1')).toBeGreaterThanOrEqual(4.5)
    expect(ratio(t, fg, '--b2')).toBeGreaterThanOrEqual(4.5)
  })

  it('текст кнопки primary (--pc на --p) ≥ 4.5:1', () => {
    expect(ratio(t, '--pc', '--p')).toBeGreaterThanOrEqual(4.5)
  })

  it('фокус-кольцо (--p на base-100) видно, ≥ 3:1 (не-текст)', () => {
    expect(ratio(t, '--p', '--b1')).toBeGreaterThanOrEqual(3)
  })

  it('граница контрола (--control-border на base-100) видна, ≥ 3:1 (F-313)', () => {
    expect(t['--control-border'], `--control-border в ${name}`).toBeDefined()
    expect(ratio(t, '--control-border', '--b1')).toBeGreaterThanOrEqual(3)
  })
})

// Текст статус-бейджа (цвет статуса из @theme на base-100) — ≥4.5:1 (мелкий mono-текст маркера). F-313.
describe.each(Object.entries(STATUS))('status badge text — %s theme', (name, sc) => {
  const b1 = THEMES[name as 'light' | 'dark']['--b1']
  it.each(['--color-warning', '--color-success', '--color-error', '--color-info'])(
    '%s на base-100 ≥ 4.5:1',
    (key) => {
      expect(sc[key], `${key} в @theme(${name})`).toBeDefined()
      expect(contrast(hslToRgb(sc[key]), hslToRgb(b1))).toBeGreaterThanOrEqual(4.5)
    },
  )
})
