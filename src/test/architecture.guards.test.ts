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
  it('модальные keyframes (modal*) не содержат transform', () => {
    for (const rel of ['src/styles/components.css', 'src/styles/animations.css']) {
      const css = readFileSync(resolve(ROOT, rel), 'utf8')
      for (const m of css.matchAll(/@keyframes\s+(modal\w*)\s*\{([\s\S]*?)\n\}/g)) {
        expect(
          /transform\s*:/.test(m[2]),
          `${rel}: @keyframes ${m[1]} содержит transform — ломает якорь iOS select-поповера (F-996)`,
        ).toBe(false)
      }
    }
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
