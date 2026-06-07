import type { Tour } from '@/types/tour';

const FOCUS_PRICE = 3000;

export { FOCUS_PRICE };

export interface PriceStatsResult {
  maxPriceAll: number;
  priceStats: {
    min: number;
    max: number;
    p50: number;
    p95: number;
  };
}

export function computePriceStats(tours: Tour[]): PriceStatsResult {
  const prices = tours.map((t) => t.price).sort((a, b) => a - b);
  const max = prices.length > 0 ? prices[prices.length - 1] : 10000;
  const p95 = prices[Math.floor(prices.length * 0.95)] || max;
  const sliderMax = Math.min(
    Math.ceil(p95 / 1000) * 1000,
    Math.ceil(max / 1000) * 1000,
  );

  return {
    maxPriceAll: sliderMax,
    priceStats: {
      min: prices[0] || 0,
      max,
      p50: prices[Math.floor(prices.length * 0.5)] || 0,
      p95,
    },
  };
}

export function sliderToPrice(sliderValue: number, maxPrice: number): number {
  if (sliderValue <= 0) return 0;
  if (sliderValue >= 100) return maxPrice;

  if (sliderValue <= 80) {
    return Math.round((sliderValue / 80) * FOCUS_PRICE);
  }

  const t = (sliderValue - 80) / 20;
  const eased = t * t * (3 - 2 * t);
  return Math.round(FOCUS_PRICE + eased * (maxPrice - FOCUS_PRICE));
}

export function priceToSlider(price: number, maxPrice: number): number {
  if (price <= 0) return 0;
  if (price >= maxPrice) return 100;

  if (price <= FOCUS_PRICE) {
    return (price / FOCUS_PRICE) * 80;
  }

  const t = Math.sqrt((price - FOCUS_PRICE) / (maxPrice - FOCUS_PRICE));
  return 80 + t * 20;
}
