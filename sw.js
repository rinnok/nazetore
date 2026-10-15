const VERSION = 'nazetore-v11';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/icon-maskable-512.png', 'data/themes.json', 'img/topic-001.svg', 'img/topic-002.svg', 'img/topic-003.svg', 'img/topic-004.svg', 'img/topic-005.svg', 'img/topic-006.svg', 'img/topic-007.svg', 'img/topic-008.svg', 'img/topic-009.svg', 'img/topic-010.svg', 'img/topic-011.svg', 'img/topic-012.svg', 'img/topic-013.svg', 'img/topic-014.svg', 'img/topic-015.svg', 'img/topic-016.svg', 'img/topic-017.svg', 'img/topic-018.svg', 'img/topic-019.svg', 'img/topic-020.svg', 'img/topic-021.svg', 'img/topic-023.svg', 'img/topic-024.svg', 'img/topic-025.svg', 'img/topic-026.svg', 'img/topic-027.svg', 'img/topic-028.svg', 'img/topic-029.svg', 'img/topic-030.svg', 'img/case-film.svg', 'img/case-izakaya.svg', 'img/case-onsen-dmo.svg', 'img/case-onsen-town.svg', 'img/case-sake.svg', 'img/case-university.svg', 'img/case-workwear.svg', 'img/case-zoo.svg', 'img/news-ai-marketing.svg', 'img/news-inbound.svg', 'img/news-consumption-forecast.svg', 'img/news-lemon-sour.svg', 'img/news-pb-price.svg', 'img/summer-budget.svg', 'img/tiktok-shop.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const isData = url.pathname.endsWith('/data/themes.json');
  if (isData) {
    // network first: 新しい問題があれば取り、なければ保存済みで動かす
    e.respondWith(fetch(e.request).then(r => { if (!r.ok) throw new Error(r.status); const cp = r.clone(); caches.open(VERSION).then(c => c.put(e.request, cp)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true })));
    return;
  }
  // app shell: cache first, 裏で更新
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(e.request, cp)); } return r; }).catch(() => hit || caches.match('index.html'));
    return hit || net;
  }));
});
