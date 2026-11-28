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

export function matchesBusCities(
  origin: string | undefined, destination: string | undefined,
  origins: readonly string[], destinations: readonly string[],
) {
  return (origins.length === 0 || (origin !== undefined && origins.includes(origin)))
    && (destinations.length === 0 || (destination !== undefined && destinations.includes(destination)));
}

export function busLineWeight(level: ReturnType<typeof busMapLevel>, departures: number, hasLocalStop = true) {
  if (level === 'focused') return 5;
  if (level === 'stops') {
    const localWidth = departures >= 6 ? 1.5 : departures >= 2 ? 1.1 : 0.75;
    return hasLocalStop ? localWidth : localWidth * 0.45;
  }
  return (level === 'overview' ? 0.7 : 1) * (departures >= 6 ? 2.2 : departures >= 2 ? 1.5 : 1);
}

type ScreenPoint = { x: number; y: number };
type ScreenRect = { left: number; top: number; right: number; bottom: number };

export function hasVisibleBusStop(points: readonly (ScreenPoint | null)[], viewport: ScreenRect, panel?: ScreenRect) {
  const contains = (rect: ScreenRect, { x, y }: ScreenPoint) => (
    x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
  );
  return points.some((point) => point !== null && contains(viewport, point) && !(panel && contains(panel, point)));
}

export function busLineOpacity(level: ReturnType<typeof busMapLevel>, zoom: number, hasLocalStop: boolean) {
  if (level === 'focused') return 1;
  if (level === 'overview') return 0.22;
  if (level === 'routes') return 0.42;
  if (hasLocalStop) return zoom >= 14 ? 0.82 : 0.66;
  return 0.55;
}

export function busThroughPaneOpacity(zoom: number) {
  return zoom >= 16 ? 0.12 : zoom >= 14 ? 0.18 : 0.24;
}
export type BusScreenSegment = readonly [ScreenPoint, ScreenPoint];
type DirectionSample = ScreenPoint & { dx: number; dy: number };
const CORRIDOR_RADIUS = 8;
const MIN_DIRECTION_SIMILARITY = Math.cos(Math.PI / 8);

export function limitBusMapRoutes<T extends { line: BusLine; distance: number; visibleSegments?: BusScreenSegment[] }>(
  candidates: T[],
  level: Exclude<ReturnType<typeof busMapLevel>, 'focused'>,
  showAllMatching = false,
): T[] {
  if (showAllMatching) return candidates;
  const ordered = candidates.filter(({ distance }) => Number.isFinite(distance))
    .sort((a, b) => a.distance - b.distance || a.line.id.localeCompare(b.line.id));
  if (level !== 'stops') return ordered.slice(0, level === 'overview' ? 60 : 80);

  // Sample clipped geometry so off-screen similarity never hides a visible branch.
  // Neighbor lookup crosses grid boundaries and compares unsigned directions (both ways share a corridor).
  const grid = new Map<string, DirectionSample[]>();
  const cell = (value: number) => Math.floor(value / CORRIDOR_RADIUS);
  const covered = (sample: DirectionSample) => {
    const x = cell(sample.x);
    const y = cell(sample.y);
    for (let i = x - 1; i <= x + 1; i++) {
      for (let j = y - 1; j <= y + 1; j++) {
        const nearby = grid.get(`${i}:${j}`);
        if (nearby?.some((other) => (sample.x - other.x) ** 2 + (sample.y - other.y) ** 2 <= CORRIDOR_RADIUS ** 2
          && Math.abs(sample.dx * other.dx + sample.dy * other.dy) >= MIN_DIRECTION_SIMILARITY)) return true;
      }
    }
    return false;
  };

  return ordered.filter(({ visibleSegments }) => {
    const samples: DirectionSample[] = [];
    for (const [start, end] of visibleSegments ?? []) {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.hypot(dx, dy);
      if (!Number.isFinite(length) || length === 0) continue;
      const steps = Math.ceil(length / (CORRIDOR_RADIUS / 2));
      for (let step = 0; step <= steps; step++) {
        const ratio = step / steps;
        samples.push({ x: start.x + ratio * dx, y: start.y + ratio * dy, dx: dx / length, dy: dy / length });
      }
    }
    // Keep a route if it contributes any new visible section or direction.
    const newSamples = samples.filter((sample) => !covered(sample));
    for (const sample of newSamples) {
      const key = `${cell(sample.x)}:${cell(sample.y)}`;
      const entry = grid.get(key);
      if (entry) entry.push(sample);
      else grid.set(key, [sample]);
    }
    return samples.length === 0 || newSamples.length > 0;
  });
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
