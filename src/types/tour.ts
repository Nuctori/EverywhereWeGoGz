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
  optionalExpenses?: string[];
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
  leisureLevel: 'easy' | 'medium' | 'hard';
  season: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  departureDates?: string[];
  hotDepartureDates?: string[];
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

export type AiRecommendationMessageRole = 'assistant' | 'user';

export interface AiRecommendationMessage {
  id: string;
  role: AiRecommendationMessageRole;
  content: string;
  createdAt: string;
}

export interface AiRecommendationItem {
  tourId: string;
  score: number;
  reason?: string;
  matchedSignals: string[];
}

export type AiRecommendationProcessMode = 'ai' | 'fallback' | 'local-only';

export type AiRecommendationProgressStage =
  | 'queued'
  | 'intent'
  | 'context'
  | 'ranking'
  | 'completed'
  | 'fallback';

export interface AiRecommendationProgress {
  stage: AiRecommendationProgressStage;
  label: string;
  detail: string;
  progress: number;
}

export interface AiRecommendationStatus {
  mode: AiRecommendationProcessMode;
  label: string;
  detail: string;
}

export interface AiRecommendationResult {
  conversationId: string;
  summary: string;
  items: AiRecommendationItem[];
  generatedAt: string;
  source: 'local-preview' | 'ai-api';
  status?: AiRecommendationStatus;
  preferenceMemory?: AiPreferenceMemory;
}

export interface AiProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface AiWeatherContext {
  destination: string;
  travelDate?: string;
  forecastSummary: string;
  seasonAdvice: string[];
  inferredFrom?: string[];
  queryReason?: string;
  bestSeasonNote?: string;
  role?: 'departure' | 'destination';
  source: 'open-meteo' | 'seasonal-rule' | 'none';
}

export interface AiPreferenceMemory {
  destinationHints: string[];
  travelStyle: string[];
  mustHave: string[];
  avoid: string[];
  weatherSensitivity: string[];
  budgetMin?: number | null;
  budgetMax?: number | null;
  budgetPriority?: 'low' | 'balanced' | 'premium' | null;
  tripDays?: number | null;
  tripDaysMin?: number | null;
  tripDaysMax?: number | null;
  departureWeekdays: number[];
  departureTimeOfDay?: string | null;
  refinementMode?: 'new_search' | 'refine_previous' | 'broaden' | 'replace_destination' | null;
  updatedAt: string;
}

export type AiRecommendationCandidate = Pick<
  Tour,
  | 'id'
  | 'title'
  | 'source'
  | 'destination'
  | 'duration'
  | 'price'
  | 'departureDate'
  | 'departureDates'
  | 'transportType'
  | 'accommodationLevel'
  | 'meals'
  | 'highlights'
  | 'tags'
  | 'isHot'
  | 'theme'
  | 'suitableFor'
  | 'leisureLevel'
  | 'season'
  | 'rating'
  | 'groupSize'
  | 'hotDepartureDates'
>;

export interface AiRecommendationRequest {
  conversationId: string;
  messages: AiRecommendationMessage[];
  candidateTours: AiRecommendationCandidate[];
  activeFilters: FilterState;
  searchQuery: string;
  aiConfig?: Partial<AiProviderConfig>;
  preferenceMemory?: AiPreferenceMemory | null;
  previousResult?: AiRecommendationResult | null;
  onProgress?: (progress: AiRecommendationProgress) => void;
}
