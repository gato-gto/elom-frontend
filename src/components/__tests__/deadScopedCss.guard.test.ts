import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// F-1070 (ревью D-030): после рестайла в scoped-стилях остались классы, которых нет в шаблоне
// (scoped CSS на содержимое слотов не действует) — мёртвый код, вводящий в заблуждение.
// Хвост ревью: гард ложно срабатывал на «.svg» в url(…)/комментариях/значениях свойств и пропускал
// классы из массивного :class и одинарных кавычек; префиксы `x-${n}` искал только в шаблоне.
const ROOT = resolve(__dirname, '../../..')

function stripCss(style: string): string {
  return style
    .replace(/\/\*[\s\S]*?\*\//g, ' ')                 // комментарии
    .replace(/url\([^)]*\)/g, ' ')                     // url(icon.svg)
    .replace(/"[^"]*"|'[^']*'/g, ' ')                  // строки в значениях
    .replace(/[^{};]+:[^{};]+(;|(?=\}))/g, ' ')         // объявления «свойство: значение»
}

function addTokens(target: Set<string>, text: string) {
  text.split(/\s+/).forEach(c => { if (/^[a-z][\w-]*$/.test(c)) { target.add(c) } })
}

export function deadClassesFromSource(src: string): string[] {
  const tplStart = src.indexOf('<template>')
  const tpl = tplStart >= 0 ? src.slice(tplStart, src.lastIndexOf('</template>')) : ''
  const styleStart = src.indexOf('<style')
  const style = styleStart >= 0 ? src.slice(src.indexOf('>', styleStart) + 1, src.lastIndexOf('</style>')) : ''
  const scriptStart = src.indexOf('<script')
  const script = scriptStart >= 0 ? src.slice(scriptStart, styleStart >= 0 ? styleStart : undefined) : ''

  const used = new Set<string>()
  for (const m of tpl.matchAll(/(?:^|\s)class="([^"]*)"/g)) { addTokens(used, m[1]) }
  for (const m of tpl.matchAll(/(?:^|\s)class='([^']*)'/g)) { addTokens(used, m[1]) }
  // :class="{ 'x': c }" / :class="['a', c && 'b']" / :class="c ? 'a' : 'b'" — все строки внутри привязки
  for (const m of tpl.matchAll(/(?::class|v-bind:class)="([^"]*)"/g)) {
    for (const s of m[1].matchAll(/'([^']*)'/g)) { addTokens(used, s[1]) }
  }
  for (const s of script.matchAll(/'([^']*)'|`([^`$]*)`/g)) { addTokens(used, s[1] ?? s[2] ?? '') }  // computed
  const dynamicPrefixes = [...(tpl + script).matchAll(/([a-z][\w-]*-)\$\{/g)].map(m => m[1])  // `x-${n}`
  const declared = new Set([...stripCss(style).matchAll(/\.([a-z][\w-]*)/g)].map(m => m[1]))
  return [...declared].filter(c => !used.has(c) && !dynamicPrefixes.some(p => c.startsWith(p)))
}

const deadClasses = (file: string) => deadClassesFromSource(readFileSync(resolve(ROOT, file), 'utf8'))
const sfc = (tpl: string, style: string, script = '') =>
  `<template>${tpl}</template>\n<script setup lang="ts">${script}</script>\n<style scoped>${style}</style>`

describe('deadClassesFromSource — сам гард', () => {
  it('test_unused_class_is_reported', () => {
    expect(deadClassesFromSource(sfc('<div class="a"></div>', '.a{color:red}.ghost{color:blue}'))).toEqual(['ghost'])
  })
  it('test_extension_in_url_and_comment_is_not_a_class', () => {
    const style = '/* см. .old-card */ .a { background: url(icons/x.svg); font: 1rem "Plex.Sans"; }'
    expect(deadClassesFromSource(sfc('<div class="a"></div>', style))).toEqual([])
  })
  it('test_last_declaration_without_semicolon_is_ignored', () => {
    expect(deadClassesFromSource(sfc('<div class="a"></div>', '.a { background: url(x.png) }'))).toEqual([])
  })
  it('test_array_and_ternary_class_bindings_count_as_used', () => {
    const tpl = `<div :class="['b', on && 'c']"></div><i :class="on ? 'd' : 'e'"></i>`
    expect(deadClassesFromSource(sfc(tpl, '.b{}.c{}.d{}.e{}'))).toEqual([])
  })
  it('test_single_quoted_class_attribute_counts_as_used', () => {
    expect(deadClassesFromSource(sfc(`<div class='f g'></div>`, '.f{}.g{}'))).toEqual([])
  })
  it('test_dynamic_prefix_in_script_template_literal_counts_as_used', () => {
    const script = 'const cls = computed(() => `grid-${n}`)'
    expect(deadClassesFromSource(sfc('<div :class="cls"></div>', '.grid-2{}.grid-3{}', script))).toEqual([])
  })
  it('test_quoted_word_in_text_interpolation_is_not_a_used_class', () => {
    // раньше любое «'слово' :» в шаблоне считалось классом → мёртвый .ghost не находился
    const tpl = `<div class="a">{{ on ? 'ghost' : 'нет' }}</div>`
    expect(deadClassesFromSource(sfc(tpl, '.a{}.ghost{}'))).toEqual(['ghost'])
  })
  it('test_pseudo_and_media_selectors_are_still_checked', () => {
    const style = '@media (min-width: 768px) { .a:hover { color: red } .ghost::after { content: "" } }'
    expect(deadClassesFromSource(sfc('<div class="a"></div>', style))).toEqual(['ghost'])
  })
})

describe('F-1070: в scoped-стилях нет классов, отсутствующих в шаблоне', () => {
  it('ListHeader', () => expect(deadClasses('src/components/ListHeader.vue')).toEqual([]))
  it('FilterPanel', () => expect(deadClasses('src/components/FilterPanel.vue')).toEqual([]))
  it('Modal', () => expect(deadClasses('src/components/Modal.vue')).toEqual([]))
  it('ListHeader ≤480px: отступ шапки без карточного остатка (0.25rem 0 0.5rem)', () => {
    const src = readFileSync(resolve(ROOT, 'src/components/ListHeader.vue'), 'utf8')
    const block = src.slice(src.indexOf('@media (max-width: 480px)'))
    expect(block).toMatch(/\.header-content\s*\{\s*padding:\s*0\.25rem 0 0\.5rem;/)
  })
})
