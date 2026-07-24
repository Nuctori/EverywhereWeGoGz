// Zod 运行时校验 schema：与 tour.ts 一一对应，用于反序列化防御。
import { z } from 'zod';

const nonNegativeNumber = z.coerce.number().finite().nonnegative();
const booleanDefaultFalse = z.boolean().optional().default(false);
const stringArrayDefaultEmpty = z.array(z.string()).optional().default([]);

export const dataQualitySchema = z.object({
  hasStructuredDepartureDates: z.boolean().optional(),
  isDepartureDateReliable: z.boolean().optional(),
  availabilityConfidence: z.enum(['low', 'medium', 'high']).optional(),
  riskFlags: z.array(z.string()).optional(),
  fieldSources: z.record(z.string(), z.enum(['source', 'detail', 'inferred', 'synthetic', 'unknown'])).optional(),
  syntheticFields: z.array(z.string()).optional(),
});

export const dayItinerarySchema = z.object({
  day: z.coerce.number().int().nonnegative(),
  title: z.string(),
  description: z.string(),
  meals: stringArrayDefaultEmpty,
  accommodation: z.string().optional().default(''),
  activities: stringArrayDefaultEmpty,
});

const tourMetaSchema = z.object({
  aiTags: stringArrayDefaultEmpty,
  sourceFeatures: stringArrayDefaultEmpty,
  sourceAttributes: z.record(z.string(), z.unknown()).optional().default({}),
  dataQuality: dataQualitySchema.optional(),
});

export const tourSummarySchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().optional(),
  title: z.string().min(1),
  source: z.string().min(1),
  destination: z.string().min(1),
  departureCity: z.string().optional(),
  departureProvince: z.string().optional(),
  departureCountry: z.string().optional(),
  departureLatitude: z.number().finite().optional(),
  departureLongitude: z.number().finite().optional(),
  destinationCity: z.string().optional(),
  destinationProvince: z.string().optional(),
  destinationCountry: z.string().optional(),
  destinationLatitude: z.number().finite().optional(),
  destinationLongitude: z.number().finite().optional(),
  geoStatus: z.enum(['complete', 'destination_only', 'unmapped']).optional(),
  geoConfidence: z.enum(['low', 'medium', 'high']).optional(),
  geoSource: z.string().optional(),
  routeRegion: z.enum(['local', 'nearby-province', 'national', 'international', 'unknown']).optional(),
  duration: z.coerce.number().int().positive(),
  price: nonNegativeNumber,
  originalPrice: nonNegativeNumber.optional(),
  priceUnit: z.string().min(1),
  departureDate: z.string().optional().default(''),
  transportType: z.string().optional().default(''),
  accommodationLevel: z.string().optional().default(''),
  meals: z.string().optional().default(''),
  singleSupplementNote: z.string().optional().default(''),
  highlights: stringArrayDefaultEmpty,
  rating: nonNegativeNumber.optional().default(0),
  bookingUrl: z.string().optional().default(''),
  images: stringArrayDefaultEmpty,
  tags: stringArrayDefaultEmpty,
  isHot: booleanDefaultFalse,
  isNew: booleanDefaultFalse,
  isFlashSale: booleanDefaultFalse,
  flashSaleEndTime: z.string().optional(),
  discountRate: nonNegativeNumber.optional(),
  groupSize: z.string().optional().default(''),
  theme: z.string().optional().default(''),
  leisureLevel: z.enum(['easy', 'medium', 'hard']).optional().default('easy'),
  suitableFor: stringArrayDefaultEmpty,
  season: z.string().optional().default(''),
  departureDates: z.array(z.string()).optional(),
  hotDepartureDates: z.array(z.string()).optional(),
  meta: tourMetaSchema.optional(),
  dataQuality: dataQualitySchema.optional(),
});

