#!/usr/bin/env bash
# Stamp version, test, deploy to Cloudflare Pages (carver-wb.pages.dev).
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/stamp.js
node scripts/stamp.js --check
node test/compare.js
set -a; . ~/.secrets/cloudflare/cloudflare.env; set +a
npx --yes wrangler@latest pages deploy public --project-name carver-wb --branch main --commit-dirty=true
