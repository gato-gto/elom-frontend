/**
 * СТРАЖИ АРХИТЕКТУРНЫХ ПРАВИЛ (ARCHITECTURE.md, секция FRONTEND).
 *
 * Это не «стиль» — каждое правило здесь появилось из уже случившегося бага с пустым экраном.
 * Тесты читают РЕАЛЬНЫЕ исходники, а не моки: правило должно ловиться на новом коде за минуту.
 *
 *  Правило 3 (модалка ≠ страница) ← F-502: WriteOffForm — модалка (<Modal :model-value="isOpen">),
 *    роутер монтировал её как страницу без пропса → Modal не рендерил НИЧЕГО. Пустой экран на двух
 *    роутах, без ошибки и без пустого состояния.
 *  Правило 1 (один источник данных) ← F-505: initialData читал только props.initial, а роут монтировал
 *    форму без пропса → ПУСТАЯ форма редактирования, которую можно отправить (риск сохранить не то).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const routerSrc = readFileSync(resolve(ROOT, 'src/router/index.ts'), 'utf8')

/** Компоненты, которые роутер монтирует как страницы: `component: X` + их lazy-import путь. */
function routeTargets(): Array<{ name: string; file: string }> {
  const used = new Set(Array.from(routerSrc.matchAll(/component:\s*(\w+)/g)).map(m => m[1]))
  const out: Array<{ name: string; file: string }> = []
  for (const m of routerSrc.matchAll(/const (\w+) = \(\) => import\([^)]*?['"]([^'"]+\.vue)['"]\)/g)) {
    const [, name, path] = m
    if (!used.has(name)) { continue }           // импорт есть, но целью роута не является
    const file = resolve(ROOT, path.replace(/^@\//, 'src/'))
    if (existsSync(file)) { out.push({ name, file }) }
  }
  return out
}

/**
 * Комментарии выкидываем ПЕРЕД сканированием: страж читает исходник текстом, и без этого
 * он падал на собственных пояснениях вида «раньше здесь был route.params.id» — то есть
 * наказывал за документирование уже исправленного. Страж должен ловить код, а не прозу.
 */
function stripComments(src: string): string {
  return src
    .replace(/<!--[\s\S]*?-->/g, '')        // комментарии шаблона
    // Блочные — ТОЛЬКО начинающиеся со своей строки. Наивный /\/\*[\s\S]*?\*\// нельзя:
    // в шаблоне есть accept="image/*", и он открывал «комментарий» до ближайшего */ в
    // <style>, съедая 40 КБ кода — страж молча слеп и пропускал настоящее нарушение.
    .replace(/^[ \t]*\/\*[\s\S]*?\*\/[ \t]*$/gm, '')
    .replace(/(?<!:)\/\/.*$/gm, '')         // строчные (но не «https://…»)
}

/** Первый значимый тег шаблона компонента. */
function templateRootTag(src: string): string {
  const tpl = src.match(/<template>([\s\S]*?)<\/template>/)
  if (!tpl) { return '' }
  const firstTag = tpl[1].match(/<\s*([A-Za-z][\w.-]*)/)
  return firstTag ? firstTag[1] : ''
}

describe('ARCH · правило 3 — модалка никогда не является целью роута (F-502)', () => {
  const targets = routeTargets()

  it('роутер вообще разобран (иначе тест бесполезен)', () => {
    expect(targets.length).toBeGreaterThan(5)
  })

  it.each(routeTargets().map(t => [t.name, t.file] as const))(
    '%s — не модалка в корне шаблона',
    (name, file) => {
      const root = templateRootTag(readFileSync(file, 'utf8'))
      expect(
        root,
        `${name} смонтирован роутером как страница, но его корень — <${root}>. ` +
        'Модалка без is-open рендерит пустой экран (F-502). ' +
        'Правило: роут, который должен открыть форму, ведёт на СПИСОК с ?edit=:id / ?new=1.',
      ).not.toBe('Modal')
    },
  )
})

describe('ARCH · правило 1 — форма не берёт данные из двух источников сразу (F-505)', () => {
  /**
   * Форму-модалку наполняет список пропсом `:initial`. Если тот же компонент ЕЩЁ и читает
   * `route.params.id`, появляются два несогласованных пути получения данных — ровно то, из-за чего
   * `PurchaseForm` грузил закупку по id, но `initialData` её игнорировал и форма выходила пустой.
   */
  const formFiles = routeTargets()
    .concat(
      // формы-модалки целями роутов быть не должны, но их тоже проверяем
      ['src/pages/WriteOffs/WriteOffForm.vue'].map(p => ({ name: 'WriteOffForm', file: resolve(ROOT, p) })),
    )
    .filter(t => existsSync(t.file))

  it.each(formFiles.map(t => [t.name, t.file] as const))(
    '%s — не читает одновременно props.initial и route.params.id',
    (name, file) => {
      const src = stripComments(readFileSync(file, 'utf8'))
      const usesProp = /props\.initial/.test(src)
      const usesRouteId = /route\.params\.id/.test(src)
      expect(
        usesProp && usesRouteId,
        `${name} читает и props.initial, и route.params.id — два несогласованных источника данных. ` +
        'Правило: у экрана ОДИН источник. Модалка получает запись ТОЛЬКО пропсом и не знает про роут; ' +
        'диплинк на редактирование — ответственность списка (?edit=:id → useEditQuery).',
      ).toBe(false)
    },
  )
})
