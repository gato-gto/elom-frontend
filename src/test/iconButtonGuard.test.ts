/**
 * F-1144 (владелец 28.11, 1920×1080: «крестик маленький») · страж кнопок-иконок. Наши правила .btn-xs/.btn-sm (и .btn
 * на тач-экранах в navigation-styles.css) лежат вне @layer и перебивали `padding-inline: 0` DaisyUI у .btn-circle/
 * .btn-square (тот — в @layer): иконка в круге 32 px сжималась до 6×24, в кнопке 24 px — до 6×16 (замер WebKit).
 * Страж держит правило, которое это закрыло (разбор настоящего CSS): без @media/@layer и с !important — иначе его
 * перебьёт любое из правил padding у .btn в другом файле или под тач-медиазапросом.
 *
 * Ревью-32 р5 (MED): исходный баг дали правила БЕЗ имён .btn-circle/.btn-square (.btn-xs, .btn, .modern-table .btn).
 * Правило стража (0,1,0 + !important) перебивается любым !important-отступом на кнопке с большей специфичностью или
 * позже в бандле — поэтому запрещаем !important-отступ на ЛЮБОМ селекторе, который может попасть на кнопку, во всех
 * CSS-файлах src и <style>-блоках .vue (кроме самого стража: значение 0 у .btn-circle/.btn-square).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import postcss, { type Rule } from 'postcss'

const SRC = resolve(process.cwd(), 'src')
const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8')

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    if (e.isDirectory()) { return e.name === 'node_modules' ? [] : walk(p) }
    return /\.(css|vue)$/.test(e.name) ? [p] : []
  })
}

/** CSS-файлы целиком и содержимое <style>-блоков .vue — тем же парсером. */
function sources(): Array<[string, string]> {
  const out: Array<[string, string]> = []
  for (const f of walk(SRC)) {
    const text = readFileSync(f, 'utf8')
    if (f.endsWith('.css')) { out.push([f, text]); continue }
    for (const m of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) { out.push([f, m[1]]) }
  }
  return out
}

// селектор, который может попасть на кнопку: .btn, .btn-*, .row-action-btn, .icon-btn, элемент button
const BUTTONISH = /\.btn(?![\w-]*-group\b)(?=[\s.:#[>+~),]|$|-)|\.row-action-btn\b|\.icon-btn\b|(?:^|[\s>+~(,])button(?![\w-])/
const GUARD_ONLY = /^\.btn-(?:circle|square)$/

export function offenders(list: Array<[string, string]>): string[] {
  const out: string[] = []
  for (const [file, css] of list) {
    let root
    // ревью-32 р6: непарсимый блок (напр. SCSS-интерполяция) — громко, а не молча мимо стража (сегодня таких 0 из 54)
    try { root = postcss.parse(css) } catch (e) { throw new Error(`страж F-1144 не разобрал стили ${file}: ${e}`) }
    root.walkDecls(/^padding/, (d) => {
      const r = d.parent as Rule
      if (!d.important || !r.selectors) { return }
      const sels = r.selectors.map((s) => s.trim())
      if (!sels.some((s) => BUTTONISH.test(s))) { return }
      if (sels.every((s) => GUARD_ONLY.test(s)) && /^0(px)?$/.test(d.value.trim())) { return }   // сам страж
      out.push(`${file.replace(SRC, 'src')}: ${r.selector} { ${d.prop}: ${d.value} !important }`)
    })
  }
  return out
}

function zeroPaddingRule(css: string): Rule | undefined {
  let found: Rule | undefined
  postcss.parse(css).walkRules((r) => {
    const sels = r.selectors.map((s) => s.trim())
    if (!sels.includes('.btn-circle') || !sels.includes('.btn-square')) { return }
    r.walkDecls('padding', (d) => { if (d.value.trim() === '0' && d.important) { found = r } })
  })
  return found
}

describe('F-1144 · кнопки-иконки без внутренних отступов', () => {
  it('components.css: .btn-circle, .btn-square { padding: 0 !important } — на верхнем уровне (не в @media/@layer)', () => {
    const rule = zeroPaddingRule(read('src/styles/components.css'))
    expect(rule, 'правило padding: 0 !important для .btn-circle/.btn-square').toBeDefined()
    expect(rule?.parent?.type).toBe('root')
  })

  it('нигде в src (CSS и <style> в .vue) нет !important-отступа у кнопок — он перебил бы страж', () => {
    expect(offenders(sources())).toEqual([])
  })

  it('проверка ловит то, что перебило бы страж (ревью-32 р5: m1–m3), и не трогает чужие правила', () => {
    const f = 'x.css'
    expect(offenders([[f, '.modern-table .btn { padding: 0.5rem 0.75rem !important; }']])).toHaveLength(1)
    expect(offenders([[f, '.btn-xs { padding: 0.25rem 0.5rem !important; }']])).toHaveLength(1)
    expect(offenders([[f, '.btn-xs[data-v-1a2b] { padding-left: 4px !important; }']])).toHaveLength(1)
    expect(offenders([[f, '@media (pointer: coarse) { .btn { padding-inline: 1rem !important; } }']])).toHaveLength(1)
    expect(offenders([[f, '.card button { padding: 2px !important; }']])).toHaveLength(1)
    expect(offenders([[f, '.btn-circle { padding: 4px !important; }']])).toHaveLength(1)
    expect(offenders([[f, '.btn-circle, .btn-square { padding: 0 !important; }']])).toEqual([])
    expect(offenders([[f, '.btn-group { padding: 4px !important; } .toast { padding: 1rem !important; }']])).toEqual([])
    expect(offenders([[f, '.btn-sm { padding: 0.375rem 0.75rem; }']])).toEqual([])    // без !important — страж сильнее
  })
})
