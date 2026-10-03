// AI 推荐进度透明度契约测试：真实 requestAiRecommendations 管线 + mock z.ai SSE 流。
// 断言思维链增量经 onProgress 以 liveThinking 实时透出（阶段/字数/摘录/秒数），
// 且最终结果保留完整思维链与流式 usage——"CoT 生产不可见"问题的管线层回归门。
// 运行：npm run test:ai-streaming-progress
import { strict as assert } from 'node:assert';
import { requestAiRecommendations } from '../src/lib/ai-recommendation.ts';
import type { AiRecommendationCandidate, AiRecommendationProgress } from '../src/types/tour.ts';

const sse = (payload: unknown) => `data: ${JSON.stringify(payload)}\n\n`;

const reasoningParts = [
  '先圈定预算：总价600以内、两天一晚，爸妈同行节奏要慢。',
  '优先纯温泉度假酒店，少换酒店少坐车，含晚餐更省心。',
  '在广州周边挑从化、龙门、恩平的成熟温泉度假村。',
  '综合价格、温泉池数量、车程和含餐排出前后。',
];
const contentParts = [
  '{"summary":"优先温泉度假型两日团，节奏慢、含餐省心。',
  '","items":[',
  '{"tourId":"tour_a","score":92,"reason":"金水台温泉含晚餐，度假村节奏慢，总价在预算内","matchedSignals":["温泉","两日"]},',
  '{"tourId":"tour_b","score":88,"reason":"温泉池多且住宿好，适合爸妈慢慢泡","matchedSignals":["温泉","住宿"]}',
  ']}',
];
const usagePayload = {
  prompt_tokens: 2044,
  completion_tokens: 512,
  completion_tokens_details: { reasoning_tokens: 380 },
  total_tokens: 2556,
};

function buildMockFetch(issued: { zaiRequestBody?: Record<string, unknown> }) {
  return async (input: unknown, init?: { body?: string }) => {
    const url = typeof input === 'string' ? input : String((input as { url?: string })?.url ?? input);
    if (url.includes('api.z.ai')) {
      issued.zaiRequestBody = JSON.parse(init?.body ?? '{}') as Record<string, unknown>;
      const frames = [
        sse({ choices: [{ delta: { role: 'assistant' } }] }),
        ...reasoningParts.map((part) => sse({ choices: [{ delta: { reasoning_content: part } }] })),
        sse({ choices: [{ delta: {} }], usage: usagePayload }),
        ...contentParts.map((part) => sse({ choices: [{ delta: { content: part } }] })),
        sse({ choices: [{ delta: {}, finish_reason: 'stop' }], usage: usagePayload }),
        'data: [DONE]\n\n',
      ];
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          frames.forEach((frame, index) => {
            setTimeout(() => {
              try {
                controller.enqueue(encoder.encode(frame));
              } catch {}
              if (index === frames.length - 1) {
                try {
                  controller.close();
                } catch {}
              }
            }, 120 * (index + 1));
          });
        },
      });
      return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream; charset=UTF-8' } });
    }
    // 天气/其他外部依赖：安静地给空 JSON，保证测试只关注 AI 链路。
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  };
}

function candidate(overrides: Partial<AiRecommendationCandidate> & { id: string; title: string; destination: string; price: number }): AiRecommendationCandidate {
  return {
    id: overrides.id,
    title: overrides.title,
    source: overrides.source ?? 'test',
    destination: overrides.destination,
    duration: overrides.duration ?? 2,
    price: overrides.price,
    departureDate: overrides.departureDate ?? '2026-10-10',
    departureDates: overrides.departureDates ?? ['2026-10-10'],
    transportType: overrides.transportType ?? '大巴',
    accommodationLevel: overrides.accommodationLevel ?? '舒适',
    meals: overrides.meals ?? '含晚',
    highlights: overrides.highlights ?? ['温泉'],
    tags: overrides.tags ?? ['温泉'],
    isHot: overrides.isHot ?? false,
    theme: overrides.theme ?? '温泉度假',
    suitableFor: overrides.suitableFor ?? ['家庭'],
    leisureLevel: overrides.leisureLevel ?? 'easy',
    season: overrides.season ?? '秋季',
    rating: overrides.rating ?? 4.6,
    groupSize: overrides.groupSize ?? '20人',
    hotDepartureDates: overrides.hotDepartureDates ?? ['2026-10-10'],
  };
}

