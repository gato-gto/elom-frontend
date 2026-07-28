/**
 * ELOM FULL mobile touch/readability audit harness (autonomous, measured).
 * Implements tools/mobile-audit/FULL_MOBILE_AUDIT_PROMPT.md (automatable classes).
 *
 * For each device × page it enumerates interactive elements and MEASURES issues:
 *   - body horizontal overflow (+ offending elements wider than viewport)
 *   - tap targets < 44x44 (visible, enabled interactive controls)
 *   - inputs/selects with font-size < 16px  -> iOS zoom-on-focus
 *   - visible text with font-size < 12px     -> tiny text
 *   - low text contrast (< WCAG AA 4.5)      -> readability
 *   - dropdown/menu clipping: tap it, then elementFromPoint at each item centre (F-864 class)
 *   - mobile-sort control presence on list pages
 * Emits machine-readable findings JSON (for downstream root-cause workflow) + a console summary.
 *
 * Run: node tools/mobile-audit/full-audit.mjs --toks /path/role-toks.json [--out findings.json]
 */
import { webkit, chromium, devices } from '/opt/elom-frontend/node_modules/playwright/index.mjs'
import fs from 'fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d }
const BASE = arg('--base', 'https://elom.uz')
const API = arg('--api', 'https://api.elom.uz/api/v1')
const OUT = arg('--out', '/tmp/claude-0/-opt/60866a76-1ef8-4cd0-a2b1-96f474b5295d/scratchpad/mobile-findings.json')
const TOKS = JSON.parse(fs.readFileSync(arg('--toks', '/tmp/claude-0/-opt/60866a76-1ef8-4cd0-a2b1-96f474b5295d/scratchpad/role-toks.json'), 'utf8'))
const ADMIN = TOKS.qa_admin
// NB: ROTATE_REFRESH_TOKENS+BLACKLIST are ON, so refreshing blacklists the token — do NOT refresh
// per device. Access lifetime is 30 min; the whole run fits inside that on a FRESHLY minted token.
// Re-mint role-toks.json (Django RefreshToken.for_user) immediately before running.

const DEVICES = [
  { name: 'iPhone-15-Pro', engine: webkit, ctx: devices['iPhone 15 Pro'] },
  { name: 'iPhone-SE-small', engine: webkit, ctx: { ...devices['iPhone SE'] } },
  { name: 'Pixel-7', engine: chromium, ctx: devices['Pixel 7'] },
  { name: 'iPad-Pro-11', engine: webkit, ctx: devices['iPad Pro 11'] },
]
const LIST_PAGES = ['/materials', '/purchases', '/writeoffs', '/objects', '/suppliers', '/units', '/employees', '/material_categories', '/tools_index', '/tools_issues', '/balances', '/stocks']
const OTHER_PAGES = ['/', '/archive-periods', '/rbac/roles', '/reports/by-material', '/reports/by-object', '/reports/by-period', '/reports/by-responsible']
const FORM_PAGES = ['/materials/create', '/purchases/create', '/objects/create', '/suppliers/create', '/units/create', '/employees/create']
const PAGES = [...LIST_PAGES, ...OTHER_PAGES, ...FORM_PAGES]

// in-page measurement — returns raw issues for the current DOM
const MEASURE = () => {
  const out = { overflow: null, wideEls: [], smallTaps: [], zoomInputs: [], tinyText: [], lowContrast: [], mobileSort: null }
  const vw = window.innerWidth, vh = window.innerHeight
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && el.offsetParent !== null }
  const label = (el) => (el.getAttribute('aria-label') || el.getAttribute('title') || (el.textContent || '').trim().slice(0, 30) || el.tagName.toLowerCase())
  const sel = (el) => { const c = (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || ''; return el.tagName.toLowerCase() + (typeof c === 'string' && c ? '.' + c.trim().split(/\s+/).slice(0, 2).join('.') : '') }

  // body horizontal overflow
  const se = document.scrollingElement || document.documentElement
  out.overflow = se.scrollWidth - vw
  if (out.overflow > 2) {
    for (const el of document.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.right > vw + 2 && r.width <= vw + 40 && vis(el) && r.width > 40) { out.wideEls.push({ sel: sel(el), right: Math.round(r.right), w: Math.round(r.width) }) }
      if (out.wideEls.length > 8) break
    }
  }
  // tap targets < 44 (interactive, visible, enabled)
  const INTERACTIVE = 'button, a[href], [role="button"], summary, select, input:not([type="hidden"]), textarea, [tabindex]:not([tabindex="-1"])'
  const seenTap = new Set()
  for (const el of document.querySelectorAll(INTERACTIVE)) {
    if (!vis(el) || el.disabled) continue
    const r = el.getBoundingClientRect()
    const m = Math.min(r.width, r.height)
    if (m < 44) {
      const key = sel(el) + '|' + label(el)
      if (seenTap.has(key)) continue; seenTap.add(key)
      out.smallTaps.push({ sel: sel(el), label: label(el), w: Math.round(r.width), h: Math.round(r.height) })
      if (out.smallTaps.length > 25) break
    }
  }
  // inputs with font < 16 -> iOS zoom-on-focus
  for (const el of document.querySelectorAll('input:not([type=hidden]), select, textarea')) {
    if (!vis(el)) continue
    const fs = parseFloat(getComputedStyle(el).fontSize)
    if (fs < 16) { out.zoomInputs.push({ sel: sel(el), label: label(el), fontSize: Math.round(fs * 10) / 10 }); if (out.zoomInputs.length > 20) break }
  }
  // tiny text + low contrast (sample visible text leaves)
  const parseRGB = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(x => parseFloat(x)); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] } }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b) }
  const effBg = (el) => { let n = el; while (n && n !== document.documentElement) { const bg = parseRGB(getComputedStyle(n).backgroundColor); if (bg && bg.a > 0.5) return bg; n = n.parentElement } return { r: 255, g: 255, b: 255, a: 1 } }
  let textSampled = 0
  for (const el of document.querySelectorAll('body *')) {
    if (textSampled > 400) break
    if (!el.childNodes.length) continue
    const direct = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 1)
    if (!direct || !vis(el)) continue
    textSampled++
    const cs = getComputedStyle(el)
    const fs = parseFloat(cs.fontSize)
    if (fs < 12) { out.tinyText.push({ sel: sel(el), text: (el.textContent || '').trim().slice(0, 24), fontSize: Math.round(fs * 10) / 10 }); }
    const fg = parseRGB(cs.color); if (!fg) continue
    const bg = effBg(el)
    const L1 = lum(fg) + 0.05, L2 = lum(bg) + 0.05
    const ratio = (Math.max(L1, L2) / Math.min(L1, L2))
    const big = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight) >= 700)
    if (ratio < (big ? 3 : 4.5) && (el.textContent || '').trim().length > 1) {
      out.lowContrast.push({ sel: sel(el), text: (el.textContent || '').trim().slice(0, 24), ratio: Math.round(ratio * 100) / 100, fontSize: Math.round(fs) })
    }
    if (out.tinyText.length > 15) break
  }
  out.lowContrast = out.lowContrast.slice(0, 12)
  // mobile sort control
  out.mobileSort = !!document.querySelector('.mobile-sort, .mobile-sort-select')
  return out
}

