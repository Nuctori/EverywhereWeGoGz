// 点击卡片后按 id 异步加载 tour-details/{id}.json，带内存缓存和请求竞争 token
import { getDataUrl } from '@/lib/utils';
import { useState, useRef, useCallback } from 'react';
import type { ResolvedTour, TourDetail, TourSummary } from '@/types/tour';
import { tourDetailSchema } from '@/lib/runtime-schemas';

export type TourDetailStatus = 'closed' | 'loading' | 'ready' | 'error';

export function useTourDetail() {
  const [selectedSummaryTour, setSelectedSummaryTour] = useState<TourSummary | null>(null);
  const [resolvedTour, setResolvedTour] = useState<ResolvedTour | null>(null);
  const [detailStatus, setDetailStatus] = useState<TourDetailStatus>('closed');
  const [detailError, setDetailError] = useState<string | null>(null);
  // 内存缓存：同一 id 只请求一次，tab 内刷新不重复 fetch
  const detailCacheRef = useRef<Record<string, TourDetail>>({});
  // 递增令牌防止旧响应污染新选择（连续快速点击时）
  const requestTokenRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  // 关闭弹窗并清理状态（令牌递增确保随后到来的响应被忽略）
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

    // 缓存命中直接返回，避免闪烁
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
        // 请求令牌不匹配说明已有新选择，丢弃旧响应
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
