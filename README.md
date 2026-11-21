# Carver Aviation — Trimsheet (W&B)

Static, mobile-first weight & balance calculator. Rebuild of https://saviation.netlify.app/ plus VT-RUM.

- `public/` — the site (no build step). `public/calc.js` holds aircraft data + math.
- `_orig/` — snapshot of the original app for reference.
- `test/compare.js` — runs the original `trimsheet.js` in a stub DOM and checks calc.js matches it: `node test/compare.js`
- URL params: `?ac=RUM&fuel=120&pic=75&co=70`

Deploy (Workers static assets, config in wrangler.jsonc): `set -a; . ~/.secrets/cloudflare/cloudflare.env; set +a; npx wrangler deploy`
