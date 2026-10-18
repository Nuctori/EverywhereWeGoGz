// AI 聊天状态持久化：负责 localStorage 的读写、版本隔离和消息裁剪。
import type {
  AiPreferenceMemory,
  AiRecommendationMessage,
  AiRecommendationResult,
} from '@/types/tour';
import { storedAiChatStateSchema, storedAiProgressSchema } from '@/lib/runtime-schemas';

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

// ====== 进行中进度：跨标签页同步 ======
// 进度原本只存在组件内存里，另一个标签页打开这个站点时完全看不出"那一头正在跑"。
// 这里把进行中的快照写进独立的 storage 键，并监听 storage 事件同步过来。
// 只同步"正在跑"这件事本身（阶段、文案、进度、起始时间），不同步候选结果——
// 结果体积大，且另一标签页自己跑一遍才是它自己的结果。
export const AI_PROGRESS_STORAGE_KEY = 'travel-ai-progress-v1';

/** 进度快照超过这个时长就认为已经失效（页面被关掉时来不及写 running:false） */
export const AI_PROGRESS_STALE_MS = 10 * 60 * 1000;

export interface StoredAiProgress {
  ownerId?: string;
  version?: number;
  prompt?: string;
  startedAt?: number;
  progress?: { stage: string; label: string; detail: string; progress: number };
  running?: boolean;
}

export function readStoredAiProgress(): StoredAiProgress | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(AI_PROGRESS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = storedAiProgressSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;

    const value = parsed.data;
    if (!value.running) return null;
    // 崩溃/断电导致没写下 running:false 时，靠起始时间兜底，别让进度条永远转着。
    if (typeof value.startedAt === 'number' && Date.now() - value.startedAt > AI_PROGRESS_STALE_MS) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function saveStoredAiProgress(state: StoredAiProgress) {
  if (typeof window === 'undefined') return;

  try {
    const parsed = storedAiProgressSchema.safeParse(state);
    if (!parsed.success) return;
    window.localStorage.setItem(AI_PROGRESS_STORAGE_KEY, JSON.stringify(parsed.data));
  } catch {
    // 隐私模式下 localStorage 可能直接抛错；进度同步只是增强，不能影响主流程。
  }
}

export function clearStoredAiProgress() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(AI_PROGRESS_STORAGE_KEY);
  } catch {
    // 同上，忽略。
  }
}

/** 订阅别的标签页写进来的进度变化。返回取消订阅函数。 */
export function subscribeStoredAiProgress(
  onProgress: (progress: StoredAiProgress | null) => void,
) {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: StorageEvent) => {
    if (event.key !== AI_PROGRESS_STORAGE_KEY) return;
    onProgress(readStoredAiProgress());
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
