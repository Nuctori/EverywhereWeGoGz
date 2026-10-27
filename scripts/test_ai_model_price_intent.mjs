// Offline public pipeline contract: the merged classifier, not lexical lists, owns price.
import assert from 'node:assert/strict';
import { requestAiRecommendations } from '../src/lib/ai-recommendation.ts';
const tours = [4999, 3299, 399, 300].map((price, i) => ({ id: `t${i}`, price, title: '奔县游山水线路', destination: '', source: 'test', duration: 2, departureDate: '2099-01-01', departureDates: ['2099-01-01'], tags: [], highlights: [], theme: '', transportType: '大巴', rating: 4.6 }));
const nativeFetch = globalThis.fetch;
async function run(text, pricePreference, preferenceMemory, { fail = false, omit = false, numeric = false } = {}) {
  const events = []; let calls = 0; let classifierInput; let mainPrompt;
  globalThis.fetch = async (_url, init) => {
    const payload = JSON.parse(init.body); calls++;
    if (payload.max_tokens <= 800) {
      classifierInput = JSON.parse(payload.messages.find((m) => m.role === 'user').content);
      if (fail) throw new Error('offline classifier failure');
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ demands: [], avoid: [], destinations: [], ...(omit ? { queries: [] } : { pricePreference }) }) } }] }), { headers: { 'content-type': 'application/json' } });
    }
    mainPrompt = JSON.stringify(payload.messages);
    // Deliberately contradictory price and invented budget: neither may undo the classifier/facts.
    const items = tours.map((t, i) => ({ tourId: t.id, score: 99-i, reason: `模型理由${t.id}`, matchedSignals: [] }));
    const fragments = ['{"order":'+JSON.stringify(tours.map((t) => t.id))+',"items":[', ...items.map((item,i) => (i ? ',' : '')+JSON.stringify(item)), '],"intent":{"budgetPriority":"low","budgetMax":1},"summary":"模型摘要"}'];
    return new Response(new ReadableStream({ async start(c) { for (const content of fragments) { c.enqueue(new TextEncoder().encode('data: '+JSON.stringify({ choices:[{delta:{content}}] })+'\n\n')); await new Promise((r) => setTimeout(r, 1)); } c.enqueue(new TextEncoder().encode('data: [DONE]\n\n')); c.close(); } }), { headers: { 'content-type': 'text/event-stream' } });
  };
  const result = await requestAiRecommendations({ conversationId: 'price-'+text, messages: [...(preferenceMemory ? [{ role: 'user', content: '奔县游' }, { role: 'assistant', content: '上一轮模型结果' }] : []), { role: 'user', content: text }], candidateTours: tours, preferenceMemory, activeFilters: {}, searchQuery: '', aiConfig: { baseUrl: 'https://api.z.ai/api/paas/v4', model: 'mock', apiKey: 'fake' }, onProgress: (p) => events.push(p) });
  assert.equal(result.source, 'ai-api', JSON.stringify(result.status));
  const previews = events.filter((p) => p.partialItems?.length && ['ranking','reasons'].includes(p.previewKind));
  assert.ok(previews.length, 'progressive first order must be exercised');
  for (const preview of previews) {
    const ids = preview.partialItems.map((item) => item.tourId);
    assert.deepEqual(result.items.map((item) => item.tourId).filter((id) => ids.includes(id)), ids, 'entire visible order remains stable through final assembly');
  }
  if (!numeric) assert.equal(result.preferenceMemory?.budgetMax ?? null, null, 'no invented numeric budget');
  assert.ok(mainPrompt.includes('t3'), 'cheap candidate visible before recommendation');
  if (!fail) assert.equal(calls, 2, 'no extra serial model call');
  return { result, classifierInput };
}
try {
  const low = await run('比上轮节省开支', 'low');
  assert.equal(low.result.items[0].tourId, 't3');
  assert.equal(low.result.preferenceMemory.budgetPriority, 'low');
  const none = await run('现在不必顾价格', 'none', low.result.preferenceMemory);
  assert.equal(none.result.items[0].tourId, 't0');
  assert.equal(none.result.preferenceMemory.budgetPriority, 'balanced');
  assert.equal(none.classifierInput.previousPricePreference, 'low');
  const inheritedClear = await run('仍去奔县', 'unchanged', none.result.preferenceMemory);
  assert.equal(inheritedClear.result.items[0].tourId, 't0');
  assert.equal(inheritedClear.result.preferenceMemory.budgetPriority, 'balanced');
  const inheritedLow = await run('仍去奔县', 'unchanged', low.result.preferenceMemory);
  assert.equal(inheritedLow.result.items[0].tourId, 't3');
  const premium = await run('这次优先享受顶级服务', 'premium');
  assert.equal(premium.result.preferenceMemory.budgetPriority, 'premium');
  assert.equal(premium.result.items[0].tourId, 't0');
  const fallback = await run('便宜的奔县游', undefined, undefined, { fail: true });
  assert.equal(fallback.result.items[0].tourId, 't3');
  assert.equal(fallback.result.source, 'ai-api'); // only classifier failed; main model reasons remain real.
  const missing = await run('便宜的奔县游', undefined, undefined, { omit: true });
  assert.equal(missing.result.items[0].tourId, 't3');
  const numeric = await run('预算严格不能超过500元奔县游', 'none', low.result.preferenceMemory, { numeric: true });
  assert.equal(numeric.result.preferenceMemory.budgetMax, 500);
  assert.ok(numeric.result.items.filter((i) => i.reasonSource === 'ai').every((i) => tours.find((t) => t.id === i.tourId).price <= 500), JSON.stringify(numeric.result.items));
  assert.ok(numeric.result.items.filter((i) => tours.find((t) => t.id === i.tourId).price > 500).every((i) => !i.reasonSource && i.matchedSignals.some((s) => s.includes('价格高于预算上限'))), 'over-budget alternatives retain explicit conflicts, never model endorsement');
  console.log('PASS public pipeline: no-keyword low, none overrides old low, unchanged retains/clears across requests, premium, explicit/missing classifier fallback, numeric bounds, progressive fixed order; no network');
} finally { globalThis.fetch = nativeFetch; }
