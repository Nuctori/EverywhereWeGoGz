// AI 推荐流完整生命周期：输入→requestAiRecommendations→进度回调→结果落地→本地缓存回放 + fallback 降级机制
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Search,
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
  AiRecommendationItem,
  AiRecommendationMessage,
  AiRecommendationProgress,
  AiRecommendationResult,
  AiProviderConfig,
  AiPreferenceMemory,
  FilterState,
} from '@/types/tour';
import {
  AI_RECOMMENDATION_WARM_BATCH_SIZE,
  clearAiProviderConfig,
  getAiRecommendationWarmPiece,
  getStoredAiProviderConfig,
  isAiRecommendationPoolWarm,
  requestAiRecommendations,
  saveAiProviderConfig,
  warmAiRecommendationBatch,
} from '@/lib/ai-recommendation';
import {
  clearStoredAiChatState,
  clearStoredAiProgress,
  readStoredAiChatState,
  readStoredAiProgress,
  saveStoredAiChatState,
  saveStoredAiProgress,
  subscribeStoredAiProgress,
} from '@/lib/ai-chat-storage';
import type { StoredAiProgress } from '@/lib/ai-chat-storage';
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
  // 搜索阶段（请求已发出、首条结果还没落地）的轮次 id：每轮换新，用来清掉上一轮的进度与对话。
  searchingVersion: number;
  onResultChange: (result: AiRecommendationResult | null) => void;
  onFocusResults: () => void;
  // 流式增量：模型还在生成时把已完整的条目回传给列表先渲染。
  onPartialItems?: (items: AiRecommendationItem[]) => void;
}

// 首屏「AI 正在找团」占位卡片，列表相关滚动定位也认这个 id。
export const AI_PENDING_CARD_ID = 'ai-pending-card';

const MAX_PERSISTED_MESSAGES = 40;
const scheduleIdleWork = (callback: () => void) => {
  if (typeof window === 'undefined') return undefined;

  const idleRequest = window.requestIdleCallback?.bind(window);
  if (idleRequest) {
    const id = idleRequest(callback, { timeout: 900 });
    return () => window.cancelIdleCallback?.(id);
  }

  const id = window.setTimeout(callback, 80);
  return () => window.clearTimeout(id);
};

// 页面是否不可见（切后台/被其它应用遮挡）。SSR 与老浏览器按"可见"处理。
const isPageHidden = () =>
  typeof document !== 'undefined' && document.visibilityState === 'hidden';

const waitForNextPaint = () =>  new Promise<void>((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    // 后台/被遮挡窗口的 rAF 会被浏览器冻结（visibilityState 仍是 visible）：
    // 必须有 setTimeout 兜底，否则 AI 请求会在等待首帧处永久挂起，
    // 表现为“已收到需求”卡死、结果被清空、输入框禁用。
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    window.requestAnimationFrame(() => window.setTimeout(settle, 0));
    window.setTimeout(settle, 200);
  });

// AI 推荐用到的派生数据（搜索语料/原语/路线图集）是懒构建的，首次用到要在
// 主线程一次性算完几百毫秒，正好压在点「AI 帮我挑」的那一帧上。这里在浏览器
// 空闲期逐片预热（每片约 100 条，实测 <10ms），片之间隔一会儿再要下一段空闲：
// 用户这时候既没点击也没在输入，主线程随时能被他抢回去。
//
// 这里的间隔和截止时间必须让"全部预热完"能在用户真正点击前完成：
// 之前 700ms × 65 片 ≈ 46s，而截止只有 20s，预热永远只能覆盖 45%，
// 剩下的 3591 条在点击那一帧冷算（约 350ms），就成了"点 AI 帮我挑卡很久"。
// 现在每片间隔 16ms（约一帧），65 片约 1.7s 跑完，截止放到 30s 兜底。
const WARM_PIECE_GAP_MS = 16;
// 兜底上限：完全抢不到空闲时间时，别把预热任务无限挂着。
const WARM_DEADLINE_MS = 30_000;
const useAiRecommendationWarmup = (candidateTours: AiRecommendationCandidate[]) => {
  useEffect(() => {
    if (candidateTours.length === 0 || isAiRecommendationPoolWarm(candidateTours)) return;

    let cancelled = false;
    let stopIdle: (() => void) | undefined;
    let gapTimer: number | undefined;
    let pieceIndex = 0;
    const startedAt = Date.now();
    const pieceCount = Math.ceil(candidateTours.length / AI_RECOMMENDATION_WARM_BATCH_SIZE);

    const clearPending = () => {
      stopIdle?.();
      stopIdle = undefined;
      if (gapTimer !== undefined) {
        window.clearTimeout(gapTimer);
        gapTimer = undefined;
      }
    };

    const schedulePiece = () => {
      stopIdle = scheduleIdleWork(() => {
        stopIdle = undefined;
        if (cancelled) return;
        // 页面在后台：不继续算。手机上继续跑只会白烧 CPU/电量，而且后台
        // 定时器本来就会被冻结，等回到前台再接着走（不丢进度，pieceIndex 保留）。
        if (isPageHidden()) return;

        const piece = getAiRecommendationWarmPiece(candidateTours, pieceIndex);
        pieceIndex += 1;
        try {
          warmAiRecommendationBatch(piece);
        } catch {
          // 预热失败不影响任何功能：真正的调用会照常自己算出来。
          return;
        }

        if (cancelled || pieceIndex >= pieceCount) return;
        if (Date.now() - startedAt > WARM_DEADLINE_MS) return;
        gapTimer = window.setTimeout(() => {
          gapTimer = undefined;
          if (!cancelled) schedulePiece();
        }, WARM_PIECE_GAP_MS);
      });
    };

    // 回到前台且还没预热完时立刻续跑（不必等下一段空闲，用户此刻正看着面板）。
    const onVisibilityChange = () => {
      if (cancelled || isPageHidden()) return;
      if (pieceIndex >= pieceCount) return;
      if (stopIdle || gapTimer !== undefined) return;
      schedulePiece();
    };

    if (!isPageHidden()) schedulePiece();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearPending();
    };
  }, [candidateTours]);
};