export const tourDetailSchema = z.object({
  sourceLogo: z.string().optional().default(''),
  returnDate: z.string().optional().default(''),
  accommodationStars: nonNegativeNumber.optional().default(0),
  singleSupplement: nonNegativeNumber.optional().default(0),
  availableSeats: nonNegativeNumber.optional().default(0),
  totalSeats: nonNegativeNumber.optional().default(0),
  itinerary: z.array(dayItinerarySchema).optional().default([]),
  inclusions: stringArrayDefaultEmpty,
  exclusions: stringArrayDefaultEmpty,
  optionalExpenses: z.array(z.string()).optional(),
  importantNotes: stringArrayDefaultEmpty,
  visaRequirements: z.string().optional().default(''),
  travelInsurance: booleanDefaultFalse,
  tourGuideService: booleanDefaultFalse,
  freeWiFi: booleanDefaultFalse,
  childPolicy: z.string().optional().default(''),
  cancellationPolicy: z.string().optional().default(''),
  refundPolicy: z.string().optional().default(''),
  reviewCount: nonNegativeNumber.optional().default(0),
  url: z.string().optional(),
  difficulty: z.string().optional().default(''),
  language: z.string().optional().default(''),
  sourceId: z.string().optional(),
  createdAt: z.string().optional().default(''),
  updatedAt: z.string().optional().default(''),
});

// 由 tourSummarySchema.and(tourDetailSchema) 组合而成，对应 ResolvedTour。
export const resolvedTourSchema = tourSummarySchema.and(tourDetailSchema);
export const toursListSchema = z.array(tourSummarySchema);

export const tourIndexEntrySchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().optional(),
  title: z.string().min(1),
  source: z.string().min(1),
  destination: z.string().min(1),
  departureCity: z.string().optional(),
  departureProvince: z.string().optional(),
  departureCountry: z.string().optional(),
  departureLatitude: z.number().finite().optional(),
  departureLongitude: z.number().finite().optional(),
  destinationCity: z.string().optional(),
  destinationProvince: z.string().optional(),
  destinationCountry: z.string().optional(),
  destinationLatitude: z.number().finite().optional(),
  destinationLongitude: z.number().finite().optional(),
  geoStatus: z.enum(['complete', 'destination_only', 'unmapped']).optional(),
  geoConfidence: z.enum(['low', 'medium', 'high']).optional(),
  geoSource: z.string().optional(),
  routeRegion: z.enum(['local', 'nearby-province', 'national', 'international', 'unknown']).optional(),
  duration: z.coerce.number().int().positive(),
  price: nonNegativeNumber,
  bookingUrl: z.string().optional().default(''),
  departureDate: z.string().optional().default(''),
  departureDates: z.array(z.string()).optional(),
  hotDepartureDates: z.array(z.string()).optional(),
  transportType: z.string().optional().default(''),
  accommodationLevel: z.string().optional().default(''),
  meals: z.string().optional().default(''),
  highlights: stringArrayDefaultEmpty,
  tags: stringArrayDefaultEmpty,
  isHot: booleanDefaultFalse,
  isNew: booleanDefaultFalse,
  isFlashSale: booleanDefaultFalse,
  theme: z.string().optional().default(''),
  leisureLevel: z.enum(['easy', 'medium', 'hard']).optional().default('easy'),
  rating: nonNegativeNumber.optional().default(0),
  groupSize: z.string().optional().default(''),
  suitableFor: stringArrayDefaultEmpty,
  season: z.string().optional().default(''),
  page: z.coerce.number().int().nonnegative(),
  searchText: z.string().optional(),
});
export const toursIndexSchema = z.array(tourIndexEntrySchema);

export const tourDeepLinkIndexSchema = z.array(z.object({
  id: z.string().min(1),
  sourceId: z.string().optional(),
  page: z.coerce.number().int().nonnegative(),
}));

export const toursPageSchema = z.object({
  items: z.array(tourSummarySchema),
  meta: z
    .object({
      total: z.coerce.number().int().nonnegative(),
      page: z.coerce.number().int().nonnegative().optional(),
      pageSize: z.coerce.number().int().positive().optional(),
      hasMore: z.boolean().optional(),
    })
    .passthrough(),
});

const dataFileSchema = z.object({
  path: z.string(),
  size: nonNegativeNumber,
});

