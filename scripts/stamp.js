#!/usr/bin/env node
// Stamps a content-hash version into public/sw.js (CACHE_VERSION) and public/index.html (<meta app-version>).
// Any change to any precached asset => new version => browsers detect a new SW => update toast.
// Usage: node scripts/stamp.js          (write)
//        node scripts/stamp.js --check  (exit 1 if stale)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const pub = path.join(__dirname, '..', 'public');
const swPath = path.join(pub, 'sw.js'), idxPath = path.join(pub, 'index.html');
const VER_RE_SW = /const CACHE_VERSION = '[^']*';/;
const VER_RE_IDX = /<meta name="app-version" content="[^"]*">/;
const norm = (f, s) => f === 'sw.js' ? s.replace(VER_RE_SW, "const CACHE_VERSION = '';")
  : f === 'index.html' ? s.replace(VER_RE_IDX, '<meta name="app-version" content="">') : s;

const sw = fs.readFileSync(swPath, 'utf8');
const list = JSON.parse('[' + sw.match(/const PRECACHE = \[([\s\S]*?)\];/)[1].replace(/\/\/.*$/gm, '').replace(/'/g, '"').replace(/,\s*$/, '') + ']')
  .map(u => u === './' ? 'index.html' : u);
const files = [...new Set([...list, 'sw.js', '_headers'])].sort();
const h = crypto.createHash('sha256');
for (const f of files) {
  const p = path.join(pub, f);
  if (!fs.existsSync(p)) { console.error('missing precache file:', f); process.exit(2); }
  h.update(f + '\0'); h.update(/\.(png)$/.test(f) ? fs.readFileSync(p) : norm(f, fs.readFileSync(p, 'utf8')));
}
const v = h.digest('hex').slice(0, 10);
const cur = (sw.match(VER_RE_SW)[0].match(/'([^']*)'/) || [])[1];
if (process.argv.includes('--check')) {
  if (cur !== 'wb-' + v) { console.error(`sw.js version stale: ${cur} != wb-${v} — run node scripts/stamp.js`); process.exit(1); }
  console.log('version ok:', cur); process.exit(0);
}
fs.writeFileSync(swPath, sw.replace(VER_RE_SW, `const CACHE_VERSION = 'wb-${v}';`));
fs.writeFileSync(idxPath, fs.readFileSync(idxPath, 'utf8').replace(VER_RE_IDX, `<meta name="app-version" content="${v}">`));
console.log('stamped wb-' + v, '(' + files.length + ' files)');
