const CACHE_NAME = 'shyamved-cache-v1'
const OFFLINE_URL = '/offline.html'

// App Shell Resources (Safe to cache)
const STATIC_RESOURCES = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/offline.html',
]

// Exclude dynamic routes (financial data, auth, API, Realtime)
const IGNORED_PREFIXES = ['/api/', '/supabase/', '/admin/', '/office/', '/resident/']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_RESOURCES)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // 1. Bypass Service Worker for Supabase Realtime & API calls
  if (IGNORED_PREFIXES.some(prefix => url.pathname.startsWith(prefix))) {
    return
  }

  // 2. Cache First Strategy for Static Assets (Images, CSS, JS)
  if (
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.includes('/_next/static/')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse
        return fetch(event.request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone())
            return networkResponse
          })
        })
      })
    )
    return
  }

  // 3. Network First for HTML Document (Ensures fresh UI, falls back to offline)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL)
      })
    )
    return
  }
})