export const dataMetaSchema = z.object({
  generatedAt: z.string().nullable().optional().default(null),
  latestUpdatedAt: z.string().nullable().optional().default(null),
  totalRecords: z.coerce.number().int().nonnegative().optional().default(0),
  listRecords: z.coerce.number().int().nonnegative().optional().default(0),
  detailFiles: z.coerce.number().int().nonnegative().optional().default(0),
  sourceStats: z
    .record(z.string(), z.coerce.number().int().nonnegative())
    .optional()
    .default({}),
  destinationStats: z
    .record(z.string(), z.coerce.number().int().nonnegative())
    .optional()
    .default({}),
  // files: raw=原始数据，list=列表数据，details=详情数据。
  files: z
    .object({
      raw: dataFileSchema.optional(),
      list: dataFileSchema.optional(),
      details: dataFileSchema.optional(),
    })
    .optional()
    .default({}),
});

export const aiRecommendationMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['assistant', 'user']),
  content: z.string(),
  createdAt: z.string(),
});

export const aiRecommendationItemSchema = z.object({
  tourId: z.string().min(1),
  score: z.coerce.number().finite(),
  reason: z.string().optional(),
  matchedSignals: z.array(z.string()).optional().default([]),
  semanticFit: z.string().optional(),
  semanticSignals: z.array(z.string()).optional(),
  semanticBoundary: z.string().optional(),
});

const aiRecommendationStatusSchema = z.object({
  mode: z.enum(['ai', 'fallback', 'local-only']),
  label: z.string(),
  detail: z.string(),
});

const aiRecommendationSemanticNotesSchema = z.object({
  worldKnowledgeUse: z.string().optional(),
  softCriteria: z.array(z.string()).optional().default([]),
  cannotAssert: z.array(z.string()).optional().default([]),
  caveat: z.string().optional(),
});

export const aiPreferenceMemorySchema = z.object({
  destinationHints: z.array(z.string()).optional().default([]),
  travelStyle: z.array(z.string()).optional().default([]),
  mustHave: z.array(z.string()).optional().default([]),
  avoid: z.array(z.string()).optional().default([]),
  weatherSensitivity: z.array(z.string()).optional().default([]),
  semanticFocus: z.array(z.string()).optional(),
  nearestAlternativeOkay: z.boolean().nullable().optional(),
  budgetMin: z.coerce.number().nullable().optional(),
  budgetMax: z.coerce.number().nullable().optional(),
  budgetPriority: z.enum(['low', 'balanced', 'premium']).nullable().optional(),
  tripDays: z.coerce.number().nullable().optional(),
  tripDaysMin: z.coerce.number().nullable().optional(),
  tripDaysMax: z.coerce.number().nullable().optional(),
  departureWithinDays: z.coerce.number().nullable().optional(),
  departureWeekdays: z.array(z.coerce.number().int()).optional().default([]),
  returnWeekdays: z.array(z.coerce.number().int()).optional().default([]),
  departureTimeOfDay: z.string().nullable().optional(),
  refinementMode: z
    .enum(['new_search', 'refine_previous', 'broaden', 'replace_destination'])
    .nullable()
    .optional(),
  updatedAt: z.string(),
});

export const aiRecommendationResultSchema = z.object({
  conversationId: z.string().min(1),
  summary: z.string(),
  items: z.array(aiRecommendationItemSchema),
  generatedAt: z.string(),
  source: z.enum(['local-preview', 'ai-api']),
  status: aiRecommendationStatusSchema.optional(),
  preferenceMemory: aiPreferenceMemorySchema.optional(),
  semanticNotes: aiRecommendationSemanticNotesSchema.optional(),
});

export const storedAiProviderConfigSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string().optional(),
});

export const storedAiChatStateSchema = z.object({
  conversationId: z.string().optional(),
  input: z.string().optional(),
  messages: z.array(aiRecommendationMessageSchema).optional(),
  result: aiRecommendationResultSchema.nullish(),
  preferenceMemory: aiPreferenceMemorySchema.nullish(),
});
