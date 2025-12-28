const CACHE_NAME = 'factory-pwa-v3'; // با هر بار تغییر کد، این عدد را بالا ببرید
const ASSETS = [
  './index.html',
  './manifest.json'
  // نکته: اگر فایلی در اینجا باشد ولی در گیتهاب نباشد، کل سرویس‌ورکر از کار می‌افتد.
  // فعلا فقط فایل‌های حیاتی را کش می‌کنیم.
];

// 1. نصب و کش کردن فایل‌های حیاتی
self.addEventListener('install', (event) => {
  self.skipWaiting(); // فعال‌سازی فوری نسخه جدید
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching Assets');
      return cache.addAll(ASSETS).catch(err => {
        console.error('SW: Cache addAll failed', err);
        // اگر فایلی پیدا نشد، خطا را نادیده نگیر اما باعث توقف کامل نشو
      });
    })
  );
});

// 2. پاکسازی کش‌های قدیمی
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('SW: Clearing Old Cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // کنترل فوری کلاینت‌ها
});

// 3. استراتژی: اول کش، بعد شبکه (برای سرعت بالا)
self.addEventListener('fetch', (event) => {
  // درخواست‌های ارسالی به گوگل شیت (API) نباید کش شوند
  if (event.request.method === 'POST' || event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // اگر در کش بود همان را بده (سرعت آنی)
      if (cachedResponse) {
        // در پس‌زمینه نسخه جدید را هم بگیر تا برای دفعه بعد آماده باشد
        fetch(event.request).then(networkResponse => {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse);
          });
        }).catch(() => {}); // اگر آفلاین بود مهم نیست
        
        return cachedResponse;
      }
      
      // اگر در کش نبود از شبکه بگیر
      return fetch(event.request);
    })
  );
});