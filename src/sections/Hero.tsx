import { ArrowUpRight, MapPin, Search, Sparkles, X } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getPrimarySearchAction } from '@/lib/search-routing';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: (value?: string) => void;
  onAiSearch: (value?: string) => void;
  quickDestinations: string[];
  map?: ReactNode;
}

export function Hero({ searchQuery, onSearchChange, onSearch, onAiSearch, quickDestinations, map }: HeroProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handlePrimarySearch = () => {
    const action = getPrimarySearchAction(searchQuery);
    if (action === 'ai') {
      onAiSearch(searchQuery);
      return;
    }
    onSearch(searchQuery);
  };

  return (
    <section className="px-4 pb-2 pt-6 sm:px-6 sm:pt-10 lg:px-8" aria-labelledby="explore-title">
      <div className="hero-shell rise-in mx-auto max-w-7xl overflow-hidden rounded-[28px] p-5 sm:rounded-[36px] sm:p-9 lg:p-11">
        <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_370px]">
          <div className="min-w-0">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-900/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-orange-900">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-700" />广州出发 · 去发现下一站
            </div>
            <h1 id="explore-title" className="text-[34px] font-semibold leading-[1.22] tracking-tight text-stone-950 sm:text-5xl xl:text-[54px]">
              日常之外，<br />还有好多<span className="font-editorial text-orange-600">好去处。</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-stone-600 sm:text-base">
              周末走走，或是远行几天。把各个平台的线路放在一起，慢慢选，轻松比。
            </p>
            <form className="mt-6 rounded-[22px] border border-white bg-white p-2 shadow-[0_12px_36px_rgba(28,25,23,0.08)] sm:mt-7" role="search" aria-label="查找旅行线路" onSubmit={(event) => { event.preventDefault(); handlePrimarySearch(); }}>
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-800" />
                <Input ref={inputRef} aria-label="目的地或旅行需求" aria-describedby="search-help" type="search" enterKeyHint="search" placeholder="例如：帮我找同时带温泉和沙滩的团，预算800内" className="h-14 rounded-2xl border-0 bg-stone-50/80 pl-11 pr-11 text-sm shadow-none placeholder:text-stone-500 focus-visible:ring-orange-700/30" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} />
                {searchQuery && <button type="button" aria-label="清空搜索" className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-200/60" onClick={() => { onSearchChange(''); inputRef.current?.focus(); }}><X className="h-4 w-4" /></button>}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button type="submit" size="lg" className="h-12 rounded-[15px] bg-orange-600 text-white shadow-none hover:bg-orange-700"><Search className="mr-1 h-4 w-4" />搜索</Button>
                <Button type="button" size="lg" disabled={!searchQuery.trim()} className="h-12 rounded-[15px] border border-orange-200 bg-orange-50 text-orange-900 shadow-none hover:bg-orange-100 disabled:opacity-50" onClick={() => onAiSearch(searchQuery)}><Sparkles className="mr-1 h-4 w-4" />AI 找团</Button>
              </div>
            </form>
            <p id="search-help" className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-stone-500"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-600" />搜地名直接查线路；有预算、天数等要求，也可以交给 AI。</p>
            <div className="mobile-chip-scroll mt-5 flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap">
              <span className="shrink-0 pr-1 text-xs text-stone-500">想去哪里</span>
              {quickDestinations.map((dest) => <button key={dest} type="button" aria-pressed={searchQuery.trim() === dest} onClick={() => { onSearchChange(dest); onSearch(dest); }} className={cn('flex min-h-10 shrink-0 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors', searchQuery.trim() === dest ? 'border-orange-800 bg-orange-800 text-white' : 'border-stone-300/70 bg-white/70 text-stone-700 hover:border-orange-700 hover:text-orange-900')}><MapPin className="h-3 w-3" />{dest}<ArrowUpRight className="h-3 w-3 opacity-50" /></button>)}
            </div>
          </div>
          <aside className="min-w-0 self-stretch lg:flex lg:flex-col lg:justify-center" aria-label="在地图上探索目的地">
            <div className="mb-3 flex items-center justify-between px-1"><span className="text-xs font-semibold tracking-[0.14em] text-orange-900">换个角度，发现目的地</span><span className="text-[10px] tracking-[0.18em] text-stone-500">EXPLORE THE MAP</span></div>
            {map}
            <div className="mt-4 flex items-center justify-between border-t border-orange-900/10 px-1 pt-4 text-xs text-stone-600"><span>多平台线路聚合</span><span className="h-1 w-1 rounded-full bg-stone-300" /><span>价格 · 班期 · 上车点</span></div>
          </aside>
        </div>
      </div>
    </section>
  );
}
