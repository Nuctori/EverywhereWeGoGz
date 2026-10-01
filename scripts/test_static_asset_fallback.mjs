import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker = fs.readFileSync('public/sw.js', 'utf8');
const entry = fs.readFileSync('src/main.tsx', 'utf8');

assert.match(worker, /https:\/\/cdn\.jsdmirror\.cn/);
assert.match(worker, /https:\/\/cdn\.jsdmirror\.com/);
assert.match(worker, /https:\/\/gcore\.jsdelivr\.net/);
assert.match(worker, /https:\/\/raw\.githubusercontent\.com/);
// jsdelivr 主域（cdn/fastly/originfastly）对图片返回 301 跳回 raw.githubusercontent.com，
// 图片流量被绕出 CDN；实测 2026-09-06 起 5/5 请求 301，故契约禁止它们回到池里。
assert.doesNotMatch(worker, /https:\/\/cdn\.jsdelivr\.net/);
assert.doesNotMatch(worker, /https:\/\/fastly\.jsdelivr\.net/);
assert.match(worker, /EverywhereWeGoGz@cdn-assets/);
assert.match(worker, /pathPrefix/);
assert.match(worker, /text\/html/);
assert.match(worker, /Promise\.all\(pool\.map\(\(candidate\) => probeCandidate\(candidate, originMeta, probeImage\)\)\)/);
assert.match(worker, /probeUrl\(candidate\)/);
assert.match(worker, /acceptableImageResponse\(imageResponse, candidate\)/);
assert.match(worker, /DEFAULT_PROBE_IMAGE/);
assert.match(worker, /probeImage/);
assert.doesNotMatch(worker, /getPoolOrigins/);
assert.match(worker, /acceptableProbePayload/);
assert.match(worker, /isFreshEnough/);
assert.match(worker, /generatedAt/);
assert.match(worker, /STATE_TTL_MS/);
assert.match(worker, /data\/tours-meta\.json/);
assert.match(worker, /pool_probe=1/);
assert.match(worker, /return fetch\(request\);/);
assert.match(worker, /CDN_TIMEOUT_MS/);
assert.match(worker, /staleWhileRevalidate/);
assert.match(worker, /cacheFirst/);
assert.match(worker, /relativePublicPath\(requestUrl\)\?\.startsWith\('data\/'\)/);
assert.doesNotMatch(
  worker,
  /data must stay same-origin/,
  'data requests must be routed through the freshness-checked CDN pool, not excluded from it',
);
assert.match(worker, /scope/);
assert.match(entry, /serviceWorker\.register/);
assert.match(entry, /serviceWorker\.ready/);
assert.match(entry, /updateViaCache: 'none'/);

// image-cache 已从 Pages 产物剥离（deploy.yml 1GB 上限），图库只在 cdn-assets。
// 回源对它是必然 404，sw 必须把这类请求与 JSON 区别对待：
// 1) 无 winner 时等待一次性选优（in-flight 去重），而不是立刻回源吃 404；
// 2) 过期 winner 对图片仍可用（内容跨发布不变），对 JSON 禁止（新鲜度门控）。
assert.match(
  worker,
  /const isStrippedAsset = publicPath\.startsWith\('data\/image-cache\/'\)/,
  'sw must special-case data/image-cache/ because the origin no longer serves it',
);
assert.match(
  worker,
  /if \(state && \(!stale \|\| isStrippedAsset\)\)/,
  'a stale winner must be tried for stripped assets but never for JSON data (freshness gate)',
);
assert.match(
  worker,
  /const winner = await ensureSelection\(cache, poolWithProbe\)\.catch\(\(\) => null\);/,
  'stripped assets must await the deduped in-flight selection when no winner exists',
);

// 应用侧兜底：SW 未注册（首次访问）时同源图片必 404，<img> onError 必须先按
// CDN 池候选重试，全部失败才允许上占位图。
const imageLib = fs.readFileSync('src/lib/image.ts', 'utf8');
const card = fs.readFileSync('src/sections/TourCard.tsx', 'utf8');
const detailModal = fs.readFileSync('src/sections/TourDetailModal.tsx', 'utf8');
const poolConfig = JSON.parse(fs.readFileSync('public/cdn-pool.json', 'utf8'));
const expectedOrigins = poolConfig.origins
  .map((candidate) => candidate.origin)
  .filter((origin) => !origin.includes('jsdmirror.cn')); // 实测最慢源不进应用侧重试链
for (const origin of expectedOrigins) {
  assert.ok(
    imageLib.includes(origin),
    `image.ts retry candidates must include pool origin ${origin}`,
  );
}
assert.match(
  imageLib,
  /rawPath\.startsWith\('\/data\/image-cache\/'\)/,
  'pool retry must apply only to local image-cache paths',
);
assert.match(card, /getImagePoolCandidates\(rawImageSrc\)/, 'TourCard must retry via pool candidates before the placeholder');
assert.match(detailModal, /getImagePoolCandidates\(tour\.images\?\.\[0\] \|\| ''\)/, 'TourDetailModal must retry via pool candidates before the placeholder');
assert.match(detailModal, /key=\{tour\.id\}/, 'modal hero <img> must remount per tour so retry state does not leak across tours');

console.log('static asset CDN fallback contract passed');
