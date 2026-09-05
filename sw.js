/*
 * Static asset accelerator for GitHub Pages.
 *
 * Requests remain same-origin. The worker maintains a small CDN pool, probes
 * candidates from the current browser network, remembers the best candidate,
 * and always falls back to GitHub Pages when a mirror fails.
 *
 * Data files (data/*) are routed through the pool too, but a candidate only
 * wins selection when its tours-meta.json generatedAt is not older than the
 * same-origin copy. That keeps mirrors honest across force-pushes: a CDN that
 * still serves the previous release is treated as unhealthy and users stay on
 * GitHub Pages until the mirror catches up.
 */
const CACHE_PREFIX = 'everywhere-we-go-static-';
const CACHE_NAME = `${CACHE_PREFIX}v3`;
const STATE_URL = '/__cdn_pool_state__';
const CDN_TIMEOUT_MS = 2500;
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
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // fetch 在响应头就 resolve；这里拿到头立刻清掉定时器，
    // body 下载不再受 deadline 约束——否则大文件/慢连接会在
    // 传输中途被 abort，页面侧表现为 net::ERR_FAILED。
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function readState(cache) {
  // 返回 { state, stale }：过期状态仍然可用（winner 大概率还是对的），
  // 只是同时触发后台重选。返回 null state 表示从无记录或全源不健康的负缓存。
  try {
    const response = await cache.match(STATE_URL);
    if (!response) return { state: null, stale: true };
    const state = await response.json();
    const stale = Date.now() - Number(state.updatedAt || 0) > STATE_TTL_MS;
    return { state: state.none ? null : state, stale };
  } catch {
    return { state: null, stale: true };
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

function acceptableStaticResponse(response) {
  if (!response.ok) return false;
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  // Captive portals and poisoned routes commonly return an HTML block page with 200.
  return !contentType.includes('text/html');
}

function acceptableProbePayload(meta) {
  return Boolean(meta) && Number(meta.totalRecords) > 0;
}

// ISO 时间戳同格式可直接字典序比较；镜像 generatedAt 落后于同源即视为过期。
function isFreshEnough(candidateMeta, originMeta) {
  if (!originMeta || !originMeta.generatedAt) return true;
  if (!candidateMeta || !candidateMeta.generatedAt) return false;
  return String(candidateMeta.generatedAt) >= String(originMeta.generatedAt);
}

async function readOriginMeta() {
  try {
    const response = await fetchWithTimeout(scopedUrl('data/tours-meta.json'), {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!acceptableStaticResponse(response)) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function probeCandidate(candidate, originMeta) {
  const startedAt = performance.now();
  try {
    const metaResponse = await fetchWithTimeout(probeUrl(candidate), {
      credentials: 'omit',
      mode: 'cors',
      cache: 'no-store',
    });
    if (!acceptableStaticResponse(metaResponse)) return null;
    const meta = await metaResponse.json();
    if (!acceptableProbePayload(meta) || !isFreshEnough(meta, originMeta)) return null;

    return {
      id: candidate.id,
      origin: candidate.origin,
      pathPrefix: candidate.pathPrefix,
      fallback: candidate.fallback,
      generatedAt: meta.generatedAt || '',
      latencyMs: Math.round(performance.now() - startedAt),
    };
  } catch {
    return null;
  }
}

async function selectBestCandidate(cache, pool) {
  const originMeta = await readOriginMeta();
  const results = await Promise.all(pool.map((candidate) => probeCandidate(candidate, originMeta)));
  const healthy = results
    .filter(Boolean)
    .sort((left, right) => Number(left.fallback) - Number(right.fallback) || left.latencyMs - right.latencyMs);

  if (healthy.length === 0) {
    // 全源不健康也要写负缓存：否则每个请求都会触发一轮重探测（探测风暴）
    await writeState(cache, { none: true });
    return null;
  }
  const winner = healthy[0];
  await writeState(cache, winner);
  return winner;
}

// 后台选择节流：进行中的选择复用同一 promise，避免并发请求重复探测
let selectionInFlight = null;
function ensureSelection(cache, pool) {
  if (!selectionInFlight) {
    selectionInFlight = selectBestCandidate(cache, pool).finally(() => {
      selectionInFlight = null;
    });
  }
  return selectionInFlight;
}

async function fetchFromPoolOrOrigin(request, cache, cacheMode = 'no-store') {
  const requestUrl = new URL(request.url);
  const publicPath = relativePublicPath(requestUrl);
  if (!publicPath) return fetch(request);

  const pool = await getPool();
  const { state, stale } = await readState(cache);

  // 无 winner 或状态过期：同源立即服务，选择放后台——请求路径永不背探测延迟。
  // 过期状态同时触发一次后台重选（有 in-flight 节流 + 负缓存兜底）。
  if (!state || stale) {
    void ensureSelection(cache, pool).catch(() => {});
    return fetch(request);
  }

  // 有 winner：只试一次，失败直接回源。逐候选串级已移入选择阶段。
  // 注意不要在这里刷新 state.updatedAt——否则状态永不过期，后台重选失效。
  try {
    const response = await fetchWithTimeout(
      cdnUrl(state, publicPath, requestUrl.search),
      { credentials: 'omit', mode: 'cors', cache: cacheMode },
    );
    if (acceptableStaticResponse(response)) {
      return response;
    }
  } catch {
    // winner 失效，回退同源
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
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1' || self.location.hostname === '::1') return;
  const requestUrl = new URL(event.request.url);
  if (!isCacheableRequest(event.request, requestUrl)) return;

  // Data indexes are rebuilt on every release and requested with a ?v= busting
  // param. Serve them through the freshness-checked CDN pool, but never put
  // them into the worker cache — every release would otherwise accumulate a
  // full copy of the multi-megabyte payloads.
  if (relativePublicPath(requestUrl)?.startsWith('data/')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      return fetchFromPoolOrOrigin(request, cache, 'default');
    })());
    return;
  }

  event.respondWith(cacheFirst(event.request));
});
