import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowUpRight, Map, MapPinned, RefreshCw, X } from 'lucide-react';
import { useMapTours, type MapTourLocation } from '@/hooks/use-map-tours';
import { useTourDetail } from '@/hooks/use-tour-detail';
import { TourDetailModal } from './TourDetailModal';
import { MAP_TILE_PROVIDERS, wgs84ToGcj02, type MapTileProvider } from '@/lib/map-tile-pool';
import type { TourSummary } from '@/types/tour';

const DEFAULT_CENTER: L.LatLngExpression = [23.5, 113.5];
const DEFAULT_ZOOM = 5;
interface MapViewProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
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
  expanded,
}: {
  place: MapTourLocation | null;
  tours: TourSummary[];
  loading: boolean;
  error: string | null;
  onTourClick: (tour: TourSummary) => void;
  onClose: () => void;
  onRetry: () => void;
  expanded: boolean;
}) {
  if (!place) return null;

  return (
    <aside
      className={expanded
        ? 'absolute inset-x-3 bottom-3 z-[1001] max-h-[45%] overflow-y-auto rounded-2xl border border-stone-200/90 bg-white/95 p-3 shadow-xl backdrop-blur sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-4 sm:w-[min(360px,38%)] sm:max-h-none'
        : 'absolute inset-x-3 bottom-3 z-[1001] max-h-[72%] overflow-y-auto rounded-2xl border border-stone-200/90 bg-white/95 p-3 shadow-xl backdrop-blur sm:bottom-4 sm:left-auto sm:right-4 sm:w-[min(330px,42%)] sm:max-h-[calc(100%-2rem)]'}
      aria-label={`${place.name}旅行团`}
    >
      <div className="flex items-start justify-between gap-3 px-1 pb-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-orange-600">地点线路</p>
          <h3 className="mt-0.5 truncate text-base font-semibold text-stone-950">{place.label || place.name}</h3>
          <p className="mt-0.5 text-xs text-stone-500">{place.tourCount} 条线路 · 点击卡片查看详情</p>
        </div>
        <button type="button" onClick={onClose} aria-label="关闭地点线路" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900">
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <p className="px-1 py-5 text-sm text-stone-500">正在加载地点线路...</p>
      ) : error ? (
        <div className="px-1 py-4 text-sm text-stone-500">
          <p>线路数据暂时不可用。</p>
          <button type="button" onClick={onRetry} className="mt-2 inline-flex items-center gap-1 text-orange-700 hover:text-orange-800"><RefreshCw className="h-3.5 w-3.5" /> 重试</button>
        </div>
      ) : tours.length === 0 ? (
        <p className="px-1 py-5 text-sm text-stone-500">这个地点暂时没有可展示的旅行团。</p>
      ) : (
        <div className="space-y-2">
          {tours.map((tour) => <MapTourCard key={tour.id} tour={tour} onClick={() => onTourClick(tour)} />)}
          {place.tourCount > tours.length && <p className="px-1 pt-1 text-xs text-stone-400">还有 {place.tourCount - tours.length} 条线路，点击卡片可查看详情。</p>}
        </div>
      )}
    </aside>
  );
}

