// 讓 App 離線也能打開：有網路時抓最新版本，沒網路時用存起來的版本
const CACHE = "myhq-v5";
const FILES = ["./", "index.html", "style.css", "app.js", "manifest.webmanifest", "icon-180.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // 只處理 App 自己的檔案；GitHub 同步的請求直接放行
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  const key = url.origin + url.pathname;
  e.respondWith(
    fetch(key, { cache: "no-cache" }) // 每次都向伺服器確認有沒有新版本
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(key, copy));
        return res;
      })
      .catch(() => caches.match(key).then(r => r || caches.match(url.origin + url.pathname.replace(/[^/]*$/, ""))))
  );
});
