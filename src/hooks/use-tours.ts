import { useCallback, useEffect, useRef, useState } from 'react';
import type { TourSummary } from '@/types/tour';
import { dataMetaSchema, toursListSchema } from '@/lib/runtime-schemas';

declare const __DATA_VERSION__: string;

type DataMeta = {
  generatedAt: string | null;
  latestUpdatedAt: string | null;
  totalRecords: number;
  listRecords: number;
  detailFiles: number;
  sourceStats: Record<string, number>;
  destinationStats: Record<string, number>;
  files: {
    raw?: { path: string; size: number };
    list?: { path: string; size: number };
    details?: { path: string; size: number };
  };
};

type UseToursState = {
  tours: TourSummary[];
  loading: boolean;
  error: string | null;
  total: number;
};

type CrawlStatus = {
  lastCrawl: string | null;
  lastCrawlStatus: 'loading' | 'success' | 'error' | 'never';
  totalRecords: number;
  listRecords: number;
  detailFiles: number;
  sourceStats: Record<string, number>;
  destinationStats: Record<string, number>;
  isCrawling: boolean;
  cacheExists: boolean;
  rawExists: boolean;
  cacheSize: number;
  rawSize: number;
  listSize: number;
  detailSize: number;
  generatedAt: string | null;
  latestUpdatedAt: string | null;
};

const emptyMeta: DataMeta = {
  generatedAt: null,
  latestUpdatedAt: null,
  totalRecords: 0,
  listRecords: 0,
  detailFiles: 0,
  sourceStats: {},
  destinationStats: {},
  files: {},
};

const initialToursState: UseToursState = {
  tours: [],
  loading: true,
  error: null,
  total: 0,
};

const initialCrawlStatus: CrawlStatus = {
  lastCrawl: null,
  lastCrawlStatus: 'loading',
  totalRecords: 0,
  listRecords: 0,
  detailFiles: 0,
  sourceStats: {},
  destinationStats: {},
  isCrawling: false,
  cacheExists: false,
  rawExists: false,
  cacheSize: 0,
  rawSize: 0,
  listSize: 0,
  detailSize: 0,
  generatedAt: null,
  latestUpdatedAt: null,
};

function getDataUrl(path: string) {
  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl}data/${path}?v=${encodeURIComponent(__DATA_VERSION__)}`;
}

export function useTours() {
  const [state, setState] = useState<UseToursState>(initialToursState);
  const abortRef = useRef<AbortController | null>(null);

  const fetchTours = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const response = await fetch(getDataUrl('tours-list.json'), {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Failed to load tours list: ${response.status}`);
      }

      const tours = toursListSchema.parse(await response.json());
      if (controller.signal.aborted) return;

      setState({
        tours,
        loading: false,
        error: null,
        total: tours.length,
      });
    } catch (error) {
      if (controller.signal.aborted) return;

      setState({
        tours: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load tours list.',
        total: 0,
      });
    }
  }, []);

  useEffect(() => {
    void fetchTours();

    return () => {
      abortRef.current?.abort();
    };
  }, [fetchTours]);

  return {
    ...state,
    fetchTours,
  };
}

export function useCrawlStatus() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<CrawlStatus>(initialCrawlStatus);
  const abortRef = useRef<AbortController | null>(null);

  const fetchStatus = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const response = await fetch(getDataUrl('tours-meta.json'), {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Failed to load data metadata: ${response.status}`);
      }

      const meta = { ...emptyMeta, ...dataMetaSchema.parse(await response.json()) };
      if (controller.signal.aborted) return;
      const rawSize = meta.files.raw?.size ?? 0;
      const listSize = meta.files.list?.size ?? 0;
      const detailSize = meta.files.details?.size ?? 0;

      setStatus({
        lastCrawl: meta.generatedAt,
        lastCrawlStatus: 'success',
        totalRecords: meta.totalRecords,
        listRecords: meta.listRecords,
        detailFiles: meta.detailFiles,
        sourceStats: meta.sourceStats || {},
        destinationStats: meta.destinationStats || {},
        isCrawling: false,
        cacheExists: listSize > 0,
        rawExists: rawSize > 0,
        cacheSize: listSize + detailSize,
        rawSize,
        listSize,
        detailSize,
        generatedAt: meta.generatedAt,
        latestUpdatedAt: meta.latestUpdatedAt,
      });
    } catch {
      if (controller.signal.aborted) return;
      setStatus({
        ...initialCrawlStatus,
        lastCrawlStatus: 'error',
      });
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchStatus]);

  const triggerCrawl = async () => { throw new Error('静态站点不支持爬虫功能'); };
  const generateMock = async () => { throw new Error('静态站点不支持生成模拟数据'); };
  return { status, loading, fetchStatus, triggerCrawl, generateMock };
}
