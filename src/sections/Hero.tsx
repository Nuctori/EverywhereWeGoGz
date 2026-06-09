import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Map,
  MapPin,
  Search,
  Sparkles,
  WalletCards,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: (value?: string) => void;
  onAiSearch: (value?: string) => void;
  quickDestinations: string[];
}

const destinationIntents: Record<string, { label: string; hint: string }> = {
  广东: { label: '广东周边', hint: '短途省心' },
  云南: { label: '云南避暑', hint: '5-7 天游' },
  三亚: { label: '三亚亲子', hint: '海岛慢游' },
  北京: { label: '北京文化游', hint: '长辈友好' },
  四川: { label: '四川慢游', hint: '山水美食' },
  新疆: { label: '新疆长线', hint: '深度环线' },
};

const planningStats = [
  { label: '预算', value: '3000 内', icon: WalletCards },
  { label: '班期', value: '60 条', icon: CalendarDays },
  { label: '来源', value: '8 平台', icon: Map },
];

const planningSteps = [
  { title: '先筛出可选线路', detail: '目的地、天数、出发地先对上' },
  { title: '再比较价格和班期', detail: '预算接近、日期合适排前面' },
  { title: '最后把合适的团置顶', detail: '不用自己一页页翻' },
];

export function Hero({ searchQuery, onSearchChange, onSearch, onAiSearch, quickDestinations }: HeroProps) {
  const logoSrc = `${import.meta.env.BASE_URL}brand/laoguang-logo-full.jpg`;

  const handlePrimarySearch = () => {
    const query = searchQuery.trim();
    if (query) {
      onAiSearch(query);
      return;
    }

    onSearch(searchQuery);
  };

  return (
    <section className="px-4 pb-4 pt-5 sm:px-6 sm:pt-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="surface-panel rise-in relative overflow-hidden rounded-[30px] border border-stone-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(251,250,247,0.92)_58%,rgba(255,248,236,0.82))] p-5 sm:p-8 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(234,88,12,0.35),transparent)]" />
          <div className="absolute right-0 top-0 hidden h-full w-[38%] bg-[linear-gradient(90deg,transparent,rgba(255,247,237,0.68))] lg:block" />

          <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="max-w-4xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-stone-400">
                老广去边度 · 广州出发
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-stone-950 sm:text-5xl">
                说清楚想怎么玩，直接找合适的团。
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">
                输入目的地、预算、天数或同行人。系统会先找匹配线路，再把更适合的团排到前面。
              </p>

              <form
                className="mt-8 max-w-4xl rounded-[24px] border border-stone-200/80 bg-white/95 p-2 shadow-[0_18px_45px_rgba(28,25,23,0.08)]"
                onSubmit={(event) => {
                  event.preventDefault();
                  handlePrimarySearch();
                }}
              >
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" />
                    <Input
                      type="search"
                      enterKeyHint="search"
                      placeholder="例如：帮我找同时带温泉和沙滩的团，预算600以内"
                      className="h-[52px] min-h-[52px] rounded-[18px] border-0 bg-stone-50 pl-11 pr-11 text-sm text-stone-800 placeholder:text-stone-400 shadow-inner shadow-stone-200/50 focus-visible:ring-2 focus-visible:ring-orange-200"
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        aria-label="清空搜索"
                        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-200/70 hover:text-stone-700"
                        onClick={() => onSearchChange('')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="h-[52px] min-h-[52px] rounded-[18px] bg-stone-950 px-6 text-sm font-medium text-white shadow-sm hover:bg-stone-800 lg:min-w-[168px]"
                  >
                    <Search className="h-4 w-4" />
                    找合适的团
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 px-2 pb-1 pt-3 text-xs text-stone-400">
                  <span>输入越具体，排序越准</span>
                  <span className="hidden text-stone-300 sm:inline">/</span>
                  <span>只输入目的地也可以直接看结果</span>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="self-center pr-1 text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
                  热门意图
                </span>
                {quickDestinations.map((dest) => {
                  const isActive = searchQuery.trim() === dest;
                  const intent = destinationIntents[dest] || { label: dest, hint: '热门目的地' };
                  return (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => {
                        onSearchChange(dest);
                        onSearch(dest);
                      }}
                      className={cn(
                        'group rounded-full border px-3.5 py-2 text-left text-sm transition-colors',
                        isActive
                          ? 'border-stone-900 bg-stone-900 text-white hover:border-stone-900 hover:bg-stone-900'
                          : 'border-stone-200 bg-white/85 text-stone-700 hover:border-orange-200 hover:bg-orange-50 hover:text-stone-950',
                      )}
                    >
                      <span className="font-medium">{intent.label}</span>
                      <span
                        className={cn(
                          'ml-1 text-xs',
                          isActive ? 'text-stone-300' : 'text-stone-400 group-hover:text-orange-700',
                        )}
                      >
                        {intent.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="rounded-[26px] border border-stone-200/80 bg-white/78 p-4 shadow-[0_20px_50px_rgba(28,25,23,0.07)] backdrop-blur">
                <div className="flex items-center justify-between gap-4 border-b border-stone-200/70 pb-4">
                  <img src={logoSrc} alt="老广去边度" className="h-20 w-auto object-contain" />
                  <div className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                    输入后自动排序
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-stone-950">示例：广州出发 · 云南 5 天</div>
                        <div className="mt-1 text-xs text-stone-500">预算 3000 内 / 爸妈同行 / 节奏轻松</div>
                      </div>
                      <div className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
                        <Sparkles className="h-3 w-3" />
                        示例
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {planningStats.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label} className="rounded-xl bg-white px-3 py-2">
                            <Icon className="mb-1 h-3.5 w-3.5 text-orange-600" />
                            <div className="text-xs text-stone-400">{item.label}</div>
                            <div className="mt-0.5 text-sm font-semibold text-stone-900">{item.value}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {planningSteps.map((step, index) => (
                      <div key={step.title} className="flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-white px-3 py-2.5">
                        <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
                          {index + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-stone-800">{step.title}</span>
                          <span className="mt-0.5 block text-xs leading-5 text-stone-500">{step.detail}</span>
                        </span>
                        <ClipboardCheck className="ml-auto mt-1 h-4 w-4 shrink-0 text-orange-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
