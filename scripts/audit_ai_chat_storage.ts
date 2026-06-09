// Verifies chat storage message trimming semantics without a browser runtime.
import { strict as assert } from 'node:assert';
import {
  AI_CHAT_STORAGE_KEY,
  readStoredAiChatState,
  saveStoredAiChatState,
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

console.info('AI chat storage audit passed');
