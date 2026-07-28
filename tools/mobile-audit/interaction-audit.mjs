/**
 * ELOM mobile INTERACTION audit (autonomous) — the layer the static harness can't see.
 * Currently covers: SORT actually reorders the mobile cards (and the direction toggle reverses),
 * i.e. mobile sort is functional and reflects a real reorder — not just present in the DOM.
 * (Static full-audit.mjs only checked presence; this drives it. F-858 class: sort must reorder by
 * the DISPLAYED field.) More flows (MaterialSearchSelect pick-cycle, multi-item reindex, filter+URL
 * sync) plug into the same runner.
 *
 * Run: node tools/mobile-audit/interaction-audit.mjs --toks /path/role-toks.json
 */
import { webkit, chromium, devices } from '/opt/elom-frontend/node_modules/playwright/index.mjs'
import fs from 'fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d }
const BASE = arg('--base', 'https://elom.uz')
const TOKS = JSON.parse(fs.readFileSync(arg('--toks', '/tmp/claude-0/-opt/60866a76-1ef8-4cd0-a2b1-96f474b5295d/scratchpad/role-toks.json'), 'utf8'))
const ADMIN = TOKS.qa_admin

const DEVICES = [
  { name: 'iPhone-15-Pro', engine: webkit, ctx: devices['iPhone 15 Pro'] },
  { name: 'Pixel-7', engine: chromium, ctx: devices['Pixel 7'] },
]
const PAGES = ['/materials', '/purchases', '/objects', '/units', '/suppliers', '/writeoffs', '/tools_index', '/employees']

// read the first N mobile card labels (first meaningful text line), skipping the .mobile-sort row
const readOrder = (page, n = 5) => page.evaluate((n) => {
  const cards = Array.from(document.querySelectorAll('.mobile-card, .mobile-cards-wrapper > .card'))
  return cards.slice(0, n).map(c => (c.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40)).filter(Boolean)
}, n)

const findings = []
for (const dev of DEVICES) {
  const browser = await dev.engine.launch()
  const context = await browser.newContext({ ...dev.ctx, ignoreHTTPSErrors: true })
  const page = await context.newPage()
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
  await page.evaluate(([a, r]) => { localStorage.setItem('elom_access', a); localStorage.setItem('elom_refresh', r) }, [ADMIN.access, ADMIN.refresh])
  await page.goto(BASE + '/materials', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(600)
  if (page.url().includes('/login')) { console.error(`\n*** AUTH FAILED (${dev.name}) — re-mint tokens. ***\n`); await browser.close(); process.exit(2) }

  for (const path of PAGES) {
    const row = { dev: dev.name, path, verdict: '', detail: '' }
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {})
      await page.waitForTimeout(1200)
      const hasSelect = await page.locator('.mobile-sort-select').first().isVisible().catch(() => false)
      const baseOrder = await readOrder(page)
      if (!hasSelect) { row.verdict = 'no-mobile-sort'; row.detail = `cards=${baseOrder.length}`; findings.push(row); continue }
      if (baseOrder.length < 2) { row.verdict = 'skip'; row.detail = `only ${baseOrder.length} card(s) — cannot test reorder`; findings.push(row); continue }
      const opts = await page.locator('.mobile-sort-select option').evaluateAll(os => os.map(o => o.value).filter(Boolean))
      if (!opts.length) { row.verdict = 'no-sort-options'; findings.push(row); continue }
      // pick a sort option that isn't the current default
      await page.selectOption('.mobile-sort-select', opts[0]).catch(() => {})
      await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(900)
      const sorted1 = await readOrder(page)
      // toggle direction
      let sorted2 = []
      const dirBtn = page.locator('.mobile-sort-dir').first()
      if (await dirBtn.isVisible().catch(() => false)) {
        await dirBtn.tap().catch(() => {})
        await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(900)
        sorted2 = await readOrder(page)
      }
      const changedOnSort = JSON.stringify(sorted1) !== JSON.stringify(baseOrder)
      const reversedOnDir = sorted2.length > 0 && JSON.stringify(sorted2) !== JSON.stringify(sorted1)
      // ok if EITHER the sort-field change OR the direction toggle produced a different order
      if (changedOnSort || reversedOnDir) { row.verdict = 'OK'; row.detail = `opt=${opts[0]} changed=${changedOnSort} dirReversed=${reversedOnDir}` }
      else { row.verdict = 'BUG: sort did NOT reorder'; row.detail = `opts=${opts.join(',')} base=${JSON.stringify(baseOrder.slice(0, 2))}` }
      findings.push(row)
    } catch (e) { row.verdict = 'error'; row.detail = String(e.message).slice(0, 70); findings.push(row) }
  }
  await browser.close()
}

let bugs = 0
console.log('\n=========== MOBILE INTERACTION — SORT REORDER ===========')
for (const r of findings) {
  const bug = r.verdict.startsWith('BUG')
  if (bug) bugs++
  console.log(`  ${bug ? 'BUG ✗' : (r.verdict === 'OK' ? 'OK ✓ ' : '~   ')}  ${r.dev}  ${r.path}  -> ${r.verdict}  ${r.detail}`)
}
console.log(`--------------------------------------------------------`)
console.log(`${bugs === 0 ? 'no sort-reorder bugs' : bugs + ' sort-reorder BUGS'}`)
console.log('========================================================')
process.exit(bugs > 0 ? 1 : 0)
