// AI 聊天持久化往返契约：写进去的字段，读出来必须还在。
// 历史回归：result/items 的 schema 漏字段 -> zod 静默剥字段 -> 重载后排序键、
// 诊断信息（reasoning/searchRounds/usage）全部丢失，而外层仍是"合法"状态。
import assert from 'node:assert/strict';
import {
  AI_CHAT_STORAGE_KEY,
  readStoredAiChatState,
  saveStoredAiChatState,
} from '../src/lib/ai-chat-storage.ts';

const storage = new Map();
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      removeItem: (key) => storage.delete(key),
      setItem: (key, value) => storage.set(key, value),
    },
  },
});

const message = (id) => ({ id, role: 'user', content: `message-${id}`, createdAt: `2026-06-10T00:00:0${id}.000Z` });

const result = {
  conversationId: 'roundtrip',
  summary: '推荐三条海岛线路',
  items: [
    {
      tourId: 'tour_1',
      score: 9.5,
      reason: '种草理由',
      matchedSignals: ['海边'],
      demandCoverage: 3,
      constraintFit: 2,
      constraintChecked: 2,
      qualityFlag: false,
      constraintNear: 0.8,
      budgetOutlier: false,
      semanticFit: 'good',
      semanticSignals: ['悠闲'],
      semanticBoundary: '未核实',
      reasonSource: 'ai',
      recommendationTier: 'ai-detailed',
    },
  ],
  generatedAt: '2026-10-18T00:00:00.000Z',
  source: 'ai-api',
  reasoning: '思维链内容',
  searchRounds: [{ query: '海岛', hitCount: 12, alignedCount: 5, topTitles: ['A'] }],
  usage: { model: 'glm', promptTokens: 1000, completionTokens: 500 },
  refinementMode: 'new_search',
  assumptions: ['默认两人出行'],
  tradeoffs: ['价格略高'],
};

storage.clear();
saveStoredAiChatState({ conversationId: 'roundtrip', messages: [message('1')], result }, 40);
const reread = readStoredAiChatState();

assert.ok(storage.has(AI_CHAT_STORAGE_KEY), 'state must be persisted');
assert.deepEqual(reread.result, result, 'result must survive the local storage round trip unchanged');

// 消息裁剪语义保持（历史行为）。
storage.clear();
saveStoredAiChatState({ messages: [message('1'), message('2'), message('3')] }, 2);
assert.deepEqual(readStoredAiChatState().messages?.map((item) => item.id), ['2', '3']);

// 损坏数据不抛异常，读成空状态。
storage.clear();
storage.set(AI_CHAT_STORAGE_KEY, '{not-json');
assert.deepEqual(readStoredAiChatState(), {});

storage.clear();
storage.set(AI_CHAT_STORAGE_KEY, JSON.stringify({ result: { conversationId: 'x', items: 'not-an-array' } }));
assert.deepEqual(readStoredAiChatState(), {});

// A pending turn has an immutable request snapshot and its own checkpoint.
// The independently readable prior result must not silently become that checkpoint.
const pendingContext = {
  turnId: 'turn-recovery', prompt: '继续这轮需求',
  activeFilters: { destination: '云南', minPrice: 300, maxPrice: 1500, duration: 3,
    source: '', departureDate: '', departureDateStart: '2026-11-01', departureDateEnd: '2026-11-08',
    theme: '', sortBy: 'hot', hideExpired: true },
  searchQuery: '原始搜索上下文', messages: [message('1')], preferenceMemory: null,
  previousResult: result, checkpoint: null, recoveryState: 'offline',
};
storage.clear();
saveStoredAiChatState({ conversationId: 'roundtrip', messages: [message('1')], result,
  pendingPrompt: pendingContext.prompt, pendingContext, autoResumeRemaining: 2 }, 40);
assert.deepEqual(readStoredAiChatState().pendingContext, pendingContext,
  'pending context, filters, identity and null checkpoint must round-trip');
saveStoredAiChatState({ ...readStoredAiChatState(), pendingContext: { ...pendingContext, checkpoint: result, recoveryState: 'background' } });
assert.deepEqual(readStoredAiChatState().pendingContext.checkpoint, result);
saveStoredAiChatState({ ...readStoredAiChatState(), pendingPrompt: null, pendingContext: null, autoResumeRemaining: 0 });
assert.equal(readStoredAiChatState().pendingContext, null, 'completed turns clear recovery atomically');
assert.equal(readStoredAiChatState().pendingPrompt, null);
assert.deepEqual(readStoredAiChatState().result, result, 'completion retains the readable result');

// Legacy v2 snapshots still load, without inventing checkpoint ownership.
storage.set(AI_CHAT_STORAGE_KEY, JSON.stringify({ messages: [message('1')], result, pendingPrompt: '旧请求', autoResumeRemaining: 1 }));
assert.equal(readStoredAiChatState().pendingPrompt, '旧请求');
assert.equal(readStoredAiChatState().pendingContext, undefined);

console.info('AI chat storage round-trip tests passed');
