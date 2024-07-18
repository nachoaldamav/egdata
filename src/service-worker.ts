const CACHE_NAME = 'epicgames-images-cache-v1';
const IMAGE_URL_PATTERN = /^https:\/\/cdn1\.epicgames\.com\//;
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME));
});

// Listen for messages from clients
self.addEventListener('message', async (event) => {
  console.log('Message received from client', event.data);
  const { type, payload } = event.data;

  if (type === 'track') {
    console.log('Tracking event', payload);
    await fetch('http://localhost:4000/ping', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'no-cors',
    }).catch((err) => {
      console.error('Error sending request to server', err);
    });

    console.log('Event tracked');
  }
});

self.addEventListener('fetch', (event: FetchEvent) => {
  if (IMAGE_URL_PATTERN.test(event.request.url)) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        });

        if (response) {
          const fetchTime = response.headers.get('sw-fetch-time');
          if (fetchTime && Date.now() - new Date(fetchTime).getTime() < MAX_AGE) {
            fetchPromise.catch(() => {}); // Ignore fetch errors for revalidation
            return response;
          }
        }

        return fetchPromise;
      }),
    );
  }
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              return caches.delete(cacheName);
            }
          }),
        ),
      )
      .then(() => self.clients.claim()), // Activate the new service worker immediately
  );
});
