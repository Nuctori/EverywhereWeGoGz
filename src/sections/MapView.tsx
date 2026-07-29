import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map, MapPinned, RefreshCw, X } from 'lucide-react';
import { useGeoPlaces } from '@/hooks/use-geo-places';
import { MAP_TILE_PROVIDERS, wgs84ToGcj02, type MapTileProvider } from '@/lib/map-tile-pool';
import type { GeoPlaceIndexEntry } from '@/types/tour';

const DEFAULT_CENTER: L.LatLngExpression = [23.5, 113.5];
const DEFAULT_ZOOM = 5;

interface MapViewProps {
  onPlaceSelect: (placeName: string) => void;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character);
}

function placeMeta(place: GeoPlaceIndexEntry) {
  const level = {
    country: '国家级位置',
    region: '区域级位置',
    city: '城市级位置',
    poi: '具体地点',
  }[place.level];
  const confidence = place.confidence === 'low' ? '坐标置信度较低' : `坐标置信度${place.confidence === 'high' ? '高' : '中'}`;
  return `${level} · ${confidence} · ${place.tourCount} 条线路`;
}

function pointForProvider(place: GeoPlaceIndexEntry, provider: MapTileProvider): L.LatLngExpression {
  if (provider.coordinateSystem === 'gcj02' && isWithinChinaCoverage(place)) {
    return wgs84ToGcj02(place.latitude, place.longitude);
  }
  return [place.latitude, place.longitude];
}

function isWithinChinaCoverage(place: GeoPlaceIndexEntry) {
  return place.longitude >= 73 && place.longitude <= 135 && place.latitude >= 18 && place.latitude <= 54;
}

