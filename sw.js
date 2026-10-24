
const CACHE_NAME = "flame-dragon-hub-v6";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./welcome.html",
  "./evolutions.html",
  "./skins.html",
  "./favorites.html",
  "./guide.html",
  "./profile.html",
  "./settings.html",
  "./account.html",
  "./about.html",
  "./style.css",
  "./script.js",
  "./preferences.js",
  "./settings.js",
  "./favorites.js",
  "./skins-data.js",
  "./auth.js",
  "./cursor-glow.js",
  "./manifest.json",
  "./assets/logo.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        await Promise.allSettled(
          FILES_TO_CACHE.map(async file => {
            try {
              const response = await fetch(file, {
                cache: "no-cache"
              });

              if (response.ok) {
                await cache.put(file, response);
              }
            } catch (error) {
              // Skip unavailable files; keep installing.
            }
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key =>
              key.startsWith("flame-dragon-hub-") &&
              key !== CACHE_NAME
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith((async () => {
    try {
      const response = await fetch(request, {
        cache: "no-cache"
      });

      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);

        event.waitUntil(
          cache.put(request, response.clone()).catch(() => {})
        );
      }

      return response;
    } catch (error) {
      const cached = await caches.match(request);

      if (cached) {
        return cached;
      }

      if (request.mode === "navigate") {
        const home = await caches.match("./index.html");

        if (home) {
          return home;
        }
      }

      return new Response("You are offline. Please reconnect and try again.", {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      });
    }
  })());
});
