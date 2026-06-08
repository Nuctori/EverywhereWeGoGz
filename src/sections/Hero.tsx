import {
  ArrowRight,
  MapPin,
  Search,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: (value?: string) => void;
  onAiSearch: (value?: string) => void;
  quickDestinations: string[];
}

export function Hero({ searchQuery, onSearchChange, onSearch, onAiSearch, quickDestinations }: HeroProps) {
  const logoSrc = `${import.meta.env.BASE_URL}brand/laoguang-logo-full.jpg`;

  return (
    <section className="px-4 pb-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="surface-panel rise-in relative overflow-hidden rounded-[32px] border border-stone-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(251,250,247,0.95))] p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(214,211,209,0.30),transparent_65%)]" />
          <div className="absolute right-8 top-8 hidden h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(250,245,235,0.9),transparent_70%)] blur-2xl sm:block" />

          <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="max-w-4xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-stone-400">
                老广去边度 · 广州出发
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-stone-950 sm:text-5xl">
                先看班期和预算，再选适合的团。
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">
                聚合多平台跟团线路。同一个输入框，既能搜目的地，也能直接让 AI 按预算、天数和同行人帮你置顶。
              </p>

              <div className="mt-8 max-w-3xl rounded-[26px] border border-stone-200/80 bg-white/92 p-2 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      placeholder="搜目的地/主题，或直接说：3天内 2000内 带老人"
                      className="h-12 rounded-[20px] border-0 bg-stone-50 pl-11 pr-4 text-sm text-stone-800 placeholder:text-stone-400 shadow-none focus-visible:ring-1"
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && onSearch(searchQuery)}
                    />
                  </div>
                  <div className="flex gap-2 sm:shrink-0">
                    <Button
                      size="lg"
                      className="h-12 flex-1 rounded-[20px] bg-stone-900 px-5 text-sm font-medium text-white hover:bg-stone-800 sm:flex-none"
                      onClick={() => onSearch(searchQuery)}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      查看结果
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12 flex-1 rounded-[20px] border-stone-200 bg-[#f7f2e8] px-4 text-sm font-medium text-stone-900 hover:border-stone-300 hover:bg-[#efe6d3] sm:flex-none"
                      onClick={() => onAiSearch(searchQuery)}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      AI帮我选
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 px-2 pb-1 pt-2 text-xs text-stone-400">
                  <span>普通搜索看全部匹配</span>
                  <span className="hidden text-stone-300 sm:inline">/</span>
                  <span>AI 会用同一句话把更合适的团排前面</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="self-center pr-1 text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
                  热门目的地
                </span>
                {quickDestinations.map((dest) => (
                  <button
                    key={dest}
                    onClick={() => {
                      onSearchChange(dest);
                      onSearch(dest);
                    }}
                    className="rounded-full border border-stone-200 bg-white/80 px-3.5 py-2 text-sm text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900"
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </div>

            <img
              src={logoSrc}
              alt=""
              aria-hidden="true"
              className="hidden w-full max-w-[260px] justify-self-end object-contain lg:block"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
