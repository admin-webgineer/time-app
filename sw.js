const CACHE_NAME = 'stopwatch-pwa-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null)
  )));
});

self.addEventListener('fetch', e => {
  if (e.request.method === 'POST') return;
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});