export function MapView({ expanded, onExpandedChange }: MapViewProps) {
  const { places, unmappedTours, loading: placesLoading, error: placesError, toursById, fetchTours } = useMapTours();
  const { selectedSummaryTour, resolvedTour, detailStatus, detailError, detailLoading, selectTour, clearSelectedTour } = useTourDetail();
  const [providerIndex, setProviderIndex] = useState(0);
  const [tileError, setTileError] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<MapTourLocation | null>(null);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const tileLoadCountRef = useRef(0);
  const tileErrorCountRef = useRef(0);
  const visiblePlaces = useMemo(() => places.filter((place) => place.tourCount > 0), [places]);
  const selectedTours = useMemo(() => {
    if (!selectedPlace) return [];
    return selectedPlace.tourIds.map((id) => toursById.get(id)).filter((tour): tour is TourSummary => Boolean(tour));
  }, [selectedPlace, toursById]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && expanded) onExpandedChange(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expanded, onExpandedChange]);

  useEffect(() => {
    if (!mapElementRef.current) return;
    const map = L.map(mapElementRef.current, { zoomControl: true, scrollWheelZoom: true, attributionControl: true });
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    mapRef.current = map;
    const resizeFrame = window.requestAnimationFrame(() => map.invalidateSize());
    return () => {
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
      setTileError(true);
      return;
    }

    const provider = MAP_TILE_PROVIDERS[providerIndex];
    tileLoadCountRef.current = 0;
    tileErrorCountRef.current = 0;
    setTileError(false);
    const tileLayer = L.tileLayer(provider.url, { attribution: provider.attribution, maxZoom: 19, subdomains: provider.subdomains });
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
    const markers = L.layerGroup().addTo(map);
    const provider = MAP_TILE_PROVIDERS[Math.min(providerIndex, MAP_TILE_PROVIDERS.length - 1)];
    visiblePlaces.forEach((place) => {
      const point = pointForProvider(place, provider);
      const marker = L.marker(point);
      const locationLabel = place.label || place.name;
      marker.options.title = locationLabel;
      marker.options.alt = `旅行团目的地：${locationLabel}`;
      marker.bindTooltip(`${locationLabel} · ${place.tourCount}条线路`, { direction: 'top', offset: [0, -8] });
      marker.on('click', () => {
        setSelectedPlace(place);
        map.panTo(point, { animate: true, duration: 0.25 });
      });
      marker.addTo(markers);
    });
    const viewportPlaces = provider.coordinateSystem === 'gcj02' ? visiblePlaces.filter(isWithinChinaCoverage) : visiblePlaces;
    const viewportBounds = L.latLngBounds(viewportPlaces.map((place) => pointForProvider(place, provider)));
    if (viewportBounds.isValid()) map.fitBounds(viewportBounds.pad(0.12), { maxZoom: expanded ? 7 : 6 });
    map.invalidateSize();
    return () => { markers.remove(); };
  }, [expanded, providerIndex, visiblePlaces]);

  const openExpandedMap = () => {
    setProviderIndex(0);
    setTileError(false);
    onExpandedChange(true);
  };

  const mapSurface = (
    <div className={`relative overflow-hidden rounded-[22px] bg-[#f4f0e8] ${expanded ? 'h-full min-h-[280px]' : 'h-[280px] sm:h-[320px]'}`}>
      <div ref={mapElementRef} className="h-full w-full" aria-label="旅行目的地地图" />
      <div className="absolute left-3 top-3 z-[1000] rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm backdrop-blur">
        滚轮缩放 · 点击地点看团
      </div>
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
      <PlaceToursPanel place={selectedPlace} tours={selectedTours} loading={placesLoading} error={placesError} onTourClick={selectTour} onClose={() => setSelectedPlace(null)} onRetry={() => void fetchTours()} expanded={expanded} />
    </div>
  );

  const expandedDialog = expanded && (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-stone-950/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="map-dialog-title">
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
      {!expanded && (
        <section id="destination-map" className="px-4 py-3 sm:px-6 lg:px-8" aria-labelledby="destination-map-title">
          <div className="mx-auto max-w-7xl">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-orange-600">线路目的地</p>
                <h2 id="destination-map-title" className="mt-0.5 text-lg font-semibold text-stone-950">每个地点对应它的旅行团</h2>
              </div>
              <button type="button" onClick={openExpandedMap} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-stone-950"><Map className="h-4 w-4 text-orange-600" /> 放大地图</button>
            </div>
            {unmappedTours.length > 0 && <p className="mb-2 px-1 text-xs text-stone-400">已定位 {visiblePlaces.length} 个目的地，另有 {unmappedTours.length} 条线路待补全地点。</p>}
            {mapSurface}
          </div>
        </section>
      )}
      {expandedDialog && createPortal(expandedDialog, document.body)}
      <TourDetailModal summaryTour={selectedSummaryTour} resolvedTour={resolvedTour} status={detailStatus} error={detailError} loading={detailLoading} onClose={clearSelectedTour} />
    </>
  );
}
