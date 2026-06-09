import type { TourSummary } from '@/types/tour';

function getDaysUntil(dateString: string) {
  if (!dateString) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function getEffectiveDepartureDates(tour: Pick<TourSummary, 'departureDate' | 'departureDates'>) {
  const values = [tour.departureDate, ...(tour.departureDates || [])];
  const uniqueDates = new Set<string>();

  for (const value of values) {
    if (!value) continue;

    const candidate = String(value).trim();
    if (!candidate) continue;
    if (Number.isNaN(new Date(`${candidate}T00:00:00`).getTime())) continue;
    uniqueDates.add(candidate);
  }

  return Array.from(uniqueDates).sort((left, right) => left.localeCompare(right));
}

export function getRecommendationScore(
  tour: Pick<TourSummary, 'title' | 'departureDate' | 'departureDates' | 'hotDepartureDates' | 'isNew'>,
  titleHints: readonly string[],
) {
  let score = 0;

  if (titleHints.some((token) => tour.title.includes(token))) {
    score += 4;
  }

  score += Math.min(tour.departureDates?.length ?? 0, 4);
  score += Math.min(tour.hotDepartureDates?.length ?? 0, 2);

  const sortedDates = getEffectiveDepartureDates(tour);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayInput = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, '0')}-${`${today.getDate()}`.padStart(2, '0')}`;
  const scoreReferenceDate =
    sortedDates.find((date) => date >= todayInput) || sortedDates.at(-1) || tour.departureDate;
  const daysUntil = scoreReferenceDate ? getDaysUntil(scoreReferenceDate) : null;

  if (daysUntil !== null) {
    if (daysUntil < 0) {
      score -= 1;
    } else if (daysUntil <= 7) {
      score += 3;
    } else if (daysUntil <= 30) {
      score += 2;
    } else if (daysUntil <= 90) {
      score += 1;
    }
  }

  if (tour.isNew) {
    score += 1;
  }

  return score;
}

export function compareRecommended(
  a: Pick<TourSummary, 'title' | 'departureDate' | 'departureDates' | 'hotDepartureDates' | 'isNew' | 'isHot' | 'price'>,
  b: Pick<TourSummary, 'title' | 'departureDate' | 'departureDates' | 'hotDepartureDates' | 'isNew' | 'isHot' | 'price'>,
  titleHints: readonly string[],
) {
  return (
    getRecommendationScore(b, titleHints) - getRecommendationScore(a, titleHints) ||
    (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0) ||
    (b.hotDepartureDates?.length ?? 0) - (a.hotDepartureDates?.length ?? 0) ||
    (b.departureDates?.length ?? 0) - (a.departureDates?.length ?? 0) ||
    a.price - b.price
  );
}
