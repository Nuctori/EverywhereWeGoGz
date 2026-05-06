import { useState, useMemo, useEffect } from 'react';
import type { Tour, FilterState } from '@/types/tour';
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
} from 'lucide-react';

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

  // 计算价格分布，设置合理的Slider上限（P95或最高价的合理上限）
  const { maxPriceAll, priceStats } = useMemo(() => {
    const prices = localTours.map((t) => t.price).sort((a, b) => a - b);
    const max = Math.max(...prices);
    // Slider上限设为P95或10000的倍数，取较小值，避免极端高价拉长Slider
    const p95 = prices[Math.floor(prices.length * 0.95)] || max;
    const sliderMax = Math.min(Math.ceil(p95 / 1000) * 1000, Math.ceil(max / 1000) * 1000);
    return {
      maxPriceAll: sliderMax,
      priceStats: {
        min: prices[0],
        max: prices[prices.length - 1],
        p50: prices[Math.floor(prices.length * 0.5)],
        p95: p95,
      }
    };
  }, []);

  const [priceRange, setPriceRange] = useState<number[]>([0, maxPriceAll]);

  // 更新价格范围上限
  useEffect(() => {
    setPriceRange([0, maxPriceAll]);
  }, [maxPriceAll]);

  // 解析日期筛选条件
  const dateFilter = useMemo(() => {
    if (!filters.departureDate) return null;
    // 判断是"N天内"快捷筛选还是具体日期
    const today = new Date().toISOString().split('T')[0];
    const selected = filters.departureDate;
    if (selected === today) {
      // "今天" - 只显示今天出发的
      return { mode: 'exact' as const, date: today };
    }
    if (selected > today) {
      // 未来日期 - 表示"N天内出发"（<= 选中日期）
      return { mode: 'within' as const, date: selected };
    }
    // 过去的具体日期（不太可能，但兼容处理）- 表示"最早出发"
    return { mode: 'after' as const, date: selected };
  }, [filters.departureDate]);

  const displayTours = useMemo(() => {
    let result = localTours.filter((tour) => {
      if (filters.destination && !tour.destination.includes(filters.destination)) return false;
      if (filters.source && tour.source !== filters.source) return false;
      if (filters.theme && tour.theme !== filters.theme) return false;
      // 日期筛选
      if (dateFilter) {
        if (dateFilter.mode === 'exact' && tour.departureDate !== dateFilter.date) return false;
        if (dateFilter.mode === 'within' && tour.departureDate > dateFilter.date) return false;
        if (dateFilter.mode === 'after' && tour.departureDate < dateFilter.date) return false;
      }
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
  }, [filters, priceRange, dateFilter]);

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
                setFilters({ ...filters, sortBy: v as FilterState['sortBy'] });
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
                  setFilters({
                    destination: '',
                    minPrice: null,
                    maxPrice: null,
                    duration: null,
                    source: '',
                    departureDate: '',
                    theme: '',
                    sortBy: 'hot',
                  });
                  setPriceRange([0, maxPriceAll]);
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
                    setFilters({ ...filters, destination: v === 'all' ? '' : v });
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
                    setFilters({ ...filters, source: v === 'all' ? '' : v });
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
                    setFilters({ ...filters, theme: v === 'all' ? '' : v });
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
                  出发时间
                </label>
                {/* 快捷日期按钮 */}
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { label: '全部', value: '', mode: 'all' },
                    { label: '今天', value: new Date().toISOString().split('T')[0], mode: 'today' },
                    { label: '3天内', value: (() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split('T')[0]; })(), mode: 'within' },
                    { label: '7天内', value: (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; })(), mode: 'within' },
                    { label: '30天内', value: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })(), mode: 'within' },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setFilters({ ...filters, departureDate: opt.value })}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                        filters.departureDate === opt.value
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {/* 显示当前筛选状态 */}
                {filters.departureDate && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    显示 {filters.departureDate === new Date().toISOString().split('T')[0] 
                      ? '今天出发' 
                      : `至 ${filters.departureDate} 前出发`} 的产品
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  价格区间：￥{priceRange[0]} - ￥{priceRange[1]}
                  {priceStats.max > maxPriceAll && (
                    <span className="text-xs text-slate-400 ml-2">
                      (最高￥{priceStats.max.toLocaleString()})
                    </span>
                  )}
                </label>
                <Slider
                  value={priceRange}
                  max={maxPriceAll}
                  step={100}
                  onValueChange={setPriceRange}
                  className="mt-2"
                />
                {/* 快捷价格区间按钮 */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {[
                    { label: '全部', min: 0, max: maxPriceAll },
                    { label: '￥500以下', min: 0, max: 500 },
                    { label: '￥500-2000', min: 500, max: 2000 },
                    { label: '￥2000-5000', min: 2000, max: 5000 },
                    { label: '￥5000-10000', min: 5000, max: 10000 },
                    { label: '￥10000以上', min: 10000, max: maxPriceAll },
                  ].map((range) => (
                    <button
                      key={range.label}
                      onClick={() => setPriceRange([range.min, range.max])}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        priceRange[0] === range.min && priceRange[1] === range.max
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">行程天数</label>
                <Select
                  value={filters.duration?.toString() || 'all'}
                  onValueChange={(v) => {
                    setFilters({
                      ...filters,
                      duration: v === 'all' ? null : parseInt(v),
                    });
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
          共找到 <span className="font-semibold text-slate-800">{displayTours.length}</span> 个旅行团
          <span className="text-xs text-slate-400 ml-2">(本地静态数据)</span>
        </p>
        {activeFilterCount > 0 && (
          <div className="flex gap-2 flex-wrap">
            {filters.destination && (
              <Badge variant="outline" className="gap-1">
                {filters.destination}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setFilters({ ...filters, destination: '' })}
                />
              </Badge>
            )}
            {filters.source && (
              <Badge variant="outline" className="gap-1">
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
