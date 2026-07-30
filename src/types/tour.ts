// 全域旅游数据类型定义：TourSummary 面向列表，TourDetail 面向详情。
// ResolvedTour 表示完整数据，Tour 表示前端运行时可能只拿到摘要的宽类型。
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
  // availabilityConfidence 取值：low=结构化数据不可信，medium=部分可信，high=来源稳定可信
  availabilityConfidence?: 'low' | 'medium' | 'high';
  riskFlags?: string[];
  syntheticFields?: string[];
  fieldSources?: Record<string, 'source' | 'detail' | 'inferred' | 'unknown' | 'synthetic'>;
}

export type GeoLevel = 'country' | 'region' | 'city' | 'town' | 'poi';
export type GeoStatus = 'complete' | 'destination_only' | 'unmapped';
export type GeoSource = 'source' | 'catalog' | 'geocoder' | 'inferred' | 'unknown';
export type GeoConfidence = 'low' | 'medium' | 'high';

export interface TourGeoPoint {
  placeId: string;
  name: string;
  normalizedName: string;
  label?: string;
  country?: string;
  province?: string;
  city?: string;
  locality?: string;
  latitude: number;
  longitude: number;
  coordinateSystem: 'wgs84';
  level: GeoLevel;
  coordinateSource: 'catalog' | 'geocoder' | 'fallback' | 'inferred';
  source: GeoSource;
  confidence: GeoConfidence;
}

export interface GeoPlaceIndexEntry extends TourGeoPoint {
  tourIds: string[];
  tourCount: number;
  roles: ('departure' | 'destination' | 'stop')[];
}

export interface TourGeo {
  departure?: TourGeoPoint;
  destination?: TourGeoPoint;
  stops: TourGeoPoint[];
  status: GeoStatus;
  routeRegion?: 'local' | 'nearby-province' | 'national' | 'international' | 'unknown';
}

export type ServiceAvailability = 'included' | 'excluded' | 'unknown';

export interface MealCounts {
  breakfast: number;
  lunch: number;
  dinner: number;
}

export interface ServiceStatus {
  visaRequirements: ServiceAvailability;
  travelInsurance: ServiceAvailability;
  tourGuideService: ServiceAvailability;
}

export interface TourMeta {
  aiTags?: string[];
  sourceFeatures?: string[];
  sourceAttributes?: Record<string, unknown>;
  structuredDetails?: {
    accommodationDetails: string[];
    mealCounts?: MealCounts | null;
    serviceStatus: ServiceStatus;
  };
  dataQuality?: DataQuality;
}

export interface TourSummary {
  id: string;
  sourceId?: string;
  title: string;
  source: string;
  destination: string;
  duration: number;
  price: number;
  originalPrice?: number;
  priceUnit: string;
  // departureDate 是默认展示班期；departureDates 是全部班期；hotDepartureDates 是热门班期子集。
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
  geo?: TourGeo;
}

export interface TourIndexEntry {
  id: string;
  sourceId?: string;
  title: string;
  source: string;
  destination: string;
  duration: number;
  price: number;
  bookingUrl: string;
  departureDate: string;
  departureDates?: string[];
  hotDepartureDates?: string[];
  transportType: string;
  accommodationLevel: string;
  meals: string;
  highlights: string[];
  tags: string[];
  isHot: boolean;
  isNew: boolean;
  isFlashSale: boolean;
  theme: string;
  leisureLevel: 'easy' | 'medium' | 'hard';
  rating: number;
  groupSize: string;
  suitableFor: string[];
  season: string;
  page: number;
  searchText?: string;
  geo?: TourGeo;
}

export interface TourDetail {
  sourceLogo: string;
  returnDate: string;
  accommodationStars: number;
  accommodationDetails?: string[];
  mealCounts?: MealCounts;
  serviceStatus?: ServiceStatus;
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
  // 筛选条件里的 departureDate 表示单点选中班期，起止范围由 departureDateStart/End 表达。
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
  /** 内部文案来源：模型原文优先，只有模型没有给出可用文案时才是兜底。 */
  reasonSource?: 'ai' | 'fallback';
  recommendationTier?: 'ai-detailed' | 'ai-brief' | 'local-supplement';
}

// AI 推荐流程模式：ai=正常调用模型，fallback=模型失败后降级，local-only=只走本地规则。
export type AiRecommendationProcessMode = 'ai' | 'fallback' | 'local-only';

// AI 推荐阶段按 queued → intent → context → ranking → completed/fallback 流转。
export type AiRecommendationProgressStage =
  | 'queued'
  | 'intent'
  | 'context'
  | 'ranking'
  | 'completed'
  | 'fallback';

// 子步骤状态按 pending → active → done 演进。
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

export interface AiRecommendationClarification {
  question: string;
  reason?: string;
  options?: string[];
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
  clarification?: AiRecommendationClarification;
  assumptions?: string[];
  tradeoffs?: string[];
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
  weatherComfortScore?: number;
  weatherComfortSummary?: string;
  weatherTemperatureComfort?: number;
  weatherHumidityComfort?: number;
  weatherOutdoorIndex?: number;
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
  returnWeekdays?: number[];
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
