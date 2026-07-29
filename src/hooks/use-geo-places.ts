import { useCallback, useEffect, useRef, useState } from 'react';
import { getDataUrl } from '@/lib/utils';
import { geoPlacesSchema } from '@/lib/runtime-schemas';
import type { GeoPlaceIndexEntry } from '@/types/tour';

type GeoPlacesState = {
  places: GeoPlaceIndexEntry[];
  loading: boolean;
  error: string | null;
};

const initialState: GeoPlacesState = {
  places: [],
  loading: true,
  error: null,
};

export function useGeoPlaces() {
  const [state, setState] = useState<GeoPlacesState>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPlaces = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const response = await fetch(getDataUrl('geo-places.json'), { signal: controller.signal });
      if (!response.ok) throw new Error(`Failed to load map places: ${response.status}`);
      const places = geoPlacesSchema.parse(await response.json());
      if (controller.signal.aborted) return;
      setState({ places, loading: false, error: null });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState((current) => ({
        places: current.places,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load map places.',
      }));
    }
  }, []);

  useEffect(() => {
    void fetchPlaces();
    return () => abortRef.current?.abort();
  }, [fetchPlaces]);

  return { ...state, fetchPlaces };
}
