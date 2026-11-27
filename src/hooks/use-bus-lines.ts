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
      // 主源（乔巴士 + 滴滴）与附加源分开：单文件已 3.8MB，合并成一次 parse 会明显卡顿。
      // 车盈网、智惠大巴各自独立一份；附加源取不到就当没有，不能连带主源一起失败。
      const [baseResponse, cxResponse, cywResponse, zhdResponse] = await Promise.all([
        fetch(getDataUrl('bus-lines.json'), { signal: controller.signal }),
        fetch(getDataUrl('bus-lines-cx.json'), { signal: controller.signal }).catch(() => null),
        fetch(getDataUrl('bus-lines-cyw.json'), { signal: controller.signal }).catch(() => null),
        fetch(getDataUrl('bus-lines-zhd.json'), { signal: controller.signal }).catch(() => null),
      ]);
      if (!baseResponse.ok) {
        // 主源失败：先把已到手的附加源 body 释放掉，避免连接悬着
        void cxResponse?.body?.cancel();
        void cywResponse?.body?.cancel();
        void zhdResponse?.body?.cancel();
        throw new Error(`加载线路明细失败（${baseResponse.status}）`);
      }
      const base = busLineDataSchema.parse(await baseResponse.json()) as BusLineData;
      if (controller.signal.aborted) {
        void cxResponse?.body?.cancel();
        void cywResponse?.body?.cancel();
        void zhdResponse?.body?.cancel();
        return;
      }

      let data = base;
      for (const response of [cxResponse, cywResponse, zhdResponse]) {
        if (!response?.ok) {
          void response?.body?.cancel();
          continue;
        }
        try {
          const extra = busLineDataSchema.parse(await response.json()) as BusLineData;
          data = {
            ...data,
            source: { providers: [...data.source.providers, ...extra.source.providers] },
            routes: [...data.routes, ...extra.routes],
          };
        } catch (error) {
          // 取消不是"源坏了"：原样退出，别把 abort 当成降级继续合并
          if (controller.signal.aborted || (error as { name?: string } | null)?.name === 'AbortError') {
            void response.body?.cancel();
            loadingRef.current = false;
            return;
          }
          // 附加源结构不对就只用已有数据，不把用户挡在地图外
          void response.body?.cancel();
        }
      }
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
