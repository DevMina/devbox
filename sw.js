// DevBox Service Worker
//
// Strategy (chosen specifically to keep PWA installability working *without*
// reintroducing the "edited HTML doesn't show up" bug this replaced):
//  - HTML pages (index, tool pages, contact) -> NETWORK-FIRST. Always fetch the
//    latest version when online; only fall back to the cached copy if the
//    network request fails (i.e. actually offline). Page edits show up on the
//    very next reload -- no cache clear needed.
//  - Static assets (CSS/JS under /assets/) -> CACHE-FIRST, for speed and
//    offline support, since they change far less often than page content.
//
// A registered service worker with an active fetch handler is one of the
// browser's installability requirements for "Add to Home Screen" / the
// install prompt -- this file exists to satisfy that, while the network-first
// HTML strategy above is what keeps content fresh.
//
// IMPORTANT: bump CACHE if you ever change what's precached below, or want to
// force-invalidate cached assets for returning visitors -- the activate
// handler deletes any cache not matching the current name.
const CACHE = 'devbox-v4';

const PRECACHE = [
    './assets/style.css',
    './assets/shared.js',
    './assets/sidebar.js',
];

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

    if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

    // HTML documents -- network-first
    const isHTML = e.request.mode === 'navigate' ||
                   url.pathname.endsWith('.html') ||
                   url.pathname.endsWith('/');
    if (isHTML) {
        e.respondWith(
            fetch(e.request).then(res => {
                if (res && res.status === 200 && res.type === 'basic') {
                    const clone = res.clone();
                    caches.open(CACHE).then(cache => cache.put(e.request, clone));
                }
                return res;
            }).catch(() =>
                caches.match(e.request).then(cached => cached || caches.match('./index.html'))
            )
        );
        return;
    }

    // Static assets -- cache-first
    if (ASSET_PATTERN.test(url.pathname)) {
        e.respondWith(
            caches.match(e.request).then(cached => {
                if (cached) return cached;
                return fetch(e.request).then(res => {
                    if (!res || res.status !== 200 || res.type !== 'basic') return res;
                    const clone = res.clone();
                    caches.open(CACHE).then(cache => cache.put(e.request, clone));
                    return res;
                });
            })
        );
        return;
    }

    // Everything else (API calls, external fonts, etc.) -- network-first
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
