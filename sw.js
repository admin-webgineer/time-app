const CACHE_NAME = 'pwa-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './fonts/Vazirmatn-RD[wght].woff2' // فونت‌ها را اگر در گیت‌هاب هستند اینجا اضافه کنید
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null)
  )));
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('script.google.com')) return;
  
  // برای فایل‌های اصلی، اول شبکه را چک کن (برای آپدیت سریع)
  if (e.request.destination === 'document' || e.request.url.includes('app.js') || e.request.url.includes('style.css')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // بقیه فایل‌ها (فونت و ...) اول از کش
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
  }
});