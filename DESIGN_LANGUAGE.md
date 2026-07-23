# ELOM — Design Language (v1, proposal)

> Status: **PROPOSAL for owner review** (R5 step 1). Tokens defined here are not yet applied to the
> kit — once the direction is confirmed, step 2 wires them into `src/assets/tailwind.css` (the
> DaisyUI `@theme`) and the shared components restyle centrally.

The company has no brand colours or logo, so there is nothing to extract — the current screens are
essentially default DaisyUI/Tailwind (the templated look we're leaving). This is a language **built
from scratch**, grounded in the one thing that is specific and real here: the trade itself.

---

## 1. Who and what — the ground truth

**ELOM** is an accounting/tracking tool for a company that installs **low-voltage / weak-current
systems** — structured cabling (СКС), CCTV, access control (СКУД), alarms (ОПС), networks. Its users:

- **The field brigade**, on a phone, often in bad light / direct sun / a hurry. Needs: high contrast,
  big touch targets, fast, unambiguous status at a glance.
- **The director**, at a desktop. Needs: dense, scannable tables — a lot of rows, exact numbers.

So the character is a **professional instrument, not a consumer app**: engineering-functional,
restrained, confident, calm, legible. High contrast and readability in the field are **functional
requirements**, not aesthetics.

## 2. The idea it's built on (the risk, justified)

The installer's world already has a rigorous visual system: **cable schedules, terminal blocks,
wire colour codes (T568B), and the little printed markers wrapped on every cable to identify a
circuit.** ELOM *is* a ledger/schedule for that world. Two deliberate, domain-true choices carry the
identity:

1. **Data is set in monospace.** Every quantity, balance, price, inventory number, SKU, purchase №
   and date renders in **IBM Plex Mono** — like a cable schedule or an instrument readout. It aligns
   in columns, scans instantly, and reads unmistakably "engineering", not "SaaS". This is the one
   real risk (mono-for-data across a business app is unusual) and it's justified by the domain and by
   function (tabular alignment + field scannability).
2. **Statuses are cable-markers.** Status is shown as a small, uppercase, **mono, bordered marker
   tag** — echoing the physical cable ID markers — colour-coded by a semantics table (below). One
   glance, one meaning, even in sun.

Everything else stays quiet so these two land. The chrome is **steel-graphite + hairline borders**
(a schedule grid) with **one warm accent: copper** — the core material of every cable, and a
high-visibility warm figure against the cool base. Steel + copper is a temperature contrast specific
to this trade, and it avoids all three current AI defaults (no cream+serif+terracotta, no
black+acid-green, no broadsheet).

## 3. Colour

HSL triplets are given for the DaisyUI `@theme` mapping; hex for reference. Contrast targets: body
text ≥ 7:1 (AAA-ish, for sun); UI text/borders ≥ 4.5:1.

### Neutral base — "steel / graphite" (cool)
| Token | Hex | Use |
|-------|-----|-----|
| graphite-950 | `#0E1417` | dark-mode page bg |
| graphite-900 | `#161D22` | dark surfaces |
| graphite-800 | `#1E272D` | **body text (light mode)** |
| graphite-700 | `#2C3840` | headings / neutral fills |
| graphite-500 | `#5C6B74` | muted / secondary text |
| graphite-300 | `#AAB6BD` | disabled text, icons |
| graphite-200 | `#D4DBDF` | **hairline borders / table grid** |
| graphite-100 | `#E8EDF0` | subtle raised surface / hover |
| graphite-50  | `#F4F7F8` | page bg (light) |
| white        | `#FFFFFF` | panels / cards (light) |

### Accent — "copper" (the single bold colour)
| Token | Hex | Use |
|-------|-----|-----|
| copper-600 (primary) | `#B0500F` | primary actions, focus ring, active nav |
| copper-700 (hover)   | `#8F400B` | hover/pressed |
| copper-50            | `#FBF0E7` | primary tint / selected row |

Rationale: copper = the material of the trade; warm high-contrast against the cool steel base; not
the templated purple-blue. Used **with restraint** — primary actions and one active accent only.

### Status semantics (the marker colours) — grounded in the "OK / pending / fault" logic of the trade
| Status | Meaning | Hex | Marker |
|--------|---------|-----|--------|
| `completed` / `closed` | settled, done, connected-OK | `#1F7A54` terminal-green | green marker |
| `new` / `pending` | awaiting, informational | `#3E6B8C` steel-blue | steel marker |
| `cancelled` | negative, stopped | `#B23A2E` fault-red | red marker |
| `warning` (e.g. **completed без фото-отчёта, F-271**) | needs attention | `#C77A0A` signal-amber | amber marker |
| `archived` | filed history, read-only | `#5C6B74` graphite | neutral marker |

### Role semantics (role badges — restrained, distinct)
admin → graphite-800 · manager → copper · warehouse → terminal-green · brigadier → steel-blue ·
requester → graphite-500. (All muted; roles are labels, not decoration.)

### DaisyUI `@theme` mapping (step 2)
`primary`=copper-600 · `success`=terminal-green · `info`=steel-blue · `warning`=signal-amber ·
`error`=fault-red · `base-100`=white · `base-200`=graphite-50 · `base-300`=graphite-200 ·
`base-content`=graphite-800 · `neutral`=graphite-700. Dark mode inverts the base scale (graphite-950
page, graphite-100 text) and keeps the same accent/status hues (slightly lightened for contrast).

### Text levels — the ONE muted-text rule (F-312, WCAG-AA guarded)
Приглушённый/вторичный текст задаётся ТОЛЬКО сплошными токенами уровней — **никогда** прозрачностью
base-content. `text-base-content/NN` в светлой теме проваливал контраст (/60 = 4.09:1, /50 = 3.07,
/40 = 2.36, /30 = 1.85 — нечитаемо), потому что приглушение полупрозрачным тёмным на белом убивает
контраст. Три уровня (HSL-триплеты в `--bc`/`--tx-2`/`--tx-3`, светлая и тёмная в `:root`/`:root.dark`):

| Уровень | Класс / токен | Light HSL | Light contrast (base-100 / base-200) | Dark HSL | Dark contrast | Назначение |
|---------|---------------|-----------|--------------------------------------|----------|---------------|------------|
| Primary | `text-base-content` / `--bc` | `200 20% 15%` | 14.9 / 13.7 | `200 20% 92%` | 15.3 / 14.3 | основной текст |
| Secondary | `.text-muted` / `--tx-2` | `205 15% 32%` | **7.2 / 6.6** | `205 13% 72%` | 9.2 / 8.5 | метки, мета, подписи |
| Tertiary | `.text-subtle` / `--tx-3` | `205 12% 40%` | **5.3 / 4.9** | `205 11% 62%` | 6.8 / 6.3 | самый приглушённый читаемый |

Все три ≥4.5:1 (обычный текст) в ОБЕИХ темах на base-100 и base-200. Правило закреплено тестом
`src/test/contrast.test.ts` — читает реальные токены из `tailwind.css` и падает при регрессии контраста
(как страж после F-276, где терялись фокус-кольца и проваливался AA). Границы/иконки/фокус — ≥3:1;
фокус-кольцо инпутов = `hsl(var(--p))` (copper), проверяется тем же тестом.

### Границы контролов и поверхности-острова (F-313)
- **`--control-border`** — граница полей (input/select/textarea/file-input и кастомных `.filter-input`/
  `.login-input`, утилита `.border-control`): light `205 12% 55%` (3.35:1 на base-100), dark `204 15% 42%`
  (3.46:1). Отдельно от `--b3`: `base-300` = 1.41:1 на белом, годится ТОЛЬКО для декоративных границ
  (карточки, сетка таблиц, разделители), но НЕ для контролов, где граница — единственный индикатор поля
  (WCAG 1.4.11 ≥3:1). Плейсхолдеры и disabled-текст полей = `--tx-3` (сплошной, не `opacity`).
- **Сайдбар — тёмный «остров» в ОБЕИХ темах** (`--sidebar-bg`: light `204 23% 11%` (graphite-900), dark `200 24% 8%`):
  медный хедер + белый текст по дизайну; в светлой теме он раньше падал на `base-200` (near-white) → белый
  текст был невидим (1.07:1). Текст сайдбара — белый/`rgba(255,255,255,·)` (не тема-зависимые токены);
  заголовки секций внутри сайдбара переопределяются на светлый. Меню пользователя открывается в белом
  dropdown — там текст остаётся тёмным (`.text-muted`).
- **Статусы (light) затемнены под мелкий текст бейджей:** `warning` L36→30 (янтарь-на-белом/тинте и
  белый-на-кнопке ≥4.5:1), `success` L30→28 (текст-на-тинте ≥4.5:1). Проверяется страж-тестом (текст
  каждого статуса на base-100 ≥4.5:1 в обеих темах). Статус-хардкоды (`text-green/red-600`, `#ef4444`,
  toast-хексы) заменены на токены `text-success`/`text-error`/`hsl(var(--er))`.

## 4. Typography

Two families, self-hosted (Cyrillic+Latin subset), `font-display: swap`, sans-regular preloaded; a
system stack falls back first on slow field connections.

- **IBM Plex Sans** — UI / body / headings. Engineering heritage, high legibility, distinctive but
  professional. Weights: 400 (body), 500 (labels/emphasis), 600 (headings). Not Inter (the default).
- **IBM Plex Mono** — **all data**: quantities, balances, prices, inventory №, SKU, dates, purchase
  №, and marker text. Weight 500. This is the signature.

Scale (base **14px** — dense for data; inputs bump to ≥16px on mobile to avoid iOS zoom):
`xs 12 / sm 13 / base 14 / md 15 / lg 16 / xl 20 / 2xl 24 / 3xl 30`. Headings: Plex Sans 600 with
slightly tightened tracking (−0.01em). Labels/eyebrows: Plex Sans 500, uppercase, +0.04em, graphite-500.

## 5. Space, line, elevation

- **Radius — sharp/technical:** `xs 2 · sm 3 · md 4 · lg 6` px. Controls 4px, panels 6px, markers 3px.
  **No pill/rounded-full** (consumer), **no zero-radius** (broadsheet) — a precise 2–6px.
- **Borders do the structural work.** 1px `graphite-200` hairlines; tables/panels are a schedule grid.
  Prefer a border over a shadow.
- **Shadow — minimal, functional:** `sm 0 1px 2px rgba(14,20,23,.06)` for raised; `pop 0 6px 20px
  rgba(14,20,23,.14)` for modals/menus only. No decorative glows, no glass/blur.
- **Spacing scale (4px base):** 2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 · 40. Dense by default; the
  density loosens on mobile where touch needs it.

## 6. States

`hover` subtle graphite-100 wash (or copper-700 on primary) · `focus` **visible** 2px copper ring +
1px offset (accessibility + field) · `disabled` 45% opacity, no pointer · `loading` restrained
`currentColor` spinner · `empty` human RU sentence, never "No data" ("Пока нет закрытых периодов") ·
`error` fault-red border+text with a plain, actionable message in the interface's voice.

## 7. Density & touch (both audiences from one system)

- **Director / desktop:** compact table rows (32–36px), mono data columns, hairline grid, right-aligned
  numbers. Maximum scannable rows.
- **Brigade / mobile:** interactive targets **≥ 44px**, single-column forms, large selects/date fields,
  the same markers scaled up. The token layer is responsive from the start (works at ~360px); the full
  mobile/PWA pass is a separate phase but nothing here fights it.

## 8. Component intents (restyled centrally in step 2)

- **Button** — square-ish 4px, Plex Sans 500. Primary = copper solid (white text); secondary = graphite
  outline; ghost = text-only. ≥44px tall on mobile. No gradients.
- **Input / select / date** — 4px, 1px graphite-200 border, copper focus ring, ≥16px text on mobile.
- **Table** — hairline grid, compact rows, uppercase graphite-500 headers, mono data columns,
  right-aligned numbers, hover row wash.
- **Marker (badge)** — the signature: mono, uppercase, 3px radius, 1px border in the status hue, tinted
  fill; used for statuses and roles.
- **Modal** — white/graphite panel, 6px radius, `pop` shadow, hairline header divider, no backdrop blur.
- **Nav** — quiet; active item = copper left-rule + copper text; icons monochrome graphite.

## 9. Do / don't

**Do:** hairline borders, one copper accent, mono data, marker statuses, high contrast, human RU copy.
**Don't:** DaisyUI default purple-blue, gradients, glass/blur, emoji in UI, rounded-full pills,
shadow-heavy cards, decorative icons. Boldness is spent once — on the copper + the markers.

---

## What this is NOT (self-critique vs the AI defaults)
Not cream-bg + serif + terracotta (this is cool steel + copper + mono). Not near-black + acid accent
(muted domain status hues, dual-mode). Not a broadsheet (it's an instrument/ledger UI, hairlines serve a
data grid, not editorial columns). The copper-on-steel + wire-code statuses + mono-data is specific to
low-voltage installation and would look wrong for a generic SaaS — which is the point.
