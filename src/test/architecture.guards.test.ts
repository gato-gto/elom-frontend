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
/** F-1022: список файлов src/** по regex имени (для гардов, которым нужен путь, а не слитый текст). */
function listFiles(root: string, re: RegExp): string[] {
  const acc: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) { walk(p) } else if (re.test(name)) { acc.push(p) }
    }
  }
  walk(root)
  return acc
}

/** F-1022: все @keyframes в тексте (имя + тело) через баланс скобок — регекс с `\n}` пропускал
 *  однострочные блоки (поймано мутацией). */
function keyframesBlocks(src: string): Array<{ name: string; body: string }> {
  const out: Array<{ name: string; body: string }> = []
  const re = /@keyframes\s+([\w-]+)\s*\{/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) {
    let depth = 1
    let i = m.index + m[0].length
    const start = i
    while (i < src.length && depth > 0) {
      if (src[i] === '{') { depth++ } else if (src[i] === '}') { depth-- }
      i++
    }
    out.push({ name: m[1], body: src.slice(start, i - 1) })
  }
  return out
}

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

  /**
   * F-1027 (A-11): iOS показывает splash ТОЛЬКО при точном совпадении media-запроса с экраном И точном
   * совпадении пикселей PNG с (device-width×dpr, device-height×dpr). Ошибка в одном числе = молча
   * белый экран. Страж читает КАЖДЫЙ <link rel="apple-touch-startup-image">: файл существует, media
   * содержит все 4 ключа + явную тему, размеры PNG (IHDR) == media×dpr, light/dark парные, и splash
   * не попадает в SW-precache (иначе каждый клиент тянет ~1 МБ при каждом обновлении).
   */
  it('apple-touch-startup-image: файл есть, размеры PNG == media×dpr, обе темы, вне SW-precache (F-1027)', () => {
    const links = html.match(/<link[^>]*rel=["']apple-touch-startup-image["'][^>]*>/g) ?? []
    expect(links.length, 'ожидался набор splash-ссылок (сгенерируй: node tools/apple-splash/generate.mjs)').toBeGreaterThanOrEqual(40)
    const pngSize = (file: string) => {
      const b = readFileSync(file)
      expect(b.subarray(1, 4).toString(), `${file}: не PNG`).toBe('PNG')
      return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }  // IHDR width/height
    }
    const seen = new Set<string>()
    const bad: string[] = []
    for (const tag of links) {
      const media = tag.match(/media=["']([^"']+)["']/)?.[1] ?? ''
      const href = tag.match(/href=["']([^"']+)["']/)?.[1] ?? ''
      const dw = Number(media.match(/device-width:\s*(\d+)px/)?.[1])
      const dh = Number(media.match(/device-height:\s*(\d+)px/)?.[1])
      const dpr = Number(media.match(/-webkit-device-pixel-ratio:\s*(\d+)/)?.[1])
      const orient = media.match(/orientation:\s*(portrait|landscape)/)?.[1]
      const scheme = media.match(/prefers-color-scheme:\s*(light|dark)/)?.[1]
      if (!dw || !dh || !dpr || !orient || !scheme) { bad.push(`${href}: неполный media «${media}»`); continue }
      const key = `${dw}x${dh}@${dpr}:${orient}:${scheme}`
      if (seen.has(key)) { bad.push(`${href}: дубль media ${key}`) }
      seen.add(key)
      const file = resolve(ROOT, 'public', href.replace(/^\//, ''))
      if (!existsSync(file)) { bad.push(`${href}: файла нет в public/`); continue }
      const { w, h } = pngSize(file)
      const [ew, eh] = orient === 'portrait' ? [dw * dpr, dh * dpr] : [dh * dpr, dw * dpr]
      if (w !== ew || h !== eh) { bad.push(`${href}: PNG ${w}x${h} ≠ media ${ew}x${eh}`) }
    }
    // парность тем: для каждого (размер, ориентация) обязаны быть и light, и dark
    for (const key of seen) {
      const twin = key.endsWith(':light') ? key.replace(/:light$/, ':dark') : key.replace(/:dark$/, ':light')
      if (!seen.has(twin)) { bad.push(`${key}: нет парной темы`) }
    }
    expect(bad, bad.join('\n')).toEqual([])
    const vite = readFileSync(resolve(ROOT, 'vite.config.ts'), 'utf8')
    expect(/globIgnores:\s*\[[^\]]*splash/.test(vite), 'vite.config: splash/ должен быть в workbox.globIgnores').toBe(true)
  })
})

describe('ARCH · CSP-совместимость (F-779b/F-1030)', () => {
  /**
   * На elom.uz включён Content-Security-Policy без 'unsafe-eval' и без inline-скриптов. Любой
   * `eval(...)` / `new Function(...)` / `setTimeout('строка')` в бандле упадёт EvalError'ом — и, как
   * в browserSupport.checkES6, может тихо переродиться в ложный «браузер не поддерживается».
   * Страж скана реальных исходников src/ (кроме тестов).
   */
  it('в src нет eval / new Function / setTimeout(строка) — CSP без unsafe-eval', () => {
    const offenders: string[] = []
    for (const f of listFiles(resolve(ROOT, 'src'), /\.(ts|vue)$/)) {
      if (/\.test\.ts$|\/test\//.test(f)) { continue }
      const code = readFileSync(f, 'utf8')
      if (/\bnew\s+Function\s*\(|(?<![\w.])eval\s*\(|set(?:Timeout|Interval)\s*\(\s*['"`]/.test(code)) {
        offenders.push(f.replace(ROOT + '/', ''))
      }
    }
    expect(offenders, 'eval-подобные вызовы ломаются под CSP:\n' + offenders.join('\n')).toEqual([])
  })
})

describe('ARCH · CSP meta в index.html (F-1030/F-779b)', () => {
  const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8')
  const meta = html.match(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i)?.[0] ?? ''
  const policy = meta.match(/content="([^"]*)"/)?.[1] ?? ''
  const directive = (name: string) => policy.split(';').map(d => d.trim()).find(d => d.startsWith(name + ' ') || d === name)

  it('meta-CSP присутствует и стоит ДО первого <script>/<link> (иначе ресурсы до неё вне политики)', () => {
    expect(meta, 'нет <meta http-equiv="Content-Security-Policy"> — SW-оболочка остаётся без CSP').not.toBe('')
    const firstLoad = html.search(/<(script|link)\b/i)
    expect(html.indexOf(meta)).toBeLessThan(firstLoad)
  })

  it('ключевые директивы строгие: script-src только self (без unsafe-eval/inline), object-src none, api в img/connect', () => {
    expect(directive('script-src')).toBe("script-src 'self'")
    expect(directive('object-src')).toBe("object-src 'none'")
    expect(directive('base-uri')).toBe("base-uri 'self'")
    expect(directive('default-src')).toBe("default-src 'self'")
    expect(directive('img-src')).toContain('https://api.elom.uz')   // фото идут с API
    expect(directive('img-src')).toContain('blob:')                 // превью до загрузки
    expect(directive('connect-src')).toContain('https://api.elom.uz')
    expect(directive('worker-src')).toBe("worker-src 'self'")      // Service Worker
    expect(directive('manifest-src')).toBe("manifest-src 'self'")
    expect(policy).not.toMatch(/unsafe-eval|unsafe-inline/)
  })

  it('в meta нет директив, которые meta игнорирует (frame-ancestors/report-uri/sandbox) — они только в nginx', () => {
    expect(policy).not.toMatch(/frame-ancestors|report-uri|report-to|sandbox/)
  })
})

describe('ARCH · навигация строится только из роутов с icon (класс F-930/F-1032)', () => {
  /**
   * AutoNavigation/AutoMobileNavigation молча выкидывают роут без meta.icon (`if (!meta?.icon) return`).
   * Дважды пойманный класс: F-930 («Смета» была построена, но не рендерилась) и F-1032 (все 4 отчёта
   * /reports/* годами недостижимы из меню ни для одной роли — только прямым URL). Страж: каждый
   * top-level роут router/index.ts с meta.order (= позиция в меню ⇒ кандидат в навигацию) ОБЯЗАН нести meta.icon,
   * и имя иконки обязано существовать в реестре @/assets/icons.
   */
  it('каждый роут с meta.order несёт meta.icon из реестра', async () => {
    const src = readFileSync(resolve(ROOT, 'src/router/index.ts'), 'utf8')
    const { icons } = await import('@/assets/icons')
    const bad: string[] = []
    // meta-блоки: от "meta: {" до закрывающей скобки того же уровня (грубо: до "}" на той же глубине)
    const re = /path:\s*'([^']+)'[\s\S]*?meta:\s*\{([\s\S]*?)\n\s*\}/g
    let m: RegExpExecArray | null
    while ((m = re.exec(src)) !== null) {
      const [, path, meta] = m
      if (!/\border:\s*\d/.test(meta)) { continue }
      const icon = meta.match(/icon:\s*'([^']+)'/)?.[1]
      if (!icon) { bad.push(`${path}: есть order (пункт меню), нет icon — роут молча выпадет из навигации`) }
      else if (!(icon in icons)) { bad.push(`${path}: icon '${icon}' отсутствует в реестре @/assets/icons`) }
    }
    expect(bad, bad.join('\n')).toEqual([])
  })
})

describe('A11Y · иконочные destructive-кнопки имеют доступное имя (F-917)', () => {
  it('каждая icon-only btn-error (удаление позиции/строки/фото) несёт aria-label', () => {
    // Замерено ВЖИВУЮ на реальном iOS WebKit (iPhone, pointer:coarse): кнопка удаления позиции
    // form-writeoff рендерится 44×44 (тач-цель ОК, глоб. правило F-520), НО aria-label=null → VoiceOver
    // озвучивает просто «кнопка», смысла нет. Класс «missed sibling»: у row-action/close/PurchaseInfo
    // aria есть, а у remove-кнопок позиций/фото — не было. Страж скана РЕАЛЬНЫХ .vue: destructive
    // иконочная кнопка (btn-error + btn-xs/square/circle) БЕЗ видимого текста обязана нести aria-label
    // (обычный текстовый «Отмена/Удалить» не трогаем — у него имя = текст).
    const files: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name)
        const st = statSync(p)
        if (st.isDirectory()) { walk(p) }
        else if (name.endsWith('.vue')) { files.push(p) }
      }
    }
    walk(resolve(ROOT, 'src'))
    const offenders: string[] = []
    for (const f of files) {
      const src = readFileSync(f, 'utf8')
      const elements = src.match(/<button[\s\S]*?<\/button>/g) || []
      for (const el of elements) {
        const openTag = el.match(/<button[\s\S]*?>/)?.[0] ?? ''
        const isDestructiveIcon = /btn-error/.test(openTag) && /(btn-square|btn-circle|btn-xs)/.test(openTag)
        if (!isDestructiveIcon) { continue }
        // Видимый текст кнопки: срезаем открывающий/закрывающий тег, вложенные теги и {{ }}-интерполяцию.
        const visibleText = el
          .replace(/<button[\s\S]*?>/, '')
          .replace(/<\/button>/, '')
          .replace(/<[^>]*>/g, '')
          .replace(/\{\{[\s\S]*?\}\}/g, 'X')
          .trim()
        const hasAria = /aria-label\s*=/.test(openTag) // ловит и :aria-label (динамический)
        if (!visibleText && !hasAria) {
          offenders.push(`${f.replace(ROOT + '/', '')}: ${openTag.replace(/\s+/g, ' ').slice(0, 90)}`)
        }
      }
    }
    expect(
      offenders,
      'Иконочные destructive-кнопки без aria-label — VoiceOver/screen-reader озвучит просто «кнопка»:\n' +
        offenders.join('\n'),
    ).toEqual([])
  })
})

