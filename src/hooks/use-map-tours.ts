import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getDataUrl } from '@/lib/utils';
import { inflateTourSummaryFromMapCard } from '@/lib/tour-deeplink';
import { geoPlacesSchema, tourMapCardsSchema } from '@/lib/runtime-schemas';
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
    || point.level === 'city'
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

function mergeGeoPlacesWithTours(places: MapTourLocation[], tours: TourSummary[]): MapTourLocation[] {
  // geo-places.json is generated from the complete destination evidence and
  // can contain several destination places for one multi-stop tour. Tour
  // summaries only provide the cards, so they must not replace this index with
  // a single, potentially coarse geo.destination point.
  const currentTourIds = new Set(tours.map((tour) => tour.id));
  return places
    .map((place) => {
      const tourIds = place.tourIds.filter((tourId) => currentTourIds.has(tourId));
      return { ...place, tourIds, tourCount: tourIds.length };
    })
    .filter((place) => place.tourCount > 0)
    .sort((left, right) => right.tourCount - left.tourCount || left.name.localeCompare(right.name));
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

    let generatedPlaces: MapTourLocation[] = [];
    try {
      // The map only needs coordinates and tour ids to become interactive. Keep
      // this small request independent from the much larger tour summary index.
      const placesResponse = await fetch(getDataUrl('geo-places.json'), { signal: controller.signal });
      if (!placesResponse.ok) throw new Error(`Failed to load map places: ${placesResponse.status}`);
      generatedPlaces = mapGeoPlaces(geoPlacesSchema.parse(await placesResponse.json()));
      if (controller.signal.aborted) return;
      setState((current) => ({ ...current, places: generatedPlaces, placesLoading: false, placesError: null }));
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
      const toursResponse = await fetch(getDataUrl('tour-map-cards.json'), { signal: controller.signal });
      if (!toursResponse.ok) throw new Error(`Failed to load map tours: ${toursResponse.status}`);
      const entries = tourMapCardsSchema.parse(await toursResponse.json());
      if (controller.signal.aborted) return;
      const tours = entries.map(inflateTourSummaryFromMapCard);
      setState((current) => ({
        ...current,
        places: mergeGeoPlacesWithTours(generatedPlaces, tours),
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
