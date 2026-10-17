// 本地推荐评分：以“当下可出发价值”为核心，随日期每日变化。
// 价值 = 临近度(指数衰减) + 可选密度 + 新品/热度微调；无未来班期直接沉底。
import type { TourSummary } from '@/types/tour';
import {
  compareCalendarDates,
  daysBetweenCalendarDates,
  parseCalendarDate,
  todayCalendarDate,
} from '@/lib/calendar-date';

export function getDaysUntil(dateString: string, today: string = todayCalendarDate()) {
  return daysBetweenCalendarDates(today, dateString);
}

export function getUpcomingDates(
  tour: Pick<TourSummary, 'departureDate' | 'departureDates'>,
  today: string = todayCalendarDate(),
) {
  return getEffectiveDepartureDates(tour).filter((d) => d >= today);
}

export function getEffectiveDepartureDates(tour: Pick<TourSummary, 'departureDate' | 'departureDates'>) {
  const values = [tour.departureDate, ...(tour.departureDates || [])];
  const uniqueDates = new Set<string>();

  for (const value of values) {
    const candidate = parseCalendarDate(value);
    if (candidate) uniqueDates.add(candidate);
  }

  return Array.from(uniqueDates).sort(compareCalendarDates);
}

export function getRecommendationScore(
  tour: Pick<TourSummary, 'title' | 'departureDate' | 'departureDates' | 'hotDepartureDates' | 'isNew' | 'isHot'>,
  titleHints: readonly string[],
) {
  let score = 0;
  if (titleHints.some((token) => tour.title.includes(token))) score += 2;
  const upcoming = getUpcomingDates(tour);
  const hasStructured = getEffectiveDepartureDates(tour).length > 0;
  if (hasStructured && upcoming.length === 0) return -8 + ((tour as { isHot?: boolean }).isHot ? 0.5 : 0);
  if (!hasStructured) {
    score += 0.5;
    if (tour.isNew) score += 0.8;
    if ((tour as { isHot?: boolean }).isHot) score += 0.5;
    return score;
  }
  const daysUntil = getDaysUntil(upcoming[0]!)!;
  // 临近度：指数衰减，越近越高分，30天后趋近0，每过去一天分数都会变
  const recency = 6 * Math.exp(-Math.max(0, daysUntil) / 12);
  score += recency;
  // 可选密度：未来14天内班期越多越有价值
  const within14 = upcoming.filter((d) => (getDaysUntil(d) ?? 999) <= 14).length;
  score += Math.min(within14, 4) * 0.6;
  score += Math.min(upcoming.length, 5) * 0.25;
  if (tour.hotDepartureDates?.length) {
    const hotUpcoming = tour.hotDepartureDates.filter((d) => upcoming.includes(d)).length;
    score += Math.min(hotUpcoming, 2) * 0.5;
  }
  if (tour.isNew) score += 0.7;
  if ((tour as { isHot?: boolean }).isHot) score += 0.4;
  return score;
}

// 排序：价值分优先，其次按最近可出发日期更近者优先，最后价格。
export function compareRecommended(
  a: Pick<TourSummary, 'title' | 'departureDate' | 'departureDates' | 'hotDepartureDates' | 'isNew' | 'isHot' | 'price'>,
  b: Pick<TourSummary, 'title' | 'departureDate' | 'departureDates' | 'hotDepartureDates' | 'isNew' | 'isHot' | 'price'>,
  titleHints: readonly string[],
) {
  const scoreDiff = getRecommendationScore(b, titleHints) - getRecommendationScore(a, titleHints);
  if (Math.abs(scoreDiff) > 0.01) return scoreDiff;
  const aNext = getUpcomingDates(a)[0] ?? '';
  const bNext = getUpcomingDates(b)[0] ?? '';
  if (aNext && bNext && aNext !== bNext) return aNext.localeCompare(bNext);
  if (aNext && !bNext) return -1;
  if (!aNext && bNext) return 1;
  return a.price - b.price;
}
