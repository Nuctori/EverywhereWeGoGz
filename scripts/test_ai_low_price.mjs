// Offline regression: no outbound network; fake classifier + intentionally expensive-first model.
import assert from 'node:assert/strict';
import { __aiRecommendationTestHooks as h, requestAiRecommendations } from '../src/lib/ai-recommendation.ts';
const candidate = (id, price, extra = {}) => ({ id, price, title: '奔县游山水线路', destination: '', source: 'test', duration: 2,
  departureDate: '2099-01-01', departureDates: ['2099-01-01'], tags: [], highlights: [], theme: '', transportType: '大巴', rating: 4.6, ...extra });
const tours = [candidate('expensive', 4999), candidate('middle', 3299), candidate('cheap', 399), candidate('cheapest', 300), candidate('unknown', 0)];
const items = tours.map((t, i) => ({ tourId: t.id, score: 99 - i, reason: `模型理由-${t.id}`, matchedSignals: [] }));
const text = '便宜的奔县游';
assert.equal(h.buildHardIntentFromText(text).budgetPriority, 'low');
assert.equal(h.buildHardIntentFromText(text).budgetMax ?? null, null);
assert.equal(h.getPricePercentile(0, [300, 399, 3299, 4999]), null);
assert.equal(h.getPricePercentile(-1, [300]), null);
assert.equal(h.getPricePercentile(Number.NaN, [300]), null);
const pool = h.compactCandidates(tours, items, { budgetPriority: 'low' }, { userText: text });
assert.ok(pool.some((p) => p.id === 'cheap'));
assert.equal(pool.find((p) => p.id === 'unknown').priceContext.poolBand, 'unknown');
const low = h.enforceLowPricePreference(items, tours, { budgetPriority: 'low' }, text);
assert.deepEqual(low.map((i) => i.tourId), ['cheapest', 'cheap', 'middle', 'expensive', 'unknown']);
assert.deepEqual(h.enforceLowPricePreference(items, tours, { budgetPriority: 'premium' }, '预算不限'), items);
const constrained = h.enforceLowPricePreference(items, tours, { budgetPriority: 'low', budgetMin: 3000, budgetMax: 5000 }, text);
assert.equal(constrained[0].tourId, 'middle');
const related = [candidate('relevant', 3000, { title: '温泉两日', highlights: ['温泉'] }), candidate('irrelevant', 100)];
assert.equal(h.enforceLowPricePreference(related.map((t) => ({ tourId: t.id, score: 80, matchedSignals: [] })), related, { budgetPriority: 'low' }, '便宜的温泉游')[0].tourId, 'relevant');
console.log('PASS low relative price / unknown prices / relevance / premium / explicit numeric constraints');
const nativeFetch = globalThis.fetch;
try {
  for (const shape of ['order-all', 'order-omits-cheap', 'items-only', 'json']) {
    const events = [];
    let prompt = '';
    globalThis.fetch = async (_url, init) => {
      const payload = JSON.parse(init.body);
      if (payload.max_tokens <= 800) return new Response(JSON.stringify({ choices: [{ message: { content: '{"demands":[],"avoid":[],"destinations":[],"queries":[]}' } }] }), { headers: { 'content-type': 'application/json' } });
      prompt = JSON.stringify(payload.messages);
      const chosen = shape === 'order-omits-cheap' ? items.slice(0, 2) : items;
      const fragments = [shape.startsWith('order') ? '{"order":' + JSON.stringify(chosen.map((i) => i.tourId)) + ',"items":[' : '{"items":[', ...chosen.map((item, index) => (index ? ',' : '') + JSON.stringify(item)), '],"summary":"模型摘要"}'];
      if (shape === 'json') return new Response(JSON.stringify({ choices: [{ message: { content: fragments.join('') } }] }), { headers: { 'content-type': 'application/json' } });
      return new Response(new ReadableStream({ async start(c) {
        for (const content of fragments) {
          c.enqueue(new TextEncoder().encode('data: ' + JSON.stringify({ choices: [{ delta: { content } }] }) + '\n\n'));
          await new Promise((resolve) => setTimeout(resolve, 2));
        }
        c.enqueue(new TextEncoder().encode('data: [DONE]\n\n')); c.close();
      } }), { headers: { 'content-type': 'text/event-stream' } });
    };
    const result = await requestAiRecommendations({ conversationId: 'low-' + shape, messages: [{ id: 'u', role: 'user', content: text }], candidateTours: tours,
      activeFilters: {}, searchQuery: '', aiConfig: { baseUrl: 'https://api.z.ai/api/paas/v4', model: 'mock', apiKey: 'fake' }, onProgress: (p) => events.push(p) });
    assert.equal(result.source, 'ai-api', JSON.stringify(result.status));
    assert.equal(result.items[0].tourId, 'cheapest', shape);
    assert.ok(prompt.includes('cheap'), 'cheap candidate must be visible to model');
    const previews = events.filter((e) => e.partialItems?.length && ['ranking', 'reasons'].includes(e.previewKind));
    if (shape !== 'json') {
      assert.ok(previews.length, shape + ' previews');
      assert.ok(previews.every((e) => e.partialItems[0].tourId === result.items[0].tourId), shape + ' first visible rank matches final');
    }
    if (shape === 'order-omits-cheap') {
      assert.equal(result.items[0].recommendationTier, 'local-supplement');
      assert.equal(result.items[0].reason, undefined);
      assert.notEqual(result.status?.mode, 'local-only', 'local supplementary facts never wait for absent AI reasons');
    }
    if (shape === 'items-only') assert.ok(result.items.some((i) => i.tourId === 'cheap' && i.reason?.startsWith('模型理由-cheap')), 'later legacy items keep model reasons: ' + JSON.stringify(result.items));
    console.log(`PASS ${shape}: first=${result.items[0].tourId}; previews=${previews.length}; final=${result.items.map((i) => i.tourId).join(',')}`);
  }
  const crowded = [candidate('t0', 4999), ...Array.from({ length: 29 }, (_, i) => candidate(`t${i + 1}`, 301 + i))];
  const events = [];
  globalThis.fetch = async (_url, init) => {
    const payload = JSON.parse(init.body);
    const content = payload.max_tokens <= 800 ? '{"demands":[],"avoid":[],"destinations":[],"queries":[]}'
      : JSON.stringify({ order: ['t0'], items: [{ tourId: 't0', score: 99, reason: '模型昂贵推荐' }], summary: '模型昂贵推荐摘要' });
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { headers: { 'content-type': 'application/json' } });
  };
  const local = await requestAiRecommendations({ conversationId: 'crowded-low', messages: [{ role: 'user', content: text }], candidateTours: crowded,
    activeFilters: {}, searchQuery: '', aiConfig: { baseUrl: 'https://api.z.ai/api/paas/v4', model: 'mock', apiKey: 'fake' }, onProgress: (p) => events.push(p) });
  assert.equal(local.source, 'local-preview', JSON.stringify(local.items));
  assert.equal(local.status.mode, 'local-only');
  assert.equal(local.summary, '');
  assert.ok(local.items.every((i) => i.recommendationTier === 'local-supplement' && !i.reason));
  assert.ok(!events.some((e) => e.stage === 'completed'));
  assert.ok(events.filter((e) => e.partialItems?.length && e.partialItems.every((i) => i.recommendationTier === 'local-supplement')).every((e) => e.previewKind === 'candidates'));
  assert.equal(local.items[0].tourId, 't1');
  assert.ok(!local.items.some((item) => item.tourId === 't0'), 'final assembly must not append expensive AI rejects behind the fixed low-price selection');
  assert.ok(local.items.length <= 25, 'fixed low-price selection must not grow again during final assembly');
  console.log('PASS 30-candidate all-local top25 is local-preview/local-only, empty summary, no AI completed event');
  // A real AI reason survives for a cheap item, but expensive rejects must not
  // sneak back into a mixed AI/local final result after its streaming order froze.
  const mixedTours = [...crowded, candidate('russia', 8999, { title: '金秋俄罗斯9天', duration: 9 }), candidate('turkey', 16499, { title: '璀璨绿宝石土耳其10天7晚', duration: 10 })];
  const mixedEvents = [];
  globalThis.fetch = async (_url, init) => {
    const payload = JSON.parse(init.body);
    const content = payload.max_tokens <= 800 ? '{"demands":[],"avoid":[],"destinations":[],"pricePreference":"low","queries":[]}'
      : JSON.stringify({ order: ['t1', 'russia', 'turkey'], items: [{ tourId: 't1', score: 80, reason: '模型生成的低价线路理由' }, { tourId: 'russia', score: 99, reason: '日均不到1000元，性价比很高' }, { tourId: 'turkey', score: 99, reason: '日均不到1650元，性价比很高' }] });
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { headers: { 'content-type': 'application/json' } });
  };
  const mixed = await requestAiRecommendations({ conversationId: 'mixed-low', messages: [{ role: 'user', content: text }], candidateTours: mixedTours, activeFilters: {}, searchQuery: '', aiConfig: { baseUrl: 'https://api.z.ai/api/paas/v4', model: 'mock', apiKey: 'fake' }, onProgress: p => mixedEvents.push(p) });
  assert.ok(mixed.items.some(i => i.tourId === 't1' && i.reason?.startsWith('模型生成的低价线路理由')), JSON.stringify(mixed));
  assert.ok(!mixed.items.some(i => ['russia', 'turkey'].includes(i.tourId)), 'rejected screenshot-price items cannot return during mixed final assembly');
  assert.ok(mixed.items.length <= 25);
  console.log('PASS mixed AI/local selection excludes screenshot high-price rejects without rewriting model reasons');
} finally { globalThis.fetch = nativeFetch; }
console.log('PASS all low-price offline regressions; no real AI calls');
