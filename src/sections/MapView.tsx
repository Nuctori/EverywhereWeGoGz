import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPinned, RefreshCw } from 'lucide-react';
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
  const [tileError, setTileError] = useState(false);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;
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
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers || places.length === 0) return;

    markers.clearLayers();
    const bounds = L.latLngBounds([]);
    places.forEach((place) => {
      const marker = L.marker([place.latitude, place.longitude]);
      marker.bindPopup(
        `<strong>${escapeHtml(place.name)}</strong><br/><span>${escapeHtml(placeMeta(place))}</span>`,
      );
      marker.on('click', () => onPlaceSelect(place.name));
      marker.addTo(markers);
      bounds.extend([place.latitude, place.longitude]);
    });

    if (bounds.isValid()) map.fitBounds(bounds.pad(0.12), { maxZoom: 7 });
    map.invalidateSize();
  }, [onPlaceSelect, places]);

  const selectPlace = (place: GeoPlaceIndexEntry) => onPlaceSelect(place.name);

  return (
    <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8" aria-labelledby="map-view-title">
      <div className="overflow-hidden rounded-[28px] border border-stone-200/80 bg-white/90 shadow-[0_14px_38px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-200/70 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-orange-600">按地点找团</p>
            <h2 id="map-view-title" className="mt-1 text-xl font-semibold text-stone-950">先在地图上选目的地</h2>
            <p className="mt-1 text-sm text-stone-500">点击地图标记或下方地点，直接查看对应线路。</p>
          </div>
          {places.length > 0 && <span className="text-xs text-stone-400">已标注 {places.length} 个地点</span>}
        </div>

        <div className="relative grid lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="relative">
            <div ref={mapElementRef} className="h-[320px] w-full bg-stone-100 sm:h-[400px]" aria-label="旅行目的地地图" />
            {tileError && (
              <div className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded-xl border border-amber-200 bg-amber-50/95 px-3 py-2 text-xs leading-5 text-amber-900 shadow-sm">
                底图暂时无法加载，地点列表和线路搜索仍可用。
              </div>
            )}
          </div>
          <aside className="max-h-[400px] overflow-y-auto border-t border-stone-200/70 bg-stone-50/70 p-3 lg:border-l lg:border-t-0" aria-label="地图地点列表">
            {loading ? (
              <p className="p-3 text-sm text-stone-500">正在加载地点...</p>
            ) : places.length === 0 ? (
              <div className="p-3 text-sm text-stone-500">
                <p>{error ? '地图数据暂时不可用，请使用顶部搜索。' : '暂时没有可标注的地点。'}</p>
                {error && (
                  <button type="button" onClick={() => void fetchPlaces()} className="mt-3 inline-flex items-center gap-1.5 text-orange-700 hover:text-orange-800">
                    <RefreshCw className="h-3.5 w-3.5" /> 重试
                  </button>
                )}
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                    <span>地图数据更新失败，当前地点仍可用。</span>
                    <button type="button" onClick={() => void fetchPlaces()} className="inline-flex shrink-0 items-center gap-1 text-orange-700 hover:text-orange-800">
                      <RefreshCw className="h-3.5 w-3.5" /> 重试
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                  {places.slice().sort((a, b) => b.tourCount - a.tourCount).map((place) => (
                    <button key={place.placeId} type="button" onClick={() => selectPlace(place)} className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-left transition-colors hover:border-orange-200 hover:bg-orange-50">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <MapPinned className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                        <span className="truncate text-sm font-medium text-stone-800">{place.name}</span>
                      </span>
                      <span className="shrink-0 text-xs text-stone-400">{place.tourCount}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
