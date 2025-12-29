// نام کش اصلی (فقط وقتی ساختار کلی عوض شد این را تغییر دهید)
const CACHE_NAME = 'factory-pwa-core-v1';

// فایل‌هایی که حتما باید کش شوند تا برنامه آفلاین کار کند
const ASSETS = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // نصب فوری
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching assets');
      return cache.addAll(ASSETS).catch(err => console.error('SW: Pre-cache failed', err));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('SW: Cleaning old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 1. درخواست‌های API (مثل گوگل شیت) را هرگز کش نکن
  if (event.request.method === 'POST' || event.request.url.includes('script.google.com')) {
    return;
  }

  // 2. استراتژی Network First برای فایل‌های اصلی (HTML, JS, CSS)
  // این باعث می‌شود همیشه آخرین نسخه را چک کند، و اگر آفلاین بود از کش بخواند
  // این یعنی نیازی نیست دستی ورژن را تغییر دهید!
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match(event.request); // اگر آفلاین بود، از کش بده
        })
    );
    return;
  }

  // 3. استراتژی Stale-While-Revalidate برای سایر فایل‌ها (تصاویر و ...)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => {}); // خطا را نادیده بگیر اگر آفلاینیم

      return cachedResponse || fetchPromise;
    })
  );
});