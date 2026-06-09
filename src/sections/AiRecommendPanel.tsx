import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Settings,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type {
  AiRecommendationCandidate,
  AiRecommendationMessage,
  AiRecommendationProgress,
  AiRecommendationResult,
  AiProviderConfig,
  AiPreferenceMemory,
  FilterState,
} from '@/types/tour';
import {
  clearAiProviderConfig,
  getStoredAiProviderConfig,
  requestAiRecommendations,
  saveAiProviderConfig,
} from '@/lib/ai-recommendation';
import {
  clearStoredAiChatState,
  readStoredAiChatState,
  saveStoredAiChatState,
} from '@/lib/ai-chat-storage';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import type { AiSearchRequest } from '@/App';

interface AiRecommendPanelProps {
  tours: AiRecommendationCandidate[];
  toursLoading: boolean;
  activeFilters: FilterState;
  searchQuery: string;
  result: AiRecommendationResult | null;
  request: AiSearchRequest | null;
  clearVersion: number;
  onResultChange: (result: AiRecommendationResult | null) => void;
  onFocusResults: () => void;
}

const MAX_PERSISTED_MESSAGES = 40;
const progressSteps: Array<{
  stage: AiRecommendationProgress['stage'];
  shortLabel: string;
}> = [
  { stage: 'queued', shortLabel: '收到需求' },
  { stage: 'intent', shortLabel: '理解需求' },
  { stage: 'context', shortLabel: '补充上下文' },
  { stage: 'ranking', shortLabel: '生成推荐' },
  { stage: 'completed', shortLabel: '已完成' },
];

function getQuestionLead(prompt: string) {
  const normalized = prompt.replace(/\s+/g, '');
  const asksWeatherCapability =
    /(天气|气温|温度|下雨|降雨|台风|预报)/.test(normalized) &&
    /(能|会|可以|有没有|怎么|如何|知道|获取|查|看|支持)/.test(normalized);

  if (asksWeatherCapability) {
    return '可以，我会先结合能拿到的天气信息来辅助判断；如果时间太远拿不到可靠预报，就会退回到季节和目的地经验判断。';
  }

  return null;
}

function buildResultAssistantReply(result: AiRecommendationResult, prompt: string) {
  const questionLead = getQuestionLead(prompt);
  if (questionLead) {
    return `${questionLead}${result.summary}`;
  }

  const isQuestion = /[？?]$/.test(prompt) || /^(你能|你会|可以|能不能|有没有|怎么|如何|为啥|为什么)/.test(prompt);
  if (isQuestion) {
    return `可以，我先按这个问题帮你判断一下。${result.summary}`;
  }

  return result.summary;
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
  return createMessage('assistant', '告诉我预算、天数、目的地和同行人，我会先帮你把合适线路筛出来。');
}

