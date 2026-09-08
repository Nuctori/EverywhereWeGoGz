export function trackEvent(name: string, payload: Record<string, unknown> = {}) {
  try {
    const w = window as Window & { dataLayer?: Array<Record<string, unknown>> };
    w.dataLayer?.push({ event: name, ...payload });
    window.dispatchEvent(new CustomEvent('tour-analytics', { detail: { name, ...payload } }));
  } catch {
    // Analytics must never block browsing.
  }
}

