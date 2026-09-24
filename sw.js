// TexCom service worker: lets the web version work offline.
// Network first (so an online user always gets the latest files), falling back to the cached copy offline.
const CACHE = 'texcom-v3';
const CORE = [
    './', 'index.html', 'themes.css', 'style.css', 'slip.css', 'MarcTooltips.css',
    'versions.js', 'settings.js', 'gpad.js', 'panel.js', 'languages.js', 'record.js', 'audio.js',
    'sketch2.js', 'editor.js', 'gamepads.js', 'idb-keyval-iife.js', 'TexCom.json', 'bell.m4a',
    'texcomhelp.html', 'manifest.json', 'partner.html', 'partner-link.js', 'conversation.js', 'companion.html',
    'libraries/peerjs.min.js', 'libraries/qrcode.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
    event.respondWith(
        fetch(req)
            .then(res => {
                if (res.ok) {
                    const copy = res.clone();
                    caches.open(CACHE).then(cache => cache.put(req, copy));
                }
                return res;
            })
            .catch(() => caches.match(req, { ignoreSearch: true }))
    );
});
