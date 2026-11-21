# Carver Aviation — Trimsheet (W&B)

Static, mobile-first weight & balance calculator. Rebuild of https://saviation.netlify.app/ plus VT-RUM.

- `public/` — the site (no build step). `public/calc.js` holds aircraft data + math.
- `_orig/` — snapshot of the original app for reference.
- `test/compare.js` — runs the original `trimsheet.js` in a stub DOM and checks calc.js matches it: `node test/compare.js`
- PWA: installable + fully offline. `public/sw.js` precaches the app shell (cache-first). `scripts/stamp.js` writes a
  content-hash `CACHE_VERSION` into sw.js + index.html, so any asset change ships a new SW. New versions precache in the
  background and wait; the page shows an "Update available — Reload" toast (tap = skipWaiting + one reload), otherwise the
  new version activates on the next cold start. Old caches are deleted on activate. `sw.js` is served no-store (`_headers`).
- `test/pwa.js` — offline / installability / update-flow checks (Playwright + headless Chromium):
  `node test/pwa.js <url>` (offline), `--profile DIR --phase update-before|update-after|ignore-toast|cold-start`
- URL params: `?ac=RUM&fuel=120&pic=75&co=70`

Deploy (Cloudflare Pages → https://carver-wb.pages.dev): `scripts/deploy.sh` (stamps version, runs tests, deploys)