export function MapView({ onPlaceSelect }: MapViewProps) {
  const { places, loading, error, fetchPlaces } = useGeoPlaces();
  const [isOpen, setIsOpen] = useState(false);
  const [providerIndex, setProviderIndex] = useState(0);
  const [tileError, setTileError] = useState(false);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const tileLoadCountRef = useRef(0);
  const tileErrorCountRef = useRef(0);
  const sortedPlaces = places.slice().sort((a, b) => b.tourCount - a.tourCount);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !mapElementRef.current || mapRef.current) return;
    const map = L.map(mapElementRef.current, { zoomControl: true, scrollWheelZoom: false });
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    const resizeFrame = window.requestAnimationFrame(() => map.invalidateSize());
    return () => {
      window.cancelAnimationFrame(resizeFrame);
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markersRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!isOpen || !map || !markers || places.length === 0) return;

    const provider = MAP_TILE_PROVIDERS[Math.min(providerIndex, MAP_TILE_PROVIDERS.length - 1)];
    markers.clearLayers();
    const bounds = L.latLngBounds([]);
    places.forEach((place) => {
      const point = pointForProvider(place, provider);
      const marker = L.marker(point);
      marker.bindPopup(`<strong>${escapeHtml(place.name)}</strong><br/><span>${escapeHtml(placeMeta(place))}</span>`);
      marker.on('click', () => selectPlace(place));
      marker.addTo(markers);
      bounds.extend(point);
    });
    const viewportPlaces = provider.coordinateSystem === 'gcj02' ? places.filter(isWithinChinaCoverage) : places;
    const viewportBounds = L.latLngBounds(viewportPlaces.map((place) => pointForProvider(place, provider)));
    if (viewportBounds.isValid()) {
      map.fitBounds(viewportBounds.pad(0.12), { maxZoom: 7 });
    } else if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.12), { maxZoom: 7 });
    }
    map.invalidateSize();
  }, [isOpen, onPlaceSelect, places, providerIndex]);

  useEffect(() => {
    const map = mapRef.current;
    if (!isOpen || !map) return;

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
    const tileLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: 19,
      subdomains: provider.subdomains,
    });
    let active = true;
    const moveToNextProvider = () => {
      if (!active || tileLoadCountRef.current > 0) return;
      setProviderIndex((current) => (current === providerIndex ? current + 1 : current));
    };
    tileLayer.on('tileload', () => {
      tileLoadCountRef.current += 1;
    });
    tileLayer.on('tileerror', () => {
      tileErrorCountRef.current += 1;
      if (tileErrorCountRef.current >= 8) moveToNextProvider();
    });
    tileLayer.once('load', moveToNextProvider);
    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;
    const fallbackTimer = window.setTimeout(moveToNextProvider, 8000);
    return () => {
      active = false;
      window.clearTimeout(fallbackTimer);
    };
  }, [isOpen, places.length, providerIndex]);

  const selectPlace = (place: GeoPlaceIndexEntry) => {
    setIsOpen(false);
    onPlaceSelect(place.name);
  };

  const openMap = () => {
    setProviderIndex(0);
    setTileError(false);
    setIsOpen(true);
  };

  const mapDialog = isOpen && (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-stone-950/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="map-dialog-title">
          <div className="flex h-[min(92dvh,760px)] w-full max-w-6xl flex-col overflow-hidden rounded-t-[28px] border border-stone-200 bg-white shadow-2xl sm:h-[min(88dvh,760px)] sm:rounded-[28px]">
            <div className="flex shrink-0 items-center justify-between border-b border-stone-200/80 px-5 py-3.5 sm:px-6">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-orange-600">目的地地图</p>
                <h2 id="map-dialog-title" className="mt-0.5 text-lg font-semibold text-stone-950">选择一个地方，查看对应线路</h2>
                {providerIndex < MAP_TILE_PROVIDERS.length && <p className="mt-0.5 text-xs text-stone-400">底图：{MAP_TILE_PROVIDERS[providerIndex].label}</p>}
              </div>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="关闭地图" className="flex h-9 w-9 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_250px]">
              <div className="relative min-h-[280px]">
                <div ref={mapElementRef} className="h-full min-h-[280px] w-full bg-[#f4f0e8]" aria-label="旅行目的地地图" />
                {tileError && (
                  <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#f4f0e8] p-6 text-center">
                    <div className="max-w-xs">
                      <MapPinned className="mx-auto h-8 w-8 text-orange-500" />
                      <p className="mt-3 text-sm font-semibold text-stone-800">底图暂时无法连接</p>
                      <p className="mt-1 text-xs leading-5 text-stone-500">所有免费瓦片源都不可用，请直接点击右侧地点查看线路。</p>
                      <button type="button" onClick={openMap} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-orange-700"><RefreshCw className="h-3.5 w-3.5" /> 重新尝试</button>
                    </div>
                  </div>
                )}
              </div>
              <aside className="min-h-0 overflow-y-auto border-t border-stone-200/70 bg-stone-50/70 p-3 lg:border-l lg:border-t-0" aria-label="地图地点列表">
                {loading ? (
                  <p className="p-3 text-sm text-stone-500">正在加载地点...</p>
                ) : places.length === 0 ? (
                  <div className="p-3 text-sm text-stone-500">
                    <p>{error ? '地图数据暂时不可用，请使用顶部搜索。' : '暂时没有可标注的地点。'}</p>
                    {error && <button type="button" onClick={() => void fetchPlaces()} className="mt-3 inline-flex items-center gap-1.5 text-orange-700 hover:text-orange-800"><RefreshCw className="h-3.5 w-3.5" /> 重试</button>}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                    {sortedPlaces.map((place) => (
                      <button key={place.placeId} type="button" onClick={() => selectPlace(place)} className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-left transition-colors hover:border-orange-200 hover:bg-orange-50">
                        <span className="flex min-w-0 items-center gap-1.5"><MapPinned className="h-3.5 w-3.5 shrink-0 text-orange-500" /><span className="truncate text-sm font-medium text-stone-800">{place.name}</span></span>
                        <span className="shrink-0 text-xs text-stone-400">{place.tourCount}</span>
                      </button>
                    ))}
                  </div>
                )}
              </aside>
            </div>
          </div>
    </div>
  );

  return (
    <>
      <button type="button" onClick={openMap} aria-label="打开目的地地图" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-200 bg-white/80 px-3.5 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-stone-950">
        <Map className="h-4 w-4 text-orange-600" />
        <span className="hidden sm:inline">地图找团</span>
      </button>
      {mapDialog && createPortal(mapDialog, document.body)}
    </>
  );
}
