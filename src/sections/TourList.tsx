// 数据加载链：loadInitial（分页首屏）→ loadMorePages（滚动懒加载）；分片失败时才回退 loadCatalog 全量列表
// 筛选/排序/瀑布流、AI 推荐叠加、滚动监听加载更多
import { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import type {
  AiRecommendationCandidate,
  AiRecommendationItem,
  AiRecommendationResult,
  TourIndexEntry,
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
import { toursIndexSchema, toursListSchema, toursPageSchema } from '@/lib/runtime-schemas';
import { isDisplayableTour } from '@/lib/tour-filter';
import { compareRecommended, getEffectiveDepartureDates, getUpcomingDates } from '@/lib/tour-recommendation';
import { addCalendarDays, todayCalendarDate, toCalendarDate } from '@/lib/calendar-date';
import { DESTINATION_TIER_META, PRIMARY_DESTINATION_TIERS, groupDestinationsByTier } from '@/lib/destination-tiers';
import { getDeparturePlan } from '@/lib/tour-facts';
import { extractQueryContext, getSearchRelevance, type QuerySearchContext } from '@/lib/search-concepts';
import {
  findTourDeepLinkResolution,
  inflateTourSummaryFromIndexEntry,
  readTourDeepLink,
} from '@/lib/tour-deeplink';
import { useTourDetail } from '@/hooks/use-tour-detail';
import { computePriceStats, sliderToPrice, priceToSlider } from '@/lib/price-slider';
import { useIsMobile } from '@/hooks/use-mobile';
import { trackEvent } from '@/lib/analytics';
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

// 数据加载核心 hook：index 负责筛选与全量语料，chunk 负责展示，全量列表仅在分片加载失败时兜底。
function useToursData() {
  const [tours, setTours] = useState<TourSummary[]>([]);
  const [indexTours, setIndexTours] = useState<TourIndexEntry[]>([]);
  const [catalogTours, setCatalogTours] = useState<TourSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasPageChunks, setHasPageChunks] = useState(true);
  // 顺序链游标（响应式镜像）：loadedPageCount 每次成功落片 +1，totalPageCount 首屏确定。
  // 只用于渲染判断，真正的推进仍以 ref 为准，避免异步竞态读旧值。
  const [loadedPageCount, setLoadedPageCount] = useState(1);
  const [totalPageCount, setTotalPageCount] = useState(Number.POSITIVE_INFINITY);
  const loadedPagesRef = useRef<Set<number>>(new Set());
  const inFlightPagesRef = useRef<Set<number>>(new Set());
  // 顺序链的下一片号：与 localTours.length 解耦。分片含重复/空片时
  // floor(len/24) 会指回已加载分片，导致"哨兵不前进 + 转圈不止"的死循环。
  const nextPageRef = useRef(1);
  const totalPagesRef = useRef(Number.POSITIVE_INFINITY);
  const zeroAddStrikesRef = useRef(0);
  const seenTourIdsRef = useRef<Set<string>>(new Set());
  const hasPageChunksRef = useRef(true);
  const catalogLoadedRef = useRef(false);
  const catalogRequestRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(false);

  const syncLoadingMoreState = useCallback(() => {
    setLoadingMore(inFlightPagesRef.current.size > 0);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadCatalog = useCallback(() => {
    if (catalogLoadedRef.current) return Promise.resolve();
    if (catalogRequestRef.current) return catalogRequestRef.current;

    catalogRequestRef.current = (async () => {
      try {
        const listRes = await fetch(getDataUrl('tours-list.json'));
        if (!listRes.ok) {
          throw new Error(`Failed to load tours catalog: ${listRes.status}`);
        }
        const data = toursListSchema.parse(await listRes.json());
        if (!mountedRef.current) return;
        catalogLoadedRef.current = true;
        setCatalogTours(data);
        setTotal(data.length);
      } catch {
        if (mountedRef.current) {
          setCatalogTours([]);
        }
      } finally {
        catalogRequestRef.current = null;
      }
    })();

    return catalogRequestRef.current;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      try {
        const indexPromise = fetch(getDataUrl('tours-index.json'))
          .then(async (indexRes) => {
            if (!indexRes.ok) {
              throw new Error(`Failed to load tours index: ${indexRes.status}`);
            }
            return toursIndexSchema.parse(await indexRes.json());
          })
          .catch(() => [] as TourIndexEntry[]);

        void indexPromise.then((indexData) => {
          if (cancelled || indexData.length === 0) return;
          setIndexTours(indexData);
          setTotal(indexData.length);
        });

        const pageRes = await fetch(getDataUrl('tours-page-0.json'));
        if (cancelled) return;
        if (!pageRes.ok) {
          throw new Error(`Failed to load first tours page: ${pageRes.status}`);
        }
        const pageData = toursPageSchema.parse(await pageRes.json());
        if (cancelled) return;
        setTours(pageData.items);
        setTotal(pageData.meta.total);
        loadedPagesRef.current.add(0);
        seenTourIdsRef.current = new Set(pageData.items.map((tour: TourSummary) => tour.id));
        nextPageRef.current = 1;
        totalPagesRef.current = Math.ceil(pageData.meta.total / PAGE_SIZE);
        setLoadedPageCount(1);
        setTotalPageCount(totalPagesRef.current);
        zeroAddStrikesRef.current = 0;
        hasPageChunksRef.current = true;
        setHasPageChunks(true);
        setLoading(false);
      } catch {
        try {
          const fallbackRes = await fetch(getDataUrl('tours-list.json'));
          if (cancelled) return;
          const data = toursListSchema.parse(await fallbackRes.json());
          if (cancelled) return;
          catalogLoadedRef.current = true;
          setIndexTours(data.map((tour, index) => ({
            id: tour.id,
            title: tour.title,
            source: tour.source,
            destination: tour.destination,
            duration: tour.duration,
            price: tour.price,
            bookingUrl: tour.bookingUrl,
            departureDate: tour.departureDate,
            departureDates: tour.departureDates,
            hotDepartureDates: tour.hotDepartureDates,
            transportType: tour.transportType,
            accommodationLevel: tour.accommodationLevel,
            meals: tour.meals,
            highlights: tour.highlights,
            tags: tour.tags,
            isHot: tour.isHot,
            isNew: tour.isNew,
            isFlashSale: tour.isFlashSale,
            theme: tour.theme,
            leisureLevel: tour.leisureLevel,
            rating: tour.rating,
            groupSize: tour.groupSize,
            suitableFor: tour.suitableFor,
            season: tour.season,
            geo: tour.geo,
            page: Math.floor(index / PAGE_SIZE),
          })));
          setTours(data);
          setCatalogTours(data);
          setTotal(data.length);
          seenTourIdsRef.current = new Set(data.map((tour) => tour.id));
          hasPageChunksRef.current = false;
          setHasPageChunks(false);
          setLoading(false);
        } catch {
          if (!cancelled) {
            setTours([]);
            setCatalogTours([]);
            setLoading(false);
          }
        }
      }
    }
    loadInitial();
    return () => { cancelled = true; };
  }, [loadCatalog]);

  // 返回值 = 本次是否真的发起了分片请求（false 表示空转：已加载/加载中/越界）。
  // 底部哨兵据此判断"链是否还在推进"，避免空转时仍然拉动 visibleCount 造成贴底转圈。
  const loadMorePages = useCallback(async (neededPage: number): Promise<boolean> => {
    if (!hasPageChunksRef.current) return false;
    if (loadedPagesRef.current.has(neededPage)) return false;
    if (inFlightPagesRef.current.has(neededPage)) return false;

    // 请求越过分片总数：数据链已到头，收敛而不是反复打 404
    if (neededPage >= totalPagesRef.current) {
      hasPageChunksRef.current = false;
      setHasPageChunks(false);
      return false;
    }

    inFlightPagesRef.current.add(neededPage);
    syncLoadingMoreState();
    try {
      const res = await fetch(getDataUrl('tours-page-' + neededPage + '.json'));
      if (!res.ok) {
        throw new Error(`Failed to load page ${neededPage}: ${res.status}`);
      }
      const pageData = toursPageSchema.parse(await res.json());
      loadedPagesRef.current.add(neededPage);
      setLoadedPageCount(loadedPagesRef.current.size);
      const seenIds = seenTourIdsRef.current;
      const nextItems = pageData.items.filter((tour: TourSummary) => !seenIds.has(tour.id));
      for (const tour of nextItems) seenIds.add(tour.id);
      setTours((prev) => prev.concat(nextItems));
      if (neededPage >= nextPageRef.current) {
        nextPageRef.current = neededPage + 1;
      }

      // 分片与索引不一致（重复/空片）时零新增是常态信号：连续多片零新增
      // 说明顺序链已无法推进，熔断防止底部哨兵无限转圈。
      if (nextItems.length === 0) {
        zeroAddStrikesRef.current += 1;
        if (zeroAddStrikesRef.current >= ZERO_ADD_STRIKE_LIMIT) {
          hasPageChunksRef.current = false;
          setHasPageChunks(false);
        }
      } else {
        zeroAddStrikesRef.current = 0;
      }
      return true;
    } catch {
      hasPageChunksRef.current = false;
      setHasPageChunks(false);
      return false;
    } finally {
      inFlightPagesRef.current.delete(neededPage);
      syncLoadingMoreState();
    }
  }, [syncLoadingMoreState]);

  return {
    tours,
    indexTours,
    catalogTours,
    loading,
    loadingMore,
    total,
    loadMorePages,
    loadedPagesRef,
    nextPageRef,
    loadedPageCount,
    totalPageCount,
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
  return addCalendarDays(dateString, days) ?? dateString;
}

// 本地日历日输入值（date picker 语义），不是 UTC 日期。
function toDateInputValue(date: Date) {
  return toCalendarDate(date);
}

function fromDateInputValue(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

const PAGE_SIZE = 24;
const INITIAL_LOAD_COUNT = 24;
// 连续 N 片零新增即熔断顺序分片链
const ZERO_ADD_STRIKE_LIMIT = 3;
// 底部哨兵连续 N 次空转（无片可加载）即判定链停摆，停止渲染哨兵
const SENTINEL_NOOP_STRIKE_LIMIT = 2;
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
  hideExpired: true,
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

type TourCatalogEntry = TourSummary | TourIndexEntry;
const searchCorpusCache = new WeakMap<TourCatalogEntry, string>();

function getTourSearchCorpus(tour: TourCatalogEntry) {
  const cached = searchCorpusCache.get(tour);
  if (cached) return cached;

  const corpus = [
    'searchText' in tour ? tour.searchText : undefined,
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
  tour: TourCatalogEntry,
  search: QuerySearchContext,
) {
  return getSearchRelevance(tour.title.toLowerCase(), getTourSearchCorpus(tour), search);
}

function compareToursBySortMode(
  sortBy: FilterState['sortBy'],
  a: TourCatalogEntry,
  b: TourCatalogEntry,
) {
  switch (sortBy) {
    case 'price_asc':
      return a.price - b.price;
    case 'price_desc':
      return b.price - a.price;
    case 'soon': {
      // 统一走日历日语义：UTC 的 toISOString 在东八区会把"今天"前移一天，
      // 与展示层的 today 基准不一致，排序与徽标因此互相矛盾。
      const todayStr = todayCalendarDate();
      const aNext = getUpcomingDates(a as TourSummary, todayStr)[0] ?? '';
      const bNext = getUpcomingDates(b as TourSummary, todayStr)[0] ?? '';
      if (aNext && bNext && aNext !== bNext) return aNext.localeCompare(bNext);
      if (aNext && !bNext) return -1;
      if (!aNext && bNext) return 1;
      return a.price - b.price;
    }
    case 'hot':
      return compareRecommended(a, b, RECOMMENDED_TITLE_HINTS);
    case 'new':
      return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    default:
      return 0;
  }
}

function getDynamicHeroDestinations(tours: TourCatalogEntry[]) {
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

function getDestinationOptions(tours: TourCatalogEntry[]) {
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

function getThemeOptions(tours: TourCatalogEntry[]) {
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

function getSourceOptions(tours: TourCatalogEntry[]) {
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
  onClearSearch: () => void;
}

export function TourList({ searchQuery, aiSearchRequest, onClearSearch }: TourListProps) {
  const {
    tours: localTours,
    indexTours,
    catalogTours,
    loading,
    loadingMore,
    total,
    loadMorePages,
    nextPageRef,
    loadedPageCount,
    totalPageCount,
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
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD_COUNT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadMoreTimerRef = useRef<number | null>(null);
  const viewVersionRef = useRef(0);
  // 哨兵空转熔断：loadMorePages 连续返回 false（无片可加载）达到上限即判定
  // 链已停摆，令 shouldRenderLoadMore 收敛为 false，兜底杜绝贴底转圈。
  const sentinelNoopStrikesRef = useRef(0);
  const [sentinelStalled, setSentinelStalled] = useState(false);
// filters 为主控筛选状态；activeFilters 同步已激活条件，供 AI 面板使用
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('tour-favorites') || '[]')); } catch { return new Set(); }
  });
  const [sliderValues, setSliderValues] = useState<number[]>(DEFAULT_SLIDER_VALUES);
  const [aiClearVersion, setAiClearVersion] = useState(0);
  const [aiRecommendationResult, setAiRecommendationResult] =
    useState<AiRecommendationResult | null>(null);
  // 流式增量推荐：模型还在逐条生成时，先把已写完整的那部分摆出来。
  // 与 aiRecommendationResult 分开存，避免半成品覆盖正式结果（正式结果一到
  // 就清空它）。只在"正在搜索、还没有正式结果"时接管列表。
  const [aiPreviewKind, setAiPreviewKind] = useState<'candidates' | 'ranking' | 'reasons' | undefined>();
  const [aiStreamingItems, setAiStreamingItems] = useState<AiRecommendationItem[]>([]);
  const previousAiSearchRequestIdRef = useRef<number | null>(null);
  // 全量语料池：优先用 tours-index.json 膨胀出的全量语料（4034 条、约 5MB），
  // 避免为搜索/筛选/AI 下载 20MB 的 tours-list.json；分片失败兜底时才落到 catalogTours/localTours。
  // 膨胀时保留 page 字段，waterfall 的分片懒加载依赖它定位候选所在分页。
  const indexCorpusTours = useMemo(
    () =>
      indexTours.length > 0
        ? indexTours.map((entry) => ({ ...inflateTourSummaryFromIndexEntry(entry), page: entry.page }))
        : ([] as Array<TourSummary & { page: number }>),
    [indexTours],
  );
  const catalogSourceTours = indexCorpusTours.length > 0
    ? indexCorpusTours
    : catalogTours.length > 0
      ? catalogTours
      : localTours;
  const loadedTourById = useMemo(() => {
    const entries = catalogTours.length > 0 ? catalogTours : localTours;
    return new Map(entries.map((tour) => [tour.id, tour]));
  }, [catalogTours, localTours]);
  const deepLinkTarget = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return readTourDeepLink(window.location.search);
  }, []);
  const deepLinkResolution = useMemo(
    () =>
      deepLinkTarget
        ? findTourDeepLinkResolution(deepLinkTarget, [localTours, catalogTours], indexTours)
        : null,
    [catalogTours, deepLinkTarget, indexTours, localTours],
  );
  const deepLinkIndexTour = useMemo(() => {
    if (!deepLinkResolution) return null;
    return indexTours.find((tour) => tour.id === deepLinkResolution.tourId) ?? null;
  }, [deepLinkResolution, indexTours]);
  const deepLinkLoadedTour = useMemo(() => {
    if (!deepLinkResolution) return null;

    for (const collection of [localTours, catalogTours]) {
      const match = collection.find((tour) => tour.id === deepLinkResolution.tourId);
      if (match) return match;
    }

    return null;
  }, [catalogTours, deepLinkResolution, localTours]);
  const deepLinkTour = useMemo(() => {
    return deepLinkLoadedTour ?? (deepLinkIndexTour ? inflateTourSummaryFromIndexEntry(deepLinkIndexTour) : null);
  }, [deepLinkIndexTour, deepLinkLoadedTour]);
  const deepLinkRequestedPageRef = useRef<number | null>(null);

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
  const activeFilterCount = [
    effectiveFilters.destination,
    effectiveFilters.source,
    effectiveFilters.theme,
    effectiveFilters.departureDate || effectiveFilters.departureDateStart || effectiveFilters.departureDateEnd,
    effectiveFilters.duration,
    hasPriceFilter,
  ].filter(Boolean).length;

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

  // 目的地按"近郊 / 省内 / 国内"分层：用户问的是"周末近点还是走远点"，
  // 而不是"广州、云南、华东、三亚"这几个层级不同的词怎么排。归类不确定的一律进下拉。
  const destinationTiers = useMemo(
    () => groupDestinationsByTier(destinationOptions),
    [destinationOptions],
  );
  const visibleDestinations = useMemo(() => {
    // 分组标签 + 每组最多 6 个，和下方 chips 的渲染口径保持一致；
    // 超出部分统一进"更多目的地"下拉，保证每个目的地都能被选到。
    const shown = PRIMARY_DESTINATION_TIERS.flatMap((tier) => destinationTiers[tier].slice(0, 6));
    return shown.length > 0 ? shown : destinationOptions.slice(0, VISIBLE_DESTINATION_COUNT);
  }, [destinationOptions, destinationTiers]);
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
  const searchContext = useMemo(() => extractQueryContext(searchQuery), [searchQuery]);
  const hasNaturalLanguageQuery =
    normalizedSearchQuery.length >= 8 || searchContext.concepts.length + searchContext.residues.length >= 2;
  const isAiSearchMode = Boolean(aiRecommendationResult) || aiStreamingItems.length > 0;
  // 流式增量生效中：还没有正式结果，但模型已经吐出若干条完整推荐。
  // 这时候不再算"搜索中"，直接按已有条目切到置顶长尾视图，
  // 让用户第一时间看到模型挑出来的线路。
  const isStreamingAiPartials =
    !aiRecommendationResult && aiStreamingItems.length > 0;
  // 搜索阶段：请求已发出、首条结果还没落地。此时列表保持原样，不被搜索词收窄/清空；
  // 等首条结果落地后再切到置顶长尾视图（模式切换本身会把可见条数重置）。
  const isAiSearching = Boolean(
    aiSearchRequest && !aiRecommendationResult && !isStreamingAiPartials,
  );
  const isIndexDrivenView = Boolean(normalizedSearchQuery) || activeFilterCount > 0 || isAiSearchMode || isAiSearching;
  const resultSourceTours = isIndexDrivenView ? catalogSourceTours : localTours;
  // 搜索阶段沿用清空搜索前的视图：不按搜索词收窄，也不套用被搜索词带出来的过滤条件。
  const searchStageFilters = useMemo<FilterState>(
    () => ({
      ...effectiveFilters,
      destination: '',
      source: '',
      theme: '',
      departureDate: '',
      departureDateStart: '',
      departureDateEnd: '',
      duration: null,
      minPrice: null,
      maxPrice: null,
    }),
    [effectiveFilters],
  );

  const aiRecommendedCount = useMemo(
    () =>
      aiRecommendationResult?.items.filter(
        (item) => Boolean(item.reason) || item.recommendationTier === 'ai-brief',
      ).length ?? 0,
    [aiRecommendationResult],
  );

  const aiRecommendationByTourId = useMemo(
    () =>
      new Map(
        // 流式增量期间用已生成的部分排序；正式结果一到就换成完整结果
        // （此时 aiStreamingItems 已被清空）。
        (aiStreamingItems.length > 0 ? aiStreamingItems : aiRecommendationResult?.items ?? []).map((item, index) => [
          item.tourId,
          { ...item, rank: index + 1 },
        ]),
      ),
    [aiRecommendationResult, aiStreamingItems],
  );
  const displayTours = useMemo(() => {
    if (resultSourceTours.length === 0) return [];

    // 搜索阶段沿用清空前的视图：不按搜索词收窄，也不套用被搜索词带出来的过滤条件。
    // 预览不代表请求完成：首条到达后仍沿用生成前的筛选，避免中途切换列表。
    // 正式结果落地后恢复页面筛选和长尾相关性排序。
    const keepSearchStageView = Boolean(aiSearchRequest && !aiRecommendationResult);
    const queryForRanking = keepSearchStageView ? '' : normalizedSearchQuery;
    const activeDisplayFilters = keepSearchStageView ? searchStageFilters : effectiveFilters;
    const result = resultSourceTours.filter((tour) => {
      if (!isDisplayableTour(tour)) {
        return false;
      }

      const isAiRecommendedTour = aiRecommendationByTourId.has(tour.id);

      // AI 模式：AI 选中的方案置顶展示；其余线路全部保留在长尾里（相关的
      // 排前面，其余按当前排序跟上），保证置顶段之后能继续下滑浏览全部线路。
      if (isAiSearchMode && isAiRecommendedTour) {
        return true;
      }

      if (queryForRanking && !isAiSearchMode && !isAiRecommendedTour) {
        const relevance = getTourSearchRelevance(tour, searchContext);
        const minRelevance = hasNaturalLanguageQuery ? 4 : 12;

        if (relevance < minRelevance) {
          return false;
        }
      }

      if (
        activeDisplayFilters.destination &&
        !tour.destination.includes(activeDisplayFilters.destination)
      ) {
        return false;
      }

      if (activeDisplayFilters.source && tour.source !== activeDisplayFilters.source) {
        return false;
      }

      if (activeDisplayFilters.theme && tour.theme !== activeDisplayFilters.theme) {
        return false;
      }

      const activeDateFilter = isAiSearching ? null : dateFilter;
      if (activeDateFilter) {
        const candidateDates = getEffectiveDepartureDates(tour);
        if (candidateDates.length === 0) {
          return false;
        }

        if (activeDateFilter.mode === 'exact' && !candidateDates.includes(activeDateFilter.date)) {
          return false;
        }

        if (
          activeDateFilter.mode === 'within' &&
          !candidateDates.some((date) => date >= today && date <= activeDateFilter.date)
        ) {
          return false;
        }

        if (
          activeDateFilter.mode === 'after' &&
          !candidateDates.some((date) => date >= activeDateFilter.date)
        ) {
          return false;
        }

        if (activeDateFilter.mode === 'range') {
          const inRange = candidateDates.some((date) => {
            if (activeDateFilter.start && date < activeDateFilter.start) {
              return false;
            }
            if (activeDateFilter.end && date > activeDateFilter.end) {
              return false;
            }
            return true;
          });
          if (!inRange) {
            return false;
          }
        }
      }

      if (activeDisplayFilters.minPrice !== null && tour.price < activeDisplayFilters.minPrice) {
        return false;
      }

      if (activeDisplayFilters.maxPrice !== null && tour.price > activeDisplayFilters.maxPrice) {
        return false;
      }

      if (
        activeDisplayFilters.duration === LONG_TRIP_DURATION_VALUE &&
        tour.duration < LONG_TRIP_DURATION_VALUE
      ) {
        return false;
      }

      if (
        activeDisplayFilters.duration &&
        activeDisplayFilters.duration !== LONG_TRIP_DURATION_VALUE &&
        tour.duration !== activeDisplayFilters.duration
      ) {
        return false;
      }

      if (activeDisplayFilters.hideExpired) {
        const allDates = getEffectiveDepartureDates(tour as TourSummary);
        if (allDates.length > 0 && !allDates.some((d) => d >= today)) return false;
      }

      return true;
    });

    if (queryForRanking) {
      // AI 模式下长尾也按相关性排序：置顶段之后继续下滑就是“越来越宽”的相关候选。
      // 相关性必须在排序前算一次：直接塞进比较器会为每条线路重复计算
      // O(n log n) 次，实测 6483 条从 28ms 涨到 143ms，正好压在点搜索那一帧。
      const relevanceByTour = new Map<TourCatalogEntry, number>();
      for (const tour of result) {
        relevanceByTour.set(tour, getTourSearchRelevance(tour, searchContext));
      }
      const relevanceOf = (tour: TourCatalogEntry) => relevanceByTour.get(tour) ?? 0;
      result.sort((a, b) =>
        relevanceOf(b) - relevanceOf(a) ||
        compareToursBySortMode(filters.sortBy, a, b),
      );
    } else {
      result.sort((a, b) => compareToursBySortMode(filters.sortBy, a, b));
    }

    if (aiRecommendationByTourId.size > 0) {
      const pinned: TourCatalogEntry[] = [];
      const rest: TourCatalogEntry[] = [];

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
    aiSearchRequest,
    aiRecommendationResult,
    isAiSearchMode,
    isAiSearching,
    searchStageFilters,
    dateFilter,
    effectiveFilters,
    filters.sortBy,
    hasNaturalLanguageQuery,
    resultSourceTours,
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
  const clearAiRecommendation = useCallback(() => {
    clearStoredAiChatState();
    setAiRecommendationResult(null);
    // 新一轮/清空时也要撤掉流式增量，否则会残留上一轮的部分推荐。
    setAiStreamingItems([]);
    setAiClearVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    if (aiSearchRequest) {
      previousAiSearchRequestIdRef.current = aiSearchRequest.id;
      return;
    }

    if (previousAiSearchRequestIdRef.current !== null) {
      previousAiSearchRequestIdRef.current = null;
      clearAiRecommendation();
    }
  }, [aiSearchRequest, clearAiRecommendation]);

  const visibleDisplayCandidates = useMemo(
    () => displayTours.slice(0, visibleCount),
    [displayTours, visibleCount],
  );
  const waterfallTours = useMemo(
    () =>
      visibleDisplayCandidates
        .map((tour) => loadedTourById.get(tour.id))
        .filter((tour): tour is TourSummary => Boolean(tour)),
    [loadedTourById, visibleDisplayCandidates],
  );
  const hasMoreLoadedResults = visibleCount < displayTours.length;
  const unfilteredDisplayableCount = useMemo(
    () => catalogSourceTours.filter((tour) => isDisplayableTour(tour)).length,
    [catalogSourceTours],
  );
  const defaultResultCount =
    unfilteredDisplayableCount > displayTours.length
      ? unfilteredDisplayableCount
      : Math.max(total, displayTours.length);
  const displayResultCount = isIndexDrivenView ? displayTours.length : defaultResultCount;
  // 数据状态：让用户知道"这些结果里有多少现在真的能报"。这不是营销数字，
  // 而是回答"站里的班期是不是旧的"。只统计结构化班期，不猜。
  const departureHealth = useMemo(() => {
    let bookable = 0;
    let expired = 0;
    for (const tour of displayTours) {
      const plan = getDeparturePlan(tour as TourSummary, today);
      if (plan.status === 'scheduled') bookable += 1;
      else if (plan.status === 'expired') expired += 1;
    }
    return { bookable, expired, total: displayTours.length };
  }, [displayTours, today]);
  // 远端链是否还能推进：只看"顺序链的下一片是否还在分片总数内"，
  // 不再用 localTours.length（原始加载数）比对展示数——两者口径不同
  // （一个含被过滤噪音、一个不含），会长期为真并让底部哨兵一直转圈。
  const hasMoreRemotePages =
    hasPageChunks &&
    catalogTours.length === 0 &&
    !sentinelStalled &&
    loadedPageCount < totalPageCount;
  const shouldRenderLoadMore = hasMoreLoadedResults || hasMoreRemotePages;

  useEffect(() => {
    if (!hasPageChunks || catalogTours.length > 0) return;

    const missingPages = new Set<number>();
    for (const tour of visibleDisplayCandidates) {
      if (loadedTourById.has(tour.id)) continue;
      if ('page' in tour && typeof tour.page === 'number') {
        missingPages.add(tour.page);
      }
    }

    for (const page of missingPages) {
      void loadMorePages(page);
    }
  }, [
    catalogTours.length,
    hasPageChunks,
    loadMorePages,
    loadedTourById,
    visibleDisplayCandidates,
  ]);

  useLayoutEffect(() => {
    if (!deepLinkTarget) return;

    const targetPage = deepLinkResolution?.page ?? null;

    if (deepLinkTour) {
      if (selectedSummaryTour !== deepLinkTour) {
        selectTour(deepLinkTour);
      }
    }

    if (targetPage !== null && deepLinkRequestedPageRef.current !== targetPage) {
      deepLinkRequestedPageRef.current = targetPage;
      void loadMorePages(targetPage);
    }
  }, [deepLinkResolution, deepLinkTarget, deepLinkTour, loadMorePages, selectTour, selectedSummaryTour]);
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

      if (hasPageChunksRef.current && catalogTours.length === 0 && loadedPageCount < totalPageCount) {
        const nextPage = nextPageRef.current;
        const viewVersion = viewVersionRef.current;

        setIsLoadingMore(true);
        void loadMorePages(nextPage).then((started) => {
          if (viewVersionRef.current !== viewVersion) {
            setIsLoadingMore(false);
            return;
          }

          // 只有真的发起了分片请求才推进 visibleCount。空转（已加载/越界）时
          // 不再拉动可见数，否则哨兵会一直贴底并无限转圈。
          if (started) {
            sentinelNoopStrikesRef.current = 0;
            setVisibleCount((current) => current + PAGE_SIZE);
          } else {
            sentinelNoopStrikesRef.current += 1;
            if (sentinelNoopStrikesRef.current >= SENTINEL_NOOP_STRIKE_LIMIT) {
              setSentinelStalled(true);
            }
          }
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
      loadedPageCount,
      totalPageCount,
      nextPageRef,
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

  // 这里只跟随"用户意图"变化，不能跟随"是否已有数据"变化。
  // 之前用 isAiSearching，而它会在拿到首条流式预览时变 false，于是 key 走了
  // plain → ai-searching → plain → ai，每变一次下面的 effect 就把 visibleCount
  // 重置回初始值，列表从顶部重新加载——用户看到的就是"不停刷新闪动"。
  const displayContextKey = [
    isAiSearchMode || isAiSearching ? 'ai' : 'plain',
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

// 点击卡片后调用 selectTour 异步加载详情，触发 TourDetailModal
  const handleCardClick = (tour: TourSummary) => {
    try {
      const recent = JSON.parse(localStorage.getItem('tour-recent') || '[]').filter((id: string) => id !== tour.id);
      localStorage.setItem('tour-recent', JSON.stringify([tour.id, ...recent].slice(0, 12)));
    } catch { /* ignore storage failures */ }
    trackEvent('tour_detail_open', { tourId: tour.id, source: tour.source });
    selectTour(tour);
  };
  const toggleFavorite = (tour: TourSummary) => setFavoriteIds((current) => {
    const next = new Set(current);
    if (next.has(tour.id)) next.delete(tour.id); else next.add(tour.id);
    try { localStorage.setItem('tour-favorites', JSON.stringify([...next])); } catch { /* ignore */ }
    trackEvent(next.has(tour.id) ? 'tour_favorite_add' : 'tour_favorite_remove', { tourId: tour.id });
    return next;
  });

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
  const aiCandidatesReady = indexTours.length > 0 || catalogTours.length > 0 || localTours.length >= total;

  const focusResults = useCallback(() => {
    const list = document.getElementById('tour-list');
    // Do not pull readers back to the top when streaming finishes.
    if (list && list.getBoundingClientRect().top > window.innerHeight) {
      list.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const isBudgetSelected = (min: number, max: number) => {
    const tolerance = 80;
    return (
      Math.abs(priceRange[0] - min) <= tolerance &&
      Math.abs(priceRange[1] - max) <= tolerance
    );
  };

  const selectedChipClass =
    'border-stone-300 bg-stone-900 text-white hover:border-stone-900 hover:bg-stone-900';
  const idleChipClass =
    'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900';

  const commonFilters = (
    <div className="surface-panel rounded-[24px] border border-stone-200/80 bg-white/92 p-4 sm:rounded-[28px] sm:p-6">
      <div className={cn("mb-4 flex flex-wrap items-start justify-between gap-3 sm:mb-5 sm:gap-4", isMobile && "hidden")}>
        <div>
          <h3 className="text-base font-semibold text-stone-900">按你的节奏选</h3>
          <p className="mt-1 text-xs text-stone-500">筛选即时生效，无需再次搜索</p>
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
            aria-expanded={showFilters}
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
          <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <MapPin className="w-4 h-4 text-stone-500" />
              想去哪一片
            </span>
            <span className="text-xs text-stone-400">按距离分组，选一个就等于按目的地筛好了</span>
          </div>
          <div className="mobile-chip-scroll flex flex-wrap items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => setFilters({ ...filters, destination: '' })}
              className={cn(
                'h-10 shrink-0 rounded-full border px-4 text-sm transition-colors',
                !filters.destination ? selectedChipClass : idleChipClass,
              )}
            >
              全部目的地
            </button>
            {PRIMARY_DESTINATION_TIERS.map((tier) => {
              const tierDestinations = destinationTiers[tier].slice(0, 6);
              if (tierDestinations.length === 0) return null;
              return (
                <div key={tier} className="flex min-w-0 flex-wrap items-center gap-2">
                  {/* 必须 flex-wrap：子元素都是 shrink-0，默认 nowrap 会让整组按内容
                      宽度铺开（实测手机单组 1008px，父容器仅 324px），而外层
                      overflow 是 visible，整排按钮会直接捅出卡片右边界。 */}
                  <span
                    className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-500"
                    title={DESTINATION_TIER_META[tier].hint}
                  >
                    {DESTINATION_TIER_META[tier].label}
                  </span>
                  {tierDestinations.map((dest) => (
                    <button
                      key={dest}
                      type="button"
                      aria-pressed={filters.destination === dest}
                      onClick={() =>
                        setFilters({
                          ...filters,
                          destination: filters.destination === dest ? '' : dest,
                        })
                      }
                      className={cn(
                        'h-10 shrink-0 rounded-full border px-4 text-sm transition-colors',
                        filters.destination === dest ? selectedChipClass : idleChipClass,
                      )}
                    >
                      {dest}
                    </button>
                  ))}
                </div>
              );
            })}
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
          <div className="grid grid-flow-col auto-cols-max grid-rows-2 gap-2 overflow-x-auto pb-1 sm:auto-cols-fr sm:grid-flow-row sm:grid-cols-3 sm:grid-rows-none sm:pb-0 lg:grid-cols-6 mobile-chip-scroll sm:overflow-visible">
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
          <div className="grid grid-flow-col auto-cols-max grid-rows-2 gap-2 overflow-x-auto pb-1 sm:auto-cols-fr sm:grid-flow-row sm:grid-cols-3 sm:grid-rows-none sm:pb-0 lg:grid-cols-6 mobile-chip-scroll sm:overflow-visible">
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
    <section data-testid="tour-results" className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-8 lg:px-8">
      <AiRecommendPanel
        tours={aiCandidateTours}
        toursLoading={loading || !aiCandidatesReady}
        activeFilters={effectiveFilters}
        searchQuery={searchQuery}
        result={aiRecommendationResult}
        request={aiSearchRequest}
        clearVersion={aiClearVersion}
        searchingVersion={aiSearchRequest?.id ?? 0}
        mobileOverlayActive={Boolean(selectedSummaryTour) || (isMobile && showFilters)}
        onResultChange={setAiRecommendationResult}
        onFocusResults={focusResults}
        onPartialItems={(items, kind) => { setAiStreamingItems(items); setAiPreviewKind(kind); }}
      />

      <div className="mb-6">
        {isMobile ? (
          <div data-testid="mobile-route-header" className="flex min-h-11 items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight text-stone-950">挑一条心动的线路</h2>
            <Button variant="outline" className="h-11 shrink-0 gap-1.5 rounded-full border-stone-200 bg-white px-3 text-xs"
              aria-expanded={showFilters} aria-haspopup="dialog" onClick={() => setShowFilters(true)}>
              <SlidersHorizontal className="h-3.5 w-3.5" />筛选{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
            </Button>
          </div>
        ) : (
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div><p className="mb-2 text-[10px] font-semibold tracking-[0.22em] text-orange-700">广州出发 · 各平台线路</p><h2 className="text-3xl font-semibold tracking-tight text-stone-950">挑一条心动的线路</h2><p className="mt-2 text-sm text-stone-500">先看能不能报、哪天走，再看价格和细节。点开任意一条都能看到来源平台的原文。</p></div>
            <a href="#" className="inline-flex min-h-11 items-center gap-1 text-xs text-stone-600 hover:text-orange-800">返回搜索 ↑</a>
          </div>
        )}
        {heroDestinations.length > 0 && <div className="sr-only">当前热门目的地：{heroDestinations.join('、')}</div>}
        {/* AI 模式下这条搜索条是冗余的：AI 面板已经写明本轮问的是什么，清除也在面板的「清空」里。
            再加一条「正在查找：xxx / 清除搜索」等于同一屏把同一件事说两遍，
            还把「挑一条心动的线路」标题挤出首屏。 */}
        {searchQuery && !(isAiSearchMode || isAiSearching) && <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-orange-900/10 bg-orange-50/70 px-4 py-3"><p className="min-w-0 break-words text-sm text-orange-950">正在查找：<strong>{searchQuery}</strong></p><Button variant="ghost" className="h-11 shrink-0 rounded-xl text-orange-900" onClick={onClearSearch}><X className="mr-1 h-4 w-4" />清除搜索</Button></div>}
        {!isMobile && commonFilters}

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
                  按需调整目的地、时间和预算，筛选即时生效
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-4 [-webkit-overflow-scrolling:touch]">
                {commonFilters}
                <div className="mt-4">{advancedFilters}</div>
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

        <div className="mt-2 sm:mt-5 mobile-chip-scroll -mx-4 flex items-center gap-2 overflow-x-auto bg-transparent px-4 sm:mx-0 sm:flex-wrap sm:items-start sm:justify-between sm:gap-3 sm:overflow-visible sm:px-0 max-sm:sticky max-sm:top-[64px] max-sm:z-30 max-sm:-mb-1 max-sm:py-2 max-sm:bg-[rgba(247,246,243,0.94)] max-sm:backdrop-blur-xl">
          <div className="flex shrink-0 items-center gap-2 sm:flex-wrap">
            <ArrowUpDown className="w-4 h-4 shrink-0 text-stone-500" />
            <Select
              value={filters.sortBy}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  sortBy:
                    value === 'price_asc' ||
                    value === 'price_desc' ||
                    value === 'new' ||
                    value === 'soon'
                      ? value
                      : 'hot',
                })
              }
            >
              <SelectTrigger className="h-10 w-[148px] shrink-0 rounded-full border-stone-200 bg-white sm:w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">
                  <span className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    综合推荐
                  </span>
                </SelectItem>
                <SelectItem value="soon">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    最近可出发优先
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
            <label className="flex shrink-0 items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(filters.hideExpired)}
                onChange={(e) => setFilters({ ...filters, hideExpired: e.target.checked })}
                className="h-4 w-4 shrink-0 rounded border-stone-300"
              />
              隐藏已过期团期
            </label>
          </div>

          {aiRecommendationResult && aiRecommendationResult.items.length > 0 && (
            <div className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm sm:flex-wrap">
              <Sparkles className="h-4 w-4 text-stone-500" />
              <span>{aiStreamingItems.length ? (aiPreviewKind === 'candidates' ? `已筛出 ${aiStreamingItems.length} 条候选` : `推荐顺序已就绪 · ${aiStreamingItems.length} 条`) : `AI 已置顶 ${aiRecommendedCount} 条建议`}</span>
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
            <div className="flex shrink-0 items-center gap-2 whitespace-nowrap sm:flex-wrap">
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

      {displayResultCount > 0 && (
        <div role="status" aria-live="polite" aria-atomic="true" className="mb-5 flex items-center justify-between text-sm text-stone-500">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">共 {displayResultCount.toLocaleString()} 条<div className="sr-only">结果</div>{departureHealth.bookable > 0 && (<><span className="text-stone-300">·</span><span className="text-stone-600">{departureHealth.bookable.toLocaleString()} 条有未来班期</span></>)}{departureHealth.expired > 0 && (<><span className="text-stone-300">·</span><span className="text-amber-700">{departureHealth.expired.toLocaleString()} 条班期已结束</span></>)}{!filters.hideExpired && departureHealth.expired > 0 && (<span className="text-xs text-stone-400">（已包含已过期班期）</span>)}</span>
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
        <div role="status" className="surface-panel rounded-[28px] border border-stone-200/80 bg-white/90 px-5 py-16 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-800"><MapPin className="h-6 w-6" /></div>
          <h3 className="mb-2 text-lg font-semibold text-stone-700">
            {emptyStateTitle}
          </h3>
          <p className="mx-auto max-w-xl text-sm leading-7 text-stone-500">{emptyStateDescription}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {activeFilterCount > 0 && <Button variant="outline" className="h-11 rounded-xl" onClick={resetFilters}>重置筛选</Button>}
            {searchQuery && <Button className="h-11 rounded-xl bg-orange-900 hover:bg-orange-800" onClick={onClearSearch}>清除搜索，浏览全部</Button>}
          </div>
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
                  recommendationPending={Boolean(recommendation && aiStreamingItems.length && aiPreviewKind !== 'candidates' && !recommendation.reason)}
                  recommendationRank={recommendation?.rank}
                  recommendationTier={recommendation?.recommendationTier}
                  recommendationSignals={recommendation?.matchedSignals}
                  isFavorite={favoriteIds.has(tour.id)}
                  onToggleFavorite={() => toggleFavorite(tour)}
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

          {!shouldRenderLoadMore && waterfallTours.length > INITIAL_LOAD_COUNT && (
            <div className="py-8 text-center text-sm text-stone-400">
              {sentinelStalled
                ? `已加载 ${waterfallTours.length.toLocaleString()} 条，暂时无法继续加载`
                : `已加载全部 ${displayResultCount.toLocaleString()} 条结果`}
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
        onClose={clearSelectedTour}
      />
    </section>
  );
}
