import type { BusLine, BusRouteData } from '@/types/bus';
import type { BusGeoPoint } from './bus-route-geometry';

export function isBusMapPoint(point: BusGeoPoint) {
  // In the bus data coverage area neither axis reaches zero. The existing
  // schema can coerce a null or empty input to zero; don't draw that position.
  return Number.isFinite(point.lat) && point.lat !== 0 && Math.abs(point.lat) <= 90
    && Number.isFinite(point.lng) && point.lng !== 0 && Math.abs(point.lng) <= 180;
}

export function busMapLevel(zoom: number, focused: boolean) {
  if (focused) return 'focused';
  if (zoom < 8) return 'overview';
  return zoom < 11 ? 'routes' : 'stops';
}

export function buildBusCityLinks(data: BusRouteData, lines: BusLine[], selectedOrigins: string[]) {
  const cityPoints = new Map<string, BusGeoPoint>();
  for (const city of [...data.routes.map(({ destination }) => destination), ...data.origins]) {
    if (isBusMapPoint(city)) cityPoints.set(city.name, city);
  }
  const links = new Map<string, { key: string; cities: string[]; start: BusGeoPoint; end: BusGeoPoint }>();
  const add = (origin?: string, destination?: string) => {
    if (!origin || !destination || origin === destination) return;
    const cities = [origin, destination].sort();
    const key = cities.join(' ↔ ');
    const start = cityPoints.get(cities[0]);
    const end = cityPoints.get(cities[1]);
    if (start && end && (start.lat !== end.lat || start.lng !== end.lng)) links.set(key, { key, cities, start, end });
  };
  const origins = new Map(data.origins.map((city) => [city.cityId, city.name]));
  const allowed = new Set(selectedOrigins);
  for (const route of data.routes) {
    const origin = origins.get(route.originCityId);
    if (origin && (!allowed.size || allowed.has(origin))) add(origin, route.destination.name);
  }
  for (const line of lines) {
    if (!allowed.size || (line.originCity && allowed.has(line.originCity))) add(line.originCity, line.destinationCity);
  }
  return [...links.values()];
}

export function limitBusMapRoutes<T extends { line: BusLine; distance: number }>(candidates: T[], level: 'routes' | 'stops') {
  return candidates.filter(({ distance }) => Number.isFinite(distance))
    .sort((a, b) => a.distance - b.distance || a.line.id.localeCompare(b.line.id))
    .slice(0, level === 'stops' ? 16 : 10);
}

export function limitBusMapStops<T extends { x: number; y: number; exact: boolean }>(candidates: T[]) {
  const ordered = [...candidates].sort((a, b) => Number(b.exact) - Number(a.exact));
  const accepted: T[] = [];
  for (const stop of ordered) {
    if (accepted.some((other) => (stop.x - other.x) ** 2 + (stop.y - other.y) ** 2 < 18 ** 2)) continue;
    accepted.push(stop);
    if (accepted.length === 36) break;
  }
  return accepted;
}
