/**
 * Service Worker - DISABLED FOR DEVELOPMENT
 * Bypassing all caching during development
 */

// Force unregister this service worker
self.addEventListener('install', () => {
  console.log('[SW] Force unregistering service worker for development')
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  console.log('[SW] Activating to unregister and clear caches')
  
  // Clear all caches
  caches.keys().then(cacheNames => {
    return Promise.all(
      cacheNames.map(cacheName => {
        console.log('[SW] Deleting cache:', cacheName)
        return caches.delete(cacheName)
      })
    )
  }).then(() => {
    console.log('[SW] All caches cleared')
  })
  
  // Unregister self
  self.registration.unregister().then(() => {
    console.log('[SW] Service worker unregistered successfully')
    // Notify all clients to reload
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'SW_UNREGISTERED' })
      })
    })
  })
  
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // COMPLETELY IGNORE ALL FETCH EVENTS - DO NOT INTERCEPT ANYTHING
  // This prevents the "resolved with non-Response value 'null'" error
  return
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UNREGISTER_SW') {
    self.registration.unregister()
  }
})

console.log('[SW] Development Service Worker - All caching disabled')

/* ORIGINAL SERVICE WORKER CODE DISABLED FOR DEVELOPMENT

/**
 * Service Worker - Advanced caching and offline support
 * Comprehensive caching strategy with background sync and push notifications
 */

const CACHE_VERSION = 'schedium-v1.0.0'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`
const API_CACHE = `${CACHE_VERSION}-api`
const IMAGE_CACHE = `${CACHE_VERSION}-images`

// Cache configuration
const CACHE_CONFIG = {
  static: {
    name: STATIC_CACHE,
    maxEntries: 100,
    maxAgeSeconds: 86400 * 30, // 30 days
  },
  dynamic: {
    name: DYNAMIC_CACHE,
    maxEntries: 50,
    maxAgeSeconds: 86400 * 7, // 7 days
  },
  api: {
    name: API_CACHE,
    maxEntries: 200,
    maxAgeSeconds: 3600, // 1 hour
  },
  images: {
    name: IMAGE_CACHE,
    maxEntries: 100,
    maxAgeSeconds: 86400 * 30, // 30 days
  }
}

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// API endpoints to cache
const CACHEABLE_API_PATTERNS = [
  /\/api\/v1\/auth\/me$/,
  /\/api\/v1\/schedules\/current$/,
  /\/api\/v1\/dashboard\/analytics$/,
  /\/api\/v1\/instructors$/,
  /\/api\/v1\/classrooms$/,
  /\/api\/v1\/programs$/
]

// Background sync patterns
const BACKGROUND_SYNC_PATTERNS = [
  /\/api\/v1\/schedules$/,
  /\/api\/v1\/conflicts$/,
  /\/api\/v1\/analytics\/events$/
]

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching static assets')
        return cache.addAll(PRECACHE_ASSETS)
      })
      .then(() => {
        console.log('[SW] Static assets precached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Precache failed:', error)
      })
  )
})

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('schedium-') && 
                     !Object.values(CACHE_CONFIG).some(config => config.name === cacheName)
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      }),
      
      // Claim all clients
      self.clients.claim()
    ])
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return handleNonGetRequest(event)
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request))
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request))
  } else {
    event.respondWith(handleNavigationRequest(request))
  }
})

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const cacheName = CACHE_CONFIG.api.name
  
  try {
    // Try network first for fresh data
    const networkResponse = await fetch(request.clone())
    
    // Cache successful responses for cacheable endpoints
    if (networkResponse.ok && shouldCacheApiRequest(request)) {
      const cache = await caches.open(cacheName)
      cache.put(request.clone(), networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', request.url)
    
    // Fallback to cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      // Add offline header
      const headers = new Headers(cachedResponse.headers)
      headers.set('X-Served-From', 'cache')
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      })
    }
    
    // Return offline response for critical endpoints
    return createOfflineApiResponse(request)
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  const cacheName = CACHE_CONFIG.images.name
  
  // Try cache first
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    // Fetch from network
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache the image
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Failed to load image:', request.url)
    // Return placeholder image
    return createPlaceholderImageResponse()
  }
}

// Handle static assets with stale-while-revalidate
async function handleStaticRequest(request) {
  const cacheName = CACHE_CONFIG.static.name
  
  // Get from cache
  const cachedResponse = await caches.match(request)
  
  // Fetch from network in background
  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) {
        const cache = caches.open(cacheName)
        cache.then(c => c.put(request, response.clone()))
      }
      return response
    })
    .catch(() => null)
  
  // Return cached version immediately, or wait for network
  return cachedResponse || networkFetch
}

// Handle navigation requests (SPA routing)
async function handleNavigationRequest(request) {
  const cacheName = CACHE_CONFIG.dynamic.name
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache navigation responses
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed for navigation, trying cache:', request.url)
    
    // Try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Fallback to cached index.html for SPA routing
    const indexResponse = await caches.match('/')
    if (indexResponse) {
      return indexResponse
    }
    
    // Last resort - offline page
    return caches.match('/offline.html')
  }
}

// Handle non-GET requests (POST, PUT, DELETE)
function handleNonGetRequest(event) {
  const { request } = event
  
  // Check if it's a background sync candidate
  if (shouldBackgroundSync(request)) {
    event.waitUntil(handleBackgroundSync(request))
  }
  
  // Let the request pass through normally
  return
}

// Background sync for failed requests
async function handleBackgroundSync(request) {
  try {
    // Try to send the request
    await fetch(request.clone())
  } catch (error) {
    // Queue for background sync
    console.log('[SW] Queueing request for background sync:', request.url)
    
    // Store request data for later sync
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' ? await request.text() : null,
      timestamp: Date.now()
    }
    
    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      await self.registration.sync.register('background-sync')
      
      // Store in IndexedDB for persistence
      await storeFailedRequest(requestData)
    }
  }
}

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered')
    event.waitUntil(replayFailedRequests())
  }
})

// Replay failed requests
async function replayFailedRequests() {
  try {
    const failedRequests = await getFailedRequests()
    
    for (const requestData of failedRequests) {
      try {
        const request = new Request(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        })
        
        await fetch(request)
        await removeFailedRequest(requestData.timestamp)
        console.log('[SW] Successfully replayed request:', requestData.url)
      } catch (error) {
        console.log('[SW] Failed to replay request:', requestData.url, error)
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: data.actions || [
      {
        action: 'view',
        title: 'Ver',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Descartar',
        icon: '/icons/dismiss.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const action = event.action
  const data = event.notification.data
  
  if (action === 'view' && data?.url) {
    event.waitUntil(
      clients.openWindow(data.url)
    )
  } else if (action === 'dismiss') {
    // Just close the notification
  } else {
    // Default click - open app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/')
        }
      })
    )
  }
})

// Utility functions
function shouldCacheApiRequest(request) {
  return CACHEABLE_API_PATTERNS.some(pattern => pattern.test(request.url))
}

function shouldBackgroundSync(request) {
  return BACKGROUND_SYNC_PATTERNS.some(pattern => pattern.test(request.url))
}

function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(new URL(request.url).pathname)
}

function isStaticAsset(request) {
  return request.destination === 'script' ||
         request.destination === 'style' ||
         request.destination === 'font' ||
         /\.(js|css|woff|woff2|ttf|eot)$/i.test(new URL(request.url).pathname)
}

function createOfflineApiResponse(request) {
  const url = new URL(request.url)
  
  // Provide minimal offline responses for critical endpoints
  const offlineResponses = {
    '/api/v1/auth/me': { user: null, offline: true },
    '/api/v1/schedules/current': { schedules: [], offline: true },
    '/api/v1/dashboard/analytics': { data: [], offline: true }
  }
  
  const offlineData = offlineResponses[url.pathname]
  if (offlineData) {
    return new Response(JSON.stringify(offlineData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Served-From': 'offline'
      }
    })
  }
  
  return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  })
}

function createPlaceholderImageResponse() {
  // Return a simple SVG placeholder
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#f3f4f6"/>
      <text x="100" y="100" font-family="Arial" font-size="14" fill="#6b7280" text-anchor="middle">
        Imagen no disponible
      </text>
    </svg>
  `
  
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'max-age=86400'
    }
  })
}

