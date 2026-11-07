// 分类头结果复用回归：
//   1. 首次调用通过 onPreparationReady 暴露分类头结果；
//   2. 同一轮恢复时传回 resumePreparation，必须跳过分类头调用（省 4s 且检索式一致）；
//   3. 没有 preparation 时仍然正常调用分类头。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { requestAiRecommendations } from '../src/lib/ai-recommendation.ts';
import { toursListSchema } from '../src/lib/runtime-schemas.ts';

const config = { baseUrl: 'https://example.test/v1', model: 'custom', apiKey: 'test' };
const base = toursListSchema.parse(
  JSON.parse(fs.readFileSync(new URL('../public/data/tours-list.json', import.meta.url), 'utf8')),
)[0];
const candidate = { ...base, departureDate: '2099-01-01', departureDates: ['2099-01-01'], hotDepartureDates: [] };
const tourId = candidate.id;

const classifierReply = JSON.stringify({
  choices: [{
    message: {
      content: JSON.stringify({ demands: [], avoid: [], destinations: [], pricePreference: 'unchanged' }),
    },
  }],
});
const rankingReply = JSON.stringify({
  choices: [{
    message: {
      content: JSON.stringify({
        order: [tourId],
        items: [{ tourId, score: 95, reason: '复用回归理由', matchedSignals: ['测试'] }],
        summary: '复用回归摘要',
      }),
    },
  }],
});

function makeRequest(overrides = {}) {
  return {
    conversationId: 'preparation-test',
    messages: [{ role: 'user', content: '预算3000内' }],
    candidateTours: [candidate],
    activeFilters: {},
    searchQuery: '',
    aiConfig: config,
    ...overrides,
  };
}

const originalFetch = globalThis.fetch;
try {
  const calls = [];
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init?.body || '{}');
    const prompt = JSON.stringify(body.messages || []);
    const isRanking = prompt.includes('rank_5detailed_10brief');
    calls.push(isRanking ? 'ranking' : 'classifier');
    return new Response(isRanking ? rankingReply : classifierReply, {
      headers: { 'content-type': 'application/json' },
    });
  };

  let captured = null;
  const first = await requestAiRecommendations(makeRequest({
    onPreparationReady: (preparation) => { captured = preparation; },
  }));
  assert.equal(first.status?.mode, 'ai');
  assert.deepEqual(calls, ['classifier', 'ranking'], 'first turn runs classifier + ranking');
  assert.ok(captured && Array.isArray(captured.queries), 'preparation must carry queries');
  assert.ok(captured.spec === null || Array.isArray(captured.spec.demands));

  calls.length = 0;
  const second = await requestAiRecommendations(makeRequest({
    resumeInterrupted: true,
    resumePreparation: captured,
  }));
  assert.equal(second.status?.mode, 'ai');
  assert.deepEqual(calls, ['ranking'], 'resume must skip the classifier when preparation is present');

  calls.length = 0;
  await requestAiRecommendations(makeRequest({ resumeInterrupted: true, resumePreparation: null }));
  assert.deepEqual(calls, ['classifier', 'ranking'], 'missing preparation falls back to the classifier');
  console.log('AI preparation reuse regression passed');
} finally {
  globalThis.fetch = originalFetch;
}
