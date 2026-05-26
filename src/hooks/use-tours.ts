import { useCallback, useEffect, useState } from 'react';
import type { Tour } from '@/types/tour';

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

function getDataUrl(path: string) {
  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl}data/${path}?v=${encodeURIComponent(__DATA_VERSION__)}`;
}

export function useTours() {
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const fetchTours = () => {};
  return { tours: [] as Tour[], loading, error, total: 0, fetchTours };
}

export function useCrawlStatus() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(() => ({
    lastCrawl: null as string | null,
    lastCrawlStatus: 'loading',
    totalRecords: 0,
    listRecords: 0,
    detailFiles: 0,
    sourceStats: {} as Record<string, number>,
    destinationStats: {} as Record<string, number>,
    isCrawling: false,
    cacheExists: false,
    rawExists: false,
    cacheSize: 0,
    rawSize: 0,
    listSize: 0,
    detailSize: 0,
    generatedAt: null as string | null,
    latestUpdatedAt: null as string | null,
  }));

  const fetchStatus = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(getDataUrl('tours-meta.json'));
      if (!response.ok) {
        throw new Error(`Failed to load data metadata: ${response.status}`);
      }

      const meta = { ...emptyMeta, ...(await response.json() as Partial<DataMeta>) };
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
      setStatus((current) => ({
        ...current,
        lastCrawlStatus: 'error',
        isCrawling: false,
        cacheExists: false,
        rawExists: false,
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const triggerCrawl = async () => { throw new Error('静态站点不支持爬虫功能'); };
  const generateMock = async () => { throw new Error('静态站点不支持生成模拟数据'); };
  return { status, loading, fetchStatus, triggerCrawl, generateMock };
}
