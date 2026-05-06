import type { Tour, TourQueryFilters } from '../Contracts/Tour';

export interface PagedTours {
  data: Tour[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function normalizePage(page: number | undefined): number {
  return Number.isFinite(page) && page && page > 0 ? Math.floor(page) : 1;
}

function normalizeLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit) || !limit) {
    return 30;
  }
  return Math.max(1, Math.min(100, Math.floor(limit)));
}

export class TourQueryService {
  query(tours: Tour[], filters: TourQueryFilters): PagedTours {
    const filtered = tours.filter((tour) => {
      if (filters.destination && !tour.destination.includes(filters.destination)) return false;
      if (filters.source && tour.source !== filters.source) return false;
      if (filters.theme && tour.theme !== filters.theme) return false;
      if (filters.minPrice !== undefined && tour.price < filters.minPrice) return false;
      if (filters.maxPrice !== undefined && tour.price > filters.maxPrice) return false;
      if (filters.duration !== undefined && tour.duration !== filters.duration) return false;
      return true;
    });

    const sorted = [...filtered];
    switch (filters.sortBy) {
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'new':
        sorted.sort((a, b) => Number(b.isNew) - Number(a.isNew));
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'hot':
      default:
        sorted.sort(
          (a, b) =>
            Number(b.isHot) - Number(a.isHot) ||
            b.reviewCount - a.reviewCount,
        );
        break;
    }

    const page = normalizePage(filters.page);
    const limit = normalizeLimit(filters.limit);
    const startIndex = (page - 1) * limit;
    const data = sorted.slice(startIndex, startIndex + limit);

    return {
      data,
      total: sorted.length,
      page,
      limit,
      totalPages: Math.ceil(sorted.length / limit),
    };
  }
}
