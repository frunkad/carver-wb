/* Service-worker registration + update UX.
 * - Browser re-checks sw.js (served no-cache) on every navigation; we also call reg.update()
 *   on load and whenever the app returns to the foreground (throttled).
 * - A new version installs + precaches in the background, then WAITS. We show an
 *   "Update available — Reload" toast; tapping it tells the waiting SW to skipWaiting and the
 *   page reloads exactly once on controllerchange. If ignored, the browser activates the new
 *   SW automatically the next time the app is cold-started (all tabs/windows closed).
 */
(function () {
  'use strict';
  var ver = document.querySelector('meta[name="app-version"]');
  var verEl = document.getElementById('ver');
  if (verEl && ver) verEl.textContent = '· v' + ver.content;
  if (!('serviceWorker' in navigator)) return;

  var toast = document.getElementById('updateToast');
  var btn = document.getElementById('updateBtn');
  var userAccepted = false;
  var reloading = false;

  function showToast(worker) {
    toast.hidden = false;
    btn.onclick = function () {
      userAccepted = true;
      btn.disabled = true;
      btn.textContent = 'Updating…';
      worker.postMessage({ type: 'SKIP_WAITING' });
    };
  }

  // Reload once, and only when the user asked for the update (never on first install's clients.claim()).
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!userAccepted || reloading) return;
    reloading = true;
    location.reload();
  });

  function track(reg) {
    if (reg.waiting && navigator.serviceWorker.controller) showToast(reg.waiting);
    reg.addEventListener('updatefound', function () {
      var nw = reg.installing;
      if (!nw) return;
      nw.addEventListener('statechange', function () {
        // "installed" + an existing controller => this is an update, not the first install.
        if (nw.state === 'installed' && navigator.serviceWorker.controller) showToast(nw);
      });
    });
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { scope: './', updateViaCache: 'none' }).then(function (reg) {
      track(reg);
      var last = Date.now();
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && Date.now() - last > 60000) {
          last = Date.now();
          reg.update().catch(function () {});
        }
      });
    }).catch(function (e) { console.warn('SW registration failed', e); });
  });
})();
