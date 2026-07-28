/**
 * ELOM permission/RBAC UI audit harness (autonomous, browser-level).
 *
 * For each seeded QA role, logs into the live app (JWT injection) and walks every list page,
 * inspecting each RBAC-gated ACTION button (edit/delete/issue/return/approve/reject) and the
 * export button. It compares the ACTUAL UI state (visible+enabled vs hidden/disabled) against
 * what that role's permissions actually allow, and reports:
 *   • FAIL-OPEN   — action is clickable but the role LACKS the permission (security/UX bug)
 *   • FAIL-CLOSED — action is hidden/disabled but the role HAS the permission (usability bug)
 * Catches the class of bug unit tests miss (they mock permissions; this is the real render).
 *
 * Run:  node tools/permission-audit/audit.mjs [--base https://elom.uz] [--toks /path/role-toks.json]
 *   role-toks.json: { "qa_admin": {access,refresh}, "qa_manager": {...}, ... }
 *   (generate via Django: RefreshToken.for_user(User.objects.get(username=...)))
 */
import { chromium } from '/opt/elom-frontend/node_modules/playwright/index.mjs'
import fs from 'fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d }
const BASE = arg('--base', 'https://elom.uz')
const TOKS = JSON.parse(fs.readFileSync(arg('--toks', '/tmp/claude-0/-opt/60866a76-1ef8-4cd0-a2b1-96f474b5295d/scratchpad/role-toks.json'), 'utf8'))

// Ground truth is FETCHED at runtime from /rbac/my-permissions (the exact source the FE itself uses),
// so the audit can never drift from a hand-maintained list. Accounts for scope: an action gated by
// `x.edit` is also satisfied by `x.edit_own` (the app allows editing OWN items via the _own scope).
const API = arg('--api', 'https://api.elom.uz/api/v1')
const permCache = {}
async function fetchPerms(token) {
  const res = await fetch(`${API}/rbac/my-permissions/`, { headers: { Authorization: `Bearer ${token}` } })
  const d = await res.json()
  return { super: !!d.is_superuser, set: new Set((d.permissions || []).map(p => p.codename).filter(Boolean)) }
}
const ownVariant = (perm) => perm.replace(/\.(edit|delete|view)$/, '.$1_own')
function roleHas(perms, perm) {
  if (perms.super) return true
  if (perms.set.has(perm)) return true
  const own = ownVariant(perm)
  return own !== perm && perms.set.has(own)
}

// Pages: path, the permission that grants VIEW, and each row action's label + the permission it SHOULD require.
const PAGES = [
  { path: '/materials', view: 'materials.view', actions: [{ label: 'Редактировать', perm: 'materials.edit' }, { label: 'Удалить', perm: 'materials.delete' }] },
  { path: '/tools_index', view: 'tools.view', actions: [{ label: 'Выдать', perm: 'tools.create' }, { label: 'Вернуть', perm: 'tools.edit' }, { label: 'Редактировать', perm: 'tools.edit' }, { label: 'Удалить', perm: 'tools.delete' }] },
  { path: '/tools_issues', view: 'tools.view', actions: [{ label: 'Вернуть', perm: 'tools.edit' }] },
  { path: '/purchases', view: 'purchases.view', actions: [{ label: 'Редактировать', perm: 'purchases.edit' }, { label: 'Удалить', perm: 'purchases.delete' }, { label: 'Одобрить', perm: 'purchases.approve' }, { label: 'Отклонить', perm: 'purchases.reject' }] },
  { path: '/writeoffs', view: 'writeoffs.view', actions: [{ label: 'Редактировать', perm: 'writeoffs.edit' }] },
  { path: '/objects', view: 'objects.view', actions: [{ label: 'Редактировать', perm: 'objects.edit' }, { label: 'Удалить', perm: 'objects.delete' }] },
  { path: '/suppliers', view: 'suppliers.view', actions: [{ label: 'Редактировать', perm: 'suppliers.edit' }, { label: 'Удалить', perm: 'suppliers.delete' }] },
  { path: '/units', view: 'units.view', actions: [{ label: 'Редактировать', perm: 'units.edit' }, { label: 'Удалить', perm: 'units.delete' }] },
  { path: '/employees', view: 'employees.view', actions: [{ label: 'Редактировать', perm: 'employees.edit' }, { label: 'Удалить', perm: 'employees.delete' }] },
]

// Is any button matching this action label visible AND enabled on the page?
async function actionEnabled(page, label) {
  return await page.evaluate((lbl) => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"], summary'))
    const hit = btns.filter(b => {
      const t = (b.getAttribute('title') || '') + ' ' + (b.getAttribute('aria-label') || '') + ' ' + (b.textContent || '')
      return t.includes(lbl)
    })
    for (const b of hit) {
      const cs = getComputedStyle(b)
      const visible = b.offsetParent !== null && cs.visibility !== 'hidden' && cs.display !== 'none'
      const disabled = b.disabled || b.classList.contains('btn-disabled') || b.getAttribute('aria-disabled') === 'true'
      if (visible && !disabled) return true   // at least one live control for this action
    }
    return false
  }, label)
}

