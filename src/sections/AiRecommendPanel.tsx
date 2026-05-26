import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, MessageCircle, RotateCcw, Send, Sparkles, X } from 'lucide-react';
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
  FilterState,
} from '@/types/tour';
import { requestAiRecommendations } from '@/lib/ai-recommendation';
import { cn } from '@/lib/utils';

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

function createMessage(role: AiRecommendationMessage['role'], content: string): AiRecommendationMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

export function AiRecommendPanel({
  tours,
  activeFilters,
  searchQuery,
  result,
  onResultChange,
  onFocusResults,
}: AiRecommendPanelProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AiRecommendationMessage[]>([
    createMessage('assistant', '告诉我预算、天数、想去哪里、同行人群或行程强度，我会先把合适线路挑出来。'),
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationId = useMemo(() => `ai-rec-${Date.now().toString(36)}`, []);
  const hasResult = Boolean(result && result.items.length > 0);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, open]);

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
      });
      onResultChange(nextResult);
      setMessages((current) => [
        ...current,
        createMessage(
          'assistant',
          `${nextResult.summary} 已为你置顶 ${nextResult.items.length} 条候选线路。`,
        ),
      ]);
      onFocusResults();
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    onResultChange(null);
    setMessages([
      createMessage('assistant', '已清空上一轮结果。你可以重新描述这次想怎么出行。'),
    ]);
    setInput('');
  };

  return (
    <>
      <div className="fixed bottom-5 left-5 z-50">
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'h-12 rounded-2xl px-4 shadow-[0_12px_32px_rgba(15,23,42,0.12)]',
            hasResult
              ? 'bg-emerald-700 text-white hover:bg-emerald-800'
              : 'bg-stone-900 text-white hover:bg-stone-800',
          )}
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">AI帮我选</span>
          {hasResult && (
            <Badge className="ml-1 rounded-full bg-white/18 px-2 py-0.5 text-[11px] text-white hover:bg-white/18">
              {result?.items.length}
            </Badge>
          )}
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 border-stone-200 bg-stone-50 p-0 sm:max-w-[440px]">
          <SheetHeader className="border-b border-stone-200 bg-white px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-stone-950">
              <Bot className="h-5 w-5 text-emerald-700" />
              AI 推荐预留
            </SheetTitle>
            <SheetDescription>
              当前使用本地预匹配，后续可替换为真实多轮 AI 推荐接口。
            </SheetDescription>
          </SheetHeader>

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                <div
                  className={cn(
                    'max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm',
                    message.role === 'user'
                      ? 'bg-stone-900 text-white'
                      : 'border border-stone-200 bg-white text-stone-700',
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-500 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在整理候选线路
                </div>
              </div>
            )}

            {hasResult && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <MessageCircle className="h-4 w-4" />
                  推荐结果已置顶
                </div>
                <p className="leading-6">{result?.summary}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 rounded-xl bg-emerald-700 px-3 text-xs hover:bg-emerald-800"
                    onClick={() => {
                      setOpen(false);
                      onFocusResults();
                    }}
                  >
                    查看线路
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-xl border-emerald-200 bg-white px-3 text-xs text-emerald-800 hover:bg-emerald-50"
                    onClick={clearConversation}
                  >
                    <X className="h-3.5 w-3.5" />
                    清空
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-stone-200 bg-white px-4 py-4">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
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
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-2">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="例如：4个人，带老人，预算3000左右，想去海边，行程轻松"
                className="max-h-32 min-h-20 resize-none border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                    submitPrompt();
                  }
                }}
              />
              <div className="flex items-center justify-between gap-3 px-1 pb-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 rounded-xl px-3 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                  onClick={clearConversation}
                  disabled={loading}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  重置
                </Button>
                <Button
                  type="button"
                  className="h-9 rounded-xl bg-stone-900 px-3 text-xs hover:bg-stone-800"
                  onClick={() => submitPrompt()}
                  disabled={loading || !input.trim()}
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  发送
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
