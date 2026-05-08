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
  itinerary: DayItinerary[];
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

export interface DayItinerary {
  day: number;
  title: string;
  description: string;
  meals: string[];
  accommodation: string;
  activities: string[];
}

export type FilterState = {
  destination: string;
  minPrice: number | null;
  maxPrice: number | null;
  duration: number | null;
  source: string;
  departureDate: string;
  departureDateStart: string;
  departureDateEnd: string;
  theme: string;
  sortBy: 'price_asc' | 'price_desc' | 'hot' | 'new' | 'rating';
};
