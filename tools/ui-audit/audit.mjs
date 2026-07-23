import { chromium } from 'playwright'
import { readFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs'

const D = process.env.OUT_DIR || './ui-audit-out'
const SHOTS = D + '/shots'
mkdirSync(SHOTS, { recursive: true })
const OUT = D + '/findings2.jsonl'
const tokens = JSON.parse(readFileSync(D + '/tokens.json', 'utf8'))
const ids = JSON.parse(readFileSync(D + '/ids.json', 'utf8'))
const BASE = process.env.BASE_URL || 'https://elom.uz'
const ONLY = (process.env.PASS || 'ABCDE').split('')

const R = {
  dashboard: '/', purchases: '/purchases', purchaseCreate: '/purchases/create',
  purchaseEdit: `/purchases/${ids.purchase}/edit`, purchasePrint: `/purchases/${ids.purchase}/print`,
  writeoffs: '/writeoffs', writeoffCreate: '/writeoffs/create',
  stocks: '/stocks', balances: '/balances', archive: '/archive-periods',
  objects: '/objects', objectInfo: `/objects/${ids.object}`, objectCreate: '/objects/create',
  materials: '/materials', materialCreate: '/materials/create',
  categories: '/material_categories', categoryInfo: `/material_categories/${ids.category}`,
  employees: '/employees', employeeCreate: '/employees/create',
  suppliers: '/suppliers', supplierCreate: '/suppliers/create',
  units: '/units', unitCreate: '/units/create',
  tools: '/tools_index', toolIssues: '/tools_issues',
  reportObject: '/reports/by-object', reportMaterial: '/reports/by-material',
  reportPeriod: '/reports/by-period', reportResp: '/reports/by-responsible',
  rbac: '/rbac/roles',
}

const PAGE_AUDIT = () => {
  // Canvas-based resolution: handles oklab/oklch/color-mix AND alpha compositing -> true sRGB
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const cx = cv.getContext('2d', { willReadFrequently: true })
  const px = () => { const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]] }
  const solid = (color) => { cx.clearRect(0,0,1,1); cx.fillStyle = 'rgb(255,255,255)'; cx.fillRect(0,0,1,1); cx.fillStyle = color; cx.fillRect(0,0,1,1); return px() }
  const over = (color, bg) => { cx.clearRect(0,0,1,1); cx.fillStyle = `rgb(${bg.join(',')})`; cx.fillRect(0,0,1,1); cx.fillStyle = color; cx.fillRect(0,0,1,1); return px() }
  const isOpaque = (color) => { // alpha>=0.6 ?
    const a = solid(color), bOnBlack = (() => { cx.clearRect(0,0,1,1); cx.fillStyle='rgb(0,0,0)'; cx.fillRect(0,0,1,1); cx.fillStyle=color; cx.fillRect(0,0,1,1); return px() })()
    return Math.abs(a[0]-bOnBlack[0]) + Math.abs(a[1]-bOnBlack[1]) + Math.abs(a[2]-bOnBlack[2]) < 120
  }
  const lum = ([r,g,b]) => { const f = c => { c/=255; return c<=0.03928 ? c/12.92 : ((c+0.055)/1.055)**2.4 }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b) }
  const contrast = (a,b) => { const L1=lum(a), L2=lum(b); const hi=Math.max(L1,L2), lo=Math.min(L1,L2); return (hi+0.05)/(lo+0.05) }
  const effBg = el => { let e=el; while(e){ const c=getComputedStyle(e).backgroundColor; if(c && c!=='rgba(0, 0, 0, 0)' && c!=='transparent' && isOpaque(c)) return solid(c); e=e.parentElement } return [255,255,255] }
  const sel = el => { let s=el.tagName.toLowerCase(); const cn=(el.className && typeof el.className==='string')?el.className.trim().split(/\s+/).slice(0,3).join('.'):''; return cn?s+'.'+cn:s }
  const vw=innerWidth, vh=innerHeight
  const low=[], overlays=[], touch=[]
  const seen=new Set()
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el)
    if (cs.display==='none' || cs.visibility==='hidden' || +cs.opacity===0) continue
    const rect = el.getBoundingClientRect()
    const txt = [...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ').trim()
    if (txt && txt.length>1 && rect.width>0 && rect.height>0 && rect.top<vh && rect.bottom>0) {
      const bg = effBg(el)
      const eff = over(cs.color, bg)
      const ratio = contrast(eff, bg)
      const fs = parseFloat(cs.fontSize), bold = +cs.fontWeight>=700
      const large = fs>=24 || (fs>=18.66 && bold)
      const need = large ? 3 : 4.5
      if (ratio < need) {
        const key = sel(el)+'|'+txt.slice(0,20)
        if (!seen.has(key)) { seen.add(key); low.push({ sel: sel(el), text: txt.slice(0,45), ratio:+ratio.toFixed(2), need, fs:Math.round(fs), fgRaw: cs.color.slice(0,44), fgRGB:`rgb(${eff.join(',')})`, bg:`rgb(${bg.join(',')})` }) }
      }
    }
    if ((cs.position==='fixed'||cs.position==='absolute') && rect.width>40 && rect.height>20) {
      const cls=(el.className||'').toString()
      if (/dropdown-content|(^| )menu|tooltip|popover|modal-box/.test(cls)) {
        const bgc=cs.backgroundColor
        if (!bgc || bgc==='rgba(0, 0, 0, 0)' || !isOpaque(bgc)) overlays.push({ sel: sel(el), issue:'transparent-overlay', bg:bgc })
      }
      if (rect.right>vw+2 || rect.left<-2) overlays.push({ sel: sel(el), issue:'offscreen-x', right:Math.round(rect.right), vw })
    }
    if (vw<=420 && /^(button|a)$/i.test(el.tagName) && rect.width>0 && rect.height>0 && rect.top<vh) {
      if (rect.height<44 && txt) touch.push({ sel: sel(el), h:Math.round(rect.height), text:txt.slice(0,24) })
    }
  }
  return {
    horizScroll: document.documentElement.scrollWidth>vw+2 ? {scrollW:document.documentElement.scrollWidth, vw} : null,
    lowContrast: low.sort((a,b)=>a.ratio-b.ratio).slice(0,14),
    overlays: overlays.slice(0,6), smallTouch: touch.slice(0,8),
    title: (document.querySelector('h1,h2,.topbar-title')||{}).textContent?.trim().slice(0,45)||'',
    emptyState: !!document.querySelector('.empty-state'),
    emptyText: (document.querySelector('.empty-state')||{}).textContent?.trim().slice(0,90)||'',
  }
}

