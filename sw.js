/**
 * sw.js — Digital Shroud Service Worker
 *
 * Caching strategy:
 *  • Cache-First  → Shroud image tiles (/tiles/*) — first 50 tiles guaranteed
 *  • Stale-While-Revalidate → UI shell assets (HTML, CSS, JS, icons, manifest)
 *  • Network-Only → all other requests
 *
 * "Snapshot Lockdown":
 *  On activate, the SW verifies it is running from the expected secure origin.
 *  If a foreign script tampers with the registration, clients are notified to
 *  flush all caches and hard-reload from the secure origin.
 *
 * Periodic Background Sync ("shroud-refresh"):
 *  Touches the last-active timestamp to prevent iOS 7-day storage eviction.
 */

'use strict';

const CACHE_VERSION = 'v1';
const SHELL_CACHE   = `shroud-shell-${CACHE_VERSION}`;
const TILE_CACHE    = `shroud-tiles-${CACHE_VERSION}`;

// UI shell assets to pre-cache on install
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/app.css',
  '/js/app.js',
  '/js/integrity.js',
  '/js/hotspots.js',
  '/tiles/manifest.jws',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-maskable.svg',
  '/icons/icon-any.svg'
];

// Maximum number of tile entries to keep in the tile cache
const MAX_TILE_CACHE_ENTRIES = 50;

/* ---------------------------------------------------------------------------
 * Install — pre-cache shell
 * --------------------------------------------------------------------------- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => {
        // Non-fatal: some shell assets may not exist yet (e.g., placeholder icons)
        console.warn('[SW] Shell pre-cache partial failure for', err?.request?.url ?? 'unknown asset', '—', err.message);
      })
  );
});

/* ---------------------------------------------------------------------------
 * Activate — Snapshot Lockdown + stale cache cleanup
 * --------------------------------------------------------------------------- */
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Snapshot Lockdown: verify this SW script originates from the secure origin
    if (!self.location.origin.startsWith('https://') &&
        self.location.hostname !== 'localhost' &&
        self.location.hostname !== '127.0.0.1') {
      await triggerLockdown('SW loaded from insecure origin');
      return;
    }

    // Delete caches from previous versions
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter(name => (name.startsWith('shroud-shell-') || name.startsWith('shroud-tiles-'))
                        && name !== SHELL_CACHE && name !== TILE_CACHE)
        .map(name => caches.delete(name))
    );

    await self.clients.claim();
  })());
});

/* ---------------------------------------------------------------------------
 * Fetch — routing
 * --------------------------------------------------------------------------- */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Tile assets → Cache-First (with LRU limit)
  if (url.pathname.startsWith('/tiles/') && !url.pathname.endsWith('.jws')) {
    event.respondWith(cacheFirst(request, TILE_CACHE));
    return;
  }

  // Shell assets → Stale-While-Revalidate
  if (isShellAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
    return;
  }

  // Default: network-only
  event.respondWith(fetch(request));
});

/* ---------------------------------------------------------------------------
 * Periodic Background Sync — refresh last-active timestamp
 * --------------------------------------------------------------------------- */
self.addEventListener('periodicsync', event => {
  if (event.tag === 'shroud-refresh') {
    event.waitUntil((async () => {
      // Touch the manifest to revalidate and reset iOS storage timer
      try {
        const res = await fetch('/tiles/manifest.jws', { cache: 'no-cache' });
        if (res.ok) {
          const cache = await caches.open(SHELL_CACHE);
          await cache.put('/tiles/manifest.jws', res);
        }
      } catch {
        // Offline — nothing to do
      }
      // Notify all clients to update last-active timestamp
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(c => c.postMessage({ type: 'last-active-refresh' }));
    })());
  }
});

/* ---------------------------------------------------------------------------
 * Message handler — external lockdown trigger
 * --------------------------------------------------------------------------- */
self.addEventListener('message', event => {
  if (event.data?.type === 'lockdown-check') {
    // A client suspects tampering — flush and reload
    triggerLockdown('Lockdown requested by client');
  }
});

/* ---------------------------------------------------------------------------
 * Helpers
 * --------------------------------------------------------------------------- */

function isShellAsset(pathname) {
  return pathname === '/' ||
    pathname.endsWith('.html') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.json') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.jws');
}

async function cacheFirst(request, cacheName) {
  const cache    = await caches.open(cacheName);
  const cached   = await cache.match(request);
  if (cached) return cached;

  let response;
  try {
    response = await fetch(request);
  } catch {
    return new Response('Network error', { status: 503 });
  }

  if (response.ok) {
    // Enforce LRU limit on tile cache
    await enforceCacheLimit(cache, MAX_TILE_CACHE_ENTRIES);
    await cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then(response => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached || new Response('Offline', { status: 503 }));

  return cached || networkPromise;
}

async function enforceCacheLimit(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length >= maxEntries) {
    // Delete oldest entries (FIFO approximation)
    const toDelete = keys.slice(0, keys.length - maxEntries + 1);
    await Promise.all(toDelete.map(k => cache.delete(k)));
  }
}

async function triggerLockdown(reason) {
  console.error('[SW] Snapshot Lockdown triggered:', reason);

  // Flush all caches
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));

  // Notify all clients to hard-reload from secure origin
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach(client => {
    client.postMessage({ type: 'lockdown', reason });
  });
}
