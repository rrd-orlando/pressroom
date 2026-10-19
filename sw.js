// Minimal service worker. It ONLY steps in when a page itself is opened
// (never for icons, scripts or data), and shows a friendly message if there's no signal.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  if (e.request.mode !== 'navigate') return;   // let the phone load icons, images, scripts normally
  e.respondWith(fetch(e.request).catch(function () {
    return new Response(
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:40px 24px;color:#22355e">' +
      '<h2>No connection</h2><p style="color:#6b7280">Check your signal, then reopen the app.</p></div>',
      { headers: { 'Content-Type': 'text/html' } });
  }));
});
