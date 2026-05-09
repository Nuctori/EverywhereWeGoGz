import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Tour, FilterState } from '@/types/tour';
import { TourCard } from './TourCard';
import { TourDetailModal } from './TourDetailModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Filter, X, MapPin, Calendar, ArrowUpDown,
  Flame, Sparkles, Star, Loader2, SlidersHorizontal,
} from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';

import { sources, destinations, themes } from '@/data/tours';

function useToursData() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    fetch(baseUrl + 'data/tours.json')
      .then((r) => r.json())
      .then((data) => { setTours(data); setLoading(false); })
      .catch(() => { setTours([]); setLoading(false); });
  }, []);
  return { tours, loading };
}

function computePriceStats(tours: Tour[]) {
  const prices = tours.map((t) => t.price).sort((a, b) => a - b);
  const max = prices.length > 0 ? prices[prices.length - 1] : 10000;
  const p95 = prices[Math.floor(prices.length * 0.95)] || max;
  const sliderMax = Math.min(Math.ceil(p95 / 1000) * 1000, Math.ceil(max / 1000) * 1000);
  return {
    maxPriceAll: sliderMax,
    priceStats: { min: prices[0] || 0, max, p50: prices[Math.floor(prices.length * 0.5)] || 0, p95 }
  };
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const PAGE_SIZE = 24;
const INITIAL_LOAD_COUNT = 24;

export function TourList() {
  const { tours: localTours, loading } = useToursData();
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [displayCount, setDisplayCount] = useState(INITIAL_LOAD_COUNT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<FilterState>({
    destination: '', minPrice: null, maxPrice: null, duration: null,
    source: '', departureDate: '', departureDateStart: '', departureDateEnd: '', theme: '', sortBy: 'hot',
  });

  const { maxPriceAll, priceStats } = useMemo(() => computePriceStats(localTours), [localTours]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000]);
  const debouncedPriceRange = useDebouncedValue(priceRange, 300);

  useEffect(() => { setPriceRange([0, maxPriceAll]); }, [maxPriceAll]);

  const dateFilter = useMemo(() => {
    if (filters.departureDateStart || filters.departureDateEnd) {
      return {
        mode: 'range' as const,
        start: filters.departureDateStart || null,
        end: filters.departureDateEnd || null,
      };
    }
    if (!filters.departureDate) return null;
    const today = new Date().toISOString().split('T')[0];
    const selected = filters.departureDate;
    if (selected === today) return { mode: 'exact' as const, date: today };
    if (selected > today) return { mode: 'within' as const, date: selected };
    return { mode: 'after' as const, date: selected };
  }, [filters.departureDate, filters.departureDateStart, filters.departureDateEnd]);

  const displayTours = useMemo(() => {
    if (localTours.length === 0) return [];
    let result = localTours.filter((tour) => {
      if (filters.destination && !tour.destination.includes(filters.destination)) return false;
      if (filters.source && tour.source !== filters.source) return false;
      if (filters.theme && tour.theme !== filters.theme) return false;
      if (dateFilter) {
        if (dateFilter.mode === 'exact' && tour.departureDate !== dateFilter.date) return false;
        if (dateFilter.mode === 'within' && tour.departureDate > dateFilter.date) return false;
        if (dateFilter.mode === 'after' && tour.departureDate < dateFilter.date) return false;
        if (dateFilter.mode === 'range') {
          if (dateFilter.start && tour.departureDate < dateFilter.start) return false;
          if (dateFilter.end && tour.departureDate > dateFilter.end) return false;
        }
      }
      if (tour.price < debouncedPriceRange[0] || tour.price > debouncedPriceRange[1]) return false;
      if (filters.duration && tour.duration !== filters.duration) return false;
      return true;
    });
    switch (filters.sortBy) {
      case 'price_asc': result.sort((a, b) => a.price - b.price); break;
      case 'price_desc': result.sort((a, b) => b.price - a.price); break;
      case 'hot': result.sort((a, b) => (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0) || b.reviewCount - a.reviewCount); break;
      case 'new': result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
    }
    return result;
  }, [filters, debouncedPriceRange, dateFilter, localTours]);

  const waterfallTours = useMemo(() => {
    return displayTours.slice(0, displayCount);
  }, [displayTours, displayCount]);

  useEffect(() => { setDisplayCount(INITIAL_LOAD_COUNT); }, [filters, debouncedPriceRange]);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && !isLoadingMore && displayCount < displayTours.length) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, displayTours.length));
        setIsLoadingMore(false);
      }, 300);
    }
  }, [isLoadingMore, displayCount, displayTours.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null, rootMargin: '100px', threshold: 0,
    });
    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, [handleObserver]);

  const activeFilterCount = [
    filters.destination, filters.source, filters.theme,
    filters.departureDate || filters.departureDateStart || filters.departureDateEnd,
    filters.duration,
    priceRange[0] > 0 || priceRange[1] < maxPriceAll,
  ].filter(Boolean).length;

  const handleCardClick = (tour: Tour) => setSelectedTour(tour);

  const today = new Date().toISOString().split('T')[0];
  const dateOptions = [
    { label: '全部', value: '' },
    { label: '今天', value: today },
    { label: '3天内', value: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0] },
    { label: '7天内', value: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] },
    { label: '15天内', value: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0] },
    { label: '30天内', value: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] },
  ];

  const [dateRangeOpen, setDateRangeOpen] = useState(false);

  // 筛选面板内容（复用）
  const filterContent = (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />目的地
        </label>
        <Select value={filters.destination || 'all'} onValueChange={(v) => setFilters({ ...filters, destination: v === 'all' ? '' : v })}>
          <SelectTrigger><SelectValue placeholder="全部目的地" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部目的地</SelectItem>
            {destinations.map((dest) => <SelectItem key={dest} value={dest}>{dest}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">来源平台</label>
        <Select value={filters.source || 'all'} onValueChange={(v) => setFilters({ ...filters, source: v === 'all' ? '' : v })}>
          <SelectTrigger><SelectValue placeholder="全部平台" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部平台</SelectItem>
            {sources.map((s) => <SelectItem key={s.name} value={s.name}><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />{s.name}</span></SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">主题</label>
        <Select value={filters.theme || 'all'} onValueChange={(v) => setFilters({ ...filters, theme: v === 'all' ? '' : v })}>
          <SelectTrigger><SelectValue placeholder="全部主题" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部主题</SelectItem>
            {themes.map((theme) => <SelectItem key={theme} value={theme}>{theme}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">
          <Calendar className="w-3.5 h-3.5 inline mr-1" />出发日期
        </label>
        <div className="text-xs text-slate-500 mb-1.5">
          {filters.departureDateStart || filters.departureDateEnd
            ? `${filters.departureDateStart || '不限'} 至 ${filters.departureDateEnd || '不限'}`
            : filters.departureDate
              ? (filters.departureDate === today ? '今天及之前出发' : `最晚 ${filters.departureDate} 前出发`)
              : '全部日期'}
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          {dateOptions.map((opt) => (
            <button key={opt.label} onClick={() => setFilters({ ...filters, departureDate: opt.value, departureDateStart: '', departureDateEnd: '' })}
              className={`text-xs px-2 py-1 rounded border transition-colors ${filters.departureDate === opt.value && !filters.departureDateStart && !filters.departureDateEnd ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
              {opt.label}
            </button>
          ))}
          <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
            <PopoverTrigger asChild>
              <button className={`text-xs px-2 py-1 rounded border transition-colors ${filters.departureDateStart || filters.departureDateEnd ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                自定义
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={{
                  from: filters.departureDateStart ? new Date(filters.departureDateStart) : undefined,
                  to: filters.departureDateEnd ? new Date(filters.departureDateEnd) : undefined,
                }}
                onSelect={(range) => {
                  if (range?.from) {
                    const start = range.from.toISOString().split('T')[0];
                    const end = range.to ? range.to.toISOString().split('T')[0] : start;
                    setFilters({ ...filters, departureDate: '', departureDateStart: start, departureDateEnd: end });
                    if (range.to) setDateRangeOpen(false);
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">
          价格区间：¥{priceRange[0]} - ¥{priceRange[1]}
          {priceStats.max > maxPriceAll && <span className="text-xs text-slate-400 ml-2">(最高¥{priceStats.max.toLocaleString()})</span>}
        </label>
        <Slider value={priceRange} max={maxPriceAll} step={100} onValueChange={(v) => setPriceRange(v)} className="mt-2" />
        <div className="flex gap-2 mt-3 flex-wrap">
          {[{ label: '全部', min: 0, max: maxPriceAll }, { label: '¥500以下', min: 0, max: 500 }, { label: '¥500-2000', min: 500, max: 2000 }, { label: '¥2000-5000', min: 2000, max: 5000 }, { label: '¥5000-10000', min: 5000, max: 10000 }, { label: '¥10000以上', min: 10000, max: maxPriceAll }].map((range) => (
            <button key={range.label} onClick={() => setPriceRange([range.min, range.max])}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${priceRange[0] === range.min && priceRange[1] === range.max ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}>
              {range.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">行程天数</label>
        <Select value={filters.duration?.toString() || 'all'} onValueChange={(v) => setFilters({ ...filters, duration: v === 'all' ? null : parseInt(v) })}>
          <SelectTrigger><SelectValue placeholder="全部天数" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部天数</SelectItem>
            {[1,2,3,4,5,6,7,8,9,10].map((d) => <SelectItem key={d} value={d.toString()}>{d}天</SelectItem>)}
            <SelectItem value="11">10天以上</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <section className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          {/* 移动端筛选按钮 */}
          {isMobile ? (
            <Button variant="outline" className={`gap-2 ${showFilters ? 'bg-slate-100' : ''}`} onClick={() => setShowFilters(true)}>
              <SlidersHorizontal className="w-4 h-4" />
              筛选
              {activeFilterCount > 0 && <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>}
            </Button>
          ) : (
            <Button variant="outline" className={`gap-2 ${showFilters ? 'bg-slate-100' : ''}`} onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4" />筛选
              {activeFilterCount > 0 && <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>}
            </Button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown className="w-4 h-4 text-slate-500" />
            <Select value={filters.sortBy} onValueChange={(v) => setFilters({ ...filters, sortBy: v as FilterState['sortBy'] })}>
              <SelectTrigger className="w-[130px] sm:w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hot"><span className="flex items-center gap-2"><Flame className="w-3.5 h-3.5 text-orange-500" />最热</span></SelectItem>
                <SelectItem value="price_asc"><span className="flex items-center gap-2"><span className="text-xs">¥</span>价格从低到高</span></SelectItem>
                <SelectItem value="price_desc"><span className="flex items-center gap-2"><span className="text-xs">¥</span>价格从高到低</span></SelectItem>
                <SelectItem value="rating"><span className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-yellow-500" />评分最高</span></SelectItem>
                <SelectItem value="new"><span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-blue-500" />最新</span></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 桌面端筛选面板 */}
        {!isMobile && showFilters && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filterContent}
            </div>
          </div>
        )}

        {/* 移动端筛选底部Sheet */}
        {isMobile && (
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetContent side="bottom" className="h-[85vh] flex flex-col">
              <SheetHeader className="border-b pb-4">
                <SheetTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />筛选条件
                </SheetTitle>
                <SheetDescription>选择筛选条件后自动生效</SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto py-4">
                {filterContent}
              </div>
              <div className="border-t pt-4 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => {
                  setFilters({ destination: '', minPrice: null, maxPrice: null, duration: null, source: '', departureDate: '', departureDateStart: '', departureDateEnd: '', theme: '', sortBy: 'hot' });
                  setPriceRange([0, maxPriceAll]);
                }}>
                  重置全部
                </Button>
                <Button className="flex-1 bg-blue-500 hover:bg-blue-600" onClick={() => setShowFilters(false)}>
                  查看 {displayTours.length} 条结果
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        )}

        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-500">已选：</span>
            {filters.destination && <Badge variant="outline" className="gap-1"><MapPin className="w-3 h-3" />{filters.destination}<X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, destination: '' })} /></Badge>}
            {filters.theme && <Badge variant="outline" className="gap-1">{filters.theme}<X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, theme: '' })} /></Badge>}
            {(priceRange[0] > 0 || priceRange[1] < maxPriceAll) && <Badge variant="outline" className="gap-1">¥{priceRange[0]}-¥{priceRange[1]}<X className="w-3 h-3 cursor-pointer" onClick={() => setPriceRange([0, maxPriceAll])} /></Badge>}
            {(filters.departureDate || filters.departureDateStart || filters.departureDateEnd) && (
              <Badge variant="outline" className="gap-1">
                <Calendar className="w-3 h-3" />
                {filters.departureDateStart || filters.departureDateEnd
                  ? `${filters.departureDateStart || '不限'} 至 ${filters.departureDateEnd || '不限'}`
                  : filters.departureDate === today ? '今天' : `${filters.departureDate}前`}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, departureDate: '', departureDateStart: '', departureDateEnd: '' })} />
              </Badge>
            )}
            {filters.duration && <Badge variant="outline" className="gap-1">{filters.duration}天<X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, duration: null })} /></Badge>}
            {filters.source && <Badge variant="outline" className="gap-1">{filters.source}<X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, source: '' })} /></Badge>}
          </div>
        )}
      </div>

      {displayTours.length > 0 && (
        <div className="flex items-center justify-between mb-4 text-sm text-slate-500">
          <span>共 {displayTours.length.toLocaleString()} 条结果</span>
          {displayCount < displayTours.length && <span className="text-xs">已显示 {waterfallTours.length.toLocaleString()} 条</span>}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-500">加载旅行数据中...</p>
        </div>
      ) : displayTours.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">未找到匹配的旅行团</h3>
          <p className="text-slate-500">尝试调整筛选条件，发现更多精彩线路</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {waterfallTours.map((tour) => <TourCard key={tour.id} tour={tour} onClick={() => handleCardClick(tour)} />)}
          </div>
          {/* 瀑布流加载触发器和加载状态 */}
          {displayCount < displayTours.length && (
            <div ref={loadMoreRef} className="flex items-center justify-center py-8">
              {isLoadingMore ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">正在加载更多...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-xs">向下滚动加载更多</span>
                </div>
              )}
            </div>
          )}
          {displayCount >= displayTours.length && displayTours.length > INITIAL_LOAD_COUNT && (
            <div className="text-center py-8 text-sm text-slate-400">
              已加载全部 {displayTours.length.toLocaleString()} 条结果
            </div>
          )}
        </>
      )}

      <TourDetailModal tour={selectedTour} onClose={() => setSelectedTour(null)} />
    </section>
  );
}
