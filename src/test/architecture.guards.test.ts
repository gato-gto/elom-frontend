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
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'

const ROOT = process.cwd()
const routerSrc = readFileSync(resolve(ROOT, 'src/router/index.ts'), 'utf8')

/** Рекурсивно собирает исходники src с нужными расширениями (для сканов по всему проекту). */
function collectSources(exts: string[]): string {
  const acc: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      const st = statSync(p)
      if (st.isDirectory()) { walk(p) }
      else if (exts.some(e => name.endsWith(e))) { acc.push(readFileSync(p, 'utf8')) }
    }
  }
  walk(resolve(ROOT, 'src'))
  return acc.join('\n')
}

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

describe('ARCH · правило — молча не действующий механизм снабжён проверкой действия (APPLE-1/F-514)', () => {
  /**
   * Класс дефекта «механизм написан, но молча не работает»: немой catch (F-504), мёртвая
   * сортировка (200 без эффекта), мёртвая safe-area (env(safe-area-inset) без viewport-fit=cover).
   * Здесь — исполнимая проверка для safe-area: если хоть одно правило использует
   * env(safe-area-inset), то index.html ОБЯЗАН включать viewport-fit=cover, иначе инсеты на iOS
   * всегда 0 и весь отступ-под-чёлку/home-indicator тихо не действует.
   */
  it('env(safe-area-inset) ⟹ viewport-fit=cover в index.html', () => {
    const usesSafeArea = /env\(\s*safe-area-inset/.test(collectSources(['.css', '.vue']))
    const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8')
    // Смотрим ИМЕННО тег <meta name="viewport">, а не любое упоминание строки в файле —
    // иначе комментарий со словами «viewport-fit=cover» обманул бы страж (как image/* раньше).
    const viewportMeta = html.match(/<meta[^>]*name=["']viewport["'][^>]*>/i)?.[0] ?? ''
    const hasViewportFit = /viewport-fit\s*=\s*cover/.test(viewportMeta)
    if (usesSafeArea) {
      expect(
        hasViewportFit,
        'Код использует env(safe-area-inset-*), но в index.html нет viewport-fit=cover — ' +
        'на iOS инсеты тогда всегда 0, и safe-area-отступы молча не работают (APPLE-1). ' +
        'Либо верните viewport-fit=cover, либо уберите неработающий safe-area-код.',
      ).toBe(true)
    }
  })
})

describe('ARCH · Apple-стандарты — исполнимые стражи (F-514/516/520)', () => {
  const css = collectSources(['.css', '.vue'])
  const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8')

  it('поля ввода ≥16px на мобильных (иначе iOS зумит при фокусе, A-04/F-516)', () => {
    // Должно быть правило с font-size:16px под мобильным условием для .input/.filter-input.
    const has16 = /font-size:\s*16px/.test(css.replace(/\s+/g, ' '))
    expect(has16, 'Нет правила font-size:16px для полей — вернётся зум при фокусе на iOS.').toBe(true)
  })

  it('тач-цель ≥44px на pointer:coarse (Apple HIG, A-06/F-520)', () => {
    // В блоке @media (pointer: coarse) должен быть min-height:44px.
    const coarseBlocks = css.match(/@media[^{]*pointer:\s*coarse[^{]*\{[\s\S]*?\}\s*\}/g) || []
    const has44 = coarseBlocks.some(b => /min-height:\s*44px/.test(b)) ||
      /pointer:\s*coarse[\s\S]{0,400}min-height:\s*44px/.test(css)
    expect(has44, 'Нет min-height:44px в блоке pointer:coarse — тач-цели меньше нормы Apple 44pt.').toBe(true)
  })

  it('манифест иконок и apple-touch-icon — PNG на месте (A-11/F-514)', () => {
    expect(/apple-touch-icon\.png/.test(html), 'apple-touch-icon должен быть PNG (iOS игнорит SVG).').toBe(true)
  })
})
