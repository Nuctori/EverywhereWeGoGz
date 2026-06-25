import type { TourSummary } from '@/types/tour';

export function getRequestedTourId(search: string) {
  const normalized = typeof search === 'string' ? search.trim() : '';
  if (!normalized) return '';
  const params = new URLSearchParams(normalized.startsWith('?') ? normalized.slice(1) : normalized);
  return (params.get('tour') || '').trim();
}

export function findTourByDeepLink(search: string, tours: TourSummary[]) {
  const requestedTourId = getRequestedTourId(search);
  if (!requestedTourId) return null;
  return tours.find((tour) => tour.id === requestedTourId) || null;
}