const EMPTY_FILTERS = {
  destination: '',
  minPrice: null,
  maxPrice: null,
  duration: null,
  source: '',
  departureDate: '',
  departureDateStart: '',
  departureDateEnd: '',
  theme: '',
  sortBy: 'hot' as const,
};

const originalFetch = globalThis.fetch;
const issued: { zaiRequestBody?: Record<string, unknown> } = {};
globalThis.fetch = buildMockFetch(issued) as typeof fetch;

try {
  const progressEvents: AiRecommendationProgress[] = [];
  const result = await requestAiRecommendations({
    conversationId: 'streaming-progress-test',
    messages: [{
      id: 'user-turn-1',
      role: 'user',
      content: '带爸妈泡温泉两天一晚，预算600内，从广州出发',
      createdAt: '2026-10-04T00:00:00.000Z',
    }],
    candidateTours: [
      candidate({ id: 'tour_a', title: '金水台温泉2天（含晚）', destination: '广东', price: 299 }),
      candidate({ id: 'tour_b', title: '龙门温德姆温泉2天', destination: '广东', price: 399 }),
    ],
    activeFilters: EMPTY_FILTERS,
    searchQuery: '',
    aiConfig: { baseUrl: 'https://api.z.ai/api/paas/v4', model: 'GLM-4.7-Flash', apiKey: 'test-key' },
    preferenceMemory: null,
    previousResult: null,
    onProgress: (progress) => progressEvents.push(progress),
  });

  // 1) 流式请求确实开启，且要求末尾 usage
  assert.equal(issued.zaiRequestBody?.stream, true, 'request must ask for SSE streaming');
  assert.deepEqual(issued.zaiRequestBody?.stream_options, { include_usage: true });
  assert.deepEqual(issued.zaiRequestBody?.thinking, { type: 'enabled' });

  // 2) onProgress 实时透出思维链快照
  const thinkingEvents = progressEvents.filter((event) => event.liveThinking);
  assert.ok(thinkingEvents.length >= 1, `expected liveThinking progress events, got stages: ${progressEvents.map((e) => e.stage).join(',')}`);
  const first = thinkingEvents[0];
  assert.equal(first.stage, 'ranking', 'main-call thinking must surface on the ranking stage');
  assert.equal(first.label, 'AI 正在思考');
  assert.ok(first.liveThinking!.chars > 0, 'thinking chars must grow above zero');
  assert.ok(first.liveThinking!.excerpt.length > 0, 'thinking excerpt must be non-empty');
  assert.ok(first.liveThinking!.elapsedMs >= 0);
  assert.equal(first.liveThinking!.model, 'GLM-4.7-Flash');

  // 3) 思维链快照是"进行中"事件——completed/fallback 阶段不再携带
  const terminalEvents = progressEvents.filter((event) => event.stage === 'completed' || event.stage === 'fallback');
  assert.ok(terminalEvents.length >= 1, 'pipeline must reach a terminal progress stage');
  assert.ok(terminalEvents.every((event) => !event.liveThinking), 'terminal stages must not carry liveThinking');

  // 4) 最终结果保留完整思维链与流式 usage（非流式同口径）
  assert.equal(result.source, 'ai-api');
  assert.ok(result.reasoning?.includes('从化、龙门、恩平'), 'full reasoning must survive into the result');
  assert.equal(result.usage?.model, 'GLM-4.7-Flash');
  assert.equal(result.usage?.reasoningTokens, 380);
  assert.ok(result.items.some((item) => item.tourId === 'tour_a'), 'streamed JSON items must map to candidates');

  console.info(`[1/2] 流式思维链经 onProgress 实时透出（${thinkingEvents.length} 个 liveThinking 事件）通过`);
  console.info('[2/2] 终态清理 + 结果思维链/usage 同口径保留通过');
  console.info('AI streaming progress transparency tests passed');
} finally {
  globalThis.fetch = originalFetch;
}
