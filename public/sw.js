// The precache list is injected at build time by the vite plugin in vite.config.ts.
// The fallback keeps this file valid JavaScript when served unbundled in dev.
const PRECACHE = Array.isArray(self.__LEENKR_PRECACHE__)
  ? self.__LEENKR_PRECACHE__
  : ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png']

const CACHE = 'leenkr-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navigations: network first so deploys land, cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match('/index.html', { ignoreVary: true })
          .then((hit) => hit || caches.match('/', { ignoreVary: true }))
          .then((hit) => hit || Response.error()),
      ),
    )
    return
  }

  // Hashed assets: cache first, then network and store for next time.
  // ignoreVary matters: some servers send `Vary: Origin`, and the Origin header
  // differs between the fetch that cached an asset and the <script>/<link> that
  // reads it back, which would otherwise miss.
  event.respondWith(
    caches.match(request, { ignoreVary: true }).then((hit) => {
      if (hit) return hit
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => caches.match('/index.html', { ignoreVary: true }).then((shell) => shell || Response.error()))
    }),
  )
})
