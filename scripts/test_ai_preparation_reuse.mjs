// 分类头结果复用回归：
//   1. 首次调用通过 onPreparationReady 暴露分类头结果；
//   2. 同一轮恢复时传回 resumePreparation，必须跳过分类头调用（省 4s 且检索式一致）；
//   3. 没有 preparation 时仍然正常调用分类头。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { requestAiRecommendations } from '../src/lib/ai-recommendation.ts';
import { toursListSchema } from '../src/lib/runtime-schemas.ts';

const config = { baseUrl: 'https://example.test/v1', model: 'custom', apiKey: 'test' };
const baseList = toursListSchema.parse(
  JSON.parse(fs.readFileSync(new URL('../public/data/tours-list.json', import.meta.url), 'utf8')),
);
const candidates = baseList.slice(0, 24).map((tour) => ({
  ...tour,
  departureDate: '2099-01-01',
  departureDates: ['2099-01-01'],
  hotDepartureDates: [],
}));
const tourIds = candidates.map((tour) => tour.id);
const rankedIds = tourIds.slice(0, 20);
const tourId = rankedIds[0];

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
        order: rankedIds,
        items: rankedIds.map((id, index) => ({
          tourId: id,
          score: 100 - index,
          // 前 8 条详细，9 条起一句话——与线上首轮 prompt 的分布一致，才能触发补全。
          reason: index < 8
            ? '一条足够长的详细推荐理由，具体写到玩法、画面和取舍，帮助用户判断这条线路适合谁、什么时候去最合适。'
            : '一句话简介',
          matchedSignals: ['测试'],
        })),
        summary: '复用回归摘要',
      }),
    },
  }],
});
const upgradeReply = JSON.stringify({
  choices: [{ message: { content: JSON.stringify({ items: [] }) } }],
});

function makeRequest(overrides = {}) {
  return {
    conversationId: 'preparation-test',
    messages: [{ role: 'user', content: '推荐一些线路' }],
    candidateTours: candidates,
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
    const isUpgrade = !isRanking && prompt.includes('补写完整推荐理由');
    calls.push(isUpgrade ? 'upgrade' : isRanking ? 'ranking' : 'classifier');
    if (isUpgrade) {
      // 只给请求里点名的 7 条补写；客户端必须按 tourId 合并，不能整条替换。
      const ids = [...new Set([...prompt.matchAll(/tour_\d+/g)].map((match) => match[0]))].slice(0, 7);
      const content = JSON.stringify({
        order: ids,
        items: ids.map((id) => ({
          tourId: id,
          reason: '补全后的详细理由，具体到玩法、画面和取舍，帮助用户判断这条线路适合谁。',
          matchedSignals: ['补全'],
        })),
      });
      return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(isRanking ? rankingReply : classifierReply, {
      headers: { 'content-type': 'application/json' },
    });
  };

  let captured = null;
  let baseCaptured = null;
  const first = await requestAiRecommendations(makeRequest({
    onPreparationReady: (preparation) => { captured = preparation; },
    onBaseResult: (base) => { baseCaptured = base; },
  }));
  assert.equal(first.status?.mode, 'ai');
  assert.deepEqual(calls, ['classifier', 'ranking', 'upgrade'], 'first turn runs classifier + ranking + reason upgrade');
  assert.ok(captured && Array.isArray(captured.queries), 'preparation must carry queries');
  assert.ok(captured.spec === null || Array.isArray(captured.spec.demands));
  assert.equal(baseCaptured?.reasonPhase, 'base', 'the first result must be persisted as a base checkpoint');
  assert.ok(
    baseCaptured.items.filter((item) => item.recommendationTier === 'ai-detailed').length >= 9,
    'base result must have detailed slots left for the upgrade',
  );
  assert.ok(
    first.items.some((item) => (item.reason || '').startsWith('补全后的详细理由')),
    'upgrade reasons must be merged into the final result',
  );
  assert.equal(first.reasonPhase, 'full', 'all deferred reasons upgraded means the result is full');

  // 快速恢复：上一轮已经有完整排序/条目（base），恢复时只补理由，不重跑分类头和排序。
  calls.length = 0;
  const fast = await requestAiRecommendations(makeRequest({
    resumeInterrupted: true,
    previousResult: baseCaptured,
  }));
  assert.deepEqual(calls, ['upgrade'], 'base checkpoint resume must skip classifier and ranking');
  assert.ok(fast.items.some((item) => (item.reason || '').startsWith('补全后的详细理由')));
  assert.equal(fast.reasonPhase, 'full');

  calls.length = 0;
  const second = await requestAiRecommendations(makeRequest({
    resumeInterrupted: true,
    resumePreparation: captured,
  }));
  assert.equal(second.status?.mode, 'ai');
  assert.deepEqual(calls, ['ranking', 'upgrade'], 'resume must skip the classifier when preparation is present');

  calls.length = 0;
  await requestAiRecommendations(makeRequest({ resumeInterrupted: true, resumePreparation: null }));
  assert.deepEqual(calls, ['classifier', 'ranking', 'upgrade'], 'missing preparation falls back to the classifier');
  console.log('AI preparation reuse regression passed');
} finally {
  globalThis.fetch = originalFetch;
}
