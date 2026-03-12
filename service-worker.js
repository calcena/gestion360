const CACHE_NAME = 'gestion360-v1';

// Get the base path from the service worker URL
const swUrl = new URL(self.location.href);
const basePath = swUrl.pathname.replace(/service-worker\.js$/, '');

const urlsToCache = [
  basePath,
  basePath + 'index.php',
  basePath + 'views/main.php',
  basePath + 'manifest.json',
  // CSS
  basePath + 'assets/css/bootstrap/bootstrap.min.css',
  basePath + 'assets/css/style.css',
  basePath + 'assets/css/login/login.css',
  // JavaScript libraries
  basePath + 'assets/js/axios/axios.min.js',
  basePath + 'assets/js/bootstrap/bootstrap.min.js',
  // Services - Login
  basePath + 'services/login/login.js',
  basePath + 'services/login/pwa.js',
  // Services - Main
  basePath + 'services/main/main.js',
  // Services - Components
  basePath + 'services/components/sitebar.js',
  // Services - Others
  basePath + 'services/translate/translate.js',
  basePath + 'services/logs/logs.js',
  basePath + 'services/helpers/helper.js',
  // Envios
  basePath + 'services/envios/envio.js',
  // Comentarios
  basePath + 'services/comentarios/comentarios.js',
  basePath + 'services/comentarios/comentario.js',
  // Images
  basePath + 'assets/images/logo.png',
  basePath + 'assets/images/icons/pwa-192.png',
  basePath + 'assets/images/icons/pwa-512.png'
];

// Install event
self.addEventListener('install', event => {
  self.skipWaiting(); // Force activation of new service worker
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('Error caching files:', err))
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Return offline fallback if available
        if (event.request.url.endsWith('.php')) {
          return caches.match(basePath + 'index.php');
        }
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of all clients immediately
});