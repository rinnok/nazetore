const VERSION = 'nazetore-v23';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/icon-maskable-512.png', 'data/themes.json', 'img/topic-121.svg', 'img/topic-122.svg', 'img/topic-123.svg', 'img/topic-124.svg', 'img/topic-125.svg', 'img/topic-126.svg', 'img/topic-127.svg', 'img/topic-128.svg', 'img/topic-129.svg', 'img/topic-130.svg', 'img/topic-131.svg', 'img/topic-132.svg', 'img/topic-133.svg', 'img/topic-134.svg', 'img/topic-135.svg', 'img/topic-136.svg', 'img/topic-137.svg', 'img/topic-138.svg', 'img/topic-139.svg', 'img/topic-140.svg', 'img/topic-111.svg', 'img/topic-112.svg', 'img/topic-113.svg', 'img/topic-114.svg', 'img/topic-115.svg', 'img/topic-116.svg', 'img/topic-117.svg', 'img/topic-118.svg', 'img/topic-119.svg', 'img/topic-120.svg', 'img/topic-101.svg', 'img/topic-102.svg', 'img/topic-103.svg', 'img/topic-104.svg', 'img/topic-105.svg', 'img/topic-106.svg', 'img/topic-107.svg', 'img/topic-108.svg', 'img/topic-109.svg', 'img/topic-110.svg', 'img/topic-091.svg', 'img/topic-092.svg', 'img/topic-093.svg', 'img/topic-094.svg', 'img/topic-095.svg', 'img/topic-096.svg', 'img/topic-097.svg', 'img/topic-098.svg', 'img/topic-099.svg', 'img/topic-100.svg', 'img/topic-072.svg', 'img/topic-073.svg', 'img/topic-074.svg', 'img/topic-075.svg', 'img/topic-076.svg', 'img/topic-077.svg', 'img/topic-079.svg', 'img/topic-080.svg', 'img/topic-081.svg', 'img/topic-082.svg', 'img/topic-083.svg', 'img/topic-084.svg', 'img/topic-085.svg', 'img/topic-086.svg', 'img/topic-087.svg', 'img/topic-088.svg', 'img/topic-089.svg', 'img/topic-090.svg', 'img/topic-001.svg', 'img/topic-002.svg', 'img/topic-003.svg', 'img/topic-004.svg', 'img/topic-005.svg', 'img/topic-006.svg', 'img/topic-007.svg', 'img/topic-008.svg', 'img/topic-009.svg', 'img/topic-010.svg', 'img/topic-011.svg', 'img/topic-012.svg', 'img/topic-013.svg', 'img/topic-014.svg', 'img/topic-015.svg', 'img/topic-016.svg', 'img/topic-017.svg', 'img/topic-018.svg', 'img/topic-019.svg', 'img/topic-020.svg', 'img/topic-021.svg', 'img/topic-023.svg', 'img/topic-024.svg', 'img/topic-025.svg', 'img/topic-026.svg', 'img/topic-027.svg', 'img/topic-028.svg', 'img/topic-029.svg', 'img/topic-030.svg', 'img/topic-031.svg', 'img/topic-032.svg', 'img/topic-033.svg', 'img/topic-034.svg', 'img/topic-035.svg', 'img/topic-036.svg', 'img/topic-037.svg', 'img/topic-038.svg', 'img/topic-039.svg', 'img/topic-040.svg', 'img/topic-041.svg', 'img/topic-042.svg', 'img/topic-043.svg', 'img/topic-044.svg', 'img/topic-045.svg', 'img/topic-046.svg', 'img/topic-047.svg', 'img/topic-048.svg', 'img/topic-049.svg', 'img/topic-050.svg', 'img/topic-051.svg', 'img/topic-052.svg', 'img/topic-053.svg', 'img/topic-054.svg', 'img/topic-055.svg', 'img/topic-056.svg', 'img/topic-057.svg', 'img/topic-058.svg', 'img/topic-059.svg', 'img/topic-060.svg', 'img/topic-061.svg', 'img/topic-062.svg', 'img/topic-063.svg', 'img/topic-064.svg', 'img/topic-065.svg', 'img/topic-066.svg', 'img/topic-067.svg', 'img/topic-068.svg', 'img/topic-069.svg', 'img/topic-070.svg', 'img/case-film.svg', 'img/case-izakaya.svg', 'img/case-onsen-dmo.svg', 'img/case-onsen-town.svg', 'img/case-sake.svg', 'img/case-university.svg', 'img/case-workwear.svg', 'img/case-zoo.svg', 'img/news-ai-marketing.svg', 'img/news-inbound.svg', 'img/news-consumption-forecast.svg', 'img/news-lemon-sour.svg', 'img/news-pb-price.svg', 'img/summer-budget.svg', 'img/tiktok-shop.svg', 'img/topic-141.svg', 'img/topic-142.svg', 'img/topic-143.svg', 'img/topic-144.svg', 'img/topic-145.svg', 'img/topic-146.svg', 'img/topic-147.svg', 'img/topic-148.svg', 'img/topic-149.svg', 'img/topic-150.svg'];

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
