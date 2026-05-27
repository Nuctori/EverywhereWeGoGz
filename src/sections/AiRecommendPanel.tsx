import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Eye, EyeOff, Loader2, MessageCircle, RotateCcw, Send, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type {
  AiRecommendationCandidate,
  AiRecommendationMessage,
  AiRecommendationResult,
  AiProviderConfig,
  AiPreferenceMemory,
  FilterState,
} from '@/types/tour';
import {
  clearAiProviderConfig,
  getAiProviderConfig,
  requestAiRecommendations,
  saveAiProviderConfig,
} from '@/lib/ai-recommendation';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface AiRecommendPanelProps {
  tours: AiRecommendationCandidate[];
  activeFilters: FilterState;
  searchQuery: string;
  result: AiRecommendationResult | null;
  onResultChange: (result: AiRecommendationResult | null) => void;
  onFocusResults: () => void;
}

const starterPrompts = [
  '3天内出发，预算2000以内，想轻松一点',
  '亲子出游，5天左右，别太赶',
  '想去云南或桂林，看看自然风景',
];

const AI_CHAT_STORAGE_KEY = 'travel-ai-chat-state';
const MAX_PERSISTED_MESSAGES = 40;

interface AiChatState {
  conversationId: string;
  input: string;
  messages: AiRecommendationMessage[];
  result: AiRecommendationResult | null;
  preferenceMemory: AiPreferenceMemory | null;
}

function createMessage(role: AiRecommendationMessage['role'], content: string): AiRecommendationMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function createInitialMessage() {
  return createMessage('assistant', '告诉我预算、天数、想去哪里、同行人群或行程强度，我会先把合适线路挑出来。');
}

