import {
  ArrowRight,
  BookOpenText,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: (value?: string) => void;
}

export function Hero({ searchQuery, onSearchChange, onSearch }: HeroProps) {
  const quickDestinations = ['桂林', '三亚', '云南', '张家界', '西藏', '新疆'];

  return (
    <section className="px-4 pb-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] lg:items-stretch">
        <div className="surface-panel rise-in relative overflow-hidden rounded-[32px] border border-stone-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(251,250,247,0.95))] p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(214,211,209,0.30),transparent_65%)]" />
          <div className="absolute right-8 top-8 hidden h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(250,245,235,0.9),transparent_70%)] blur-2xl sm:block" />

          <div className="relative">
            <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.24em] text-stone-400">
              广州出发 · 旅行团数据库
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-stone-950 sm:text-5xl">
              先读懂线路差异，
              <span className="mt-2 block font-editorial text-[1.06em] font-medium text-stone-700">
                再决定哪一团更合适
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              聚合 7 个平台的公开旅行团数据，把价格、出发日期、单房差和平台来源整理成一页可读的清单。
            </p>

            <div className="mt-8 flex max-w-3xl flex-col gap-3 rounded-[24px] border border-stone-200/80 bg-white/92 p-3 shadow-sm sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                  placeholder="搜索目的地、主题或平台，例如：桂林、亲子、广之旅"
                  className="h-12 rounded-2xl border-0 bg-stone-50 pl-11 pr-4 text-sm text-stone-800 placeholder:text-stone-400 shadow-none focus-visible:ring-1"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch(searchQuery)}
                />
              </div>
              <Button
                size="lg"
                className="h-12 rounded-2xl bg-stone-900 px-5 text-sm font-medium text-white hover:bg-stone-800"
                onClick={() => onSearch(searchQuery)}
              >
                <Search className="mr-2 h-4 w-4" />
                查看结果
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
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
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="surface-panel rise-in rounded-[28px] border border-stone-200/80 bg-white/88 p-5 [animation-delay:80ms]">
            <BookOpenText className="h-5 w-5 text-stone-500" />
            <h2 className="mt-4 text-lg font-semibold text-stone-900">先看信息</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              不把花哨卖点堆在首屏，把真正影响决策的差异放在前面。
            </p>
          </div>

          <div className="surface-panel rise-in rounded-[28px] border border-stone-200/80 bg-white/88 p-5 [animation-delay:140ms]">
            <SlidersHorizontal className="h-5 w-5 text-stone-500" />
            <h2 className="mt-4 text-lg font-semibold text-stone-900">先粗筛，再细看</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              目的地、日期、预算常驻首屏，复杂条件折叠到后面，减少认知负担。
            </p>
          </div>

          <div className="surface-panel rise-in rounded-[28px] border border-stone-200/80 bg-white/88 p-5 [animation-delay:200ms]">
            <ShieldCheck className="h-5 w-5 text-stone-500" />
            <h2 className="mt-4 text-lg font-semibold text-stone-900">单房差说明</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              保留单人出行成本提示，让“便宜”这件事不只停留在首屏价格。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
