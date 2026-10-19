/* Pressroom app helper
 * Lets the pages talk to the Apps Script in the background, using the same
 * google.script.run.withSuccessHandler(...).someFunction(...) style as before.
 */
(function () {
  function call(action, args, onOk, onFail) {
    fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: action, args: args }) })
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
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();

// Reads ?key=... from the link
function urlKey() { return new URLSearchParams(location.search).get('key') || ''; }
