# Export-button TOUCH test harness

Regression guard for the Export button on **touch devices**. For every export-enabled list page it
TAPS (real touch, not click) the Export button across a device matrix and asserts, per format
position (CSV / Excel / PDF):

1. the `<details>` menu **opens on tap** (F-860: the old `<div tabindex role=button>` focus-dropdown
   never opened on iOS Safari tap);
2. each format position is **visible, enabled, and not clipped/covered** — via `elementFromPoint` at
   the item's centre, so an ancestor `overflow:hidden` clipping the menu is caught (F-864:
   `.list-header overflow:hidden` cut off Excel/PDF on shorter-header pages like /stocks, /tools_issues);
3. **Excel** (server-side export) actually **fires a download** when tapped — export works end-to-end
   via touch, not merely that the menu renders.

Devices: iPhone 15 Pro (iOS/WebKit), iPad Pro 11 (WebKit), Pixel 7 (Android/Chromium) — all `hasTouch`.

## Run
```bash
node tools/export-touch/audit.mjs --base https://elom.uz --toks /path/role-toks.json
# needs qa_admin token (holds reports.export so the button renders; sees data everywhere).
# exit code 1 if any page FAILs. A fresh access token is refreshed per device from the refresh
# token — the full run (3 devices × 8 pages + downloads) outlives a short-lived access token.
```

## Findings history
- `F-864` — `.list-header { overflow: hidden }` (there only to round the 2px `::before` top-rule) was
  clipping the export dropdown menu; lower items (Excel/PDF) were hidden on pages whose header is
  shorter than the open menu (/stocks, /tools_issues) on iPhone/Pixel. Fix: drop the clip, round
  `::before` directly. Before: 4 FAILING; after: ALL GREEN across all devices.
- `F-860` — the touch-open fix this harness guards (details/summary instead of focus-dropdown).
