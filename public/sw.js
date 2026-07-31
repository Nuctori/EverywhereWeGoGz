/*
 * Static asset accelerator for GitHub Pages.
 *
 * Requests remain same-origin. The worker maintains a small CDN pool, probes
 * candidates from the current browser network, remembers the best candidate,
 * and always falls back to GitHub Pages when a mirror fails.
 */
const CACHE_PREFIX = 'everywhere-we-go-static-';
const CACHE_NAME = `${CACHE_PREFIX}v3`;
const STATE_URL = '/__cdn_pool_state__';
const CDN_TIMEOUT_MS = 1800;
const STATE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_CDN_POOL = [
  { id: 'jsdmirror-cn', origin: 'https://cdn.jsdmirror.cn', pathPrefix: '/gh/Nuctori/EverywhereWeGoGz@cdn-assets', fallback: false },
  { id: 'jsdmirror-com', origin: 'https://cdn.jsdmirror.com', pathPrefix: '/gh/Nuctori/EverywhereWeGoGz@cdn-assets', fallback: false },
  { id: 'jsdelivr', origin: 'https://cdn.jsdelivr.net', pathPrefix: '/gh/Nuctori/EverywhereWeGoGz@cdn-assets', fallback: false },
  { id: 'jsdelivr-fastly', origin: 'https://fastly.jsdelivr.net', pathPrefix: '/gh/Nuctori/EverywhereWeGoGz@cdn-assets', fallback: false },
  { id: 'jsdelivr-gcore', origin: 'https://gcore.jsdelivr.net', pathPrefix: '/gh/Nuctori/EverywhereWeGoGz@cdn-assets', fallback: false },
  { id: 'jsdelivr-originfastly', origin: 'https://originfastly.jsdelivr.net', pathPrefix: '/gh/Nuctori/EverywhereWeGoGz@cdn-assets', fallback: false },
  {
    id: 'github-raw',
    origin: 'https://raw.githubusercontent.com',
    pathPrefix: '/Nuctori/EverywhereWeGoGz/cdn-assets',
    fallback: true,
  },
];

let poolPromise;

function scopePath() {
  return new URL(self.registration.scope).pathname.replace(/\/$/, '');
}

function scopedUrl(path) {
  return new URL(`${scopePath()}/${path.replace(/^\//, '')}`, self.location.origin);
}

function isCacheableRequest(request, url) {
  if (request.method !== 'GET' || url.origin !== self.location.origin) return false;

  const relativePath = url.pathname.startsWith(`${scopePath()}/`)
    ? url.pathname.slice(scopePath().length + 1)
    : url.pathname.replace(/^\//, '');

  return relativePath.startsWith('data/')
    || relativePath.startsWith('brand/')
    || relativePath.startsWith('icons/')
    || relativePath.startsWith('assets/');
}

function relativePublicPath(url) {
  const relativePath = url.pathname.startsWith(`${scopePath()}/`)
    ? url.pathname.slice(scopePath().length + 1)
    : url.pathname.replace(/^\//, '');

  if (relativePath.startsWith('data/')) return relativePath;
  if (relativePath.startsWith('brand/')) return relativePath;
  if (relativePath.startsWith('icons/')) return relativePath;
  return null;
}

function validOrigin(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.pathname === '';
  } catch {
    return false;
  }
}

function normalizePool(value) {
  if (!Array.isArray(value)) return DEFAULT_CDN_POOL;

  const seen = new Set();
  const pool = value
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      id: String(item.id || '').trim(),
      origin: String(item.origin || '').trim().replace(/\/$/, ''),
      pathPrefix: String(item.pathPrefix || '').trim().replace(/\/$/, ''),
      fallback: Boolean(item.fallback),
    }))
    .filter((item) => item.id && validOrigin(item.origin) && !seen.has(item.origin))
    .filter((item) => {
      seen.add(item.origin);
      return true;
    });

  return pool.length > 0 ? pool : DEFAULT_CDN_POOL;
}

