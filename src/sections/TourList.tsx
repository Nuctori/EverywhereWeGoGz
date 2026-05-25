import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Tour, FilterState } from '@/types/tour';
import { TourCard } from './TourCard';
import { TourDetailModal } from './TourDetailModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { isDisplayableTour } from '@/lib/tour-filter';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  ArrowUpDown,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  Flame,
  Loader2,
  MapPin,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { sources, destinations, themes } from '@/data/tours';

declare const __DATA_VERSION__: string;

function getDataUrl(path: string) {
  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl}data/${path}?v=${encodeURIComponent(__DATA_VERSION__ || Date.now().toString())}`;
}

function useToursData() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(getDataUrl('tours-list.json'))
      .then((r) => r.json())
      .then((data) => {
        setTours(data);
        setLoading(false);
      })
      .catch(() => {
        setTours([]);
        setLoading(false);
      });
  }, []);

  return { tours, loading };
}

function useTourDetail() {
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const detailCacheRef = useRef<Record<string, Partial<Tour>>>({});

  const selectTour = useCallback((tour: Tour) => {
    setSelectedTour(tour);

    if (detailCacheRef.current[tour.id]) {
      setSelectedTour({ ...tour, ...detailCacheRef.current[tour.id] });
      return;
    }

    setLoadingDetailId(tour.id);
    fetch(getDataUrl(`tour-details/${tour.id}.json`))
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load tour detail: ${r.status}`);
        return r.json();
      })
      .then((detail) => {
        detailCacheRef.current[tour.id] = detail;
        setSelectedTour((current) =>
          current?.id === tour.id ? { ...current, ...detail } : current,
        );
      })
      .catch(() => {
        detailCacheRef.current[tour.id] = {};
      })
      .finally(() => {
        setLoadingDetailId((current) => (current === tour.id ? null : current));
      });
  }, []);

  return {
    selectedTour,
    detailLoading: Boolean(selectedTour && loadingDetailId === selectedTour.id),
    selectTour,
    clearSelectedTour: () => setSelectedTour(null),
  };
}

function computePriceStats(tours: Tour[]) {
  const prices = tours.map((t) => t.price).sort((a, b) => a - b);
  const max = prices.length > 0 ? prices[prices.length - 1] : 10000;
  const p95 = prices[Math.floor(prices.length * 0.95)] || max;
  const sliderMax = Math.min(
    Math.ceil(p95 / 1000) * 1000,
    Math.ceil(max / 1000) * 1000,
  );

  return {
    maxPriceAll: sliderMax,
    priceStats: {
      min: prices[0] || 0,
      max,
      p50: prices[Math.floor(prices.length * 0.5)] || 0,
      p95,
    },
  };
}

const FOCUS_PRICE = 3000;

function sliderToPrice(sliderValue: number, maxPrice: number): number {
  if (sliderValue <= 0) return 0;
  if (sliderValue >= 100) return maxPrice;

  if (sliderValue <= 80) {
    return Math.round((sliderValue / 80) * FOCUS_PRICE);
  }

  const t = (sliderValue - 80) / 20;
  const eased = t * t * (3 - 2 * t);
  return Math.round(FOCUS_PRICE + eased * (maxPrice - FOCUS_PRICE));
}

