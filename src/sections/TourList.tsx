// 数据加载链：loadCatalog（全量列表）→ loadInitial（分页加载，失败回退 loadCatalog）→ loadMorePages（滚动懒加载）
// 筛选/排序/瀑布流、AI 推荐叠加、滚动监听加载更多
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type {
  AiRecommendationCandidate,
  AiRecommendationResult,
  Tour,
  TourSummary,
  FilterState,
} from '@/types/tour';
import { TourCard } from './TourCard';
import { TourDetailModal } from './TourDetailModal';
import { AiRecommendPanel } from './AiRecommendPanel';
import type { AiSearchRequest } from '@/App';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn, getDataUrl } from '@/lib/utils';
import { clearStoredAiChatState } from '@/lib/ai-chat-storage';
import { toursListSchema, toursPageSchema } from '@/lib/runtime-schemas';
import { isDisplayableTour } from '@/lib/tour-filter';
import { compareRecommended, getEffectiveDepartureDates } from '@/lib/tour-recommendation';
import { useTourDetail } from '@/hooks/use-tour-detail';
import { computePriceStats, sliderToPrice, priceToSlider } from '@/lib/price-slider';
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
  X,
} from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { zhCN } from 'date-fns/locale';

// 数据加载核心 hook：分页优先（tours-page-0.json），失败后回退全量列表
function useToursData() {
  const [tours, setTours] = useState<TourSummary[]>([]);
  const [catalogTours, setCatalogTours] = useState<TourSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasPageChunks, setHasPageChunks] = useState(true);
  const loadedPagesRef = useRef<Set<number>>(new Set());
  const inFlightPagesRef = useRef<Set<number>>(new Set());
  const hasPageChunksRef = useRef(true);

  const syncLoadingMoreState = useCallback(() => {
    setLoadingMore(inFlightPagesRef.current.size > 0);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const listRes = await fetch(getDataUrl('tours-list.json'));
        if (!listRes.ok) {
          throw new Error(`Failed to load tours catalog: ${listRes.status}`);
        }
        const data = toursListSchema.parse(await listRes.json());
        if (cancelled) return;
        setCatalogTours(data);
        setTotal(data.length);
      } catch {
        if (!cancelled) {
          setCatalogTours([]);
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    }

    async function loadInitial() {
      try {
        const pageRes = await fetch(getDataUrl('tours-page-0.json'));
        if (cancelled) return;
        const pageData = toursPageSchema.parse(await pageRes.json());
        if (cancelled) return;
        setTours(pageData.items);
        setTotal(pageData.meta.total);
        loadedPagesRef.current.add(0);
        hasPageChunksRef.current = true;
        setHasPageChunks(true);
        setLoading(false);
        void loadCatalog();
      } catch {
        try {
          const fallbackRes = await fetch(getDataUrl('tours-list.json'));
          if (cancelled) return;
          const data = toursListSchema.parse(await fallbackRes.json());
          if (cancelled) return;
          setTours(data);
          setCatalogTours(data);
          setTotal(data.length);
          hasPageChunksRef.current = false;
          setHasPageChunks(false);
          setCatalogLoading(false);
          setLoading(false);
        } catch {
          if (!cancelled) {
            setTours([]);
            setCatalogTours([]);
            setCatalogLoading(false);
            setLoading(false);
          }
        }
      }
    }
    loadInitial();
    return () => { cancelled = true; };
  }, []);

  const loadMorePages = useCallback(async (neededPage: number) => {
    if (!hasPageChunksRef.current) return;
    if (loadedPagesRef.current.has(neededPage)) return;
    if (inFlightPagesRef.current.has(neededPage)) return;

    inFlightPagesRef.current.add(neededPage);
    syncLoadingMoreState();
    try {
      const res = await fetch(getDataUrl('tours-page-' + neededPage + '.json'));
      if (!res.ok) {
        throw new Error(`Failed to load page ${neededPage}: ${res.status}`);
      }
      const pageData = toursPageSchema.parse(await res.json());
      loadedPagesRef.current.add(neededPage);
      setTours((prev) => {
        const existingIds = new Set(prev.map((tour) => tour.id));
        const nextItems = pageData.items.filter((tour: TourSummary) => !existingIds.has(tour.id));
        return prev.concat(nextItems);
      });
    } catch {
      hasPageChunksRef.current = false;
      setHasPageChunks(false);
    } finally {
      inFlightPagesRef.current.delete(neededPage);
      syncLoadingMoreState();
    }
  }, [syncLoadingMoreState]);

  return {
    tours,
    catalogTours,
    loading,
    catalogLoading,
    loadingMore,
    total,
    loadMorePages,
    loadedPagesRef,
    hasPageChunks,
    hasPageChunksRef,
  };
}

