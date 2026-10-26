// Offline behavior regressions: shared deadline, body cancellation and daily windows.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { __aiRecommendationTestHooks as h, requestAiRecommendations } from '../src/lib/ai-recommendation.ts';
import { toursListSchema } from '../src/lib/runtime-schemas.ts';

const messages = [{ role: 'user', content: 'test' }];
const primary = { baseUrl: 'https://api.z.ai/api/paas/v4', model: 'primary', apiKey: 'test' };
const foreground = { baseUrl: 'https://example.test/v1', model: 'custom', apiKey: 'test' };
const paid = { baseUrl: 'https://api.deepseek.com/v1', model: 'paid', apiKey: 'test' };
const originalFetch = globalThis.fetch;
const originalDate = globalThis.Date;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push(String(url));
    return new Promise((resolve, reject) => {
      const abort = () => reject(new DOMException('aborted', 'AbortError'));
      if (init.signal.aborted) abort();
      else init.signal.addEventListener('abort', abort, { once: true });
    });
  };
  const started = performance.now();
  await assert.rejects(h.callAiApi({ configs: [primary, foreground, paid], messages, timeoutMs: 50 }), /total budget/);
  assert.ok(performance.now() - started < 500, 'deadline must settle promptly');
  await wait(20);
  assert.equal(calls.length, 1, 'deadline must not start downstream providers');
  console.log('PASS shared deadline stops provider fallthrough');

  for (const config of [foreground, primary]) {
    let body;
    let signal;
    let headersReady;
    const ready = new Promise((resolve) => { headersReady = resolve; });
    globalThis.fetch = async (_url, init) => {
      signal = init.signal;
      const stream = new ReadableStream({ start(controller) {
        body = controller;
        signal.addEventListener('abort', () => controller.error(new DOMException('aborted', 'AbortError')), { once: true });
      } });
      headersReady();
      return new Response(stream, { headers: { 'content-type': 'application/json' } });
    };
    const user = new AbortController();
    const request = h.callAiApi({ configs: [config], messages, signal: user.signal });
    const rejected = assert.rejects(request, (error) => error.name === 'AbortError');
    await ready;
    await wait(0);
    user.abort();
    assert.equal(signal.aborted, true, 'fetch signal must stay connected during body read');
    await rejected;
    assert.ok(body);
    console.log(`PASS cancellation while reading JSON body: ${config.model}`);
  }

  // Even a transport that resolves after abort must not publish success.
  let body;
  globalThis.fetch = async () => new Response(new ReadableStream({ start(c) { body = c; } }), { headers: { 'content-type': 'application/json' } });
  const user = new AbortController();
  const request = h.callAiApi({ configs: [foreground], messages, signal: user.signal });
  const rejected = assert.rejects(request, (error) => error.name === 'AbortError');
  await wait(0);
  user.abort();
  body.enqueue(new TextEncoder().encode(JSON.stringify({ choices: [{ message: { content: '{"items":[]}' } }] })));
  body.close();
  await rejected;
  console.log('PASS late JSON success is rejected after cancellation');

  const base = toursListSchema.parse(JSON.parse(fs.readFileSync(new URL('../public/data/tours-list.json', import.meta.url), 'utf8')))[0];
  const candidate = { ...base, departureDate: '2099-01-01', departureDates: ['2099-01-01'], hotDepartureDates: [] };
  const args = { conversationId: 'deadline-test', messages: [{ role: 'user', content: '推荐线路' }],
    candidateTours: [candidate], activeFilters: {}, searchQuery: '', aiConfig: primary, timeoutMs: 30 };
  let aborts = 0;
  globalThis.fetch = async (_url, init) => new Promise((resolve, reject) => {
    const abort = () => { aborts++; reject(new DOMException('aborted', 'AbortError')); };
    if (init.signal.aborted) abort(); else init.signal.addEventListener('abort', abort, { once: true });
  });
  const progress = [];
  const startWhole = performance.now();
  const deadlineResult = await requestAiRecommendations({ ...args, onProgress: (p) => progress.push(p) });
  assert.ok(performance.now() - startWhole < 600, 'whole request must settle at its 30ms test budget');
  assert.equal(deadlineResult.source, 'local-preview');
  assert.notEqual(deadlineResult.status.mode, 'ai');
  assert.ok(deadlineResult.items.every((item) => !item.reason), 'local deadline fallback must not invent AI reasons');
  assert.ok(aborts > 0, 'whole deadline must cancel provider work');
  const countAtDeadline = progress.length;
  await wait(20);
  assert.equal(progress.length, countAtDeadline, 'no late progress after deadline');
  console.log('PASS whole recommendation 30ms deadline includes classifier and suppresses late progress');

  // Classifier completes; main SSE publishes a checked item then deliberately stalls.
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    const classifier = body.messages.some((message) => message.content.includes('demands') && message.content.includes('avoid'))
      && body.max_tokens <= 800;
    if (classifier) return new Response(JSON.stringify({ choices: [{ message: { content: '{"demands":[],"avoid":[],"destinations":[],"queries":[]}' } }] }), { headers: { 'content-type': 'application/json' } });
    const item = { tourId: candidate.id, score: 90, reason: '离线模型推荐理由', matchedSignals: [] };
    return new Response(new ReadableStream({ start(c) {
      c.enqueue(new TextEncoder().encode('data: ' + JSON.stringify({ choices: [{ delta: { content: '{"items":[' + JSON.stringify(item) } }] }) + '\n\n'));
      init.signal.addEventListener('abort', () => c.error(new DOMException('aborted', 'AbortError')), { once: true });
    } }), { headers: { 'content-type': 'text/event-stream' } });
  };
  const partialResult = await requestAiRecommendations({ ...args, timeoutMs: 30 });
  assert.equal(partialResult.source, 'ai-api', 'checked preview must survive whole deadline');
  assert.equal(partialResult.items[0]?.tourId, candidate.id);
  assert.notEqual(partialResult.status.mode, 'ai', 'partial is not a completed AI recommendation');
  console.log('PASS whole deadline retains validated SSE partial');

  const cancelUser = new AbortController();
  globalThis.fetch = async (_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
  });
  const cancelledWhole = requestAiRecommendations({ ...args, timeoutMs: 1000, signal: cancelUser.signal });
  const cancelledCheck = assert.rejects(cancelledWhole, (error) => error.name === 'AbortError');
  await wait(5);
  cancelUser.abort();
  await cancelledCheck;
  console.log('PASS whole request user cancellation is not deadline fallback');

  let now = '2026-10-23T12:00:00+08:00';
  globalThis.Date = class extends originalDate {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return new originalDate(now).getTime(); }
  };
  const tour = { ...base, id: 'lifecycle-cross-day', title: '广州周边3天', destination: '广东', duration: 3, departureDate: '2026-10-23', departureDates: ['2026-10-23', '2026-10-27'], hotDepartureDates: [] };
  const query = h.buildLocalRecommendationQuery('周五出发周日回');
  const before = h.scoreTour(tour, query);
  now = '2026-10-26T12:00:00+08:00';
  const after = h.scoreTour(tour, query);
  const fresh = h.scoreTour({ ...tour }, query);
  assert.deepEqual(after, fresh, 'cached windows must equal fresh windows after midnight');
  assert.ok(before.score > after.score, 'expired matching window must lose its bonus');
  console.log('PASS schedule windows invalidate across dates');
} finally {
  globalThis.fetch = originalFetch;
  globalThis.Date = originalDate;
}
console.log('AI request lifecycle regressions passed');
