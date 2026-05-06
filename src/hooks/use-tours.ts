import { useState, useMemo } from 'react';
import type { Tour } from '@/types/tour';
import { tours as localTours } from '@/data/tours';

export function useTours() {
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const fetchTours = () => {
    // 静态站点无需 API 调用
  };

  return { tours: [] as Tour[], loading, error, total: 0, fetchTours };
}

export function useCrawlStatus() {
  const [loading] = useState(false);

  const status = useMemo(
    () => ({
      lastCrawl: null,
      lastCrawlStatus: 'mock',
      totalRecords: localTours.length,
      sourceStats: localTours.reduce<Record<string, number>>((acc, tour) => {
        acc[tour.source] = (acc[tour.source] ?? 0) + 1;
        return acc;
      }, {}),
      isCrawling: false,
      cacheExists: true,
      rawExists: false,
      cacheSize: JSON.stringify(localTours).length,
    }),
    []
  );

  const fetchStatus = () => {
    // 静态站点无需 API 调用
  };

  const triggerCrawl = async () => {
    throw new Error('静态站点不支持爬虫功能');
  };

  const generateMock = async () => {
    throw new Error('静态站点不支持生成模拟数据');
  };

  return { status, loading, fetchStatus, triggerCrawl, generateMock };
}