function priceToSlider(price: number, maxPrice: number): number {
  if (price <= 0) return 0;
  if (price >= maxPrice) return 100;

  if (price <= FOCUS_PRICE) {
    return (price / FOCUS_PRICE) * 80;
  }

  const t = Math.sqrt((price - FOCUS_PRICE) / (maxPrice - FOCUS_PRICE));
  return 80 + t * 20;
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function formatDateLabel(value: string, today: string) {
  if (!value) return '';
  if (value === today) return '今天';
  return value;
}

const PAGE_SIZE = 24;
const INITIAL_LOAD_COUNT = 24;

const DEFAULT_FILTERS: FilterState = {
  destination: '',
  minPrice: null,
  maxPrice: null,
  duration: null,
  source: '',
  departureDate: '',
  departureDateStart: '',
  departureDateEnd: '',
  theme: '',
  sortBy: 'hot',
};

const RECOMMENDED_TITLE_HINTS = [
  '已成团',
  '即将成团',
  '热卖',
  '爆款',
  '首发',
  '限时',
  '甄选',
  '精选',
];

function getDaysUntil(dateString: string) {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return null;
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function getEffectiveDepartureDates(tour: Tour) {
  const dates = (tour.departureDates || []).filter(Boolean);
  if (dates.length > 0) {
    return dates;
  }
  return tour.departureDate ? [tour.departureDate] : [];
}

function getRecommendationScore(tour: Tour) {
  let score = 0;

  if (RECOMMENDED_TITLE_HINTS.some((token) => tour.title.includes(token))) {
    score += 4;
  }

  score += Math.min(tour.departureDates?.length ?? 0, 4);
  score += Math.min(tour.hotDepartureDates?.length ?? 0, 2);

  const daysUntil = getDaysUntil(tour.departureDate);
  if (daysUntil !== null) {
    if (daysUntil < 0) {
      score -= 1;
    } else if (daysUntil <= 7) {
      score += 3;
    } else if (daysUntil <= 30) {
      score += 2;
    } else if (daysUntil <= 90) {
      score += 1;
    }
  }

  if (tour.isNew) {
    score += 1;
  }

  return score;
}

function compareRecommended(a: Tour, b: Tour) {
  return (
    getRecommendationScore(b) - getRecommendationScore(a) ||
    (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0) ||
    (b.hotDepartureDates?.length ?? 0) - (a.hotDepartureDates?.length ?? 0) ||
    (b.departureDates?.length ?? 0) - (a.departureDates?.length ?? 0) ||
    a.price - b.price
  );
}

interface TourListProps {
  searchQuery: string;
}

export function TourList({ searchQuery }: TourListProps) {
  const { tours: localTours, loading } = useToursData();
  const isMobile = useIsMobile();
  const { selectedTour, detailLoading, selectTour, clearSelectedTour } = useTourDetail();
  const [showFilters, setShowFilters] = useState(true);
  const [displayCount, setDisplayCount] = useState(INITIAL_LOAD_COUNT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sliderValues, setSliderValues] = useState<number[]>([0, 100]);

  useEffect(() => {
    setShowFilters(!isMobile);
  }, [isMobile]);

  const { maxPriceAll, priceStats } = useMemo(
    () => computePriceStats(localTours),
    [localTours],
  );

  const priceRange = useMemo(
    () => [
      sliderToPrice(sliderValues[0], maxPriceAll),
      sliderToPrice(sliderValues[1], maxPriceAll),
    ],
    [sliderValues, maxPriceAll],
  );
  const debouncedPriceRange = useDebouncedValue(priceRange, 300);

  useEffect(() => {
    setSliderValues([0, 100]);
  }, [maxPriceAll]);

  const today = new Date().toISOString().split('T')[0];

  const dateOptions = useMemo(
    () => [
      { label: '不限时间', value: '' },
      { label: '今天出发', value: today },
      { label: '3天内', value: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0] },
      { label: '7天内', value: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] },
      { label: '15天内', value: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0] },
      { label: '30天内', value: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] },
    ],
    [today],
  );

  const budgetOptions = useMemo(
    () => [
      { label: '不限预算', min: 0, max: maxPriceAll },
      { label: '500元以下', min: 0, max: 500 },
      { label: '500-2000元', min: 500, max: 2000 },
      { label: '2000-5000元', min: 2000, max: 5000 },
      { label: '5000-10000元', min: 5000, max: 10000 },
      { label: '10000元以上', min: 10000, max: maxPriceAll },
    ],
    [maxPriceAll],
  );

  const dateFilter = useMemo(() => {
    if (filters.departureDateStart || filters.departureDateEnd) {
      return {
        mode: 'range' as const,
        start: filters.departureDateStart || null,
        end: filters.departureDateEnd || null,
      };
    }

    if (!filters.departureDate) return null;

    if (filters.departureDate === today) {
      return { mode: 'exact' as const, date: today };
    }

    if (filters.departureDate > today) {
      return { mode: 'within' as const, date: filters.departureDate };
    }

    return { mode: 'after' as const, date: filters.departureDate };
  }, [
    filters.departureDate,
    filters.departureDateEnd,
    filters.departureDateStart,
    today,
  ]);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const displayTours = useMemo(() => {
    if (localTours.length === 0) return [];

    const result = localTours.filter((tour) => {
      if (!isDisplayableTour(tour)) {
        return false;
      }

      if (normalizedSearchQuery) {
        const matchesSearch = [
          tour.title,
          tour.destination,
          tour.theme,
          tour.source,
          tour.transportType,
          ...tour.tags,
          ...tour.highlights,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearchQuery));

        if (!matchesSearch) {
          return false;
        }
      }

      if (filters.destination && !tour.destination.includes(filters.destination)) {
        return false;
      }

      if (filters.source && tour.source !== filters.source) {
        return false;
      }

      if (filters.theme && tour.theme !== filters.theme) {
        return false;
      }

      if (dateFilter) {
        const candidateDates = getEffectiveDepartureDates(tour);
        if (candidateDates.length === 0) {
          return false;
        }

        if (dateFilter.mode === 'exact' && !candidateDates.includes(dateFilter.date)) {
          return false;
        }

        if (
          dateFilter.mode === 'within' &&
          !candidateDates.some((date) => date <= dateFilter.date)
        ) {
          return false;
        }

        if (
          dateFilter.mode === 'after' &&
          !candidateDates.some((date) => date >= dateFilter.date)
        ) {
          return false;
        }

        if (dateFilter.mode === 'range') {
          const inRange = candidateDates.some((date) => {
            if (dateFilter.start && date < dateFilter.start) {
              return false;
            }
            if (dateFilter.end && date > dateFilter.end) {
              return false;
            }
            return true;
          });
          if (!inRange) {
            return false;
          }
        }
      }

      if (tour.price < debouncedPriceRange[0] || tour.price > debouncedPriceRange[1]) {
        return false;
      }

      if (filters.duration === 11 && tour.duration < 11) {
        return false;
      }

      if (filters.duration && filters.duration !== 11 && tour.duration !== filters.duration) {
        return false;
      }

      return true;
    });

    switch (filters.sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'hot':
        result.sort(compareRecommended);
        break;
      case 'new':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
    }

    return result;
  }, [dateFilter, debouncedPriceRange, filters, localTours, normalizedSearchQuery]);

  const waterfallTours = useMemo(
    () => displayTours.slice(0, displayCount),
    [displayTours, displayCount],
  );

  useEffect(() => {
    setDisplayCount(INITIAL_LOAD_COUNT);
  }, [filters, debouncedPriceRange]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;

      if (target.isIntersecting && !isLoadingMore && displayCount < displayTours.length) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, displayTours.length));
          setIsLoadingMore(false);
        }, 300);
      }
    },
    [displayCount, displayTours.length, isLoadingMore],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    });

    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [handleObserver]);

  const activeFilterCount = [
    filters.destination,
    filters.source,
    filters.theme,
    filters.departureDate || filters.departureDateStart || filters.departureDateEnd,
    filters.duration,
    priceRange[0] > 0 || priceRange[1] < maxPriceAll - 1,
  ].filter(Boolean).length;

  const handleCardClick = (tour: Tour) => selectTour(tour);

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSliderValues([0, 100]);
  };

  const setQuickBudget = (min: number, max: number) => {
    setSliderValues([priceToSlider(min, maxPriceAll), priceToSlider(max, maxPriceAll)]);
  };

  const isBudgetSelected = (min: number, max: number) => {
    const tolerance = 80;
    return (
      Math.abs(priceRange[0] - min) <= tolerance &&
      Math.abs(priceRange[1] - max) <= tolerance
    );
  };

  const baseChipClass =
    'h-10 shrink-0 rounded-full border px-4 text-sm transition-colors';
  const selectedChipClass =
    'border-stone-300 bg-stone-900 text-white hover:border-stone-900 hover:bg-stone-900';
  const idleChipClass =
    'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900';

  const commonFilters = (
    <div className="surface-panel rounded-[28px] border border-stone-200/80 bg-white/92 p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">筛选</h2>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-medium text-stone-600"
            >
              已选 {activeFilterCount} 项
            </Badge>
          )}
          <Button
            variant="outline"
            className="h-10 gap-2 rounded-full border-stone-200 bg-white px-4 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            更多筛选
            {showFilters ? <ChevronUp className="w-4 h-4 hidden sm:block" /> : <ChevronDown className="w-4 h-4 hidden sm:block" />}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              className="h-10 rounded-full px-3 text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              onClick={resetFilters}
            >
              清空
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-700">
            <MapPin className="w-4 h-4 text-stone-500" />
            目的地
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
            <button
              type="button"
              onClick={() => setFilters({ ...filters, destination: '' })}
              className={cn(
                baseChipClass,
                !filters.destination
                  ? selectedChipClass
                  : idleChipClass,
              )}
            >
              全部目的地
            </button>
            {destinations.map((dest) => (
              <button
                key={dest}
                type="button"
                onClick={() => setFilters({ ...filters, destination: dest })}
                className={cn(
                  baseChipClass,
                  filters.destination === dest
                    ? selectedChipClass
                    : idleChipClass,
                )}
              >
                {dest}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-700">
            <Calendar className="w-4 h-4 text-stone-500" />
            出发时间
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {dateOptions.map((option) => {
              const selected =
                filters.departureDate === option.value &&
                !filters.departureDateStart &&
                !filters.departureDateEnd;

              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      departureDate: option.value,
                      departureDateStart: '',
                      departureDateEnd: '',
                    })
                  }
                  className={cn(
                    'h-10 rounded-2xl border px-3 text-sm transition-colors',
                    selected
                      ? selectedChipClass
                      : idleChipClass,
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-700">
            <Filter className="w-4 h-4 text-stone-500" />
            预算
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {budgetOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setQuickBudget(option.min, option.max)}
                className={cn(
                    'h-10 rounded-2xl border px-3 text-sm transition-colors',
                    isBudgetSelected(option.min, option.max)
                    ? selectedChipClass
                    : idleChipClass,
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const advancedFilters = (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-stone-200/80 bg-stone-50/75 p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-stone-900">更多筛选</h3>
          <Button
            variant="ghost"
            className="rounded-full px-3 text-stone-500 hover:bg-white hover:text-stone-900"
            onClick={() => setShowFilters(false)}
          >
            收起
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              来源平台
            </label>
            <Select
              value={filters.source || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, source: value === 'all' ? '' : value })
              }
            >
            <SelectTrigger className="h-10 rounded-2xl border-stone-200 bg-white">
                <SelectValue placeholder="全部平台" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部平台</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source.name} value={source.name}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: source.color }}
                      />
                      {source.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              行程天数
            </label>
            <Select
              value={filters.duration?.toString() || 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  duration: value === 'all' ? null : parseInt(value, 10),
                })
              }
            >
            <SelectTrigger className="h-10 rounded-2xl border-stone-200 bg-white">
                <SelectValue placeholder="全部天数" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部天数</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}天
                  </SelectItem>
                ))}
                <SelectItem value="11">10天以上</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              主题
            </label>
            <Select
              value={filters.theme || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, theme: value === 'all' ? '' : value })
              }
            >
            <SelectTrigger className="h-10 rounded-2xl border-stone-200 bg-white">
                <SelectValue placeholder="全部主题" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部主题</SelectItem>
                {themes.map((theme) => (
                  <SelectItem key={theme} value={theme}>
                    {theme}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              目的地下拉选择
            </label>
            <Select
              value={filters.destination || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, destination: value === 'all' ? '' : value })
              }
            >
            <SelectTrigger className="h-10 rounded-2xl border-stone-200 bg-white">
                <SelectValue placeholder="全部目的地" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部目的地</SelectItem>
                {destinations.map((dest) => (
                  <SelectItem key={dest} value={dest}>
                    {dest}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              出发日期范围
            </label>
            <div className="rounded-[22px] border border-stone-200 bg-white p-4">
              <div className="mb-3 text-sm text-stone-500">
                {filters.departureDateStart || filters.departureDateEnd
                  ? `${filters.departureDateStart || '不限'} 至 ${filters.departureDateEnd || '不限'}`
                  : filters.departureDate
                    ? `${formatDateLabel(filters.departureDate, today)} 及之前`
                    : '当前为全部日期'}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        'h-10 rounded-full border-stone-200 bg-white',
                        (filters.departureDateStart || filters.departureDateEnd) &&
                          'border-stone-300 bg-stone-50 text-stone-900',
                      )}
                    >
                      自定义日期范围
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      numberOfMonths={2}
                      selected={{
                        from: filters.departureDateStart
                          ? new Date(filters.departureDateStart)
                          : undefined,
                        to: filters.departureDateEnd
                          ? new Date(filters.departureDateEnd)
                          : undefined,
                      }}
                      onSelect={(range) => {
                        if (!range?.from) return;

                        const start = range.from.toISOString().split('T')[0];
                        const end = range.to
                          ? range.to.toISOString().split('T')[0]
                          : start;

                        setFilters({
                          ...filters,
                          departureDate: '',
                          departureDateStart: start,
                          departureDateEnd: end,
                        });

                        if (range.to) {
                          setDateRangeOpen(false);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>

                {(filters.departureDate || filters.departureDateStart || filters.departureDateEnd) && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                    onClick={() =>
                      setFilters({
                        ...filters,
                        departureDate: '',
                        departureDateStart: '',
                        departureDateEnd: '',
                      })
                    }
                  >
                    清空日期
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              精细价格范围
            </label>
            <div className="rounded-[22px] border border-stone-200 bg-white p-4">
              <div className="text-sm text-stone-600">
                {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} 元
              </div>
              {priceStats.max > maxPriceAll && (
                <div className="mt-1 text-xs text-stone-400">
                  当前滑杆最高到 {maxPriceAll.toLocaleString()} 元，实际最高价约{' '}
                  {priceStats.max.toLocaleString()} 元
                </div>
              )}
              <Slider
                value={sliderValues}
                max={100}
                step={1}
                className="mt-5"
                onValueChange={(value) => setSliderValues(value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6">
        {commonFilters}

        {!isMobile && showFilters && (
          <div className="mt-4">
            {advancedFilters}
          </div>
        )}

        {isMobile && (
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetContent side="bottom" className="h-[88vh] flex flex-col px-0">
              <SheetHeader className="border-b px-4 pb-4">
                <SheetTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  更多筛选
                </SheetTitle>
                <SheetDescription>
                  常用筛选已经放在首屏，这里保留更细的条件
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {advancedFilters}
              </div>
              <div className="border-t px-4 pt-4 pb-5 flex gap-3">
                <Button variant="outline" className="h-10 flex-1 rounded-2xl border-stone-200 bg-white" onClick={resetFilters}>
                  重置全部
                </Button>
                <Button
                  className="h-10 flex-1 rounded-2xl bg-stone-900 hover:bg-stone-800"
                  onClick={() => setShowFilters(false)}
                >
                  查看 {displayTours.length} 条线路
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-stone-500" />
            <Select
              value={filters.sortBy}
              onValueChange={(value) =>
                setFilters({ ...filters, sortBy: value as FilterState['sortBy'] })
              }
            >
              <SelectTrigger className="h-10 w-[170px] rounded-full border-stone-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">
                  <span className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    推荐优先
                  </span>
                </SelectItem>
                <SelectItem value="price_asc">价格由低到高</SelectItem>
                <SelectItem value="price_desc">价格由高到低</SelectItem>
                <SelectItem value="rating">
                  <span className="flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-yellow-500" />
                    评分优先
                  </span>
                </SelectItem>
                <SelectItem value="new">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    新上线优先
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-stone-500">当前已选：</span>
              {filters.destination && (
                <Badge variant="outline" className="gap-1 rounded-full border-stone-200 bg-white px-3 py-1 text-stone-700">
                  <MapPin className="w-3 h-3" />
                  {filters.destination}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setFilters({ ...filters, destination: '' })}
                  />
                </Badge>
              )}
              {filters.theme && (
                <Badge variant="outline" className="gap-1 rounded-full border-stone-200 bg-white px-3 py-1 text-stone-700">
                  {filters.theme}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setFilters({ ...filters, theme: '' })}
                  />
                </Badge>
              )}
              {(priceRange[0] > 0 || priceRange[1] < maxPriceAll - 1) && (
                <Badge variant="outline" className="gap-1 rounded-full border-stone-200 bg-white px-3 py-1 text-stone-700">
                  {priceRange[0].toLocaleString()}-{priceRange[1].toLocaleString()} 元
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSliderValues([0, 100])}
                  />
                </Badge>
              )}
              {(filters.departureDate || filters.departureDateStart || filters.departureDateEnd) && (
                <Badge variant="outline" className="gap-1 rounded-full border-stone-200 bg-white px-3 py-1 text-stone-700">
                  <Calendar className="w-3 h-3" />
                  {filters.departureDateStart || filters.departureDateEnd
                    ? `${filters.departureDateStart || '不限'} 至 ${filters.departureDateEnd || '不限'}`
                    : formatDateLabel(filters.departureDate, today)}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() =>
                      setFilters({
                        ...filters,
                        departureDate: '',
                        departureDateStart: '',
                        departureDateEnd: '',
                      })
                    }
                  />
                </Badge>
              )}
              {filters.duration && (
                <Badge variant="outline" className="gap-1 rounded-full border-stone-200 bg-white px-3 py-1 text-stone-700">
                  {filters.duration === 11 ? '10天以上' : `${filters.duration}天`}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setFilters({ ...filters, duration: null })}
                  />
                </Badge>
              )}
              {filters.source && (
                <Badge variant="outline" className="gap-1 rounded-full border-stone-200 bg-white px-3 py-1 text-stone-700">
                  {filters.source}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setFilters({ ...filters, source: '' })}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {displayTours.length > 0 && (
        <div className="mb-5 flex items-center justify-between text-sm text-stone-500">
          <span>共 {displayTours.length.toLocaleString()} 条结果</span>
          {displayCount < displayTours.length && (
            <span className="text-xs text-stone-400">
              已显示 {waterfallTours.length.toLocaleString()} 条
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-stone-700" />
          <p className="text-stone-500">加载旅行数据中...</p>
        </div>
      ) : displayTours.length === 0 ? (
        <div className="surface-panel rounded-[28px] border border-stone-200/80 bg-white/90 py-20 text-center">
          <div className="mb-4 text-5xl">暂无结果</div>
          <h3 className="mb-2 text-lg font-semibold text-stone-700">
            没有找到符合条件的旅行团
          </h3>
          <p className="text-stone-500">可以先放宽时间或预算条件，再看看更多线路</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {waterfallTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} onClick={() => handleCardClick(tour)} />
            ))}
          </div>

          {displayCount < displayTours.length && (
            <div ref={loadMoreRef} className="flex items-center justify-center py-8">
              {isLoadingMore ? (
                <div className="flex items-center gap-2 text-stone-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">正在加载更多...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-stone-400">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700" />
                  <span className="text-xs">向下滚动加载更多</span>
                </div>
              )}
            </div>
          )}

          {displayCount >= displayTours.length && displayTours.length > INITIAL_LOAD_COUNT && (
            <div className="py-8 text-center text-sm text-stone-400">
              已加载全部 {displayTours.length.toLocaleString()} 条结果
            </div>
          )}
        </>
      )}

      <TourDetailModal tour={selectedTour} loading={detailLoading} onClose={clearSelectedTour} />
    </section>
  );
}
