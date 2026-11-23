import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowUpRight, Bus, Map, MapPinned, RefreshCw, X } from 'lucide-react';
import { useMapTours, type MapTourLocation } from '@/hooks/use-map-tours';
import { useBusRoutes } from '@/hooks/use-bus-routes';
import { useBusLines } from '@/hooks/use-bus-lines';
import { useTourDetail } from '@/hooks/use-tour-detail';
import { TourDetailModal } from './TourDetailModal';
import { MAP_TILE_PROVIDERS, wgs84ToGcj02, type MapTileProvider } from '@/lib/map-tile-pool';
import { busPointForProvider, wgs84PointForProvider } from '@/lib/bus-route-geometry';
import type { BusLine, BusLineStop, BusOriginCity, BusRoute, BusStation } from '@/types/bus';
import type { TourSummary } from '@/types/tour';

const DEFAULT_CENTER: L.LatLngExpression = [23.5, 113.5];
const DEFAULT_ZOOM = 5;
const MAP_MAX_ZOOM = 19;
const FULL_DETAIL_ZOOM = 11;
interface MapViewProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  embedded?: boolean;
}

function pointForProvider(place: MapTourLocation, provider: MapTileProvider): L.LatLngExpression {
  if (provider.coordinateSystem === 'gcj02' && isWithinChinaCoverage(place)) {
    return wgs84ToGcj02(place.latitude, place.longitude);
  }
  return [place.latitude, place.longitude];
}

function isWithinChinaCoverage(place: MapTourLocation) {
  return place.longitude >= 73 && place.longitude <= 135 && place.latitude >= 18 && place.latitude <= 54;
}

function placePrecisionLabel(place: Pick<MapTourLocation, 'level' | 'locality' | 'coordinateSource' | 'confidence' | 'precision'>) {
  const levelLabel = place.level === 'town' ? '镇/街道' : place.level === 'poi' ? '景区/地点' : place.level === 'city' ? '城市范围' : place.level === 'region' ? '区域范围' : place.level === 'country' ? '国家范围' : '';
  const sourceLabel = place.coordinateSource === 'osm'
    ? 'OSM POI'
    : place.coordinateSource === 'fallback'
    ? ''
    : place.coordinateSource === 'inferred' && place.confidence === 'low'
      ? '推断位置'
      : '';
  const precisionLabel = place.precision === 'approximate' ? '模糊定位' : '';
  return [place.locality, levelLabel, precisionLabel, sourceLabel].filter(Boolean).join(' · ');
}

function placeAddressLabel(place: Pick<MapTourLocation, 'address'>) {
  const address = place.address;
  if (!address) return '';
  return address.formatted || [
    address.province,
    address.city,
    address.district,
    address.locality,
    address.street,
    address.houseNumber,
  ].filter(Boolean).join(' · ');
}

type MarkerCandidate = {
  place: MapTourLocation;
  point: L.LatLngExpression;
  pixel: L.Point;
};

function fanOutMarkerPixels(candidates: MarkerCandidate[]) {
  const center = candidates.reduce(
    (sum, candidate) => new L.Point(sum.x + candidate.pixel.x, sum.y + candidate.pixel.y),
    new L.Point(0, 0),
  );
  center.x /= candidates.length;
  center.y /= candidates.length;
  const radius = candidates.length === 2 ? 18 : Math.min(72, Math.max(20, candidates.length * 8));
  const startAngle = candidates.length === 2 ? 0 : -Math.PI / 2;

  return [...candidates]
    .sort((left, right) => left.place.placeId.localeCompare(right.place.placeId))
    .map((candidate, index) => {
      const angle = startAngle + (index * Math.PI * 2) / candidates.length;
      return {
        ...candidate,
        pixel: new L.Point(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius),
      };
    });
}

function markerCollisionRadius(zoom: number) {
  // Keep the overview readable without collapsing an entire destination area
  // into one marker. Clusters remain selectable and full detail still unfolds
  // at FULL_DETAIL_ZOOM.
  if (zoom < 6) return 24;
  if (zoom < 8) return 22;
  return 14;
}

function maxIndependentMarkers(zoom: number) {
  if (zoom >= FULL_DETAIL_ZOOM) return Number.POSITIVE_INFINITY;
  return zoom >= 8 ? 12 : 8;
}