function createConversationId() {
  return `ai-rec-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}

function readStoredChatState(): Partial<AiChatState> {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(window.localStorage.getItem(AI_CHAT_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveStoredChatState(state: AiChatState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    AI_CHAT_STORAGE_KEY,
    JSON.stringify({
      ...state,
      messages: state.messages.slice(-MAX_PERSISTED_MESSAGES),
    }),
  );
}

function clearStoredChatState() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AI_CHAT_STORAGE_KEY);
}

export function AiRecommendPanel({
  tours,
  activeFilters,
  searchQuery,
  result,
  onResultChange,
  onFocusResults,
}: AiRecommendPanelProps) {
  const storedChatState = useMemo(() => readStoredChatState(), []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [input, setInput] = useState(storedChatState.input || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiConfig, setAiConfig] = useState<Partial<AiProviderConfig>>(() => getAiProviderConfig());
  const [messages, setMessages] = useState<AiRecommendationMessage[]>(() =>
    storedChatState.messages?.length ? storedChatState.messages : [createInitialMessage()],
  );
  const [preferenceMemory, setPreferenceMemory] = useState<AiPreferenceMemory | null>(
    storedChatState.preferenceMemory || null,
  );
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipInitialSaveRef = useRef(Boolean(storedChatState.result));
  const conversationId = useMemo(
    () => storedChatState.conversationId || createConversationId(),
    [storedChatState.conversationId],
  );
  const hasResult = Boolean(result && result.items.length > 0);
  const isShowingProgress = loading && !hasResult;

  useEffect(() => {
    if (storedChatState.result && !result) {
      onResultChange(storedChatState.result);
    }
  }, [onResultChange, result, storedChatState.result]);

  useEffect(() => {
    if (skipInitialSaveRef.current) {
      skipInitialSaveRef.current = false;
      return;
    }

    saveStoredChatState({
      conversationId,
      input,
      messages,
      result,
      preferenceMemory,
    });
  }, [conversationId, input, messages, preferenceMemory, result]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const submitPrompt = async (rawPrompt?: string) => {
    const prompt = (rawPrompt ?? input).trim();
    if (!prompt || loading) return;

    const userMessage = createMessage('user', prompt);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const nextResult = await requestAiRecommendations({
        conversationId,
        messages: nextMessages,
        candidateTours: tours,
        activeFilters,
        searchQuery,
        aiConfig,
        preferenceMemory,
      });
      onResultChange(nextResult);
      setPreferenceMemory(nextResult.preferenceMemory || preferenceMemory);
      setMessages((current) => [
        ...current,
        createMessage('assistant', `已更新推荐结果，并置顶 ${nextResult.items.length} 条候选线路。`),
      ]);
      onFocusResults();
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    onResultChange(null);
    setPreferenceMemory(null);
    setMessages([createMessage('assistant', '已清空上一轮结果和本地偏好记忆。你可以重新描述这次想怎么出行。')]);
    setInput('');
    clearStoredChatState();
  };

  const saveSettings = () => {
    saveAiProviderConfig(aiConfig);
    setMessages((current) => [
      ...current,
      createMessage('assistant', 'AI 接口配置已保存。本轮开始会优先使用你的自定义地址、模型和 Key。'),
    ]);
  };

  const clearSettings = () => {
    clearAiProviderConfig();
    setAiConfig({});
    setMessages((current) => [
      ...current,
      createMessage('assistant', '已清除自定义 AI 配置，之后会回到公开默认配置或本地推荐。'),
    ]);
  };

  return (
    <div className="mb-5 rounded-[28px] border border-emerald-200/75 bg-[linear-gradient(180deg,rgba(240,253,244,0.92),rgba(255,255,255,0.96))] p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
            <Sparkles className="h-4 w-4 text-emerald-700" />
            AI 按需求找旅行团
            {preferenceMemory && (
              <Badge className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-800 hover:bg-emerald-100">
                已记住偏好
              </Badge>
            )}
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-600">
            直接描述出发时间、天数、预算、同行人和偏好；AI 会结合班期原语、天气、季节和线路信息置顶推荐。
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-xl border-emerald-200 bg-white px-3 text-xs text-emerald-800 hover:bg-emerald-50"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="h-3.5 w-3.5" />
          AI设置
        </Button>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-2">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="例如：周五晚上出发的3日游，预算2000以内，想轻松一点；或：带老人去避暑，别太赶"
          className="max-h-32 min-h-20 resize-none border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              submitPrompt();
            }
          }}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-1">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="shrink-0 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-600 transition hover:border-stone-300 hover:bg-white hover:text-stone-900"
                onClick={() => submitPrompt(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {hasResult && (
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-xl px-3 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                onClick={clearConversation}
                disabled={loading}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                清空推荐
              </Button>
            )}
            <Button
              type="button"
              className="h-9 rounded-xl bg-emerald-700 px-4 text-xs hover:bg-emerald-800"
              onClick={() => submitPrompt()}
              disabled={loading || !input.trim()}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              推荐线路
            </Button>
          </div>
        </div>
      </div>

      {(isShowingProgress || hasResult || messages.length > 1) && (
        <div ref={scrollRef} className="mt-4 max-h-64 space-y-3 overflow-y-auto rounded-2xl border border-stone-200 bg-white/80 p-3">
          {messages.slice(1).map((message) => (
            <div
              key={message.id}
              className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm',
                  message.role === 'user'
                    ? 'bg-stone-900 text-white'
                    : 'border border-stone-200 bg-white text-stone-700',
                )}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isShowingProgress && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-500 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在理解需求并匹配班期、天气和线路
              </div>
            </div>
          )}
          {hasResult && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <MessageCircle className="h-4 w-4" />
                推荐结果已置顶
                <Badge className="rounded-full bg-emerald-700 px-2 py-0.5 text-[11px] text-white hover:bg-emerald-700">
                  {result?.items.length}
                </Badge>
              </div>
              <p className="leading-6">{result?.summary}</p>
            </div>
          )}
        </div>
      )}

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" className="w-full gap-0 border-stone-200 bg-stone-50 p-0 sm:max-w-[440px]">
          <SheetHeader className="border-b border-stone-200 bg-white px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-stone-950">
              <Bot className="h-5 w-5 text-emerald-700" />
              AI 接口设置
            </SheetTitle>
            <div className="flex items-start justify-between gap-3">
              <SheetDescription>
                可使用公开默认接口，也可以配置自己的 OpenAI-compatible 地址和 Key。
              </SheetDescription>
            </div>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="mb-4">
                <div className="text-sm font-medium text-stone-900">AI 接口</div>
                <div className="mt-1 text-xs leading-5 text-stone-500">
                  留空时使用构建环境里的公开默认值；前端 Key 会暴露，请只放低额度或个人可控 Key。
                </div>
              </div>
              <div className="space-y-3">
                <Input
                  value={aiConfig.baseUrl || ''}
                  onChange={(event) => setAiConfig((current) => ({ ...current, baseUrl: event.target.value }))}
                  placeholder="Base URL，例如 https://api.openai.com/v1"
                  className="h-10 rounded-xl border-stone-200 bg-stone-50 text-sm"
                />
                <Input
                  value={aiConfig.model || ''}
                  onChange={(event) => setAiConfig((current) => ({ ...current, model: event.target.value }))}
                  placeholder="模型，例如 gpt-4.1-mini / deepseek-chat"
                  className="h-10 rounded-xl border-stone-200 bg-stone-50 text-sm"
                />
                <div className="flex gap-2">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={aiConfig.apiKey || ''}
                    onChange={(event) => setAiConfig((current) => ({ ...current, apiKey: event.target.value }))}
                    placeholder="API Key"
                    className="h-10 rounded-xl border-stone-200 bg-stone-50 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-xl border-stone-200 bg-white px-3"
                    onClick={() => setShowApiKey((value) => !value)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 rounded-xl px-3 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                  onClick={clearSettings}
                >
                  清除
                </Button>
                <Button
                  type="button"
                  className="h-9 rounded-xl bg-stone-900 px-3 text-xs hover:bg-stone-800"
                  onClick={saveSettings}
                >
                  保存配置
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
