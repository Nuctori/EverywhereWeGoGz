import {
  ArrowRight,
  MapPin,
  Search,
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
      <div className="mx-auto max-w-7xl">
        <div className="surface-panel rise-in relative overflow-hidden rounded-[32px] border border-stone-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(251,250,247,0.95))] p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(214,211,209,0.30),transparent_65%)]" />
          <div className="absolute right-8 top-8 hidden h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(250,245,235,0.9),transparent_70%)] blur-2xl sm:block" />

          <div className="relative max-w-4xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-stone-400">
              广州出发 · 旅行团数据库
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-stone-950 sm:text-5xl">
              看线路，直接筛。
            </h1>

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
      </div>
    </section>
  );
}
