/**
 * ELOM export-button TOUCH test harness (autonomous).
 *
 * Regression guard for F-860 ("кнопка Экспорт не нажимается"): on real TOUCH devices (iOS/WebKit,
 * Android/Chromium, tablet) it TAPS (not clicks) the Export button on every export-enabled list page
 * and verifies:
 *   • the <details> menu OPENS on tap,
 *   • each format POSITION (CSV / Excel / PDF) is present + tappable,
 *   • Excel (server-side export) actually FIRES a download when tapped — i.e. export works end-to-end
 *     via touch, not just that the menu opens.
 * The old <div tabindex role=button> focus-dropdown did NOT open on iOS tap; this pins that shut.
 *
 * Run:  node tools/export-touch/audit.mjs --base https://elom.uz --toks /path/role-toks.json
 *   (needs qa_admin token — it holds reports.export so the button renders, and sees data everywhere)
 */
import { webkit, chromium, devices } from '/opt/elom-frontend/node_modules/playwright/index.mjs'
import fs from 'fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d }
const BASE = arg('--base', 'https://elom.uz')
const TOKS = JSON.parse(fs.readFileSync(arg('--toks', '/tmp/claude-0/-opt/60866a76-1ef8-4cd0-a2b1-96f474b5295d/scratchpad/role-toks.json'), 'utf8'))
const ADMIN = TOKS.qa_admin
const API = arg('--api', 'https://api.elom.uz/api/v1')
// The whole run (3 devices × 8 pages + downloads) outlives a short-lived access token, so refresh a
// fresh access per device from the refresh token — otherwise later devices 401 → redirect to /login.
async function freshAccess(refresh) {
  try {
    const res = await fetch(`${API}/auth/token/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) })
    const d = await res.json()
    return d.access || ADMIN.access
  } catch { return ADMIN.access }
}

const DEVICES = [
  { name: 'iPhone-15-Pro (iOS/WebKit)', engine: webkit, ctx: devices['iPhone 15 Pro'] },
  { name: 'iPad-Pro-11 (WebKit)', engine: webkit, ctx: devices['iPad Pro 11'] },
  { name: 'Pixel-7 (Android/Chromium)', engine: chromium, ctx: devices['Pixel 7'] },
]
const PAGES = ['/materials', '/purchases', '/objects', '/units', '/stocks', '/writeoffs', '/tools_index', '/tools_issues']
const FORMATS = ['CSV', 'Excel', 'PDF']

const results = []
for (const dev of DEVICES) {
  const browser = await dev.engine.launch()
  const context = await browser.newContext({ ...dev.ctx, ignoreHTTPSErrors: true, acceptDownloads: true })
  const page = await context.newPage()
  const access = await freshAccess(ADMIN.refresh)  // fresh per device — avoids mid-run token expiry
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.evaluate(([a, r]) => { localStorage.setItem('elom_access', a); localStorage.setItem('elom_refresh', r) }, [access, ADMIN.refresh])

  for (const path of PAGES) {
    const row = { dev: dev.name, path, button: false, opened: null, fmt: {}, excelDownload: false, note: '' }
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {})
      await page.waitForTimeout(1200)
      const trigger = page.locator('.export-trigger').first()
      if (!await trigger.isVisible().catch(() => false)) { row.note = 'no export button'; results.push(row); continue }
      row.button = true

      // TAP (touch) to open the <details> menu
      await trigger.tap()
      await page.waitForTimeout(400)
      row.opened = await page.evaluate(() => {
        const t = document.querySelector('.export-trigger'); const d = t && t.closest('details'); return d ? !!d.open : null
      })
      // each format position tappable AND not clipped/covered — elementFromPoint at the button's
      // centre must return the button itself; if an ancestor's overflow:hidden clips it (or something
      // overlaps it) the topmost element there is NOT the button → caught (the owner's list-header bug).
      for (const f of FORMATS) {
        row.fmt[f] = await page.locator('.dropdown-content button', { hasText: f }).first().evaluate(b => {
          const cs = getComputedStyle(b)
          if (b.offsetParent === null || cs.visibility === 'hidden' || b.disabled) return false
          const r = b.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) return false
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2
          if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) return false  // off-screen / clipped by viewport
          const top = document.elementFromPoint(cx, cy)
          return !!(top && (top === b || b.contains(top) || top.contains(b)))  // topmost here = the button (not clipped/covered)
        }).catch(() => false)
      }
      // Excel = server-side export: tapping it must fire a download (proves export works via touch)
      try {
        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 10000 }),
          page.locator('.dropdown-content button', { hasText: 'Excel' }).first().tap(),
        ])
        row.excelDownload = !!(await download.suggestedFilename())
      } catch { row.excelDownload = false }
    } catch (e) { row.note = 'ERROR ' + e.message }
    results.push(row)
  }
  await browser.close()
}

// ---- report ----
let fails = 0
console.log('\n================ EXPORT TOUCH TEST ================')
for (const r of results) {
  if (!r.button) { console.log(`  ~  ${r.dev}  ${r.path}  -> ${r.note}`); continue }
  const fmtOk = FORMATS.every(f => r.fmt[f])
  const pass = r.opened === true && fmtOk && r.excelDownload
  if (!pass) fails++
  const fmtStr = FORMATS.map(f => `${f}:${r.fmt[f] ? '✓' : '✗'}`).join(' ')
  console.log(`  ${pass ? 'PASS ✓' : 'FAIL ✗'}  ${r.dev}  ${r.path}  -> opens=${r.opened} | ${fmtStr} | Excel-download=${r.excelDownload ? '✓' : '✗'} ${r.note}`)
}
console.log(`--------------------------------------------------`)
console.log(`${fails === 0 ? 'ALL GREEN' : fails + ' FAILING'} (touch tap → menu opens → 3 formats tappable → Excel exports)`)
console.log('==================================================')
process.exit(fails > 0 ? 1 : 0)
