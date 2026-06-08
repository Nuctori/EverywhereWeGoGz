export interface DayItinerary {
  day: number;
  title: string;
  description: string;
  meals: string[];
  accommodation: string;
  activities: string[];
}

export interface DataQuality {
  hasStructuredDepartureDates?: boolean;
  isDepartureDateReliable?: boolean;
  availabilityConfidence?: 'low' | 'medium' | 'high';
  riskFlags?: string[];
}

export interface TourMeta {
  aiTags?: string[];
  sourceFeatures?: string[];
  sourceAttributes?: Record<string, unknown>;
  dataQuality?: DataQuality;
}

export interface TourSummary {
  id: string;
  title: string;
  source: string;
  destination: string;
  duration: number;
  price: number;
  originalPrice?: number;
  priceUnit: string;
  departureDate: string;
  transportType: string;
  accommodationLevel: string;
  meals: string;
  singleSupplementNote: string;
  highlights: string[];
  rating: number;
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
  leisureLevel: 'easy' | 'medium' | 'hard';
  suitableFor: string[];
  season: string;
  departureDates?: string[];
  hotDepartureDates?: string[];
  meta?: TourMeta;
  dataQuality?: DataQuality;
}

export interface TourDetail {
  sourceLogo: string;
  returnDate: string;
  accommodationStars: number;
  singleSupplement: number;
  availableSeats: number;
  totalSeats: number;
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
  reviewCount: number;
  url?: string;
  difficulty: string;
  language: string;
  sourceId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ResolvedTour = TourSummary & TourDetail;

export type Tour = TourSummary & Partial<TourDetail>;

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
  sortBy: 'price_asc' | 'price_desc' | 'hot' | 'new';
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
  semanticFit?: string;
  semanticSignals?: string[];
  semanticBoundary?: string;
}

export type AiRecommendationProcessMode = 'ai' | 'fallback' | 'local-only';

export type AiRecommendationProgressStage =
  | 'queued'
  | 'intent'
  | 'context'
  | 'ranking'
  | 'completed'
  | 'fallback';

export type AiRecommendationSubstepStatus = 'pending' | 'active' | 'done';

export interface AiRecommendationSubstep {
  id: string;
  label: string;
  detail?: string;
  status: AiRecommendationSubstepStatus;
}

export interface AiRecommendationProgress {
  stage: AiRecommendationProgressStage;
  label: string;
  detail: string;
  progress: number;
  substeps?: AiRecommendationSubstep[];
}

export interface AiRecommendationStatus {
  mode: AiRecommendationProcessMode;
  label: string;
  detail: string;
}

export interface AiRecommendationSemanticNotes {
  worldKnowledgeUse?: string;
  softCriteria: string[];
  cannotAssert: string[];
  caveat?: string;
}

export interface AiRecommendationResult {
  conversationId: string;
  summary: string;
  items: AiRecommendationItem[];
  generatedAt: string;
  source: 'local-preview' | 'ai-api';
  status?: AiRecommendationStatus;
  preferenceMemory?: AiPreferenceMemory;
  semanticNotes?: AiRecommendationSemanticNotes;
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
  dateSpecificSummary?: string;
  weatherWindowLabel?: string;
  weatherRiskLevel?: 'better' | 'mixed' | 'worse' | 'unknown';
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
  semanticFocus?: string[];
  nearestAlternativeOkay?: boolean | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  budgetPriority?: 'low' | 'balanced' | 'premium' | null;
  tripDays?: number | null;
  tripDaysMin?: number | null;
  tripDaysMax?: number | null;
  departureWithinDays?: number | null;
  departureWeekdays: number[];
  departureTimeOfDay?: string | null;
  refinementMode?: 'new_search' | 'refine_previous' | 'broaden' | 'replace_destination' | null;
  updatedAt: string;
}

export type AiRecommendationCandidate = Pick<
  TourSummary,
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
