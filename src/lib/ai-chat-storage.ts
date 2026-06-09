// AI 聊天状态持久化：负责 localStorage 的读写、版本隔离和消息裁剪。
import type {
  AiPreferenceMemory,
  AiRecommendationMessage,
  AiRecommendationResult,
} from '@/types/tour';
import { storedAiChatStateSchema } from '@/lib/runtime-schemas';

export const AI_CHAT_STORAGE_KEY = 'travel-ai-chat-state-v2';

export interface StoredAiChatState {
  conversationId?: string;
  input?: string;
  messages?: AiRecommendationMessage[];
  result?: AiRecommendationResult | null;
  preferenceMemory?: AiPreferenceMemory | null;
}

export function readStoredAiChatState(): StoredAiChatState {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(AI_CHAT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = storedAiChatStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

// 保存聊天状态时只保留末尾 N 条消息；非正数不裁剪，避免误清空历史。
export function saveStoredAiChatState(
  state: StoredAiChatState,
  maxPersistedMessages?: number,
) {
  if (typeof window === 'undefined') return;
  const messageLimit =
    typeof maxPersistedMessages === 'number' && Number.isInteger(maxPersistedMessages) && maxPersistedMessages > 0
      ? maxPersistedMessages
      : null;

  const normalizedState = {
    ...state,
    messages:
      messageLimit !== null && Array.isArray(state.messages)
        ? state.messages.slice(-messageLimit)
        : state.messages,
  };
  const parsed = storedAiChatStateSchema.safeParse(normalizedState);
  if (!parsed.success) return;
  window.localStorage.setItem(AI_CHAT_STORAGE_KEY, JSON.stringify(parsed.data));
}

export function clearStoredAiChatState() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AI_CHAT_STORAGE_KEY);
}
