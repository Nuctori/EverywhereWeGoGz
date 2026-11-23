import { useCallback, useEffect, useRef, useState } from 'react';
import { getDataUrl } from '@/lib/utils';
import { busLineDataSchema } from '@/lib/runtime-schemas';
import type { BusLineData } from '@/types/bus';

type BusLinesState = {
  data: BusLineData | null;
  loading: boolean;
  error: string | null;
};

const initialState: BusLinesState = {
  data: null,
  loading: false,
  error: null,
};

/**
 * 线路明细（乔巴士）与站点数据分开加载：站点那份是滴滴的城市级站点，
 * 这份是具体某条线路的有序站点，只有打开图层时才请求。
 */
export function useBusLines(enabled: boolean) {
  const [state, setState] = useState<BusLinesState>(initialState);
  const requestRef = useRef<AbortController | null>(null);
  const dataRef = useRef<BusLineData | null>(null);
  const loadingRef = useRef(false);

  const load = useCallback(async (force = false) => {
    if (!force && (dataRef.current || loadingRef.current)) return;

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    loadingRef.current = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const response = await fetch(getDataUrl('bus-lines.json'), { signal: controller.signal });
      if (!response.ok) throw new Error(`加载线路明细失败（${response.status}）`);
      const data = busLineDataSchema.parse(await response.json()) as BusLineData;
      if (controller.signal.aborted) return;
      dataRef.current = data;
      loadingRef.current = false;
      setState({ data, loading: false, error: null });
    } catch (error) {
      if (controller.signal.aborted) {
        loadingRef.current = false;
        return;
      }
      loadingRef.current = false;
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : '加载线路明细失败',
      }));
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  useEffect(() => () => requestRef.current?.abort(), []);

  const retry = useCallback(() => void load(true), [load]);

  return { ...state, retry };
}