// IndexedDB helpers for background sync
async function storeFailedRequest(requestData) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('schedium-sync', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['failed-requests'], 'readwrite')
      const store = transaction.objectStore('failed-requests')
      
      store.add(requestData)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    }
    
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('failed-requests')) {
        const store = db.createObjectStore('failed-requests', { keyPath: 'timestamp' })
        store.createIndex('url', 'url', { unique: false })
      }
    }
  })
}

async function getFailedRequests() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('schedium-sync', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['failed-requests'], 'readonly')
      const store = transaction.objectStore('failed-requests')
      const getAllRequest = store.getAll()
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result)
      getAllRequest.onerror = () => reject(getAllRequest.error)
    }
  })
}

async function removeFailedRequest(timestamp) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('schedium-sync', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['failed-requests'], 'readwrite')
      const store = transaction.objectStore('failed-requests')
      
      store.delete(timestamp)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    }
  })
}

// Cache management and cleanup
async function cleanupExpiredCaches() {
  const cacheNames = await caches.keys()
  
  for (const cacheName of cacheNames) {
    if (cacheName.startsWith('schedium-')) {
      const cache = await caches.open(cacheName)
      const requests = await cache.keys()
      
      for (const request of requests) {
        const response = await cache.match(request)
        if (response) {
          const dateHeader = response.headers.get('date')
          if (dateHeader) {
            const age = Date.now() - new Date(dateHeader).getTime()
            const maxAge = getCacheMaxAge(cacheName)
            
            if (age > maxAge) {
              await cache.delete(request)
            }
          }
        }
      }
    }
  }
}

function getCacheMaxAge(cacheName) {
  for (const config of Object.values(CACHE_CONFIG)) {
    if (config.name === cacheName) {
      return config.maxAgeSeconds * 1000
    }
  }
  return 86400 * 1000 // Default 1 day
}

// Periodic cleanup
setInterval(cleanupExpiredCaches, 86400 * 1000) // Daily cleanup

console.log('[SW] Service Worker initialized with version:', CACHE_VERSION)