const findings = []
const browser = await chromium.launch()
for (const role of Object.keys(TOKS)) {
  const perms = await fetchPerms(TOKS[role].access)
  permCache[role] = perms.super ? 'superuser' : perms.set.size + ' perms'
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, ignoreHTTPSErrors: true })
  const page = await context.newPage()
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.evaluate(([a, r]) => { localStorage.setItem('elom_access', a); localStorage.setItem('elom_refresh', r) }, [TOKS[role].access, TOKS[role].refresh])

  for (const pg of PAGES) {
    await page.goto(BASE + pg.path, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {})
    await page.waitForTimeout(1200)
    const url = page.url()
    const canView = roleHas(perms, pg.view)
    const onPage = url.includes(pg.path)
    if (!onPage) {
      if (canView) findings.push(`FAIL-CLOSED  ${role}  ${pg.path}  -> route blocked but role HAS ${pg.view}`)
      continue // role can't reach page (expected when lacking view)
    }
    // export button
    const exportLive = await actionEnabled(page, 'Экспорт')
    if (exportLive && !roleHas(perms, 'reports.export')) findings.push(`FAIL-OPEN    ${role}  ${pg.path}  -> EXPORT visible but role lacks reports.export`)
    // row actions
    const hasRows = await page.evaluate(() => !!document.querySelector('tbody tr, .card, [data-row]'))
    for (const a of pg.actions) {
      const live = await actionEnabled(page, a.label)
      const allowed = roleHas(perms, a.perm)
      if (live && !allowed) findings.push(`FAIL-OPEN    ${role}  ${pg.path}  -> «${a.label}» clickable but role lacks ${a.perm}`)
      if (!live && allowed && hasRows) findings.push(`fail-closed? ${role}  ${pg.path}  -> «${a.label}» not clickable but role has ${a.perm} (may be state-gated: no eligible row)`)
    }
  }
  await context.close()
}

// ---- Synthetic permission scenarios ("для ВСЕХ разрешений", not just seeded roles) ----
// Mock /rbac/my-permissions to a CRAFTED narrow set and assert mutating actions stay gated.
// Catches LATENT fail-opens (ungated actions / gated by the WRONG permission) that no seeded role
// happens to trigger. Uses a non-super token only for DATA access; the mock drives UI gating.
const DATA_TOKEN = (TOKS.qa_manager || TOKS.qa_admin).access
const DATA_REFRESH = (TOKS.qa_manager || TOKS.qa_admin).refresh
const SYNTH = [
  { name: 'writeoffs view-only, NO edit', perms: ['writeoffs.view', 'writeoffs.view_all'], path: '/writeoffs', mustHide: ['Редактировать'] },
  { name: 'materials edit, NO delete', perms: ['materials.view', 'materials.edit'], path: '/materials', mustHide: ['Удалить'] },
  { name: 'objects edit, NO delete', perms: ['objects.view', 'objects.view_all', 'objects.edit'], path: '/objects', mustHide: ['Удалить'] },
  { name: 'units edit, NO delete', perms: ['units.view', 'units.edit'], path: '/units', mustHide: ['Удалить'] },
  { name: 'employees edit, NO delete', perms: ['employees.view', 'employees.edit'], path: '/employees', mustHide: ['Удалить'] },
  // F-877/F-872: «Добавить» гейтилось по .edit на 6 списках (fail-open для роли edit-без-create).
  // Роль с <res>.edit, но БЕЗ <res>.create не должна видеть активную create-кнопку.
  { name: 'materials edit, NO create', perms: ['materials.view', 'materials.edit'], path: '/materials', mustHide: ['Добавить материал'] },
  { name: 'objects edit, NO create', perms: ['objects.view', 'objects.view_all', 'objects.edit'], path: '/objects', mustHide: ['Добавить объект'] },
  { name: 'units edit, NO create', perms: ['units.view', 'units.edit'], path: '/units', mustHide: ['Добавить единицу'] },
  { name: 'suppliers edit, NO create', perms: ['suppliers.view', 'suppliers.edit'], path: '/suppliers', mustHide: ['Добавить поставщика'] },
  { name: 'tools edit, NO create', perms: ['tools.view', 'tools.edit'], path: '/tools_index', mustHide: ['Добавить инструмент'] },
  { name: 'categories edit, NO create/delete', perms: ['material_categories.view', 'material_categories.edit'], path: '/material_categories', mustHide: ['Добавить категорию', 'Удалить'] },
]
for (const sc of SYNTH) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, ignoreHTTPSErrors: true })
  const page = await context.newPage()
  await page.route('**/rbac/my-permissions/**', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ is_superuser: false, permissions: sc.perms.map(c => ({ codename: c })) }),
  }))
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.evaluate(([a, r]) => { localStorage.setItem('elom_access', a); localStorage.setItem('elom_refresh', r) }, [DATA_TOKEN, DATA_REFRESH])
  await page.goto(BASE + sc.path, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(1200)
  const hasRows = await page.evaluate(() => !!document.querySelector('tbody tr, .card'))
  for (const label of sc.mustHide) {
    const live = await actionEnabled(page, label)
    if (live) findings.push(`FAIL-OPEN    [synth] ${sc.name}  ${sc.path}  -> «${label}» clickable; perms=[${sc.perms.join(', ')}]`)
    else if (!hasRows) findings.push(`skip         [synth] ${sc.name}  ${sc.path}  -> no rows to test «${label}»`)
  }
  await context.close()
}
await browser.close()

const failOpen = findings.filter(f => f.startsWith('FAIL-OPEN'))
const failClosed = findings.filter(f => f.startsWith('FAIL-CLOSED'))
const soft = findings.filter(f => f.startsWith('fail-closed?'))
console.log('\n================ PERMISSION UI AUDIT ================')
console.log(`FAIL-OPEN (role sees action it must NOT): ${failOpen.length}`)
failOpen.forEach(f => console.log('  ' + f))
console.log(`FAIL-CLOSED (route blocked despite perm): ${failClosed.length}`)
failClosed.forEach(f => console.log('  ' + f))
console.log(`soft/informational (not clickable despite perm — often just no eligible row): ${soft.length}`)
soft.forEach(f => console.log('  ' + f))
console.log('====================================================')
process.exit(failOpen.length > 0 ? 1 : 0)
