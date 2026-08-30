const SW_VERSION = "v1";
const OFFLINE_CACHE = `lh-offline-${SW_VERSION}`;
const STATIC_CACHE = `lh-static-${SW_VERSION}`;

const STATIC_PREFIXES = ["/_next/static/", "/icon.png", "/apple-icon.png", "/favicon.ico", "/logo-transparent.png", "/logo.jpg"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("lh-") && k !== OFFLINE_CACHE && k !== STATIC_CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

const OFFLINE_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offline · Language Hub</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#faf8f4;color:#1d2433;
    font-family:system-ui,-apple-system,sans-serif;padding:0 24px;text-align:center}
  main{max-width:420px;background:rgba(255,255,255,.9);border:1px solid #ddd6fe;border-radius:32px;padding:40px;
    box-shadow:0 24px 60px -30px rgba(99,102,241,.45)}
  h1{margin:20px 0 8px;font-size:22px;font-weight:800}
  p{margin:0;font-size:15px;line-height:1.6;color:#64748b}
</style>
</head>
<body><main>
  <div style="font-size:40px">📡</div>
  <h1>You&rsquo;re offline.</h1>
  <p>Language Hub needs a connection. Check your network and try again.</p>
</main></body>
</html>`;

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never proxy the SSE feed or API calls — they must reach the server live.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/events")) return;

  // Navigations: network first, offline fallback page on failure.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(OFFLINE_PAGE, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } })
      )
    );
    return;
  }

  // Never cache uploads/avatars — the profile photo must stay fresh.
  if (url.pathname.startsWith("/avatars/") || url.pathname.startsWith("/uploads/")) return;

  // Stale-while-revalidate for immutable build assets and public images.
  const isStatic =
    STATIC_PREFIXES.some((p) => url.pathname.startsWith(p)) || /\.(?:png|jpe?g|webp|gif|svg|ico|woff2?|ttf)$/.test(url.pathname);
  if (!isStatic) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            cache.put(request, copy);
          }
          return res;
        })
        .catch(() => cached);
      return cached ?? network;
    })()
  );
});