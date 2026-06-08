import { useState, useRef, useCallback } from 'react';
import type { ResolvedTour, TourDetail, TourSummary } from '@/types/tour';
import { tourDetailSchema } from '@/lib/runtime-schemas';

declare const __DATA_VERSION__: string;

function getDataUrl(path: string) {
  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl}data/${path}?v=${encodeURIComponent(__DATA_VERSION__)}`;
}

export type TourDetailStatus = 'closed' | 'loading' | 'ready' | 'error';

export function useTourDetail() {
  const [selectedSummaryTour, setSelectedSummaryTour] = useState<TourSummary | null>(null);
  const [resolvedTour, setResolvedTour] = useState<ResolvedTour | null>(null);
  const [detailStatus, setDetailStatus] = useState<TourDetailStatus>('closed');
  const [detailError, setDetailError] = useState<string | null>(null);
  const detailCacheRef = useRef<Record<string, TourDetail>>({});
  const requestTokenRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const clearSelectedTour = useCallback(() => {
    requestTokenRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setSelectedSummaryTour(null);
    setResolvedTour(null);
    setDetailStatus('closed');
    setDetailError(null);
  }, []);

  const selectTour = useCallback((tour: TourSummary) => {
    requestTokenRef.current += 1;
    const requestToken = requestTokenRef.current;
    abortRef.current?.abort();

    setSelectedSummaryTour(tour);
    setResolvedTour(null);
    setDetailError(null);

    const cachedDetail = detailCacheRef.current[tour.id];
    if (cachedDetail) {
      setResolvedTour({ ...tour, ...cachedDetail });
      setDetailStatus('ready');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setDetailStatus('loading');

    fetch(getDataUrl(`tour-details/${tour.id}.json`), {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load tour detail: ${response.status}`);
        }
        return response.json();
      })
      .then((rawDetail) => {
        if (requestTokenRef.current !== requestToken) return;
        const detail = tourDetailSchema.parse(rawDetail);
        detailCacheRef.current[tour.id] = detail;
        setResolvedTour({ ...tour, ...detail });
        setDetailStatus('ready');
      })
      .catch((error) => {
        if (controller.signal.aborted || requestTokenRef.current !== requestToken) return;
        setDetailStatus('error');
        setDetailError(
          error instanceof Error ? error.message : 'Failed to load tour detail.',
        );
      });
  }, []);

  return {
    selectedSummaryTour,
    resolvedTour,
    detailStatus,
    detailError,
    detailLoading: detailStatus === 'loading',
    selectTour,
    clearSelectedTour,
  };
}
