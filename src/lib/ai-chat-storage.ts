export const AI_CHAT_STORAGE_KEY = 'travel-ai-chat-state-v2';

export function clearStoredAiChatState() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AI_CHAT_STORAGE_KEY);
}
