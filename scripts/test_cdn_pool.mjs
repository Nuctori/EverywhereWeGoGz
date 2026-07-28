import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const config = JSON.parse(await fs.readFile('public/cdn-pool.json', 'utf8'));
const probePath = config.probe || 'data/cdn-probe.txt';
assert.ok(Array.isArray(config.origins) && config.origins.length >= 2, 'CDN pool needs at least two origins');
assert.ok(config.origins.some((candidate) => candidate.fallback), 'CDN pool needs an independent fallback origin');

function candidateUrl(candidate, path) {
  const origin = candidate.origin.replace(/\/$/, '');
  const prefix = String(candidate.pathPrefix || '').replace(/\/$/, '');
  return `${origin}${prefix || `/gh/Nuctori/EverywhereWeGoGz@main/public`}/${path}`;
}

const results = await Promise.all(config.origins.map(async (candidate) => {
  const url = `${candidateUrl(candidate, probePath)}?ci_probe=1`;
  const started = Date.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const body = response.ok ? await response.json() : null;
    return {
      id: candidate.id,
      status: response.status,
      latencyMs: Date.now() - started,
      valid: response.ok && body && Number(body.totalRecords) > 0,
    };
  } catch (error) {
    return { id: candidate.id, status: 0, latencyMs: Date.now() - started, valid: false, error: String(error) };
  }
}));

for (const result of results) console.log(JSON.stringify(result));
assert.ok(results.some((result) => result.valid), 'No CDN pool origin passed the probe');
console.log(`cdn pool passed: ${results.filter((result) => result.valid).length}/${results.length}`);
