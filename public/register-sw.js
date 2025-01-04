if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        '/service-worker.js',
        {
          scope: '/',
          updateViaCache: 'all',
        },
      );

      // Check for updates on page load
      registration.update();

      // Optional: You can also listen for updates found
      registration.onupdatefound = () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.onstatechange = () => {
            if (newWorker.state === 'installed') {
              // 'installed' means the new worker is installed, but might be waiting
              // If you used skipWaiting, it will activate immediately
              // If not, you can prompt the user to refresh here
              console.log('A new service worker version has been installed.');
            }
          };
        }
      };
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}