/**
 * Правило (F-939, задача владельца «нормализуй иконки как во всём проекте и сделай это правилом»):
 * иконки — ТОЛЬКО из реестра, не инлайн-SVG. Сущности/навигация → getIconPath (@/assets/icons);
 * действия (edit/delete/add/view/reject…) → ACTION_ICONS / actionIconPath (@/utils/actionIcons).
 * Инлайн сырого пути d="M…" запрещён (дублирование + рассинхрон стиля). Скоуп — сметный модуль
 * (нормализован); легаси-страницы вне скоупа — отдельный follow-up.
 */
describe('Правило: иконки из реестра, не инлайн SVG (сметный модуль)', () => {
  const files = [
    'src/pages/Estimates/Catalog.vue',
    'src/pages/Estimates/EstimateForm.vue',
    'src/pages/Estimates/EstimateInfo.vue',
    'src/pages/Estimates/EstimateList.vue',
    'src/components/WorkItemSearchSelect.vue',
    'src/components/cards/EstimateCard.vue',
  ]
  for (const rel of files) {
    it(`${rel}: без инлайн d="M…" (getIconPath/ACTION_ICONS)`, () => {
      const p = resolve(ROOT, rel)
      if (!existsSync(p)) { return }
      const inline = (readFileSync(p, 'utf8').match(/\sd="M[\d-]/g) || [])
      expect(
        inline,
        `Инлайн SVG-путь в ${rel} — замени на getIconPath('name') или ACTION_ICONS.key`,
      ).toHaveLength(0)
    })
  }
})

/**
 * APPLE-2 (F-996, задача владельца «iPhone Safari: select-меню прилипает к верху экрана»):
 * (1) scrollLock НЕ смещает body (`position:fixed`+`top:-scrollY`) — нативный iOS-поповер <select>
 *     якорится по документным координатам, смещение уводило меню к верху ровно на глубину прокрутки
 *     (репорты MUI#3638, angular/material#11382). Лок — только overflow.
 * (2) Модальные keyframes БЕЗ transform — во время анимации transform-предок ломает тот же якорь
 *     и создаёт containing block для fixed-потомков.
 */
describe('APPLE-2 · iOS select-поповер: без смещения body и без transform в модалках (F-996)', () => {
  it('scrollLock.ts не использует position:fixed/top-смещение body', () => {
    const src = stripComments(readFileSync(resolve(ROOT, 'src/utils/scrollLock.ts'), 'utf8'))
    expect(
      /position\s*[:=]\s*['"]?fixed/.test(src),
      'scrollLock вернулся к body{position:fixed} — iOS select-поповер снова прилипнет к верху (F-996)',
    ).toBe(false)
    expect(/style\.top\s*=/.test(src), 'смещение body.top вернулось (F-996)').toBe(false)
  })
  it('модальные keyframes (modal*) не содержат transform — во ВСЕХ .css и <style> .vue (F-1022)', () => {
    // F-1022: прежний гард читал только 2 css-файла — keyframes внутри SFC <style> были слепой зоной.
    const files = [...listFiles(resolve(ROOT, 'src'), /\.(css|vue)$/)]
    let scanned = 0
    for (const abs of files) {
      const rel = abs.slice(ROOT.length + 1)
      const src = readFileSync(abs, 'utf8')
      for (const kf of keyframesBlocks(src)) {
        if (!/^modal/.test(kf.name)) { continue }
        scanned++
        expect(
          /transform\s*:/.test(kf.body),
          `${rel}: @keyframes ${kf.name} содержит transform — ломает якорь iOS select-поповера (F-996)`,
        ).toBe(false)
      }
    }
    expect(scanned, 'гард ничего не просканировал — регекс/список файлов сломан').toBeGreaterThan(0)
  })
  it('F-1022: fixed-контейнер с transform-анимацией (slideUp мобильного меню) не содержит select/SearchSelect', () => {
    // Мобильное полноэкранное меню анимируется transform (slideUp) — это допустимо ТОЛЬКО пока внутри нет
    // нативного <select> / *SearchSelect (иначе iOS-поповер прилипнет к верху — F-996-класс). Мутация:
    // добавить <select> в AutoMobileNavigation.vue → красный.
    const src = readFileSync(resolve(ROOT, 'src/components/AutoMobileNavigation.vue'), 'utf8')
    const tpl = src.slice(0, src.indexOf('<script'))
    expect(/@keyframes\s+slideUp[\s\S]*?transform\s*:/.test(src), 'slideUp больше не transform — гард можно упростить').toBe(true)
    expect(/<select\b/i.test(tpl) || /SearchSelect/.test(tpl),
      'в transform-анимируемом мобильном меню появился select/SearchSelect — iOS-якорь сломается (F-996); '
      + 'перепишите slideUp без transform (top/opacity) или вынесите контрол').toBe(false)
  })
  it('F-1000: SearchSelect-дропдауны позиционируются по visualViewport, не по window.innerHeight', () => {
    // iOS-клавиатура НЕ сжимает window.innerHeight → меню рисовалось под клавиатурой (HIGH-1 аудита,
    // 3 линзы независимо). Компоненты обязаны использовать getVisualViewportBounds + слушать visualViewport.
    for (const rel of ['src/components/MaterialSearchSelect.vue', 'src/components/WorkItemSearchSelect.vue']) {
      const src = stripComments(readFileSync(resolve(ROOT, rel), 'utf8'))
      expect(/window\.innerHeight/.test(src), `${rel}: window.innerHeight вернулся (F-1000)`).toBe(false)
      expect(/getVisualViewportBounds\(\)/.test(src), `${rel}: нет getVisualViewportBounds (F-1000)`).toBe(true)
      expect(/visualViewport\?\.addEventListener/.test(src), `${rel}: нет visualViewport-слушателей (F-1000)`).toBe(true)
    }
  })
  it('F-1001: fullscreen-модалка (F-571) несёт safe-area инсеты', () => {
    const src = readFileSync(resolve(ROOT, 'src/components/Modal.vue'), 'utf8')
    const block = src.match(/@media \(max-width: 639px\) \{([\s\S]*?)\n\}/)
    expect(block, 'F-571 media-блок исчез из Modal.vue').toBeTruthy()
    expect(
      /env\(safe-area-inset-top\)/.test(block![1]),
      'fullscreen-модалка без env(safe-area-inset-top) — крестик снова под Dynamic Island (F-1001)',
    ).toBe(true)
  })
  it('F-1010/1012: числовые инпуты с inputmode; декоратив-hover только под hover-медиа', () => {
    // L3: type=number без inputmode → iOS открывает полную клавиатуру (sibling F-522).
    const all = collectSources(['.vue'])
    const bare = all.match(/<input[^>]*type="number"(?![^>]*inputmode)[^>]*>/g) || []
    expect(bare, `type="number" без inputmode: ${bare.map(b => b.slice(0, 60)).join(' | ')}`).toHaveLength(0)
    // L5: transform/scale в :hover вне @media(hover:hover) → «залипание» первого тапа на iOS.
    for (const rel of ['src/styles/animations.css', 'src/styles/components.css']) {
      const css = readFileSync(resolve(ROOT, rel), 'utf8')
      for (const m of css.matchAll(/([^\n{}]+:hover[^{]*)\{([^}]*)\}/g)) {
        if (/transform\s*:|scale\(|translateY?\(/.test(m[2])) {
          const ctx = css.slice(Math.max(0, m.index! - 400), m.index)
          expect(/@media \(hover: hover\)/.test(ctx),
            `${rel}: декоратив-hover «${m[1].trim().slice(0, 50)}» вне hover-медиа (F-1012)`).toBe(true)
        }
      }
    }
  })
  it('F-1004/1005: dvh-пара в базовом .modal-box и safe-area у fixed-top тостов', () => {
    const css = readFileSync(resolve(ROOT, 'src/styles/components.css'), 'utf8')
    const box = css.match(/\.modal-box\s*\{([\s\S]*?)\n\}/)![1]
    expect(/max-height:\s*90vh/.test(box) && /max-height:\s*90dvh/.test(box),
      'базовый .modal-box без пары 90vh+90dvh — обрезка в iOS-ландшафте вернулась (F-1004)').toBe(true)
    const toast = readFileSync(resolve(ROOT, 'src/components/ToastCenter.vue'), 'utf8')
    expect(/top:\s*max\([^)]*safe-area-inset-top\)/.test(toast),
      'тосты без env(safe-area-inset-top) — снова под часами в PWA (F-1005)').toBe(true)
  })
  it('F-1003: экспорт-заглушки мертвы — никто не импортирует composables/useExport, отчёты ходят на BE', () => {
    // useExport.exportToExcel писал TSV с расширением .xlsx, exportToPDF — CSV с .pdf (битые файлы
    // в Excel/Numbers; Apple-аудит MED). Файл удалён; отчёты excel/pdf качают настоящие BE-файлы.
    const all = collectSources(['.vue', '.ts'])
    // Ищем именно ИМПОРТ-стейтмент (не упоминание пути — иначе гард ловил бы сам себя в этом файле).
    expect(/from ['"]@\/composables\/useExport['"]/.test(all),
      'импорт composables/useExport вернулся (F-1003)').toBe(false)
    for (const rel of ['src/pages/Reports/ByObject.vue', 'src/pages/Reports/ByPeriod.vue',
                       'src/pages/Reports/ByResponsible.vue', 'src/pages/Reports/ByMaterial.vue']) {
      const src = readFileSync(resolve(ROOT, rel), 'utf8')
      expect(/exportFromBackend\(/.test(src), `${rel}: excel/pdf не через BE (F-1003)`).toBe(true)
    }
  })
  it('F-1002: логин-поле несёт autocapitalize=none (iOS капитализация ломала вход)', () => {
    const src = readFileSync(resolve(ROOT, 'src/pages/Login.vue'), 'utf8')
    expect(/autocapitalize="none"/.test(src), 'Login username без autocapitalize=none (F-1002)').toBe(true)
    expect(/autocomplete="current-password"/.test(src), 'Login password без autocomplete (F-1002)').toBe(true)
  })
  it('F-999: .modal-box нейтрализует DaisyUI v5 individual-свойства (translate/scale/rotate: none)', () => {
    // DaisyUI v5 держит на открытой модалке translate:0/scale:1 — identity, но НЕ none → containing
    // block + слом якоря iOS-поповера (live-DOM подтверждён). Наш CSS обязан перебивать в none.
    const css = readFileSync(resolve(ROOT, 'src/styles/components.css'), 'utf8')
    const box = css.match(/\.modal-box\s*\{([\s\S]*?)\n\}/)
    expect(box, '.modal-box правило исчезло из components.css').toBeTruthy()
    for (const prop of ['translate', 'scale', 'rotate']) {
      expect(
        new RegExp(`${prop}\\s*:\\s*none`).test(box![1]),
        `.modal-box не нейтрализует ${prop} (DaisyUI v5) — iOS select-якорь снова сломается (F-999)`,
      ).toBe(true)
    }
  })
})

/**
 * Правило (A7 / F-762 — хендофф A→B): FE НЕ переопределяет драфт-флаг сам, а читает
 * АВТОРИТЕТНЫЙ is_draft от BE. Раньше `is_draft: item.default_price == null` молча метил
 * договорные позиции (цена по договору: default_price=NULL, proposed_by=NULL) черновиками.
 * BE (WorkItem/WorkItemLite сериализаторы, F-762) теперь отдаёт is_draft = (default_price is None
 * И proposed_by задан). Оба места добавления строки (onSearchPicked, onWorkItemCreated) обязаны
 * консумить item.is_draft; старый эвристик default_price==null для драфта — запрещён (свип обоих sibling-сайтов).
 */
describe('ARCH · драфт строки сметы = авторитетный BE is_draft, не default_price==null (A7/F-762)', () => {
  const src = stripComments(readFileSync(resolve(ROOT, 'src/pages/Estimates/EstimateForm.vue'), 'utf8'))
  it('EstimateForm консумит авторитетный item.is_draft', () => {
    expect(
      /is_draft:\s*item\.is_draft\b/.test(src),
      'onSearchPicked/onWorkItemCreated должны читать item.is_draft (авторитетный флаг от BE, F-762)',
    ).toBe(true)
  })
  it('EstimateForm НЕ выводит драфт из default_price==null (метило договорные черновиками)', () => {
    expect(
      /is_draft:\s*item\.default_price\s*==\s*null/.test(src),
      'возвращён старый эвристик is_draft: item.default_price == null — договорные позиции снова помечаются черновиками (A7)',
    ).toBe(false)
  })
})

describe('F-1023 · DaisyUI drawer: чекбокс #drawer-toggle обязателен (якорь селектора desktop-сайдбара)', () => {
  it('AppLayout содержит input#drawer-toggle.drawer-toggle перед .drawer-side', () => {
    // DaisyUI v5: `.lg\:drawer-open>.drawer-toggle~.drawer-side{visibility:visible}` — без чекбокса
    // desktop-сайдбар невидим (регресс пойман live-скрином 2026-08-18 при «чистке мёртвого кода»).
    const src = readFileSync(resolve(ROOT, 'src/layouts/AppLayout.vue'), 'utf8')
    const tpl = src.slice(0, src.indexOf('<script'))
    const toggle = tpl.search(/<input[^>]*id="drawer-toggle"[^>]*class="[^"]*\bdrawer-toggle\b/)
    const side = tpl.indexOf('class="drawer-side"')
    expect(toggle, 'input#drawer-toggle.drawer-toggle отсутствует — сайдбар пропадёт').toBeGreaterThan(-1)
    expect(side).toBeGreaterThan(toggle)
  })
})

describe('F-1024 · ChartContainer: цвета в <style> только токенами темы (без hex / .dark-дублей)', () => {
  it('scoped style ChartContainer.vue не содержит #hex и правил .dark', () => {
    // Хардкод Tailwind-серых (#6b7280/#9ca3af/#111827…) требовал .dark-двойника на каждое правило и
    // расходился с graphite-палитрой DESIGN_LANGUAGE. Токены hsl(var(--bc/--b1/--b2/--b3)) сами
    // переключаются с темой. JS-палитра Chart.js (getThemeColors) — отдельно, реактивна по isDark.
    const src = readFileSync(resolve(ROOT, 'src/components/ChartContainer.vue'), 'utf8')
    const style = src.slice(src.indexOf('<style'))
    expect(style.match(/#[0-9a-fA-F]{6}\b/g) || [], 'hex в <style> ChartContainer').toEqual([])
    expect(/\.dark\s+\./.test(style), '.dark-дубль правила в ChartContainer').toBe(false)
  })
})

describe('ARCH · этапы работ — единый источник src/constants/stages.ts (F-1033, BE F-791)', () => {
  // Владелец 2026-08-29 сменил набор этапов; до этого список жил в ШЕСТИ рукописных копиях
  // (ObjectForm, ObjectInfo, Stocks/List, WriteOffs/List, StockCard, WriteOffCard) и уже расходился
  // (F-910/F-918: мобильная карточка печатала сырой код, desktop — подпись). Теперь — одна константа.
  const files = listFiles(resolve(ROOT, 'src'), /\.(vue|ts)$/)
    .filter(p => !/__tests__|\.test\.ts$|[\\/]src[\\/]test[\\/]/.test(p))
  const read = (p: string) => readFileSync(p, 'utf8')
  const rel = (p: string) => p.slice(ROOT.length + 1)

  it('старые коды этапов не используются как литералы', () => {
    const needle = new RegExp(`["'](?:${'delivery_' + 'fixed'}|${'post_' + 'rough'})["']`)
    expect(files.filter(p => needle.test(read(p))).map(rel)).toEqual([])
  })

  it('пары «код → подпись» этапов — только в constants/stages.ts', () => {
    const pair = /["']?\b(?:start|installation|rework|acceptance|handover)\b["']?\s*[:,]\s*\{?\s*(?:label\s*:\s*)?["'](?:Начало работ|Монтажные работы|Переделки|Приемка|Сдача)["']/
    expect(files.filter(p => pair.test(read(p))).map(rel)).toEqual(['src/constants/stages.ts'])
  })

  it('этап по умолчанию не хардкодится в формах — только DEFAULT_STAGE', () => {
    const literalDefault = /current_stage:\s*(?:[^,\n]*\|\|\s*)?["'](?:start|installation|rework|acceptance|handover)["']/
    expect(files.filter(p => literalDefault.test(read(p))).map(rel)).toEqual([])
  })
})
