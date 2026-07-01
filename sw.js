// DevBox Service Worker — RETIRED.
//
// This site no longer uses a service worker. This file is intentionally kept
// as a self-unregistering "kill switch": anyone whose browser already
// installed a previous version of this worker will still have it running
// (deleting this file outright would NOT stop it -- an already-registered
// service worker keeps intercepting requests until it's explicitly told to
// unregister, independent of whether anything still links to it). This
// version clears any caches it created and unregisters itself, so existing
// visitors self-heal back to normal, uncached behavior on their next visit --
// without forcing an abrupt reload while they might be mid-use of a tool.
//
// Once you're confident all prior visitors have picked this up (the browser
// checks for SW updates roughly once a day, or sooner on navigation in some
// browsers), it's safe to delete this file and its <script> reference.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.map(k => caches.delete(k))))
            .then(() => self.registration.unregister())
    );
});
