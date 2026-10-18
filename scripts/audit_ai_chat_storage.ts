// Verifies chat storage message trimming semantics without a browser runtime.
import { strict as assert } from 'node:assert';
import {
  AI_CHAT_STORAGE_KEY,
  AI_PROGRESS_STALE_MS,
  AI_PROGRESS_STORAGE_KEY,
  clearStoredAiProgress,
  readStoredAiChatState,
  readStoredAiProgress,
  saveStoredAiChatState,
  saveStoredAiProgress,
} from '../src/lib/ai-chat-storage.ts';
import type { AiRecommendationMessage } from '../src/types/tour.ts';

type StorageMap = Map<string, string>;

const storage: StorageMap = new Map();

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      removeItem: (key: string) => {
        storage.delete(key);
      },
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    },
  },
});

function message(id: string): AiRecommendationMessage {
  return {
    id,
    role: 'user',
    content: `message-${id}`,
    createdAt: `2026-06-10T00:00:0${id}.000Z`,
  };
}

function saveAndRead(maxPersistedMessages?: number) {
  storage.clear();
  saveStoredAiChatState(
    {
      conversationId: 'audit-storage',
      messages: [message('1'), message('2'), message('3')],
    },
    maxPersistedMessages,
  );
  return readStoredAiChatState().messages?.map((item) => item.id);
}

assert.deepEqual(saveAndRead(2), ['2', '3']);
assert.deepEqual(saveAndRead(0), ['1', '2', '3']);
assert.deepEqual(saveAndRead(-1), ['1', '2', '3']);
assert.deepEqual(saveAndRead(1.5), ['1', '2', '3']);
assert.equal(storage.has(AI_CHAT_STORAGE_KEY), true);

// ====== 进行中进度：跨标签页同步 ======
// 另一个页面打开站点时，靠这个键知道"那一头正在跑"，所以它必须：
// 只在 running 时可见、过期自动失效、和聊天状态互不覆盖。

// 1) 正在跑时读得到，且字段原样保留。
storage.clear();
saveStoredAiProgress({
  ownerId: 'tab-a',
  version: 7,
  prompt: '周末去广东泡温泉',
  startedAt: Date.now() - 3000,
  progress: { stage: 'ranking', label: '正在筛选', detail: '正在比较线路', progress: 62 },
  running: true,
});
const runningProgress = readStoredAiProgress();
assert.equal(runningProgress?.prompt, '周末去广东泡温泉', 'the running prompt must survive the round-trip');
assert.equal(runningProgress?.progress?.stage, 'ranking', 'the progress stage must survive the round-trip');
assert.equal(runningProgress?.ownerId, 'tab-a', 'the writer tab id must survive, so a tab can ignore its own echo');

// 2) running:false（本轮结束）后必须立刻不可见，否则别的标签页会一直转圈。
saveStoredAiProgress({
  ownerId: 'tab-a',
  prompt: '周末去广东泡温泉',
  startedAt: Date.now(),
  running: false,
});
assert.equal(readStoredAiProgress(), null, 'a finished run must not be visible as "in progress"');

// 3) 页面被直接关掉、来不及写 running:false 时，靠起始时间兜底判定过期。
saveStoredAiProgress({
  ownerId: 'tab-a',
  startedAt: Date.now() - AI_PROGRESS_STALE_MS - 1000,
  running: true,
});
assert.equal(readStoredAiProgress(), null, 'a stale snapshot must be treated as gone');

// 4) 进度和聊天状态是两个键，写一个不能把另一个冲掉。
storage.clear();
saveStoredAiChatState({ conversationId: 'c1', messages: [message('1')] });
saveStoredAiProgress({ ownerId: 'tab-a', startedAt: Date.now(), running: true });
assert.equal(storage.has(AI_CHAT_STORAGE_KEY), true, 'writing progress must not drop the chat state');
assert.equal(storage.has(AI_PROGRESS_STORAGE_KEY), true, 'writing chat state must not drop the progress');

// 5) 清空进度不影响聊天状态。
clearStoredAiProgress();
assert.equal(storage.has(AI_PROGRESS_STORAGE_KEY), false, 'clearStoredAiProgress must remove the progress key');
assert.equal(storage.has(AI_CHAT_STORAGE_KEY), true, 'clearStoredAiProgress must leave the chat state alone');

console.info('AI chat storage audit passed');
