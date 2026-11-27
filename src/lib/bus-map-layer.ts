import type { BusLine } from '@/types/bus';
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

export function limitBusMapRoutes<T extends { line: BusLine; distance: number }>(candidates: T[], level: Exclude<ReturnType<typeof busMapLevel>, 'focused'>) {
  return candidates.filter(({ distance }) => Number.isFinite(distance))
    .sort((a, b) => a.distance - b.distance || a.line.id.localeCompare(b.line.id))
    .slice(0, level === 'overview' ? 60 : level === 'routes' ? 80 : 32);
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
