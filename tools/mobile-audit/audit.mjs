/**
 * ELOM mobile/device UI audit harness (autonomous).
 *
 * Emulates a device matrix (iOS/WebKit, Android/Chromium, tablet, desktop) against the
 * live/staging site, and for each (device × route) captures a screenshot plus automated
 * responsiveness checks: horizontal overflow, undersized tap targets, console errors,
 * failed requests. Auth via injected JWT (token file), no prod mutations.
 *
 * Run:  node tools/mobile-audit/audit.mjs [--base https://elom.uz] [--tokens /tmp/toks.json] [--out DIR]
 *   tokens file (optional): {"access":"...","refresh":"..."} — injected into localStorage
 *   (keys elom_access / elom_refresh). Without it, only public routes (login) are meaningful.
 *
 * Tap-target thresholds: 44px (iOS HIG) / 48px (Android Material) — we flag < 44.
 */
import { webkit, chromium, devices } from '/opt/elom-frontend/node_modules/playwright/index.mjs'
import fs from 'fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d }
const BASE = arg('--base', 'https://elom.uz')
const TOKENS = arg('--tokens', '')
const OUT = arg('--out', '/tmp/claude-0/-opt/60866a76-1ef8-4cd0-a2b1-96f474b5295d/scratchpad/mobile-audit')
const TAP_MIN = 44

const DEVICE_MATRIX = [
  { name: 'iphone-15-pro', engine: webkit, ctx: devices['iPhone 15 Pro'], mobile: true },   // iOS / Safari
  { name: 'pixel-7', engine: chromium, ctx: devices['Pixel 7'], mobile: true },             // Android / Chrome
  { name: 'ipad-pro-11', engine: webkit, ctx: devices['iPad Pro 11'], mobile: true },       // tablet
  { name: 'desktop-1366', engine: chromium, ctx: { viewport: { width: 1366, height: 900 } } },  // мышь: pointer:fine
]

// route: path; modal:true => navigating to a /create route auto-opens the form modal.
const _lists = ['/purchases', '/writeoffs', '/balances', '/stocks', '/tools_index', '/tools_issues',
  '/materials', '/material_categories', '/objects', '/suppliers', '/units', '/employees',
  '/archive-periods', '/rbac/roles', '/reports/by-period', '/reports/by-object',
  '/reports/by-material', '/reports/by-responsible']
const _forms = [['/purchases/create', 'form-purchase'], ['/writeoffs/create', 'form-writeoff'],
  ['/materials/create', 'form-material'], ['/objects/create', 'form-object'],
  ['/suppliers/create', 'form-supplier'], ['/units/create', 'form-unit'],
  ['/material_categories/create', 'form-category'], ['/employees/create', 'form-employee'],
  ['/rbac/roles/create', 'form-role']]
