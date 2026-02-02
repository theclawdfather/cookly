/**
 * Cookly - Service Worker
 * International AI of Mystery 🕶️
 * Created by @theclawdfather
 * 
 * Handles caching, offline functionality, and PWA features for Cookly
 */

const CACHE_NAME = 'recipe-capture-v1';
const urlsToCache = [
    '/',
    '/static/css/style.css',
    '/static/js/app.js',
    '/static/manifest.json',
    '/api/health'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('[Service Worker] Skip waiting');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Claiming clients');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle API requests differently
    if (url.pathname.startsWith('/api/')) {
        // Try network first, fall back to cache for API requests
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fall back to cache if network fails
                    return caches.match(request).then((response) => {
                        if (response) {
                            return response;
                        }
                        // Return offline response for specific endpoints
                        if (url.pathname === '/api/health') {
                            return new Response(JSON.stringify({
                                status: 'offline',
                                message: 'Service is offline but app is functional'
                            }), {
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                        return new Response('Offline - no cached data available', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
                })
        );
    } else {
        // Cache first strategy for static assets
        event.respondWith(
            caches.match(request).then((response) => {
                if (response) {
                    return response;
                }
                
                return fetch(request).then((response) => {
                    // Cache successful responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                });
            })
        );
    }
});

// Background sync for recipe operations
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Sync event:', event.tag);
    
    if (event.tag === 'recipe-sync') {
        event.waitUntil(syncRecipes());
    }
});

// Function to sync recipes when back online
async function syncRecipes() {
    console.log('[Service Worker] Starting recipe sync...');
    
    try {
        // Get all clients (browser tabs)
        const clients = await self.clients.matchAll();
        
        // Send message to all clients to sync their local data
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_RECIPES',
                message: 'Background sync triggered'
            });
        });
        
        console.log('[Service Worker] Recipe sync completed');
    } catch (error) {
        console.error('[Service Worker] Recipe sync failed:', error);
    }
}

// Handle messages from the app
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: '1.0.0',
            cacheName: CACHE_NAME
        });
    }
});

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
    self.addEventListener('periodicsync', (event) => {
        if (event.tag === 'recipe-update') {
            event.waitUntil(syncRecipes());
        }
    });
}

console.log('[Service Worker] Cookly Service Worker loaded');