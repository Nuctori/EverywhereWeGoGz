import { ArrowRight, CalendarDays, MapPin, Search, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getPrimarySearchAction, decideSearchAction } from '@/lib/search-routing';

// 主按钮判定等用户停手再切，避免打字途中按钮身份来回跳。
const HERO_ROUTE_DEBOUNCE_MS = 350;

export interface QuickIntent {
  label: string;
  detail: string;
  query: string;
}

interface HeroProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: (value?: string) => void;
  onAiSearch: (value?: string) => void;
  quickIntents: QuickIntent[];
  map?: ReactNode;
}

export function Hero({ searchQuery, onSearchChange, onSearch, onAiSearch, quickIntents, map }: HeroProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // 一个输入框，两个按钮不再让用户自己猜：这里先判断这句话更像"地名"还是"带预算天数的需求"，
  // 直接把按钮语义写出来，并让主按钮自动切换成对应动作。
  // 只在停顿后判定（防抖）：逐字判定会让主按钮在打字途中反复改名、并在"搜索线路/AI
  // 搜索"之间来回跳，顺手把第二个按钮禁用掉——用户还没打完，两个按钮已经换了两次身份。
  const [settledQuery, setSettledQuery] = useState(searchQuery);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettledQuery(searchQuery), HERO_ROUTE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);
  const route = useMemo(() => decideSearchAction(settledQuery), [settledQuery]);
  const primaryIsAi = route.action === 'ai';
  const trimmed = searchQuery.trim();
  // 第二个按钮不再因为"主按钮已经会走 AI"就被禁用：两个按钮都能点，
  // 只是主按钮会根据这句话自动变成更合适的那个动作。
  const aiButtonDisabled = !trimmed;

  const handlePrimarySearch = () => {
    const action = getPrimarySearchAction(searchQuery);
    if (action === 'ai') {
      onAiSearch(searchQuery);
      return;
    }
    onSearch(searchQuery);
  };

  return (
    <section className="px-4 pb-2 pt-5 sm:px-6 sm:pt-7 lg:px-8" aria-labelledby="explore-title">
      <div className="hero-shell rise-in mx-auto max-w-7xl overflow-hidden rounded-[28px] p-5 sm:rounded-[32px] sm:p-8 lg:p-9">
        <div className="relative grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-900/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-orange-900">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-700" />广州出发 · 8 个平台线路放在一起比
            </div>
            <h1 id="explore-title" className="text-[30px] font-semibold leading-[1.2] tracking-tight text-stone-950 sm:text-[40px] xl:text-[46px]">
              日常之外，<br />还有好多<span className="font-editorial text-orange-600">好去处。</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-7 text-stone-600 sm:text-[15px]">
              不熟的地方也能看明白：哪天能走、多少钱、包不包住、从哪上车。
            </p>

            <form
              className="mt-5 rounded-[22px] border border-white bg-white p-2 shadow-[0_12px_36px_rgba(28,25,23,0.08)]"
              role="search"
              aria-label="查找旅行线路"
              onSubmit={(event) => {
                event.preventDefault();
                handlePrimarySearch();
              }}
            >
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-800" />
                <Input
                  ref={inputRef}
                  aria-label="目的地或旅行需求"
                  aria-describedby="search-help"
                  type="search"
                  enterKeyHint="search"
                  placeholder="地名直接搜，比如「南昆山」；也可以直说要求，比如「两天内、800 块以内、带温泉」"
                  className="h-14 rounded-2xl border-0 bg-stone-50/80 pl-11 pr-11 text-sm shadow-none placeholder:text-stone-500 focus-visible:ring-orange-700/30"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="清空搜索"
                    className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-200/60"
                    onClick={() => {
                      onSearchChange('');
                      inputRef.current?.focus();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* 竖排时 flex-1 作用在交叉轴上等于 auto，按钮高度会塌回文字高度（实测 20px），
                  所以必须自带 shrink-0 和明确的最小高度。 */}
              <div className="mt-2 flex flex-col gap-2 sm:flex-row [&>button]:shrink-0">
                <Button
                  type="submit"
                  size="lg"
                  className={cn(
                    'h-12 min-h-12 flex-1 rounded-[15px] shadow-none',
                    primaryIsAi
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-stone-900 text-white hover:bg-stone-800',
                  )}
                >
                  {primaryIsAi ? (
                    <>
                      <Sparkles className="mr-1 h-4 w-4" />按需求找团
                    </>
                  ) : (
                    <>
                      <Search className="mr-1 h-4 w-4" />搜索线路
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  disabled={aiButtonDisabled}
                  className="h-12 min-h-12 flex-1 rounded-[15px] border border-orange-200 bg-orange-50 text-orange-900 shadow-none hover:bg-orange-100 disabled:opacity-50"
                  onClick={() => onAiSearch(searchQuery)}
                >
                  <Sparkles className="mr-1 h-4 w-4" />AI 帮我挑
                </Button>
              </div>
              <p id="search-help" className="mt-2 px-1 text-xs leading-5 text-stone-500">
                写地名就搜索，写清楚预算天数主按钮会变成「按需求找团」；想直接让 AI 挑就点「AI 帮我挑」。
              </p>
            </form>

            <div className="mobile-chip-scroll mt-4 flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap">
              <span className="shrink-0 pr-1 text-xs text-stone-500">没想好？</span>
              {quickIntents.map((intent) => (
                <button
                  key={intent.label}
                  type="button"
                  title={intent.detail}
                  onClick={() => {
                    onSearchChange(intent.query);
                    onSearch(intent.query);
                  }}
                  className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-stone-300/70 bg-white/70 px-3 text-xs font-medium text-stone-700 transition-colors hover:border-orange-700 hover:text-orange-900"
                >
                  {intent.label}
                  <ArrowRight className="h-3 w-3 opacity-40" />
                </button>
              ))}
            </div>
          </div>

          <aside className="min-w-0 self-stretch lg:flex lg:flex-col lg:justify-center" aria-label="在地图上探索目的地">
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-900">
                <MapPin className="h-3.5 w-3.5" />不知道去哪？看地图挑一片
              </span>
              <span className="flex items-center gap-1 text-[10px] tracking-[0.12em] text-stone-500">
                <CalendarDays className="h-3 w-3" />点地点看对应团
              </span>
            </div>
            {map}
          </aside>
        </div>
      </div>
    </section>
  );
}