// dropdown clip probe: tap the export trigger (representative dropdown) and check each item unclipped
async function dropdownClip(page) {
  const trig = page.locator('.export-trigger, .dropdown [role=button], details.dropdown summary').first()
  if (!await trig.isVisible().catch(() => false)) return null
  await trig.tap().catch(() => {})
  await page.waitForTimeout(350)
  return await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.dropdown-content button, .dropdown-content a, .dropdown-content li'))
    if (!items.length) return { opened: false }
    let clipped = 0
    for (const b of items) {
      const r = b.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2
      if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) { clipped++; continue }
      const top = document.elementFromPoint(cx, cy)
      if (!(top && (top === b || b.contains(top) || top.contains(b)))) clipped++
    }
    return { opened: true, items: items.length, clipped }
  })
}

const findings = []
for (const dev of DEVICES) {
  const browser = await dev.engine.launch()
  const context = await browser.newContext({ ...dev.ctx, ignoreHTTPSErrors: true, acceptDownloads: true })
  const page = await context.newPage()
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
  await page.evaluate(([a, r]) => { localStorage.setItem('elom_access', a); localStorage.setItem('elom_refresh', r) }, [ADMIN.access, ADMIN.refresh])
  // FAIL FAST: if the token is stale, every page redirects to /login and we'd measure the login
  // screen and report bogus zeros. Probe once and abort loudly instead.
  await page.goto(BASE + '/materials', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(800)
  if (page.url().includes('/login')) {
    console.error(`\n*** AUTH FAILED (${dev.name}): token rejected → redirected to /login. Re-mint role-toks.json and re-run. ***\n`)
    await browser.close(); process.exit(2)
  }

  for (const path of PAGES) {
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {})
      await page.waitForTimeout(1200)
      if (!page.url().includes(path) && path !== '/') { findings.push({ dev: dev.name, path, blocked: page.url() }); continue }
      const m = await page.evaluate(MEASURE)
      const clip = LIST_PAGES.includes(path) ? await dropdownClip(page).catch(() => null) : null
      findings.push({ dev: dev.name, vw: dev.ctx.viewport?.width, path, ...m, dropdown: clip })
    } catch (e) { findings.push({ dev: dev.name, path, error: String(e.message).slice(0, 80) }) }
  }
  await browser.close()
}

fs.writeFileSync(OUT, JSON.stringify(findings, null, 2))

// ---- console summary ----
const count = (pred) => findings.reduce((n, f) => n + (pred(f) || 0), 0)
console.log('\n============ FULL MOBILE AUDIT (measured) ============')
console.log('devices:', DEVICES.map(d => d.name).join(', '))
console.log('pages/device:', PAGES.length, '| findings rows:', findings.length, '| json:', OUT)
console.log('--- raw signal counts (candidates, pre-verification) ---')
console.log('  body-overflow pages:', count(f => f.overflow > 2 ? 1 : 0))
console.log('  small-tap controls:', count(f => f.smallTaps?.length || 0))
console.log('  zoom-risk inputs:  ', count(f => f.zoomInputs?.length || 0))
console.log('  tiny-text nodes:   ', count(f => f.tinyText?.length || 0))
console.log('  low-contrast nodes:', count(f => f.lowContrast?.length || 0))
console.log('  clipped dropdowns: ', count(f => f.dropdown?.clipped > 0 ? 1 : 0))
console.log('  list pages missing mobile-sort:', count(f => (LIST_PAGES.includes(f.path) && f.mobileSort === false) ? 1 : 0))
console.log('  blocked routes:    ', count(f => f.blocked ? 1 : 0))
// top offenders
const overflowPages = [...new Set(findings.filter(f => f.overflow > 2).map(f => `${f.path}@${f.dev}(${f.overflow}px)`))]
if (overflowPages.length) console.log('  OVERFLOW:', overflowPages.slice(0, 12).join(', '))
const clips = findings.filter(f => f.dropdown?.clipped > 0).map(f => `${f.path}@${f.dev}(${f.dropdown.clipped})`)
if (clips.length) console.log('  DROPDOWN CLIP:', clips.join(', '))
console.log('======================================================')
