import { useEffect, useState } from 'react';

// 用 IP 粗定位当前城市，只用于"默认勾选出发地"这一个用途。
// 拿不到就返回 null，调用方自行回退（不影响任何功能）。
const CACHE_KEY = 'ewg:user-city';
// 只取省市两级；ipip 返回 ["中国","广东","广州","","电信"]
const ENDPOINT = 'https://myip.ipip.net/json';

export function useUserCity(): string | null {
  const [city, setCity] = useState<string | null>(() => {
    if (typeof sessionStorage === 'undefined') return null;
    try {
      return sessionStorage.getItem(CACHE_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (city !== null) return;

    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 4000);

    const load = async () => {
      try {
        const response = await fetch(ENDPOINT, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) return;
        const payload = (await response.json()) as { data?: { location?: string[] } };
        // location[2] 是城市（不带"市"字），和线路里的"广州市"对不上，交给调用方做前缀匹配
        const raw = payload?.data?.location?.[2]?.trim();
        if (!raw || cancelled) return;
        setCity(raw);
        try {
          sessionStorage.setItem(CACHE_KEY, raw);
        } catch {
          /* 隐私模式下写不进去，忽略 */
        }
      } catch {
        // 断网/被拦截/超时都静默：这只是个默认值
      } finally {
        window.clearTimeout(timer);
      }
    };

    void load();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [city]);

  return city;
}
