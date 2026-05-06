import { useState, useEffect, useCallback } from 'react';
import type { Tour, FilterState } from '@/types/tour';

const API_BASE = 'http://localhost:3001/api';

interface ToursResponse {
  data: Tour[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CrawlStatus {
  lastCrawl: string | null;
  lastCrawlStatus: string;
  totalRecords: number;
  sourceStats: Record<string, number>;
  isCrawling: boolean;
  cacheExists: boolean;
  rawExists: boolean;
  cacheSize: number;
}

export function useTours() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchTours = useCallback(async (filters?: Partial<FilterState>, page = 1, limit = 30) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      params.append('sortBy', filters?.sortBy || 'hot');
      
      if (filters?.destination) params.append('destination', filters.destination);
      if (filters?.source) params.append('source', filters.source);
      if (filters?.theme) params.append('theme', filters.theme);
      if (filters?.minPrice) params.append('minPrice', String(filters.minPrice));
      if (filters?.maxPrice) params.append('maxPrice', String(filters.maxPrice));
      if (filters?.duration) params.append('duration', String(filters.duration));

      const res = await fetch(`${API_BASE}/tours?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ToursResponse = await res.json();
      setTours(data.data);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  return { tours, loading, error, total, fetchTours };
}

export function useCrawlStatus() {
  const [status, setStatus] = useState<CrawlStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/crawl/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('获取爬虫状态失败:', err);
    }
  }, []);

  const triggerCrawl = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/crawl/trigger`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '触发失败');
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateMock = useCallback(async (count = 50) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/crawl/mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成失败');
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { status, loading, fetchStatus, triggerCrawl, generateMock };
}
