// TexCom service worker: lets the web version work offline.
// Network first (so an online user always gets the latest files), falling back to the cached copy offline.
const CACHE = 'texcom-v5';
const CORE = [
    './', 'index.html', 'texcomhelp.html', 'partner.html', 'companion.html', 'manifest.json', 'TexCom.json', 'bell.m4a',
    // styles
    'themes.css', 'style.css', 'slip.css', 'MarcTooltips.css', 'libraries/picmo/picmostyles.css',
    // the app
    'versions.js', 'settings.js', 'gpad.js', 'panel.js', 'languages.js', 'record.js', 'audio.js',
    'sketch2.js?1789976789', 'editor.js', 'conversation.js', 'partner-link.js', 'gamepads.js', 'idb-keyval-iife.js',
    // libraries it cannot start without
    'libraries/slip.js', 'libraries/tinycolor-min.js', 'libraries/dat.gui.min.js', 'libraries/recorder.js',
    'libraries/MarcTooltips.js', 'libraries/peerjs.min.js', 'libraries/qrcode.min.js', 'libraries/popup-menu.js',
    'libraries/notiflix-confirm-aio-3.2.5.min.js', 'libraries/notiflix-loading-aio-3.2.5.min.js',
    'libraries/notiflix-notify-aio-3.2.5.min.js',
    // the emoji picker and its data, so it works offline too
    'libraries/picmo/popup.js', 'libraries/picmo/index.js', 'libraries/picmo/picmo.js',
    'libraries/picmo/emojibase/en/data.json', 'libraries/picmo/emojibase/en/messages.json',
    // icons
    'images/apple-touch-icon.png', 'images/favicon-32.png'
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
