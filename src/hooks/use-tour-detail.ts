// 点击卡片后按 id 异步加载 tour-details/{id}.json，带内存缓存和请求竞争 token
import { getDataUrl } from '@/lib/utils';
import { useState, useRef, useCallback } from 'react';
import type { ResolvedTour, TourDetail, TourSummary } from '@/types/tour';
import { tourDetailSchema } from '@/lib/runtime-schemas';
import type { z } from 'zod';

export type TourDetailStatus = 'closed' | 'loading' | 'ready' | 'error';

/** schema 解析产物：比 TourDetail 契约宽（mealCounts 可能是 null），进缓存前必须归一。 */
type ParsedTourDetail = z.infer<typeof tourDetailSchema>;

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
  const activeRequestTourIdRef = useRef<string | null>(null);

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
    const cachedDetail = detailCacheRef.current[tour.id];
    const isSameActiveTour = activeRequestTourIdRef.current === tour.id;

    setSelectedSummaryTour(tour);
    setResolvedTour(null);
    setDetailError(null);

    if (cachedDetail) {
      setResolvedTour({ ...tour, ...cachedDetail });
      setDetailStatus('ready');
      activeRequestTourIdRef.current = null;
      return;
    }

    // 同一线路正在请求中：保持"加载中"并复用进行中的请求。
    // 这里绝不能给 activeRequestTourIdRef 置空——否则这次重选不再被识别为
    // "同一个请求中"，会走下面的兜底分支 abort 掉唯一的进行中请求，
    // 随后返回的响应被令牌校验丢弃，界面永久停在加载态。
    if (isSameActiveTour) {
      setDetailStatus('loading');
      return;
    }

    requestTokenRef.current += 1;
    const requestToken = requestTokenRef.current;
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;
    activeRequestTourIdRef.current = tour.id;
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
        let detail: ParsedTourDetail;
        try {
          detail = tourDetailSchema.parse(rawDetail);
        } catch (error) {
          // 半截/脏详情分片（构建中断、CDN 缓存错版本）不应被当成错误详情页：
          // 清掉进行中标记，让下一次点击重新请求，界面回到可重试状态。
          delete detailCacheRef.current[tour.id];
          activeRequestTourIdRef.current = null;
          setDetailStatus('error');
          setDetailError(error instanceof Error ? error.message : 'Failed to parse tour detail.');
          return;
        }
        const structuredDetails = tour.meta?.structuredDetails;
        // schema 允许 mealCounts 为 null（历史数据里空对象被归一成 null），
        // 类型契约是 MealCounts | undefined——这里显式归一，而不是让 null 溜进缓存。
        const mealCounts = detail.mealCounts ?? structuredDetails?.mealCounts ?? undefined;
        const resolvedDetail: TourDetail = {
          ...detail,
          accommodationDetails:
            detail.accommodationDetails?.length
              ? detail.accommodationDetails
              : structuredDetails?.accommodationDetails ?? detail.accommodationDetails,
          mealCounts: mealCounts ?? undefined,
          serviceStatus: detail.serviceStatus ?? structuredDetails?.serviceStatus,
        };
        detailCacheRef.current[tour.id] = resolvedDetail;
        setResolvedTour({ ...tour, ...resolvedDetail });
        setDetailStatus('ready');
        activeRequestTourIdRef.current = null;
      })
      .catch((error) => {
        if (controller.signal.aborted || requestTokenRef.current !== requestToken) return;
        setDetailStatus('error');
        activeRequestTourIdRef.current = null;
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
