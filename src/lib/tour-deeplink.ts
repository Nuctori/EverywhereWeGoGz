import type { TourIndexEntry, TourMapCardEntry, TourSummary } from '@/types/tour';

export interface TourDeepLinkTarget {
  tourId: string;
  sourceId: string | null;
}

export interface TourDeepLinkResolution {
  tourId: string;
  page: number | null;
  matchedBy: 'sourceId' | 'tourId';
}

type DeepLinkTourLike = Pick<TourSummary, 'id'> & Partial<Pick<TourSummary, 'sourceId'>>;
type DeepLinkIndexLike = Pick<TourIndexEntry, 'id' | 'page'> &
  Partial<Pick<TourIndexEntry, 'sourceId'>>;

function normalizeParam(value: string | null) {
  return value?.trim() ?? '';
}

function findTourBySourceId<T extends { id: string; sourceId?: string | null }>(
  tours: readonly T[],
  sourceId: string,
) {
  return tours.find((tour) => normalizeParam(tour.sourceId ?? null) === sourceId) ?? null;
}

function findTourById<T extends { id: string }>(tours: readonly T[], tourId: string) {
  return tours.find((tour) => tour.id === tourId) ?? null;
}

function resolvePageForTour(indexTours: readonly DeepLinkIndexLike[], tour: { id: string; sourceId?: string | null }) {
  return (
    findTourBySourceId(indexTours, normalizeParam(tour.sourceId ?? null))?.page ??
    findTourById(indexTours, tour.id)?.page ??
    null
  );
}

export function inflateTourSummaryFromIndexEntry(entry: TourIndexEntry): TourSummary {
  return {
    id: entry.id,
    sourceId: entry.sourceId,
    title: entry.title,
    source: entry.source,
    destination: entry.destination,
    duration: entry.duration,
    price: entry.price,
    priceUnit: '人',
    departureDate: entry.departureDate ?? '',
    transportType: entry.transportType ?? '',
    accommodationLevel: '',
    meals: '',
    singleSupplementNote: '',
    highlights: entry.highlights ?? [],
    rating: entry.rating ?? 0,
    bookingUrl: entry.bookingUrl ?? '',
    images: [],
    tags: entry.tags ?? [],
    isHot: entry.isHot ?? false,
    isNew: entry.isNew ?? false,
    isFlashSale: entry.isFlashSale ?? false,
    groupSize: entry.groupSize ?? '',
    theme: entry.theme ?? '',
    leisureLevel: entry.leisureLevel ?? 'easy',
    suitableFor: entry.suitableFor ?? [],
    season: entry.season ?? '',
    departureDates: entry.departureDates,
    hotDepartureDates: entry.hotDepartureDates,
    geo: entry.geo,
  };
}

export function inflateTourSummaryFromMapCard(entry: TourMapCardEntry): TourSummary {
  return {
    id: entry.id,
    sourceId: entry.sourceId,
    title: entry.title,
    source: entry.source,
    destination: entry.destination,
    duration: entry.duration,
    price: entry.price,
    priceUnit: '人',
    departureDate: entry.departureDate,
    transportType: entry.transportType,
    accommodationLevel: '',
    meals: '',
    singleSupplementNote: '',
    highlights: [],
    rating: 0,
    bookingUrl: entry.bookingUrl,
    images: [],
    tags: [],
    isHot: false,
    isNew: false,
    isFlashSale: false,
    groupSize: '',
    theme: '',
    leisureLevel: 'easy',
    suitableFor: [],
    season: '',
  };
}

export function readTourDeepLink(search: string): TourDeepLinkTarget | null {
  const params = new URLSearchParams(search);
  const sourceId = normalizeParam(params.get('sourceId') || params.get('sid'));
  const tourId = normalizeParam(params.get('tour') || params.get('tourId') || params.get('id'));

  if (!sourceId && !tourId) {
    return null;
  }

  return {
    tourId,
    sourceId: sourceId || null,
  };
}

export function findTourDeepLinkResolution(
  target: TourDeepLinkTarget,
  summaryCollections: readonly DeepLinkTourLike[][],
  indexTours: readonly DeepLinkIndexLike[],
): TourDeepLinkResolution | null {
  if (target.sourceId) {
    for (const tours of summaryCollections) {
      const match = findTourBySourceId(tours, target.sourceId);
      if (match) {
        return {
          tourId: match.id,
          page: resolvePageForTour(indexTours, match),
          matchedBy: 'sourceId',
        };
      }
    }

    const indexedSourceMatch = findTourBySourceId(indexTours, target.sourceId);
    if (indexedSourceMatch) {
      return {
        tourId: indexedSourceMatch.id,
        page: indexedSourceMatch.page,
        matchedBy: 'sourceId',
      };
    }
  }

  if (target.tourId) {
    for (const tours of summaryCollections) {
      const match = findTourById(tours, target.tourId);
      if (match) {
        return {
          tourId: match.id,
          page: resolvePageForTour(indexTours, match),
          matchedBy: 'tourId',
        };
      }
    }

    const indexedIdMatch = findTourById(indexTours, target.tourId);
    if (indexedIdMatch) {
      return {
        tourId: indexedIdMatch.id,
        page: indexedIdMatch.page,
        matchedBy: 'tourId',
      };
    }
  }

  return null;
}