async function loadPool() {
  try {
    const response = await fetch(scopedUrl('cdn-pool.json'), {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) return DEFAULT_CDN_POOL;
    const config = await response.json();
    return normalizePool(config.origins);
  } catch {
    return DEFAULT_CDN_POOL;
  }
}

function getPool() {
  if (!poolPromise) poolPromise = loadPool();
  return poolPromise;
}

async function fetchWithTimeout(input, init = {}, timeoutMs = CDN_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function readState(cache) {
  try {
    const response = await cache.match(STATE_URL);
    if (!response) return null;
    const state = await response.json();
    if (Date.now() - Number(state.updatedAt || 0) > STATE_TTL_MS) return null;
    return state;
  } catch {
    return null;
  }
}

async function writeState(cache, state) {
  await cache.put(
    STATE_URL,
    new Response(JSON.stringify({ ...state, updatedAt: Date.now() }), {
      headers: { 'content-type': 'application/json' },
    }),
  );
}

function cdnUrl(candidate, publicPath, search) {
  const path = candidate.pathPrefix
    ? `${candidate.pathPrefix}/${publicPath}`
    : `/gh/Nuctori/EverywhereWeGoGz@cdn-assets/${publicPath}`;
  return `${candidate.origin}${path}${search || ''}`;
}

function probeUrl(candidate) {
  return cdnUrl(candidate, 'data/tours-meta.json', '?pool_probe=1');
}

function probePageUrl(candidate) {
  return cdnUrl(candidate, 'data/tours-page-0.json', '?pool_probe=1');
}

function acceptableStaticResponse(response) {
  if (!response.ok) return false;
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  // Captive portals and poisoned routes commonly return an HTML block page with 200.
  return !contentType.includes('text/html');
}

function acceptableProbePayload(meta, page) {
  if (!meta || Number(meta.totalRecords) <= 0) return false;
  if (!page || !Array.isArray(page.items) || page.items.length === 0) return false;

  const first = page.items[0];
  if (typeof first.id !== 'string' || typeof first.title !== 'string') return false;
  const mealCounts = first?.meta?.structuredDetails?.mealCounts;
  if (!mealCounts) return true;
  return ['breakfast', 'lunch', 'dinner'].every((key) => Number.isFinite(Number(mealCounts[key])));
}

async function probeCandidate(candidate) {
  const startedAt = performance.now();
  try {
    const [metaResponse, pageResponse] = await Promise.all([
      fetchWithTimeout(probeUrl(candidate), {
        credentials: 'omit',
        mode: 'cors',
        cache: 'no-store',
      }),
      fetchWithTimeout(probePageUrl(candidate), {
        credentials: 'omit',
        mode: 'cors',
        cache: 'no-store',
      }),
    ]);
    if (!acceptableStaticResponse(metaResponse) || !acceptableStaticResponse(pageResponse)) return null;
    const meta = await metaResponse.json();
    const page = await pageResponse.json();
    if (!acceptableProbePayload(meta, page)) return null;

    return {
      id: candidate.id,
      origin: candidate.origin,
      pathPrefix: candidate.pathPrefix,
      fallback: candidate.fallback,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  } catch {
    return null;
  }
}

async function selectBestCandidate(cache, pool) {
  const results = await Promise.all(pool.map(probeCandidate));
  const healthy = results
    .filter(Boolean)
    .sort((left, right) => Number(left.fallback) - Number(right.fallback) || left.latencyMs - right.latencyMs);

  if (healthy.length === 0) return null;
  const winner = healthy[0];
  await writeState(cache, winner);
  return winner;
}

async function fetchFromPoolOrOrigin(request, cache) {
  const requestUrl = new URL(request.url);
  const publicPath = relativePublicPath(requestUrl);
  if (!publicPath) return fetch(request);

  const pool = await getPool();
  let state = await readState(cache);
  if (!state) {
    state = await selectBestCandidate(cache, pool);
  }

  const ordered = state
    ? [state, ...pool.filter((item) => item.origin !== state.origin)]
    : pool;

  for (const candidate of ordered) {
    try {
      const response = await fetchWithTimeout(
        cdnUrl(candidate, publicPath, requestUrl.search),
        { credentials: 'omit', mode: 'cors', cache: 'no-store' },
      );
      if (acceptableStaticResponse(response)) {
        if (!state || state.origin !== candidate.origin) {
          await writeState(cache, candidate);
        }
        return response;
      }
    } catch {
      // Try the next candidate and then the GitHub Pages origin.
    }
  }

  // The original same-origin URL is the authoritative final fallback.
  return fetch(request);
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetchFromPoolOrOrigin(request, cache);
    if (acceptableStaticResponse(response) || response.type === 'opaque') await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const fallback = await cache.match(request);
    if (fallback) return fallback;
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const refresh = fetchFromPoolOrOrigin(request, cache)
    .then(async (response) => {
      if (acceptableStaticResponse(response) || response.type === 'opaque') await cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    void refresh;
    return cached;
  }

  const response = await refresh;
  if (response) return response;
  throw new Error('Static asset unavailable');
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key)),
    )).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (self.location.hostname === 'localhost') return;

  const requestUrl = new URL(event.request.url);
  if (!isCacheableRequest(event.request, requestUrl)) return;

  if (requestUrl.pathname.includes('/data/')) {
    event.respondWith(staleWhileRevalidate(event.request));
  } else {
    event.respondWith(cacheFirst(event.request));
  }
});
