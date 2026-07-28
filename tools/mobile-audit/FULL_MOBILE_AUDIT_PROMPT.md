# ELOM — Full Mobile Functional & Readability Audit — Engineer Prompt

> Hand this whole document to a specialized mobile-QA / frontend engineer (human or autonomous agent).
> It defines the mission, the exact app surface, every interaction class to exercise, per-page
> checklists, the method, and the known bug classes to hunt. Executed against the **live** app.

---

## 0. ROLE & MISSION

You are a **senior mobile QA + frontend engineer**. Your mission: **exhaustively** audit ELOM's mobile
experience — *everything a user can tap, select, or type; the readability of all displayed data; and
all scroll / sort / filter / navigation behaviour* — across the device × role matrix, on the **live**
site, and produce **reproducible, ranked findings** plus a coverage matrix. Nothing is "probably fine":
if it can be tapped, tap it; if it shows data, verify it's readable and correct.

Bias: **proof over inspection.** Every claim is backed by a real interaction on a real touch engine,
with a screenshot and, where relevant, measured numbers (tap-size px, font-size px, contrast ratio,
bounding boxes). Distinguish **functional** bugs (something doesn't work) from **usability/readability**
bugs (works but hard to use/read) — report both, tagged.

---

## 1. ENVIRONMENT & MATRIX

- **Base**: FE `https://elom.uz`, API `https://api.elom.uz/api/v1`. Live PWA (Vite build → nginx dist).
- **Engines / devices** (all `hasTouch: true`; test **portrait AND landscape**):
  - iPhone 15 Pro — **WebKit** (iOS Safari; the strictest; where the focus-dropdown & zoom-on-focus
    bugs live). Also test one **small** iPhone (SE / 375px) for cramped layouts.
  - Pixel 7 — **Chromium** (Android Chrome).
  - iPad Pro 11 — **WebKit** (tablet breakpoint; layout differs — bugs hide/appear here, cf. F-864).
- **Roles** (UI changes by RBAC — audit each; mint tokens via Django `RefreshToken.for_user`):
  `qa_admin` (super), `qa_manager`, `qa_warehouse`, `qa_brigadier`, `qa_requester`. Inject into
  `localStorage` keys `elom_access` / `elom_refresh`. **Refresh the access token per device** (long
  runs outlive a short-lived access token → 401 → redirect to /login; see export-touch harness).
- **Tooling**: Playwright (`webkit`/`chromium` from `node_modules/playwright`), `page.tap()` for real
  touch, `acceptDownloads`, `route()` to mock `/rbac/my-permissions` for synthetic permission sets,
  `elementFromPoint` for clip/overlap, `getBoundingClientRect` for size/overflow, `getComputedStyle`
  for font-size/contrast, `page.screenshot`. Reuse/extend the sibling harnesses:
  `tools/mobile-audit/audit.mjs` (overflow/tap/tiny-text), `tools/permission-audit/audit.mjs` (RBAC),
  `tools/export-touch/audit.mjs` (touch-tap dropdown + clip detection). **Never mutate prod data** —
  exercise reads, no-op edits, and reversible flows; capture create/delete only against throwaway
  records you also remove.

---

## 2. THE APP SURFACE (routes × surfaces)

**List pages** (GenericList → mobile = per-entity **cards**, not table): `/materials` (MaterialCard),
`/purchases` (PurchaseCard), `/writeoffs` (WriteOffCard), `/objects` (ObjectCard), `/suppliers`
(SupplierCard), `/units` (UnitCard), `/employees` (EmployeeCard), `/material_categories`
(MaterialCategoryCard), `/tools_index` (ToolCard), `/tools_issues` (ToolIssueCard), `/balances`
(BalanceCard), `/stocks` (StockCard).

**Create/Edit forms** (GenericForm and/or custom): `/materials/create`, `/purchases/create` (multi-item
+ MaterialSearchSelect + photos), `/writeoffs/create` (+ "по остатку" inventory form), `/objects/create`,
`/suppliers/create`, `/units/create`, `/employees/create`, `/material_categories/create`,
`/rbac/roles/create`; tool issue/return forms (modals).

**Other surfaces**: `/login`, `/` (dashboard), `/archive-periods` (close/reopen), `/rbac/roles`,
`/reports/by-material|by-object|by-period|by-responsible` (tables/aggregates, maybe charts).

**Shared interactive components** (test wherever they appear): GenericList (row/card actions, mobile
sort, pagination), ListHeader (+ **ExportButton** dropdown), FilterPanel/FilterField, GenericForm/
FormField, **MaterialSearchSelect** (searchable picker), Modal, ModernPagination, PermissionButton,
ToastCenter (toasts), **AutoMobileNavigation** (bottom nav + full-screen "Ещё" drawer via Teleport,
theme toggle, logout).

**Form field types to exercise**: `text, number, select, date, textarea, checkbox, email, tel,
password, search, multiselect, file`.

---

## 3. INTERACTION CLASSES — WHAT TO TEST & ACCEPTANCE CRITERIA

For **every** element found on **every** surface, classify and test:

**A. TAP TARGETS** — hit area **≥ 44×44 px** (iOS HIG); adequate spacing (no accidental neighbour
taps); custom-class buttons NOT covered by the global `@media(pointer:coarse)` rule are the risk
(cf. F-859 mobile-menu 40px). Measure `getBoundingClientRect`.

**B. TAP-TO-ACT / OPEN** — every button, link, row/card action, dropdown, menu, tab, accordion, badge
that should act: **tap (touch, not click)** → correct result. Explicitly verify:
  - Dropdowns/menus **open on tap** (iOS Safari does NOT focus `<div tabindex role=button>` on tap —
    cf. F-860; prefer `<details>`/popover). 
  - Opened menus are **fully visible, not clipped** by an ancestor `overflow:hidden` and not covered
    by another element — verify via `elementFromPoint` at each item's centre (cf. F-864 list-header).
  - No **dead taps** (element looks tappable, nothing happens), no **double-fire**, correct z-index/
    stacking, backdrop dismiss, hardware **Back** closes overlays.

**C. SELECT** — native `<select>`, **MaterialSearchSelect** (type-to-search, pick, clear ✕ with
aria-label), `multiselect`, **date pickers**, the **mobile-sort `<select>`** + direction toggle,
filter selects, checkbox/radio/toggle: opens, options readable, selection applies + persists, closes,
keyboard-operable.

**D. INPUT / TYPE** — for each input: correct **mobile keyboard** (`inputmode`/`type`: numeric for
qty/amount, email, tel), **NO iOS zoom-on-focus** (input font-size **≥ 16px**), validation fires,
**error messages are visible and readable** (mapped to the right field — cf. F-857 index remap),
placeholder convention `НЗ`, Enter/submit, clear buttons, `file` upload / camera capture, paste.

**E. DATA READABILITY** — contrast meets WCAG AA (≥4.5:1 body / 3:1 large); **no horizontal PAGE
overflow** (body must never scroll sideways; wide content scrolls inside its own container); no
**truncation of critical data** (names, numbers, dates, status); no **tiny text** (<12px); **ru-RU**
number/date formats correct; status **badges** legible; **cards show all key fields** the desktop
table shows; empty / loading (skeleton) / error states render and read correctly.

**F. SCROLL** — vertical page scroll + momentum, **no scroll-trap**; sticky header/filters behave;
**wide tables** → horizontal scroll **contained** (not the whole body); **modal** internal scroll;
**keyboard-open**: focused input stays visible above the on-screen keyboard; pull-to-refresh (if any);
infinite scroll vs pagination; **safe-area insets** (notch / home-indicator) respected (`env(safe-area-*)`),
`100dvh` not `100vh` traps.

**G. SORT** — **desktop** table: tap column header → sorts, `↑/↓` indicator, toggles asc/desc,
persists across pages. **Mobile**: the dedicated `.mobile-sort` field-select + direction toggle work,
reorder the **cards**, persist across pagination, and sort by the **displayed** field not a hidden id
(cf. F-858 responsible-by-id). No `?ordering=` value 500s.

**H. FILTER / SEARCH** — FilterPanel opens on mobile; each filter type (text/select/date/range)
applies, clears, combines; results match; **URL sync** + browser **Back** keeps data consistent
(cf. F-855 balances desync); no **dead filters** (FE filter with no BE support) and no BE filter
missing from UI (cf. F-858 search field).

**I. PAGINATION** — ModernPagination controls tappable; page-size; boundary (deleting last row on last
page → no stuck 404); state preserved with filters/sort.

**J. NAVIGATION** — bottom nav + **"Ещё" drawer** (Teleport to body): items tappable (≥44px), active
state correct, routes go, **Back** works, deep links, **logout**, **theme toggle** (light/dark both
readable — re-run readability in dark).

**K. MODALS / MULTI-ITEM FORMS** — create/edit modals open, scroll internally, close via X / backdrop /
Back; add/remove item rows (purchases/writeoffs) reindex correctly; submit maps field + per-row errors
(F-857); **closed-period pre-gates** show + block (F-640/642/643); photo upload flows (purchases).

**L. RBAC DIMENSION** — repeat the tappable/visible inventory **per role**; cross-check against
`tools/permission-audit`. **No fail-open** action (visible/enabled without the permission — F-863); no
fail-closed (hidden despite permission). Also mock `/rbac/my-permissions` for **synthetic** narrow perm
sets to cover combos beyond the 5 seeded roles.

**M. PWA / iOS-SAFARI SPECIFICS** — safe-area insets, `100dvh`, momentum scroll, tap-highlight colour,
no accidental **text selection** on double-tap of buttons, service-worker **stale JS** after deploy
(hard-refresh note), install-to-home, orientation change re-layout.

---

## 4. PER-PAGE CHECKLIST (apply §3 to each)

For **each list page**: cards render with all key fields (E) · card actions tappable + RBAC-gated
(B,L) · **mobile-sort** works (G) · filters + search (H) · **export button** taps-open, menu not
clipped, formats tappable, file downloads (B,F-864) · pagination (I) · empty/loading/error (E).

For **each create/edit form**: every field type (C,D) · MaterialSearchSelect (C) · multi-item add/
remove + reindex (K) · validation + error placement (D) · closed-period gate where applicable (K) ·
submit success/toast (ToastCenter announces — B,E) · keyboard doesn't cover fields (F) · cancel/close.

**Special**: `/login` (input keyboards, submit, error, throttle message) · `/` dashboard (widgets/
tiles tappable, readable) · `/reports/*` (aggregate tables/charts readable + scrollable, filters) ·
`/balances` & `/stocks` (object/date filters, back-nav consistency F-855) · `/archive-periods`
(close/reopen actions gated) · `/rbac/roles` (permission matrix editor on mobile — dense grid: scroll,
tap targets, readability).

---

## 5. METHOD (how to execute, per surface × device × role)

1. Launch touch context (device descriptor). Inject fresh token (refresh per device). Set orientation.
2. Navigate; wait for content; **screenshot** baseline.
3. **Enumerate** interactive elements: `document.querySelectorAll('button, a[href], [role=button],
   summary, select, input, textarea, [tabindex], .card, [data-action]')` → for each, record
   role/label, `getBoundingClientRect` (size + on-screen), computed font-size, disabled/aria-disabled.
4. For each: apply the relevant §3 checks. Tap it, capture the effect (screenshot + DOM/URL delta).
   For overlays use `elementFromPoint` (clip/cover) and verify Back/backdrop close.
5. **Readability sweep**: scan visible text nodes for font-size <12px, contrast < AA, and detect
   `document.scrollingElement.scrollWidth > innerWidth` (body horizontal overflow) + any element wider
   than viewport. Repeat in **dark theme**.
6. **Scroll sweep**: programmatic scroll to bottom (content reachable?), open a modal and scroll it,
   focus an input and confirm it's not covered by the keyboard (measure).
7. Record every deviation as a finding (§6). Move to next element/page/role/device.

---

## 6. REPORTING

Emit findings as structured records, **ranked most-severe first**, plus a **coverage matrix**
(route × check-class × device = pass/fail/skip). Each finding:
`{ severity: CRIT|HIGH|MED|LOW, category: tap-target|dead-tap|clip|overflow|readability|contrast|
zoom-on-focus|scroll|sort|filter|input-validation|rbac|nav|modal|pwa, device, role, route, element
(selector+label), failure_scenario (exact tap/input → wrong result), measured (px/ratio), expected,
screenshot }`. Deduplicate cross-device (note which devices reproduce). Separate **functional** from
**readability/usability**. End with: top risks, and a punch-list of fixes with the responsible
component (GenericList / GenericForm / ListHeader / MaterialSearchSelect / AutoMobileNavigation / the
per-entity Card / global CSS).

---

## 7. KNOWN BUG CLASSES — HUNT THESE FIRST (from prior ELOM findings)

- **Focus-dropdowns that don't open on iOS tap** — any `<div tabindex role=button>` + CSS-focus menu
  (fixed for Export in F-860; **grep the codebase for others**: `dropdown` without `<details>`/popover).
- **`overflow:hidden` ancestors clipping menus/tooltips/popovers** — F-864 (`.list-header`); check
  every dropdown/tooltip/date-picker/menu with `elementFromPoint`; layout-dependent so **test all
  devices** (iPad hid F-864).
- **Tap targets <44px** in custom-class controls not caught by the global `pointer:coarse` rule (F-859).
- **Sort by hidden id vs displayed field** (F-858); dead filters / missing search (F-858).
- **Filter/URL desync on Back** (F-855).
- **RBAC fail-open** buttons; delete gated by edit-perm; ungated actions (F-863).
- **iOS zoom-on-focus** on inputs with font-size <16px.
- **Horizontal body overflow** from wide tables / long unbroken strings / fixed-width elements.
- **Toasts not announced / not readable**, error messages landing on the wrong field/row (F-857).
- **PWA stale JS** after deploy; safe-area / `100vh` traps on notched devices.

---

## 8. DELIVERABLE

A ranked findings report + coverage matrix (as above), and — where automatable — an extension of the
Playwright harnesses so the whole sweep is **re-runnable** (one command per device, exit non-zero on
any CRIT/HIGH). Treat this document as the acceptance spec: an area is "audited" only when every §3
class has been exercised on it across the §1 matrix, with evidence.
