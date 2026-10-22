// The site no longer has a service worker. Browsers that installed the one
// it used to have look for an update here, and get this one in its place:
// it takes over at once, clears the caches the old one filled and
// unregisters itself, so requests go straight to the network again.
self.addEventListener('install', function () {
  self.skipWaiting()
})

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches
      .keys()
      .then(function (names) {
        return Promise.all(
          names.map(function (name) {
            return caches.delete(name)
          }),
        )
      })
      .then(function () {
        return self.registration.unregister()
      }),
  )
})