function createConversationId() {
  return `ai-rec-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}

function countRecommendedItems(result: AiRecommendationResult | null) {
  return result?.items.filter((item) => Boolean(item.reason)).length ?? 0;
}

function getResultStatusMeta(result: AiRecommendationResult | null) {
  if (!result) return null;

  if (result.status) return result.status;

  if (result.source === 'ai-api') {
    return {
      mode: 'ai' as const,
      label: 'AI 已完成推荐',
      detail: `已生成 ${countRecommendedItems(result)} 条建议，并展示 ${result.items.length} 条匹配线路。`,
    };
  }

  return {
    mode: 'fallback' as const,
    label: '本次使用备用推荐结果',
    detail: `AI 没有顺利完成时，先返回了 ${result.items.length} 条本地候选补位结果。`,
  };
}

export function AiRecommendPanel({
  tours,
  toursLoading,
  activeFilters,
  searchQuery,
  result,
  request,
  clearVersion,
  onResultChange,
  onFocusResults,
}: AiRecommendPanelProps) {
  const storedChatState = useMemo(() => readStoredAiChatState(), []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiConfig, setAiConfig] = useState<Partial<AiProviderConfig>>(() => getStoredAiProviderConfig());
  const [useCustomAiConfig, setUseCustomAiConfig] = useState(
    () => Object.keys(getStoredAiProviderConfig()).length > 0,
  );
  const [messages, setMessages] = useState<AiRecommendationMessage[]>(() =>
    storedChatState.messages?.length ? storedChatState.messages : [createInitialMessage()],
  );
  const [preferenceMemory, setPreferenceMemory] = useState<AiPreferenceMemory | null>(
    storedChatState.preferenceMemory || null,
  );
  const [loading, setLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [progressState, setProgressState] = useState<AiRecommendationProgress | null>(null);
  const [expandedStage, setExpandedStage] = useState<AiRecommendationProgress['stage'] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipInitialSaveRef = useRef(Boolean(storedChatState.result));
  const didRestoreStoredResultRef = useRef(false);
  const requestVersionRef = useRef(0);
  const handledRequestIdRef = useRef<number | null>(null);
  const conversationId = useMemo(
    () => storedChatState.conversationId || createConversationId(),
    [storedChatState.conversationId],
  );
  const hasResult = Boolean(result && result.items.length > 0);
  const toursReady = !toursLoading && tours.length > 0;
  const resultStatusMeta = getResultStatusMeta(result);
  useEffect(() => {
    if (didRestoreStoredResultRef.current || !storedChatState.result) return;

    didRestoreStoredResultRef.current = true;
    onResultChange(storedChatState.result);
  }, [onResultChange, storedChatState.result]);

  useEffect(() => {
    if (skipInitialSaveRef.current) {
      skipInitialSaveRef.current = false;
      return;
    }

    saveStoredAiChatState({
      conversationId,
      input: '',
      messages,
      result,
      preferenceMemory,
    }, MAX_PERSISTED_MESSAGES);
  }, [conversationId, messages, preferenceMemory, result]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  useEffect(() => {
    if (clearVersion === 0) return;

    requestVersionRef.current += 1;
    setLoading(false);
    setPreferenceMemory(null);
    setProgressState(null);
    setExpandedStage(null);
    setDetailsOpen(false);
    setMessages([createInitialMessage()]);
  }, [clearVersion]);

  useEffect(() => {
    if (!progressState?.substeps?.length) {
      setExpandedStage(null);
      return;
    }

    setExpandedStage((current) => (current === progressState.stage ? current : progressState.stage));
  }, [progressState]);

  const submitPrompt = useCallback(async (rawPrompt: string) => {
    const prompt = rawPrompt.trim();
    if (!prompt || loading || !toursReady) return;
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;

    const userMessage = createMessage('user', prompt);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);
    onResultChange(null);
    setDetailsOpen(false);
    setProgressState({
      stage: 'queued',
      label: '已收到需求',
      detail: '正在开始本次处理。',
      progress: 8,
      substeps: [
        { id: 'capture', label: '接收本次条件', status: 'done' },
        { id: 'start', label: '启动推荐流程', status: 'active' },
        { id: 'prepare', label: '准备需求理解', status: 'pending' },
      ],
    });

    try {
      const nextResult = await requestAiRecommendations({
        conversationId,
        messages: nextMessages,
        candidateTours: tours,
        activeFilters,
        searchQuery,
        aiConfig,
        preferenceMemory,
        previousResult: result,
        onProgress: (progress) => {
          if (requestVersionRef.current !== requestVersion) return;
          setProgressState(progress);
        },
      });
      if (requestVersionRef.current !== requestVersion) return;
      onResultChange(nextResult);
      setPreferenceMemory(nextResult.preferenceMemory || preferenceMemory);
      setMessages((current) => [
        ...current,
        createMessage('assistant', buildResultAssistantReply(nextResult, prompt)),
      ]);
      onFocusResults();
    } finally {
      if (requestVersionRef.current === requestVersion) {
        setLoading(false);
      }
    }
  }, [
    activeFilters,
    aiConfig,
    conversationId,
    loading,
    messages,
    onFocusResults,
    onResultChange,
    preferenceMemory,
    result,
    searchQuery,
    tours,
    toursReady,
  ]);

  useEffect(() => {
    if (!request || handledRequestIdRef.current === request.id) return;
    handledRequestIdRef.current = request.id;
    void submitPrompt(request.prompt);
  }, [request, submitPrompt]);

  const clearConversation = () => {
    requestVersionRef.current += 1;
    onResultChange(null);
    setPreferenceMemory(null);
    setProgressState(null);
    setExpandedStage(null);
    setDetailsOpen(false);
    setMessages([createMessage('assistant', '已清空上一轮结果和本地偏好记忆。你可以重新描述这次想怎么出行。')]);
    clearStoredAiChatState();
  };

  const saveSettings = () => {
    saveAiProviderConfig(aiConfig);
    setUseCustomAiConfig(true);
    setMessages((current) => [
      ...current,
      createMessage('assistant', 'AI 接口配置已保存。接下来会优先使用你的自定义地址、模型和 Key。'),
    ]);
  };

  const clearSettings = () => {
    clearAiProviderConfig();
    setAiConfig({});
    setUseCustomAiConfig(false);
    setShowApiKey(false);
    setMessages((current) => [
      ...current,
      createMessage('assistant', '已清除自定义 AI 配置，之后会回到默认配置或本地推荐。'),
    ]);
  };

  const hasAiActivity = Boolean(progressState || resultStatusMeta || messages.length > 1);
  const recommendedCount = countRecommendedItems(result);
  const compactStatusLabel = loading
    ? progressState?.label || '正在筛选'
    : hasResult
      ? `已置顶 ${recommendedCount} 条建议`
      : '描述需求，AI 帮你置顶';
  const compactStatusDetail = loading
    ? progressState?.detail || '正在结合班期、预算和线路信息。'
    : hasResult
      ? result?.summary || resultStatusMeta?.detail || '推荐线路已排到前面。'
      : '一句话说预算、天数、同行人和偏好就行。';

  if (!hasAiActivity) {
    return null;
  }

  return (
    <div className="mb-4 rounded-[24px] border border-stone-200/80 bg-white/88 p-3 shadow-sm backdrop-blur sm:p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-stone-950">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            AI 正在帮你排优先级
            {preferenceMemory && (
              <Badge className="rounded-full border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] text-stone-600 hover:bg-stone-50">
                已记住偏好
              </Badge>
            )}
            <span className="text-xs font-normal text-stone-400">
              推荐结果会置顶显示
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-stone-500 sm:text-sm">
            先用筛选器缩小范围；拿不准时，让 AI 把更合适的线路排到前面。
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-xl border-stone-200 bg-white px-3 text-xs text-stone-600 hover:bg-stone-50 hover:text-stone-900"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="h-3.5 w-3.5" />
          设置
        </Button>
      </div>

      <div className="mt-3 rounded-[20px] border border-stone-200 bg-[linear-gradient(180deg,rgba(250,250,249,0.94),rgba(255,255,255,0.96))] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-950">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-stone-700" />
              ) : hasResult ? (
                <CheckCircle2 className="h-4 w-4 text-stone-700" />
              ) : (
                <Sparkles className="h-4 w-4 text-stone-500" />
              )}
              {compactStatusLabel}
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-stone-600">{compactStatusDetail}</p>
          </div>
          <div className="flex items-center gap-2">
            {hasResult && (
              <Button
                type="button"
                variant="ghost"
                className="h-8 rounded-full px-2 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                onClick={clearConversation}
                disabled={loading}
              >
                清空
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="h-8 rounded-full px-2 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              onClick={() => setDetailsOpen((value) => !value)}
            >
              {detailsOpen ? '收起细节' : 'AI细节'}
            </Button>
            {resultStatusMeta && hasResult && !loading && (
              <Badge
                className={cn(
                  'rounded-full px-2.5 py-1 text-[11px]',
                  resultStatusMeta.mode === 'ai'
                    ? 'bg-stone-900 text-white hover:bg-stone-900'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-100',
                )}
              >
                {resultStatusMeta.mode === 'ai' ? 'AI完成' : '备用推荐'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {detailsOpen && (
        <div className="mt-3 space-y-3 rounded-[22px] border border-stone-200 bg-white/80 p-3">
          {progressState && (
            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-stone-700" />
                    ) : progressState.stage === 'fallback' ? (
                      <TriangleAlert className="h-4 w-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-stone-700" />
                    )}
                    {progressState.label}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{progressState.detail}</p>
                  {progressState.substeps?.length ? (
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-stone-600 transition-colors hover:text-stone-900"
                      onClick={() =>
                        setExpandedStage((current) => (current === progressState.stage ? null : progressState.stage))
                      }
                    >
                      {expandedStage === progressState.stage ? (
                        <>
                          收起本阶段进度
                          <ChevronUp className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          查看本阶段进度
                          <ChevronDown className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
                <Badge
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px]',
                    loading
                      ? 'bg-stone-200 text-stone-800 hover:bg-stone-200'
                      : progressState.stage === 'fallback'
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                        : 'bg-stone-900 text-white hover:bg-stone-900',
                  )}
                >
                  {loading ? '处理中' : progressState.stage === 'fallback' ? '备用方案' : '已完成'}
                </Badge>
              </div>

              <Progress value={progressState.progress} className="mt-3 h-2 bg-stone-200 [&_[data-slot=progress-indicator]]:bg-stone-800" />

              <div className="mt-3 grid gap-2 sm:grid-cols-5">
                {progressSteps.map((step, index) => {
                  const currentIndex = progressSteps.findIndex((item) => item.stage === progressState.stage);
                  const isDone = currentIndex > index || (!loading && progressState.stage === 'completed' && currentIndex >= index);
                  const isCurrent = progressState.stage === step.stage || (progressState.stage === 'fallback' && index === progressSteps.length - 1);

                  return (
                    <div
                      key={step.stage}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-xs transition-colors',
                        isCurrent
                          ? 'border-stone-300 bg-white text-stone-950'
                          : isDone
                            ? 'border-stone-200 bg-stone-50 text-stone-700'
                            : 'border-stone-200/80 bg-white text-stone-400',
                      )}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <span
                          className={cn(
                            'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                            isCurrent
                              ? 'bg-stone-900 text-white'
                              : isDone
                                ? 'bg-stone-700 text-white'
                                : 'bg-stone-100 text-stone-500',
                          )}
                        >
                          {index + 1}
                        </span>
                        {step.shortLabel}
                      </div>
                    </div>
                  );
                })}
              </div>

              {progressState.substeps?.length && expandedStage === progressState.stage ? (
                <div className="mt-3 rounded-xl border border-stone-200 bg-white px-3 py-3">
                  <div className="text-xs font-medium text-stone-900">当前阶段拆解</div>
                  <div className="mt-2 space-y-2">
                    {progressState.substeps.map((substep) => (
                      <div key={substep.id} className="flex items-start gap-2 text-xs text-stone-700">
                        <span
                          className={cn(
                            'mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-medium',
                            substep.status === 'done'
                              ? 'bg-stone-900 text-white'
                              : substep.status === 'active'
                                ? 'bg-stone-100 text-stone-900 ring-1 ring-stone-300'
                                : 'bg-white text-stone-500 ring-1 ring-stone-200',
                          )}
                        >
                          {substep.status === 'done' ? '✓' : substep.status === 'active' ? '进行中' : '待开始'}
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <div className="font-medium text-stone-800">{substep.label}</div>
                          {substep.detail ? <div className="mt-0.5 text-stone-500">{substep.detail}</div> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {resultStatusMeta && hasResult && !loading && (
            <div
              className={cn(
                'rounded-2xl border px-4 py-4 shadow-sm',
                resultStatusMeta.mode === 'ai'
                  ? 'border-stone-200 bg-stone-50 text-stone-950'
                  : 'border-amber-200 bg-amber-50 text-amber-950',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {resultStatusMeta.mode === 'ai' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <TriangleAlert className="h-4 w-4" />
                    )}
                    {resultStatusMeta.label}
                  </div>
                  <p className="mt-1 text-sm leading-6 opacity-90">{resultStatusMeta.detail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] text-white',
                      resultStatusMeta.mode === 'ai' ? 'bg-stone-900 hover:bg-stone-900' : 'bg-amber-700 hover:bg-amber-700',
                    )}
                  >
                    建议 {countRecommendedItems(result)}
                  </Badge>
                </div>
              </div>
              <p className="mt-3 rounded-xl bg-white/70 px-3 py-3 text-sm leading-6 text-stone-700">
                {result?.summary}
              </p>
            </div>
          )}

          {messages.length > 1 && (
            <div
              ref={scrollRef}
              className="max-h-56 space-y-3 overflow-y-auto rounded-2xl border border-stone-200 bg-stone-50/70 p-3"
            >
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
                <div className="hidden">
                  留空时使用构建环境里的公开默认值；前端 Key 会暴露，请只放低额度或个人可控 Key。
                </div>
                <div className="mt-1 text-xs leading-5 text-stone-500">
                  默认使用内置 AI 服务，不展示默认 API 的地址、模型或 Key；需要时可切换为自定义 OpenAI-compatible 接口。
                </div>
              </div>
              {useCustomAiConfig ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                    <div className="text-sm font-medium text-emerald-950">当前使用内置 AI 服务</div>
                    <div className="mt-1 text-xs leading-5 text-emerald-800">
                      默认 API 配置由站点统一提供，不在这里显示具体地址、模型或 Key。
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-xl border-stone-200 bg-white px-3 text-xs"
                      onClick={() => {
                        setAiConfig({});
                        setUseCustomAiConfig(true);
                        setShowApiKey(false);
                      }}
                    >
                      使用自定义接口
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
