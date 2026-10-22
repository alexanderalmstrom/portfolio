importScripts('/cache-polyfill.js')

// Replaced with the cache of this build and its asset list by the
// service-worker plugin in vite.config.ts.
const cacheName = __CACHE__
const precache = __PRECACHE__

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return cache.addAll(precache)
    }),
  )
})

// The caches of earlier builds are cleared once this one takes over. They
// can hold a page as it was when it was cached, which this one leaves to
// the server.
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (name) {
            return name != cacheName
          })
          .map(function (name) {
            return caches.delete(name)
          }),
      )
    }),
  )
})

self.addEventListener('fetch', function (event) {
  console.log(event.request.url)
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request)
    }),
  )
})
