// 元号タイムラインのサービスワーカー。
// 一度開いたページを端末に保存し、電波がないときは保存したものを返す。
const CACHE = "gengo-timeline-v1";

// index.html が読み込む assets/ のファイル（ビルドのたびに名前が変わる）
const assetsIn = (html) => [...html.matchAll(/(?:src|href)="\.\/(assets\/[^"]+)"/g)].map((m) => `./${m[1]}`);

// インストール時に、ページ本体・アイコン・assets/ のファイルを保存する
async function precache() {
  const cache = await caches.open(CACHE);
  const response = await fetch("./", { cache: "no-cache" });
  const html = await response.clone().text();
  await cache.put("./", response);
  await cache.addAll(["./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", ...assetsIn(html)]);
}

// 保存してある index.html が使っていない assets/ のファイル（古いビルドの残り）を消す
async function prune() {
  const cache = await caches.open(CACHE);
  const page = await cache.match("./");
  if (!page) return;
  const current = assetsIn(await page.text()).map((a) => new URL(a, self.registration.scope).href);
  if (current.length === 0) return;
  for (const request of await cache.keys()) {
    if (request.url.includes("/assets/") && !current.includes(request.url)) await cache.delete(request);
  }
  for (const name of await caches.keys()) if (name !== CACHE) await caches.delete(name);
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(prune().then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // ページ本体: まずネットワークから最新を取り、だめなら保存したものを返す
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("./", copy));
          return response;
        })
        .catch(() => caches.match("./")),
    );
    return;
  }

  // それ以外（JS・CSS・アイコン・Web フォント）: 保存してあればそれを返し、なければ取ってきて保存する
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok || response.type === "opaque") {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
