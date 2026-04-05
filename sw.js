const CACHE_NAME = 'pdfluxe-v2.5';
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
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
