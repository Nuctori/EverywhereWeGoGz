import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mic,
  RotateCcw,
  Send,
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
import { Textarea } from '@/components/ui/textarea';
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
  getAiProviderConfig,
  requestAiRecommendations,
  saveAiProviderConfig,
} from '@/lib/ai-recommendation';
import { AI_CHAT_STORAGE_KEY, clearStoredAiChatState } from '@/lib/ai-chat-storage';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface AiRecommendPanelProps {
  tours: AiRecommendationCandidate[];
  activeFilters: FilterState;
  searchQuery: string;
  result: AiRecommendationResult | null;
  clearVersion: number;
  onResultChange: (result: AiRecommendationResult | null) => void;
  onFocusResults: () => void;
}

const starterPrompts = [
  '3天内出发，预算2000以内，想轻松一点',
  '亲子出游，5天左右，别太赶',
  '想去云南或者桂林，看看自然风景',
];

const MAX_PERSISTED_MESSAGES = 40;
const LONG_PRESS_DURATION_MS = 320;

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
  resultIndex: number;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error?: string;
  message?: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: ((event: Event) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

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

interface AiChatState {
  conversationId: string;
  input: string;
  messages: AiRecommendationMessage[];
  result: AiRecommendationResult | null;
  preferenceMemory: AiPreferenceMemory | null;
}

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

  if (result.source === 'ai-api') {
    return `我先按你的条件筛了一轮，${result.summary}`;
  }

  return `我先给你一版可用结果，${result.summary}`;
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

function mergeRecognizedText(base: string, transcript: string) {
  const trimmedBase = base.trimEnd();
  const trimmedTranscript = transcript.trim();

  if (!trimmedBase) return trimmedTranscript;
  if (!trimmedTranscript) return trimmedBase;

  const shouldJoinWithoutSpace =
    /[\u4e00-\u9fff]$/.test(trimmedBase) || /^[，。！？；：,.!?;:]/.test(trimmedTranscript);

  return shouldJoinWithoutSpace
    ? `${trimmedBase}${trimmedTranscript}`
    : `${trimmedBase} ${trimmedTranscript}`;
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

function getResultStatusMeta(result: AiRecommendationResult | null) {
  if (!result) return null;

  if (result.status) return result.status;

  if (result.source === 'ai-api') {
    return {
      mode: 'ai' as const,
      label: 'AI 已完成推荐',
      detail: `已生成 ${result.items.length} 条推荐线路，并按匹配度置顶。`,
    };
  }

  return {
    mode: 'fallback' as const,
    label: '本次使用备用推荐结果',
    detail: `AI 没有顺利完成时，先返回了 ${result.items.length} 条本地规则筛选结果。`,
  };
}

export function AiRecommendPanel({
  tours,
  activeFilters,
  searchQuery,
  result,
  clearVersion,
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
  const [progressState, setProgressState] = useState<AiRecommendationProgress | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechHint, setSpeechHint] = useState('正在检测浏览器语音能力...');
  const [speechPressing, setSpeechPressing] = useState(false);
  const [speechListening, setSpeechListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipInitialSaveRef = useRef(Boolean(storedChatState.result));
  const didRestoreStoredResultRef = useRef(false);
  const speechRecognitionCtorRef = useRef<BrowserSpeechRecognitionConstructor | null>(null);
  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const speechPressTimerRef = useRef<number | null>(null);
  const speechBaseInputRef = useRef('');
  const conversationId = useMemo(
    () => storedChatState.conversationId || createConversationId(),
    [storedChatState.conversationId],
  );
  const hasResult = Boolean(result && result.items.length > 0);
  const resultStatusMeta = getResultStatusMeta(result);

  const clearSpeechPressTimer = () => {
    if (speechPressTimerRef.current !== null) {
      window.clearTimeout(speechPressTimerRef.current);
      speechPressTimerRef.current = null;
    }
  };

  const stopSpeechRecognition = (abort = false) => {
    clearSpeechPressTimer();
    setSpeechPressing(false);

    const recognition = speechRecognitionRef.current;
    if (!recognition) return;

    try {
      if (abort) {
        recognition.abort();
      } else {
        recognition.stop();
      }
    } catch {
      setSpeechListening(false);
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognitionCtor = speechRecognitionCtorRef.current;
    clearSpeechPressTimer();

    if (!SpeechRecognitionCtor || speechListening || loading) return;

    try {
      const recognition = new SpeechRecognitionCtor();
      speechRecognitionRef.current = recognition;
      speechBaseInputRef.current = input;
      setSpeechError(null);
      setSpeechHint('请按住说话，松开后结束语音转文字');

      recognition.lang = 'zh-CN';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let index = 0; index < event.results.length; index += 1) {
          const segment = event.results[index]?.[0]?.transcript?.trim();
          if (!segment) continue;

          if (event.results[index].isFinal) {
            finalTranscript += segment;
          } else {
            interimTranscript += segment;
          }
        }

        const nextTranscript = `${finalTranscript}${interimTranscript}`.trim();
        setInput(mergeRecognizedText(speechBaseInputRef.current, nextTranscript));
      };
      recognition.onerror = (event) => {
        const nextError =
          event.error === 'not-allowed'
            ? '语音权限未开启，请允许浏览器访问麦克风。'
            : event.error === 'no-speech'
              ? '没有识别到语音，可以再试一次。'
              : event.error === 'audio-capture'
                ? '没有检测到可用麦克风。'
                : '语音转文字启动失败，请稍后重试。';

        setSpeechError(nextError);
        setSpeechHint('当前无法继续语音输入');
        setSpeechListening(false);
      };
      recognition.onend = () => {
        speechRecognitionRef.current = null;
        setSpeechListening(false);
        setSpeechPressing(false);
        setSpeechHint(
          speechRecognitionCtorRef.current
            ? '浏览器支持语音输入，长按麦克风开始，松开结束'
            : '当前浏览器不支持 Web Speech API 语音转文字',
        );
      };

      recognition.start();
      setSpeechListening(true);
    } catch {
      speechRecognitionRef.current = null;
      setSpeechListening(false);
      setSpeechError('当前浏览器无法启动语音识别。');
      setSpeechHint('当前浏览器不支持或未开放语音输入');
    }
  };

  const handleSpeechPressStart = () => {
    if (!speechRecognitionCtorRef.current || loading) return;

    setSpeechError(null);
    setSpeechPressing(true);
    setSpeechHint('继续按住即可进入语音转文字');
    clearSpeechPressTimer();
    speechPressTimerRef.current = window.setTimeout(() => {
      startSpeechRecognition();
    }, LONG_PRESS_DURATION_MS);
  };

  const handleSpeechPressEnd = () => {
    clearSpeechPressTimer();

    if (speechListening) {
      stopSpeechRecognition();
      return;
    }

    setSpeechPressing(false);
    setSpeechHint(
      speechRecognitionCtorRef.current
        ? '浏览器支持语音输入，长按麦克风开始，松开结束'
        : '当前浏览器不支持 Web Speech API 语音转文字',
    );
  };

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;

    speechRecognitionCtorRef.current = SpeechRecognitionCtor;
    setSpeechSupported(Boolean(SpeechRecognitionCtor));
    setSpeechHint(
      SpeechRecognitionCtor
        ? '浏览器支持语音输入，长按麦克风开始，松开结束'
        : '当前浏览器不支持 Web Speech API 语音转文字',
    );
  }, []);

  useEffect(() => {
    if (!speechPressing && !speechListening) return;

    const handlePointerRelease = () => {
      handleSpeechPressEnd();
    };

    window.addEventListener('pointerup', handlePointerRelease);
    window.addEventListener('pointercancel', handlePointerRelease);

    return () => {
      window.removeEventListener('pointerup', handlePointerRelease);
      window.removeEventListener('pointercancel', handlePointerRelease);
    };
  }, [speechListening, speechPressing]);

  useEffect(() => {
    return () => {
      clearSpeechPressTimer();
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort();
        } catch {
          // noop
        }
      }
    };
  }, []);

  useEffect(() => {
    if (clearVersion === 0) return;

    stopSpeechRecognition(true);
    setLoading(false);
    setInput('');
    setPreferenceMemory(null);
    setProgressState(null);
    setMessages([createInitialMessage()]);
  }, [clearVersion]);

  const submitPrompt = async (rawPrompt?: string) => {
    const prompt = (rawPrompt ?? input).trim();
    if (!prompt || loading) return;

    const userMessage = createMessage('user', prompt);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setProgressState({
      stage: 'queued',
      label: '已收到需求',
      detail: '正在开始本次处理。',
      progress: 8,
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
        onProgress: (progress) => setProgressState(progress),
      });
      onResultChange(nextResult);
      setPreferenceMemory(nextResult.preferenceMemory || preferenceMemory);
      setMessages((current) => [
        ...current,
        createMessage('assistant', buildResultAssistantReply(nextResult, prompt)),
      ]);
      onFocusResults();
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    onResultChange(null);
    setPreferenceMemory(null);
    setProgressState(null);
    setMessages([createMessage('assistant', '已清空上一轮结果和本地偏好记忆。你可以重新描述这次想怎么出行。')]);
    setInput('');
    clearStoredAiChatState();
  };

  const saveSettings = () => {
    saveAiProviderConfig(aiConfig);
    setMessages((current) => [
      ...current,
      createMessage('assistant', 'AI 接口配置已保存。接下来会优先使用你的自定义地址、模型和 Key。'),
    ]);
  };

  const clearSettings = () => {
    clearAiProviderConfig();
    setAiConfig({});
    setMessages((current) => [
      ...current,
      createMessage('assistant', '已清除自定义 AI 配置，之后会回到默认配置或本地推荐。'),
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
            直接描述出发时间、天数、预算、同行人和偏好；AI 会结合班期、天气、季节和线路信息置顶推荐。
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
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className={cn(
                'h-9 rounded-xl border-stone-200 bg-white px-3 text-xs',
                speechListening
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-50'
                  : speechSupported
                    ? 'text-stone-700 hover:bg-stone-50'
                    : 'text-stone-400 hover:bg-white',
              )}
              disabled={!speechSupported || loading}
              onPointerDown={handleSpeechPressStart}
              onPointerUp={handleSpeechPressEnd}
              onPointerLeave={handleSpeechPressEnd}
              onPointerCancel={handleSpeechPressEnd}
            >
              <Mic className={cn('h-3.5 w-3.5', speechListening && 'animate-pulse')} />
              {speechListening ? '松开结束' : speechPressing ? '继续按住' : '长按语音'}
            </Button>
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
        <div className="px-1 pb-1 text-[11px] leading-5">
          <p className={cn('text-stone-500', speechListening && 'text-emerald-700')}>{speechHint}</p>
          {speechError && <p className="text-rose-600">{speechError}</p>}
        </div>
      </div>

      {(progressState || resultStatusMeta || messages.length > 1) && (
        <div className="mt-4 space-y-3">
          {progressState && (
            <div className="rounded-2xl border border-emerald-200 bg-white/90 p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                    ) : progressState.stage === 'fallback' ? (
                      <TriangleAlert className="h-4 w-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    )}
                    {progressState.label}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{progressState.detail}</p>
                </div>
                <Badge
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px]',
                    loading
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                      : progressState.stage === 'fallback'
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                        : 'bg-emerald-700 text-white hover:bg-emerald-700',
                  )}
                >
                  {loading ? '处理中' : progressState.stage === 'fallback' ? '备用方案' : '已完成'}
                </Badge>
              </div>

              <Progress value={progressState.progress} className="mt-3 h-2 bg-emerald-100 [&_[data-slot=progress-indicator]]:bg-emerald-600" />

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
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
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
                              ? 'bg-emerald-600 text-white'
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
            </div>
          )}

          {resultStatusMeta && hasResult && !loading && (
            <div
              className={cn(
                'rounded-2xl border px-4 py-4 shadow-sm',
                resultStatusMeta.mode === 'ai'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
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
                      resultStatusMeta.mode === 'ai' ? 'bg-emerald-700 hover:bg-emerald-700' : 'bg-amber-700 hover:bg-amber-700',
                    )}
                  >
                    置顶 {result?.items.length}
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
              className="max-h-64 space-y-3 overflow-y-auto rounded-2xl border border-stone-200 bg-white/80 p-3"
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
