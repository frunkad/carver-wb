// PWA/offline/update checks with Playwright + headless Chromium.
// Usage: node test/pwa.js <baseURL> [--profile DIR] [--phase offline|update-before|update-after]
//   offline        : fresh profile → install SW → go offline → reload + calculate
//   update-before  : load with persistent profile, record version (run before redeploy)
//   update-after   : load with same profile after redeploy, expect toast → click → new version
const PW = process.env.PW_CORE || '/home/pi/.cache/bun/playwright-core@1.58.2@@@1';
const { chromium } = require(PW);
const exe = process.env.CHROME || require('child_process').execSync('ls -d ~/.cache/ms-playwright/chromium_headless_shell-1248/*/ 2>/dev/null || true').toString().trim() + 'chrome-headless-shell';
const args = process.argv.slice(2);
const base = args[0];
const phase = args.includes('--phase') ? args[args.indexOf('--phase') + 1] : 'offline';
const profile = args.includes('--profile') ? args[args.indexOf('--profile') + 1] : null;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };

async function calc(page) {
  await page.tap('.ac[data-reg=RUM]');
  await page.fill('#fuel', '120'); await page.fill('#pic', '75'); await page.fill('#co', '70');
  return { tow: (await page.textContent('#kTow')).trim(), cg: (await page.textContent('#kCg')).trim(), status: (await page.innerText('#status')).replace(/\n/g, ' ') };
}
const ver = (p) => p.evaluate(() => document.querySelector('meta[name=app-version]').content);
const swVer = (p) => p.evaluate(() => new Promise((res) => {
  const c = new MessageChannel(); c.port1.onmessage = (e) => res(e.data);
  navigator.serviceWorker.controller ? navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' }, [c.port2]) : res(null);
}));

(async () => {
  const exePath = exe;
  const opts = { executablePath: require('fs').existsSync(exePath || '') ? exePath : undefined, args: ['--no-sandbox'],
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, headless: true };
  const ctx = profile ? await chromium.launchPersistentContext(profile, opts)
    : await (await chromium.launch(opts)).newContext(opts);
  const page = ctx.pages()[0] || await ctx.newPage();

  if (phase === 'offline') {
    await page.goto(base);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
    const v = await ver(page), sv = await swVer(page);
    ok(!!sv && sv === 'wb-' + v, `SW controls page, version ${sv} (page ${v})`);
    const caches = await page.evaluate(async () => { const k = await caches.keys(); const c = await caches.open(k[0]); return { keys: k, n: (await c.keys()).length }; });
    ok(caches.keys.length === 1, `cache storage: ${JSON.stringify(caches)}`);

    // Manifest + installability via CDP
    const cdp = await ctx.newCDPSession(page);
    const man = await cdp.send('Page.getAppManifest').catch(e => ({ errors: [String(e)] }));
    ok(man.url && (!man.errors || !man.errors.length), `manifest ${man.url} errors=${JSON.stringify(man.errors || [])}`);
    try {
      const inst = await cdp.send('Page.getInstallabilityErrors');
      ok(inst.installabilityErrors.length === 0, `installability errors: ${JSON.stringify(inst.installabilityErrors)}`);
    } catch (e) { console.log('INFO installability check unavailable:', e.message); }
    const icons = await page.evaluate(async () => {
      const m = await (await fetch('manifest.webmanifest')).json();
      return Promise.all(m.icons.map(async i => { const r = await fetch(i.src); return i.src + ':' + r.status + ':' + i.purpose; }));
    });
    ok(icons.every(s => s.includes(':200:')), 'icons ' + icons.join(' '));

    // Go fully offline
    await ctx.setOffline(true);
    let netHits = [];
    page.on('response', r => { if (!r.fromServiceWorker() && !r.url().startsWith('data:')) netHits.push(r.url()); });
    await page.reload();
    ok((await page.title()).includes('Trimsheet'), 'offline reload: app loaded');
    const r1 = await calc(page);
    ok(r1.tow.startsWith('985.76') && r1.cg.startsWith('42.56'), `offline calc RUM 120/75/70: ${JSON.stringify(r1)}`);
    await page.goto(base + '?ac=TLB&fuel=300&pic=80&co=80');
    const st = (await page.innerText('#status')).replace(/\n/g, ' ');
    ok(/OUT OF LIMITS/.test(st), 'offline deep link ?ac=TLB…: ' + st);
    ok(netHits.length === 0, 'offline loads served entirely by SW; non-SW responses: ' + JSON.stringify(netHits));
    await ctx.setOffline(false);

    // Online second load also served from cache
    netHits = [];
    const fromSW = [];
    page.on('response', r => fromSW.push(r.fromServiceWorker()));
    await page.reload();
    ok(fromSW.length > 0 && fromSW.every(Boolean), `online repeat load: ${fromSW.filter(Boolean).length}/${fromSW.length} responses from SW cache`);
  }

  if (phase === 'update-before') {
    await page.goto(base);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
    console.log('VERSION', await ver(page), await swVer(page));
  }

  if (phase === 'ignore-toast') {      // new version deployed; user sees toast but ignores it and closes the app
    await page.goto(base);
    await page.waitForSelector('#updateToast:not([hidden])', { timeout: 30000 });
    console.log('toast shown on', await ver(page), '— ignoring and closing app');
  }

  if (phase === 'cold-start') {        // relaunch: waiting SW should already be active, no toast
    await page.goto(base);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    const v = await ver(page), sv = await swVer(page);
    console.log('cold start version', v, sv);
    const keys = await page.evaluate(() => caches.keys());
    await page.waitForTimeout(1500);
    ok(await page.isHidden('#updateToast'), 'no toast on cold start');
    console.log('caches', JSON.stringify(keys));
  }

  if (phase === 'update-after') {
    await page.goto(base);   // navigation triggers SW update check (sw.js is no-cache)
    const before = await ver(page);
    console.log('loaded (from old cache) version', before, await swVer(page));
    await page.waitForSelector('#updateToast:not([hidden])', { timeout: 30000 });
    ok(true, 'update toast shown: ' + (await page.innerText('#updateToast')).replace(/\n/g, ' '));
    const nav = page.waitForNavigation();
    await page.tap('#updateBtn');
    await nav;
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    const after = await ver(page), sv = await swVer(page);
    ok(after !== before && sv === 'wb-' + after, `after Reload: page ${after}, SW ${sv}`);
    const keys = await page.evaluate(() => caches.keys());
    ok(keys.length === 1 && keys[0] === sv, 'old caches deleted: ' + JSON.stringify(keys));
    await page.waitForTimeout(1500);
    ok(await page.isHidden('#updateToast'), 'no toast / no reload loop after update');
    const r = await calc(page);
    ok(r.tow.startsWith('985.76'), 'calc after update: ' + r.tow);
  }
  await ctx.close();
  process.exit(process.exitCode || 0);
})().catch(e => { console.error(e); process.exit(1); });
