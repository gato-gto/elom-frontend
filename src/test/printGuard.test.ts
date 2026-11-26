/**
 * F-1121 (задача владельца 25.11) · страж печати. Аудит печати всех страниц (Chromium PDF + WebKit, светлая и тёмная
 * тема) нашёл: правая колонка таблиц уходила за край листа (min-width 48rem > поля A4), имена ломались по буквам
 * (overflow-wrap:anywhere), тёмная тема печаталась светлым текстом, на бумаге — фильтры/кнопки/пагинация, @page
 * size:A4 запрещал альбомную ориентацию. Страж держит печатные правила, которые это закрыли (разбор настоящего CSS).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import postcss, { type AtRule, type Rule } from 'postcss'

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8')
const root = postcss.parse(read('src/styles/components.css'))

const printBlocks: AtRule[] = []
root.walkAtRules('media', (at) => { if (at.params.trim() === 'print') { printBlocks.push(at) } })

/** Объявления печатных правил, чей селектор содержит sel (в любом печатном блоке). */
function printDecls(sel: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const b of printBlocks) {
    b.walkRules((r: Rule) => {
      if (r.selectors.some(s => s.trim() === sel)) {
        r.walkDecls(d => { out[d.prop] = d.value + (d.important ? ' !important' : '') })
      }
    })
  }
  return out
}

function pageRules(): { name: string; decls: Record<string, string> }[] {
  const out: { name: string; decls: Record<string, string> }[] = []
  for (const b of printBlocks) {
    b.walkAtRules('page', (p) => {
      const decls: Record<string, string> = {}
      p.each(n => { if (n.type === 'decl') { decls[n.prop] = n.value } })
      out.push({ name: p.params.trim(), decls })
    })
  }
  return out
}

describe('печать (F-1121)', () => {
  it('лист по умолчанию без size — ориентацию выбирает пользователь; накладная — A4 книжная', () => {
    const pages = pageRules()
    const def = pages.find(p => p.name === '')
    expect(def?.decls).toEqual({ margin: '0.8cm' })
    expect(pages.find(p => p.name === 'invoice')?.decls).toEqual({ size: 'A4 portrait', margin: '0.8cm' })
    expect(printDecls('.print-page').page).toBe('invoice')
  })

  it('таблицы списков и отчётов — в ширину поля листа, без прокрутки', () => {
    expect(printDecls('.list-content .modern-table')['min-width']).toBe('0 !important')
    expect(printDecls('.list-content .table-container').overflow).toBe('visible !important')
  })

  it('ячейки не ломают слова по буквам и переносятся', () => {
    const td = printDecls('.modern-table td')
    expect(td['word-break']).toBe('normal !important')
    expect(td['overflow-wrap']).toBe('break-word !important')
    expect(td['white-space']).toBe('normal !important')
  })

  it.each(['.filter-panel', '.header-actions', '.modern-pagination-container', '.btn', '.row-action-btn',
    '.drawer-side', '.toast'])('на бумаге нет %s', (sel) => {
    expect(printDecls(sel).display).toBe('none !important')
  })

  it.each([':root[data-theme="dark"]', ':root.dark'])('тёмная тема (%s) печатается светлыми токенами', (sel) => {
    const d = printDecls(sel)
    expect(d['--color-base-content']).toBe('hsl(200 20% 12%) !important')   // тёмный текст
    expect(d['--color-base-100']).toBe('hsl(0 0% 100%) !important')         // белый фон
    expect(d['--bc']).toBe('200 20% 15% !important')                        // короткие токены кастомного CSS
    expect(d['--tx-2']).toBe('205 15% 32% !important')
    expect(d['color-scheme']).toBe('light')
  })

  it('колонка «Действия» общих списков не печатается', () => {
    const gl = read('src/components/GenericList.vue')
    expect(gl).toContain('<th v-if="visibleActions.length > 0" class="text-right no-print">Действия</th>')
    expect(gl).toContain('<td v-if="visibleActions.length > 0" class="text-right no-print">')
    expect(printDecls('.no-print').display).toBe('none !important')
  })
})
