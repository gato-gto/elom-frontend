# ELOM — Mobile / device adaptation spec (the standing prompt)

**Goal:** ELOM must look and work *perfectly* on **iPhone 14/15, iPad Pro 11, Pixel 7**, and be
solidly responsive everywhere else (small Android, desktop). This is the checklist every screen
must pass; the audit harness (`audit.mjs`) enforces the measurable parts.

## Target viewports (portrait)
- iPhone 15 Pro / 14 — 393×852 (WebKit/Safari, DPR 3, notch → safe-area insets)
- Pixel 7 — 412×915 (Chromium/Android, DPR ~2.6)
- iPad Pro 11 — 834×1194 (iPadOS, touch)
- Desktop baseline — 1366×900

## Hard requirements (must never regress)
1. **No horizontal overflow.** `document.documentElement.scrollWidth ≤ viewport`. The body must
   never scroll sideways. Wide content (tables, badge rows, code, long tokens) wraps or scrolls
   *inside its own* `overflow-x:auto` container. → *Known bug: Employees card badge row does not
   wrap for multi-role users (+82px iPhone / +68px Pixel).*
2. **Touch targets ≥ 44px** (iOS HIG; Android Material = 48px) for every primary/interactive
   control on touch devices. → *Known: pagination number buttons render 32×32; icon buttons 32×32;
   table row-action buttons 36px tall on iPad.*
3. **Readable text ≥ 12px** for body/data on mobile (14px preferred). No `<11px` labels. →
   *Known: some tables/tools show 9–11px text.*
4. **Safe-area insets** — respect the notch/home-indicator: `env(safe-area-inset-*)` padding on
   fixed headers/footers/bottom-nav; `viewport-fit=cover`.
5. **Forms are thumb-friendly** — inputs ≥ 44px tall, correct `inputmode`/`type` (numeric keypad
   for quantities), no zoom-on-focus (font-size ≥ 16px on iOS inputs), modals scroll internally.
6. **Tables → cards on mobile.** Wide data tables must collapse to a stacked card layout under
   `md` (most ELOM lists already do — keep it). No 8-column table on a 393px screen.
7. **Tap-friendly nav** — the mobile drawer/bottom-nav must be reachable one-handed and not cover
   content or the safe area.

## PWA requirements
- Installable (valid manifest, icons incl. maskable, theme-color), standalone display.
- Offline app-shell loads; API-dependent screens degrade gracefully (already have error toasts).
- **No stale cache** after deploy — service worker must update; `index.html` `no-cache` (F-307).
  Users should get new builds without manual cache-clear (hard-refresh acceptable as fallback).
- Correct status-bar / theme-color in standalone on iOS & Android.

## How to verify (autonomous)
`node tools/mobile-audit/audit.mjs --tokens <jwt.json>` → per device × route: overflow, tap
targets, tiny text, console/network errors, + screenshots. Re-run after every responsive change.
Interactive: Playwright MCP (`playwright-ios` / `playwright-android`, after restart+approval).

## Backlog seeded by first run (2026-07-26)
- **P1** Employees list — multi-role badge row overflow (add `flex-wrap`, cap/`+N` overflow).
- **P2** Pagination + icon buttons — bump to ≥44px hit area on touch (`min-h`/`min-w` or padding).
- **P3** Sub-11px text on tools/dense tables — raise to ≥12px on mobile.
- **P4** iPad row-action buttons 36px tall — consider 44px touch height on tablet breakpoint.
- Tie into R5-2b (marker-badges, mono data columns, F-271 amber «нет фото»), R6 mobile (F-254),
  R7 PWA (F-255).
