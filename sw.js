const CACHE_NAME = 'pdfluxe-v4.0';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/main.js',
    './js/db.js',
    './js/theme.js',
    './favicon.png'
];

self.addEventListener('install', event => {
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', event => {
    // Claim any clients immediately
    event.waitUntil(self.clients.claim());
    // Delete all old caches
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
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
