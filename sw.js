// DevBox Service Worker — Cache-first strategy for offline support
//
// IMPORTANT: bump CACHE every time you deploy changes to any precached file,
// tool page, or asset. Cache-first means a visitor who already has this app
// installed will keep getting the OLD version forever until the cache name
// changes (the activate handler below deletes old-named caches automatically).
const CACHE = 'devbox-v2';

// Core assets to pre-cache on install
const PRECACHE = [
    './',
    './index.html',
    './manifest.json',
    './assets/style.css',
    './assets/shared.js',
    './assets/sidebar.js',
    // Tool pages — cached on first visit (see fetch handler)
];

// Cache all tool HTML files dynamically on fetch
const TOOL_PATTERN = /\/tools\/[^/]+\.html$/;
const ASSET_PATTERN = /\/assets\//;

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);

    // Only handle same-origin GET requests
    if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

    // Cache-first for assets + tool pages
    if (ASSET_PATTERN.test(url.pathname) || TOOL_PATTERN.test(url.pathname) || url.pathname.endsWith('index.html') || url.pathname.endsWith('/')) {
        e.respondWith(
            caches.match(e.request).then(cached => {
                if (cached) return cached;
                return fetch(e.request).then(res => {
                    if (!res || res.status !== 200 || res.type !== 'basic') return res;
                    const clone = res.clone();
                    caches.open(CACHE).then(cache => cache.put(e.request, clone));
                    return res;
                }).catch(() => caches.match('./index.html')); // Offline fallback
            })
        );
        return;
    }

    // Network-first for everything else (API calls, external fonts, etc.)
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
