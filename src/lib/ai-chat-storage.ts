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

export function saveStoredAiChatState(
  state: StoredAiChatState,
  maxPersistedMessages?: number,
) {
  if (typeof window === 'undefined') return;

  const normalizedState = {
    ...state,
    messages:
      typeof maxPersistedMessages === 'number' && Array.isArray(state.messages)
        ? state.messages.slice(-maxPersistedMessages)
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