// 进度步骤定义，对应 AiRecommendationProgress.stage，面板进度条按此顺序推进
const REFINEMENT_MODE_LABELS: Record<string, string> = {
  new_search: '新搜索',
  refine_previous: '追问纠偏',
  broaden: '扩展范围',
  replace_destination: '替换目的地',
};
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

// 流式增量阶段在进度条上归到「生成推荐」；独立成项会让高亮跳到一个不存在的步骤。
function resolveProgressStepIndex(stage: AiRecommendationProgress['stage']) {
  return progressSteps.findIndex((item) => item.stage === (stage === 'streaming-items' ? 'ranking' : stage));
}

// 识别天气/气温类查询，返回特殊引导文案；非天气查询返回 null
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

// 根据用户输入类型拼接 AI 回复文案：追问轮强调是在上一轮基础上调整，避免
// 每轮都读起来像一次全新回答；区分疑问句 vs 陈述句。
function buildResultAssistantReply(prompt: string, isFollowUpTurn = false) {
  const questionLead = getQuestionLead(prompt);
  if (questionLead) {
    return questionLead;
  }

  const isQuestion = /[？?]$/.test(prompt) || /^(你能|你会|可以|能不能|有没有|怎么|如何|为啥|为什么)/.test(prompt);
  if (isFollowUpTurn) {
    return isQuestion
      ? '可以，我结合你前面几轮的条件一起重新判断了；上面的摘要是这一轮的结论，下面继续保留对话。'
      : '已在你前面条件的基础上按这轮新要求重新排好了；结论看上面的摘要，下面继续保留对话。';
  }
  if (isQuestion) {
    return '可以，我先按这个问题帮你判断一下。上面的摘要里是这轮推荐的结论，下面我继续保留对话。';
  }

  return '我先按你这轮条件排好了，结论看上面的摘要；下面这块继续保留对话记录。';
}

function createMessage(role: AiRecommendationMessage['role'], content: string): AiRecommendationMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

// 创建 AI 助手的初始欢迎消息
function createInitialMessage() {
  return createMessage('assistant', '告诉我预算、天数、目的地和同行人，我会先帮你把合适线路筛出来。');
}

