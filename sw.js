// Minimal service worker: always loads fresh pages from the internet,
// and shows a friendly message if the phone has no signal.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).catch(function () {
    return new Response(
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:40px 24px;color:#22355e">' +
      '<h2>No connection</h2><p style="color:#6b7280">Check your signal, then pull down or reopen the app.</p></div>',
      { headers: { 'Content-Type': 'text/html' } });
  }));
});
