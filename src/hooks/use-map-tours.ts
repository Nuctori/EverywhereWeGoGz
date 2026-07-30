import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getDataUrl } from '@/lib/utils';
import { inflateTourSummaryFromIndexEntry } from '@/lib/tour-deeplink';
import { toursIndexSchema } from '@/lib/runtime-schemas';
import type { TourSummary } from '@/types/tour';

export type MapTourLocation = {
  placeId: string;
  name: string;
  normalizedName: string;
  label?: string;
  country?: string;
  province?: string;
  city?: string;
  locality?: string;
  latitude: number;
  longitude: number;
  coordinateSystem: 'wgs84';
  level: 'country' | 'region' | 'city' | 'town' | 'poi';
  coordinateSource: 'catalog' | 'geocoder' | 'fallback' | 'inferred';
  source: 'source' | 'catalog' | 'geocoder' | 'inferred' | 'unknown';
  confidence: 'low' | 'medium' | 'high';
  tourIds: string[];
  tourCount: number;
  roles: ['destination'];
};

type MapToursState = {
  tours: TourSummary[];
  loading: boolean;
  error: string | null;
};

const initialState: MapToursState = {
  tours: [],
  loading: true,
  error: null,
};

function hasTrustedMapPoint(point: NonNullable<TourSummary['geo']>['destination'] | undefined) {
  if (!point) return false;
  return point.coordinateSource !== 'fallback'
    && (point.coordinateSource !== 'inferred' || point.confidence !== 'low');
}

export function useMapTours() {
  const [state, setState] = useState<MapToursState>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  const fetchTours = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const response = await fetch(getDataUrl('tours-index.json'), { signal: controller.signal });
      if (!response.ok) throw new Error(`Failed to load map tours: ${response.status}`);
      const entries = toursIndexSchema.parse(await response.json());
      if (controller.signal.aborted) return;
      setState({
        tours: entries.map(inflateTourSummaryFromIndexEntry),
        loading: false,
        error: null,
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({
        tours: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load map tours.',
      });
    }
  }, []);

  useEffect(() => {
    void fetchTours();
    return () => abortRef.current?.abort();
  }, [fetchTours]);

  const toursById = useMemo(() => new Map(state.tours.map((tour) => [tour.id, tour])), [state.tours]);
  const places = useMemo<MapTourLocation[]>(() => {
    const locations = new Map<string, MapTourLocation>();
    for (const tour of state.tours) {
      const point = tour.geo?.destination;
      // The map is a destination picker. City-only points do not identify a
      // selectable place, so keep them in list/search data but omit them here.
      if (!point || !['poi', 'town'].includes(point.level) || !hasTrustedMapPoint(point)) continue;
      const existing = locations.get(point.placeId);
      if (existing) {
        existing.tourIds.push(tour.id);
        existing.tourCount += 1;
        continue;
      }
      locations.set(point.placeId, {
        ...point,
        tourIds: [tour.id],
        tourCount: 1,
        roles: ['destination'],
      });
    }
    return [...locations.values()].sort((left, right) => right.tourCount - left.tourCount || left.name.localeCompare(right.name));
  }, [state.tours]);

  return {
    ...state,
    places,
    toursById,
    unmappedTours: state.tours.filter((tour) => !hasTrustedMapPoint(tour.geo?.destination)),
    fetchTours,
  };
}