const b = await chromium.launch()
async function makeCtx({ role = 'admin', theme = 'light', system = 'light', width = 1280, height = 850 }) {
  const t = tokens[role] || tokens['__superuser__']
  const ctx = await b.newContext({ viewport: { width, height }, colorScheme: system })
  await ctx.addInitScript(([a, r, th]) => {
    localStorage.setItem('elom_access', a); localStorage.setItem('elom_refresh', r); localStorage.setItem('theme', th)
  }, [t.access, t.refresh, theme])
  return ctx
}
async function shot(ctx, tag, route, meta, opts = {}) {
  const page = await ctx.newPage()
  const errors = [], failed = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)) })
  page.on('response', r => { if (r.status() >= 400 && r.url().includes('elom.uz')) failed.push(r.status() + ' ' + r.url().replace(/https:\/\/[^/]+/, '').slice(0, 70)) })
  page.on('pageerror', e => errors.push('PAGEERR:' + e.message.slice(0, 120)))
  try { await page.goto(BASE + route, { waitUntil: 'load', timeout: 25000 }) } catch (e) { errors.push('GOTO:' + e.message.slice(0, 70)) }
  await page.waitForTimeout(1400)
  if (opts.print) await page.emulateMedia({ media: 'print' })
  let a = {}
  try { a = await page.evaluate(PAGE_AUDIT) } catch (e) { a = { err: e.message.slice(0, 70) } }
  const f = SHOTS + '/' + tag + '.png'
  if (!existsSync(f)) { try { await page.screenshot({ path: f, fullPage: !!opts.full }) } catch { /* скриншот не критичен для сбора метрик */ } }
  appendFileSync(OUT, JSON.stringify({ tag, route, ...meta, ...a, consoleErrors: errors.slice(0, 4), failedReq: failed.slice(0, 5) }) + '\n')
  await page.close()
}

if (ONLY.includes('A')) for (const theme of ['light', 'dark']) {
  const ctx = await makeCtx({ theme, system: theme })
  for (const [name, path] of Object.entries(R)) {
    await shot(ctx, `A-${name}-${theme}`, path, { pass: 'A', screen: name, theme, viewport: 'desktop', role: 'admin' })
    if (name === 'purchasePrint') await shot(ctx, `A-${name}-PRINTMEDIA`, path, { pass: 'A', screen: name + '-printmedia', theme, viewport: 'desktop', role: 'admin' }, { print: true })
  }
  await ctx.close()
}
if (ONLY.includes('B')) {
  const keys = ['dashboard', 'purchases', 'purchaseCreate', 'writeoffs', 'stocks', 'balances', 'objects', 'materials', 'reportObject', 'tools', 'rbac', 'purchasePrint']
  const ctx = await makeCtx({ width: 360, height: 780 })
  for (const k of keys) await shot(ctx, `B-${k}-m360`, R[k], { pass: 'B', screen: k, theme: 'light', viewport: 'mobile360', role: 'admin' }, { full: true })
  await ctx.close()
}
if (ONLY.includes('C')) {
  const ctx = await makeCtx({ width: 768, height: 900 })
  for (const k of ['dashboard', 'purchases', 'writeoffs', 'stocks', 'objects', 'materials']) await shot(ctx, `C-${k}-t768`, R[k], { pass: 'C', screen: k, theme: 'light', viewport: 'tablet768', role: 'admin' })
  await ctx.close()
}
if (ONLY.includes('D')) for (const system of ['light', 'dark']) for (const theme of ['light', 'dark']) {
  const ctx = await makeCtx({ theme, system })
  for (const k of ['dashboard', 'purchases', 'purchaseCreate']) await shot(ctx, `D-${k}-sys${system}-app${theme}`, R[k], { pass: 'D', screen: k, theme, system, viewport: 'desktop', role: 'admin' })
  await ctx.close()
}
if (ONLY.includes('E')) for (const role of (process.env.ROLES||'manager,warehouse,brigadier,requester').split(',')) {
  const ctx = await makeCtx({ role })
  for (const k of ['dashboard', 'purchases', 'writeoffs', 'stocks']) await shot(ctx, `E-${role}-${k}`, R[k], { pass: 'E', screen: k, theme: 'light', viewport: 'desktop', role })
  await ctx.close()
}
console.log('CHUNK DONE: ' + ONLY.join(''))
await b.close()
