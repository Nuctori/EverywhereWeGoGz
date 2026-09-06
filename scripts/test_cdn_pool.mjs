import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const config = JSON.parse(await fs.readFile('public/cdn-pool.json', 'utf8'));
const probePath = config.probe || 'data/cdn-probe.txt';
const probeImagePath = config.probeImage || 'data/image-cache/pool-probe.webp';
const validationPath = 'data/tours-page-0.json';
assert.ok(Array.isArray(config.origins) && config.origins.length >= 2, 'CDN pool needs at least two origins');
assert.ok(config.origins.some((candidate) => candidate.fallback), 'CDN pool needs an independent fallback origin');

function candidateUrl(candidate, path) {
  const origin = candidate.origin.replace(/\/$/, '');
  const prefix = String(candidate.pathPrefix || '').replace(/\/$/, '');
  return `${origin}${prefix || `/gh/Nuctori/EverywhereWeGoGz@cdn-assets`}/${path}`;
}

const results = await Promise.all(config.origins.map(async (candidate) => {
  const url = `${candidateUrl(candidate, probePath)}?ci_probe=1`;
  const started = Date.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const body = response.ok ? await response.json() : null;
    // 图片直出校验：与 SW acceptableImageResponse 同一标准（200 + image/* + 不离源）。
    // 某些镜像对 JSON 直出、对图片 301 跳回源站——CI 必须和浏览器端探针抓同一种病。
    const imageResponse = await fetch(`${candidateUrl(candidate, probeImagePath)}?ci_probe=1`, { signal: AbortSignal.timeout(10000) });
    const imageDirect = imageResponse.ok
      && (imageResponse.headers.get('content-type') || '').toLowerCase().startsWith('image/')
      && new URL(imageResponse.url).origin === new URL(candidate.origin).origin;
    const validationResponse = await fetch(`${candidateUrl(candidate, validationPath)}?ci_probe=1`, { signal: AbortSignal.timeout(10000) });
    const validationBody = validationResponse.ok ? await validationResponse.json() : null;
    const first = validationBody?.items?.[0];
    const mealCounts = first?.meta?.structuredDetails?.mealCounts;
    const validPage = validationResponse.ok
      && Array.isArray(validationBody?.items)
      && typeof first?.id === 'string'
      && typeof first?.title === 'string'
      && (!mealCounts || ['breakfast', 'lunch', 'dinner'].every((key) => Number.isFinite(Number(mealCounts[key]))));
    return {
      id: candidate.id,
      url,
      status: response.status,
      latencyMs: Date.now() - started,
      totalRecords: Number(body?.totalRecords || 0),
      firstTourId: first?.id || null,
      firstMealCounts: mealCounts || null,
      imageDirect,
      // valid = 全绿；imageDirect=false 的源 SW 会拒绝，CI 也不该放行
      valid: response.ok && body && Number(body.totalRecords) > 0 && validPage && imageDirect,
    };
  } catch (error) {
    return { id: candidate.id, status: 0, latencyMs: Date.now() - started, valid: false, error: String(error) };
  }
}));

for (const result of results) console.log(JSON.stringify(result));
assert.ok(results.some((result) => result.valid), 'No CDN pool origin passed the probe');
console.log(`cdn pool passed: ${results.filter((result) => result.valid).length}/${results.length}`);
