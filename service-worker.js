const CACHE_NAME = 'ciphervault-shell-v19';
const APP_SHELL = [
  '/', '/index.html', '/vault.html', '/manifest.webmanifest',
  '/styles.css', '/vault.css', '/password-check.css', '/password-visibility.css', '/local-vault.css',
  '/language.css?v=20260930-0941', '/biometric.css?v=20260930-1540', '/responsive.css?v=20260930-1516',
  '/app.js?v=20260930-1540', '/vault.js', '/language.js?v=20260930-1540', '/pwa.js',
  '/crypto-vault.js?v=20260930-1540', '/vault-store.js?v=20260930-1540', '/biometric-vault.js?v=20260930-1540',
  '/assets/fonts/ciphervault-1.woff2', '/assets/fonts/ciphervault-10.woff2', '/assets/fonts/ciphervault-11.woff2', '/assets/fonts/ciphervault-12.woff2', '/assets/fonts/ciphervault-13.woff2', '/assets/fonts/ciphervault-14.woff2', '/assets/fonts/ciphervault-15.woff2', '/assets/fonts/ciphervault-2.woff2', '/assets/fonts/ciphervault-3.woff2', '/assets/fonts/ciphervault-4.woff2', '/assets/fonts/ciphervault-5.woff2', '/assets/fonts/ciphervault-6.woff2', '/assets/fonts/ciphervault-7.woff2', '/assets/fonts/ciphervault-8.woff2', '/assets/fonts/ciphervault-9.woff2', '/assets/fonts/fonts.css',
  '/assets/pwa-icon-192.png', '/assets/pwa-icon-512.png', '/assets/apple-touch-icon.png',
  '/assets/personal-biohazard-mark.png', '/assets/alansari-tech-logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    const offlineRoute = url.pathname === '/vault.html' ? '/vault.html' : '/';
    event.respondWith(fetch(event.request).catch(() => caches.match(offlineRoute)));
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
