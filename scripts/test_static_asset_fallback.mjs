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
assert.match(worker, /Promise\.all\(pool\.map\(\(candidate\) => probeCandidate\(candidate, originMeta\)\)\)/);
assert.match(worker, /probeUrl\(candidate\)/);
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

console.log('static asset CDN fallback contract passed');
