/* Pressroom app helper
 * Lets the pages talk to the Apps Script in the background, using the same
 * google.script.run.withSuccessHandler(...).someFunction(...) style as before.
 */
(function () {
  function call(action, args, onOk, onFail) {
    fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: action, args: args, key: urlKey() }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok) { if (onOk) onOk(d.result); }
        else if (onFail) onFail({ message: (d && d.error) || 'Something went wrong.' });
      })
      .catch(function () {
        if (onFail) onFail({ message: 'No connection. Check your signal and try again.' });
      });
  }
  function runner(onOk, onFail) {
    return new Proxy({}, {
      get: function (_, name) {
        if (name === 'withSuccessHandler') return function (h) { return runner(h, onFail); };
        if (name === 'withFailureHandler') return function (h) { return runner(onOk, h); };
        return function () { call(name, Array.prototype.slice.call(arguments), onOk, onFail); };
      }
    });
  }
  window.google = { script: { run: runner(null, null), host: { close: function () {} } } };

  // Lets the phone install these pages as apps
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js?v=3').catch(function () {}); });
  }
})();

// Reads ?key=... from the link
function urlKey() { return new URLSearchParams(location.search).get('key') || ''; }

/* ---------- Refresh: ↻ button + automatic refresh ----------
 * Each page can set:
 *   window.appRefreshData = function () {...}   // re-load the numbers
 *   window.appCanRefresh  = function () {...}   // return false when there's unsaved work
 */
(function () {
  var REFRESH_EVERY_MS = 60 * 1000;   // auto-refresh every minute while the app is open
  var hiddenAt = 0;

  function canRefresh() { return !window.appCanRefresh || window.appCanRefresh(); }
  function softRefresh() {
    if (document.visibilityState !== 'visible') return;
    if (window.appRefreshData && canRefresh()) window.appRefreshData();
  }

  window.addEventListener('load', function () {
    var css = document.createElement('style');
    css.textContent =
      '#refreshBtn{position:fixed;z-index:20;top:calc(env(safe-area-inset-top) + 14px);right:14px;width:42px;height:42px;' +
      'border-radius:50%;border:1px solid #d5dbe5;background:#fff;color:#22355e;display:flex;align-items:center;justify-content:center;' +
      'box-shadow:0 2px 8px rgba(16,24,40,.10);cursor:pointer;-webkit-tap-highlight-color:transparent;padding:0}' +
      '#refreshBtn:active{background:#f3f5f8}#refreshBtn svg{width:22px;height:22px}' +
      '#refreshBtn.spin svg{animation:rfspin .8s linear infinite}@keyframes rfspin{to{transform:rotate(360deg)}}';
    document.head.appendChild(css);

    var btn = document.createElement('button');
    btn.id = 'refreshBtn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Refresh');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><polyline points="20 4 20 9 15 9"/></svg>';
    btn.onclick = function () {
      if (!canRefresh() && !confirm('You have unsaved counts. Refresh anyway and lose them?')) return;
      window.appCanRefresh = null;          // skip the "unsaved" warning on the reload itself
      btn.classList.add('spin');
      location.reload();                     // full refresh: newest numbers AND newest app version
    };
    document.body.appendChild(btn);

    setInterval(softRefresh, REFRESH_EVERY_MS);
  });

  // Coming back to the app (from another app or the home screen) → refresh right away
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); return; }
    if (hiddenAt && Date.now() - hiddenAt > 5000) softRefresh();
  });
})();
