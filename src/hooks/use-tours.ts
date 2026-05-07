import { useState, useMemo } from 'react';
import type { Tour } from '@/types/tour';

export function useTours() {
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const fetchTours = () => {};
  return { tours: [] as Tour[], loading, error, total: 0, fetchTours };
}

export function useCrawlStatus() {
  const [loading] = useState(false);
  const status = useMemo(() => ({
    lastCrawl: null, lastCrawlStatus: 'mock', totalRecords: 0,
    sourceStats: {} as Record<string, number>, isCrawling: false,
    cacheExists: true, rawExists: false, cacheSize: 0,
  }), []);
  const fetchStatus = () => {};
  const triggerCrawl = async () => { throw new Error('静态站点不支持爬虫功能'); };
  const generateMock = async () => { throw new Error('静态站点不支持生成模拟数据'); };
  return { status, loading, fetchStatus, triggerCrawl, generateMock };
}
