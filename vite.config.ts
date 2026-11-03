import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

function pwaPlugin(): Plugin {
  return {
    name: 'pwa-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const buildVersion = `0.1.0-${Date.now()}`
      const hashedAssets = Object.keys(bundle)
        .filter((fileName) => fileName.startsWith('assets/'))
        .sort()

      const staticAssets = [
        '/index.html',
        '/offline.html',
        '/manifest.webmanifest',
        '/apple-touch-icon.png',
        '/favicon.ico',
        '/favicon.svg',
        '/icons/icon-192.png',
        '/icons/icon-512.png',
        '/icons/icon-maskable-192.png',
        '/icons/icon-maskable-512.png',
      ]

      const precacheAssets = [
        ...staticAssets,
        ...hashedAssets.map((asset) => `/${asset}`),
      ]

      const swContent = `// ============================================================================
// Service Worker - Nutrition Web
// Build version: ${buildVersion}
// Generated: ${new Date().toISOString()}
// Precache assets count: ${precacheAssets.length}
// ============================================================================

const BUILD_VERSION = '${buildVersion}';
const CACHE_NAME = 'nutrition-web-' + BUILD_VERSION;

const PRECACHE_ASSETS = ${JSON.stringify(precacheAssets, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // Bypass the HTTP cache so a fresh deploy never precaches stale files
      .then((cache) =>
        cache.addAll(PRECACHE_ASSETS.map((url) => new Request(url, { cache: 'reload' })))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Cross-origin requests (API host, Google Fonts, etc.) must go straight to network
  if (url.origin !== self.location.origin) {
    return;
  }

  // Same-origin /api proxy requests must go straight to network
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // /config.js is runtime config and must not be cached
  if (url.pathname === '/config.js') {
    return;
  }

  // Never cache sw.js
  if (url.pathname === '/sw.js') {
    return;
  }

  // Navigation requests: network-first, fallback to /offline.html on network failure
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const offlinePage = await cache.match('/offline.html');
        return (
          offlinePage ||
          new Response('Офлайн режим', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        );
      })
    );
    return;
  }

  // Precached static assets and hashed assets: cache-first
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request);
    })
  );
});
`

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: swContent,
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'https://api2-bptracker-dev.home.vn.ua'

  return {
    plugins: [vue(), pwaPlugin()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    base: '/',
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
