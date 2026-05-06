export type TourSortBy = 'price_asc' | 'price_desc' | 'hot' | 'new' | 'rating';

export interface Tour {
  id: string;
  title: string;
  source: string;
  sourceLogo: string;
  destination: string;
  duration: number;
  price: number;
  originalPrice?: number;
  priceUnit: string;
  departureDate: string;
  returnDate: string;
  transportType: string;
  accommodationLevel: string;
  accommodationStars: number;
  meals: string;
  singleSupplement: number;
  singleSupplementNote: string;
  availableSeats: number;
  totalSeats: number;
  highlights: string[];
  itinerary: TourDayItinerary[];
  inclusions: string[];
  exclusions: string[];
  importantNotes: string[];
  visaRequirements: string;
  travelInsurance: boolean;
  tourGuideService: boolean;
  freeWiFi: boolean;
  childPolicy: string;
  cancellationPolicy: string;
  refundPolicy: string;
  rating: number;
  reviewCount: number;
  bookingUrl: string;
  images: string[];
  tags: string[];
  isHot: boolean;
  isNew: boolean;
  isFlashSale: boolean;
  flashSaleEndTime?: string;
  discountRate?: number;
  groupSize: string;
  theme: string;
  suitableFor: string[];
  difficulty: string;
  season: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface TourDayItinerary {
  day: number;
  title: string;
  description: string;
  meals: string[];
  accommodation: string;
  activities: string[];
}

export interface TourQueryFilters {
  destination?: string;
  source?: string;
  theme?: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: number;
  sortBy?: TourSortBy;
  page?: number;
  limit?: number;
}

export interface RawCrawlerItem {
  title?: string;
  source?: string;
  destination?: string;
  category?: string;
  days?: number;
  price?: number;
  originalPrice?: number;
  date_range?: string;
  traffic?: string;
  url?: string;
}

export interface RawCrawlerPayload {
  data?: RawCrawlerItem[];
  total?: number;
}

export interface CrawlStatus {
  lastCrawl: string | null;
  lastCrawlStatus: 'never' | 'running' | 'success' | 'error' | 'mock';
  totalRecords: number;
  sourceStats: Record<string, number>;
  durationMs?: number;
  error?: string;
}
