import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import { ExternalLink, MapPin, MapPinned } from 'lucide-react';
import type { TourSummary } from '@/types/tour';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTourGeoCoverage, resolveTourGeo, TOUR_REGION_LABELS, type TourRegion } from '@/lib/tour-geo';
import 'leaflet/dist/leaflet.css';

interface TourMapProps {
  tours: TourSummary[];
  onSelectTour: (tour: TourSummary) => void;
}

const REGION_COLORS: Record<TourRegion, string> = {
  local: '#0f766e',
  'nearby-province': '#2563eb',
  national: '#b45309',
  international: '#be123c',
};

const WORLD_BOUNDS: LatLngBoundsExpression = [[-45, -25], [65, 155]];

function MapViewport({ points }: { points: Array<{ latitude: number; longitude: number }> }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds: LatLngBoundsExpression = points.map((point) => [point.latitude, point.longitude]);
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 6 });
  }, [map, points]);
  return null;
}

export function TourMap({ tours, onSelectTour }: TourMapProps) {
  const [region, setRegion] = useState<TourRegion | 'all'>('all');
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const points = useMemo(() => {
    const grouped = new Map<string, { geo: NonNullable<ReturnType<typeof resolveTourGeo>>; tours: TourSummary[] }>();
    tours.forEach((tour) => {
      const geo = resolveTourGeo(tour);
      if (!geo || (region !== 'all' && geo.region !== region)) return;
      const key = `${geo.name}:${geo.latitude}:${geo.longitude}`;
      const current = grouped.get(key);
      if (current) current.tours.push(tour);
      else grouped.set(key, { geo, tours: [tour] });
    });
    return [...grouped.values()];
  }, [region, tours]);
  const pointCoordinates = useMemo(
    () => points.map(({ geo }) => geo),
    [points],
  );

  const coverage = getTourGeoCoverage(tours, region);

  return (
    <section className="overflow-hidden rounded-[24px] border border-stone-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 px-4 py-4 sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <MapPinned className="h-5 w-5 text-stone-700" />
            <h2 className="text-lg font-semibold text-stone-900">旅行团目的地地图</h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-stone-500">地图点位为目的地城市/国家中心点估算，打开线路详情查看真实行程。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'local', 'nearby-province', 'national', 'international'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRegion(value)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${region === value ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'}`}
            >
              {value === 'all' ? '全部' : TOUR_REGION_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[520px] w-full bg-stone-100 sm:h-[600px]">
        <MapContainer center={[25, 112]} zoom={4} minZoom={2} maxZoom={10} maxBounds={WORLD_BOUNDS} className="h-full w-full" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewport points={pointCoordinates} />
          {points.map(({ geo, tours: pointTours }) => (
            <CircleMarker
              key={`${geo.name}-${geo.latitude}`}
              center={[geo.latitude, geo.longitude]}
              radius={Math.min(22, 8 + Math.sqrt(pointTours.length) * 2.5)}
              pathOptions={{ color: REGION_COLORS[geo.region], fillColor: REGION_COLORS[geo.region], fillOpacity: 0.72, weight: 2 }}
              eventHandlers={{ click: () => setSelectedPoint(geo.name) }}
            >
              <Popup>
                <div className="min-w-[190px] space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <strong>{geo.name}</strong>
                    <Badge variant="secondary">{pointTours.length} 条</Badge>
                  </div>
                  <p className="text-xs text-stone-500">{TOUR_REGION_LABELS[geo.region]} · 估算点</p>
                  <div className="max-h-36 space-y-1 overflow-y-auto">
                    {pointTours.slice(0, 5).map((tour) => (
                      <button key={tour.id} type="button" className="block w-full truncate text-left text-xs text-blue-700 hover:underline" onClick={() => onSelectTour(tour)}>
                        {tour.title}
                      </button>
                    ))}
                  </div>
                  {pointTours.length > 5 && <p className="text-[11px] text-stone-400">还有 {pointTours.length - 5} 条线路</p>}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
        {points.length === 0 && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/75 p-6 text-center text-sm text-stone-500">
            当前筛选结果还没有可定位的目的地。
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 px-4 py-3 text-xs text-stone-500 sm:px-5">
        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />已定位 {coverage.mapped} / {coverage.total} 条线路，{points.length} 个目的地</span>
        {coverage.unmapped > 0 && <span>还有 {coverage.unmapped} 条目的地待标准化</span>}
        {selectedPoint && <span className="hidden sm:inline">已选择：{selectedPoint}</span>}
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => window.open('https://www.openstreetmap.org', '_blank', 'noopener,noreferrer')}>
          <ExternalLink className="mr-1 h-3 w-3" />地图数据说明
        </Button>
      </div>
    </section>
  );
}