const ROUTES = [
  { path: '/login', auth: false, label: 'login' },
  ..._lists.map(p => ({ path: p, label: p.replace(/^\//, '').replace(/\//g, '-') })),
  ..._forms.map(([p, label]) => ({ path: p, label, modal: true })),
]

const CHECK = `() => {
  const vw = document.documentElement.clientWidth
  const out = { vw, overflow: false, overflowPx: 0, wideEls: [], smallTargets: 0, smallSample: [], tinyText: 0 }
  const sw = document.documentElement.scrollWidth
  if (sw > vw + 2) { out.overflow = true; out.overflowPx = sw - vw }
  const seen = new Set()
  document.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect()
    if (r.width > vw + 2 && r.height > 4) {
      const key = el.tagName + '.' + (el.className && el.className.toString ? el.className.toString().slice(0,40) : '')
      if (!seen.has(key)) { seen.add(key); if (out.wideEls.length < 8) out.wideEls.push({ el: key, w: Math.round(r.width) }) }
    }
  })
  document.querySelectorAll('button, a[href], input:not([type=hidden]), select, [role=button], [role=tab]').forEach(el => {
    // F-623: измеряем ЭФФЕКТИВНУЮ тач-цель, а не сам элемент. Чекбокс/радио обычно обёрнут в
    // кликабельный <label> (клик по всей строке переключает control) — раньше мерили 20x20 input
    // и ложно флагали десятки controls в формах ролей/прав. Для input берём ближайший
    // кликабельный предок (label/button/[role=button]/a), если он есть, иначе сам элемент.
    let target = el
    const semantic = el.closest('label, button, a[href], [role=button]')
    if (semantic && semantic !== el) {
      target = semantic
    } else {
      // Кликабельная строка без ARIA-семантики (Vue @click + cursor:pointer — распространённый
      // паттерн строк-чекбоксов/ролей в этом приложении): эффективная тач-цель = вся строка.
      let a = el.parentElement, hops = 0
      while (a && hops < 4) {
        const ar = a.getBoundingClientRect()
        if (getComputedStyle(a).cursor === 'pointer' && ar.height >= ${TAP_MIN} && ar.width >= ${TAP_MIN}) { target = a; break }
        a = a.parentElement; hops++
      }
    }
    const r = target.getBoundingClientRect()
    const vis = r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
    // F-715: округляем — min-height:44px рендерится как 43.99px (sub-pixel box), строгий <44 давал
    // ложный флаг на технически-соответствующих 44px-целях. Round(43.99)=44 → не флаг; 42/40/31 → флаг.
    if (vis && (Math.round(r.width) < ${TAP_MIN} || Math.round(r.height) < ${TAP_MIN})) {
      out.smallTargets++
      if (out.smallSample.length < 6) out.smallSample.push({ tag: el.tagName.toLowerCase(), w: Math.round(r.width), h: Math.round(r.height), t: (el.textContent||'').trim().slice(0,24) })
    }
  })
  document.querySelectorAll('p, span, td, label, li').forEach(el => {
    const fs = parseFloat(getComputedStyle(el).fontSize)
    if (fs && fs < 11 && (el.textContent||'').trim().length > 2) out.tinyText++
  })
  return out
}`

const token = TOKENS && fs.existsSync(TOKENS) ? JSON.parse(fs.readFileSync(TOKENS, 'utf8')) : null
fs.mkdirSync(OUT, { recursive: true })
const report = { base: BASE, generatedFor: DEVICE_MATRIX.map(d => d.name), devices: {} }

for (const dev of DEVICE_MATRIX) {
  const browser = await dev.engine.launch()
  const ctx = await browser.newContext(dev.ctx)
  const page = await ctx.newPage()
  // F-715 (harness fix): touch-девайсы матрицы (iPhone/iPad webkit, Pixel chromium) УЖЕ репортят
  // `pointer: coarse` через playwright device-эмуляцию — проверено напрямую: matchMedia('(pointer:
  // coarse)') === true на всех трёх БЕЗ каких-либо CDP-хаков. Значит @media(pointer:coarse) правила
  // (F-865 min-height:44 у меню экспорта) применяются штатно на ОБОИХ движках (замер: кнопки CSV/Excel
  // = 44px и на webkit, и на chromium). Прежние engine-зависимые «<44px» были НЕ из-за отсутствия
  // coarse (ложная гипотеза), а из-за (а) протухшего токена → редирект на /login с полу-отрисованным
  // DOM и (б) замера пунктов dropdown в свёрнутом/недо-reflow состоянии. Лечится валидным токеном +
  // открытием меню и reflow-тиком (ниже) + округлением sub-pixel (в CHECK). CDP-форсинг coarse убран
  // как основанный на неверном диагнозе. Desktop-1366 — pointer:fine (мышь), 44px не требуется.
  const consoleErrors = [], failedReq = []
  // F-625: Playwright headless-WebKit НЕ поддерживает Service Workers (офиц. Chromium-only) и на
  // КАЖДОЙ холодной загрузке эмитит «Cannot load …/sw.js due to access control checks», ХОТЯ SW
  // фактически регистрируется и контролирует страницу (проверено: 6/6 cold loads → regs=1,
  // controller=yes; nginx отдаёт sw.js 200/application-javascript/no-redirect/no-CSP). Это артефакт
  // харнесса, а не дефект приложения — глушим ровно эту строку, чтобы аудит не флагал не-проблему.
  const isSwArtifact = t => /sw\.js.*access control|access control checks.*sw\.js|cannot load\s+\S*sw\.js/i.test(String(t))
  page.on('console', m => { if (m.type() === 'error' && !isSwArtifact(m.text())) consoleErrors.push(m.text().slice(0, 160)) })
  page.on('pageerror', e => { if (!isSwArtifact(e)) consoleErrors.push('PAGEERROR ' + String(e).slice(0, 160)) })
  page.on('requestfailed', r => { const u = r.url(); if (!/sw\.js|\.woff2|\.ttf/.test(u)) failedReq.push(`FAIL ${r.method()} ${u}`) })
  page.on('response', r => { const s = r.status(); if (s >= 400) failedReq.push(`${s} ${r.request().method()} ${r.url()}`) })

  if (token) {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' }).catch(() => {})
    await page.evaluate(([a, r]) => { localStorage.setItem('elom_access', a); localStorage.setItem('elom_refresh', r) }, [token.access, token.refresh])
  }

  const routes = {}
  for (const route of ROUTES) {
    if (route.auth === false ? false : !token) continue
    const cBefore = consoleErrors.length, fBefore = failedReq.length
    try {
      await page.goto(BASE + route.path, { waitUntil: 'networkidle', timeout: 25000 })
      await page.waitForTimeout(route.modal ? 1300 : 600)  // modal routes auto-open a form
    } catch (e) { routes[route.label] = { error: String(e).slice(0, 90) }; continue }
    // F-715: раскрываем dropdown-меню (экспорт) ПЕРЕД замером + даём reflow-тик, чтобы их пункты
    // мерились в ОТКРЫТОМ (тапабельном) состоянии с применённым @media(pointer:coarse) min-height.
    // Overflow/wideEls меряются в CHECK по scrollWidth (popover positioned, документ не расширяет).
    await page.evaluate(() => document.querySelectorAll('details.dropdown').forEach(d => { d.open = true })).catch(() => {})
    await page.waitForTimeout(350)  // reflow: chromium применяет min-height:44 к только что показанному popover
    const checks = await page.evaluate(eval('(' + CHECK + ')')).catch(() => null)
    await page.screenshot({ path: `${OUT}/${dev.name}__${route.label}.png`, fullPage: !route.modal }).catch(() => {})
    routes[route.label] = {
      overflow: checks?.overflow, overflowPx: checks?.overflowPx, wideEls: checks?.wideEls,
      smallTargets: checks?.smallTargets, smallSample: checks?.smallSample, tinyText: checks?.tinyText,
      consoleErrors: consoleErrors.slice(cBefore), failedReq: failedReq.slice(fBefore),
    }
  }
  report.devices[dev.name] = { viewport: dev.ctx.viewport, routes }
  await browser.close()
  console.log(`${dev.name}: audited ${Object.keys(routes).length} routes`)
}

fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2))
console.log('report:', `${OUT}/report.json`)
