import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getDataUrl } from '@/lib/utils';
import { inflateTourSummaryFromIndexEntry } from '@/lib/tour-deeplink';
import { geoPlacesSchema, toursIndexSchema } from '@/lib/runtime-schemas';
import type { GeoAddress, GeoPlaceIndexEntry, TourSummary } from '@/types/tour';

export type MapTourLocation = {
  placeId: string;
  name: string;
  normalizedName: string;
  label?: string;
  country?: string;
  province?: string;
  city?: string;
  locality?: string;
  address?: GeoAddress;
  latitude: number;
  longitude: number;
  coordinateSystem: 'wgs84';
  level: 'country' | 'region' | 'city' | 'town' | 'poi';
  semanticLevel?: 'country' | 'region' | 'city' | 'town' | 'poi';
  coordinateSource: 'catalog' | 'geocoder' | 'osm' | 'fallback' | 'inferred';
  precision?: 'exact' | 'approximate';
  source: 'source' | 'catalog' | 'geocoder' | 'osm' | 'inferred' | 'unknown';
  confidence: 'low' | 'medium' | 'high';
  tourIds: string[];
  tourCount: number;
  roles: ['destination'];
};

type MapToursState = {
  places: MapTourLocation[];
  tours: TourSummary[];
  placesLoading: boolean;
  loading: boolean;
  placesError: string | null;
  toursError: string | null;
};

const initialState: MapToursState = {
  places: [],
  tours: [],
  placesLoading: true,
  loading: true,
  placesError: null,
  toursError: null,
};

type DestinationMapPoint = NonNullable<NonNullable<TourSummary['geo']>['destination']>;

function hasMapPoint(point: DestinationMapPoint | undefined): point is DestinationMapPoint {
  return Boolean(
    point
    && Number.isFinite(point.latitude)
    && Number.isFinite(point.longitude)
    && point.latitude >= -90
    && point.latitude <= 90
    && point.longitude >= -180
    && point.longitude <= 180,
  );
}

function isApproximateMapPoint(point: DestinationMapPoint | undefined) {
  return Boolean(point && (
    point.precision === 'approximate'
    || point.coordinateSource === 'fallback'
    || (point.coordinateSource === 'inferred' && point.confidence === 'low')
  ));
}

function mapGeoPlaces(entries: GeoPlaceIndexEntry[]): MapTourLocation[] {
  return entries
    .filter((place) => place.roles.includes('destination'))
    .map((place) => ({
      ...place,
      roles: ['destination'] as ['destination'],
    }))
    .sort((left, right) => right.tourCount - left.tourCount || left.name.localeCompare(right.name));
}

function mapPlacesFromTours(tours: TourSummary[]): MapTourLocation[] {
  const locations = new Map<string, MapTourLocation>();
  for (const tour of tours) {
    const point = tour.geo?.destination;
    // A city or fallback point is still useful when no better coordinate is
    // available. Its precision is shown in the map UI instead of dropping
    // the related tours from the destination picker.
    if (!hasMapPoint(point)) continue;
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
}

export function useMapTours() {
  const [state, setState] = useState<MapToursState>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  const fetchTours = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState((current) => ({
      ...current,
      placesLoading: true,
      loading: true,
      placesError: null,
      toursError: null,
    }));

    try {
      // The map only needs coordinates and tour ids to become interactive. Keep
      // this small request independent from the much larger tour summary index.
      const placesResponse = await fetch(getDataUrl('geo-places.json'), { signal: controller.signal });
      if (!placesResponse.ok) throw new Error(`Failed to load map places: ${placesResponse.status}`);
      const places = mapGeoPlaces(geoPlacesSchema.parse(await placesResponse.json()));
      if (controller.signal.aborted) return;
      setState((current) => ({ ...current, places, placesLoading: false, placesError: null }));
    } catch (error) {
      if (controller.signal.aborted) return;
      setState((current) => ({
        ...current,
        places: [],
        placesLoading: false,
        loading: false,
        placesError: error instanceof Error ? error.message : 'Failed to load map places.',
      }));
      return;
    }

    try {
      // Tour summaries are only needed for the place panel. They can finish in
      // the background after the point layer is already visible.
      const toursResponse = await fetch(getDataUrl('tours-index.json'), { signal: controller.signal });
      if (!toursResponse.ok) throw new Error(`Failed to load map tours: ${toursResponse.status}`);
      const entries = toursIndexSchema.parse(await toursResponse.json());
      if (controller.signal.aborted) return;
      const tours = entries.map(inflateTourSummaryFromIndexEntry);
      setState((current) => ({
        ...current,
        places: mapPlacesFromTours(tours),
        tours,
        loading: false,
        toursError: null,
      }));
    } catch (error) {
      if (controller.signal.aborted) return;
      setState((current) => ({
        ...current,
        loading: false,
        toursError: error instanceof Error ? error.message : 'Failed to load map tours.',
      }));
    }
  }, []);

  useEffect(() => {
    void fetchTours();
    return () => abortRef.current?.abort();
  }, [fetchTours]);

  const toursById = useMemo(() => new Map(state.tours.map((tour) => [tour.id, tour])), [state.tours]);

  return {
    ...state,
    toursById,
    unmappedTours: state.tours.filter((tour) => !hasMapPoint(tour.geo?.destination)),
    approximateTours: state.tours.filter((tour) => isApproximateMapPoint(tour.geo?.destination)),
    fetchTours,
  };
}
