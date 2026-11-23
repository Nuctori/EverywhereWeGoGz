import { useCallback, useEffect, useRef, useState } from 'react';
import { getDataUrl } from '@/lib/utils';
import { busRouteDataSchema } from '@/lib/runtime-schemas';
import type { BusRouteData } from '@/types/bus';

type BusRoutesState = {
  data: BusRouteData | null;
  loading: boolean;
  error: string | null;
};

const initialState: BusRoutesState = {
  data: null,
  loading: false,
  error: null,
};

/**
 * 站点巴士数据只在用户真的打开图层时才请求；开关反复切换不会重复发请求。
 * 失败后保留错误给 UI 展示，重试由调用方显式触发，避免自动重试打爆接口。
 */
export function useBusRoutes(enabled: boolean) {
  const [state, setState] = useState<BusRoutesState>(initialState);
  const requestRef = useRef<AbortController | null>(null);
  // 用 ref 而不是 state 做闸门：effect 重跑（含 StrictMode 的挂载→卸载→挂载）
  // 不能因为 state 还没提交就把请求判成“已经发过”。
  const dataRef = useRef<BusRouteData | null>(null);
  const loadingRef = useRef(false);

  const load = useCallback(async (force = false) => {
    if (!force && (dataRef.current || loadingRef.current)) return;

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    loadingRef.current = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const response = await fetch(getDataUrl('bus-routes.json'), { signal: controller.signal });
      if (!response.ok) throw new Error(`加载站点巴士数据失败（${response.status}）`);
      const data = busRouteDataSchema.parse(await response.json()) as BusRouteData;
      if (controller.signal.aborted) return;
      dataRef.current = data;
      loadingRef.current = false;
      setState({ data, loading: false, error: null });
    } catch (error) {
      // 卸载导致的取消不算失败：下一次挂载应该重新请求。
      if (controller.signal.aborted) {
        loadingRef.current = false;
        return;
      }
      loadingRef.current = false;
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : '加载站点巴士数据失败',
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
