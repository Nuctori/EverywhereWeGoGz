import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronRight, Map, MapPinned, RefreshCw, X } from 'lucide-react';
import { useGeoPlaces } from '@/hooks/use-geo-places';
import type { GeoPlaceIndexEntry } from '@/types/tour';

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; OpenStreetMap contributors';
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

export function MapView({ onPlaceSelect }: MapViewProps) {
  const { places, loading, error, fetchPlaces } = useGeoPlaces();
  const [isOpen, setIsOpen] = useState(false);
  const [tileError, setTileError] = useState(false);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const sortedPlaces = places.slice().sort((a, b) => b.tourCount - a.tourCount);
  const previewPlaces = sortedPlaces.slice(0, 4);

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
    setTileError(false);
    const map = L.map(mapElementRef.current, { zoomControl: true, scrollWheelZoom: false });
    const tileLayer = L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 });
    tileLayer.on('tileerror', () => setTileError(true));
    tileLayer.addTo(map);
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    const resizeFrame = window.requestAnimationFrame(() => map.invalidateSize());
    return () => {
      window.cancelAnimationFrame(resizeFrame);
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!isOpen || !map || !markers || places.length === 0) return;

    markers.clearLayers();
    const bounds = L.latLngBounds([]);
    places.forEach((place) => {
      const marker = L.marker([place.latitude, place.longitude]);
      marker.bindPopup(
        `<strong>${escapeHtml(place.name)}</strong><br/><span>${escapeHtml(placeMeta(place))}</span>`,
      );
      marker.on('click', () => selectPlace(place));
      marker.addTo(markers);
      bounds.extend([place.latitude, place.longitude]);
    });

    if (bounds.isValid()) map.fitBounds(bounds.pad(0.12), { maxZoom: 7 });
    map.invalidateSize();
  }, [isOpen, onPlaceSelect, places]);

  const selectPlace = (place: GeoPlaceIndexEntry) => {
    setIsOpen(false);
    onPlaceSelect(place.name);
  };

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-2 sm:px-6 sm:py-3 lg:px-8" aria-labelledby="map-view-title">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-stone-200/80 bg-white/90 px-4 py-3 shadow-[0_10px_26px_rgba(15,23,42,0.04)] sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <Map className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <h2 id="map-view-title" className="text-sm font-semibold text-stone-950">按地点找团</h2>
                <span className="text-xs text-stone-400">{places.length > 0 ? `${places.length} 个地点` : '正在加载地点'}</span>
              </div>
              <div className="mt-1 flex max-w-[min(70vw,620px)] flex-wrap gap-1.5 overflow-hidden">
                {previewPlaces.map((place) => (
                  <button key={place.placeId} type="button" onClick={() => selectPlace(place)} className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-600 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-stone-900">
                    {place.name}<span className="text-stone-400">{place.tourCount}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button type="button" onClick={() => setIsOpen(true)} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-stone-900 px-4 text-sm font-medium text-white transition-colors hover:bg-stone-800">
            <MapPinned className="h-4 w-4" />
            打开地图
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-stone-950/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="map-dialog-title">
          <div className="flex h-[min(92dvh,760px)] w-full max-w-6xl flex-col overflow-hidden rounded-t-[28px] border border-stone-200 bg-white shadow-2xl sm:h-[min(88dvh,760px)] sm:rounded-[28px]">
            <div className="flex shrink-0 items-center justify-between border-b border-stone-200/80 px-5 py-3.5 sm:px-6">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-orange-600">目的地地图</p>
                <h2 id="map-dialog-title" className="mt-0.5 text-lg font-semibold text-stone-950">选择一个地方，查看对应线路</h2>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="关闭地图" className="flex h-9 w-9 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_250px]">
              <div className="relative min-h-[280px]">
                <div ref={mapElementRef} className="h-full min-h-[280px] w-full bg-[#f4f0e8]" aria-label="旅行目的地地图" />
                {tileError && (
                  <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#f4f0e8]/95 p-6 text-center">
                    <div className="max-w-xs">
                      <MapPinned className="mx-auto h-8 w-8 text-orange-500" />
                      <p className="mt-3 text-sm font-semibold text-stone-800">地图底图暂时无法加载</p>
                      <p className="mt-1 text-xs leading-5 text-stone-500">你仍然可以直接点击右侧地点查看线路。</p>
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
      )}
    </>
  );
}
