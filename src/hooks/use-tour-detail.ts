import { useState, useRef, useCallback } from 'react';
import type { Tour } from '@/types/tour';

declare const __DATA_VERSION__: string;

function getDataUrl(path: string) {
  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl}data/${path}?v=${encodeURIComponent(__DATA_VERSION__)}`;
}

export function useTourDetail() {
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const detailCacheRef = useRef<Record<string, Partial<Tour>>>({});
  const requestTokenRef = useRef(0);

  const selectTour = useCallback((tour: Tour) => {
    requestTokenRef.current += 1;
    const requestToken = requestTokenRef.current;
    setSelectedTour(tour);

    const cachedDetail = detailCacheRef.current[tour.id];
    if (cachedDetail) {
      setSelectedTour({ ...tour, ...detailCacheRef.current[tour.id] });
      return;
    }

    setLoadingDetailId(tour.id);
    fetch(getDataUrl(`tour-details/${tour.id}.json`))
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load tour detail: ${r.status}`);
        return r.json();
      })
      .then((detail) => {
        if (requestTokenRef.current !== requestToken) return;
        detailCacheRef.current[tour.id] = detail;
        setSelectedTour((current) =>
          current?.id === tour.id ? { ...current, ...detail } : current,
        );
      })
      .catch(() => {
        if (requestTokenRef.current !== requestToken) return;
      })
      .finally(() => {
        if (requestTokenRef.current !== requestToken) return;
        setLoadingDetailId((current) => (current === tour.id ? null : current));
      });
  }, []);

  return {
    selectedTour,
    detailLoading: Boolean(selectedTour && loadingDetailId === selectedTour.id),
    selectTour,
    clearSelectedTour: () => {
      requestTokenRef.current += 1;
      setLoadingDetailId(null);
      setSelectedTour(null);
    },
  };
}
