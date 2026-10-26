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

  // One stream exposes local candidates, then the complete AI order, then reasons.
  // Move wall time past the former 30s cutoff without making this offline suite slow.
  const rankedCandidates = [candidate, { ...candidate, id: candidate.id + '-second' }];
  const stages = [];
  const capturedTimers = [];
  const nativeSetTimeout = globalThis.setTimeout;
  const nativeNow = Date.now;
  let clockOffset = 0;
  let recommendationCalls = 0;
  globalThis.setTimeout = (fn, delay, ...rest) => {
    capturedTimers.push(delay);
    return nativeSetTimeout(fn, delay, ...rest);
  };
  Date.now = () => nativeNow() + clockOffset;
  globalThis.fetch = async (_url, init) => {
    const payload = JSON.parse(init.body);
    if (payload.max_tokens <= 800) return new Response(JSON.stringify({ choices: [{ message: { content: '{"demands":[],"avoid":[],"destinations":[],"queries":[]}' } }] }), { headers: { 'content-type': 'application/json' } });
    recommendationCalls++;
    const order = [rankedCandidates[1].id, 'invented-id', rankedCandidates[1].id, candidate.id];
    const fragments = [
      '{"order":' + JSON.stringify(order),
      ',"items":[' + JSON.stringify({ tourId: candidate.id, reason: '模型为第一条候选生成的独立理由', score: 99 }),
      ',' + JSON.stringify({ tourId: rankedCandidates[1].id, reason: '模型为第二条候选生成的独立理由', score: 60 }) + '],"summary":"模型摘要"}',
    ];
    return new Response(new ReadableStream({ async start(c) {
      for (const content of fragments) {
        clockOffset = 31_000;
        c.enqueue(new TextEncoder().encode('data: ' + JSON.stringify({ choices: [{ delta: { content } }] }) + '\n\n'));
        await wait(2);
      }
      c.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
      c.close();
    } }), { headers: { 'content-type': 'text/event-stream' } });
  };
  let stagedResult;
  try {
    stagedResult = await requestAiRecommendations({ ...args, timeoutMs: undefined, candidateTours: rankedCandidates,
      onProgress: (p) => { if (p.previewKind) stages.push(p); } });
  } finally {
    Date.now = nativeNow;
    globalThis.setTimeout = nativeSetTimeout;
  }
  assert.equal(stagedResult.source, 'ai-api');
  assert.equal(recommendationCalls, 1, 'ranking and reasons share a single recommendation request');
  assert.equal(stages[0].previewKind, 'candidates');
  assert.ok(stages[0].partialItems.length && stages[0].partialItems.every((item) => !item.reason));
  const ranking = stages.find((p) => p.previewKind === 'ranking');
  assert.deepEqual(ranking.partialItems.map((item) => item.tourId), [rankedCandidates[1].id, candidate.id]);
  assert.ok(ranking.partialItems.every((item) => !item.reason));
  const reasons = stages.filter((p) => p.previewKind === 'reasons');
  assert.ok(reasons.length >= 2);
  for (const p of reasons) assert.deepEqual(p.partialItems.map((item) => item.tourId), ranking.partialItems.map((item) => item.tourId));
  assert.ok(reasons[0].partialItems[1].reason && !reasons[0].partialItems[0].reason, 'out-of-order reasons merge without moving cards');
  assert.deepEqual(stagedResult.items.map((item) => item.tourId), ranking.partialItems.map((item) => item.tourId));
  assert.ok(!capturedTimers.includes(30_000), 'no implicit product deadline');
  assert.ok(capturedTimers.every(Number.isFinite), 'Infinity must never reach setTimeout');
  console.log('PASS candidates → stable order → incremental reasons; default survives 31s; one recommendation stream');

  const checkpoint = { ...stagedResult, items: [{ ...stagedResult.items[0] }, { ...stagedResult.items[1], reason: undefined }], status: { mode: 'local-only', label: 'interrupted' } };
  const resumeProgress = [];
  let resumePrompt = '';
  globalThis.fetch = async (_url, init) => {
    const payload = JSON.parse(init.body);
    if (payload.max_tokens <= 800) return new Response(JSON.stringify({ choices: [{ message: { content: '{"demands":[],"avoid":[],"destinations":[],"queries":[]}' } }] }), { headers: { 'content-type': 'application/json' } });
    resumePrompt = payload.messages.map((m) => m.content).join('\n');
    const content = JSON.stringify({ order: [candidate.id, rankedCandidates[1].id], items: [{ tourId: candidate.id, reason: '恢复后新增理由' }], summary: '恢复摘要' });
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { headers: { 'content-type': 'application/json' } });
  };
  const resumed = await requestAiRecommendations({ ...args, timeoutMs: undefined, candidateTours: rankedCandidates,
    previousResult: checkpoint, resumeInterrupted: true, onProgress: (p) => { if (p.previewKind) resumeProgress.push(p); } });
  assert.match(resumePrompt, /order 固定为/);
  assert.deepEqual(resumeProgress[0].partialItems.map((i) => i.tourId), checkpoint.items.map((i) => i.tourId));
  assert.ok(resumeProgress.every((p) => p.previewKind !== 'candidates'), 'same-turn resume must not flash local ordering');
  assert.deepEqual(resumed.items.map((i) => i.tourId), checkpoint.items.map((i) => i.tourId));
  assert.equal(resumed.items[0].reason, checkpoint.items[0].reason);
  assert.match(resumed.items[1].reason, /^恢复后新增理由。?$/);
  const freshTurn = await requestAiRecommendations({ ...args, timeoutMs: undefined, candidateTours: rankedCandidates,
    previousResult: checkpoint });
  assert.doesNotMatch(resumePrompt, /order 固定为/);
  assert.equal(freshTurn.items[0].tourId, candidate.id, 'ordinary follow-up accepts a new model order');
  console.log('PASS explicit same-turn resume preserves checkpoint order/reasons; ordinary follow-up ranks anew');

  globalThis.fetch = async (_url, init) => {
    const payload = JSON.parse(init.body);
    const content = payload.max_tokens <= 800 ? '{"demands":[],"avoid":[],"destinations":[],"queries":[]}'
      : JSON.stringify({ order: [candidate.id], items: [], summary: '' });
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { headers: { 'content-type': 'application/json' } });
  };
  const incompleteStages = [];
  const orderOnly = await requestAiRecommendations({ ...args, timeoutMs: undefined, onProgress: (p) => incompleteStages.push(p) });
  assert.equal(orderOnly.source, 'ai-api');
  assert.equal(orderOnly.status.mode, 'local-only');
  assert.equal(orderOnly.summary, '');
  assert.equal(orderOnly.items[0].tourId, candidate.id);
  assert.ok(!orderOnly.items[0].reason);
  assert.ok(incompleteStages.every((p) => p.stage !== 'completed'));
  console.log('PASS order-only response stays incomplete and resumable, never completed AI');

  let firstInterrupted = true;
  globalThis.fetch = async (_url, init) => {
    const payload = JSON.parse(init.body);
    if (payload.max_tokens <= 800) return new Response(JSON.stringify({ choices: [{ message: { content: '{"demands":[],"avoid":[],"destinations":[],"queries":[]}' } }] }), { headers: { 'content-type': 'application/json' } });
    if (!firstInterrupted) throw new TypeError('offline network');
    firstInterrupted = false;
    return new Response(new ReadableStream({ start(c) {
      c.enqueue(new TextEncoder().encode('data: ' + JSON.stringify({ choices: [{ delta: { content: '{"order":' + JSON.stringify([candidate.id]) + ',"items":[' + JSON.stringify({ tourId: candidate.id, reason: '网络中断前模型已生成的理由' }) } }] }) + '\n\n'));
      nativeSetTimeout(() => c.error(new TypeError('offline mid-stream')), 5);
    } }), { headers: { 'content-type': 'text/event-stream' } });
  };
  const interrupted = await requestAiRecommendations({ ...args, timeoutMs: undefined });
  assert.equal(interrupted.source, 'ai-api', 'network failure retains useful AI provenance');
  assert.equal(interrupted.items[0]?.reason, '网络中断前模型已生成的理由');
  assert.equal(interrupted.status.mode, 'local-only');
  assert.match(interrupted.status.detail, /连接/);
  console.log('PASS network failure and retry resets retain AI order/reasons and provenance');

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
