// 本地推荐评分：以“当下可出发价值”为核心，随日期每日变化。
// 价值 = 临近度(指数衰减) + 可选密度 + 新品/热度微调；无未来班期直接沉底。
import type { TourSummary } from '@/types/tour';
import {
  addCalendarDays,
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

// 班期解析缓存：getEffectiveDepartureDates 会把一条线路的全部出发日期逐个
// 解析成日历日期再排序（单条最多 126 个班期），而评分函数对同一条线路会
// 反复问它（临近度、可选密度、热度都要）。实测 6483 条线路解析一次 33ms，
// 点一次「AI 帮我挑」这类调用会叠到几十次，线上 CPU 剖面里日期解析占到 35%。
// 这里按"日期字段内容"缓存结果：候选数组每轮重渲染都会重建对象，用对象引用
// 做键会永远不命中，用内容做键才能跨渲染复用。
const effectiveDepartureDatesCache = new Map<string, string[]>();
const EFFECTIVE_DEPARTURE_DATES_CACHE_MAX = 20000;

export function getEffectiveDepartureDates(tour: Pick<TourSummary, 'departureDate' | 'departureDates'>) {
  const dates = tour.departureDates || [];
  // 键必须只由"影响结果的字段"组成，避免不同线路撞键。
  const cacheKey = `${tour.departureDate ?? ''}\u0000${dates.join('\u0001')}`;
  const cached = effectiveDepartureDatesCache.get(cacheKey);
  if (cached) return cached;

  const values = [tour.departureDate, ...dates];
  const uniqueDates = new Set<string>();

  for (const value of values) {
    const candidate = parseCalendarDate(value);
    if (candidate) uniqueDates.add(candidate);
  }

  const result = Array.from(uniqueDates).sort(compareCalendarDates);
  // 简单上限：超过就整体清空，避免无限增长（候选池规模是有限的，正常不会触发）。
  if (effectiveDepartureDatesCache.size >= EFFECTIVE_DEPARTURE_DATES_CACHE_MAX) {
    effectiveDepartureDatesCache.clear();
  }
  effectiveDepartureDatesCache.set(cacheKey, result);
  return result;
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
  // 可选密度：未来14天内班期越多越有价值。
  // 直接用已解析好的日历日字符串比较（YYYY-MM-DD 字典序即时间序），
  // 避免对每个班期再走一次 daysBetweenCalendarDates 的解析。
  const cutoff = addCalendarDays(todayCalendarDate(), 14);
  const upcomingSet = new Set(upcoming);
  const within14 = cutoff ? upcoming.filter((d) => d <= cutoff).length : 0;
  score += Math.min(within14, 4) * 0.6;
  score += Math.min(upcoming.length, 5) * 0.25;
  if (tour.hotDepartureDates?.length) {
    // Set 查表取代 includes：单条线路最多 126 个班期，热门前是 O(n²)。
    const hotUpcoming = tour.hotDepartureDates.filter((d) => upcomingSet.has(d)).length;
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
