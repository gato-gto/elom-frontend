#!/usr/bin/env node
/**
 * F-1027 · apple-touch-startup-image (splash) для iOS/iPadOS PWA (APPLE_AUDIT A-11).
 *
 * iOS показывает splash ТОЛЬКО если найден <link rel="apple-touch-startup-image"> с media-запросом,
 * ТОЧНО совпадающим с device-width/device-height/-webkit-device-pixel-ratio/orientation, и картинка
 * ТОЧНО равна пикселям экрана. Поэтому: один PNG на (устройство × ориентация × тема).
 *
 * Запуск: `node tools/apple-splash/generate.mjs` → public/splash/*.png + блок <link> в index.html
 * (между маркерами apple-splash:start/end). Гард: src/test/architecture.guards.test.ts (F-1027).
 * Источник иконки: public/apple-touch-icon.svg (скруглённый фирменный квадрат), фон = фон приложения
 * (light #F4F7F8 / dark #16222B — те же, что THEME_COLOR в stores/theme.ts).
 */
import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = resolve(ROOT, 'public/splash')
const ICON = resolve(ROOT, 'public/apple-touch-icon.svg')
const INDEX = resolve(ROOT, 'index.html')

export const THEMES = { light: '#F4F7F8', dark: '#16222B' }

// CSS-пиксели портрета (device-width × device-height) + DPR. Актуальные iPhone/iPad (iOS 15+).
export const DEVICES = [
  // iPhone
  { name: 'iPhone SE 2/3, 8',                          w: 375,  h: 667,  dpr: 2 },
  { name: 'iPhone 8 Plus',                             w: 414,  h: 736,  dpr: 3 },
  { name: 'iPhone X/XS/11 Pro, 12/13 mini (zoomed)',   w: 375,  h: 812,  dpr: 3 },
  { name: 'iPhone XR/11',                              w: 414,  h: 896,  dpr: 2 },
  { name: 'iPhone XS Max/11 Pro Max',                  w: 414,  h: 896,  dpr: 3 },
  { name: 'iPhone 12/13 mini',                         w: 360,  h: 780,  dpr: 3 },
  { name: 'iPhone 12/13/14, 12/13 Pro',                w: 390,  h: 844,  dpr: 3 },
  { name: 'iPhone 12/13 Pro Max, 14 Plus',             w: 428,  h: 926,  dpr: 3 },
  { name: 'iPhone 14 Pro, 15/15 Pro, 16',              w: 393,  h: 852,  dpr: 3 },
  { name: 'iPhone 14 Pro Max, 15 Plus/Pro Max, 16 Plus', w: 430, h: 932,  dpr: 3 },
  { name: 'iPhone 16 Pro',                             w: 402,  h: 874,  dpr: 3 },
  { name: 'iPhone 16 Pro Max',                         w: 440,  h: 956,  dpr: 3 },
  // iPad
  { name: 'iPad 9.7 / mini 5',                         w: 768,  h: 1024, dpr: 2 },
  { name: 'iPad 10.2',                                 w: 810,  h: 1080, dpr: 2 },
  { name: 'iPad Air 10.5 / Pro 10.5',                  w: 834,  h: 1112, dpr: 2 },
  { name: 'iPad 10.9 / Air 4-5',                       w: 820,  h: 1180, dpr: 2 },
  { name: 'iPad Pro 11 (1-4), Air 11 M2',              w: 834,  h: 1194, dpr: 2 },
  { name: 'iPad Pro 11 M4',                            w: 834,  h: 1210, dpr: 2 },
  { name: 'iPad mini 6',                               w: 744,  h: 1133, dpr: 2 },
  { name: 'iPad Pro 12.9',                             w: 1024, h: 1366, dpr: 2 },
  { name: 'iPad Pro 13 M4',                            w: 1032, h: 1376, dpr: 2 },
]

export function fileName(d, orientation, theme) {
  const [pw, ph] = orientation === 'portrait' ? [d.w, d.h] : [d.h, d.w]
  return `apple-splash-${pw * d.dpr}x${ph * d.dpr}-${theme}.png`
}

export function mediaQuery(d, orientation, theme) {
  const scheme = ` and (prefers-color-scheme: ${theme})`  // явно обе темы: media взаимоисключающие, порядок тегов не важен
  return `screen and (device-width: ${d.w}px) and (device-height: ${d.h}px) ` +
    `and (-webkit-device-pixel-ratio: ${d.dpr}) and (orientation: ${orientation})${scheme}`
}

export function linkTags() {
  const lines = []
  for (const d of DEVICES) {
    lines.push(`    <!-- ${d.name} -->`)
    for (const orientation of ['portrait', 'landscape']) {
      for (const theme of Object.keys(THEMES)) {
        lines.push(`    <link rel="apple-touch-startup-image" media="${mediaQuery(d, orientation, theme)}" href="/splash/${fileName(d, orientation, theme)}" />`)
      }
    }
  }
  return lines.join('\n')
}

async function render(d, orientation, theme) {
  const [pw, ph] = orientation === 'portrait' ? [d.w, d.h] : [d.h, d.w]
  const W = pw * d.dpr, H = ph * d.dpr
  // иконка ≈ 22% меньшей стороны (как нативный лаунч-экран), кратно DPR
  const side = Math.round(Math.min(W, H) * 0.22)
  const icon = await sharp(readFileSync(ICON)).resize(side, side).png().toBuffer()
  return sharp({ create: { width: W, height: H, channels: 3, background: THEMES[theme] } })
    .composite([{ input: icon, left: Math.round((W - side) / 2), top: Math.round((H - side) / 2) }])
    .png({ compressionLevel: 9, palette: true })
    .toFile(resolve(OUT, fileName(d, orientation, theme)))
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  for (const f of readdirSync(OUT)) { if (f.endsWith('.png')) { unlinkSync(resolve(OUT, f)) } }
  let n = 0
  for (const d of DEVICES) {
    for (const orientation of ['portrait', 'landscape']) {
      for (const theme of Object.keys(THEMES)) { await render(d, orientation, theme); n++ }
    }
  }
  const html = readFileSync(INDEX, 'utf8')
  const START = '    <!-- apple-splash:start (F-1027, генерится tools/apple-splash/generate.mjs — не править руками) -->'
  const END = '    <!-- apple-splash:end -->'
  const block = `${START}\n${linkTags()}\n${END}`
  const re = / {4}<!-- apple-splash:start[\s\S]*?<!-- apple-splash:end -->/
  if (!re.test(html)) { throw new Error('index.html: маркеры apple-splash:start/end не найдены') }
  writeFileSync(INDEX, html.replace(re, block))
  console.log(`apple-splash: ${n} PNG → public/splash/, index.html обновлён`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1) })
}