function MapTourCard({ tour, onClick }: { tour: TourSummary; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-stone-200 bg-white p-3 text-left shadow-sm transition hover:border-orange-300 hover:shadow-md"
      aria-label={`查看线路：${tour.title}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <MapPinned className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-5 text-stone-900 group-hover:text-orange-700">{tour.title}</p>
          <p className="mt-1 truncate text-xs text-stone-500">{tour.source} · {tour.duration}天 · {tour.departureDate || '班期待确认'}</p>
        </div>
        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-stone-400 transition group-hover:text-orange-600" />
      </div>
      <div className="mt-3 flex items-end justify-between border-t border-stone-100 pt-2.5">
        <span className="text-xs text-stone-400">参考价格</span>
        <span className="text-base font-semibold text-stone-950">¥{tour.price.toLocaleString()}</span>
      </div>
    </button>
  );
}

function PlaceToursPanel({
  place,
  tours,
  loading,
  error,
  onTourClick,
  onClose,
  onRetry,
  onLoadMore,
  hasMore,
  expanded,
}: {
  place: MapTourLocation | null;
  tours: TourSummary[];
  loading: boolean;
  error: string | null;
  onTourClick: (tour: TourSummary) => void;
  onClose: () => void;
  onRetry: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
  expanded: boolean;
}) {
  if (!place) return null;

  return (
    <aside
      className={expanded
        ? 'absolute inset-x-3 bottom-3 z-[1001] max-h-[45%] overflow-y-auto rounded-2xl border border-stone-200/90 bg-white/95 p-3 shadow-xl backdrop-blur sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-4 sm:w-[min(360px,38%)] sm:max-h-none'
        : 'absolute inset-x-3 bottom-3 z-[1001] max-h-[72%] overflow-y-auto rounded-2xl border border-stone-200/90 bg-white/95 p-3 shadow-xl backdrop-blur sm:bottom-4 sm:left-auto sm:right-4 sm:w-[min(280px,calc(100%_-_1.5rem))] sm:max-h-[calc(100%-2rem)]'}
      aria-label={`${place.name}旅行团`}
    >
      <div className="flex items-start justify-between gap-3 px-1 pb-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-orange-600">地点线路</p>
          <h3 className="mt-0.5 truncate text-base font-semibold text-stone-950">{place.label || place.name}</h3>
          <p className="mt-0.5 text-xs text-stone-500">{placePrecisionLabel(place)} · {place.tourCount} 条线路 · 点击卡片查看详情</p>
          {placeAddressLabel(place) && <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-stone-400">{placeAddressLabel(place)}</p>}
          {place.coordinateSource === 'osm' && <p className="mt-1 text-[10px] text-stone-400">地点数据：OpenStreetMap contributors</p>}
        </div>
        <button type="button" onClick={onClose} aria-label="关闭地点线路" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900">
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading && tours.length === 0 ? (
        <p className="px-1 py-5 text-sm text-stone-500">正在加载地点线路...</p>
      ) : error && tours.length === 0 ? (
        <div className="px-1 py-4 text-sm text-stone-500">
          <p>线路数据暂时不可用。</p>
          <button type="button" onClick={onRetry} className="mt-2 inline-flex items-center gap-1 text-orange-700 hover:text-orange-800"><RefreshCw className="h-3.5 w-3.5" /> 重试</button>
        </div>
      ) : tours.length === 0 ? (
        <p className="px-1 py-5 text-sm text-stone-500">这个地点暂时没有可展示的旅行团。</p>
      ) : (
        <div className="space-y-2">
          {error && <div className="rounded-xl bg-orange-50 px-3 py-2 text-xs text-orange-800">已显示前 {tours.length} 条线路，剩余线路加载失败。<button type="button" onClick={onRetry} className="ml-1 font-medium underline underline-offset-2">重试</button></div>}
          {tours.map((tour) => <MapTourCard key={tour.id} tour={tour} onClick={() => onTourClick(tour)} />)}
          {hasMore && <button type="button" onClick={onLoadMore} disabled={loading} className="flex w-full items-center justify-center rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-600 transition hover:border-orange-300 hover:text-orange-700 disabled:cursor-wait disabled:opacity-60">{loading ? '正在加载更多线路...' : `加载更多线路（剩余 ${Math.max(0, place.tourCount - tours.length)} 条）`}</button>}
        </div>
      )}
    </aside>
  );
}

function PlaceClusterPanel({
  places,
  expanded,
  onSelect,
  onClose,
}: {
  places: MapTourLocation[];
  expanded: boolean;
  onSelect: (place: MapTourLocation) => void;
  onClose: () => void;
}) {
  if (places.length === 0) return null;
  const sortedPlaces = [...places].sort((left, right) => right.tourCount - left.tourCount || (left.label || left.name).localeCompare(right.label || right.name));

  return (
    <aside
      className={expanded
        ? 'absolute inset-x-3 bottom-3 z-[1001] max-h-[55%] overflow-y-auto rounded-2xl border border-stone-200/90 bg-white/95 p-3 shadow-xl backdrop-blur sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-4 sm:w-[min(360px,38%)] sm:max-h-none'
        : 'absolute inset-x-3 bottom-3 z-[1001] max-h-[72%] overflow-y-auto rounded-2xl border border-stone-200/90 bg-white/95 p-3 shadow-xl backdrop-blur sm:bottom-4 sm:left-auto sm:right-4 sm:w-[min(280px,calc(100%_-_1.5rem))] sm:max-h-[calc(100%-2rem)]'}
      aria-label="相近地点"
    >
      <div className="flex items-start justify-between gap-3 px-1 pb-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-orange-600">相近地点</p>
          <h3 className="mt-0.5 text-base font-semibold text-stone-950">选择具体地点</h3>
          <p className="mt-0.5 text-xs text-stone-500">地图点位较密，先从这里选择目的地</p>
        </div>
        <button type="button" onClick={onClose} aria-label="关闭相近地点" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-1.5">
        {sortedPlaces.map((place) => (
          <button
            key={place.placeId}
            type="button"
            onClick={() => onSelect(place)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2 text-left transition-colors hover:border-orange-300 hover:bg-orange-50/60"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-stone-800">{place.label || place.name}</span>
              <span className="mt-0.5 block truncate text-[11px] text-stone-400">{placePrecisionLabel(place)}</span>
            </span>
            <span className="shrink-0 text-xs text-stone-400">{place.tourCount} 条线路</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function BusRoutePanel({
  origins,
  routes,
  detailLines,
  selectedRoute,
  onSelect,
  onSelectLine,
  onClose,
  expanded,
}: {
  origins: BusOriginCity[];
  routes: BusRoute[];
  detailLines: BusLine[];
  selectedRoute: BusRoute | null;
  onSelect: (route: BusRoute | null) => void;
  onSelectLine: (line: BusLine) => void;
  onClose: () => void;
  expanded: boolean;
}) {
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();
  // 注意：文件顶部从 lucide-react 引入了 Map 图标，这里不能用 `new Map()`
  // （会解析成图标组件）。城市索引按 cityId 存成普通对象即可。
  const originById = useMemo(() => {
    const index: Record<number, BusOriginCity> = {};
    origins.forEach((origin) => {
      index[origin.cityId] = origin;
    });
    return index;
  }, [origins]);
  const selectedOrigin = selectedRoute ? originById[selectedRoute.originCityId] : undefined;
  const grouped = useMemo(
    () => origins.map((origin) => ({
      origin,
      routes: routes.filter((route) => route.originCityId === origin.cityId),
    })),
    [origins, routes],
  );
  const crossBorderCount = useMemo(
    () => routes.filter((route) => route.destination.provinceCode !== '44').length,
    [routes],
  );
  const crossBorderNames = useMemo(
    () => [...new Set(routes
      .filter((route) => route.destination.provinceCode !== '44')
      .map((route) => route.destination.name))],
    [routes],
  );
  const selectedCrossBorder = selectedRoute ? selectedRoute.destination.provinceCode !== '44' : false;

  // 用户是带着"从哪到哪"来的：按城市名 / 县镇名 / 站点名 / 线路名搜，比如「永汉」。
  const cityPairMatches = useMemo(() => {
    if (!trimmedQuery) return [];
    return routes.filter((route) => {
      const origin = originById[route.originCityId];
      return (origin?.name ?? '').includes(trimmedQuery) || route.destination.name.includes(trimmedQuery);
    });
  }, [trimmedQuery, routes, originById]);

  const lineMatches = useMemo(() => {
    if (!trimmedQuery) return [];
    return detailLines.filter((line) => (
      line.name.includes(trimmedQuery)
      || (line.originCity ?? '').includes(trimmedQuery)
      || (line.destinationCity ?? '').includes(trimmedQuery)
      || line.stops.some((stop) => stop.name.includes(trimmedQuery))
    )).slice(0, 60);
  }, [trimmedQuery, detailLines]);

  if (routes.length === 0) return null;

  return (
    <aside
      className={expanded
        ? 'absolute inset-x-3 bottom-3 z-[1001] flex max-h-[45%] flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white/95 shadow-xl backdrop-blur sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-4 sm:w-[min(360px,38%)] sm:max-h-none'
        : 'absolute inset-x-3 bottom-3 z-[1001] flex max-h-[72%] flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white/95 shadow-xl backdrop-blur sm:bottom-4 sm:left-auto sm:right-4 sm:w-[min(280px,calc(100%_-_1.5rem))] sm:max-h-[calc(100%-2rem)]'}
      aria-label={selectedRoute ? `站点巴士线路：${selectedRoute.destination.name}` : '站点巴士线路列表'}
    >
      <div className="flex shrink-0 items-start justify-between gap-3 px-3 pb-2 pt-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-sky-600">站点巴士</p>
          <h3 className="mt-0.5 truncate text-base font-semibold text-stone-950">
            {selectedRoute
              ? `${selectedOrigin?.name ?? '出发城市'} → ${selectedRoute.destination.name}`
              : `${routes.length} 条可达线路`}
          </h3>
          <p className="mt-0.5 text-xs text-stone-500">
            {selectedRoute
              ? `${selectedRoute.destination.stationCount} 个到达站 · ${selectedOrigin?.stations.length ?? 0} 个出发站`
              : `广东省内 ${routes.length - crossBorderCount} 条 · 跨境/跨省 ${crossBorderCount} 条（灰虚线）`}
          </p>
          {selectedCrossBorder && (
            <span className="mt-1 inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
              跨境/跨省线路 · 非广东省内
            </span>
          )}
        </div>
        {selectedRoute && (
          <button
            type="button"
            onClick={onClose}
            aria-label="返回线路列表"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="shrink-0 px-3 pb-2">
        <label className="relative block">
          <span className="sr-only">搜索目的地、县镇或站点</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜目的地 / 县镇 / 站点，如 永汉"
            className="w-full rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-sky-300 focus:outline-none"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {trimmedQuery ? (
          <div className="space-y-3">
            <section>
              <p className="px-1 text-[11px] font-medium text-stone-500">
                城市对 · {cityPairMatches.length} 条
              </p>
              <div className="mt-1.5 space-y-1.5">
                {cityPairMatches.slice(0, 20).map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => onSelect(route)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2 text-left transition-colors hover:border-sky-300 hover:bg-sky-50/60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-stone-800">
                        {originById[route.originCityId]?.name ?? '出发城市'} → {route.destination.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-stone-400">
                        {route.destination.stationCount} 个到达站
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] font-medium text-sky-700">看站点</span>
                  </button>
                ))}
                {cityPairMatches.length === 0 && (
                  <p className="px-1 text-[11px] text-stone-400">没有匹配的城市对</p>
                )}
              </div>
            </section>
            <section>
              <p className="px-1 text-[11px] font-medium text-stone-500">
                具体线路 · {lineMatches.length} 条
              </p>
              <div className="mt-1.5 space-y-1.5">
                {lineMatches.map((line) => (
                  <button
                    key={line.id}
                    type="button"
                    onClick={() => onSelectLine(line)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2 text-left transition-colors hover:border-sky-300 hover:bg-sky-50/60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-stone-800">{line.name}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-stone-400">
                        {line.stops.filter((stop) => stop.role === 'board').length} 上车 ·{' '}
                        {line.stops.filter((stop) => stop.role === 'alight').length} 下车
                        {line.departTimes.length > 0 ? ` · ${line.departTimes.length} 班` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] font-medium text-sky-700">看线路</span>
                  </button>
                ))}
                {lineMatches.length === 0 && (
                  <p className="px-1 text-[11px] text-stone-400">没有经过「{trimmedQuery}」的具体线路</p>
                )}
              </div>
            </section>
          </div>
        ) : selectedRoute ? (
          <ol className="space-y-1.5">
            {selectedRoute.stations.slice(0, 80).map((station, index) => (
              <li key={station.id} className="flex items-start gap-2 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-50 text-[10px] font-semibold text-sky-700">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium text-stone-800">{station.name}</span>
                  {station.county && <span className="mt-0.5 block truncate text-[10px] text-stone-400">{station.county}</span>}
                </span>
              </li>
            ))}
            {selectedRoute.stations.length > 80 && (
              <li className="px-1 text-[11px] text-stone-400">仅展示前 80 个到达站，共 {selectedRoute.stations.length} 个。</li>
            )}
          </ol>
        ) : (
          <div className="space-y-3">
            {grouped.map(({ origin, routes: originRoutes }) => (
              <section key={origin.cityId}>
                <p className="px-1 text-[11px] font-medium text-stone-500">
                  {origin.name}出发 · {originRoutes.length} 条 · {origin.stations.length} 个上车点
                </p>
                <div className="mt-1.5 space-y-1.5">
                  {originRoutes.map((route) => (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => onSelect(route)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2 text-left transition-colors hover:border-sky-300 hover:bg-sky-50/60"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-stone-800">
                          {route.destination.name}
                          {route.destination.provinceCode !== '44' && (
                            <span className="ml-1.5 rounded-full bg-stone-100 px-1.5 py-0.5 align-middle text-[10px] font-normal text-stone-500">跨境/跨省</span>
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-stone-400">{route.destination.stationCount} 个上下车点</span>
                      </span>
                      <span className="shrink-0 text-[11px] font-medium text-sky-700">看站点</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <p className="shrink-0 border-t border-stone-100 px-3 py-2 text-[10px] leading-4 text-stone-400">
        粗蓝线=具体线路（乔巴士，按上车站→下车站逐站串起来）；细蓝线=城市对汇总（滴滴）；灰虚线=跨境/跨省
        {crossBorderNames.length > 0 ? `（${crossBorderNames.join('、')}）` : ''}。
        地图上：<span className="text-[#1dcc8c]">绿点=上车点</span>、<span className="text-[#ff754b]">橙点=下车点</span>。
        站点坐标来自对应数据源，底图切换时已做坐标系换算。
      </p>
    </aside>
  );
}

export function MapView({ expanded, onExpandedChange, embedded = false }: MapViewProps) {
  const {
    places,
    placesLoading,
    placesError,
    toursById,
    approximateTourCount,
    placeToursLoading,
    placeToursLoaded,
    placeToursComplete,
    placeToursError,
    fetchTours,
    fetchToursForPlace,
  } = useMapTours();
  const { selectedSummaryTour, resolvedTour, detailStatus, detailError, detailLoading, selectTour, clearSelectedTour } = useTourDetail();
  const [providerIndex, setProviderIndex] = useState(0);
  const [selectedPlace, setSelectedPlace] = useState<MapTourLocation | null>(null);
  const [clusterPlaces, setClusterPlaces] = useState<MapTourLocation[]>([]);
  const [tourLayerEnabled, setTourLayerEnabled] = useState(true);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [selectedBusLine, setSelectedBusLine] = useState<BusLine | null>(null);
  const [busLayerEnabled, setBusLayerEnabled] = useState(false);
  const [selectedBusRoute, setSelectedBusRoute] = useState<BusRoute | null>(null);
  const { data: busData, loading: busLoading, error: busError, retry: retryBusRoutes } = useBusRoutes(busLayerEnabled);
  const { data: busLineData } = useBusLines(busLayerEnabled);

  // 全部站点按角色去重：同一个站点会在多条线路里重复出现（清远、佛山同时被广州和江门覆盖），
  // 只画一次。既当上车点又当目的地的城市（广州/江门）按上车点算，避免同一点出现两种颜色。
  // 注意：文件顶部的 Map 是 lucide 图标，这里用普通对象做索引，不能写 new Map()。
  const busStationPoints = useMemo(() => {
    const byId: Record<number, { station: BusStation; role: 'pickup' | 'dropoff' }> = {};
    for (const origin of busData?.origins ?? []) {
      for (const station of origin.stations) byId[station.id] = { station, role: 'pickup' };
    }
    for (const route of busData?.routes ?? []) {
      for (const station of route.stations) {
        if (!byId[station.id]) byId[station.id] = { station, role: 'dropoff' };
      }
    }
    return Object.values(byId);
  }, [busData]);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const tileLoadCountRef = useRef(0);
  const tileErrorCountRef = useRef(0);
  const tileError = providerIndex >= MAP_TILE_PROVIDERS.length;
  const visiblePlaces = useMemo(() => places.filter((place) => place.tourCount > 0), [places]);
  const selectedTours = useMemo(() => {
    if (!selectedPlace) return [];
    return selectedPlace.tourIds.map((id) => toursById.get(id)).filter((tour): tour is TourSummary => Boolean(tour));
  }, [selectedPlace, toursById]);
  const selectedPlaceError = selectedPlace && placeToursError?.placeId === selectedPlace.placeId
    ? placeToursError.message
    : null;
  const selectedPlaceLoading = Boolean(selectedPlace && (
    !selectedPlaceError
    && (placeToursLoading === selectedPlace.placeId || !placeToursLoaded.has(selectedPlace.placeId))
  ));
  const selectedPlaceHasMore = Boolean(selectedPlace && !placeToursComplete.has(selectedPlace.placeId) && selectedTours.length < selectedPlace.tourCount);

  useEffect(() => {
    if (selectedPlace) void fetchToursForPlace(selectedPlace.placeId);
  }, [fetchToursForPlace, selectedPlace]);

  const openTourDetail = (tour: TourSummary) => {
    // The detail dialog is the next step in the same flow; do not leave the place panel competing with it.
    setSelectedPlace(null);
    selectTour(tour);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && expanded) onExpandedChange(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expanded, onExpandedChange]);

  useEffect(() => {
    if (!mapElementRef.current) return;
    const map = L.map(mapElementRef.current, { maxZoom: MAP_MAX_ZOOM, zoomControl: true, scrollWheelZoom: true, attributionControl: true });
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    mapRef.current = map;
    // 缩放层级决定站点巴士的地图表现：低倍只给汇总，近了才逐条画线、再近了才画站点。
    const syncZoom = () => setMapZoom(map.getZoom());
    map.on('zoomend', syncZoom);
    const resizeFrame = window.requestAnimationFrame(() => map.invalidateSize());
    return () => {
      map.off('zoomend', syncZoom);
      window.cancelAnimationFrame(resizeFrame);
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
    };
  }, [expanded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    tileLayerRef.current?.remove();
    tileLayerRef.current = null;
    if (providerIndex >= MAP_TILE_PROVIDERS.length) {
      return;
    }

    const provider = MAP_TILE_PROVIDERS[providerIndex];
    tileLoadCountRef.current = 0;
    tileErrorCountRef.current = 0;
    // 只有声明了 subdomains 的供应商才覆盖 Leaflet 默认值。显式传 undefined 会把
    // TileLayer 默认的 'abc' 覆盖掉，而 getTileUrl 每次都会调 _getSubdomain——
    // 切到无子域名的 OSM 镜像时就会抛 "Cannot read properties of undefined (reading 'length')"，
    // 整个地图层在 onAdd 阶段炸掉。
    const tileLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: MAP_MAX_ZOOM,
      ...(provider.subdomains ? { subdomains: provider.subdomains } : {}),
    });
    let active = true;
    let switched = false;
    const moveToNextProvider = () => {
      if (!active || switched) return;
      switched = true;
      setProviderIndex((current) => current === providerIndex ? current + 1 : current);
    };
    tileLayer.on('tileload', () => { tileLoadCountRef.current += 1; });
    tileLayer.on('tileerror', () => {
      tileErrorCountRef.current += 1;
      if (tileErrorCountRef.current >= 8) moveToNextProvider();
    });
    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;
    const fallbackTimer = window.setTimeout(() => {
      if (tileLoadCountRef.current === 0) moveToNextProvider();
    }, 8000);
    return () => {
      active = false;
      window.clearTimeout(fallbackTimer);
    };
  }, [expanded, providerIndex]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // 旅行团和站点巴士是两个独立图层，可以同时开；只有各自的开关关掉时才不画。
    if (!tourLayerEnabled) return;
    const markers = L.layerGroup().addTo(map);
    const provider = MAP_TILE_PROVIDERS[Math.min(providerIndex, MAP_TILE_PROVIDERS.length - 1)];
    const viewportPlaces = provider.coordinateSystem === 'gcj02' ? visiblePlaces.filter(isWithinChinaCoverage) : visiblePlaces;
    const viewportBounds = L.latLngBounds(viewportPlaces.map((place) => pointForProvider(place, provider)));
    // 巴士图层开着时视野由它负责（全国旅行团点位会让画面缩得太远），这里只渲染不抢镜头。
    if (viewportBounds.isValid() && !busLayerEnabled) {
      map.setMinZoom(3);
      map.fitBounds(viewportBounds.pad(0.12), { maxZoom: expanded ? 7 : 6 });
      // AMap's public raster endpoint returns blank tiles at z2; keep the preview on a usable zoom.
      if (map.getZoom() < 3) map.setZoom(3);
    }

    const renderMarkers = () => {
      markers.clearLayers();
      const zoom = map.getZoom();
      const maximumZoom = map.getMaxZoom();
      const atMaximumZoom = Number.isFinite(maximumZoom) && zoom >= maximumZoom;
      const atFullDetailZoom = atMaximumZoom || zoom >= FULL_DETAIL_ZOOM;
      mapElementRef.current?.setAttribute('data-map-zoom', String(zoom));
      mapElementRef.current?.setAttribute('data-map-max-zoom', String(maximumZoom));
      const collisionRadius = markerCollisionRadius(zoom);
      const independentMarkerLimit = atFullDetailZoom ? Number.POSITIVE_INFINITY : maxIndependentMarkers(zoom);
      if (atFullDetailZoom) setClusterPlaces((current) => current.length > 0 ? [] : current);
      const groups: Array<{ candidates: MarkerCandidate[]; pixel: L.Point }> = [];
      visiblePlaces.forEach((place) => {
        const point = pointForProvider(place, provider);
        const pixel = map.latLngToContainerPoint(point);
        const group = groups.find((candidate) => candidate.pixel.distanceTo(pixel) < collisionRadius);
        if (group) {
          group.candidates.push({ place, point, pixel });
          return;
        }
        groups.push({ candidates: [{ place, point, pixel }], pixel });
      });

      groups.forEach((group) => {
        // Overview zooms stay readable; detailed zooms progressively reveal distinct places.
        if (atFullDetailZoom || group.candidates.length <= independentMarkerLimit) {
          const candidates = group.candidates.length === 1 ? group.candidates : fanOutMarkerPixels(group.candidates);
          candidates.forEach((candidate) => {
            const { place } = candidate;
            const locationLabel = place.label || place.name;
            const markerPoint = group.candidates.length === 1
              ? candidate.point
              : map.containerPointToLatLng(candidate.pixel);
            const marker = L.marker(markerPoint, {
              icon: L.divIcon({
                className: 'destination-marker-icon',
                html: '<div style="height:20px;width:20px;border:3px solid white;border-radius:9999px;background:#ea580c;box-shadow:0 2px 8px rgba(28,25,23,.3)"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              }),
            });
            marker.options.title = locationLabel;
            marker.options.alt = `旅行团目的地：${locationLabel}`;
            marker.bindTooltip(`${locationLabel} · ${placePrecisionLabel(place)} · ${place.tourCount}条线路`, { direction: 'top', offset: [0, -8] });
            marker.on('click', () => {
              setClusterPlaces([]);
              setSelectedPlace(place);
              map.panTo(candidate.point, { animate: true, duration: 0.25 });
            });
            marker.addTo(markers);
          });
          return;
        }

        const clusterPlaces = group.candidates.map((candidate) => candidate.place);
        const clusterPoint = map.containerPointToLatLng(group.pixel);
        const clusterMarker = L.marker(clusterPoint, {
          icon: L.divIcon({
            className: 'destination-cluster-icon',
            html: `<div style="display:flex;height:30px;width:30px;align-items:center;justify-content:center;border:2px solid white;border-radius:9999px;background:#ea580c;color:white;font-size:11px;font-weight:700;box-shadow:0 3px 10px rgba(28,25,23,.28)">${clusterPlaces.length}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        });
        clusterMarker.options.title = `${clusterPlaces.length}个相近地点`;
        clusterMarker.options.alt = `选择${clusterPlaces.length}个相近旅行目的地`;
        clusterMarker.bindTooltip(`${clusterPlaces.length}个相近地点 · 点击选择`, { direction: 'top', offset: [0, -18] });
        clusterMarker.on('click', () => {
          setSelectedPlace(null);
          setClusterPlaces(clusterPlaces);
          map.panTo(clusterPoint, { animate: true, duration: 0.25 });
        });
        clusterMarker.addTo(markers);
      });
    };

    map.on('zoomend moveend', renderMarkers);
    renderMarkers();
    map.invalidateSize();
    return () => {
      map.off('zoomend moveend', renderMarkers);
      markers.remove();
    };
  }, [busLayerEnabled, expanded, providerIndex, tourLayerEnabled, visiblePlaces]);

  // 站点巴士图层：两城之间的弧线 + 城市端点。开关关闭时不创建任何图层。
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !busLayerEnabled || !busData) return;
    const provider = MAP_TILE_PROVIDERS[Math.min(providerIndex, MAP_TILE_PROVIDERS.length - 1)];
    const layer = L.layerGroup().addTo(map);
    const originById: Record<number, BusOriginCity> = {};
    busData.origins.forEach((origin) => {
      originById[origin.cityId] = origin;
    });

    // 已经有明细线路的城市对，就不再画"城市对汇总线"，避免同一对城市出现两层线。
    const detailedPairs = new Set<string>();
    for (const line of busLineData?.routes ?? []) {
      if (line.originCity && line.destinationCity) {
        detailedPairs.add(`${line.originCity}→${line.destinationCity}`);
      }
    }

    // 缩放分级：低倍只留城市级汇总，中倍出线路（限数量、淡一点），高倍才出站点点位。
    // 285 条线路 × 近 4000 个站点一次性画满既卡又糊，看不清任何一条。
    const zoom = map.getZoom();
    const showDetailLines = zoom >= 9;
    const showDetailStops = zoom >= 12;
    // 中倍只看"线网"，压低视觉权重；高倍才按正常粗细画。
    const detailWeight = zoom >= 11 ? 2.8 : 1.4;
    const detailOpacity = zoom >= 11 ? 0.9 : 0.42;
    const maxDetailLines = zoom >= 11 ? Number.POSITIVE_INFINITY : 80;
    const dimOthers = Boolean(selectedBusLine);
    const viewport = map.getBounds().pad(0.12);
    const inView = (lat: number, lng: number) => viewport.contains([lat, lng]);
    const mapCenter = map.getCenter();

    // 站点是这一层的主要信息：开关一开就能看到所有上下车点，放大后自然散开。
    if (showDetailStops) {
      busStationPoints.forEach(({ station, role }) => {
        if (!inView(station.lat, station.lng)) return;
        const dot = L.circleMarker(busPointForProvider(station, provider), {
          radius: 2.8,
          weight: 1,
          color: '#ffffff',
          fillColor: role === 'pickup' ? '#1dcc8c' : '#ff754b',
          fillOpacity: dimOthers ? 0.12 : 0.9,
          className: 'bus-station-dot',
        });
        dot.bindTooltip(`${role === 'pickup' ? '上车点' : '下车点'} · ${station.name}`, { direction: 'top', offset: [0, -4] });
        dot.addTo(layer);
        dot.getElement()?.setAttribute('data-station-role', role);
      });
    }

    busData.origins.forEach((origin) => {
      const point = busPointForProvider(origin, provider);
      const marker = L.circleMarker(point, {
        radius: 6,
        weight: 2,
        color: '#ffffff',
        fillColor: '#0284c7',
        fillOpacity: 1,
        className: 'bus-city-origin',
      });
      marker.bindTooltip(`${origin.name}出发 · ${origin.stations.length} 个上车点`, { direction: 'top', offset: [0, -8] });
      marker.on('click', () => {
        setSelectedPlace(null);
        setClusterPlaces([]);
        setSelectedBusRoute(null);
      });
      marker.addTo(layer);
      marker.getElement()?.setAttribute('data-bus-city', `${origin.name}（出发）`);
    });

    busData.routes.forEach((route) => {
      const origin = originById[route.originCityId];
      if (!origin) return;
      // 这一对城市已经有明细线路（乔巴士），汇总线就不画了。
      if (detailedPairs.has(`${origin.name}→${route.destination.name}`)) return;
      const from = busPointForProvider(origin, provider);
      const to = busPointForProvider(route.destination, provider);
      const selected = selectedBusRoute?.id === route.id;
      // 香港(81)/广西梧州(45) 是接口真实返回的跨境、跨省线路：保留，但用灰色虚线区分，
      // 免得和广东省内线路混在一起，看着像"广东巴士开出国"。
      const crossBorder = route.destination.provinceCode !== '44';
      const accent = crossBorder
        ? (selected ? '#475569' : '#94a3b8')
        : (selected ? '#0369a1' : '#0ea5e9');
      const restStyle: L.PolylineOptions = {
        color: accent,
        weight: crossBorder ? 1.3 : selected ? 3.2 : 1.6,
        opacity: dimOthers && !selected ? 0.08 : selected ? 0.95 : crossBorder ? 0.75 : 0.5,
        ...(crossBorder ? { dashArray: '6 6' } : {}),
      };
      // 目前只有「出发城市 → 目的城市」这一层数据，同一对城市其实有多条线路，
      // 所以这里只画一段城市对之间的连线（不串站点，避免假装成某一条线路的走向）；
      // 真实线路（route_id + 有序站点）要等线路级数据接进来再按线画。
      const line = L.polyline([[from[0], from[1]], [to[0], to[1]]], {
        ...restStyle,
        className: `bus-route-line${crossBorder ? ' bus-route-cross-border' : ''}`,
      });
      line.bindTooltip(
        `${origin.name} → ${route.destination.name} · ${route.destination.stationCount} 个上下车点${crossBorder ? ' · 跨境/跨省' : ''}`,
        { sticky: true },
      );
      line.on('mouseover', () => line.setStyle({ weight: crossBorder ? 2.2 : 2.8, opacity: 0.95 }));
      line.on('mouseout', () => line.setStyle(restStyle));
      line.on('click', () => {
        setSelectedPlace(null);
        setClusterPlaces([]);
        setSelectedBusRoute(route);
      });
      line.addTo(layer);
      line.getElement()?.setAttribute('data-bus-route', `${origin.name}→${route.destination.name}`);

      const endpoint = L.circleMarker(to, {
        radius: selected ? 5.5 : 3.4,
        weight: 1.5,
        color: '#ffffff',
        fillColor: accent,
        fillOpacity: 1,
        className: 'bus-city-endpoint',
      });
      endpoint.bindTooltip(
        `${route.destination.name} · ${route.destination.stationCount} 个上下车点${crossBorder ? ' · 跨境/跨省' : ''}`,
        { direction: 'top', offset: [0, -6] },
      );
      endpoint.on('click', () => {
        setSelectedPlace(null);
        setClusterPlaces([]);
        setSelectedBusRoute(route);
      });
      endpoint.addTo(layer);
      // 给端点和起点打上城市标记，测试和排查都能直接对上"这个点在画哪座城"。
      endpoint.getElement()?.setAttribute('data-bus-city', route.destination.name);
      endpoint.getElement()?.setAttribute('data-bus-province', route.destination.provinceCode);

      if (!selected) return;

      // 选中的线路把两组站点放大突出（底层已经画过全部站点，这里只是加一圈高亮）。
      const highlightStations = (stations: typeof origin.stations, kind: 'pickup' | 'dropoff') => {
        stations.forEach((station) => {
          const highlight = L.circleMarker(busPointForProvider(station, provider), {
            radius: 6,
            weight: 2,
            color: kind === 'pickup' ? '#1dcc8c' : '#ff754b',
            fillColor: '#ffffff',
            fillOpacity: 1,
            className: 'bus-station-highlight',
          });
          highlight.bindTooltip(
            `${kind === 'pickup' ? '上车点' : '下车点'} · ${station.name}`,
            { direction: 'top', offset: [0, -8] },
          );
          highlight.addTo(layer);
          highlight.getElement()?.setAttribute('data-station-role', kind);
        });
      };

      highlightStations(origin.stations, 'pickup');
      highlightStations(route.stations, 'dropoff');

      // 城市名常驻在点旁边：低缩放下海岸线被栅格瓦片简化，只有一个圆点没人分得清是哪。
      L.tooltip({ direction: 'right', offset: [8, 0], className: 'bus-city-label' })
        .setLatLng(from)
        .setContent(`${origin.name} · ${origin.stations.length} 个上车点`)
        .addTo(layer);
      L.tooltip({ direction: 'right', offset: [8, 0], className: 'bus-city-label' })
        .setLatLng(to)
        .setContent(`${route.destination.name} · ${route.destination.stationCount} 个上下车点`)
        .addTo(layer);
    });

    // 真实线路（乔巴士）：每条线路是一串有序站点，连线按"上车站 → 下车站"依次穿过它们。
    // 这与城市对汇总线不同——同一对城市会有好几条线，各自的站点并不相同。
    // 中倍只画离视野中心最近的若干条：285 条一起画就是一团糊线。
    const detailCandidates = (busLineData?.routes ?? [])
      .map((line) => ({
        line,
        points: line.stops.map((stop) => (
          line.coordinateSystem === 'wgs84'
            ? wgs84PointForProvider(stop, provider)
            : busPointForProvider(stop, provider)
        )),
      }))
      .filter(({ line, points }) => points.length >= 2 && (
        selectedBusLine?.id === line.id
        || (showDetailLines && line.stops.some((stop) => inView(stop.lat, stop.lng)))
      ))
      .sort((left, right) => {
        if (selectedBusLine?.id === left.line.id) return -1;
        if (selectedBusLine?.id === right.line.id) return 1;
        const anchor = (candidate: { line: BusLine }) => candidate.line.stops[0];
        const leftStop = anchor(left);
        const rightStop = anchor(right);
        const distance = (stop: BusLineStop) => Math.abs(stop.lat - mapCenter.lat) + Math.abs(stop.lng - mapCenter.lng);
        return distance(leftStop) - distance(rightStop);
      });

    const visibleDetailLines = maxDetailLines === Number.POSITIVE_INFINITY
      ? detailCandidates
      : detailCandidates.slice(0, maxDetailLines);

    for (const { line, points } of visibleDetailLines) {
      const isSelectedLine = selectedBusLine?.id === line.id;
      // 选中一条线时，其它线全部压成背景（否则"高亮"淹没在同色线网里等于没有）。
      const isBackground = dimOthers && !isSelectedLine;
      const price = line.priceFen ? `¥${Math.round(line.priceFen / 100)}` : '票价未提供';
      if (isSelectedLine) {
        // 白色描边打底，保证选中线压在所有点位和线上面都看得清。
        L.polyline(points, {
          color: '#ffffff',
          weight: 9,
          opacity: 0.9,
          className: 'bus-line-casing',
        }).addTo(layer).getElement()?.setAttribute('data-bus-line', line.name);
      }
      const detailLine = L.polyline(points, {
        color: isSelectedLine ? '#1d4ed8' : line.provinceCode === '44' ? '#0284c7' : '#94a3b8',
        weight: isSelectedLine ? 5 : isBackground ? 1 : detailWeight,
        opacity: isSelectedLine ? 1 : isBackground ? 0.06 : detailOpacity,
        ...(line.provinceCode === '44' ? {} : { dashArray: '6 6' }),
        className: 'bus-line-detail',
      });
      detailLine.bindTooltip(
        `${line.name} · ${line.departTimes.length} 班 · ${price}${line.carrier ? ` · ${line.carrier}` : ''}`,
        { sticky: true },
      );
      // 点线路（或它的站点）就选中它：高亮、并把这趟车的范围拉进视野。
      const selectLine = () => {
        setSelectedPlace(null);
        setClusterPlaces([]);
        setSelectedBusRoute(null);
        setSelectedBusLine(line);
        const bounds = L.latLngBounds(points);
        if (bounds.isValid()) map.fitBounds(bounds.pad(0.2), { maxZoom: 12, animate: false });
      };
      detailLine.on('click', selectLine);
      detailLine.addTo(layer);
      detailLine.getElement()?.setAttribute('data-bus-line', line.name);

      line.stops.forEach((stop, index) => {
        // 站点在更高倍才画；选中的线路无论如何都画，否则点开了却看不到站。
        if (!showDetailStops && !isSelectedLine) return;
        if (!isSelectedLine && !inView(stop.lat, stop.lng)) return;
        // 县级定位的站点画成空心：位置是区县中心，不是门口那个点，别让它看起来一样精确。
        const approximate = (stop.precision ?? 'node') !== 'node';
        const stopMarker = L.circleMarker(points[index], {
          radius: stop.role === 'board' ? 4.6 : 3.6,
          weight: approximate ? 1.8 : 1.5,
          color: '#ffffff',
          fillColor: stop.role === 'board' ? '#1dcc8c' : '#ff754b',
          fillOpacity: approximate ? 0.35 : 1,
          className: 'bus-line-stop',
        });
        stopMarker.bindTooltip(
          `${stop.role === 'board' ? '上车' : '下车'} · ${stop.name}`
          + `${stop.arriveTime ? ` · ${stop.arriveTime}` : ''}`
          + `${approximate ? ' · 区县级定位' : ''}`,
          { direction: 'top', offset: [0, -6] },
        );
        stopMarker.on('click', selectLine);
        stopMarker.addTo(layer);
        stopMarker.getElement()?.setAttribute('data-line-role', stop.role);
        if (approximate) stopMarker.getElement()?.setAttribute('data-stop-precision', stop.precision ?? 'county');
      });
    }

    return () => {
      layer.remove();
    };
  }, [busData, busLineData, busLayerEnabled, busStationPoints, expanded, mapZoom, providerIndex, selectedBusLine, selectedBusRoute]);

  // 打开巴士图层时把视野对准全部线路。展开弹窗时容器尺寸会变，fitBounds 必须等
  // 布局稳定后再来一次，否则会停在比数据范围大一倍的低缩放上。
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !busLayerEnabled || !busData) return;
    // 选中线路时视野交给下面那个"收到单条线路"的 effect，避免两个 fit 互相打架。
    if (selectedBusRoute) return;

    const provider = MAP_TILE_PROVIDERS[Math.min(providerIndex, MAP_TILE_PROVIDERS.length - 1)];
    const bounds = L.latLngBounds([
      ...busData.origins.map((origin) => busPointForProvider(origin, provider)),
      ...busData.routes.map((route) => busPointForProvider(route.destination, provider)),
    ]);
    if (!bounds.isValid()) return;

    const fit = () => {
      map.invalidateSize();
      map.fitBounds(bounds.pad(0.02), { maxZoom: 8, animate: false });
      mapElementRef.current?.setAttribute('data-bus-zoom', String(map.getZoom()));
    };
    fit();
    // 弹窗是从小到大展开的：只在挂载时 fit 会停在动画中途的尺寸上，
    // 缩放比数据范围大一倍，海岸线缩成一条线，湛江、香港看着就像落在海里。
    // 用 ResizeObserver 跟着容器真实尺寸重新对焦，动画结束那一帧也会触发。
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => fit()) : null;
    observer?.observe(map.getContainer());
    return () => {
      observer?.disconnect();
    };
  }, [busData, busLayerEnabled, expanded, providerIndex, selectedBusRoute]);

  // 选中线路后把视野收到这条线：整个省的范围（湛江↔汕头约 6.5 度）在 1126px 宽里
  // 最多只能到 z7，海岸线是粗的；近看才能分清雷州半岛和北部湾，也才看得清上下车点。
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !busLayerEnabled || !busData || !selectedBusRoute) return;
    const provider = MAP_TILE_PROVIDERS[Math.min(providerIndex, MAP_TILE_PROVIDERS.length - 1)];
    const origin = busData.origins.find((entry) => entry.cityId === selectedBusRoute.originCityId);
    const bounds = L.latLngBounds([
      ...(origin ? [busPointForProvider(origin, provider)] : []),
      ...(origin?.stations ?? []).map((station) => busPointForProvider(station, provider)),
      ...selectedBusRoute.stations.map((station) => busPointForProvider(station, provider)),
      busPointForProvider(selectedBusRoute.destination, provider),
    ]);
    if (!bounds.isValid()) return;
    map.invalidateSize();
    // 刚重建的图层还没定位，带动画缩放会让 Leaflet 读 _leaflet_pos 时报错，这里直接跳。
    map.fitBounds(bounds.pad(0.12), { maxZoom: 10, animate: false });
    mapElementRef.current?.setAttribute('data-bus-zoom', String(map.getZoom()));
  }, [busData, busLayerEnabled, expanded, providerIndex, selectedBusRoute]);

  // 从搜索结果里点一条具体线路：选中它、把视野收到这条线，并弹出线路详情。
  const focusBusLine = (line: BusLine) => {
    setSelectedPlace(null);
    setClusterPlaces([]);
    setSelectedBusRoute(null);
    setSelectedBusLine(line);
    const map = mapRef.current;
    if (!map) return;
    const provider = MAP_TILE_PROVIDERS[Math.min(providerIndex, MAP_TILE_PROVIDERS.length - 1)];
    const points = line.stops.map((stop) => (
      line.coordinateSystem === 'wgs84'
        ? wgs84PointForProvider(stop, provider)
        : busPointForProvider(stop, provider)
    ));
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points);
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.2), { maxZoom: 12, animate: false });
  };

  const toggleBusLayer = () => {
    if (busLayerEnabled) {
      setSelectedBusRoute(null);
    } else {
      setSelectedPlace(null);
      setClusterPlaces([]);
    }
    setBusLayerEnabled(!busLayerEnabled);
  };

  const openExpandedMap = () => {
    setProviderIndex(0);
    onExpandedChange(true);
  };

  const mapSurface = (
    <div className={`relative overflow-hidden rounded-[22px] bg-[#f4f0e8] ${expanded ? 'h-full min-h-[280px]' : embedded ? 'h-[250px] sm:h-[280px]' : 'h-[280px] sm:h-[320px]'}`}>
      <div ref={mapElementRef} className="h-full w-full" aria-label="旅行目的地地图" />
      <div className="absolute left-3 top-3 z-[1000] rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm backdrop-blur">
        滚轮缩放 · 放大后显示更细地点
      </div>
      <div className="absolute left-3 top-12 z-[1000] flex flex-col items-start gap-1.5">
        {/* 旅行团和站点巴士是同一张地图上的两个可选图层，可以同时打开 */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTourLayerEnabled((current) => !current)}
            aria-pressed={tourLayerEnabled}
            className={tourLayerEnabled
              ? 'inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition'
              : 'inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm backdrop-blur transition hover:border-orange-200 hover:text-orange-700'}
          >
            <MapPinned className="h-3.5 w-3.5" />
            {tourLayerEnabled ? `旅行团 · ${visiblePlaces.length} 个点` : '显示旅行团'}
          </button>
          <button
            type="button"
            onClick={toggleBusLayer}
            aria-pressed={busLayerEnabled}
            className={busLayerEnabled
              ? 'inline-flex items-center gap-1.5 rounded-full border border-sky-300 bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition'
              : 'inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm backdrop-blur transition hover:border-sky-200 hover:text-sky-700'}
          >
            <Bus className="h-3.5 w-3.5" />
            {busLayerEnabled ? `站点巴士${busData ? ` · ${busData.routes.length} 条线路` : ''}` : '点亮巴士线路'}
          </button>
        </div>
        {busLayerEnabled && (
          <span className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] leading-4 text-stone-500 shadow-sm backdrop-blur">
            示意走向，非实际行驶路径 · 点连线看站点
          </span>
        )}
        {busLayerEnabled && busLoading && !busData && (
          <span className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] text-stone-500 shadow-sm backdrop-blur">正在加载巴士线路…</span>
        )}
        {busLayerEnabled && busError && (
          <button type="button" onClick={retryBusRoutes} className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-rose-600 shadow-sm backdrop-blur">
            <RefreshCw className="h-3 w-3" /> 线路加载失败，重试
          </button>
        )}
      </div>
      {selectedBusLine && (
        <div className="absolute bottom-3 left-3 z-[1002] w-[268px] rounded-2xl border border-sky-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-sky-600">线路详情</p>
              <h4 className="mt-0.5 truncate text-sm font-semibold text-stone-900">{selectedBusLine.name}</h4>
              <p className="mt-0.5 text-[11px] text-stone-500">
                {selectedBusLine.departTimes.length > 0 ? `${selectedBusLine.departTimes.length} 班` : '班次未提供'}
                {selectedBusLine.priceFen ? ` · ¥${Math.round(selectedBusLine.priceFen / 100)}` : ''}
                {` · 上车 ${selectedBusLine.stops.filter((stop) => stop.role === 'board').length}`}
                {` / 下车 ${selectedBusLine.stops.filter((stop) => stop.role === 'alight').length}`}
              </p>
              {selectedBusLine.departTimes.length > 0 && (
                <p className="mt-1 text-[10px] leading-4 text-stone-400">
                  首班 {selectedBusLine.departTimes[0]} · 末班 {selectedBusLine.departTimes[selectedBusLine.departTimes.length - 1]}
                </p>
              )}
              {selectedBusLine.originCity && selectedBusLine.destinationCity && (
                <p className="mt-0.5 text-[10px] text-stone-400">
                  {selectedBusLine.originCity} → {selectedBusLine.destinationCity}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedBusLine(null)}
              aria-label="关闭线路详情"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      {tileError && (
        <div className="absolute inset-0 z-[1002] flex items-center justify-center bg-[#f4f0e8]/95 p-6 text-center">
          <div className="max-w-xs">
            <MapPinned className="mx-auto h-8 w-8 text-orange-500" />
            <p className="mt-3 text-sm font-semibold text-stone-800">底图暂时无法连接</p>
            <p className="mt-1 text-xs leading-5 text-stone-500">所有免费瓦片源都不可用，请稍后重试。</p>
            <button type="button" onClick={openExpandedMap} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-orange-700"><RefreshCw className="h-3.5 w-3.5" /> 重新尝试</button>
          </div>
        </div>
      )}
      {placesLoading && (
        <div className="absolute right-3 top-3 z-[1000] rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs text-stone-500 shadow-sm backdrop-blur">正在加载地点</div>
      )}
      {placesError && visiblePlaces.length === 0 && (
        <div className="absolute inset-x-3 bottom-3 z-[1000] flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/95 px-3 py-2.5 text-xs text-stone-600 shadow-lg backdrop-blur">
          <span>地图线路数据暂时不可用。</span>
          <button type="button" onClick={() => void fetchTours()} className="inline-flex shrink-0 items-center gap-1 font-medium text-orange-700"><RefreshCw className="h-3.5 w-3.5" /> 重试</button>
        </div>
      )}
      <PlaceClusterPanel places={clusterPlaces} expanded={expanded} onSelect={(place) => { setClusterPlaces([]); setSelectedPlace(place); }} onClose={() => setClusterPlaces([])} />
      <PlaceToursPanel
        place={selectedPlace}
        tours={selectedTours}
        loading={selectedPlaceLoading}
        error={selectedPlaceError}
        onTourClick={openTourDetail}
        onClose={() => setSelectedPlace(null)}
        onRetry={() => selectedPlace ? void fetchToursForPlace(selectedPlace.placeId, true) : void fetchTours()}
        onLoadMore={() => selectedPlace && void fetchToursForPlace(selectedPlace.placeId)}
        hasMore={selectedPlaceHasMore}
        expanded={expanded}
      />
      {busLayerEnabled && busData && (expanded || selectedBusRoute) && (
        <BusRoutePanel
          origins={busData.origins}
          routes={busData.routes}
          detailLines={busLineData?.routes ?? []}
          selectedRoute={selectedBusRoute}
          onSelect={(route) => {
            setSelectedPlace(null);
            setClusterPlaces([]);
            setSelectedBusLine(null);
            setSelectedBusRoute(route);
          }}
          onSelectLine={focusBusLine}
          onClose={() => setSelectedBusRoute(null)}
          expanded={expanded}
        />
      )}
    </div>
  );

  const expandedDialog = expanded && (
    <div className="fixed inset-0 z-[40] flex items-end justify-center bg-stone-950/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="map-dialog-title">
      <div className="flex h-[min(94dvh,820px)] w-full max-w-6xl flex-col overflow-hidden rounded-t-[24px] border border-stone-200 bg-white shadow-2xl sm:h-[min(90dvh,820px)] sm:rounded-[24px]">
        <div className="flex shrink-0 items-center justify-between border-b border-stone-200/80 px-4 py-3.5 sm:px-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-orange-600">目的地地图</p>
            <h2 id="map-dialog-title" className="mt-0.5 text-lg font-semibold text-stone-950">点地点，直接看对应旅行团</h2>
            {providerIndex < MAP_TILE_PROVIDERS.length && <p className="mt-0.5 text-xs text-stone-400">底图：{MAP_TILE_PROVIDERS[providerIndex].label}</p>}
          </div>
          <button type="button" onClick={() => onExpandedChange(false)} aria-label="关闭地图" className="flex h-9 w-9 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"><X className="h-5 w-5" /></button>
        </div>
        <div className="relative min-h-0 flex-1 p-2 sm:p-3">{mapSurface}</div>
      </div>
    </div>
  );

  return (
    <>
      {/* 放大时不能卸载内嵌地图：它的组件状态（选中的地点、相近地点面板、
          已加载的地块、切换中的底图源）全在这里面，一卸载就全丢——用户点了
          「放大」本来是想接着看刚才那个点的团，结果回来是个空地图，还得重新点。
          展开态改用 portal 里的同一个实例，内嵌位置用占位撑住布局。 */}
      {embedded && (
        <section
          className={expanded
            ? 'hidden h-[280px] sm:block'
            : 'hidden rounded-[26px] border border-stone-200/80 bg-white/78 p-3 shadow-[0_20px_50px_rgba(28,25,23,0.07)] backdrop-blur sm:block'}
          aria-labelledby="embedded-destination-map-title"
          aria-hidden={expanded || undefined}
        >
          {expanded ? (
            // 展开时内嵌位置只留占位：头像标题留着会把 aria-labelledby 指向重复 id。
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <p className="text-[11px] text-stone-400">地图已放大，关闭后回到这里。</p>
            </div>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between gap-3 px-1">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-orange-600">线路目的地</p>
                  <h2 id="embedded-destination-map-title" className="mt-0.5 truncate text-base font-semibold text-stone-950">点地点，直接看对应旅行团</h2>
                </div>
                <button type="button" onClick={openExpandedMap} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-stone-950"><Map className="h-3.5 w-3.5 text-orange-600" /> 放大</button>
              </div>
              <p className="mb-2 px-1 text-[11px] text-stone-400">
                {placesLoading ? (
                  '正在加载已定位地点…'
                ) : (
                  <>
                    已定位 {visiblePlaces.length} 个地点
                    {approximateTourCount > 0 && ` · ${approximateTourCount} 条线路使用模糊坐标`}
                  </>
                )}
              </p>
              {mapSurface}
            </>
          )}
        </section>
      )}
      {!expanded && !embedded && (
        <section id="destination-map" className="px-4 py-3 sm:px-6 lg:px-8" aria-labelledby="destination-map-title">
          <div className="mx-auto max-w-7xl">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-orange-600">线路目的地</p>
                <h2 id="destination-map-title" className="mt-0.5 text-lg font-semibold text-stone-950">每个地点对应它的旅行团</h2>
              </div>
              <button type="button" onClick={openExpandedMap} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-stone-950"><Map className="h-4 w-4 text-orange-600" /> 放大地图</button>
            </div>
            <p className="mb-2 px-1 text-xs text-stone-400">
              已定位 {visiblePlaces.length} 个目的地
              {approximateTourCount > 0 && `，其中 ${approximateTourCount} 条线路使用模糊坐标`}。
            </p>
            {mapSurface}
          </div>
        </section>
      )}
      {expandedDialog && createPortal(expandedDialog, document.body)}
      <TourDetailModal summaryTour={selectedSummaryTour} resolvedTour={resolvedTour} status={detailStatus} error={detailError} loading={detailLoading} onClose={clearSelectedTour} />
    </>
  );
}
