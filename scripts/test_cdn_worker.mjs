import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source = await fs.readFile('public/sw.js', 'utf8');
const calls = [];
const saved = new Map();
const cache = { match: async key => saved.get(String(key))?.clone(), put: async (key, value) => saved.set(String(key), value.clone()) };
let originFinished = false;
const context = vm.createContext({ URL, Response, AbortController, setTimeout, clearTimeout, performance, console,
  self: { registration: { scope: 'https://example.org/app/' }, location: { origin: 'https://example.org' }, addEventListener() {} },
  fetch: async (input) => {
    const url = String(input); calls.push(url);
    if (url.includes('example.org')) { await new Promise(resolve => setTimeout(resolve, 30)); originFinished = true; return Response.json({ generatedAt: '2026-10-28', totalRecords: 10 }); }
    assert.equal(originFinished, false, 'CDN probe starts before slow origin completes');
    if (url.includes('image-cache')) return new Response('', { status: 404 });
    return Response.json({ generatedAt: url.includes('stale') ? '2026-10-27' : '2026-10-28', totalRecords: 10 });
  },
});
vm.runInContext(source, context);
assert.equal(vm.runInContext("validOrigin('https://cdn.example.org')", context), true);
for (const value of ['http://cdn.example.org', 'https://cdn.example.org/path', 'https://user@cdn.example.org', 'https://cdn.example.org?x=1']) assert.equal(vm.runInContext(`validOrigin(${JSON.stringify(value)})`, context), false);
context.cache = cache;
context.pool = { pool: [{ id: 'stale', origin: 'https://stale.test', pathPrefix: '' }, { id: 'fresh', origin: 'https://fresh.test', pathPrefix: '' }], probeImage: '' };
const winner = await vm.runInContext('selectBestCandidate(cache, pool)', context);
assert.equal(winner.id, 'fresh', 'fast stale mirror cannot win');
context.fetch = async input => { calls.push(String(input)); return new Response('', { status: 404 }); };
await vm.runInContext('writeState(cache, { none: true })', context);
context.poolPromise = Promise.resolve(context.pool);
vm.runInContext('poolPromise = globalThis.poolPromise', context);
context.request = { url: 'https://example.org/app/data/image-cache/a.webp' };
const before = calls.length;
await vm.runInContext('fetchFromPoolOrOrigin(request, cache)', context);
assert.equal(calls.length - before, 1, 'negative TTL does not start another probe batch');
const main = await fs.readFile('src/main.tsx', 'utf8');
assert.ok(!main.includes('await navigator.serviceWorker.ready'), 'worker activation must not block rendering');
assert.ok(main.includes("if (['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)) await registration"), 'only local cleanup gates render');
console.log('PASS CDN origin validation, parallel probes, stale rejection, negative cache, nonblocking bootstrap');