function formatDateLabel(value: string, today: string) {
  if (!value) return '';
  if (value === today) return '今天';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${Number(month)}月${Number(day)}日`;
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromDateInputValue(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

const PAGE_SIZE = 24;
const INITIAL_LOAD_COUNT = 24;
const LONG_TRIP_DURATION_VALUE = 11;
const DEFAULT_SLIDER_VALUES: [number, number] = [0, 100];
const VISIBLE_DESTINATION_COUNT = 14;
const HERO_DESTINATION_COUNT = 6;
const SOURCE_COLORS: Record<string, string> = {
  假日通: '#FF6B35',
  广州去旅行: '#4ECDC4',
  康辉: '#1A535C',
  暴走村: '#B8860B',
  广之旅: '#FF006E',
  广东中旅: '#8338EC',
  品途: '#3A86FF',
  天涯户外: '#2F855A',
};

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

const SEARCH_SPLIT_PATTERN =
  /(?:\s+|推荐|帮我|帮忙|给我|想要|想找|想去|看看|安排|同时|具有|带有|带|含有|包含|包括|适合|可以|有没有|和|与|及|以及|或者|或|的|旅行团|旅游团|跟团|线路|产品|主题|玩法|一下|一个|一些)+/gu;
const searchCorpusCache = new WeakMap<TourSummary, string>();

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function extractSearchTerms(query: string) {
  const normalized = normalizeSearchText(query).replace(/[^\p{Script=Han}a-z0-9]+/gu, ' ');
  const parts = normalized
    .split(SEARCH_SPLIT_PATTERN)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2 && part.length <= 16 && !/^\d+$/.test(part));

  if (parts.length > 0) {
    return [...new Set(parts)].slice(0, 8);
  }

  return normalized && normalized.length <= 16 ? [normalized] : [];
}

function getTourSearchCorpus(tour: TourSummary) {
  const cached = searchCorpusCache.get(tour);
  if (cached) return cached;

  const corpus = [
    tour.title,
    tour.destination,
    tour.theme,
    tour.source,
    tour.transportType,
    ...tour.tags,
    ...tour.highlights,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  searchCorpusCache.set(tour, corpus);
  return corpus;
}

function getTourSearchRelevance(
  tour: TourSummary,
  search: { normalized: string; terms: string[] },
) {
  if (!search.normalized) return 0;

  const corpus = getTourSearchCorpus(tour);
  let score = 0;

  if (tour.title.toLowerCase().includes(search.normalized)) score += 32;
  else if (corpus.includes(search.normalized)) score += 18;

  for (const term of search.terms) {
    if (tour.destination.toLowerCase().includes(term)) score += 18;
    else if (tour.theme.toLowerCase().includes(term)) score += 15;
    else if (tour.title.toLowerCase().includes(term)) score += 14;
    else if (tour.tags.some((tag) => tag.toLowerCase().includes(term))) score += 12;
    else if (tour.highlights.some((highlight) => highlight.toLowerCase().includes(term))) score += 10;
    else if (tour.source.toLowerCase().includes(term) || tour.transportType.toLowerCase().includes(term)) score += 8;
    else if (corpus.includes(term)) score += 4;
  }

  return score;
}

function compareToursBySortMode(
  sortBy: FilterState['sortBy'],
  a: TourSummary,
  b: TourSummary,
) {
  switch (sortBy) {
    case 'price_asc':
      return a.price - b.price;
    case 'price_desc':
      return b.price - a.price;
    case 'hot':
      return compareRecommended(a, b, RECOMMENDED_TITLE_HINTS);
    case 'new':
      return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    default:
      return 0;
  }
}

function getDynamicHeroDestinations(tours: TourSummary[]) {
  const counts = new Map<string, number>();

  for (const tour of tours) {
    const destination = String(tour.destination || '').trim();
    if (!destination || destination === '其他') continue;
    counts.set(destination, (counts.get(destination) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, HERO_DESTINATION_COUNT)
    .map(([destination]) => destination);
}

function getDestinationOptions(tours: TourSummary[]) {
  const counts = new Map<string, number>();

  for (const tour of tours) {
    const destination = String(tour.destination || '').trim();
    if (!destination || !isDisplayableTour(tour)) continue;
    counts.set(destination, (counts.get(destination) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
    .map(([destination]) => destination);
}

function getThemeOptions(tours: TourSummary[]) {
  const counts = new Map<string, number>();

  for (const tour of tours) {
    const theme = String(tour.theme || '').trim();
    if (!theme || !isDisplayableTour(tour)) continue;
    counts.set(theme, (counts.get(theme) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
    .map(([theme]) => theme);
}

function getSourceOptions(tours: TourSummary[]) {
  const sourceMeta = new Map<string, { name: string; color?: string }>();

  for (const tour of tours) {
    const source = String(tour.source || '').trim();
    if (!source) continue;
    sourceMeta.set(source, {
      name: source,
      color: SOURCE_COLORS[source] || sourceMeta.get(source)?.color,
    });
  }

  return Array.from(sourceMeta.values()).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
}

interface TourListProps {
  searchQuery: string;
  aiSearchRequest: AiSearchRequest | null;
}

export function TourList({ searchQuery, aiSearchRequest }: TourListProps) {
  const {
    tours: localTours,
    catalogTours,
    loading,
    catalogLoading,
    loadingMore,
    total,
    loadMorePages,
    hasPageChunks,
    hasPageChunksRef,
  } = useToursData();
  const isMobile = useIsMobile();
  const {
    selectedSummaryTour,
    resolvedTour,
    detailStatus,
    detailError,
    detailLoading,
    selectTour,
    clearSelectedTour,
  } = useTourDetail();
  const [showFilters, setShowFilters] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false,
  );
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD_COUNT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadMoreTimerRef = useRef<number | null>(null);
  const viewVersionRef = useRef(0);
// filters 为主控筛选状态；activeFilters 同步已激活条件，供 AI 面板使用
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sliderValues, setSliderValues] = useState<number[]>(DEFAULT_SLIDER_VALUES);
  const [aiClearVersion, setAiClearVersion] = useState(0);
  const [aiRecommendationResult, setAiRecommendationResult] =
    useState<AiRecommendationResult | null>(null);
  const catalogSourceTours = catalogTours.length > 0 ? catalogTours : localTours;

  const syncTourQueryParam = useCallback((tourId: string | null) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (tourId) {
      url.searchParams.set('tour', tourId);
      url.searchParams.set('source', 'wechat');
    } else {
      url.searchParams.delete('tour');
      if (url.searchParams.get('source') === 'wechat') {
        url.searchParams.delete('source');
      }
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

  const { maxPriceAll, priceStats } = useMemo(
    () => computePriceStats(catalogSourceTours),
    [catalogSourceTours],
  );
  const heroDestinations = useMemo(
    () => getDynamicHeroDestinations(catalogSourceTours),
    [catalogSourceTours],
  );
  const destinationOptions = useMemo(
    () => getDestinationOptions(catalogSourceTours),
    [catalogSourceTours],
  );
  const themeOptions = useMemo(
    () => getThemeOptions(catalogSourceTours),
    [catalogSourceTours],
  );
  const sourceOptions = useMemo(
    () => getSourceOptions(catalogSourceTours),
    [catalogSourceTours],
  );

  const priceRange = useMemo(
    () => [
      sliderToPrice(sliderValues[0], maxPriceAll),
      sliderToPrice(sliderValues[1], maxPriceAll),
    ],
    [sliderValues, maxPriceAll],
  );
  const hasPriceFilter = priceRange[0] > 0 || priceRange[1] < maxPriceAll - 1;
  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
    }),
    [filters, priceRange],
  );

  const today = toDateInputValue(new Date());

  const dateOptions = useMemo(
    () => [
      { label: '不限时间', value: '' },
      { label: '今天出发', value: today },
      { label: '3天内', value: addDays(today, 3) },
      { label: '7天内', value: addDays(today, 7) },
      { label: '15天内', value: addDays(today, 15) },
      { label: '30天内', value: addDays(today, 30) },
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

  const visibleDestinations = useMemo(() => {
    return destinationOptions.slice(0, VISIBLE_DESTINATION_COUNT);
  }, [destinationOptions]);
  const overflowDestinations = useMemo(
    () => destinationOptions.filter((dest) => !visibleDestinations.includes(dest)),
    [destinationOptions, visibleDestinations],
  );
  const selectedDestinationInOverflow =
    Boolean(filters.destination) && !visibleDestinations.includes(filters.destination);
  const dateRangeLabel =
    filters.departureDateStart || filters.departureDateEnd
      ? `${filters.departureDateStart ? formatDateLabel(filters.departureDateStart, today) : '不限'} 至 ${
          filters.departureDateEnd ? formatDateLabel(filters.departureDateEnd, today) : '不限'
        }`
      : '';

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
  const searchTerms = useMemo(() => extractSearchTerms(searchQuery), [searchQuery]);
  const hasNaturalLanguageQuery = normalizedSearchQuery.length >= 8 || searchTerms.length >= 2;
  const searchContext = useMemo(
    () => ({ normalized: normalizedSearchQuery, terms: searchTerms }),
    [normalizedSearchQuery, searchTerms],
  );
  const isAiSearchMode = Boolean(aiRecommendationResult);

  const aiRecommendedCount = useMemo(
    () => aiRecommendationResult?.items.filter((item) => Boolean(item.reason)).length ?? 0,
    [aiRecommendationResult],
  );

  const aiRecommendationByTourId = useMemo(
    () =>
      new Map(
        aiRecommendationResult?.items.map((item, index) => [
          item.tourId,
          { ...item, rank: index + 1 },
        ]) ?? [],
      ),
    [aiRecommendationResult],
  );
  const displayTours = useMemo(() => {
    if (catalogSourceTours.length === 0) return [];

    const result = catalogSourceTours.filter((tour) => {
      if (!isDisplayableTour(tour)) {
        return false;
      }

      const isAiRecommendedTour = aiRecommendationByTourId.has(tour.id);

      if (isAiRecommendedTour) {
        return true;
      }

      if (normalizedSearchQuery && !isAiSearchMode && !isAiRecommendedTour) {
        const relevance = getTourSearchRelevance(tour, searchContext);
        const minRelevance = hasNaturalLanguageQuery ? 4 : 12;

        if (relevance < minRelevance) {
          return false;
        }
      }

      if (effectiveFilters.destination && !tour.destination.includes(effectiveFilters.destination)) {
        return false;
      }

      if (effectiveFilters.source && tour.source !== effectiveFilters.source) {
        return false;
      }

      if (effectiveFilters.theme && tour.theme !== effectiveFilters.theme) {
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
          !candidateDates.some((date) => date >= today && date <= dateFilter.date)
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

      if (effectiveFilters.minPrice !== null && tour.price < effectiveFilters.minPrice) {
        return false;
      }

      if (effectiveFilters.maxPrice !== null && tour.price > effectiveFilters.maxPrice) {
        return false;
      }

      if (
        effectiveFilters.duration === LONG_TRIP_DURATION_VALUE &&
        tour.duration < LONG_TRIP_DURATION_VALUE
      ) {
        return false;
      }

      if (
        effectiveFilters.duration &&
        effectiveFilters.duration !== LONG_TRIP_DURATION_VALUE &&
        tour.duration !== effectiveFilters.duration
      ) {
        return false;
      }

      return true;
    });

    if (normalizedSearchQuery && !isAiSearchMode) {
      result.sort((a, b) =>
        getTourSearchRelevance(b, searchContext) - getTourSearchRelevance(a, searchContext) ||
        compareToursBySortMode(filters.sortBy, a, b),
      );
    } else {
      result.sort((a, b) => compareToursBySortMode(filters.sortBy, a, b));
    }

    if (aiRecommendationByTourId.size > 0) {
      const pinned: Tour[] = [];
      const rest: Tour[] = [];

      for (const tour of result) {
        if (aiRecommendationByTourId.has(tour.id)) {
          pinned.push(tour);
        } else {
          rest.push(tour);
        }
      }

      pinned.sort((a, b) => {
        const aItem = aiRecommendationByTourId.get(a.id);
        const bItem = aiRecommendationByTourId.get(b.id);
        return (aItem?.rank ?? Number.MAX_SAFE_INTEGER) - (bItem?.rank ?? Number.MAX_SAFE_INTEGER);
      });

      return [...pinned, ...rest];
    }

    return result;
  }, [
    aiRecommendationByTourId,
    isAiSearchMode,
    catalogSourceTours,
    dateFilter,
    effectiveFilters,
    filters.sortBy,
    hasNaturalLanguageQuery,
    searchContext,
    normalizedSearchQuery,
    today,
  ]);
  const visibleTourIds = useMemo(
    () => new Set(displayTours.map((tour) => tour.id)),
    [displayTours],
  );
  const hiddenAiRecommendationCount = useMemo(
    () =>
      aiRecommendationResult?.items.filter((item) => !visibleTourIds.has(item.tourId)).length ?? 0,
    [aiRecommendationResult, visibleTourIds],
  );
  const activeFilterCount = [
    effectiveFilters.destination,
    effectiveFilters.source,
    effectiveFilters.theme,
    effectiveFilters.departureDate || effectiveFilters.departureDateStart || effectiveFilters.departureDateEnd,
    effectiveFilters.duration,
    hasPriceFilter,
  ].filter(Boolean).length;
  const clearAiRecommendation = useCallback(() => {
    clearStoredAiChatState();
    setAiRecommendationResult(null);
    setAiClearVersion((current) => current + 1);
  }, []);

  const waterfallTours = useMemo(
    () => displayTours.slice(0, visibleCount),
    [displayTours, visibleCount],
  );
  const hasMoreLoadedResults = visibleCount < displayTours.length;
  const hasMoreRemotePages = hasPageChunks && catalogTours.length === 0 && localTours.length < total;
  const shouldRenderLoadMore = hasMoreLoadedResults || hasMoreRemotePages;
  const emptyStateTitle = normalizedSearchQuery && !isAiSearchMode
    ? hasNaturalLanguageQuery
      ? '这句需求没有直接卡死结果'
      : '没有找到直接匹配的旅行团'
    : '没有找到符合条件的旅行团';
  const emptyStateDescription = normalizedSearchQuery && !isAiSearchMode
    ? hasNaturalLanguageQuery
      ? '当前会优先按关键词相关度展示线路；如果还不够准，试试右上的 AI 帮我选，它会按这句话重新排序。'
      : '可以换个关键词，或者先放宽时间、预算、天数这些条件。'
    : '可以先放宽时间或预算条件，再看看更多线路';

  const handleObserver = useCallback(

        // IntersectionObserver 监听底部占位元素，进入视口时触发 loadMorePages
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;

      if (!target.isIntersecting || isLoadingMore || loadingMore) {
        return;
      }

      if (visibleCount < displayTours.length) {
        const viewVersion = viewVersionRef.current;
        setIsLoadingMore(true);
        loadMoreTimerRef.current = window.setTimeout(() => {
          if (viewVersionRef.current !== viewVersion) {
            setIsLoadingMore(false);
            loadMoreTimerRef.current = null;
            return;
          }

          setVisibleCount((current) => Math.min(current + PAGE_SIZE, displayTours.length));
          setIsLoadingMore(false);
          loadMoreTimerRef.current = null;
        }, 300);
        return;
      }

      if (hasPageChunksRef.current && catalogTours.length === 0 && localTours.length < total) {
        const nextPage = Math.floor(localTours.length / PAGE_SIZE);
        const viewVersion = viewVersionRef.current;

        setIsLoadingMore(true);
        void loadMorePages(nextPage).finally(() => {
          if (viewVersionRef.current !== viewVersion) {
            setIsLoadingMore(false);
            return;
          }

          setVisibleCount((current) => current + PAGE_SIZE);
          setIsLoadingMore(false);
        });
      }
    },
    [
      catalogTours.length,
      displayTours.length,
      hasPageChunksRef,
      isLoadingMore,
      loadMorePages,
      loadingMore,
      localTours.length,
      total,
      visibleCount,
    ],
  );

  useEffect(() => {

        // IntersectionObserver 监听底部占位元素，进入视口时触发 loadMorePages
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

  useEffect(() => {
    viewVersionRef.current += 1;

    if (loadMoreTimerRef.current !== null) {
      window.clearTimeout(loadMoreTimerRef.current);
      loadMoreTimerRef.current = null;
    }
  }, [
    aiRecommendationResult,
    effectiveFilters.departureDate,
    effectiveFilters.departureDateEnd,
    effectiveFilters.departureDateStart,
    effectiveFilters.destination,
    effectiveFilters.duration,
    effectiveFilters.maxPrice,
    effectiveFilters.minPrice,
    effectiveFilters.source,
    effectiveFilters.theme,
    normalizedSearchQuery,
  ]);

  const displayContextKey = [
    aiRecommendationResult ? 'ai' : 'plain',
    effectiveFilters.destination,
    effectiveFilters.source,
    effectiveFilters.theme,
    effectiveFilters.departureDate,
    effectiveFilters.departureDateStart,
    effectiveFilters.departureDateEnd,
    effectiveFilters.duration ?? '',
    effectiveFilters.minPrice ?? '',
    effectiveFilters.maxPrice ?? '',
    normalizedSearchQuery,
  ].join('|');

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setIsLoadingMore(false);
      setVisibleCount(INITIAL_LOAD_COUNT);
    }, 0);

    return () => {
      window.clearTimeout(resetTimer);
    };
  }, [displayContextKey]);

  useEffect(() => {
    return () => {
      if (loadMoreTimerRef.current !== null) {
        window.clearTimeout(loadMoreTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tourId = new URLSearchParams(window.location.search).get('tour');
    if (!tourId) return;
    if (selectedSummaryTour?.id === tourId) return;
    const matchedTour = catalogSourceTours.find((tour) => tour.id === tourId);
    if (matchedTour) {
      selectTour(matchedTour);
    }
  }, [catalogSourceTours, selectTour, selectedSummaryTour?.id]);

// 点击卡片后调用 selectTour 异步加载详情，触发 TourDetailModal
  const handleCardClick = (tour: TourSummary) => {
    syncTourQueryParam(tour.id);
    selectTour(tour);
  };

  const handleCloseTour = useCallback(() => {
    syncTourQueryParam(null);
    clearSelectedTour();
  }, [clearSelectedTour, syncTourQueryParam]);

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSliderValues([0, 100]);
  };

  const setQuickBudget = (min: number, max: number) => {
    setSliderValues([priceToSlider(min, maxPriceAll), priceToSlider(max, maxPriceAll)]);
  };

  const aiCandidateTours = useMemo<AiRecommendationCandidate[]>(
    () =>
      catalogSourceTours.map((tour) => ({
        id: tour.id,
        title: tour.title,
        source: tour.source,
        destination: tour.destination,
        duration: tour.duration,
        price: tour.price,
        departureDate: tour.departureDate,
        departureDates: tour.departureDates,
        transportType: tour.transportType,
        accommodationLevel: tour.accommodationLevel,
        meals: tour.meals,
        highlights: tour.highlights,
        tags: tour.tags,
        isHot: tour.isHot,
        theme: tour.theme,
        suitableFor: tour.suitableFor,
        leisureLevel: tour.leisureLevel,
        season: tour.season,
        rating: tour.rating,
        groupSize: tour.groupSize,
        hotDepartureDates: tour.hotDepartureDates,
      })),
    [catalogSourceTours],
  );

  const focusResults = useCallback(() => {
    document.getElementById('tour-list')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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
    <div className="surface-panel rounded-[24px] border border-stone-200/80 bg-white/92 p-4 sm:rounded-[28px] sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 sm:mb-5 sm:gap-4">
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

      <div className="space-y-4 sm:space-y-5">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-700">
            <MapPin className="w-4 h-4 text-stone-500" />
            目的地
          </div>
          <div className="mobile-chip-scroll flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
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
            {visibleDestinations.map((dest) => (
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
            <Select
              value={selectedDestinationInOverflow ? filters.destination : 'more-destinations'}
              onValueChange={(value) => {
                if (value !== 'more-destinations') {
                  setFilters({ ...filters, destination: value });
                }
              }}
            >
              <SelectTrigger
                className={cn(
                  'h-10 w-[148px] shrink-0 rounded-full border px-4 text-sm shadow-none',
                  selectedDestinationInOverflow
                    ? selectedChipClass
                    : idleChipClass,
                )}
              >
                <SelectValue placeholder="更多目的地" />
              </SelectTrigger>
              <SelectContent className="max-h-[320px]">
                <SelectItem value="more-destinations">更多目的地</SelectItem>
                {overflowDestinations.map((dest) => (
                  <SelectItem key={dest} value={dest}>
                    {dest}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-700">
            <Calendar className="w-4 h-4 text-stone-500" />
            出发时间
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
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
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
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
      <div
        className={cn(
          'rounded-[28px] border border-stone-200/80 bg-stone-50/75 p-5 sm:p-6',
          isMobile && 'rounded-none border-0 bg-transparent p-0 shadow-none',
        )}
      >
        <div
          className={cn(
            'mb-5 flex flex-wrap items-center justify-between gap-3',
            isMobile && 'sr-only',
          )}
        >
          <h3 className="text-lg font-semibold text-stone-900">更多筛选</h3>
          <Button
            variant="ghost"
            className="rounded-full px-3 text-stone-500 hover:bg-white hover:text-stone-900"
            onClick={() => setShowFilters(false)}
          >
            收起
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
            <SelectTrigger className="h-11 rounded-2xl border-stone-200 bg-white sm:h-10">
                <SelectValue placeholder="全部平台" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部平台</SelectItem>
                {sourceOptions.map((source) => (
                  <SelectItem key={source.name} value={source.name}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: source.color || '#78716c' }}
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
            <SelectTrigger className="h-11 rounded-2xl border-stone-200 bg-white sm:h-10">
                <SelectValue placeholder="全部天数" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部天数</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}天
                  </SelectItem>
                ))}
                <SelectItem value={LONG_TRIP_DURATION_VALUE.toString()}>10天以上</SelectItem>
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
            <SelectTrigger className="h-11 rounded-2xl border-stone-200 bg-white sm:h-10">
                <SelectValue placeholder="全部主题" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部主题</SelectItem>
                {themeOptions.map((theme) => (
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
            <SelectTrigger className="h-11 rounded-2xl border-stone-200 bg-white sm:h-10">
                <SelectValue placeholder="全部目的地" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部目的地</SelectItem>
                {destinationOptions.map((dest) => (
                  <SelectItem key={dest} value={dest}>
                    {dest}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_1fr]">
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              出发日期范围
            </label>
            <div className="rounded-[22px] border border-stone-200 bg-white p-4">
              <div className="mb-3 text-sm text-stone-500">
                {dateRangeLabel ||
                  (filters.departureDate
                    ? `${formatDateLabel(filters.departureDate, today)} 及之前`
                    : '当前为全部日期')}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'h-10 gap-2 rounded-full border-stone-200 bg-white px-4 text-stone-700',
                        (filters.departureDateStart || filters.departureDateEnd) &&
                          'border-stone-300 bg-stone-50 text-stone-900',
                      )}
                    >
                      <Calendar className="w-4 h-4 text-stone-500" />
                      {dateRangeLabel || '自定义日期'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[calc(100vw-2rem)] rounded-[18px] border-stone-200 p-2 shadow-xl sm:w-auto"
                    align={isMobile ? 'center' : 'start'}
                  >
                    <CalendarComponent
                      mode="range"
                      numberOfMonths={isMobile ? 1 : 2}
                      locale={zhCN}
                      weekStartsOn={1}
                      selected={{
                        from: filters.departureDateStart
                          ? fromDateInputValue(filters.departureDateStart)
                          : undefined,
                        to: filters.departureDateEnd
                          ? fromDateInputValue(filters.departureDateEnd)
                          : undefined,
                      }}
                      formatters={{
                        formatCaption: (date) =>
                          `${date.getFullYear()}年${date.getMonth() + 1}月`,
                        formatWeekdayName: (date) =>
                          ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
                      }}
                      labels={{
                        labelNext: () => '下个月',
                        labelPrevious: () => '上个月',
                      }}
                      onSelect={(range) => {
                        if (!range?.from) return;

                        const start = toDateInputValue(range.from);
                        const end = range.to
                          ? toDateInputValue(range.to)
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
      <AiRecommendPanel
        tours={aiCandidateTours}
        toursLoading={loading || catalogLoading}
        activeFilters={effectiveFilters}
        searchQuery={searchQuery}
        result={aiRecommendationResult}
        request={aiSearchRequest}
        clearVersion={aiClearVersion}
        onResultChange={setAiRecommendationResult}
        onFocusResults={focusResults}
      />

      <div className="mb-6">
        {heroDestinations.length > 0 && (
          <div className="mb-4 rounded-[24px] border border-stone-200/80 bg-white/80 px-4 py-3 text-sm text-stone-600">
            <span className="font-medium text-stone-900">当前热门目的地：</span>{' '}
            {heroDestinations.join(' · ')}
          </div>
        )}
        {commonFilters}

        {!isMobile && showFilters && (
          <div className="mt-4">
            {advancedFilters}
          </div>
        )}

        {isMobile && (
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetContent side="bottom" className="h-[92dvh] max-h-[92dvh] gap-0 rounded-t-[28px] border-stone-200 bg-stone-50 p-0">
              <SheetHeader className="border-b border-stone-200 bg-white px-4 pb-4 pt-3">
                <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-stone-300" />
                <SheetTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  更多筛选
                </SheetTitle>
                <SheetDescription className="pr-8 leading-5">
                  常用筛选已经放在首屏，这里保留更细的条件
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-4 [-webkit-overflow-scrolling:touch]">
                {advancedFilters}
              </div>
              <div className="flex gap-3 border-t border-stone-200 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3">
                <Button variant="outline" className="h-11 flex-1 rounded-2xl border-stone-200 bg-white" onClick={resetFilters}>
                  重置全部
                </Button>
                <Button
                  className="h-11 flex-1 rounded-2xl bg-stone-900 hover:bg-stone-800"
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
                setFilters({
                  ...filters,
                  sortBy:
                    value === 'price_asc' ||
                    value === 'price_desc' ||
                    value === 'new'
                      ? value
                      : 'hot',
                })
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
                <SelectItem value="new">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    新上线优先
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {aiRecommendationResult && aiRecommendationResult.items.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm">
              <Sparkles className="h-4 w-4 text-stone-500" />
              <span>AI 已置顶 {aiRecommendedCount} 条建议</span>
              {hiddenAiRecommendationCount > 0 && (
                <span className="text-xs text-stone-500">
                  {hiddenAiRecommendationCount} 条被当前筛选隐藏
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 rounded-full px-2 text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  clearAiRecommendation();
                }}
              >
                清除
              </Button>
            </div>
          )}

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
              {hasPriceFilter && (
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
                    ? dateRangeLabel
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
                  {filters.duration === LONG_TRIP_DURATION_VALUE ? '10天以上' : `${filters.duration}天`}
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
          {shouldRenderLoadMore && (
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
            {emptyStateTitle}
          </h3>
          <p className="mx-auto max-w-xl text-stone-500">{emptyStateDescription}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {waterfallTours.map((tour) => {
              const recommendation = aiRecommendationByTourId.get(tour.id);

              return (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  onClick={() => handleCardClick(tour)}
                  recommendationReason={recommendation?.reason}
                  recommendationRank={recommendation?.rank}
                />
              );
            })}
          </div>

          {shouldRenderLoadMore && (
            <div ref={loadMoreRef} className="flex items-center justify-center py-8">
              {isLoadingMore || loadingMore ? (
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

          {!shouldRenderLoadMore && displayTours.length > INITIAL_LOAD_COUNT && (
            <div className="py-8 text-center text-sm text-stone-400">
              已加载全部 {displayTours.length.toLocaleString()} 条结果
            </div>
          )}
        </>
      )}

      <TourDetailModal
        summaryTour={selectedSummaryTour}
        resolvedTour={resolvedTour}
        status={detailStatus}
        error={detailError}
        loading={detailLoading}
        onClose={handleCloseTour}
      />
    </section>
  );
}