function createConversationId() {
  return `ai-rec-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}

function countRecommendedItems(result: AiRecommendationResult | null) {
  // 详细位有 reason，简要位靠 tier 识别；两者都属于 AI 推荐位。
  return result?.items.filter((item) => Boolean(item.reason) || item.recommendationTier === 'ai-brief').length ?? 0;
}

// 判断结果来源：ai-api（AI 正常完成）vs fallback（本地替补），返回对应状态元信息
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
  searchingVersion,
  onResultChange,
  onFocusResults,
  onPartialItems,
}: AiRecommendPanelProps) {
  const storedChatState = useMemo(() => readStoredAiChatState(), []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiConfig, setAiConfig] = useState<Partial<AiProviderConfig>>(() => getStoredAiProviderConfig());
  const [useCustomAiConfig, setUseCustomAiConfig] = useState(
    () => Object.keys(getStoredAiProviderConfig()).length > 0,
  );
  const [followUpInput, setFollowUpInput] = useState(storedChatState.input || '');
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
  // 流式思维链实时区：默认折叠只显示字数/秒数，展开后随增量自动滚到尾部。
  const [liveThinkingOpen, setLiveThinkingOpen] = useState(false);
  // 对话记录默认折叠：它只是历史轮次的回执，长期占着 224px 却几乎没人回看。
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [interruptedPrompt, setInterruptedPrompt] = useState<string | null>(storedChatState.pendingPrompt || null);
  const liveThinkingScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const storageSaveCleanupRef = useRef<ReturnType<typeof scheduleIdleWork>>(undefined);
  const skipInitialSaveRef = useRef(Boolean(storedChatState.result));
  const didRestoreStoredResultRef = useRef(false);
  const requestVersionRef = useRef(0);
  // 本轮在途请求的取消器：取消/重开/卸载时 abort，真正掐断底层 fetch。
  // 此前只有 requestVersionRef 做"丢弃结果"，请求本身仍在跑完——
  // 手机上连点几次就是几个 35s 的在途请求叠加，越点越慢。
  const requestAbortRef = useRef<AbortController | null>(null);
  const handledRequestIdRef = useRef<number | null>(null);
  // 本标签页的标识：用于区分"自己写的进度"和"别的标签页写的进度"，
  // 避免自己读到自己的回声后覆盖本页真实的进度状态。
  const tabIdRef = useRef(`tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const [remoteProgress, setRemoteProgress] = useState<StoredAiProgress | null>(null);
  const conversationId = useMemo(
    () => storedChatState.conversationId || createConversationId(),
    [storedChatState.conversationId],
  );
  const hasResult = Boolean(result && result.items.length > 0);
  const toursReady = !toursLoading && tours.length > 0;
  const resultStatusMeta = getResultStatusMeta(result);
  // 挂在所有渲染分支之前：空闲预热是纯优化，且不受下面任何条件渲染影响。
  useAiRecommendationWarmup(tours);
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

    storageSaveCleanupRef.current?.();
    // The active request owns its synchronous checkpoint; an idle render of
    // the previous result must not overwrite its prompt or validated preview.
    if (requestAbortRef.current) return;
    storageSaveCleanupRef.current = scheduleIdleWork(() => {
      saveStoredAiChatState({
        conversationId,
        input: followUpInput,
        messages,
        result,
        preferenceMemory,
        pendingPrompt: interruptedPrompt,
      }, MAX_PERSISTED_MESSAGES);
      storageSaveCleanupRef.current = undefined;
    });
  }, [conversationId, followUpInput, interruptedPrompt, messages, preferenceMemory, result]);

  useEffect(() => () => storageSaveCleanupRef.current?.(), []);

  // 跨标签页进度同步：另一个页面发起 AI 时，这里也能看到"正在跑到哪"。
  // 只认别的标签页写的快照（ownerId 不同于本页），并且过期快照直接忽略。
  useEffect(() => {
    const apply = (incoming: StoredAiProgress | null) => {
      setRemoteProgress(incoming && incoming.ownerId !== tabIdRef.current ? incoming : null);
    };
    apply(readStoredAiProgress());
    return subscribeStoredAiProgress(apply);
  }, []);

  // 远端进度只在别的标签页写进度时刷新，秒数会停住；这里每秒推一次 tick，
  // 让"已进行 N 秒"真的在走。没有远端进度时不起定时器。
  const [remoteTick, setRemoteTick] = useState(0);
  useEffect(() => {
    if (!remoteProgress) return;
    const timer = window.setInterval(() => {
      setRemoteTick((current) => current + 1);
      const stored = readStoredAiProgress();
      setRemoteProgress(stored?.ownerId !== tabIdRef.current ? stored : null);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remoteProgress]);

  useEffect(() => {
    if (!detailsOpen) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [detailsOpen, messages]);

  useEffect(() => {
    if (clearVersion === 0) return;

    requestVersionRef.current += 1;
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;
    onPartialItems?.([]);
    setLoading(false);
    setInterruptedPrompt(null);
    setPreferenceMemory(null);
    setProgressState(null);
    setExpandedStage(null);
    setLiveThinkingOpen(false);
    setDetailsOpen(false);
    setFollowUpInput('');
    setMessages([createInitialMessage()]);
  }, [clearVersion]);

  // 新一轮搜索开始：上一轮结果已被清掉，不能留着旧的进度/对话说「已完成」。
  useEffect(() => {
    if (searchingVersion === 0) return;

    setPreferenceMemory(null);
    setProgressState(null);
    setExpandedStage(null);
    setLiveThinkingOpen(false);
    setDetailsOpen(false);
    setFollowUpInput('');
    setMessages([createInitialMessage()]);
  }, [searchingVersion]);

  useEffect(() => {
    if (!progressState?.substeps?.length) {
      setExpandedStage(null);
      return;
    }

    // 默认收起：阶段拆解只在用户主动展开时展开。此前每个阶段切换都会自动展开，
    // 面板高度随阶段来回抽动，一屏几乎全被进度信息占满。
    setExpandedStage((current) => (current === progressState.stage ? current : null));
  }, [progressState]);

  // 展开「AI 调节」只是看进度，不是追加新的追问，输入框留到收起之后再出现。
  // 手机上它和步骤条、阶段拆解叠在一起，高度会从 216px 涨到 434px。
  const showComposer = !loading;

  useEffect(() => {
    if (!liveThinkingOpen) return;
    const container = liveThinkingScrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [liveThinkingOpen, progressState?.liveThinking?.excerpt]);

  const submitPrompt = useCallback(async (rawPrompt: string, options?: { preserveResult?: boolean; replaceRunning?: boolean }) => {
    const prompt = rawPrompt.trim();
    if (!prompt || (loading && !options?.replaceRunning) || !toursReady || (requestAbortRef.current && !options?.replaceRunning)) return;
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    const preserveResult = options?.preserveResult ?? false;
    // 与 ai-recommendation 的 isFollowUpConversation 同口径：本轮之前已有用户提问即为追问轮。
    const isFollowUpTurn = messages.some((message) => message.role === 'user');

    const userMessage = createMessage('user', prompt);
    const nextMessages = preserveResult
      ? [...messages, userMessage]
      : [createInitialMessage(), userMessage];
    setMessages(nextMessages);
    setLoading(true);
    setSummaryOpen(false);
    setDetailsOpen(false);
    onPartialItems?.([]);
    // 新一轮开始前先掐掉上一轮：用户重开/改成新条件时，旧请求的结果已经无意义，
    // 让它继续跑只会占连接、烧流量，并在后台继续消耗 Worker 配额。
    requestAbortRef.current?.abort();
    const abortController = new AbortController();
    requestAbortRef.current = abortController;
    setInterruptedPrompt(null);
    let retainedResult = result;
    let backgroundInterrupted = false;
    const persistRequest = (pendingPrompt: string | null) => {
      storageSaveCleanupRef.current?.();
      storageSaveCleanupRef.current = undefined;
      saveStoredAiChatState({ conversationId, messages: nextMessages, result: retainedResult, preferenceMemory, pendingPrompt }, MAX_PERSISTED_MESSAGES);
    };
    const suspendRequest = () => {
      if (requestVersionRef.current !== requestVersion) return;
      backgroundInterrupted = true;
      setInterruptedPrompt(prompt);
      persistRequest(prompt);
      abortController.abort();
    };
    const onVisibility = () => { if (isPageHidden()) suspendRequest(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', suspendRequest);
    persistRequest(prompt);
    const startedAt = Date.now();
    // 把"这一轮开始了"写进 storage，另一个标签页打开时就知道这边正在跑。
    saveStoredAiProgress({
      ownerId: tabIdRef.current,
      version: requestVersion,
      prompt,
      startedAt,
      progress: {
        stage: 'queued',
        label: '已收到需求',
        detail: '正在开始本次处理。',
        progress: 8,
      },
      running: true,
    });
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
    // Keep the last readable result until this request has a replacement.
    // 只保留用户已经展开的细节区，不再每次提交都强行展开进度细节：
    // 那样点一次「AI 帮我挑」会在同一屏里展开/收起两套内容（先展开细节，
    // 随后 searchingVersion 又把细节和对话全部重置），看起来像页面在抽动。
    setFollowUpInput('');

    try {
      await waitForNextPaint();
      if (requestVersionRef.current !== requestVersion) return;

      // 用户点得比空闲预热快时（页面刚打开就点），池子可能还没预热完。
      // 此时进度条已经先画出来了，再一次性把剩下的补完，比让主线程在
      // 后面的排序/建模里零散地卡顿更好：这一下是可预期的、且已经有反馈在转。
      if (!isAiRecommendationPoolWarm(tours)) {
        const pieceCount = Math.ceil(tours.length / AI_RECOMMENDATION_WARM_BATCH_SIZE);
        for (let pieceIndex = 0; pieceIndex < pieceCount; pieceIndex += 1) {
          if (requestVersionRef.current !== requestVersion) return;
          try {
            warmAiRecommendationBatch(getAiRecommendationWarmPiece(tours, pieceIndex));
          } catch {
            // 预热是纯优化，失败就让真正的调用自己算。
            break;
          }
          await waitForNextPaint();
        }
      }

      const nextResult = await requestAiRecommendations({
        conversationId,
        messages: nextMessages,
        candidateTours: tours,
        activeFilters,
        searchQuery: request?.searchQuery || searchQuery,
        aiConfig,
        preferenceMemory,
        previousResult: preserveResult ? result : null,
        signal: abortController.signal,
        onProgress: (progress) => {
          if (requestVersionRef.current !== requestVersion) return;
          setProgressState((previous) => {
            // 正文增量与推荐条目来自两路回调，不能互相覆盖：否则状态标题
            // 在「思考」/「已挑出」之间跳动，输出统计也每出一条就消失。
            if (previous?.stage === 'streaming-items' && progress.stage === 'ranking' && !progress.partialItems) {
              return { ...previous, liveThinking: progress.liveThinking ?? previous.liveThinking };
            }
            if (progress.stage === 'streaming-items') {
              return { ...progress, liveThinking: previous?.liveThinking };
            }
            return progress;
          });
          // 流式增量：模型还在逐条写 items 时，把已完整的部分交给列表先渲染。
          // 只要有一条就先摆出来，后续条数增长时继续刷新。
          if (progress.partialItems) {
            onPartialItems?.(progress.partialItems);
            if (progress.partialItems.length > 0) {
              retainedResult = {
                conversationId, summary: '', items: progress.partialItems,
                generatedAt: new Date().toISOString(), source: 'ai-api',
                status: { mode: 'local-only', label: '已保留部分推荐', detail: '这些条目已校验，完整推荐尚未完成。' },
              };
              persistRequest(prompt);
            }
          }
          // 节流后写进 storage：另一个标签页据此实时看到阶段和"已跑多少秒"。
          // liveThinking 的思维链摘录不跨标签页同步——那是本页的调试信息，
          // 体积大且频繁变化，会把 storage 写入变成性能问题。
          saveStoredAiProgress({
            ownerId: tabIdRef.current,
            version: requestVersion,
            prompt,
            startedAt,
            progress: {
              stage: progress.stage,
              label: progress.label,
              detail: progress.detail,
              progress: progress.progress,
            },
            running: true,
          });
        },
      });
      if (requestVersionRef.current !== requestVersion) return;
      if (abortController.signal.aborted) return;
      setInterruptedPrompt(null);
      // A failed refinement must not overwrite an earlier readable result.
      if (nextResult.status?.mode === 'fallback') {
        setInterruptedPrompt(prompt);
        retainedResult = retainedResult?.items.length ? retainedResult : nextResult;
        onResultChange(retainedResult);
        persistRequest(prompt);
      } else {
        retainedResult = nextResult;
        onResultChange(nextResult);
        persistRequest(null);
      }
      // 正式结果落地，撤掉流式增量渲染，避免两套数据同时生效。
      onPartialItems?.([]);
      setPreferenceMemory(nextResult.preferenceMemory || preferenceMemory);
      setMessages((current) => [
        ...current,
        createMessage('assistant', buildResultAssistantReply(prompt, isFollowUpTurn)),
      ]);
      onFocusResults();
    } catch (error) {
      // 取消是正常路径（用户点取消、重开、切页卸载），不是失败：
      // 不弹错误、不改结果，静默收尾即可。其余异常保持原有冒泡行为。
      if (requestVersionRef.current === requestVersion && error instanceof DOMException && error.name === 'AbortError' && !backgroundInterrupted) {
        if (retainedResult) onResultChange(retainedResult);
        setProgressState({ stage: 'fallback', label: '已取消查找', detail: '已保留现有内容。', progress: 0 });
        persistRequest(null);
      }
      if (requestVersionRef.current === requestVersion && !(error instanceof DOMException && error.name === 'AbortError')) {
        setProgressState({ stage: 'fallback', label: '本次查找未完成', detail: '请重试，或调整条件后再查找。', progress: 0 });
      }
    } finally {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', suspendRequest);
      if (backgroundInterrupted && requestVersionRef.current === requestVersion) {
        if (retainedResult) onResultChange(retainedResult);
        setProgressState({ stage: 'fallback', label: '查找已暂停', detail: '已保留现有内容，回到前台后可重试。', progress: 0 });
      }
      if (requestVersionRef.current === requestVersion) {
        setLoading(false);
        onPartialItems?.([]);
      }
      // 本轮结束（含被取消/顶掉）：释放取消器，避免旧 controller 一直被持有。
      if (requestAbortRef.current === abortController) requestAbortRef.current = null;
      // 无论成功、降级还是被新一轮顶掉，都要把"进行中"从 storage 撤下，
      // 否则另一个标签页会一直显示这边在跑（直到 AI_PROGRESS_STALE_MS 兜底）。
      const storedProgress = readStoredAiProgress();
      if (storedProgress?.ownerId === tabIdRef.current && storedProgress.version === requestVersion) {
        clearStoredAiProgress();
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
    onPartialItems,
    preferenceMemory,
    request,
    result,
    searchQuery,
    tours,
    toursReady,
  ]);

  useEffect(() => {
    if (!request || handledRequestIdRef.current === request.id) return;
    if (!toursReady) return;
    handledRequestIdRef.current = request.id;
    // 结果的清空与进度重置由上面的 searchingVersion 统一处理，这里只负责发起请求。
    void submitPrompt(request.prompt, { preserveResult: false, replaceRunning: true });
  }, [request, submitPrompt, toursReady]);

  // 组件卸载时掐断在途请求：SPA 切页后没有任何消费者，让它跑完纯属浪费。
  useEffect(() => () => {
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;
  }, []);

  // A suspended network request cannot be resumed reliably by mobile browsers.
  // Persist its readable content and offer an explicit retry, never duplicate it.
  useEffect(() => {
    const refreshRemote = () => {
      if (isPageHidden()) return;
      const stored = readStoredAiProgress();
      setRemoteProgress(stored?.ownerId !== tabIdRef.current ? stored : null);
    };
    document.addEventListener('visibilitychange', refreshRemote);
    return () => document.removeEventListener('visibilitychange', refreshRemote);
  }, []);

  const clearConversation = () => {
    requestVersionRef.current += 1;
    // 真正掐断在途请求：只重置 React 状态的话，fetch 会一路跑到超时，
    // 手机上一次点击就能留下一个 35s 的在途请求。
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;
    setLoading(false);
    onPartialItems?.([]);
    setSummaryOpen(false);
    setInterruptedPrompt(null);
    onResultChange(null);
    setPreferenceMemory(null);
    setProgressState(null);
    setExpandedStage(null);
    setDetailsOpen(false);
    setFollowUpInput('');
    setMessages([createMessage('assistant', '已清空上一轮结果和本地偏好记忆。你可以重新描述这次想怎么出行。')]);
    clearStoredAiChatState();
    if (readStoredAiProgress()?.ownerId === tabIdRef.current) clearStoredAiProgress();
  };

// 保存自定义 AI 接口配置到 localStorage
  const saveSettings = () => {
    saveAiProviderConfig(aiConfig);
    setUseCustomAiConfig(true);
    setMessages((current) => [
      ...current,
      createMessage('assistant', 'AI 接口配置已保存。接下来会优先使用你的自定义地址、模型和 Key。'),
    ]);
  };

// 清除自定义 AI 接口配置，恢复默认内置服务
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

  const hasAiActivity = Boolean(interruptedPrompt || progressState || resultStatusMeta || messages.length > 1);
  const searching = Boolean(request && handledRequestIdRef.current !== request.id);
  const searchingDetail = progressState?.detail || '正在理解这句需求，马上开始筛线路。';
  const recommendedCount = countRecommendedItems(result);
  // 别的标签页正在跑的那一轮：本页自己没有在进行中的请求时，把它显示出来，
  // 让人知道"那边正在跑"，而不是看起来什么都没发生。
  const remoteRunning = !loading && !searching ? remoteProgress : null;
  // remoteTick 每秒自增，只为让下面的秒数跟着时间重算（它本身不参与计算）。
  const remoteElapsedSeconds = remoteRunning?.startedAt
    ? Math.max(0, Math.round((Date.now() - remoteRunning.startedAt) / 1000))
    : 0;
  void remoteTick;
  const compactStatusLabel = interruptedPrompt && !loading
    ? '查找未完成，内容已保留'
    : loading
    ? progressState?.label || '正在筛选'
    : remoteRunning
      ? remoteRunning.progress?.label || '另一个页面正在找团'
      : searching
        ? '正在按这句话找团'
        : hasResult
          ? `已置顶 ${recommendedCount} 条建议`
          : '描述需求，AI 帮你置顶';
  const compactStatusDetail = interruptedPrompt && !loading
    ? '可继续查看已保留的内容，或重新查找。'
    : loading
    ? progressState?.detail || '正在结合班期、预算和线路信息。'
    : remoteRunning
      ? [
          remoteRunning.prompt ? `另一个页面正在处理：${remoteRunning.prompt}` : '另一个页面正在处理这一轮需求。',
          remoteElapsedSeconds > 0 ? `已进行 ${remoteElapsedSeconds} 秒` : '',
        ].filter(Boolean).join(' · ')
      : searching
        ? searchingDetail
        : hasResult
          ? result?.summary || resultStatusMeta?.detail || '推荐线路已排到前面。'
          : '一句话说预算、天数、同行人和偏好就行。';
  // 对话记录去掉首条欢迎语：它不是一轮真实对话，只是初始引导。
  // 也要过滤掉没有 assistant 内容的半截状态（请求进行中只插了用户消息）。
  const transcript = messages.slice(1).some((message) => message.role === 'assistant' && message.content.trim())
    ? messages.slice(1)
    : [];
  const followUpPlaceholder = hasResult
    ? '在这里接着细调，比如：预算压到600内，优先海边，别太赶'
    : '补充一点条件也行，比如：带温泉、沙滩，周末短线';

  // remoteRunning 也要算作"有活动"：否则另一个标签页在跑时，本页会直接渲染 null，
  // 同步过来的进度根本没有机会显示出来。
  if (!hasAiActivity && !searching && !remoteRunning) {
    return null;
  }

  if (!hasAiActivity) {
    // 搜索阶段先给一张轻量占位卡：列表保持原样、不清空，等首条进度/结果落地后再换成完整面板，
    // 避免「点了 AI 找团之后一片空白」。
    return (
      <div
        id={AI_PENDING_CARD_ID}
        role="status"
        aria-live="polite"
        className="mb-4 rounded-[24px] border border-orange-100/80 bg-white/90 p-3 shadow-[0_16px_40px_rgba(28,25,23,0.05)] backdrop-blur sm:p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-950">
              <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
              {remoteRunning && !request ? '另一个页面正在按这句话找团' : 'AI 正在按这句话找团'}
            </div>
            <p className="mt-1 line-clamp-2 break-words text-sm leading-6 text-stone-600">
              {remoteRunning && !request ? compactStatusDetail : searchingDetail}
            </p>
            <p className="mt-1 hidden break-words text-xs leading-5 text-stone-500 sm:block">
              <span className="hidden sm:inline">已记下：</span><span className="text-stone-700">{request?.prompt || remoteRunning?.prompt}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-full px-3 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              onClick={remoteRunning ? () => setRemoteProgress(null) : clearConversation}
            >
              {remoteRunning ? '隐藏提示' : '取消这次查找'}
            </Button>
            <Badge className="rounded-full bg-stone-200 px-2.5 py-1 text-[11px] text-stone-800 hover:bg-stone-200">
              找团中
            </Badge>
          </div>
        </div>
        <p className="mt-2 hidden text-xs leading-5 text-stone-400 sm:block">
          下面的线路先保持不动，等 AI 选出建议后再置顶；想换条件可以直接取消重来。
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-[24px] border border-orange-100/80 bg-white/90 p-3 shadow-[0_16px_40px_rgba(28,25,23,0.05)] backdrop-blur sm:p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-stone-950">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-700 ring-1 ring-orange-200">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            AI 帮你挑
            {preferenceMemory && (
              <Badge className="hidden rounded-full border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] text-stone-600 hover:bg-stone-50 sm:inline-flex">
                已记住偏好
              </Badge>
            )}
            <span className="hidden text-xs font-normal text-stone-400 sm:inline">
              {searching ? '正在重新挑选，列表先保持原样' : '推荐结果会置顶显示'}
            </span>
          </div>
          {/* 指南只在没有结果时出现。有结果后这一段就是在复读下面的摘要，
              还把「已置顶 N 条建议」挤到第二屏。 */}
          {!hasResult && (
            <p className="mt-1 hidden max-w-2xl text-xs leading-5 text-stone-500 sm:block sm:text-sm">
              AI 会先理解你想要的旅行体验，再比较线路；预算、偏好和取舍都会一起考虑。
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl border-orange-100 bg-orange-50 px-3 text-xs text-orange-700 hover:border-orange-200 hover:bg-orange-100 hover:text-orange-800"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="h-3.5 w-3.5" />
          调整偏好
        </Button>
      </div>

      <div className="mt-3 rounded-[20px] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,247,237,0.82),rgba(255,255,255,0.96))] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-950">
              {loading || remoteRunning ? (
                <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
              ) : searching ? (
                <Search className="h-4 w-4 text-orange-600" />
              ) : hasResult ? (
                <CheckCircle2 className="h-4 w-4 text-orange-600" />
              ) : (
                <Sparkles className="h-4 w-4 text-orange-600" />
              )}
              {compactStatusLabel}
            </div>
            <p className={cn('mt-1 break-words text-sm leading-6 text-stone-600', !summaryOpen && 'line-clamp-2')}>{compactStatusDetail}</p>
            {hasResult && !loading && result?.summary && (
              <button type="button" className="min-h-11 text-xs text-stone-600 underline underline-offset-4" aria-expanded={summaryOpen} onClick={() => setSummaryOpen((open) => !open)}>
                {summaryOpen ? '收起摘要' : '展开摘要'}
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {loading && (
              <Button type="button" variant="ghost" className="h-11 rounded-full px-3 text-xs" onClick={() => requestAbortRef.current?.abort()}>取消这次查找</Button>
            )}
            {hasResult && (
              <Button
                type="button"
                variant="ghost"
                className="h-11 rounded-full px-3 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                onClick={clearConversation}
                disabled={loading}
              >
                清空
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-full px-3 text-xs text-stone-500 hover:bg-orange-50 hover:text-orange-700"
              aria-expanded={detailsOpen}
              aria-controls="ai-recommendation-details"
              onClick={() => setDetailsOpen((value) => !value)}
            >
              {detailsOpen ? '收起详情' : '查看详情'}
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
        {loading && (
          <div className="mt-2" role="status" aria-live="polite" aria-atomic="true">
            <span className="sr-only">{compactStatusLabel}</span>
            <Progress aria-label="推荐生成进度" value={progressState?.progress ?? 8} className="h-1 bg-orange-100 [&_[data-slot=progress-indicator]]:bg-orange-500" />
          </div>
        )}
      </div>

              {!loading && result?.clarification && (
                <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50/80 px-3 py-3 text-sm text-stone-800">
                  <div className="mt-1 leading-6">{result.clarification.question}</div>
                  {result.clarification.reason && (
                    <div className="mt-1 text-xs leading-5 text-stone-500">{result.clarification.reason}</div>
                  )}
                  {result.clarification.options?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.clarification.options.map((option) => (
                        <Button key={option} type="button" variant="outline" className="min-h-11 whitespace-normal rounded-xl bg-white text-stone-700" onClick={() => void submitPrompt(option, { preserveResult: true })}>
                          {option}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

      {interruptedPrompt && !loading && (
        <Button type="button" variant="outline" className="mt-3 min-h-11 rounded-xl" onClick={() => void submitPrompt(interruptedPrompt, { preserveResult: true })}>重新查找</Button>
      )}

      {detailsOpen && (
        <div id="ai-recommendation-details" className="mt-3 space-y-3 rounded-[22px] border border-stone-200 bg-white/80 p-3">
          {/* 还没有结果时这块就是"生成过程"，要露出来；有结果后它只是一次
              已完成的调用回执，默认收着，想看得自己展开。 */}
          {progressState && (!hasResult || loading) && (
            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3 sm:p-4">
              {/* 标题卡上已经写着同一句状态时，这里不再重复一遍标题，
                  只留进度条和步骤——展开细节的用途是看"走到哪一步"，不是复读状态。 */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={cn('flex items-center gap-2 text-sm font-semibold', progressState.label === compactStatusLabel && 'hidden')}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-stone-700" />
                    ) : progressState.stage === 'fallback' ? (
                      <TriangleAlert className="h-4 w-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-stone-700" />
                    )}
                    {progressState.label}
                  </div>
                  {/* 结果已落地后，这句 detail（"已生成 N 条建议，并展示 M 条线路"）
                      是生成过程回执，摘要本身在下面的结果卡里。 */}
                  {progressState.detail &&
                  !hasResult &&
                  progressState.detail.trim() !== compactStatusDetail.trim() ? (
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-stone-600">{progressState.detail}</p>
                  ) : null}
                  {progressState.liveThinking ? (
                    <div className="mt-2 rounded-xl border border-orange-100 bg-orange-50/60 px-3 py-2">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 text-left text-xs font-medium text-stone-700"
                        onClick={() => setLiveThinkingOpen((open) => !open)}
                      >
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-orange-500" />
                          <span className="truncate">
                            {progressState.liveThinking.writingAnswer ? '正在生成结果' : '模型思考中'}
                            {' · '}
                            已输出 {progressState.liveThinking.writingAnswer ? progressState.liveThinking.outputChars ?? 0 : progressState.liveThinking.chars} 字
                            {' · '}
                            {Math.max(1, Math.round(progressState.liveThinking.elapsedMs / 1000))} 秒
                          </span>
                        </span>
                        {liveThinkingOpen ? (
                          <ChevronUp className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                        )}
                      </button>
                      {liveThinkingOpen ? (
                        <div
                          ref={liveThinkingScrollRef}
                          className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-white/80 px-2.5 py-2 text-xs leading-5 text-stone-500"
                        >
                          {progressState.liveThinking.excerpt || '…'}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
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

              {/* 桌面把进度条和步骤并排（原来条在上、步骤在下，白占一行高度）；窄屏保持堆叠。 */}
              <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(120px,1fr)_2.2fr] sm:items-center">
              <Progress value={progressState.progress} className="h-2 bg-orange-100 [&_[data-slot=progress-indicator]]:bg-orange-500" />

              {/* 窄屏横排单行：5 个步骤各占一行会把面板撑高三四行，这里改成可横滑的紧凑条。 */}
              <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap sm:grid sm:grid-cols-5 sm:gap-2 sm:overflow-visible">
                {progressSteps.map((step, index) => {
                  const currentIndex = resolveProgressStepIndex(progressState.stage);
                  const isDone = currentIndex > index || (!loading && progressState.stage === 'completed' && currentIndex >= index);
                  const isCurrent = resolveProgressStepIndex(progressState.stage) === index || (progressState.stage === 'fallback' && index === progressSteps.length - 1);

                  return (
                    <div
                      key={step.stage}
                      className={cn(
                        'shrink-0 rounded-xl border px-2.5 py-1.5 text-xs transition-colors sm:px-3 sm:py-2',
                        isCurrent
                          ? 'border-orange-200 bg-orange-50 text-stone-950'
                          : isDone
                            ? 'border-orange-100 bg-white text-stone-700'
                            : 'border-stone-200/80 bg-white text-stone-400',
                      )}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <span
                          className={cn(
                            'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                            isCurrent
                              ? 'bg-orange-600 text-white'
                              : isDone
                                ? 'bg-orange-400 text-white'
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
                    {countRecommendedItems(result) > 0 ? `建议 ${countRecommendedItems(result)}` : `本地候选 ${result?.items.length ?? 0}`}
                  </Badge>
                </div>
              </div>
              {(result?.assumptions?.length || result?.tradeoffs?.length) ? (
                <div className="mt-3 grid gap-2 text-xs leading-5 text-stone-600 sm:grid-cols-2">
                  {result.assumptions?.length ? (
                    <div className="rounded-xl bg-stone-50 px-3 py-2">
                      <div className="font-medium text-stone-800">本轮理解</div>
                      <div className="mt-1">{result.assumptions.join('；')}</div>
                    </div>
                  ) : null}
                  {result.tradeoffs?.length ? (
                    <div className="rounded-xl bg-stone-50 px-3 py-2">
                      <div className="font-medium text-stone-800">主要取舍</div>
                      <div className="mt-1">{result.tradeoffs.join('；')}</div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {/* 下面四块都是给"想核对这轮怎么来的"人准备的诊断信息：
                  多轮轨迹、模型/缓存命中、思维链、本轮理解与取舍。
                  默认收进一个折叠区，避免把结果卡撑成 600px 的技术报告。 */}
              {(result?.refinementMode || result?.searchRounds?.length || result?.usage?.promptTokens || result?.reasoning || result?.assumptions?.length || result?.tradeoffs?.length) ? (
                <details className="mt-3 border-t border-stone-200 pt-2">
                  <summary className="cursor-pointer text-xs font-medium text-stone-600">这轮是怎么排的</summary>
                  <div className="mt-2 space-y-2">
              {(result?.refinementMode || result?.searchRounds?.length || result?.usage?.promptTokens) ? (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-600">
                  {result?.refinementMode ? (
                    <Badge className="rounded-full bg-stone-100 text-stone-700 hover:bg-stone-100">
                      多轮模式：{REFINEMENT_MODE_LABELS[result.refinementMode] ?? result.refinementMode}
                    </Badge>
                  ) : null}
                  {result?.searchRounds?.length ? (
                    <Badge className="rounded-full bg-stone-100 text-stone-700 hover:bg-stone-100">
                      多轮查找 {result.searchRounds.length} 轮
                    </Badge>
                  ) : null}
                  {result?.usage && result.usage.promptTokens && result.usage.promptTokens > 0 ? (() => {
                    const promptTokens = result.usage.promptTokens;
                    const cachedPromptTokens = result.usage.cachedPromptTokens ?? 0;
                    return (
                      <Badge className="rounded-full bg-stone-100 text-stone-700 hover:bg-stone-100">
                        {cachedPromptTokens
                          ? `前缀缓存命中 ${Math.round((cachedPromptTokens / promptTokens) * 100)}%（${cachedPromptTokens}/${promptTokens} tok）`
                          : `前缀缓存未命中（${promptTokens} tok）`}
                      </Badge>
                    );
                  })() : null}
                  {result?.usage?.reasoningTokens && result.usage.reasoningTokens > 0 ? (
                    <Badge className="rounded-full bg-stone-100 text-stone-700 hover:bg-stone-100">
                      思考 {result.usage.reasoningTokens} tok
                    </Badge>
                  ) : null}
                  {result?.usage?.model ? (
                    <Badge className="rounded-full bg-stone-100 text-stone-700 hover:bg-stone-100">{result.usage.model}</Badge>
                  ) : null}
                </div>
              ) : null}
              {result?.searchRounds?.length ? (
                <details className="mt-2 rounded-xl bg-stone-50 px-3 py-2 text-xs leading-5 text-stone-600">
                  <summary className="cursor-pointer font-medium text-stone-800">多轮查找轨迹</summary>
                  <ol className="mt-1 list-decimal space-y-1 pl-4">
                    {result.searchRounds.map((round, index) => (
                      <li key={`${round.query}-${index}`}>
                        <span className="font-medium text-stone-800">{round.query}</span>
                        —— 命中 {round.hitCount} 条
                        {round.alignedCount !== undefined ? `、贴合需求 ${round.alignedCount} 条` : ''}
                        {round.topTitles?.length ? (
                          <div className="mt-0.5 text-stone-500">参考：{round.topTitles.join('、')}</div>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </details>
              ) : null}
              {result?.reasoning ? (
                <details className="rounded-xl bg-white/80 px-3 py-2 text-xs leading-5 text-stone-600">
                  <summary className="cursor-pointer font-medium text-stone-800">AI 思考过程（思维链）</summary>
                  <div className="mt-1 max-h-64 overflow-y-auto whitespace-pre-wrap">{result.reasoning}</div>
                </details>
              ) : null}
                  </div>
                </details>
              ) : null}
            </div>
          )}

          {/* 对话区只在有 assistant 回复可读时才出现。请求进行中只有刚插进去的
              用户消息，渲染出来就是一条贴着右边、左侧大片空白的孤立气泡，
              看着像一张空白卡片；此时面板该显示的是进度，不是复读用户输入。
              默认折叠成一行，要看历史再展开。 */}
          {transcript.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 px-3 py-2">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 text-left text-xs font-medium text-stone-600"
                aria-expanded={transcriptOpen}
                onClick={() => setTranscriptOpen((open) => !open)}
              >
                <span>对话记录 · {transcript.length} 条</span>
                {transcriptOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {transcriptOpen && (
            <div
              ref={scrollRef}
              className="mt-2 max-h-56 space-y-3 overflow-y-auto p-1"
            >
              {transcript.map((message) => (
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

        </div>
      )}

          {showComposer ? (
          <form
            className="mt-3 flex gap-2 sm:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              void submitPrompt(followUpInput, { preserveResult: hasResult });
            }}
          >
            <Input
              aria-label="补充旅行条件"
              value={followUpInput}
              onChange={(event) => setFollowUpInput(event.target.value)}
              placeholder={followUpPlaceholder}
              className="h-11 flex-1 rounded-xl border-stone-200 bg-stone-50 text-sm"
              disabled={loading || !toursReady}
            />
            <Button
              type="submit"
              className="h-11 rounded-xl bg-stone-900 px-4 text-sm hover:bg-stone-800 sm:min-w-[104px]"
              disabled={loading || !followUpInput.trim() || !toursReady}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  继续细调
                </>
              )}
            </Button>
          </form>
          ) : null}

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
