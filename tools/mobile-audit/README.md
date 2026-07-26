# ELOM mobile / device UI audit

Autonomous device-matrix UI testing for ELOM. Emulates the target devices and checks the
live app for responsive defects — no prod mutations (read-only + JWT injection).

## Target device matrix
| Key | Engine | Emulates | Class |
|-----|--------|----------|-------|
| `iphone-15-pro` | WebKit | iPhone 15 Pro (≈ iPhone 14/15) | iOS / Safari |
| `pixel-7` | Chromium | Pixel 7 | Android / Chrome |
| `ipad-pro-11` | WebKit | iPad Pro 11 | tablet / iPadOS |
| `desktop-1366` | Chromium | 1366×900 | desktop baseline |

## Run
```bash
# 1) mint a JWT for the role you want to walk (read-only; never submit on prod)
sudo -u elom /opt/elom-backend/.venv/bin/python /opt/elom-backend/manage.py shell -c \
  "from django.contrib.auth import get_user_model as U; from rest_framework_simplejwt.tokens import RefreshToken as R; import json; \
   u=U().objects.get(username='qa_admin'); r=R.for_user(u); \
   json.dump({'access':str(r.access_token),'refresh':str(r)}, open('/tmp/audit_tok.json','w'))"

# 2) run the audit
cd /opt/elom-frontend
node tools/mobile-audit/audit.mjs --tokens /tmp/audit_tok.json [--base https://elom.uz] [--out DIR]
```
Output: `<OUT>/report.json` + `<device>__<route>.png` screenshots. Default OUT is the session scratchpad.

## What it flags (per device × route)
- **Horizontal overflow** — `<html>.scrollWidth > viewport` (page scrolls sideways = the #1 mobile bug) + the offending wide elements.
- **Tap targets < 44px** — buttons/links/inputs below the iOS HIG 44px (Android Material = 48px) minimum, with a sample.
- **Tiny text** — body text `< 11px`.
- **Console errors / failed requests** — captured per device (some break only on WebKit/Chromium).

## Interactive alternative (Playwright MCP)
Two MCP servers are registered in `/opt/.mcp.json` (`playwright-ios` = WebKit/iPhone 15 Pro,
`playwright-android` = Chromium/Pixel 7). They give live browser tools (navigate/click/
snapshot) but require **approval + a Claude Code restart** to load. Use them for interactive
poking; use this harness for repeatable full-matrix audits.

## Mobile adaptation spec
See `MOBILE_UI_SPEC.md` (same dir) — the checklist the app must satisfy on every target device.
