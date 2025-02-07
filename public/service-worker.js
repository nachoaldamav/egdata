self.addEventListener('install', (_event) => {
  console.debug('Service worker installed');
  // Service Worker skipping waiting phase immediately for simplicity
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.debug('Service worker activated');
  // Take control of all clients as soon as the SW is activated
  event.waitUntil(self.clients.claim());
});

/**
 * Check if the URL ends with ".js" or ".css".
 */
function isJsOrCssRequest(request) {
  const url = new URL(request.url);
  if (url.pathname.includes('/node_modules/')) return false;
  return url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
}

self.addEventListener('fetch', (event) => {
  // Only intercept .js and .css requests
  if (!isJsOrCssRequest(event.request)) {
    return; // Let the request proceed normally
  }

  console.debug('Handling fetch event for', event.request.url);

  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        // If the request failed or we got a non-200 response, just return it
        if (!response.ok) {
          return response;
        }

        // Clone the response so we can read its text
        const clonedResponse = response.clone();
        const text = await clonedResponse.text();

        // If we detect any HTML-like tag, return 404
        if (text.match(/<html[^>]*>/i)) {
          return new Response('Not found', {
            status: 404,
            statusText: 'Not Found',
          });
        }

        // Otherwise, return the original (unread) response
        return response;
      })
      .catch(() => {
        // If fetch fails altogether, you can decide how to handle errors
        return new Response('Network error', { status: 502 });
      }),
  );
});
