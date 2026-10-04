/*
 * Web-only helper (not used on phones).
 *
 * expo-sqlite in the browser needs `SharedArrayBuffer`, which browsers only
 * enable on "cross-origin isolated" pages. That requires two HTTP headers
 * (COOP + COEP). The Expo dev server doesn't send them for the HTML page,
 * so this service worker adds them to every response.
 * It is registered by src/utils/crossOriginIsolation.web.ts.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const request = event.request;
  // Chrome bug workaround: these requests can't be re-fetched by a service worker.
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

  event.respondWith(
    fetch(request).then((response) => {
      if (response.status === 0) return response; // opaque responses can't be modified
      const headers = new Headers(response.headers);
      headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
      headers.set('Cross-Origin-Opener-Policy', 'same-origin');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }),
  );
});
