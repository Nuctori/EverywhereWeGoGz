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

const PLACE_TOUR_REQUEST_TIMEOUT_MS = 15000;
const PLACE_TOUR_CHUNK_SIZE = 24;
type PlaceToursError = { placeId: string; message: string };

type DestinationMapPoint = NonNullable<NonNullable<TourSummary['geo']>['destination']>;

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

export function useMapTours() {
  const [state, setState] = useState<MapToursState>(initialState);
  const [placeToursLoading, setPlaceToursLoading] = useState<string | null>(null);
  const [placeToursLoaded, setPlaceToursLoaded] = useState<Set<string>>(new Set());
  const [placeToursComplete, setPlaceToursComplete] = useState<Set<string>>(new Set());
  const [placeToursError, setPlaceToursError] = useState<PlaceToursError | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const placeToursAbortRef = useRef<AbortController | null>(null);
  const placeToursCacheRef = useRef(new Map<string, TourSummary[]>());
  const placeToursNextChunkRef = useRef(new Map<string, number>());
  const placeToursCompleteRef = useRef(new Set<string>());
  const placeTourCountRef = useRef(new Map<string, number>());

  const fetchTours = useCallback(async () => {
    abortRef.current?.abort();
    placeToursAbortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    placeToursCacheRef.current.clear();
    placeToursNextChunkRef.current.clear();
    placeToursCompleteRef.current.clear();
    placeTourCountRef.current.clear();
    setPlaceToursLoading(null);
    setPlaceToursLoaded(new Set());
    setPlaceToursComplete(new Set());
    setPlaceToursError(null);
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
      generatedPlaces.forEach((place) => placeTourCountRef.current.set(place.placeId, place.tourCount));
      if (controller.signal.aborted) return;
      setState((current) => ({
        ...current,
        places: generatedPlaces,
        placesLoading: false,
        loading: false,
        placesError: null,
        toursError: null,
        tours: [],
      }));
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

  }, []);

  const fetchToursForPlace = useCallback(async (placeId: string, force = false) => {
    const cachedTours = placeToursCacheRef.current.get(placeId);
    const expectedTourCount = placeTourCountRef.current.get(placeId) ?? Number.POSITIVE_INFINITY;
    if (!force && cachedTours && (placeToursCompleteRef.current.has(placeId) || cachedTours.length >= expectedTourCount)) {
      setPlaceToursLoaded((current) => new Set(current).add(placeId));
      setPlaceToursError(null);
      return;
    }

    placeToursAbortRef.current?.abort();
    const controller = new AbortController();
    placeToursAbortRef.current = controller;
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, PLACE_TOUR_REQUEST_TIMEOUT_MS);
    setPlaceToursLoading(placeId);
    setState((current) => ({ ...current, toursError: null }));

    try {
      const chunkIndex = placeToursNextChunkRef.current.get(placeId) ?? 0;
      const response = await fetch(getDataUrl(`tour-map-place-cards/${encodeURIComponent(placeId)}/${chunkIndex}.json`), { signal: controller.signal });
      if (!response.ok) throw new Error(`Failed to load map tours for ${placeId}: ${response.status}`);
      const chunkTours = tourMapCardsSchema.parse(await response.json()).map(inflateTourSummaryFromMapCard);
      if (controller.signal.aborted) return;
      const existingTours = placeToursCacheRef.current.get(placeId) ?? [];
      const allToursById = new Map(existingTours.map((tour) => [tour.id, tour]));
      chunkTours.forEach((tour) => allToursById.set(tour.id, tour));
      const tours = [...allToursById.values()];
      placeToursCacheRef.current.set(placeId, tours);
      placeToursNextChunkRef.current.set(placeId, chunkIndex + 1);
      setPlaceToursLoaded((current) => new Set(current).add(placeId));
      if (chunkTours.length < PLACE_TOUR_CHUNK_SIZE || tours.length >= expectedTourCount) {
        placeToursCompleteRef.current.add(placeId);
        setPlaceToursComplete((current) => new Set(current).add(placeId));
      }
      setState((current) => {
        const toursById = new Map(current.tours.map((tour) => [tour.id, tour]));
        tours.forEach((tour) => toursById.set(tour.id, tour));
        return { ...current, tours: [...toursById.values()], toursError: null };
      });
    } catch (error) {
      if (controller.signal.aborted && !timedOut) return;
      const message = error instanceof Error ? error.message : 'Failed to load map tours.';
      setPlaceToursError({ placeId, message });
      setState((current) => ({
        ...current,
        toursError: error instanceof Error ? error.message : 'Failed to load map tours.',
      }));
    } finally {
      window.clearTimeout(timeoutId);
      if (placeToursAbortRef.current === controller) {
        placeToursAbortRef.current = null;
        setPlaceToursLoading(null);
      }
    }
  }, []);

  useEffect(() => {
    void fetchTours();
    return () => {
      abortRef.current?.abort();
      placeToursAbortRef.current?.abort();
    };
  }, [fetchTours]);

  const toursById = useMemo(() => new Map(state.tours.map((tour) => [tour.id, tour])), [state.tours]);

  const approximateTourCount = useMemo(() => new Set(
    state.places
      .filter((place) => isApproximateMapPoint(place))
      .flatMap((place) => place.tourIds),
  ).size, [state.places]);

  return {
    ...state,
    toursById,
    approximateTourCount,
    placeToursLoading,
    placeToursLoaded,
    placeToursComplete,
    placeToursError,
    fetchTours,
    fetchToursForPlace,
  };
}
