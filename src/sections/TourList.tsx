import { useState, useMemo, useEffect } from 'react';
import type { Tour, FilterState } from '@/types/tour';
import { useTours } from '@/hooks/use-tours';
import { TourCard } from './TourCard';
import { TourDetailModal } from './TourDetailModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  X,
  MapPin,
  Calendar,
  ArrowUpDown,
  Flame,
  Sparkles,
  Star,
  RefreshCw,
  WifiOff,
} from 'lucide-react';

// 回退到本地数据
import { tours as localTours, sources, destinations, themes } from '@/data/tours';

export function TourList() {
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    destination: '',
    minPrice: null,
    maxPrice: null,
    duration: null,
    source: '',
    departureDate: '',
    theme: '',
    sortBy: 'hot',
  });
  const [useApi, setUseApi] = useState(true);

  const { tours: apiTours, loading, error, total, fetchTours } = useTours();

  // 首次加载API数据
  useEffect(() => {
    if (useApi) {
      fetchTours(filters);
    }
  }, [useApi]);

  // 当筛选条件变化时重新获取
  const maxPriceAll = useMemo(() => {
    const data = useApi && apiTours.length > 0 ? apiTours : localTours;
    return Math.max(...data.map((t) => t.price), 5000);
  }, [apiTours, useApi]);

  const [priceRange, setPriceRange] = useState<number[]>([0, maxPriceAll]);

  // 更新价格范围上限
  useEffect(() => {
    setPriceRange([0, maxPriceAll]);
  }, [maxPriceAll]);

  const displayTours = useMemo(() => {
    if (useApi && apiTours.length > 0) {
      return apiTours;
    }
    // 本地筛选
    let result = localTours.filter((tour) => {
      if (filters.destination && !tour.destination.includes(filters.destination)) return false;
      if (filters.source && tour.source !== filters.source) return false;
      if (filters.theme && tour.theme !== filters.theme) return false;
      if (filters.departureDate && tour.departureDate < filters.departureDate) return false;
      if (tour.price < priceRange[0] || tour.price > priceRange[1]) return false;
      if (filters.duration && tour.duration !== filters.duration) return false;
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
        result.sort((a, b) => (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0) || b.reviewCount - a.reviewCount);
        break;
      case 'new':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
    }

    return result;
  }, [useApi, apiTours, filters, priceRange]);

  const activeFilterCount = [
    filters.destination,
    filters.source,
    filters.theme,
    filters.departureDate,
    filters.duration,
    priceRange[0] > 0 || priceRange[1] < maxPriceAll,
  ].filter(Boolean).length;

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* 数据模式切换 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {error && useApi && (
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50">
              <WifiOff className="w-3 h-3" />
              API 不可用，已回退到本地数据
            </Badge>
          )}
          {loading && (
            <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300 bg-blue-50">
              <RefreshCw className="w-3 h-3 animate-spin" />
              加载中...
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">数据来源:</span>
          <button
            onClick={() => setUseApi(!useApi)}
            className={`text-xs px-2 py-1 rounded-full transition-colors ${
              useApi
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {useApi ? 'API实时' : '本地静态'}
          </button>
          {useApi && (
            <button
              onClick={() => fetchTours(filters)}
              className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="w-3 h-3 inline mr-1" />
              刷新
            </button>
          )}
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <Button
            variant="outline"
            className={`gap-2 ${showFilters ? 'bg-slate-100' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            筛选
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown className="w-4 h-4 text-slate-500" />
            <Select
              value={filters.sortBy}
              onValueChange={(v) => {
                const newFilters = { ...filters, sortBy: v as FilterState['sortBy'] };
                setFilters(newFilters);
                if (useApi) fetchTours(newFilters);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">
                  <span className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    热门优先
                  </span>
                </SelectItem>
                <SelectItem value="new">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    最新上线
                  </span>
                </SelectItem>
                <SelectItem value="price_asc">
                  <span className="flex items-center gap-2">价格从低到高</span>
                </SelectItem>
                <SelectItem value="price_desc">
                  <span className="flex items-center gap-2">价格从高到低</span>
                </SelectItem>
                <SelectItem value="rating">
                  <span className="flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-yellow-500" />
                    评分最高
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">筛选条件</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-500"
                onClick={() => {
                  const reset: FilterState = {
                    destination: '',
                    minPrice: null,
                    maxPrice: null,
                    duration: null,
                    source: '',
                    departureDate: '',
                    theme: '',
                    sortBy: 'hot',
                  };
                  setFilters(reset);
                  setPriceRange([0, maxPriceAll]);
                  if (useApi) fetchTours(reset);
                }}
              >
                <X className="w-4 h-4 mr-1" />
                清除全部
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  目的地
                </label>
                <Select
                  value={filters.destination || 'all'}
                  onValueChange={(v) => {
                    const newFilters = { ...filters, destination: v === 'all' ? '' : v };
                    setFilters(newFilters);
                    if (useApi) fetchTours(newFilters);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="全部目的地" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部目的地</SelectItem>
                    {destinations.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  <Search className="w-3.5 h-3.5 inline mr-1" />
                  来源站点
                </label>
                <Select
                  value={filters.source || 'all'}
                  onValueChange={(v) => {
                    const newFilters = { ...filters, source: v === 'all' ? '' : v };
                    setFilters(newFilters);
                    if (useApi) fetchTours(newFilters);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="全部来源" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部来源</SelectItem>
                    {sources.map((s) => (
                      <SelectItem key={s.name} value={s.name}>
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">旅行主题</label>
                <Select
                  value={filters.theme || 'all'}
                  onValueChange={(v) => {
                    const newFilters = { ...filters, theme: v === 'all' ? '' : v };
                    setFilters(newFilters);
                    if (useApi) fetchTours(newFilters);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="全部主题" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部主题</SelectItem>
                    {themes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  最早出发
                </label>
                <Input
                  type="date"
                  value={filters.departureDate}
                  onChange={(e) => {
                    const newFilters = { ...filters, departureDate: e.target.value };
                    setFilters(newFilters);
                    if (useApi) fetchTours(newFilters);
                  }}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  价格区间：￥{priceRange[0]} - ￥{priceRange[1]}
                </label>
                <Slider
                  value={priceRange}
                  max={maxPriceAll}
                  step={50}
                  onValueChange={setPriceRange}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">行程天数</label>
                <Select
                  value={filters.duration?.toString() || 'all'}
                  onValueChange={(v) => {
                    const newFilters = {
                      ...filters,
                      duration: v === 'all' ? null : parseInt(v),
                    };
                    setFilters(newFilters);
                    if (useApi) fetchTours(newFilters);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="全部天数" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部天数</SelectItem>
                    {[2, 3, 4, 5, 6, 7].map((d) => (
                      <SelectItem key={d} value={d.toString()}>
                        {d} 天
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 结果统计 */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          共找到 <span className="font-semibold text-slate-800">{useApi ? total : displayTours.length}</span> 个旅行团
          {useApi && apiTours.length > 0 && (
            <span className="text-xs text-slate-400 ml-2">(API数据)</span>
          )}
          {!useApi && (
            <span className="text-xs text-slate-400 ml-2">(本地静态数据)</span>
          )}
        </p>
        {activeFilterCount > 0 && (
          <div className="flex gap-2 flex-wrap">
            {filters.destination && (
              <Badge variant="outline" className="gap-1">
                {filters.destination}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => {
                    const newFilters = { ...filters, destination: '' };
                    setFilters(newFilters);
                    if (useApi) fetchTours(newFilters);
                  }}
                />
              </Badge>
            )}
            {filters.source && (
              <Badge variant="outline" className="gap-1">
                {filters.source}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => {
                    const newFilters = { ...filters, source: '' };
                    setFilters(newFilters);
                    if (useApi) fetchTours(newFilters);
                  }}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* 卡片列表 */}
      {displayTours.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">未找到匹配的旅行团</h3>
          <p className="text-slate-500">尝试调整筛选条件，发现更多精彩线路</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTours.map((tour) => (
            <TourCard
              key={tour.id}
              tour={tour}
              onClick={() => setSelectedTour(tour)}
            />
          ))}
        </div>
      )}

      {/* 详情弹窗 */}
      <TourDetailModal
        tour={selectedTour}
        onClose={() => setSelectedTour(null)}
      />
    </section>
  );
}
