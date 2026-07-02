/* Smart Hand Score — Service Worker */
/* عند كل رفع نسخة جديدة من التطبيق: غيّر رقم CACHE أدناه (مثلاً v4.10) حتى تُمسح النسخة القديمة من أجهزة المستخدمين تلقائياً */
const CACHE = 'smart-hand-score-v4.9';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

const FONTS = [
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&family=Bebas+Neue&family=Cairo:wght@700;900&display=swap'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(APP_SHELL).then(() => c.addAll(FONTS).catch(() => {}))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // للتنقل (فتح الصفحة): جرّب الشبكة أولاً عشان يوصل آخر تحديث، ولو ما فيه اتصال ارجع للنسخة المخزنة
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // لباقي الملفات (خطوط، أيقونات): من الكاش أولاً، ولو مو موجودة اجلبها وخزّنها
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => new Response('', { status: 408 }));
    })
  );
});
