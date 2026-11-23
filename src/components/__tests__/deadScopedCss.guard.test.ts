import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// F-1070 (ревью D-030): после рестайла в scoped-стилях остались классы, которых нет в шаблоне
// (scoped CSS на содержимое слотов не действует) — мёртвый код, вводящий в заблуждение.
const ROOT = resolve(__dirname, '../../..')
function deadClasses(file: string): string[] {
  const src = readFileSync(resolve(ROOT, file), 'utf8')
  const tpl = src.slice(src.indexOf('<template>'), src.lastIndexOf('</template>'))
  const style = src.slice(src.indexOf('<style'))
  const used = new Set<string>()
  for (const m of tpl.matchAll(/class="([^"]*)"/g)) { m[1].split(/\s+/).forEach(c => c && used.add(c)) }
  for (const m of tpl.matchAll(/'([a-z][\w-]*)'\s*:/g)) { used.add(m[1]) }      // :class="{ 'x': cond }"
  const script = src.slice(src.indexOf('<script'), src.indexOf('<style'))
  for (const m of script.matchAll(/'([a-z][\w-]*)'/g)) { used.add(m[1]) }       // классы из computed (gridClass)
  const dynamicPrefixes = [...tpl.matchAll(/([a-z][\w-]*-)\$\{/g)].map(m => m[1])   // `filter-grid-${n}`
  const declared = new Set([...style.matchAll(/\.([a-z][\w-]*)/g)].map(m => m[1]))
  return [...declared].filter(c => !used.has(c) && !dynamicPrefixes.some(p => c.startsWith(p)))
}

describe('F-1070: в scoped-стилях нет классов, отсутствующих в шаблоне', () => {
  it('ListHeader', () => expect(deadClasses('src/components/ListHeader.vue')).toEqual([]))
  it('FilterPanel', () => expect(deadClasses('src/components/FilterPanel.vue')).toEqual([]))
  it('ListHeader ≤480px: отступ шапки без карточного остатка (0.25rem 0 0.5rem)', () => {
    const src = readFileSync(resolve(ROOT, 'src/components/ListHeader.vue'), 'utf8')
    const block = src.slice(src.indexOf('@media (max-width: 480px)'))
    expect(block).toMatch(/\.header-content\s*\{\s*padding:\s*0\.25rem 0 0\.5rem;/)
  })
})
