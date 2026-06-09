import type {
  AiProviderConfig,
  AiPreferenceMemory,
  AiRecommendationCandidate,
  AiRecommendationItem,
  AiRecommendationMessage,
  AiRecommendationProgress,
  AiRecommendationSubstep,
  AiRecommendationRequest,
  AiRecommendationResult,
  AiRecommendationSemanticNotes,
  AiWeatherContext,
  FilterState,
} from '@/types/tour';
import {
  allowsPublicInterestForTurn,
  buildPublicInterestPromptPolicy,
  hasPublicInterestLanguage,
  hasUnallowedPublicInterestLanguage,
  sanitizeAiIntentForTurn,
} from '@/lib/ai-semantic-policy';
import { storedAiProviderConfigSchema } from '@/lib/runtime-schemas';

const AI_CONFIG_STORAGE_KEY = 'travel-ai-provider-config';
const MAX_AI_CANDIDATES = 60;
const MAX_AI_COMMENTARY_ITEMS = 24;
const MAX_AI_PROMPT_REASON_ITEMS = 8;
const MAX_AI_RANKED_ITEMS = 24;
const MAX_DESTINATION_WEATHER_INSIGHTS = 6;
const ROUTE_ATLAS_MAX_GROUPS = 8;
const ROUTE_ATLAS_MAX_EXAMPLES = 2;
const MAX_RECENT_CONVERSATION_MESSAGES = 4;
const AI_FAST_FALLBACK_TIMEOUT_MS = 9000;
const AI_FREE_PROVIDER_TIMEOUT_MS = 60000;
const AI_FREE_PROVIDER_FOREGROUND_TIMEOUT_MS = 42000;
const AI_FREE_PROVIDER_ACTIVE_FOREGROUND_TIMEOUT_MS = 60000;
const AI_DEFAULT_PROVIDER_TIMEOUT_MS = 15000;
const AI_PROVIDER_RETRY_DELAY_MS = 450;
const WEATHER_FETCH_TIMEOUT_MS = 2200;
const AI_CACHE_PROMPT_VERSION = '2026-06-09-price-context-v1';
const DEFAULT_DEPARTURE_CITY = '广州';
const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function withActiveSubstep(
  items: Array<{ id: string; label: string; detail?: string }>,
  activeId: string,
): AiRecommendationSubstep[] {
  const activeIndex = items.findIndex((item) => item.id === activeId);

  return items.map((item, index) => ({
    ...item,
    status: activeIndex === -1 ? 'pending' : index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending',
  }));
}

interface AiTravelIntent {
  tripDays?: number | null;
  tripDaysMin?: number | null;
  tripDaysMax?: number | null;
  departureWithinDays?: number | null;
  departureWeekdays?: number[];
  departureTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night' | 'any' | null;
  destinationHints?: string[];
  budgetMax?: number | null;
  budgetMin?: number | null;
  travelStyle?: string[];
  mustHave?: string[];
  avoid?: string[];
  weatherSensitivity?: string[];
  semanticFocus?: string[];
  nearestAlternativeOkay?: boolean | null;
  budgetPriority?: 'low' | 'balanced' | 'premium' | null;
  refinementMode?: 'new_search' | 'refine_previous' | 'broaden' | 'replace_destination' | null;
  confidence?: number;
}

interface RecommendationContext {
  budgetPriority?: AiTravelIntent['budgetPriority'];
  weatherSensitivity?: string[];
  weatherContext?: AiWeatherContext;
  intent?: AiTravelIntent | null;
  userText?: string;
}

interface RecommendationCopyProfile {
  key:
    | 'elderly_cool_relaxed'
    | 'family_water'
    | 'weekend_budget'
    | 'beach_weather_sensitive'
    | 'scenery_value'
    | 'general';
  wantsCool: boolean;
  wantsRainStability: boolean;
  wantsRelaxed: boolean;
  hasFamilyNeed: boolean;
  hasSeniorNeed: boolean;
  wantsWater: boolean;
  wantsBeach: boolean;
  wantsNature: boolean;
  prefersValue: boolean;
  shortTrip: boolean;
}

interface LocalRecommendationQuery {
  normalizedText: string;
  destinationHints: string[];
  avoidHints: string[];
  themeHints: string[];
  budget: ReturnType<typeof parseBudget>;
  duration: ReturnType<typeof parseDuration>;
  prefersEasyPace: boolean;
  prefersRecentDeparture: boolean;
}

interface DestinationWeatherInsight extends AiWeatherContext {
  role: 'departure' | 'destination';
  queryReason?: string;
  bestSeasonNote?: string;
}

interface CandidateAuditPrimitive extends RecommendationPrimitive {
  matchStatus: 'match' | 'soft_conflict' | 'fallback';
  routeGroup: string;
  conflictReasons: string[];
  userTermHits: string[];
  userTermCoverage: number;
  priceContext: {
    poolPercentile: number | null;
    poolBand: string;
    pricePerDay: number | null;
  };
}

const THEME_KEYWORDS = [
  '亲子',
  '美食',
  '温泉',
  '海岛',
  '摄影',
  '徒步',
  '休闲',
  '自然',
  '文化',
  '避暑',
  '滑雪',
  '邮轮',
  '老人',
  '家庭',
];

const DESTINATION_ALIASES: Record<string, string[]> = {
  桂林: ['桂林', '阳朔', '漓江'],
  三亚: ['三亚', '海南', '海口'],
  云南: ['云南', '昆明', '大理', '丽江', '香格里拉', '西双版纳'],
  张家界: ['张家界', '天门山', '武陵源'],
  西藏: ['西藏', '拉萨', '林芝'],
  新疆: ['新疆', '乌鲁木齐', '喀纳斯', '伊犁'],
  日本: ['日本', '东京', '大阪', '京都', '北海道'],
  韩国: ['韩国', '首尔', '济州'],
  欧洲: ['欧洲', '法国', '意大利', '瑞士', '德国', '西班牙'],
  贵州: ['贵州', '贵阳', '黄果树', '荔波'],
  四川: ['四川', '成都', '九寨沟', '峨眉山'],
  广东: ['广东', '广州', '深圳', '珠海', '潮汕'],
  东南亚: [
    '东南亚',
    '泰国',
    '普吉',
    '普吉岛',
    '苏梅',
    '芭提雅',
    '曼谷',
    '马来西亚',
    '沙巴',
    '仙本那',
    '越南',
    '芽庄',
    '下龙湾',
    '美奈',
    '巴厘',
    '巴厘岛',
    '印度尼西亚',
    '菲律宾',
    '长滩',
    '薄荷岛',
    '新加坡',
    '新马',
  ],
};

const TITLE_DESTINATION_ALIASES: Record<string, string[]> = {
  湖南: ['湖南', '郴州', '崀山', '小东江', '高椅岭', '飞天山'],
  泰国: ['泰国', '曼谷', '芭堤雅', '芭提雅', '大皇宫', '玉佛寺'],
};

const DESTINATION_COORDS: Record<string, { latitude: number; longitude: number }> = {
  桂林: { latitude: 25.2736, longitude: 110.2900 },
  三亚: { latitude: 18.2528, longitude: 109.5119 },
  海南: { latitude: 20.0174, longitude: 110.3492 },
  云南: { latitude: 25.0389, longitude: 102.7183 },
  张家界: { latitude: 29.1171, longitude: 110.4792 },
  西藏: { latitude: 29.6525, longitude: 91.1721 },
  新疆: { latitude: 43.8256, longitude: 87.6168 },
  日本: { latitude: 35.6762, longitude: 139.6503 },
  韩国: { latitude: 37.5665, longitude: 126.9780 },
  欧洲: { latitude: 48.8566, longitude: 2.3522 },
  贵州: { latitude: 26.6470, longitude: 106.6302 },
  四川: { latitude: 30.5728, longitude: 104.0668 },
  广东: { latitude: 23.1291, longitude: 113.2644 },
};

type StoredAiProviderConfig = Partial<AiProviderConfig>;

interface RecommendationPrimitive {
  id: string;
  title: string;
  source: string;
  destination: string;
  tripDays: number;
  price: number;
  theme: string;
  tags: string[];
  highlights: string[];
  transportType: string;
  accommodationLevel: string;
  meals: string;
  leisureLevel: AiRecommendationCandidate['leisureLevel'];
  suitableFor: string[];
  season: string;
  rating: number;
  groupSize: string;
  isHot: boolean;
  semanticAtoms: string[];
  experienceCategories: string[];
  seasonalComfortAtoms: string[];
  schedule: ReturnType<typeof inferScheduleHints>;
}

interface RouteAtlasGroup {
  region: string;
  theme: string;
  count: number;
  priceRange: ReturnType<typeof formatRange>;
  dayRange: ReturnType<typeof formatRange>;
  keywords: string[];
  examples: Array<{ id: string; title: string; price: number; days: number; destination: string; atoms: string[] }>;
}

type RouteAtlas = RouteAtlasGroup[];
type RecommendationAuditContext = ReturnType<typeof buildRecommendationAuditContext>;

const searchCorpusCache = new WeakMap<AiRecommendationCandidate, string>();
const atlasRegionsCache = new WeakMap<AiRecommendationCandidate, string[]>();
const primitiveCache = new WeakMap<AiRecommendationCandidate, RecommendationPrimitive>();
const normalizedTourCache = new WeakMap<AiRecommendationCandidate, AiRecommendationCandidate>();
const routeAtlasCache = new WeakMap<AiRecommendationCandidate[], Map<string, RouteAtlas>>();
const weatherSnapshotCache = new Map<string, Promise<{
  forecastSummary: string;
  dateSpecificSummary?: string;
  weatherWindowLabel?: string;
  weatherRiskLevel?: AiWeatherContext['weatherRiskLevel'];
  source: 'open-meteo' | 'seasonal-rule';
}>>();

function percentile(sortedValues: number[], ratio: number) {
  if (sortedValues.length === 0) return null;
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.floor((sortedValues.length - 1) * ratio)));
  return sortedValues[index];
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function normalizeLooseKey(value: string | number | null | undefined) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s\-_/|()[\]【】·.,，。:：'"`]+/g, '');
}

function compactPreferenceMemoryForPrompt(memory: AiPreferenceMemory | null) {
  if (!memory) return null;

  return {
    d: memory.destinationHints,
    ts: memory.travelStyle,
    mh: memory.mustHave,
    av: memory.avoid,
    ws: memory.weatherSensitivity,
    sf: memory.semanticFocus || [],
    na: memory.nearestAlternativeOkay ?? null,
    b0: memory.budgetMin ?? null,
    b1: memory.budgetMax ?? null,
    bp: memory.budgetPriority ?? null,
    td: memory.tripDays ?? null,
    t0: memory.tripDaysMin ?? null,
    t1: memory.tripDaysMax ?? null,
    dd: memory.departureWithinDays ?? null,
    dw: memory.departureWeekdays,
    dt: memory.departureTimeOfDay ?? null,
    rm: memory.refinementMode ?? null,
  };
}

function compactIntentForPrompt(intent: AiTravelIntent | null) {
  if (!intent) return null;

  return {
    td: intent.tripDays ?? null,
    t0: intent.tripDaysMin ?? null,
    t1: intent.tripDaysMax ?? null,
    dd: intent.departureWithinDays ?? null,
    dw: intent.departureWeekdays || [],
    dt: intent.departureTimeOfDay ?? null,
    d: intent.destinationHints || [],
    b0: intent.budgetMin ?? null,
    b1: intent.budgetMax ?? null,
    ts: intent.travelStyle || [],
    mh: intent.mustHave || [],
    av: intent.avoid || [],
    ws: intent.weatherSensitivity || [],
    sf: intent.semanticFocus || [],
    na: intent.nearestAlternativeOkay ?? null,
    bp: intent.budgetPriority ?? null,
    rm: intent.refinementMode ?? null,
    cf: intent.confidence ?? null,
  };
}

function compactWeatherContextForPrompt(context: AiWeatherContext) {
  return {
    d: context.destination,
    td: context.travelDate || '',
    fs: context.forecastSummary,
    ds: context.dateSpecificSummary || '',
    wl: context.weatherWindowLabel || '',
    rl: context.weatherRiskLevel || '',
    sa: context.seasonAdvice,
    if: context.inferredFrom || [],
    qr: context.queryReason || '',
    bs: context.bestSeasonNote || '',
    ro: context.role || '',
    so: context.source,
  };
}

function compactRangeForPrompt(range: ReturnType<typeof formatRange>) {
  if (!range) return null;
  return [range.min, range.p25, range.median, range.p75, range.max];
}

function compactAuditSnapshotForPrompt(
  snapshot: ReturnType<typeof summarizeToursForAudit> | null | undefined,
) {
  if (!snapshot) return null;
  return {
    c: snapshot.count,
    pr: compactRangeForPrompt(snapshot.priceRange),
    dr: compactRangeForPrompt(snapshot.dayRange),
    td: snapshot.topDestinations.map((item) => [item.name, item.count]),
    tt: snapshot.topThemes.map((item) => [item.name, item.count]),
  };
}

function compactDestinationWeatherInsightsForPrompt(insights: DestinationWeatherInsight[]) {
  return insights.map((insight) => compactWeatherContextForPrompt(insight));
}

function compactRouteAtlasForPrompt(routeAtlas: RouteAtlas) {
  return routeAtlas.map((group) => ({
    r: group.region,
    t: group.theme,
    c: group.count,
    pr: compactRangeForPrompt(group.priceRange),
    dr: compactRangeForPrompt(group.dayRange),
    k: compactPromptStrings(group.keywords, 3, 10),
  }));
}

function compactAuditContextForPrompt(context: RecommendationAuditContext) {
  const compact = compactRecommendationAuditContext(context);
  return {
    ps: compact.previousSummary,
    pt: compactAuditSnapshotForPrompt(compact.previousTopResultSnapshot),
    ep: compactAuditSnapshotForPrompt(compact.effectivePoolSnapshot),
    br: compact.businessRules,
  };
}

function compactPromptText(value: string | null | undefined, maxLength = 36) {
  const text = (value || '')
    .replace(/\s+/g, ' ')
    .replace(/[＊*｜|＜＞<>【】]/g, ' ')
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength);
}

function compactPromptStrings(
  values: Array<string | null | undefined>,
  maxItems: number,
  maxLength = 18,
) {
  return uniqueStrings(values)
    .map((value) => compactPromptText(value, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function compactCandidatesForPrompt(candidates: ReturnType<typeof compactCandidates>) {
  return candidates.map((candidate) => [
    candidate.id,
    compactPromptText(candidate.title, 52),
    candidate.destination,
    candidate.tripDays,
    candidate.price,
    candidate.theme,
    candidate.source,
    candidate.leisureLevel,
    candidate.isHot ? 1 : 0,
    candidate.matchStatus,
    compactPromptText(candidate.routeGroup, 26),
    candidate.schedule.departureDates.slice(0, 3),
    candidate.schedule.departureWeekdays.slice(0, 3),
    candidate.schedule.hasEveningOrNightDeparture ? 1 : 0,
    candidate.priceContext.pricePerDay ?? null,
    compactPromptStrings(candidate.tags, 2, 10),
    compactPromptStrings(candidate.highlights, 2, 22),
    compactPromptStrings(candidate.semanticAtoms, 4, 16),
    compactPromptStrings(candidate.experienceCategories, 3, 8),
    compactPromptStrings(candidate.seasonalComfortAtoms, 2, 16),
    compactPromptStrings(candidate.conflictReasons, 2, 18),
    candidate.priceContext.poolPercentile ?? null,
    candidate.priceContext.poolBand,
    candidate.userTermCoverage,
    compactPromptStrings(candidate.userTermHits, 4, 12),
  ]);
}

function compactCandidatesForLitePrompt(candidates: ReturnType<typeof compactCandidates>) {
  return candidates.map((candidate) => [
    candidate.id,
    compactPromptText(candidate.title, 34),
    candidate.destination,
    candidate.tripDays,
    candidate.price,
    candidate.matchStatus,
    compactPromptStrings(candidate.semanticAtoms, 2, 12),
    compactPromptStrings(candidate.experienceCategories, 2, 8),
    compactPromptStrings(candidate.seasonalComfortAtoms, 1, 14),
    compactPromptStrings(candidate.conflictReasons, 1, 14),
    candidate.priceContext.poolPercentile ?? null,
    candidate.priceContext.poolBand,
    candidate.userTermCoverage,
    compactPromptStrings(candidate.userTermHits, 3, 10),
  ]);
}

function buildStablePromptPrefix(params: {
  candidates: ReturnType<typeof compactCandidates>;
  routeAtlas: RouteAtlas;
}) {
  const prices = params.candidates
    .map((candidate) => candidate.price)
    .filter((price) => Number.isFinite(price) && price > 0);

  return {
    v: AI_CACHE_PROMPT_VERSION,
    ck: [
      'id', 'title', 'destination', 'days', 'price', 'theme', 'source',
      'pace', 'hot', 'match', 'routeGroup', 'dates', 'weekdays', 'night',
      'pricePerDay', 'tags', 'highlights', 'atoms', 'cats', 'seasonAtoms', 'conflicts',
      'pricePct', 'priceBand', 'termCoverage', 'termHits',
    ],
    pc: compactRangeForPrompt(formatRange(prices)),
    candidates: compactCandidatesForPrompt(params.candidates),
    routeAtlas: compactRouteAtlasForPrompt(params.routeAtlas),
  };
}

function getLatestUserText(messages: AiRecommendationMessage[]) {
  return messages
    .filter((message) => message.role === 'user')
    .at(-1)?.content ?? '';
}

function parseBudget(text: string) {
  const chineseBudgetMatch =
    text.match(/(?:预算|人均|价格|费用|花费)\s*(\d{2,6}(?:\.\d+)?)\s*(?:元|块|rmb|人民币)?\s*(以内|以下|内|左右|上下|以上|起)?/i) ||
    text.match(/(\d{2,6}(?:\.\d+)?)\s*(?:元|块|rmb|人民币)\s*(以内|以下|内|左右|上下|以上|起)?/i) ||
    text.match(/(\d{2,6}(?:\.\d+)?)\s*(以内|以下|左右|上下|以上|起)/i);
  if (chineseBudgetMatch) {
    const value = Number(chineseBudgetMatch[1]);
    if (Number.isFinite(value)) {
      const qualifier = chineseBudgetMatch[2] || '';
      if (qualifier.includes('以上') || qualifier.includes('起')) {
        return { min: value, max: Number.POSITIVE_INFINITY };
      }
      return { min: 0, max: value * (qualifier.includes('左右') || qualifier.includes('上下') ? 1.2 : 1) };
    }
  }
  const compactBudgetMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:k|K|千)/);
  if (compactBudgetMatch) {
    const value = Number(compactBudgetMatch[1]) * 1000;
    if (Number.isFinite(value)) {
      return { min: 0, max: value * (text.includes('左右') ? 1.2 : 1) };
    }
  }

  const match = text.match(/(\d{3,6})\s*(?:元|块|以内|以下|左右)?/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;

  if (text.includes('以上') || text.includes('起')) {
    return { min: value, max: Number.POSITIVE_INFINITY };
  }

  return { min: 0, max: value * (text.includes('左右') ? 1.2 : 1) };
}

function parseDuration(text: string) {
  const chineseRangeMatch = text.match(/(\d{1,2})\s*(?:-|\u5230|\u81f3|~|\uff5e)\s*(\d{1,2})\s*(?:\u5929|\u65e5)/u);
  if (chineseRangeMatch) {
    return {
      min: Number(chineseRangeMatch[1]),
      max: Number(chineseRangeMatch[2]),
    };
  }

  const chineseExactMatch = text.match(/(\d{1,2})\s*(?:\u5929|\u65e5)(?:\u5de6\u53f3|\u4e0a\u4e0b|\u4ee5\u5185|\u4ee5\u4e0b|\u4ee5\u4e0a)?/u);
  if (chineseExactMatch) {
    const value = Number(chineseExactMatch[1]);
    const matchedText = chineseExactMatch[0];
    if (matchedText.includes('\u4ee5\u4e0a')) return { min: value, max: Number.POSITIVE_INFINITY };
    if (matchedText.includes('\u4ee5\u5185') || matchedText.includes('\u4ee5\u4e0b')) return { min: 0, max: value };
    return { min: Math.max(0, value - 1), max: value + 1 };
  }
  const rangeMatch = text.match(/(\d{1,2})\s*[-到至]\s*(\d{1,2})\s*天/);
  if (rangeMatch) {
    return {
      min: Number(rangeMatch[1]),
      max: Number(rangeMatch[2]),
    };
  }

  const exactMatch = text.match(/(\d{1,2})\s*天/);
  if (!exactMatch) return null;
  const value = Number(exactMatch[1]);

  if (text.includes('以上')) {
    return { min: value, max: Number.POSITIVE_INFINITY };
  }

  if (text.includes('以内') || text.includes('以下')) {
    return { min: 0, max: value };
  }

  return { min: Math.max(0, value - 1), max: value + 1 };
}

function collectDestinationHints(text: string) {
  return Object.entries(DESTINATION_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => text.includes(alias)))
    .map(([destination]) => destination);
}

function getDestinationAliasesForHint(hint: string) {
  const normalizedHint = hint.trim().toLowerCase();
  if (!normalizedHint) return [];

  const directAliases = DESTINATION_ALIASES[hint];
  if (directAliases) return [hint, ...directAliases];

  const aliasEntry = Object.entries(DESTINATION_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => alias.toLowerCase() === normalizedHint),
  );

  return aliasEntry ? [aliasEntry[0], ...aliasEntry[1]] : [hint];
}

function destinationHintsMatchCorpus(destinationHints: string[] | undefined, corpus: string) {
  if (!destinationHints?.length) return true;
  const normalizedCorpus = corpus.toLowerCase();

  return destinationHints.some((hint) =>
    getDestinationAliasesForHint(hint).some((alias) =>
      normalizedCorpus.includes(alias.toLowerCase()),
    ),
  );
}

function collectDestinationHintsFromCorpus(corpus: string) {
  return Object.entries(DESTINATION_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => corpus.toLowerCase().includes(alias.toLowerCase())))
    .map(([destination]) => destination);
}

function collectTitleDestinationHints(title: string) {
  const normalizedTitle = title.toLowerCase();
  const explicitHints = Object.entries(TITLE_DESTINATION_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => normalizedTitle.includes(alias.toLowerCase())))
    .map(([destination]) => destination);
  return uniqueStrings([
    ...collectDestinationHintsFromCorpus(title),
    ...explicitHints,
  ]);
}

function primitiveHasConflictingTitleDestination(
  intent: AiTravelIntent | null,
  primitive: RecommendationPrimitive,
) {
  if (!intent?.destinationHints?.length) return false;
  const titleHints = collectTitleDestinationHints(primitive.title);
  if (titleHints.length === 0) return false;
  return titleHints.every((hint) => !destinationHintsMatchCorpus(intent.destinationHints, hint));
}

function candidateMatchesDestinationIntent(intent: AiTravelIntent | null, primitive: RecommendationPrimitive) {
  if (!intent?.destinationHints?.length) return true;
  if (primitiveHasConflictingTitleDestination(intent, primitive)) return false;
  return destinationHintsMatchCorpus(intent.destinationHints, `${primitive.destination} ${primitive.title}`);
}

function collectThemeHints(text: string) {
  return THEME_KEYWORDS.filter((keyword) => text.includes(keyword));
}

function cleanAvoidTerm(value: string) {
  return value
    .replace(/^(推荐|考虑|选择|参加|体验|安排|去|玩)+/, '')
    .replace(/(线路|旅行团|旅游团|跟团|产品|主题|项目|玩法|类别|这一类|这类|啊|呀|吧|了|啦)+$/g, '')
    .replace(/[^\p{Script=Han}a-zA-Z0-9]/gu, '')
    .trim();
}

const AVOID_ATOM_KEYWORDS = [
  '温泉',
  '泡汤',
  '海边',
  '海滩',
  '沙滩',
  '徒步',
  '爬山',
  '登山',
  '溯溪',
  '漂流',
  '暴走',
  '穿越',
  '购物',
  '日晒',
];

function expandAvoidTerm(term: string) {
  const atoms = AVOID_ATOM_KEYWORDS.filter((keyword) => term.includes(keyword));
  return atoms.length > 0 ? [term, ...atoms] : [term];
}

function collectAvoidHints(text: string) {
  const normalized = text.replace(/\s+/g, '');
  const matches = normalized.matchAll(
    /(不要推荐|不推荐|不要|不想|不喜欢|不爱|别|避开|排除|不考虑|拒绝|讨厌|受不了|不接受)([^，。；;,.!?！？]*)/g,
  );
  const terms: string[] = [];

  for (const match of matches) {
    const [, , rawSegment = ''] = match;
    const segmentTerms = rawSegment
      .split(/(?:不要推荐|不推荐|不要|不想|不喜欢|不爱|别|避开|排除|不考虑|拒绝|讨厌|受不了|不接受|、|,|，|\/|\||和|或|以及)/)
      .map(cleanAvoidTerm)
      .flatMap(expandAvoidTerm)
      .filter((term) => term.length >= 2 && term.length <= 12);
    terms.push(...segmentTerms);
  }

  return uniqueStrings(terms).slice(0, 8);
}

function collectLiteralAvoidHints(text: string) {
  const normalized = text.replace(/\s+/g, '');
  const hints: string[] = [];
  const avoidPrefix = '(?:不要|不想|不去|别去|避开|排除|不要坐|不坐|不要搭|不搭)';
  const literalTerms = [
    '飞机',
    '飞行',
    '航班',
    '海边',
    '海滩',
    '沙滩',
    '海岛',
    '温泉',
    '泡汤',
    '爬山',
    '徒步',
    '购物',
  ];

  for (const term of literalTerms) {
    if (new RegExp(`${avoidPrefix}[^，。；;,.!?！？、]{0,8}${term}`).test(normalized)) {
      hints.push(term);
    }
  }

  if (/(?:不要|不想|不去|别去|避开|排除)[^，。；;,.!?！？、]{0,8}(?:海边|海滩|沙滩|海岛)/.test(normalized)) {
    hints.push('海边', '海滩', '沙滩', '海岛');
  }
  if (/(?:不要坐|不坐|不要搭|不搭|避开)[^，。；;,.!?！？、]{0,8}(?:飞机|航班|飞行)/.test(normalized)) {
    hints.push('飞机', '航班');
  }

  return uniqueStrings(hints).slice(0, 8);
}

function primitiveMatchesAvoid(primitive: RecommendationPrimitive, avoid: string[] | undefined) {
  if (!avoid?.length) return [];
  const corpus = [
    primitive.title,
    primitive.destination,
    primitive.theme,
    primitive.transportType,
    primitive.accommodationLevel,
    primitive.meals,
    primitive.season,
    ...primitive.tags,
    ...primitive.highlights,
    ...primitive.suitableFor,
    ...primitive.semanticAtoms,
    ...primitive.experienceCategories,
    ...primitive.seasonalComfortAtoms,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return avoid.filter((term) => term && corpus.includes(term.toLowerCase()));
}

function getSearchCorpus(tour: AiRecommendationCandidate) {
  const cached = searchCorpusCache.get(tour);
  if (cached) return cached;

  const corpus = [
    tour.title,
    tour.destination,
    tour.theme,
    tour.source,
    tour.transportType,
    tour.accommodationLevel,
    tour.meals,
    tour.groupSize,
    tour.season,
    ...tour.tags,
    ...tour.highlights,
    ...(tour.suitableFor || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  searchCorpusCache.set(tour, corpus);
  return corpus;
}

function buildLocalRecommendationQuery(text: string): LocalRecommendationQuery {
  const normalizedText = normalizeText(text);
  const avoidHints = uniqueStrings([
    ...collectAvoidHints(normalizedText),
    ...collectLiteralAvoidHints(normalizedText),
  ]);

  return {
    normalizedText,
    destinationHints: collectDestinationHints(normalizedText),
    avoidHints,
    themeHints: collectThemeHints(normalizedText).filter((hint) => !avoidHints.includes(hint)),
    budget: parseBudget(normalizedText),
    duration: parseDuration(normalizedText),
    prefersEasyPace:
      normalizedText.includes('轻松') ||
      normalizedText.includes('休闲') ||
      normalizedText.includes('老人'),
    prefersRecentDeparture:
      normalizedText.includes('近期') ||
      normalizedText.includes('马上') ||
      normalizedText.includes('本周'),
  };
}

function scoreTour(tour: AiRecommendationCandidate, query: LocalRecommendationQuery): AiRecommendationItem | null {
  const corpus = getSearchCorpus(tour);
  if (query.avoidHints.some((hint) => corpus.includes(normalizeText(hint)))) {
    return null;
  }

  const signals: string[] = [];
  let score = 0;

  for (const hint of query.destinationHints) {
    if (destinationHintsMatchCorpus([hint], `${tour.destination} ${tour.title} ${corpus}`)) {
      score += 18;
      signals.push(`目的地匹配：${hint}`);
      break;
    }
  }

  for (const hint of query.themeHints) {
    if (corpus.includes(normalizeText(hint))) {
      score += 10;
      signals.push(`偏好匹配：${hint}`);
    }
  }

  if (query.budget) {
    if (tour.price >= query.budget.min && tour.price <= query.budget.max) {
      score += 12;
      signals.push(`预算接近：￥${tour.price.toLocaleString()}`);
    } else if (Number.isFinite(query.budget.max) && tour.price <= query.budget.max * 1.25) {
      score += 5;
      signals.push('价格略高但仍可比较');
    }
  }

  if (query.duration && tour.duration >= query.duration.min && tour.duration <= query.duration.max) {
    score += 10;
    signals.push(`天数合适：${tour.duration}天`);
  }

  if (query.prefersEasyPace) {
    if (tour.leisureLevel === 'easy') {
      score += 10;
      signals.push('行程强度较轻');
    } else if (tour.leisureLevel === 'hard') {
      score -= 8;
    }
  }

  if (query.prefersRecentDeparture) {
    score += Math.min(tour.hotDepartureDates?.length ?? 0, 3) * 3;
    if ((tour.hotDepartureDates?.length ?? 0) > 0) {
      signals.push('近期班期较多');
    }
  }

  if (tour.isHot) score += 4;
  if (tour.rating >= 4.7) score += 3;

  if (score <= 0) return null;

  return {
    tourId: tour.id,
    score,
    reason: buildLocalTourReason(tour, signals, '综合匹配度较高'),
    matchedSignals: signals.slice(0, 5),
  };
}

function fallbackRecommendations(tours: AiRecommendationCandidate[]): AiRecommendationItem[] {
  return [...tours]
    .sort((a, b) =>
      (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0) ||
      (b.rating || 0) - (a.rating || 0) ||
      a.price - b.price,
    )
    .map((tour, index) => ({
      tourId: tour.id,
      score: Math.max(1, 100 - index),
      reason: index < MAX_AI_COMMENTARY_ITEMS
        ? buildLocalTourReason(
            tour,
            tour.isHot ? ['候选池排序靠前'] : ['候选池补充结果'],
            '候选池补充结果，建议打开详情核对行程',
          )
        : undefined,
      matchedSignals: tour.isHot ? ['候选池排序靠前'] : ['候选池补充结果'],
    }));
}

function localRecommendations(tours: AiRecommendationCandidate[], text: string) {
  const query = buildLocalRecommendationQuery(text);
  const items = tours
    .map((tour) => scoreTour(tour, query))
    .filter((item): item is AiRecommendationItem => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({
      ...item,
      reason: index < MAX_AI_COMMENTARY_ITEMS ? item.reason : undefined,
    }));

  return items.length > 0 ? items : fallbackRecommendations(tours);
}

function buildLocalRecommendationText(
  userText: string,
  preferenceMemory: AiPreferenceMemory | null | undefined,
) {
  const memoryTerms = [
    ...(preferenceMemory?.destinationHints || []),
    ...(preferenceMemory?.travelStyle || []),
    ...(preferenceMemory?.mustHave || []),
    ...(preferenceMemory?.semanticFocus || []),
    ...(preferenceMemory?.avoid || []).map((term) => `避开${term}`),
    ...(preferenceMemory?.weatherSensitivity || []),
    preferenceMemory?.budgetMax ? `${preferenceMemory.budgetMax}元以内` : '',
    preferenceMemory?.tripDays ? `${preferenceMemory.tripDays}天` : '',
    preferenceMemory?.tripDaysMin || preferenceMemory?.tripDaysMax
      ? `${preferenceMemory.tripDaysMin ?? 0}-${preferenceMemory.tripDaysMax ?? ''}天`
      : '',
  ];

  return uniqueStrings([userText, ...memoryTerms]).join(' ');
}

function buildEffectiveUserText(
  userText: string,
  preferenceMemory: AiPreferenceMemory | null | undefined,
) {
  return buildLocalRecommendationText(userText, preferenceMemory);
}

function shouldInheritPreferenceMemoryForTurn(
  text: string,
  intent: AiTravelIntent | null,
  memory: AiPreferenceMemory | null | undefined,
) {
  void intent;
  if (!memory) return false;
  const normalizedText = text.replace(/\s+/g, '');
  const isRelativeTurn = /(上一轮|刚才|继续|沿用|保留|类似|这个|这些|上面|前面|再便宜|便宜一点|贵一点|轻松点|换一个|换成|不要|避开|剔除|更接近)/.test(
    normalizedText,
  );
  // 经验：只有相对续写才继承上一轮偏好，普通新搜索不要把旧预算/目的地/风格
  // 注入本轮硬意图，否则会把 AI 的判断空间偷偷收窄。
  return isRelativeTurn;
}

function buildHardIntentFromText(text: string): AiTravelIntent | null {
  const normalizedText = normalizeText(text);
  const budget = parseBudget(normalizedText);
  const hasTextBudget = Boolean(budget);
  const duration = parseDuration(normalizedText);
  const promptDateWindow = resolvePromptDateWindow(normalizedText);
  const avoid = uniqueStrings([
    ...collectAvoidHints(normalizedText),
    ...collectLiteralAvoidHints(normalizedText),
  ]);
  const weatherSensitivity = /(天气|气温|温度|下雨|降雨|暴雨|雷暴|台风|预报|季节|避暑|怕热|闷热|风浪)/.test(normalizedText)
    ? ['天气敏感']
    : [];
  const intent: AiTravelIntent = {
    destinationHints: uniqueStrings([
      ...collectDestinationHints(normalizedText),
    ]),
    avoid,
    weatherSensitivity,
    budgetMin: hasTextBudget && budget?.min && Number.isFinite(budget.min) ? budget.min : null,
    budgetMax: hasTextBudget && budget?.max && Number.isFinite(budget.max) ? budget.max : null,
    tripDaysMin: duration?.min && Number.isFinite(duration.min) ? duration.min : null,
    tripDaysMax: duration?.max && Number.isFinite(duration.max) ? duration.max : null,
    departureWithinDays: promptDateWindow
      ? Math.max(
          1,
          Math.round(
            ((parseDateString(promptDateWindow.end)?.getTime() ?? 0) -
              (parseDateString(promptDateWindow.start)?.getTime() ?? 0)) / 86400000,
          ),
        )
      : null,
    refinementMode: 'new_search',
  };

  // 经验：本地只提取可审计约束。扶贫/公益/研学/贫穷地方等软语义不要在这里做词表规则，
  // 页面筛选器也不注入硬意图；它只作为 UI 上下文和展示筛选，避免规则器和智能互相打架。
  const normalizedIntent = normalizeBudgetPriorityByUserText(normalizeIntent(intent), text);
  return getHardIntentSignalCount(normalizedIntent) > 0 ? normalizedIntent : null;
}

function getHardIntentSignalCount(intent: AiTravelIntent | null) {
  if (!intent) return 0;

  return [
    intent.tripDays,
    intent.tripDaysMin,
    intent.tripDaysMax,
    intent.departureWithinDays,
    intent.departureTimeOfDay,
    intent.budgetMin,
    intent.budgetMax,
    ...(intent.departureWeekdays || []),
    ...(intent.destinationHints || []),
    ...(intent.avoid || []),
    ...(intent.weatherSensitivity || []),
  ].filter((value) => value !== null && value !== undefined && value !== '').length;
}

function mergeAiRankingIntent(
  hardIntent: AiTravelIntent | null,
  aiIntent: AiTravelIntent | null,
): AiTravelIntent | null {
  if (!hardIntent && !aiIntent) return null;
  if (!hardIntent) return aiIntent;
  if (!aiIntent) return hardIntent;

  return {
    ...aiIntent,
    destinationHints: hardIntent.destinationHints?.length
      ? hardIntent.destinationHints
      : aiIntent.destinationHints || [],
    avoid: uniqueStrings([...(hardIntent.avoid || []), ...(aiIntent.avoid || [])]),
    weatherSensitivity: uniqueStrings([
      ...(hardIntent.weatherSensitivity || []),
      ...(aiIntent.weatherSensitivity || []),
    ]),
    budgetMin: hardIntent.budgetMin ?? aiIntent.budgetMin ?? null,
    budgetMax: hardIntent.budgetMax ?? aiIntent.budgetMax ?? null,
    tripDays: hardIntent.tripDays ?? aiIntent.tripDays ?? null,
    tripDaysMin: hardIntent.tripDaysMin ?? aiIntent.tripDaysMin ?? null,
    tripDaysMax: hardIntent.tripDaysMax ?? aiIntent.tripDaysMax ?? null,
    departureWithinDays: hardIntent.departureWithinDays ?? aiIntent.departureWithinDays ?? null,
    departureWeekdays: hardIntent.departureWeekdays?.length
      ? hardIntent.departureWeekdays
      : aiIntent.departureWeekdays || [],
    departureTimeOfDay: hardIntent.departureTimeOfDay ?? aiIntent.departureTimeOfDay ?? null,
    refinementMode: hardIntent.refinementMode ?? aiIntent.refinementMode ?? null,
  };
}

function buildDateWindowFromIntent(intent: AiTravelIntent | null) {
  if (!intent?.departureWithinDays || intent.departureWithinDays <= 0) return null;
  const today = getTodayInputValue();
  return {
    start: today,
    end: addDaysInputValue(today, Math.min(intent.departureWithinDays, 30)),
  };
}

function getPrimitiveIntentCorpus(primitive: RecommendationPrimitive) {
  return [
    primitive.title,
    primitive.destination,
    primitive.theme,
    primitive.transportType,
    primitive.accommodationLevel,
    primitive.meals,
    primitive.season,
    ...primitive.tags,
    ...primitive.highlights,
    ...primitive.suitableFor,
    ...primitive.semanticAtoms,
    ...primitive.experienceCategories,
    ...primitive.seasonalComfortAtoms,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function getIntentSemanticTerms(intent: AiTravelIntent | null) {
  if (!intent) return [];

  return uniqueStrings([
    ...(intent.travelStyle || []),
    ...(intent.mustHave || []),
    ...(intent.semanticFocus || []),
    ...(intent.destinationHints || []),
  ]).filter((term) => term.length >= 2 && term.length <= 16);
}

function getPrimitiveMatchedIntentTerms(
  primitive: RecommendationPrimitive,
  terms: string[] | undefined,
) {
  if (!terms?.length) return [];
  const corpus = getPrimitiveIntentCorpus(primitive);
  return terms.filter((term) => corpus.includes(term.toLowerCase()));
}

function scoreBudgetFit(
  price: number,
  intent: AiTravelIntent,
): { score: number; signal?: string } {
  if (intent.budgetMin && intent.budgetMax && intent.budgetMin <= intent.budgetMax) {
    if (price < intent.budgetMin) return { score: -14 };
    if (price > intent.budgetMax) return { score: -18 };

    return {
      score: 10,
      signal: `预算区间内：￥${price.toLocaleString()}`,
    };
  }

  if (intent.budgetMax) {
    if (price > intent.budgetMax) return { score: -18 };

    return {
      score: 8,
      signal: `预算内：￥${price.toLocaleString()}`,
    };
  }

  if (intent.budgetMin) {
    return price >= intent.budgetMin
      ? { score: 6, signal: `预算达到：￥${price.toLocaleString()}` }
      : { score: -14 };
  }

  return { score: 0 };
}

function buildIntentLocalRecommendations(
  tours: AiRecommendationCandidate[],
  intent: AiTravelIntent | null,
): AiRecommendationItem[] {
  // 经验：本地意图排序只做候选补位和可审计信号。
  // 像公益/研学/住好一点/更像上一轮需求/海边但怕风浪这类软语义，交给模型结合
  // semanticFocus、上下文和候选原语去理解；不要继续在这里长出新的软语义规则器。
  if (!intent) return [];
  const allTerms = getIntentSemanticTerms(intent);
  const poolMatchedTerms = new Set(
    tours.flatMap((tour) => getPrimitiveMatchedIntentTerms(buildTourPrimitive(tour), allTerms)),
  );

  const dateWindow = buildDateWindowFromIntent(intent);
  const scoredItems = tours
    .map((tour) => {
      const primitive = buildTourPrimitive(tour);
      if (primitiveMatchesAvoid(primitive, intent.avoid).length > 0) return null;

      const signals: string[] = [];
      let score = 0;

      if (intent.destinationHints?.length) {
        const matchedDestinationHint = getMatchedDestinationHint(intent, primitive);
        if (matchedDestinationHint) {
          score += 32;
          signals.push(`目的地贴合：${matchedDestinationHint}`);
        } else {
          score -= 18;
        }
      }

      const mustHaveMatched = getPrimitiveMatchedIntentTerms(primitive, intent.mustHave);
      const enforceableMustHave = (intent.mustHave || []).filter((term) => poolMatchedTerms.has(term));
      if (mustHaveMatched.length > 0) {
        score += Math.min(28, mustHaveMatched.length * 14);
        signals.push(`核心诉求命中：${mustHaveMatched.slice(0, 2).join('、')}`);
      } else if (enforceableMustHave.length > 0) {
        score -= 20;
      }

      const styleMatched = getPrimitiveMatchedIntentTerms(primitive, intent.travelStyle);
      if (styleMatched.length > 0) {
        score += Math.min(24, styleMatched.length * 8);
        signals.push(`偏好贴近：${styleMatched.slice(0, 2).join('、')}`);
      }

      if (intent.tripDays && primitive.tripDays === intent.tripDays) {
        score += 12;
        signals.push(`天数匹配：${primitive.tripDays}天`);
      } else if (
        intent.tripDaysMin &&
        intent.tripDaysMax &&
        primitive.tripDays >= intent.tripDaysMin &&
        primitive.tripDays <= intent.tripDaysMax
      ) {
        score += 10;
        signals.push(`天数匹配：${primitive.tripDays}天`);
      }

      if (intent.budgetMax || intent.budgetMin) {
        const budgetFit = scoreBudgetFit(primitive.price, intent);
        score += budgetFit.score;
        if (budgetFit.signal && budgetFit.score > 0) {
          signals.push(budgetFit.signal);
        }
      }

      if (dateWindow) {
        const hitWindow = matchesDateWindow(tour, dateWindow);
        if (hitWindow) {
          score += 14;
          signals.push(`${intent.departureWithinDays}天内可出发`);
        } else if (getCandidateDepartureDates(tour).length > 0) {
          score -= 12;
        }
      }

      if (intent.departureWeekdays?.length) {
        const hasWeekday = primitive.schedule.departureWeekdays.some((weekday) =>
          intent.departureWeekdays?.includes(weekday),
        );
        if (hasWeekday) {
          score += 8;
          signals.push(`班期匹配：${primitive.schedule.departureWeekdayLabels[0] || '指定出发日'}`);
        } else if (primitive.schedule.departureWeekdays.length > 0) {
          score -= 6;
        }
      }

      if (
        (intent.departureTimeOfDay === 'evening' || intent.departureTimeOfDay === 'night') &&
        primitive.schedule.hasEveningOrNightDeparture
      ) {
        score += 6;
        signals.push('支持晚间出发');
      }

      score += Math.min(6, primitive.rating || 0);
      score += primitive.isHot ? 3 : 0;

      if (score <= 0) return null;

      return {
        tourId: primitive.id,
        score,
        reason: buildLocalTourReason(tour, signals, '基于当前意图的相近候选'),
        matchedSignals: signals.slice(0, 5),
      } satisfies AiRecommendationItem;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const items: AiRecommendationItem[] = scoredItems
    .sort((a, b) => b.score - a.score)
    .map((item) => item);

  return limitRecommendationCommentary(items);
}

function analyzeIntentCoverage(
  candidates: ReturnType<typeof compactCandidates>,
  intent: AiTravelIntent | null,
) {
  const requestedTerms = getIntentSemanticTerms(intent);
  if (requestedTerms.length === 0) {
    return {
      requestedTerms: [],
      matchedTerms: [],
      unmetTerms: [],
    };
  }

  const matchedTerms = uniqueStrings(requestedTerms.filter((term) =>
    candidates.some((candidate) => getPrimitiveIntentCorpus(candidate).includes(term.toLowerCase())),
  ));

  return {
    requestedTerms,
    matchedTerms,
    unmetTerms: requestedTerms.filter((term) => !matchedTerms.includes(term)),
  };
}

function stripRecommendationCommentary(item: AiRecommendationItem): AiRecommendationItem {
  return {
    ...item,
    reason: undefined,
    matchedSignals: [],
  };
}

function limitRecommendationCommentary(items: AiRecommendationItem[]): AiRecommendationItem[] {
  let commentaryCount = 0;

  return items.map((item) => {
    if (!item.reason) {
      return stripRecommendationCommentary(item);
    }

    commentaryCount += 1;
    return commentaryCount <= MAX_AI_COMMENTARY_ITEMS
      ? item
      : stripRecommendationCommentary(item);
  });
}

function mergeAiAndLocalRecommendations(
  aiItems: AiRecommendationItem[],
  localItems: AiRecommendationItem[],
): AiRecommendationItem[] {
  // 经验：合并阶段保持 AI 排序主导，只拿本地结果做补位。
  // 如果这里让本地分数反向覆盖 AI，规则器和智能会互相打架，复杂软语义会被拉回低价/热门启发式。
  const seenTourIds = new Set<string>();
  const primaryAiItems = aiItems
    .filter((item) => {
      if (seenTourIds.has(item.tourId)) return false;
      seenTourIds.add(item.tourId);
      return true;
    });
  const supplementalLocalItems = localItems.filter((item) => {
    if (seenTourIds.has(item.tourId)) return false;
    seenTourIds.add(item.tourId);
    return true;
  });

  return limitRecommendationCommentary([...primaryAiItems, ...supplementalLocalItems]);
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

function uniqueNumbers(values: Array<number | undefined | null>) {
  return [...new Set(values.filter((value): value is number => Number.isFinite(value)))];
}

function preferenceMentionsTerm(preference: string, term: string) {
  const normalizedPreference = preference.toLowerCase();
  const normalizedTerm = term.toLowerCase();
  return normalizedPreference.includes(normalizedTerm) || normalizedTerm.includes(normalizedPreference);
}

function mergePreferenceMemory(
  previous: AiPreferenceMemory | null | undefined,
  intent: AiTravelIntent | null,
): AiPreferenceMemory {
  const replacesDestination = intent?.refinementMode === 'replace_destination' || intent?.refinementMode === 'new_search';
  const hasNewDestination = Boolean(intent?.destinationHints?.length);
  const positivePreferences = uniqueStrings([
    ...(intent?.travelStyle || []),
    ...(intent?.mustHave || []),
  ]);
  const currentAvoid = intent?.avoid || [];
  const mergedAvoid = uniqueStrings([
    ...(previous?.avoid || []),
    ...currentAvoid,
  ]).filter((term) =>
    currentAvoid.includes(term) ||
    !positivePreferences.some((preference) => preferenceMentionsTerm(preference, term)),
  );

  return {
    destinationHints: uniqueStrings(
      hasNewDestination && replacesDestination
        ? intent?.destinationHints || []
        : [...(previous?.destinationHints || []), ...(intent?.destinationHints || [])],
    ).slice(-12),
    travelStyle: uniqueStrings([
      ...(previous?.travelStyle || []),
      ...(intent?.travelStyle || []),
    ]).slice(-16),
    mustHave: uniqueStrings([
      ...(previous?.mustHave || []),
      ...(intent?.mustHave || []),
    ]).slice(-16),
    semanticFocus: uniqueStrings([
      ...(previous?.semanticFocus || []),
      ...(intent?.semanticFocus || []),
    ]).slice(-16),
    avoid: mergedAvoid.slice(-16),
    weatherSensitivity: uniqueStrings([
      ...(previous?.weatherSensitivity || []),
      ...(intent?.weatherSensitivity || []),
    ]).slice(-12),
    nearestAlternativeOkay: intent?.nearestAlternativeOkay ?? previous?.nearestAlternativeOkay ?? null,
    budgetMin: intent?.budgetMin ?? previous?.budgetMin ?? null,
    budgetMax: intent?.budgetMax ?? previous?.budgetMax ?? null,
    budgetPriority: intent?.budgetPriority ?? previous?.budgetPriority ?? null,
    tripDays: intent?.tripDays ?? previous?.tripDays ?? null,
    tripDaysMin: intent?.tripDaysMin ?? previous?.tripDaysMin ?? null,
    tripDaysMax: intent?.tripDaysMax ?? previous?.tripDaysMax ?? null,
    departureWithinDays: intent?.departureWithinDays ?? previous?.departureWithinDays ?? null,
    departureWeekdays: uniqueNumbers([
      ...(previous?.departureWeekdays || []),
      ...(intent?.departureWeekdays || []),
    ]).filter((weekday) => weekday >= 0 && weekday <= 6),
    departureTimeOfDay: intent?.departureTimeOfDay ?? previous?.departureTimeOfDay ?? null,
    refinementMode: intent?.refinementMode ?? previous?.refinementMode ?? null,
    updatedAt: new Date().toISOString(),
  };
}

function getDepartureDates(tour: AiRecommendationCandidate) {
  return [
    ...(tour.departureDates || []),
    ...(tour.hotDepartureDates || []),
    tour.departureDate,
  ]
    .filter(Boolean)
    .filter((date, index, all) => all.indexOf(date) === index);
}

function normalizeCandidateTour(tour: AiRecommendationCandidate): AiRecommendationCandidate {
  const cached = normalizedTourCache.get(tour);
  if (cached) return cached;

  const normalizedDates = getCandidateDepartureDates(tour);
  const upcomingDepartureDate = normalizedDates[0];
  const normalized = upcomingDepartureDate && upcomingDepartureDate !== tour.departureDate
    ? {
        ...tour,
        departureDate: upcomingDepartureDate,
      }
    : tour;
  normalizedTourCache.set(tour, normalized);
  return normalized;
}

function padRecommendationItems(
  items: AiRecommendationItem[],
  fallbackPool: AiRecommendationItem[],
) {
  const seenTourIds = new Set(items.map((item) => item.tourId));
  const padded = [...items];

  for (const item of fallbackPool) {
    if (seenTourIds.has(item.tourId)) continue;
    seenTourIds.add(item.tourId);
    padded.push(item);
  }

  return limitRecommendationCommentary(padded).slice(0, MAX_AI_RANKED_ITEMS);
}

function countCommentaryItems(items: AiRecommendationItem[]) {
  return items.reduce((count, item) => count + (item.reason ? 1 : 0), 0);
}

function prioritizeRecommendationItems(items: AiRecommendationItem[]) {
  return limitRecommendationCommentary(items).slice(0, MAX_AI_RANKED_ITEMS);
}

function getWeekday(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.getDay();
}

const SEMANTIC_ATOM_STOPWORDS = new Set([
  '纯玩',
  '品质',
  '其他必打卡',
  '特色美食',
  '精品住宿',
  '产品特色',
  '含餐',
  '含早',
  '待确认',
  '广东必打卡',
  '自然风光',
  '海岛度假',
  '美食之旅',
  '古镇文化',
  '摄影之旅',
  '户外徒步',
  '安排',
  '住宿',
]);

const SEMANTIC_ATOM_PATTERN =
  /[\p{Script=Han}A-Za-z0-9]{0,8}(?:温泉|漂流|海滩|沙滩|水上乐园|水世界|冰雪世界|冰世界|森林公园|森林|氧吧|博物馆|古城|古镇|峡谷|瀑布|溶洞|玻璃桥|游船|花海|水乡|寺|山|岛|湾|湖|河|乐园|公园|度假村|美食|演出|摄影|亲子)[\p{Script=Han}A-Za-z0-9]{0,4}/gu;

function stripSemanticAtomNoise(value: string) {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/【[^】]*】/g, '')
    .replace(/＜[^＞]*＞/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/\d+\s*(?:天|日|晚|小时|人|元|月|号|餐|正|早|次)/g, '')
    .replace(/等待确认|参考价格|单人出行费用待确认|产品特色|广州出发|东莞出发|深圳出发/g, '')
    .trim();
}

function normalizeSemanticAtom(value: string) {
  return stripSemanticAtomNoise(value)
    .replace(/\d+$/g, '')
    .replace(/[^\p{Script=Han}a-zA-Z0-9]/gu, '')
    .trim();
}

function isUsefulSemanticAtom(value: string) {
  if (value.length < 2 || value.length > 12) return false;
  if (/必打卡$|^安排$|^住宿$|^含/.test(value)) return false;
  return !SEMANTIC_ATOM_STOPWORDS.has(value);
}

function expandSemanticAtomParts(value: string) {
  const cleaned = stripSemanticAtomNoise(value);
  const directParts = cleaned.split(/[＊*｜|、，,。；;：:·+＋\-—_（）()【】＜＞<>\s/]+/g);
  const patternParts = cleaned.match(SEMANTIC_ATOM_PATTERN) || [];

  return [...directParts, ...patternParts];
}

function extractSemanticAtoms(tour: AiRecommendationCandidate) {
  const rawParts = [
    tour.theme,
    ...(tour.tags || []),
    ...(tour.highlights || []),
    tour.title,
  ];

  return uniqueStrings(
    rawParts
      .flatMap(expandSemanticAtomParts)
      .map(normalizeSemanticAtom)
      .filter(isUsefulSemanticAtom),
  ).slice(0, 10);
}

function extractExperienceCategories(tour: AiRecommendationCandidate) {
  const corpus = [
    tour.title,
    ...(tour.highlights || []).filter((highlight) => !SEMANTIC_ATOM_STOPWORDS.has(highlight)),
  ].filter(Boolean).join(' ').toLowerCase();
  const categories: string[] = [];
  const lodgingOnly = /住宿套餐|酒店住宿|门票|门票套餐|景点套票|接载|单程接送|摄影写真/.test(corpus);
  const hasBeachSignal = /海边|海滩|沙滩|海景|海岛|双月湾|巽寮湾|沙扒湾|盐洲岛|南澳岛|海陵岛|上下川|放鸡岛|游艇|浮潜|潜水/.test(corpus);
  const hasIndoorSignal = /冰世界|冰雪世界|室内|度假村|别墅|庄园|亲子|乐园/.test(corpus);
  const hasMountainSignal = /森林|氧吧|瀑布|峡谷|溶洞|山水|山泉|湿地|绿道|星湖|丹霞|九瀑|云门山|白水寨|古龙峡|黄腾峡|三百山|天露山|紫云谷|姑婆山|草原|长白山|呼伦贝尔|喀纳斯|香格里拉|玉龙雪山|九寨沟/.test(corpus);
  const hasWaterPlaySignal = /漂流|溯溪|桨板|浆板|sup|水上乐园|水世界|冲浪|游泳|嬉水|亲水|山泉水泳道/.test(corpus);
  const hasPoolOnlySignal = /泳池/.test(corpus) && !hasBeachSignal && !hasWaterPlaySignal;

  if (lodgingOnly) return ['非跟团产品'];

  if (/温泉|泡汤|汤泉|热泉|铁泉|御泉|颐和|银盏|聚龙湾|云天海|雅泡|带池|私汤|依泉楼|spa/i.test(corpus)) categories.push('温泉泡汤');
  if (hasWaterPlaySignal) {
    categories.push('玩水清凉');
  }
  if (hasBeachSignal) {
    categories.push('海边沙滩');
  }
  if (hasMountainSignal) {
    categories.push('森林山水');
  }
  if (/博物馆|古城|古镇|水乡|碉楼|祠|寺|学村|文化|非遗|骑楼|南风古灶|潮州|开平/.test(corpus)) {
    categories.push('文化逛城');
  }
  if (/美食|早茶|牛肉|海鲜|火锅|顺德|潮汕|乳鸽|烧鹅|茶点|寻味/.test(corpus)) {
    categories.push('美食体验');
  }
  if (hasIndoorSignal || hasPoolOnlySignal) {
    categories.push('室内度假');
  }
  if (/徒步|登山|爬山|暴走|穿越|骑行/.test(corpus)) {
    categories.push('户外强度');
  }

  return uniqueStrings(categories).slice(0, 4);
}

function isLikelyAiNonTour(primitive: RecommendationPrimitive) {
  return primitive.experienceCategories.includes('非跟团产品');
}

function extractSeasonalComfortAtoms(tour: AiRecommendationCandidate) {
  const corpus = [
    tour.title,
    ...(tour.highlights || []).filter((highlight) => !SEMANTIC_ATOM_STOPWORDS.has(highlight)),
  ].filter(Boolean).join(' ').toLowerCase();
  const comfortAtoms: string[] = [];
  const riskAtoms: string[] = [];

  if (/水上|水世界|漂流|嬉水|亲水|游泳|泳池|溯溪|冲浪/.test(corpus)) {
    comfortAtoms.push('夏季友好：水上活动');
  }
  if (/冰|冰雪|室内/.test(corpus)) {
    comfortAtoms.push('夏季友好：清凉室内体验');
  }
  if (/森林|氧吧|山泉|瀑布|溶洞|峡谷|湿地|绿道|星湖|丹霞|九瀑|云门山|白水寨|古龙峡|黄腾峡|三百山|天露山|紫云谷|姑婆山/.test(corpus)) {
    comfortAtoms.push('夏季友好：森林山水遮阴');
  }
  if (/博物馆|室内|冰世界|冰雪世界/.test(corpus)) {
    comfortAtoms.push('夏季友好：室内或避暑点');
  }
  if (/温泉|泡汤|汤泉|热泉|铁泉|御泉|颐和|银盏|聚龙湾|云天海|雅泡|带池|私汤|依泉楼|spa/i.test(corpus)) {
    riskAtoms.push('高温天气需取舍：温泉泡汤');
  }
  if (/徒步|爬山|登山|暴走/.test(corpus)) {
    riskAtoms.push('高温天气需取舍：户外强度');
  }
  if (/徒步|登山|爬山|穿越|峡谷|瀑布|溯溪|漂流|山峰|古龙峡|黄腾峡|白水寨|紫云谷|天露山|云门山|姑婆山|三百山/.test(corpus)) {
    riskAtoms.push('雨天需取舍：山水户外或涉水风险');
  }
  if (/海边|海滩|沙滩|海景|海岛|双月湾|巽寮湾|沙扒湾|盐洲岛|南澳岛|海陵岛/.test(corpus)) {
    riskAtoms.push('天气敏感：海边晴雨和风浪');
  }

  return uniqueStrings([...riskAtoms, ...comfortAtoms]).slice(0, 3);
}

function getReasonAtomsForTour(tour: AiRecommendationCandidate) {
  const broadTerms = new Set([
    tour.destination,
    tour.theme,
    ...(tour.tags || []),
    ...THEME_KEYWORDS,
    '休闲',
    '度假',
    '广东',
  ].filter(Boolean));

  const atoms = extractSemanticAtoms(tour).filter((atom) =>
    !broadTerms.has(atom) &&
    !tour.destination.includes(atom) &&
    !atom.includes('度假') &&
    !atom.includes('纯玩'),
  );

  return (atoms.length > 0 ? atoms : extractSemanticAtoms(tour)).slice(0, 2);
}

function buildLocalTourReason(tour: AiRecommendationCandidate, signals: string[], fallback: string) {
  const atoms = getReasonAtomsForTour(tour);
  const concrete = atoms.length > 0 ? `${tour.destination}${atoms.join('、')}` : '';
  const signalText = signals.slice(0, 2).join('，');

  if (concrete && signalText) return `${concrete}；${signalText}`;
  if (concrete) return `${concrete}，可作为具体玩法备选`;
  return signalText || fallback;
}

function inferScheduleHints(tour: AiRecommendationCandidate) {
  const corpus = getSearchCorpus(tour);
  const dates = getCandidateDepartureDates(tour);
  const weekdays = dates
    .map(getWeekday)
    .filter((day): day is number => day !== null);
  const textWeekdays = WEEKDAY_LABELS
    .map((label, weekday) => {
      const short = label.replace('周', '');
      const matched =
        corpus.includes(label) ||
        corpus.includes(`星期${short}`) ||
        corpus.includes(`礼拜${short}`) ||
        (weekday === 0 && (corpus.includes('周天') || corpus.includes('星期天')));
      return matched ? weekday : null;
    })
    .filter((weekday): weekday is number => weekday !== null);
  const uniqueWeekdays = [...new Set([...weekdays, ...textWeekdays])].sort((a, b) => a - b);
  const eveningDeparture = /晚|晚上|夜间|夜发|夜游|卧铺|夕发|夜宿/.test(corpus);
  const recurringText = /每周|天天|全年|逢周|固定发团|班期/.test(corpus);

  return {
    departureDates: dates.slice(0, 6),
    departureWeekdays: uniqueWeekdays.slice(0, 5),
    departureWeekdayLabels: uniqueWeekdays.slice(0, 5).map((weekday: number) => WEEKDAY_LABELS[weekday]),
    timeOfDayHints: eveningDeparture ? ['evening', 'night'] : [],
    hasEveningOrNightDeparture: eveningDeparture,
    hasRecurringScheduleText: recurringText,
    rawScheduleText: [tour.title, tour.departureDate, ...(tour.hotDepartureDates || []).slice(0, 3)]
      .filter(Boolean)
      .join(' · ')
      .slice(0, 160),
  };
}

function buildTourPrimitive(tour: AiRecommendationCandidate): RecommendationPrimitive {
  const cached = primitiveCache.get(tour);
  if (cached) return cached;

  const primitive = {
    id: tour.id,
    title: tour.title,
    source: tour.source,
    destination: tour.destination,
    tripDays: tour.duration,
    price: tour.price,
    theme: tour.theme,
    tags: tour.tags?.slice(0, 4) ?? [],
    highlights: tour.highlights?.slice(0, 3) ?? [],
    transportType: tour.transportType,
    accommodationLevel: tour.accommodationLevel,
    meals: tour.meals,
    leisureLevel: tour.leisureLevel,
    suitableFor: tour.suitableFor?.slice(0, 3) ?? [],
    season: tour.season,
    rating: tour.rating,
    groupSize: tour.groupSize,
    isHot: tour.isHot,
    semanticAtoms: extractSemanticAtoms(tour),
    experienceCategories: extractExperienceCategories(tour),
    seasonalComfortAtoms: extractSeasonalComfortAtoms(tour),
    schedule: inferScheduleHints(tour),
  };

  primitiveCache.set(tour, primitive);
  return primitive;
}

function getAtlasRegions(tour: AiRecommendationCandidate) {
  const cached = atlasRegionsCache.get(tour);
  if (cached) return cached;

  const corpus = getSearchCorpus(tour);
  const regions = Object.entries(DESTINATION_ALIASES)
    .filter(([destination, aliases]) =>
      tour.destination.includes(destination) ||
      aliases.some((alias) => corpus.includes(alias.toLowerCase())),
    )
    .map(([destination]) => destination);

  const resolved = regions.length > 0 ? regions : [tour.destination || '其他'];
  atlasRegionsCache.set(tour, resolved);
  return resolved;
}

function getAtlasGroupKey(tour: AiRecommendationCandidate) {
  const [region] = getAtlasRegions(tour);
  return `${region}｜${tour.theme || '综合'}`;
}

function formatRange(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0],
    p25: percentile(sorted, 0.25),
    median: sorted[Math.floor(sorted.length / 2)],
    p75: percentile(sorted, 0.75),
    max: sorted[sorted.length - 1],
  };
}

function buildRouteAtlas(tours: AiRecommendationCandidate[]): RouteAtlas {
  const atlasCacheKey = AI_CACHE_PROMPT_VERSION;
  const atlasCacheByIntent = routeAtlasCache.get(tours);
  const cached = atlasCacheByIntent?.get(atlasCacheKey);
  if (cached) return cached;

  const groups = new Map<string, {
    key: string;
    region: string;
    theme: string;
    count: number;
    prices: number[];
    days: number[];
    keywords: Map<string, number>;
    examples: Array<{ id: string; title: string; price: number; days: number; destination: string; atoms: string[] }>;
  }>();

  for (const tour of tours) {
    const key = getAtlasGroupKey(tour);
    const [region, theme] = key.split('｜');
    const primitive = buildTourPrimitive(tour);
    const group = groups.get(key) || {
      key,
      region,
      theme,
      count: 0,
      prices: [],
      days: [],
      keywords: new Map<string, number>(),
      examples: [],
    };

    group.count += 1;
    group.prices.push(tour.price);
    group.days.push(tour.duration);

    for (const keyword of [
      tour.destination,
      tour.theme,
      tour.transportType,
      ...tour.tags.slice(0, 4),
      ...tour.highlights.slice(0, 3),
      ...primitive.experienceCategories.slice(0, 4),
      ...primitive.semanticAtoms.slice(0, 5),
      ...primitive.seasonalComfortAtoms.slice(0, 3),
    ].filter(Boolean)) {
      group.keywords.set(keyword, (group.keywords.get(keyword) || 0) + 1);
    }

    if (group.examples.length < ROUTE_ATLAS_MAX_EXAMPLES) {
      group.examples.push({
        id: tour.id,
        title: tour.title,
        price: tour.price,
        days: tour.duration,
        destination: tour.destination,
        atoms: primitive.semanticAtoms.slice(0, 3),
      });
    }

    groups.set(key, group);
  }

  const atlas = [...groups.values()]
    .sort((a, b) =>
      b.count - a.count ||
      a.region.localeCompare(b.region, 'zh-Hans-CN') ||
      a.theme.localeCompare(b.theme, 'zh-Hans-CN'),
    )
    .slice(0, ROUTE_ATLAS_MAX_GROUPS)
    .map((group) => ({
      region: group.region,
      theme: group.theme,
      count: group.count,
      priceRange: formatRange(group.prices),
      dayRange: formatRange(group.days),
      keywords: [...group.keywords.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([keyword]) => keyword),
      examples: group.examples,
    }));

  const nextCache = atlasCacheByIntent || new Map<string, RouteAtlas>();
  nextCache.set(atlasCacheKey, atlas);
  routeAtlasCache.set(tours, nextCache);
  return atlas;
}

function summarizeToursForAudit(tours: AiRecommendationCandidate[]) {
  const prices = tours
    .map((tour) => tour.price)
    .filter((price) => Number.isFinite(price) && price > 0)
    .sort((a, b) => a - b);
  const days = tours
    .map((tour) => tour.duration)
    .filter((day) => Number.isFinite(day) && day > 0)
    .sort((a, b) => a - b);
  const destinations = new Map<string, number>();
  const themes = new Map<string, number>();

  for (const tour of tours) {
    if (tour.destination) destinations.set(tour.destination, (destinations.get(tour.destination) || 0) + 1);
    if (tour.theme) themes.set(tour.theme, (themes.get(tour.theme) || 0) + 1);
  }

  const topEntries = (values: Map<string, number>) =>
    [...values.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

  return {
    count: tours.length,
    priceRange: formatRange(prices),
    dayRange: formatRange(days),
    topDestinations: topEntries(destinations),
    topThemes: topEntries(themes),
  };
}

function buildRecommendationAuditContext(
  candidateTours: AiRecommendationCandidate[],
  previousResult: AiRecommendationResult | null | undefined,
  effectiveIntent: AiTravelIntent | null = null,
) {
  const candidateById = new Map(candidateTours.map((tour) => [tour.id, tour]));
  const previousTours = previousResult?.items
    .map((item) => candidateById.get(item.tourId))
    .filter((tour): tour is AiRecommendationCandidate => Boolean(tour))
    .slice(0, 80) ?? [];
  const inheritedDestinationTours = effectiveIntent?.destinationHints?.length
    ? candidateTours.filter((tour) => destinationHintsMatchCorpus(
      effectiveIntent.destinationHints,
      `${tour.destination} ${tour.title}`,
    ))
    : [];

  return {
    previousResult: previousResult ? {
      summary: previousResult.summary,
      source: previousResult.source,
      topResultSnapshot: summarizeToursForAudit(previousTours.slice(0, 18)),
      allPinnedSnapshot: summarizeToursForAudit(previousTours),
    } : null,
    effectivePoolSnapshot: summarizeToursForAudit(inheritedDestinationTours.length > 0 ? inheritedDestinationTours : candidateTours),
    businessKnowledge: [
      '多轮短句通常是在上一轮需求上追加偏好；除非明确换目的地或重开搜索，应继承上一轮目的地、主题、天数和同行人偏好。',
      '相对价格需求要与上一轮推荐和同目的地/同主题/相近天数的价格分布比较，不应只按全站绝对低价排序。',
      '低价推荐仍需保留班期真实性、目的地匹配、天数合理、行程强度和天气风险；价格只是收窄和排序因素。',
      '如果便宜候选会牺牲海岛度假属性、班期或舒适度，应在 summary 和 reason 里直说取舍。',
    ],
  };
}

function compactRecommendationAuditContext(context: RecommendationAuditContext) {
  return {
    previousSummary: context.previousResult?.summary ?? null,
    previousTopResultSnapshot: context.previousResult?.topResultSnapshot ?? null,
    effectivePoolSnapshot: context.effectivePoolSnapshot,
    businessRules: [
      '用户明确说不要或避开某主题时，把它作为强偏好和风险提示；如果作为近似替代，必须明说取舍。',
      '低价、班期多和热门只能作为候选事实，是否采用由 AI 结合用户原话取舍。',
    ],
  };
}

function intentMatchesPrimitive(intent: AiTravelIntent | null, primitive: RecommendationPrimitive) {
  return getPrimitiveConflictReasons(intent, primitive).length === 0;
}

function getPrimitiveConflictReasons(intent: AiTravelIntent | null, primitive: RecommendationPrimitive) {
  const reasons: string[] = [];
  if (!intent) return reasons;

  if (intent.tripDays && primitive.tripDays !== intent.tripDays) {
    reasons.push(`天数不是${intent.tripDays}天`);
  }
  if (intent.tripDaysMin && primitive.tripDays < intent.tripDaysMin) {
    reasons.push(`天数少于${intent.tripDaysMin}天`);
  }
  if (intent.tripDaysMax && primitive.tripDays > intent.tripDaysMax) {
    reasons.push(`天数超过${intent.tripDaysMax}天`);
  }
  if (intent.departureWithinDays) {
    const dateWindow = buildDateWindowFromIntent(intent);
    const hasDateInWindow = dateWindow
      ? primitive.schedule.departureDates.some((date) => date >= dateWindow.start && date <= dateWindow.end)
      : true;
    if (dateWindow && primitive.schedule.departureDates.length > 0 && !hasDateInWindow) {
      reasons.push(`缺少${intent.departureWithinDays}天内可出发班期`);
    }
  }
  if (intent.budgetMin && primitive.price < intent.budgetMin) {
    reasons.push(`价格低于预算下限￥${intent.budgetMin.toLocaleString()}`);
  }
  if (intent.budgetMax && primitive.price > intent.budgetMax) {
    reasons.push(`价格高于预算上限￥${intent.budgetMax.toLocaleString()}`);
  }

  const weekdays = intent.departureWeekdays?.filter((day) => Number.isInteger(day)) ?? [];
  if (weekdays.length > 0) {
    const hasWeekday = primitive.schedule.departureWeekdays.some((weekday) => weekdays.includes(weekday));
    if (!hasWeekday) {
      reasons.push(`缺少${weekdays.map((weekday) => WEEKDAY_LABELS[weekday]).join('/')}出发班期`);
    }
  }

  if (
    (intent.departureTimeOfDay === 'evening' || intent.departureTimeOfDay === 'night') &&
    !primitive.schedule.hasEveningOrNightDeparture
  ) {
    reasons.push('未识别到晚间或夜间出发');
  }

  if (intent.destinationHints?.length) {
    if (!candidateMatchesDestinationIntent(intent, primitive)) {
      reasons.push(`目的地不匹配：${intent.destinationHints.join('/')}`);
    }
  }

  const avoidMatches = primitiveMatchesAvoid(primitive, intent.avoid);
  if (avoidMatches.length > 0) {
    reasons.push(`命中需避开条件：${avoidMatches.join('/')}`);
  }

  return reasons;
}

function getMatchedDestinationHint(intent: AiTravelIntent | null, primitive: RecommendationPrimitive) {
  if (!intent?.destinationHints?.length) return '';
  if (primitiveHasConflictingTitleDestination(intent, primitive)) return '';
  const corpus = `${primitive.destination} ${primitive.title}`;
  return intent.destinationHints.find((hint) => destinationHintsMatchCorpus([hint], corpus)) || '';
}

function rankPrimitive(
  primitive: RecommendationPrimitive,
  localItems: AiRecommendationItem[],
  context?: RecommendationContext,
) {
  void context;
  const localRank = localItems.findIndex((item) => item.tourId === primitive.id);
  const localRankBoost = localRank >= 0 ? Math.max(0, 200 - localRank * 6) : 0;
  const nearestDeparture = primitive.schedule.departureDates[0];
  const todayTimestamp = parseDateString(getTodayInputValue())?.getTime() ?? 0;
  const nearestDepartureTimestamp = parseDateString(nearestDeparture)?.getTime() ?? 0;
  const departureLeadDays = nearestDeparture
    ? Math.max(0, Math.floor((nearestDepartureTimestamp - todayTimestamp) / 86400000))
    : null;
  const hasFutureDeparture = primitive.schedule.departureDates.length > 0;
  const departureBonus = hasFutureDeparture && nearestDeparture
    ? Math.max(0, 18 - (departureLeadDays ?? 0))
    : -36;

  return (
    localRankBoost +
    (primitive.isHot ? 16 : 0) +
    Math.min(primitive.schedule.departureDates.length, 6) * 3 +
    (primitive.schedule.hasRecurringScheduleText ? 5 : 0) +
    departureBonus +
    (primitive.rating || 0) * 2
  );
}

function getPrimitiveExperienceAtoms(primitive: RecommendationPrimitive, limit = 2) {
  const broadTerms = new Set([
    primitive.destination,
    primitive.theme,
    ...primitive.tags,
    ...THEME_KEYWORDS,
    '休闲',
    '度假',
    '广东',
  ].filter(Boolean));
  const concreteAtoms = primitive.semanticAtoms.filter((atom) =>
    !broadTerms.has(atom) &&
    !primitive.experienceCategories.includes(atom) &&
    !primitive.destination.includes(atom) &&
    !atom.includes('度假') &&
    !atom.includes('纯玩'),
  );

  if (concreteAtoms.length > 0) return concreteAtoms.slice(0, limit);

  const fallbackAtoms = uniqueStrings([
    primitive.theme,
    ...primitive.tags,
    ...primitive.highlights,
  ])
    .map(normalizeSemanticAtom)
    .filter(isUsefulSemanticAtom)
    .filter((atom) => !primitive.destination.includes(atom));

  return (fallbackAtoms.length > 0 ? fallbackAtoms : ['综合']).slice(0, limit);
}

function getReasonFactAtoms(primitive: RecommendationPrimitive) {
  return uniqueStrings([
    ...getPrimitiveExperienceAtoms(primitive, 4),
    ...primitive.semanticAtoms,
    ...primitive.highlights,
  ])
    .map(normalizeSemanticAtom)
    .filter(isUsefulSemanticAtom)
    .filter((atom) =>
      !THEME_KEYWORDS.includes(atom) &&
      atom !== primitive.theme &&
      !primitive.destination.includes(atom) &&
      !atom.includes('度假') &&
      !atom.includes('纯玩'),
    );
}

function reasonMentionsCandidateFact(reason: string, primitive: RecommendationPrimitive) {
  const normalizedReason = normalizeText(reason);
  const facts = getReasonFactAtoms(primitive);

  return facts.some((fact) => normalizedReason.includes(normalizeText(fact)));
}

function isGenericReason(reason: string) {
  return /^(价格|低价|班期|热门|性价比|预算|天数|行程|综合|适合预算)|综合匹配|性价比高|班期多|价格低|自然风光生态|适合轻松|天气取舍/.test(reason);
}

function shouldKeepAiReason(reason: string, primitive: RecommendationPrimitive) {
  const trimmed = stripTerminalPunctuation(reason);
  if (trimmed.length < 12) return false;
  if (hasInternalRecommendationLanguage(trimmed)) return false;
  if (hasUnsupportedPublicInterestClaim(trimmed, primitive)) return false;
  if (isGenericReason(trimmed) && !reasonMentionsCandidateFact(trimmed, primitive)) return false;
  return true;
}

function hasPublicInterestNeed(intent: AiTravelIntent | null, userText: string) {
  const corpus = [
    userText,
    ...(intent?.semanticFocus || []),
    ...(intent?.travelStyle || []),
    ...(intent?.mustHave || []),
  ].join(' ');
  return hasPublicInterestLanguage(corpus);
}

function primitiveHasPublicInterestEvidence(primitive: RecommendationPrimitive) {
  const corpus = [
    primitive.title,
    primitive.destination,
    primitive.theme,
    ...primitive.tags,
    ...primitive.highlights,
    ...primitive.semanticAtoms,
  ].join(' ');
  // 经验：这不是“扶贫路线词表推荐器”，只是一道事实审计。
  // 模型可以用世界知识做软语义排序，但贫困/公益/扶贫属于事实性强标签；
  // 候选没有这些证据时，文案只能说证据不足或近似替代，不能把普通目的地贴成贫困地区。
  return /(扶贫|公益|慈善|助农|乡村振兴|乡村|村|古村|瑶寨|苗寨|侗寨|壮寨|民族村|农家|田园|梯田|县|县城|山区|支教|研学)/.test(corpus);
}

function hasUnsupportedPublicInterestClaim(reason: string, primitive: RecommendationPrimitive) {
  if (!hasPublicInterestLanguage(reason) && !/(经济相对|较落后|较弱)/.test(reason)) {
    return false;
  }
  if (isBoundedPublicInterestStatement(reason)) return false;
  return !primitiveHasPublicInterestEvidence(primitive);
}

function buildPublicInterestAlternativeReason(primitive: RecommendationPrimitive) {
  const baseReason = stripTerminalPunctuation(buildPrimitiveConcreteReason(primitive));
  const evidence = primitiveHasPublicInterestEvidence(primitive)
    ? '候选原语里有乡村、县域或公益相关线索，可作为该方向的优先候选'
    : '候选没有显式扶贫/公益标注，只能按县域、乡村或周边体验做近似替代';
  return `${baseReason}；${evidence}`;
}

function getPrimitiveTitleFact(primitive: RecommendationPrimitive) {
  return normalizeSemanticAtom(primitive.title)
    .replace(/^\d+/, '')
    .slice(0, 14) || primitive.destination || primitive.theme || '这条线路';
}

function getPrimitiveWeatherNudge(primitive: RecommendationPrimitive) {
  const categories = new Set(primitive.experienceCategories);
  if (categories.has('海边沙滩')) return '出发前看一下晴雨和风浪';
  if (categories.has('玩水清凉')) return '水上活动建议留意降雨和现场开放情况';
  if (categories.has('温泉泡汤')) return '高温天泡汤体感要稍微取舍';
  if (categories.has('森林山水') || categories.has('户外强度')) return '山水户外遇到连雨天体验会打折';
  return '';
}

function formatPrimitivePrice(primitive: RecommendationPrimitive) {
  return Number.isFinite(primitive.price) && primitive.price > 0
    ? `￥${primitive.price.toLocaleString()}`
    : '';
}

function hasPositivePriceClaim(text: string) {
  return /(预算友好|价格友好|预算贴边|预算内|预算达到|符合预算|预算符合|在预算|预算约|预算大约|预算\s*\d|低于预算带|低价|便宜|不贵|划算|性价比|省钱|实惠)/.test(text);
}

function hasExplicitValueIntent(intent: AiTravelIntent | null, userText: string) {
  const corpus = [
    userText,
    ...(intent?.travelStyle || []),
    ...(intent?.semanticFocus || []),
    ...(intent?.mustHave || []),
  ].join(' ');
  return Boolean(intent?.budgetMax) || /(便宜|预算|性价比|不贵|划算|省钱|实惠|低价|穷游)/.test(corpus);
}

function hasUnsupportedPositivePriceClaim(params: {
  reason: string;
  primitive: RecommendationPrimitive;
  intent: AiTravelIntent | null;
  userText: string;
  sortedPrices: number[];
}) {
  const hasValueIntent = hasExplicitValueIntent(params.intent, params.userText);
  if (/预算/.test(params.reason) && !hasValueIntent) return true;
  if (!hasPositivePriceClaim(params.reason)) return false;
  if (params.intent?.budgetMax && params.primitive.price > params.intent.budgetMax) return true;

  const pricePercentile = getPricePercentile(params.primitive.price, params.sortedPrices);
  if (pricePercentile === null) return false;

  if (hasValueIntent) {
    return pricePercentile > 75;
  }

  return pricePercentile > 50;
}

function buildPrimitiveConcreteReason(primitive: RecommendationPrimitive, variant = 0) {
  const atoms = getPrimitiveExperienceAtoms(primitive, 2)
    .filter((atom) => atom !== '综合')
    .filter((atom) => !primitive.experienceCategories.includes(atom));
  const titleFact = getPrimitiveTitleFact(primitive);
  const priceText = formatPrimitivePrice(primitive);
  const dayText = primitive.tripDays > 0 ? `${primitive.tripDays}天` : '';
  const routeText = [primitive.destination, dayText].filter(Boolean).join(' · ');
  const transportText = primitive.transportType ? ` · ${primitive.transportType}` : '';
  const factText = atoms.length > 0 ? atoms.join('、') : titleFact;
  const weatherNudge = getPrimitiveWeatherNudge(primitive);
  const parts = [
    factText ? `看点：${factText}` : '',
    routeText ? `行程：${routeText}${transportText}` : '',
    priceText ? `参考价：${priceText}` : '',
    weatherNudge ? `提醒：${weatherNudge}` : '',
  ].filter(Boolean);
  if (parts.length <= 1) return parts[0] || '候选事实较少，需打开详情再确认';
  const offset = Math.abs(variant) % parts.length;
  return [...parts.slice(offset), ...parts.slice(0, offset)].slice(0, 3).join('；');
}

function buildCopyIntentProfile(
  intent: AiTravelIntent | null,
  userText: string,
): RecommendationCopyProfile {
  const text = userText.replace(/\s+/g, '');
  const joinedStyle = [
    ...(intent?.travelStyle || []),
    ...(intent?.mustHave || []),
    ...(intent?.weatherSensitivity || []),
    text,
  ].join(' ');
  const wantsCool = /(怕热|避暑|清凉|凉快|别太晒|不想暴晒|闷热)/.test(joinedStyle);
  const wantsRainStability = /(避雨|怕下雨|天气敏感|风浪|台风|降雨|预报)/.test(joinedStyle);
  const wantsRelaxed = /(轻松|别太赶|慢一点|老人|长辈|休闲|不折腾)/.test(joinedStyle);
  const hasFamilyNeed = /(亲子|孩子|小朋友|家庭)/.test(joinedStyle);
  const hasSeniorNeed = /(老人|长辈|爸妈)/.test(joinedStyle);
  const wantsWater = /(玩水|漂流|泳池|水上乐园|亲水|溯溪|冲浪|水世界)/.test(joinedStyle);
  const wantsBeach = /(海边|海岛|沙滩|海景)/.test(joinedStyle);
  const wantsNature = /(风景|山水|自然|森林|草原|雪山|湖)/.test(joinedStyle);
  const prefersValue = /(便宜|预算|性价比|不贵|划算|值)/.test(joinedStyle) || Boolean(intent?.budgetMax);
  const shortTrip = Boolean(
    (intent?.tripDays && intent.tripDays <= 4) ||
    (intent?.tripDaysMax && intent.tripDaysMax <= 4) ||
    /周末|3天|4天|短途/.test(joinedStyle),
  );

  let key: RecommendationCopyProfile['key'] = 'general';
  if ((hasSeniorNeed || wantsRelaxed) && wantsCool) key = 'elderly_cool_relaxed';
  else if (hasFamilyNeed && wantsWater) key = 'family_water';
  else if (shortTrip && prefersValue) key = 'weekend_budget';
  else if (wantsBeach && wantsRainStability) key = 'beach_weather_sensitive';
  else if (wantsNature && prefersValue) key = 'scenery_value';

  return {
    key,
    wantsCool,
    wantsRainStability,
    wantsRelaxed,
    hasFamilyNeed,
    hasSeniorNeed,
    wantsWater,
    wantsBeach,
    wantsNature,
    prefersValue,
    shortTrip,
  };
}

function getPrimitivePrimaryCategory(primitive: RecommendationPrimitive) {
  return primitive.experienceCategories.find((category) => category !== '非跟团产品') || '';
}

function isGenericMatchedSignal(signal: string) {
  return /^(低价|价格|便宜|班期|热门|性价比|预算|轻松|自然风光|综合|AI综合推荐|天气)$/.test(signal.trim());
}

function buildPrimitiveMatchedSignals(primitive: RecommendationPrimitive) {
  const factSignals = getReasonFactAtoms(primitive)
    .filter((atom) => atom !== '综合')
    .slice(0, 2);
  const categorySignals = primitive.experienceCategories
    .filter((category) => category !== '非跟团产品')
    .slice(0, 2);
  const priceSignal = Number.isFinite(primitive.price) && primitive.price > 0
    ? `${primitive.price}元`
    : '';
  const weatherSignal = primitive.seasonalComfortAtoms[0]
    ?.replace(/^夏季友好：/, '')
    .replace(/^高温天气需取舍：/, '取舍：')
    .replace(/^天气敏感：/, '天气：') || '';

  return uniqueStrings([
    ...factSignals,
    ...categorySignals,
    priceSignal,
    weatherSignal,
  ]).filter(Boolean).slice(0, 5);
}

function getConcreteMatchedSignals(
  signals: unknown,
  primitive: RecommendationPrimitive | undefined,
) {
  if (!primitive) return Array.isArray(signals) ? signals.map(String).slice(0, 5) : ['AI综合推荐'];

  const normalizedSignals = Array.isArray(signals)
    ? signals.map(String).map((signal) => signal.trim()).filter(Boolean).slice(0, 5)
    : [];
  const hasConcreteSignal = normalizedSignals.some((signal) => !isGenericMatchedSignal(signal));
  if (hasConcreteSignal) return normalizedSignals;

  const concreteSignals = buildPrimitiveMatchedSignals(primitive);
  return concreteSignals.length > 0 ? concreteSignals : ['AI综合推荐'];
}

function normalizeAiText(value: unknown, maxLength = 160) {
  if (typeof value !== 'string') return '';
  return stripTerminalPunctuation(value.replace(/\s+/g, ' ').trim()).slice(0, maxLength);
}

function normalizeAiTextList(value: unknown, limit = 4, maxLength = 80) {
  if (!Array.isArray(value)) return [];
  return uniqueStrings(value.map((item) => normalizeAiText(item, maxLength)).filter(Boolean)).slice(0, limit);
}

function normalizeAiSemanticNotes(value: unknown): AiRecommendationSemanticNotes | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as {
    worldKnowledgeUse?: unknown;
    w?: unknown;
    softCriteria?: unknown;
    sc?: unknown;
    cannotAssert?: unknown;
    ca?: unknown;
    caveat?: unknown;
    cv?: unknown;
  };
  const notes: AiRecommendationSemanticNotes = {
    worldKnowledgeUse: normalizeAiText(raw.worldKnowledgeUse ?? raw.w, 180) || undefined,
    softCriteria: normalizeAiTextList(raw.softCriteria ?? raw.sc, 5, 60),
    cannotAssert: normalizeAiTextList(raw.cannotAssert ?? raw.ca, 5, 60),
    caveat: normalizeAiText(raw.caveat ?? raw.cv, 160) || undefined,
  };
  return notes.worldKnowledgeUse || notes.softCriteria.length || notes.cannotAssert.length || notes.caveat
    ? notes
    : undefined;
}

function hasInternalRecommendationLanguage(text: string) {
  return /(?:\batoms?\b|semanticAtoms|matchStatus|soft_conflict|候选原语|软语义判断|无法判断某候选|不能断言某候选|atoms\s*中|cats\s*判断)/i.test(text);
}

function buildSemanticNotesLead(
  notes: AiRecommendationSemanticNotes | undefined,
  intent: AiTravelIntent | null,
  userText: string,
  options: { allowPublicInterest: boolean },
) {
  if (!notes) return '';
  if (options.allowPublicInterest && hasPublicInterestNeed(intent, userText)) {
    return '说明：候选里不一定有明确扶贫或公益标注，我会按县域、乡村或周边体验找接近替代。';
  }

  const visibleCaveat = normalizeAiText(notes.caveat, 80);
  if (
    visibleCaveat &&
    !hasInternalRecommendationLanguage(visibleCaveat) &&
    /(近似|替代|未标注|没有明确|无法精准|不完全)/.test(visibleCaveat)
  ) {
    return `说明：${stripTerminalPunctuation(visibleCaveat)}。`;
  }

  if (notes.cannotAssert.length > 0 || notes.softCriteria.length > 0 || notes.worldKnowledgeUse) {
    return '说明：部分偏好在候选里没有明确标签，我会按目的地、玩法、预算和天气做接近匹配。';
  }

  return '';
}

function isBoundedPublicInterestStatement(text: string) {
  return /(候选|原文|显式|证据|没有|未标注|不能|不可|不等于|近似|替代|只能|无法断言)/.test(text);
}

function buildItemSemanticReason(
  item: AiRecommendationItem,
  primitive: RecommendationPrimitive,
  options: { allowPublicInterest: boolean },
) {
  const semanticFit = normalizeAiText(item.semanticFit, 140);
  const semanticBoundary = normalizeAiText(item.semanticBoundary, 120);
  const parts = uniqueStrings([semanticFit, semanticBoundary]).filter(Boolean);
  if (parts.length === 0) return '';
  const text = parts.join('；');
  if (hasUnallowedPublicInterestLanguage(text, options)) return '';
  if (hasUnsupportedPublicInterestClaim(text, primitive)) return '';
  return text;
}

function getConcreteAiReason(reason: unknown, primitive: RecommendationPrimitive | undefined) {
  const trimmed = typeof reason === 'string' ? reason.trim() : '';
  if (!primitive) return trimmed || '综合用户需求、天气和线路特点后较为合适';
  if (trimmed && hasUnsupportedPublicInterestClaim(trimmed, primitive)) {
    return buildPublicInterestAlternativeReason(primitive);
  }
  // Experience: do not force every AI reason through a fixed price/weather/play checklist.
  // Soft needs such as public-interest, study travel, or rural value often explain fit through
  // world knowledge and candidate wording; overwriting those with local templates degrades copy.
  if (trimmed && shouldKeepAiReason(trimmed, primitive)) {
    return trimmed;
  }
  return buildPrimitiveConcreteReason(primitive);
}

function getDiversityGroupKey(primitive: RecommendationPrimitive) {
  const destination = primitive.destination || '其他';
  const dayBucket = primitive.tripDays >= 4 ? '4天+' : `${primitive.tripDays}天`;
  const categories = primitive.experienceCategories.length > 0
    ? primitive.experienceCategories.filter((category) => category !== '美食体验').slice(0, 2)
    : [];
  const atoms = categories.length > 0 ? categories : getPrimitiveExperienceAtoms(primitive, 2);
  const style = atoms.length > 0
    ? atoms.join('/')
    : primitive.theme || primitive.tags[0] || primitive.highlights[0] || '综合';
  return `${destination}｜${dayBucket}｜${style}`;
}

function selectDiversePrimitives(
  primitives: RecommendationPrimitive[],
  limit: number,
  localItems: AiRecommendationItem[],
  context?: RecommendationContext,
) {
  if (primitives.length <= limit) return primitives;

  const ranked = [...primitives].sort((a, b) => rankPrimitive(b, localItems, context) - rankPrimitive(a, localItems, context));
  const groups = new Map<string, RecommendationPrimitive[]>();

  for (const primitive of ranked) {
    const key = getDiversityGroupKey(primitive);
    const group = groups.get(key) || [];
    group.push(primitive);
    groups.set(key, group);
  }

  const groupEntries = [...groups.entries()].sort(([, a], [, b]) =>
    rankPrimitive(b[0], localItems, context) - rankPrimitive(a[0], localItems, context),
  );
  const selected: RecommendationPrimitive[] = [];
  const selectedIds = new Set<string>();
  let round = 0;

  while (selected.length < limit) {
    let added = false;
    for (const [, group] of groupEntries) {
      const next = group[round];
      if (!next || selectedIds.has(next.id)) continue;
      selected.push(next);
      selectedIds.add(next.id);
      added = true;
      if (selected.length >= limit) break;
    }
    if (!added) break;
    round += 1;
  }

  for (const primitive of ranked) {
    if (selected.length >= limit) break;
    if (selectedIds.has(primitive.id)) continue;
    selected.push(primitive);
    selectedIds.add(primitive.id);
  }

  return selected.sort((a, b) => rankPrimitive(b, localItems, context) - rankPrimitive(a, localItems, context));
}

function getPricePercentile(price: number, sortedPrices: number[]) {
  if (!Number.isFinite(price) || sortedPrices.length === 0) return null;
  const cheaperOrEqualCount = sortedPrices.filter((value) => value <= price).length;
  return Math.round((cheaperOrEqualCount / sortedPrices.length) * 100);
}

function getPriceBandKey(price: number, sortedPrices: number[]) {
  const percentileValue = getPricePercentile(price, sortedPrices);
  if (percentileValue === null) return 'unknown';
  if (percentileValue <= 30) return 'lower';
  if (percentileValue <= 70) return 'middle';
  return 'upper';
}

function selectPriceBandRepresentatives(
  primitives: RecommendationPrimitive[],
  limit: number,
  sortedPrices: number[],
  localItems: AiRecommendationItem[],
  context?: RecommendationContext,
) {
  if (limit <= 0 || primitives.length === 0) return [];
  const selected: RecommendationPrimitive[] = [];
  const selectedIds = new Set<string>();
  const groups = new Map<string, RecommendationPrimitive[]>();

  for (const primitive of primitives) {
    const key = getPriceBandKey(primitive.price, sortedPrices);
    const group = groups.get(key) || [];
    group.push(primitive);
    groups.set(key, group);
  }

  const coverageTerms = extractCandidateCoverageTerms(context?.userText);
  const groupEntries = [...groups.values()]
    .map((group) => group
      .sort((a, b) =>
        getPrimitiveCoverageScore(b, coverageTerms) -
          getPrimitiveCoverageScore(a, coverageTerms) ||
        rankPrimitive(b, localItems, context) - rankPrimitive(a, localItems, context),
      ))
    .sort((a, b) =>
      getPrimitiveCoverageScore(b[0], coverageTerms) - getPrimitiveCoverageScore(a[0], coverageTerms) ||
      rankPrimitive(b[0], localItems, context) - rankPrimitive(a[0], localItems, context),
    );
  for (const group of groupEntries) {
    if (selected.length >= limit) break;
    const next = group.find((primitive) => !selectedIds.has(primitive.id));
    if (!next) continue;
    selected.push(next);
    selectedIds.add(next.id);
  }

  for (const primitive of primitives) {
    if (selected.length >= limit) break;
    if (selectedIds.has(primitive.id)) continue;
    selected.push(primitive);
    selectedIds.add(primitive.id);
  }

  return selected.sort((a, b) =>
    getPrimitiveCoverageScore(b, coverageTerms) - getPrimitiveCoverageScore(a, coverageTerms) ||
    rankPrimitive(b, localItems, context) - rankPrimitive(a, localItems, context),
  );
}

function annotateCandidatePrimitive(
  primitive: RecommendationPrimitive,
  intent: AiTravelIntent | null,
  sortedPrices: number[],
  matchStatus: CandidateAuditPrimitive['matchStatus'],
  coverageTerms: string[] = [],
) {
  const userTermHits = coverageTerms.filter((term) => getPrimitiveCoverageScore(primitive, [term]) > 0);
  return {
    ...primitive,
    matchStatus,
    routeGroup: getDiversityGroupKey(primitive),
    conflictReasons: getPrimitiveConflictReasons(intent, primitive),
    userTermHits,
    userTermCoverage: coverageTerms.length > 0
      ? Math.round((userTermHits.length / coverageTerms.length) * 100)
      : 0,
    priceContext: {
      poolPercentile: getPricePercentile(primitive.price, sortedPrices),
      poolBand: getPriceBandKey(primitive.price, sortedPrices),
      pricePerDay: primitive.tripDays > 0 ? Math.round(primitive.price / primitive.tripDays) : null,
    },
  } satisfies CandidateAuditPrimitive;
}

function extractCandidateCoverageTerms(text: string | undefined) {
  if (!text) return [];
  return uniqueStrings(
    text
      .toLowerCase()
      .replace(/[^\p{Script=Han}a-z0-9]+/gu, ' ')
      .split(/(?:\s+|同时|都要|都得|都想|兼具|兼有|都有|既|又|带有|带|含有|包含|包括|有|和|与|及|以及|或者|或|的|旅行团|旅游团|线路|跟团|推荐|帮我|帮忙|想要|想|要|找|看)+/gu)
      .map((term) => term.trim())
      .filter((term) => term.length >= 2 && term.length <= 12),
  ).slice(0, 12);
}

function getPrimitiveCoverageScore(primitive: RecommendationPrimitive, terms: string[]) {
  if (terms.length === 0) return 0;
  const corpus = getPrimitiveIntentCorpus(primitive);
  return terms.reduce((score, term) => score + (corpus.includes(term) ? 1 : 0), 0);
}

function readStoredAiConfig(): StoredAiProviderConfig {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(AI_CONFIG_STORAGE_KEY);
    if (!raw) return {};
    const parsed = storedAiProviderConfigSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

function readRuntimeEnv(name: string) {
  const viteValue =
    typeof import.meta !== 'undefined' &&
    typeof import.meta.env === 'object' &&
    import.meta.env !== null
      ? (import.meta.env as Record<string, unknown>)[name]
      : undefined;
  if (typeof viteValue === 'string' && viteValue.trim()) return viteValue.trim();

  const runtimeProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  const processValue = runtimeProcess?.env?.[name];
  return typeof processValue === 'string' ? processValue.trim() : '';
}

function decodeDefaultApiKey(encoded: string | undefined) {
  if (!encoded) return '';

  try {
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      return window.atob(encoded);
    }

    const runtimeBuffer = (globalThis as {
      Buffer?: {
        from: (value: string, encoding: string) => { toString: (encoding: string) => string };
      };
    }).Buffer;
    return runtimeBuffer ? runtimeBuffer.from(encoded, 'base64').toString('utf8') : '';
  } catch {
    return '';
  }
}

function getDefaultApiKey() {
  return decodeDefaultApiKey(readRuntimeEnv('VITE_AI_DEFAULT_API_KEY_B64')) || readRuntimeEnv('VITE_AI_DEFAULT_API_KEY') || '';
}

function getSecondaryApiKey() {
  return (
    decodeDefaultApiKey(readRuntimeEnv('VITE_AI_SECONDARY_API_KEY_B64')) ||
    readRuntimeEnv('VITE_AI_SECONDARY_API_KEY') ||
    ''
  );
}

function getTertiaryApiKey() {
  return (
    decodeDefaultApiKey(readRuntimeEnv('VITE_AI_TERTIARY_API_KEY_B64')) ||
    readRuntimeEnv('VITE_AI_TERTIARY_API_KEY') ||
    ''
  );
}

function getFallbackApiKey() {
  return (
    decodeDefaultApiKey(readRuntimeEnv('VITE_AI_FALLBACK_API_KEY_B64')) ||
    readRuntimeEnv('VITE_AI_FALLBACK_API_KEY') ||
    decodeDefaultApiKey(readRuntimeEnv('DEEPSEEK_API_KEY_B64')) ||
    readRuntimeEnv('DEEPSEEK_API_KEY') ||
    ''
  );
}

function buildAiProviderConfig(config: Partial<AiProviderConfig>): AiProviderConfig | null {
  const apiKey = typeof config.apiKey === 'string' ? config.apiKey.trim() : '';
  const baseUrl = typeof config.baseUrl === 'string' ? config.baseUrl.trim() : '';
  const model = typeof config.model === 'string' ? config.model.trim() : '';
  if (!apiKey || !baseUrl || !model) return null;
  return { apiKey, baseUrl, model };
}

function sameAiProviderConfig(left: AiProviderConfig, right: AiProviderConfig) {
  return left.apiKey === right.apiKey && left.baseUrl === right.baseUrl && left.model === right.model;
}

export function getAiProviderConfig(): StoredAiProviderConfig {
  const stored = readStoredAiConfig();
  return {
    apiKey: stored.apiKey || getDefaultApiKey(),
    baseUrl: stored.baseUrl || readRuntimeEnv('VITE_AI_DEFAULT_BASE_URL') || '',
    model: stored.model || readRuntimeEnv('VITE_AI_DEFAULT_MODEL') || '',
  };
}

export function getStoredAiProviderConfig(): StoredAiProviderConfig {
  return readStoredAiConfig();
}

export function saveAiProviderConfig(config: StoredAiProviderConfig) {
  if (typeof window === 'undefined') return;

  const cleaned = Object.fromEntries(
    Object.entries(config).filter(([, value]) => typeof value === 'string' && value.trim()),
  );
  const parsed = storedAiProviderConfigSchema.safeParse(cleaned);
  if (!parsed.success) return;

  window.localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(parsed.data));
}

export function clearAiProviderConfig() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AI_CONFIG_STORAGE_KEY);
}

function getResolvedAiConfigs(override?: Partial<AiProviderConfig>): AiProviderConfig[] {
  const stored = readStoredAiConfig();
  const primaryConfig = buildAiProviderConfig({
    apiKey: override?.apiKey || stored.apiKey || getDefaultApiKey() || '',
    baseUrl: override?.baseUrl || stored.baseUrl || readRuntimeEnv('VITE_AI_DEFAULT_BASE_URL') || '',
    model: override?.model || stored.model || readRuntimeEnv('VITE_AI_DEFAULT_MODEL') || '',
  });
  const secondaryConfig = buildAiProviderConfig({
    apiKey: getSecondaryApiKey(),
    baseUrl: readRuntimeEnv('VITE_AI_SECONDARY_BASE_URL') || '',
    model: readRuntimeEnv('VITE_AI_SECONDARY_MODEL') || '',
  });
  const tertiaryConfig = buildAiProviderConfig({
    apiKey: getTertiaryApiKey(),
    baseUrl: readRuntimeEnv('VITE_AI_TERTIARY_BASE_URL') || '',
    model: readRuntimeEnv('VITE_AI_TERTIARY_MODEL') || '',
  });
  const fallbackConfig = buildAiProviderConfig({
    apiKey: getFallbackApiKey(),
    baseUrl: readRuntimeEnv('VITE_AI_FALLBACK_BASE_URL') || readRuntimeEnv('DEEPSEEK_BASE_URL') || '',
    model: readRuntimeEnv('VITE_AI_FALLBACK_MODEL') || readRuntimeEnv('DEEPSEEK_MODEL') || '',
  });

  const configs = [primaryConfig, secondaryConfig, tertiaryConfig, fallbackConfig].filter((config): config is AiProviderConfig => Boolean(config));
  return configs.filter((config, index) =>
    configs.findIndex((candidate) => sameAiProviderConfig(candidate, config)) === index,
  );
}

function compactCandidates(
  tours: AiRecommendationCandidate[],
  localItems: AiRecommendationItem[],
  intent: AiTravelIntent | null = null,
  context?: RecommendationContext,
) {
  const allPrimitives = tours.map(buildTourPrimitive);
  const tourPrimitives = allPrimitives.filter((primitive) => !isLikelyAiNonTour(primitive));
  const eligiblePrimitives = tourPrimitives.length > 0 ? tourPrimitives : allPrimitives;
  const primitives = eligiblePrimitives;
  const sortedPrices = primitives
    .map((primitive) => primitive.price)
    .filter((price) => Number.isFinite(price) && price > 0)
    .sort((a, b) => a - b);
  const coverageTerms = extractCandidateCoverageTerms(context?.userText);
  const coveragePool = coverageTerms.length > 0
    ? [...primitives]
        .filter((primitive) => getPrimitiveCoverageScore(primitive, coverageTerms) > 0)
        .sort((a, b) =>
          getPrimitiveCoverageScore(b, coverageTerms) - getPrimitiveCoverageScore(a, coverageTerms) ||
          rankPrimitive(b, localItems, context) - rankPrimitive(a, localItems, context),
        )
    : [];
  const coverageMatches = coverageTerms.length > 0
    ? selectDiversePrimitives(
        coveragePool,
        Math.min(16, MAX_AI_CANDIDATES),
        localItems,
        context,
      )
    : [];
  const coveragePriceRepresentatives = selectPriceBandRepresentatives(
    coveragePool,
    6,
    sortedPrices,
    localItems,
    context,
  );
  const diversePool = selectDiversePrimitives(
    primitives,
    MAX_AI_CANDIDATES,
    localItems,
    context,
  );
  const coverageMatchIds = new Set([
    ...coverageMatches.map((primitive) => primitive.id),
    ...coveragePriceRepresentatives.map((primitive) => primitive.id),
  ]);

  const annotatedCandidates = [
    ...coverageMatches
      .map((primitive) =>
        annotateCandidatePrimitive(
          primitive,
          intent,
          sortedPrices,
          intentMatchesPrimitive(intent, primitive) ? 'match' : 'soft_conflict',
          coverageTerms,
        ),
      ),
    ...coveragePriceRepresentatives
      .filter((primitive) => !coverageMatches.some((match) => match.id === primitive.id))
      .map((primitive) =>
        annotateCandidatePrimitive(
          primitive,
          intent,
          sortedPrices,
          intentMatchesPrimitive(intent, primitive) ? 'match' : 'soft_conflict',
          coverageTerms,
        ),
      ),
    ...diversePool
      .filter((primitive) => !coverageMatchIds.has(primitive.id))
      .map((primitive) =>
        annotateCandidatePrimitive(
          primitive,
          intent,
          sortedPrices,
          intentMatchesPrimitive(intent, primitive) ? 'match' : 'soft_conflict',
          coverageTerms,
        ),
      ),
  ]
    .slice(0, MAX_AI_CANDIDATES);

  return annotatedCandidates;
}

function extractRecentUserTexts(messages: AiRecommendationMessage[], limit = 6) {
  return messages
    .filter((message) => message.role === 'user')
    .slice(-limit)
    .map((message) => message.content.trim())
    .filter(Boolean);
}

function compactRecentConversation(messages: AiRecommendationMessage[]) {
  return messages
    .slice(-MAX_RECENT_CONVERSATION_MESSAGES)
    .map(({ role, content }) => ({
      role,
      content: content.replace(/\s+/g, ' ').trim().slice(0, 240),
    }))
    .filter((message) => message.content);
}

function buildSummaryTopDestinations(
  items: AiRecommendationItem[],
  candidateTours: AiRecommendationCandidate[],
) {
  const primitiveByTourId = new Map(candidateTours.map((tour) => [tour.id, buildTourPrimitive(tour)]));
  const topPrimitives = items
    .slice(0, 3)
    .map((item) => primitiveByTourId.get(item.tourId))
    .filter((primitive): primitive is RecommendationPrimitive => Boolean(primitive));

  if (topPrimitives.length === 0) return '';

  const categoryLabelMap: Record<string, string> = {
    '海边沙滩': '海边度假',
    '玩水清凉': '水上活动',
    '森林山水': '山水避暑',
    '文化逛城': '城市休闲',
    '室内度假': '酒店度假',
    '温泉泡汤': '酒店放松',
    '美食体验': '吃住轻松',
    '户外强度': '户外景观',
  };
  const destinationCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  for (const primitive of topPrimitives) {
    const destination = primitive.destination?.trim();
    if (destination && destination !== '其他' && destination !== '产品特色' && destination.length <= 8) {
      destinationCounts.set(destination, (destinationCounts.get(destination) || 0) + 1);
    } else {
      const normalizedHint = collectDestinationHints(`${primitive.destination} ${primitive.title}`)[0];
      if (normalizedHint) {
        destinationCounts.set(normalizedHint, (destinationCounts.get(normalizedHint) || 0) + 1);
      }
    }

    const category = categoryLabelMap[getPrimitivePrimaryCategory(primitive)];
    if (category) {
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }
  }

  const topDestinations = [...destinationCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([destination]) => destination)
    .slice(0, 2);
  const topCategories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category)
    .slice(0, 2);

  const destinationText = topDestinations.length === 0
    ? ''
    : topDestinations.length === 1
      ? `${topDestinations[0]}方向`
      : `${topDestinations.join('、')}等方向`;
  const categoryText = topCategories.join('、');

  if (destinationText && categoryText) return `${destinationText}的${categoryText}`;
  return destinationText || categoryText;
}

function stripTerminalPunctuation(text: string) {
  return text.replace(/[。；，,\s]+$/u, '').trim();
}

function isUnhelpfulWeatherNarration(text: string | null | undefined) {
  const normalized = stripTerminalPunctuation(text || '');
  if (!normalized) return true;

  return /(未匹配到可查询天气的目的地|暂无可用实况预报|暂无实况预报|天气接口暂时不可用|天气接口暂不可用|本次未请求天气调研|没有拿到强结论天气窗口|先按季节窗口判断)/.test(normalized);
}

function getRenderableWeatherLead(
  weatherContext: AiWeatherContext,
  destinationWeatherInsights: DestinationWeatherInsight[],
) {
  const dateWindowLine = buildDestinationWeatherLine(destinationWeatherInsights);
  if (!isUnhelpfulWeatherNarration(dateWindowLine)) {
    return stripTerminalPunctuation(dateWindowLine);
  }

  const directLead = stripTerminalPunctuation(weatherContext.dateSpecificSummary || weatherContext.forecastSummary || '');
  if (!isUnhelpfulWeatherNarration(directLead)) {
    return directLead;
  }

  return '';
}

function getFallbackWeatherSummary(seasonAdvice: string[], bestSeasonNote?: string | null) {
  return stripTerminalPunctuation(bestSeasonNote || seasonAdvice[0] || '结合当地季节体感和玩法稳定性判断');
}

function buildSummaryPreferenceText(intent: AiTravelIntent | null) {
  const bits = uniqueStrings([
    intent?.tripDays ? `${intent.tripDays}天` : '',
    intent?.tripDaysMax && !intent.tripDays ? `${intent.tripDaysMax}天内` : '',
    intent?.budgetMin && intent?.budgetMax
      ? `${intent.budgetMin}-${intent.budgetMax}元`
      : intent?.budgetMax
        ? `预算约${intent.budgetMax}元内`
        : '',
    intent?.weatherSensitivity?.includes('怕热') ? '优先避暑' : '',
    intent?.weatherSensitivity?.includes('避雨') ? '优先避雨' : '',
    intent?.travelStyle?.slice(0, 1)[0] || '',
  ]);

  return bits.length > 0 ? bits.join('、') : '当前条件';
}

function buildRecommendationSummary(params: {
  items: AiRecommendationItem[];
  candidateTours: AiRecommendationCandidate[];
  weatherContext: AiWeatherContext;
  destinationWeatherInsights: DestinationWeatherInsight[];
  intent: AiTravelIntent | null;
  userText?: string;
}) {
  const profile = buildCopyIntentProfile(params.intent, params.userText || '');
  const topDestinations = buildSummaryTopDestinations(params.items, params.candidateTours);
  const topLine = topDestinations
    ? `推荐方向：这次优先看${topDestinations}这类线路，排序先按${buildSummaryPreferenceText(params.intent)}去保留更稳的结果。`
    : `推荐方向：这次先按${buildSummaryPreferenceText(params.intent)}保留更稳妥、适配当前条件的线路。`;
  const normalizedWeatherLead = getRenderableWeatherLead(params.weatherContext, params.destinationWeatherInsights);
  const weatherLead = normalizedWeatherLead
    ? `天气判断：${normalizedWeatherLead}。`
    : '';
  const cautionPool = uniqueStrings([
    ...(params.weatherContext.seasonAdvice || []),
    ...params.destinationWeatherInsights.flatMap((insight) => [
      insight.bestSeasonNote || '',
      ...(insight.seasonAdvice || []),
    ]),
  ]).filter((text) => !weatherLead.includes(text) && !isUnhelpfulWeatherNarration(text));
  const cautionLine = cautionPool.find((text) => /(台风|暴雨|强降雨|高温|闷热|风浪|花期|雨季|观赏期|取舍)/.test(text))
    || cautionPool[0]
    || (profile.wantsBeach
      ? '海边线不要只看目的地名，关键看具体团期的晴雨和风浪。'
      : profile.wantsNature
        ? '山水线景观更看天气完整度，连雨天和高温天都要留意体感落差。'
        : '注意：同类线路里真正拉开差距的往往是团期天气、节奏和是否有室内兜底。');
  const caution = stripTerminalPunctuation(cautionLine).replace(/^注意[:：]?\s*/u, '');

  return [
    topLine,
    weatherLead,
    `注意：${caution}。`,
  ].filter(Boolean).join('');
}

function buildDestinationWeatherLine(insights: DestinationWeatherInsight[]) {
  const datedInsights = insights.filter((insight) => insight.travelDate && insight.weatherWindowLabel);
  if (datedInsights.length === 0) return '';

  const renderWindow = (insight: DestinationWeatherInsight) =>
    `${insight.weatherWindowLabel || `${formatMonthDay(insight.travelDate)}这班`}的${insight.destination}`;
  const better = datedInsights.find((insight) => insight.weatherRiskLevel === 'better');
  const worse = datedInsights.find((insight) =>
    insight.weatherRiskLevel === 'worse' &&
    (!better || insight.destination !== better.destination || insight.travelDate !== better.travelDate),
  );
  const mixed = datedInsights.find((insight) => insight.weatherRiskLevel === 'mixed');

  if (better && worse) {
    return `团期天气上，${renderWindow(better)}相对更稳，${renderWindow(worse)}更吃天气。`;
  }
  if (better) {
    return `团期天气上，${renderWindow(better)}相对更稳。`;
  }
  if (worse) {
    return `团期天气上，${renderWindow(worse)}更吃天气。`;
  }
  if (mixed) {
    return `团期天气上，${renderWindow(mixed)}天气波动会更明显。`;
  }
  return '';
}

function buildWeatherActivityLabel(primitive: RecommendationPrimitive) {
  const categories = new Set(primitive.experienceCategories);
  if (categories.has('海边沙滩')) return '海边活动';
  if (categories.has('玩水清凉')) return '水上活动';
  if (categories.has('森林山水')) return '山水户外';
  if (categories.has('文化逛城') || categories.has('室内度假')) return '行程完整度';
  if (categories.has('温泉泡汤')) return '酒店放松体验';
  return '整体体验';
}

function buildWeatherReasonSentence(
  primitive: RecommendationPrimitive,
  insight: DestinationWeatherInsight | undefined,
) {
  if (!insight?.travelDate) return '';

  const dayLabel = `${formatMonthDay(insight.travelDate)}这班`;
  const core = stripTerminalPunctuation(
    (insight.dateSpecificSummary || '').replace(new RegExp(`^${formatMonthDay(insight.travelDate)}`), ''),
  );
  const activity = buildWeatherActivityLabel(primitive);

  if (core) {
    if (insight.weatherRiskLevel === 'better') {
      return `${dayLabel}预计${core}，${activity}完整度更稳。`;
    }
    if (insight.weatherRiskLevel === 'worse') {
      return `${dayLabel}预计${core}，这班更吃天气。`;
    }
    if (insight.weatherRiskLevel === 'mixed') {
      return `${dayLabel}预计${core}，天气有波动，${activity}要留意临场变化。`;
    }
    return `${dayLabel}预计${core}。`;
  }

  return '';
}

function isWeatherSensitivePrimitive(primitive: RecommendationPrimitive) {
  const corpus = [
    primitive.destination,
    primitive.theme,
    primitive.title,
    ...primitive.semanticAtoms,
    ...primitive.experienceCategories,
    ...primitive.seasonalComfortAtoms,
  ].join(' ');
  return shouldInspectDestinationWeather(corpus);
}

function findWeatherInsightForPrimitive(
  primitive: RecommendationPrimitive,
  insights: DestinationWeatherInsight[],
) {
  const travelDate = getEarliestDate(primitive.schedule.departureDates);
  const sameDestination = insights.filter((insight) => insight.destination === primitive.destination);
  if (travelDate) {
    const exact = sameDestination.find((insight) => insight.travelDate === travelDate);
    if (exact) return exact;
  }
  return sameDestination[0];
}

function buildWeatherReasonSuffix(
  primitive: RecommendationPrimitive,
  insight: DestinationWeatherInsight | undefined,
) {
  return buildWeatherReasonSentence(primitive, insight).replace(/[。；]+$/u, '');
}

function rewriteRecommendationCopy(params: {
  items: AiRecommendationItem[];
  candidateTours: AiRecommendationCandidate[];
  destinationWeatherInsights: DestinationWeatherInsight[];
  intent: AiTravelIntent | null;
  weatherContext: AiWeatherContext;
  userText: string;
  allowPublicInterest: boolean;
}) {
  const primitiveByTourId = new Map(params.candidateTours.map((tour) => [tour.id, buildTourPrimitive(tour)]));
  const sortedPrices = params.candidateTours
    .map((tour) => tour.price)
    .filter((price) => Number.isFinite(price) && price > 0)
    .sort((a, b) => a - b);

  return params.items.map((item, index) => {
    if (index >= MAX_AI_COMMENTARY_ITEMS) {
      return stripRecommendationCommentary(item);
    }

    const primitive = primitiveByTourId.get(item.tourId);
    if (!primitive) return item.reason ? item : stripRecommendationCommentary(item);

    const currentReason = stripTerminalPunctuation(item.reason || '');
    const hasTurnPublicInterestNeed = params.allowPublicInterest && hasPublicInterestNeed(params.intent, params.userText);
    const hasPublicInterestSemanticNote = hasPublicInterestLanguage(
      [item.semanticFit, item.semanticBoundary, ...(item.semanticSignals || [])].filter(Boolean).join(' '),
    );
    if (currentReason.startsWith('需放宽条件')) {
      return {
        ...item,
        reason: `${currentReason}。`,
      };
    }
    if (
      currentReason &&
      !(hasTurnPublicInterestNeed && hasPublicInterestSemanticNote) &&
      !hasUnallowedPublicInterestLanguage(currentReason, params) &&
      !hasUnsupportedPositivePriceClaim({
        reason: currentReason,
        primitive,
        intent: params.intent,
        userText: params.userText,
        sortedPrices,
      }) &&
      shouldKeepAiReason(currentReason, primitive) &&
      shouldUseAiSummary(currentReason, params.weatherContext, params)
    ) {
      return {
        ...item,
        reason: `${currentReason}。`,
      };
    }

    const insight = findWeatherInsightForPrimitive(primitive, params.destinationWeatherInsights);
    const semanticReason = buildItemSemanticReason(item, primitive, params);
    const fallbackReason = uniqueStrings([
      semanticReason,
      hasTurnPublicInterestNeed
        ? buildPublicInterestAlternativeReason(primitive)
        : buildPrimitiveConcreteReason(primitive, index),
      buildWeatherReasonSuffix(primitive, insight),
    ]).join('。');

    return {
      ...item,
      reason: `${stripTerminalPunctuation(fallbackReason)}。`,
    };
  });
}

function shouldUseAiSummary(
  summary: string,
  weatherContext: AiWeatherContext,
  options: { allowPublicInterest?: boolean } = {},
) {
  const trimmed = summary.trim();
  if (trimmed.length < 24) return false;
  if (!/[。！？；]/u.test(trimmed)) return false;
  if (hasInternalRecommendationLanguage(trimmed)) return false;
  if (hasUnallowedPublicInterestLanguage(trimmed, { allowPublicInterest: Boolean(options.allowPublicInterest) })) return false;
  if (/^(综合匹配|热门|性价比|班期多|预算内)/.test(trimmed) && trimmed.length < 40) return false;
  if (/(当前|现在).*(春季|夏季|秋季|冬季)/.test(trimmed)) return false;
  if (/(回南天|梅雨|春季踏青|冬季适合)/.test(trimmed)) return false;
  const travelMonth = weatherContext.travelDate
    ? new Date(weatherContext.travelDate).getMonth() + 1
    : new Date().getMonth() + 1;
  const expectedSeason = travelMonth >= 3 && travelMonth <= 5
    ? '春'
    : travelMonth >= 6 && travelMonth <= 8
      ? '夏'
      : travelMonth >= 9 && travelMonth <= 11
        ? '秋'
        : '冬';
  const mentionedSeason = trimmed.match(/(春|夏|秋|冬)季/)?.[1];
  if (mentionedSeason && mentionedSeason !== expectedSeason) return false;
  return true;
}

function attachWeatherGuidanceToItems(
  items: AiRecommendationItem[],
  candidateTours: AiRecommendationCandidate[],
  destinationWeatherInsights: DestinationWeatherInsight[],
) {
  if (destinationWeatherInsights.length === 0) return items;
  const primitiveByTourId = new Map(candidateTours.map((tour) => [tour.id, buildTourPrimitive(tour)]));

  return items.map((item) => {
    if (!item.reason) return item;
    const primitive = primitiveByTourId.get(item.tourId);
    if (!primitive || !isWeatherSensitivePrimitive(primitive)) return item;
    const insight = findWeatherInsightForPrimitive(primitive, destinationWeatherInsights);
    const weatherSuffix = buildWeatherReasonSuffix(primitive, insight);
    if (!weatherSuffix) return item;

    const reason = item.reason.trim();
    const normalizedReason = normalizeText(reason);
    const normalizedSuffix = normalizeText(weatherSuffix);
    if (
      normalizedReason.includes(normalizedSuffix) ||
      (insight?.travelDate && normalizedReason.includes(formatMonthDay(insight.travelDate).toLowerCase())) ||
      normalizedReason.includes('这班更吃天气') ||
      normalizedReason.includes('完整度更稳') ||
      normalizedReason.includes('天气波动会更大')
    ) {
      return item;
    }

    return {
      ...item,
      reason: `${reason}。${weatherSuffix}。`,
    };
  });
}

function finalizeRecommendationSummary(params: {
  aiSummary: string;
  items: AiRecommendationItem[];
  candidateTours: AiRecommendationCandidate[];
  weatherContext: AiWeatherContext;
  destinationWeatherInsights: DestinationWeatherInsight[];
  intent: AiTravelIntent | null;
  semanticNotes?: AiRecommendationSemanticNotes;
  userText?: string;
  allowPublicInterest?: boolean;
}) {
  const aiSummary = params.aiSummary.trim();
  const allowPublicInterest = Boolean(params.allowPublicInterest);
  const semanticLead = buildSemanticNotesLead(
    params.semanticNotes,
    params.intent,
    params.userText || '',
    { allowPublicInterest },
  );
  if (shouldUseAiSummary(aiSummary, params.weatherContext, { allowPublicInterest })) {
    return uniqueStrings([semanticLead, aiSummary]).filter(Boolean).join('');
  }

  const fallbackSummary = buildRecommendationSummary(params);
  return uniqueStrings([semanticLead, fallbackSummary || aiSummary]).filter(Boolean).join('');
}

function parseDateString(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatMonthDay(value: string | null | undefined) {
  const parsed = value ? new Date(`${value}T00:00:00`) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return '';
  return `${parsed.getMonth() + 1}月${parsed.getDate()}日`;
}

function formatDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayInputValue() {
  return formatDateInput(new Date());
}

function addDaysInputValue(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
}

function resolvePromptDateWindow(text: string) {
  const normalized = text.replace(/\s+/g, '');
  const today = getTodayInputValue();
  const explicitChineseDays = normalized.match(/(?:\u672a\u6765|\u8fd1|\u6700\u8fd1)(\d{1,2})(?:\u5929|\u65e5)/u)
    || normalized.match(/(\d{1,2})(?:\u5929|\u65e5)(?:\u5185|\u4ee5\u5185)\u51fa\u53d1/u);
  if (explicitChineseDays) {
    const days = Math.min(Math.max(Number(explicitChineseDays[1]), 0), 30);
    return { start: today, end: addDaysInputValue(today, days) };
  }
  if (/(\u672a\u6765\u4e03\u5929|\u8fd1\u4e03\u5929|\u6700\u8fd1\u4e03\u5929|\u672c\u5468|\u8fd9\u5468|\u8fd9\u51e0\u5929|\u672a\u6765\u51e0\u5929|\u8fd1\u51e0\u5929|\u6700\u8fd1\u51e0\u5929)/u.test(normalized)) {
    return { start: today, end: addDaysInputValue(today, 7) };
  }
  if (
    /\d{1,2}(?:\u5929|\u65e5)/u.test(normalized) &&
    !/(?:\u672a\u6765|\u8fd1|\u6700\u8fd1|\u672c\u5468|\u8fd9\u5468|\u8fd9\u51e0\u5929|\u51fa\u53d1)/u.test(normalized)
  ) {
    return null;
  }
  const explicitDays = normalized.match(/(?:未来|近|最近)?(\d{1,2})天(?:内|以内|出发)?/);
  if (explicitDays && /(未来|近|最近|天内|以内|出发)/.test(normalized)) {
    const days = Math.min(Math.max(Number(explicitDays[1]), 0), 30);
    return { start: today, end: addDaysInputValue(today, days) };
  }
  if (/(未来七天|近七天|最近七天|本周|这周|这几天)/.test(normalized)) {
    return { start: today, end: addDaysInputValue(today, 7) };
  }
  if (/(未来几天|近几天|最近几天)/.test(normalized)) {
    return { start: today, end: addDaysInputValue(today, 7) };
  }
  return null;
}

function getCandidateDepartureDates(tour: AiRecommendationCandidate) {
  const today = getTodayInputValue();
  return getDepartureDates(tour)
    .filter(Boolean)
    .filter((date) => date >= today)
    .sort();
}

function filterPastOnlyCandidatesWhenFutureExists(tours: AiRecommendationCandidate[]) {
  const hasUpcomingPool = tours.some((tour) => getCandidateDepartureDates(tour).length > 0);
  if (!hasUpcomingPool) return tours;

  const filtered = tours.filter((tour) => {
    const allDates = getDepartureDates(tour);
    if (allDates.length === 0) return true;
    return getCandidateDepartureDates(tour).length > 0;
  });

  return filtered.length > 0 ? filtered : tours;
}

function matchesDateWindow(tour: AiRecommendationCandidate, dateWindow: { start: string; end: string } | null) {
  if (!dateWindow) return true;
  const dates = getCandidateDepartureDates(tour);
  return dates.some((date) => date >= dateWindow.start && date <= dateWindow.end);
}

function matchesActiveDateFilters(tour: AiRecommendationCandidate, activeFilters: FilterState) {
  const dates = getCandidateDepartureDates(tour);
  if (!activeFilters.departureDate && !activeFilters.departureDateStart && !activeFilters.departureDateEnd) {
    return true;
  }
  if (dates.length === 0) return false;

  if (activeFilters.departureDateStart || activeFilters.departureDateEnd) {
    return dates.some((date) => {
      if (activeFilters.departureDateStart && date < activeFilters.departureDateStart) return false;
      if (activeFilters.departureDateEnd && date > activeFilters.departureDateEnd) return false;
      return true;
    });
  }

  const today = getTodayInputValue();
  if (activeFilters.departureDate === today) {
    return dates.includes(today);
  }
  if (activeFilters.departureDate > today) {
    return dates.some((date) => date >= today && date <= activeFilters.departureDate);
  }
  return dates.some((date) => date >= activeFilters.departureDate);
}

function getEarliestDate(values: Array<string | null | undefined>) {
  const parsed = values
    .map(parseDateString)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => a.getTime() - b.getTime());

  return parsed[0] ? formatDateInput(parsed[0]) : undefined;
}

function getLikelyTravelDate(text: string, tours: AiRecommendationCandidate[]) {
  if (/(未来7天|未来七天|近7天|近七天|最近|这周|本周|这几天|\d{1,2}天内出发|\d{1,2}天内)/.test(text)) {
    return new Date().toISOString().slice(0, 10);
  }

  return tours
    .flatMap((tour) => getCandidateDepartureDates(tour))
    .sort()[0] || tours.find((tour) => tour.departureDate)?.departureDate;
}

function resolveWeatherContext(params: {
  text: string;
  messages: AiRecommendationMessage[];
  searchQuery: string;
  activeFilters: FilterState;
  preferenceMemory: AiPreferenceMemory | null | undefined;
  tours: AiRecommendationCandidate[];
}) {
  const inferredFrom: string[] = [];
  const recentUserTexts = extractRecentUserTexts(params.messages);
  const destinationSources = [
    params.text,
    ...recentUserTexts,
    params.searchQuery,
    params.activeFilters.destination,
    ...(params.preferenceMemory?.destinationHints || []),
  ].filter(Boolean);

  let destination = '';
  for (const sourceText of destinationSources) {
    const [hint] = collectDestinationHints(sourceText);
    if (hint) {
      destination = hint;
      if (sourceText === params.text) {
        inferredFrom.push('当前提问');
      } else if (recentUserTexts.includes(sourceText)) {
        inferredFrom.push('近期对话');
      } else if (sourceText === params.searchQuery) {
        inferredFrom.push('搜索词');
      } else if (sourceText === params.activeFilters.destination) {
        inferredFrom.push('当前筛选');
      } else {
        inferredFrom.push('偏好记忆');
      }
      break;
    }
  }

  if (!destination) {
    destination = DEFAULT_DEPARTURE_CITY;
    inferredFrom.push('默认出发地');
  }

  const prefersCurrentDate = /(未来7天|未来七天|近7天|近七天|最近|这周|本周|这几天|当前|现在|这个月|本月)/.test(
    [params.text, ...recentUserTexts].join(' '),
  );
  let travelDate: string | undefined;

  if (prefersCurrentDate) {
    travelDate = formatDateInput(new Date());
    inferredFrom.push('当前日期');
  } else {
    travelDate =
      params.activeFilters.departureDateStart ||
      params.activeFilters.departureDate ||
      getEarliestDate([
        params.activeFilters.departureDateStart,
        params.activeFilters.departureDate,
        params.activeFilters.departureDateEnd,
      ]) ||
      getEarliestDate(params.tours.flatMap((tour) => getCandidateDepartureDates(tour))) ||
      getEarliestDate(params.tours.flatMap((tour) => getDepartureDates(tour))) ||
      getLikelyTravelDate(params.text, params.tours);

    if (travelDate) {
      if (params.activeFilters.departureDateStart || params.activeFilters.departureDate || params.activeFilters.departureDateEnd) {
        inferredFrom.push('出发日期筛选');
      } else {
        inferredFrom.push('候选线路班期');
      }
    }
  }

  return {
    destination,
    travelDate,
    inferredFrom: uniqueStrings(inferredFrom),
  };
}

function getDestinationBestSeasonNote(destination: string, corpus = '') {
  const text = `${destination} ${corpus}`;

  if (/(北海道|新疆|喀纳斯|九寨沟|额济纳|稻城|川西)/.test(text)) {
    return '这类目的地观赏体验通常对季节窗口很敏感，旺季景观更强，但天气、温差和人流波动也更明显。';
  }
  if (/(三亚|海南|海岛|普吉|巴厘|长滩|沙巴|仙本那|芽庄)/.test(text)) {
    return '海岛和海边玩法更依赖晴天、风浪和降雨窗口，连续降雨、强对流或台风天会明显影响体验。';
  }
  if (/(桂林|贵州|云南|张家界|黄山|草原|呼伦贝尔|香格里拉)/.test(text)) {
    return '山水和高原草原类目的地通常存在更明显的观赏期与雨季差异，能见度、路况和体感温差都值得单独判断。';
  }
  if (/(樱花|红叶|赏花|花海|银杏|雪景|冰雪|避暑)/.test(text)) {
    return '这类主题本身就依赖最佳观赏期，建议结合天气与季节窗口一起判断，不宜只看价格。';
  }

  return '如目的地玩法明显依赖景观窗口、晴雨条件或季节体感，建议把天气与观赏期作为排序因子一起考虑。';
}

function shouldInspectDestinationWeather(text: string) {
  return /(海岛|海边|沙滩|潜水|浮潜|玩水|漂流|峡谷|山水|草原|雪|冰|温泉|避暑|赏花|花海|红叶|樱花|银杏|日出|星空|摄影|自然)/
    .test(text);
}

function buildDestinationWeatherCandidates(
  candidates: ReturnType<typeof compactCandidates>,
  searchQuery: string,
  intent: AiTravelIntent | null,
) {
  const grouped = new Map<string, {
    destination: string;
    travelDate?: string;
    score: number;
    evidence: string[];
    corpus: string;
  }>();

  for (const candidate of candidates) {
    const corpus = [
      candidate.destination,
      candidate.theme,
      candidate.title,
      candidate.routeGroup,
      ...candidate.tags,
      ...candidate.highlights,
      ...candidate.semanticAtoms,
      ...candidate.experienceCategories,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const destination = candidate.destination;
    const travelDate = getEarliestDate(candidate.schedule.departureDates);
    if (!destination) continue;
    const candidateKey = `${destination}::${travelDate || 'none'}`;

    const relevance = (
      (candidate.matchStatus === 'match' ? 24 : candidate.matchStatus === 'soft_conflict' ? 12 : 4) +
      (candidate.isHot ? 6 : 0) +
      (shouldInspectDestinationWeather(corpus) ? 10 : 0) +
      (intent?.destinationHints?.length && candidateMatchesDestinationIntent(intent, candidate) ? 16 : 0) +
      (searchQuery && corpus.includes(searchQuery.toLowerCase()) ? 8 : 0) +
      (travelDate ? 4 : 0)
    );
    const existing = grouped.get(candidateKey) || {
      destination,
      travelDate,
      score: 0,
      evidence: [],
      corpus,
    };

    existing.score = Math.max(existing.score, relevance);
    existing.travelDate = existing.travelDate || travelDate;
    existing.corpus = `${existing.corpus} ${corpus}`.slice(0, 300);
    existing.evidence = uniqueStrings([
      ...existing.evidence,
      travelDate ? `${formatMonthDay(travelDate)}出发` : '',
      candidate.theme,
      ...candidate.tags.slice(0, 2),
      ...candidate.highlights.slice(0, 2),
    ]).slice(0, 6);
    grouped.set(candidateKey, existing);
  }

  return [...grouped.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_DESTINATION_WEATHER_INSIGHTS);
}

function isSouthChinaHotRainySeason(destination: string, month: number) {
  if (![5, 6, 7, 8, 9, 10].includes(month)) return false;

  return ['广东', '广州', '深圳', '珠海', '佛山', '东莞', '中山', '惠州', '海南', '三亚', '海口', '广西']
    .some((name) => destination.includes(name));
}

function getSeasonAdvice(destination: string, travelDate?: string) {
  const month = travelDate ? new Date(travelDate).getMonth() + 1 : new Date().getMonth() + 1;
  const advice: string[] = [];

  if (isSouthChinaHotRainySeason(destination, month)) {
    advice.push('华南此时通常已经进入闷热多雨阶段，体感更接近夏季，选线路时应优先考虑避暑、遮阳、防雨和室内外搭配。');
    advice.push('广东、海南和沿海线路要额外关注强降雨、雷暴和台风预警，海边、漂流/水上活动和长时间暴晒项目不宜盲目优先。');
  }

  if ([6, 7, 8, 9].includes(month)) {
    advice.push('夏秋季需关注高温、暴雨和沿海台风风险，老人亲子优先选择节奏轻、室内外搭配合理的线路。');
    if (['贵州', '云南', '桂林', '四川'].some((name) => destination.includes(name))) {
      advice.push('山水和高海拔目的地相对适合避暑，但雨季要留意山路和漂流类活动安排。');
    }
    if (['三亚', '海南', '广东'].some((name) => destination.includes(name))) {
      advice.push('海岛和沿海线路要结合天气预警判断，遇到台风或强降雨应降低推荐优先级。');
    }
  }

  if ([11, 12, 1, 2].includes(month)) {
    advice.push('冬季适合温泉、南方暖线、冰雪主题；高海拔和北方线路要关注低温、结冰和交通延误。');
    if (['西藏', '新疆', '四川'].some((name) => destination.includes(name))) {
      advice.push('高海拔或长距离线路不宜盲目推荐给老人、儿童或怕冷用户。');
    }
  }

  if ([3, 4, 5].includes(month) && !isSouthChinaHotRainySeason(destination, month)) {
    advice.push('春季适合踏青赏花、山水自然和短途休闲，但南方回南天和连续降雨会影响体验。');
  }

  if (advice.length === 0) {
    advice.push('按出发月份、目的地气候和用户同行人群综合判断舒适度。');
  }

  return advice;
}

function shouldUseWeatherResearch(text: string, intent: AiTravelIntent | null) {
  return (
    /(天气|气温|温度|下雨|降雨|暴雨|台风|预报|季节|避暑|怕热|闷热|大夏天)/.test(text) ||
    Boolean(intent?.weatherSensitivity?.length)
  );
}

function buildNoWeatherContext(): AiWeatherContext {
  return {
    destination: DEFAULT_DEPARTURE_CITY,
    forecastSummary: '',
    seasonAdvice: [],
    inferredFrom: [],
    role: 'departure',
    source: 'none',
  };
}

function buildFastWeatherContext(params: {
  text: string;
  messages: AiRecommendationMessage[];
  searchQuery: string;
  activeFilters: FilterState;
  preferenceMemory: AiPreferenceMemory | null | undefined;
  tours: AiRecommendationCandidate[];
}): AiWeatherContext {
  const { destination, travelDate, inferredFrom } = resolveWeatherContext(params);
  const seasonAdvice = getSeasonAdvice(destination, travelDate);
  const month = travelDate ? new Date(travelDate).getMonth() + 1 : new Date().getMonth() + 1;
  const seasonSummary = isSouthChinaHotRainySeason(destination, month)
    ? `${destination}当前大概率处于闷热多雨阶段，优先考虑避暑、防晒、防雨和室内外搭配。`
    : seasonAdvice[0] || `先按${destination}当季体感和玩法稳定性判断。`;

  return {
    destination,
    travelDate,
    forecastSummary: seasonSummary,
    seasonAdvice,
    inferredFrom,
    role: 'departure',
    source: 'seasonal-rule',
  };
}

function findCoords(destination: string) {
  const entry = Object.entries(DESTINATION_COORDS).find(([name]) => destination.includes(name));
  return entry?.[1] || DESTINATION_COORDS[destination];
}

async function fetchWeatherContext(
  params: {
    text: string;
    messages: AiRecommendationMessage[];
    searchQuery: string;
    activeFilters: FilterState;
    preferenceMemory: AiPreferenceMemory | null | undefined;
    tours: AiRecommendationCandidate[];
  },
): Promise<AiWeatherContext> {
  const { destination, travelDate, inferredFrom } = resolveWeatherContext(params);
  return fetchDestinationWeatherInsight({
    destination,
    travelDate,
    inferredFrom,
    role: 'departure',
    queryReason: inferredFrom?.includes('默认出发地')
      ? '默认作为广州出发天气与出行风险提示'
      : '根据当前上下文推断的主天气锚点',
  });
}

async function fetchDestinationWeatherInsight(params: {
  destination: string;
  travelDate?: string;
  inferredFrom?: string[];
  role: 'departure' | 'destination';
  queryReason?: string;
  corpus?: string;
}): Promise<DestinationWeatherInsight> {
  const seasonAdvice = getSeasonAdvice(params.destination, params.travelDate);
  const coords = findCoords(params.destination);
  const bestSeasonNote = getDestinationBestSeasonNote(params.destination, params.corpus || '');

  if (!params.destination || !coords) {
    return {
      destination: params.destination,
      travelDate: params.travelDate,
      forecastSummary: getFallbackWeatherSummary(seasonAdvice, bestSeasonNote),
      dateSpecificSummary: undefined,
      weatherWindowLabel: params.travelDate ? `${formatMonthDay(params.travelDate)}这班` : undefined,
      weatherRiskLevel: 'unknown',
      seasonAdvice,
      inferredFrom: params.inferredFrom,
      queryReason: params.queryReason,
      bestSeasonNote,
      role: params.role,
      source: 'seasonal-rule',
    };
  }

  try {
    const weatherCacheKey = `${params.destination}::${coords.latitude},${coords.longitude}::${params.travelDate || 'none'}`;
    let weatherSnapshotPromise = weatherSnapshotCache.get(weatherCacheKey);

    if (!weatherSnapshotPromise) {
      weatherSnapshotPromise = (async () => {
        const query = new URLSearchParams({
          latitude: String(coords.latitude),
          longitude: String(coords.longitude),
          daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code',
          timezone: 'auto',
          forecast_days: '7',
        });
        const response = await fetchWithTimeout(
          `https://api.open-meteo.com/v1/forecast?${query.toString()}`,
          undefined,
          WEATHER_FETCH_TIMEOUT_MS,
        );
        if (!response.ok) throw new Error(`Weather API failed: ${response.status}`);

        const data = await response.json();
        const daily = data.daily;
        const dailyTimes: string[] = daily?.time ?? [];
        const maxTemps: number[] = daily?.temperature_2m_max ?? [];
        const minTemps: number[] = daily?.temperature_2m_min ?? [];
        const rainProbs: number[] = daily?.precipitation_probability_max ?? [];
        const maxTemp = Math.round(Math.max(...maxTemps));
        const minTemp = Math.round(Math.min(...minTemps));
        const maxRain = Math.round(Math.max(...rainProbs));
        const targetIndex = params.travelDate ? dailyTimes.indexOf(params.travelDate) : -1;
        const dayMaxTemp = targetIndex >= 0 ? Math.round(maxTemps[targetIndex] ?? maxTemp) : undefined;
        const dayMinTemp = targetIndex >= 0 ? Math.round(minTemps[targetIndex] ?? minTemp) : undefined;
        const dayRain = targetIndex >= 0 ? Math.round(rainProbs[targetIndex] ?? maxRain) : undefined;
        const weatherRiskLevel: AiWeatherContext['weatherRiskLevel'] =
          typeof dayRain === 'number' || typeof dayMaxTemp === 'number'
            ? (Number(dayRain ?? 0) >= 70 || Number(dayMaxTemp ?? 0) >= 35
                ? 'worse'
                : Number(dayRain ?? 0) >= 40 || Number(dayMaxTemp ?? 0) >= 32
                  ? 'mixed'
                  : 'better')
            : 'unknown';

        return {
          forecastSummary: `${params.destination}未来7天约 ${minTemp}-${maxTemp}℃，最高降水概率约 ${maxRain}%。`,
          dateSpecificSummary: params.travelDate && targetIndex >= 0
            ? `${formatMonthDay(params.travelDate)}预计 ${dayMinTemp}-${dayMaxTemp}℃，降雨概率约 ${dayRain}%`
            : undefined,
          weatherWindowLabel: params.travelDate ? `${formatMonthDay(params.travelDate)}这班` : undefined,
          weatherRiskLevel,
          source: 'open-meteo' as const,
        };
      })().catch((error) => {
        weatherSnapshotCache.delete(weatherCacheKey);
        throw error;
      });

      weatherSnapshotCache.set(weatherCacheKey, weatherSnapshotPromise);
    }

    const weatherSnapshot = await weatherSnapshotPromise;

    return {
      destination: params.destination,
      travelDate: params.travelDate,
      forecastSummary: weatherSnapshot.forecastSummary,
      dateSpecificSummary: weatherSnapshot.dateSpecificSummary,
      weatherWindowLabel: weatherSnapshot.weatherWindowLabel,
      weatherRiskLevel: weatherSnapshot.weatherRiskLevel,
      seasonAdvice,
      inferredFrom: params.inferredFrom,
      queryReason: params.queryReason,
      bestSeasonNote,
      role: params.role,
      source: weatherSnapshot.source,
    };
  } catch {
    return {
      destination: params.destination,
      travelDate: params.travelDate,
      forecastSummary: getFallbackWeatherSummary(seasonAdvice, bestSeasonNote),
      dateSpecificSummary: undefined,
      weatherWindowLabel: params.travelDate ? `${formatMonthDay(params.travelDate)}这班` : undefined,
      weatherRiskLevel: 'unknown',
      seasonAdvice,
      inferredFrom: params.inferredFrom,
      queryReason: params.queryReason,
      bestSeasonNote,
      role: params.role,
      source: 'seasonal-rule',
    };
  }
}

function buildAiMessages(params: {
  userText: string;
  messages: AiRecommendationMessage[];
  candidates: ReturnType<typeof compactCandidates>;
  routeAtlas: RouteAtlas;
  auditContext: RecommendationAuditContext;
  weatherContext: AiWeatherContext;
  destinationWeatherInsights: DestinationWeatherInsight[];
  searchQuery: string;
  intent: AiTravelIntent | null;
  preferenceMemory: AiPreferenceMemory | null;
  allowPublicInterest: boolean;
}) {
  const intentCoverage = analyzeIntentCoverage(params.candidates, params.intent);
  const promptPolicy = buildPublicInterestPromptPolicy(params.allowPublicInterest);
  // 经验：想让 provider cache 命中，关键不是少输出，而是让大块稳定上下文稳定。
  // system message 只放身份、候选边界和输出格式，排序取舍尽量交给模型。
  const systemPrompt = [
    '你是旅行团推荐顾问，从给定候选池里理解用户需求并排序。',
    '输出只能引用候选池中真实存在的 tourId；线路事实、价格、班期、酒店、景点和服务来自候选原语。',
    '可结合 q、rc、pm、it、wx、dw、候选事实、价格上下文 pc/pricePct 和必要的目的地常识理解软语义。',
    ...promptPolicy.systemRules,
    '严格输出 JSON，不要 Markdown，不要额外解释。',
  ].join('\n');

  const stablePrefix = buildStablePromptPrefix({
    candidates: params.candidates,
    routeAtlas: params.routeAtlas,
  });

  const dynamicRequest = {
    t: 'rank_top24',
    q: params.userText,
    sq: params.searchQuery,
    rc: compactRecentConversation(params.messages),
    pm: compactPreferenceMemoryForPrompt(params.preferenceMemory),
    it: compactIntentForPrompt(params.intent),
    ic: intentCoverage,
    ac: compactAuditContextForPrompt(params.auditContext),
    wx: compactWeatherContextForPrompt(params.weatherContext),
    dw: compactDestinationWeatherInsightsForPrompt(params.destinationWeatherInsights),
    ol: MAX_AI_RANKED_ITEMS,
    cl: MAX_AI_PROMPT_REASON_ITEMS,
    schema: {
      summary: '2-4 句中文，写推荐方向、天气/季节判断、注意事项或替代逻辑',
      intentNotes: {
        worldKnowledgeUse: '一句中文，说明软语义如何借助世界知识判断；若只是硬筛选可省略',
        softCriteria: promptPolicy.softCriteriaDescription,
        cannotAssert: promptPolicy.cannotAssertDescription,
        caveat: '一句中文，说明近似替代或证据边界',
      },
      intent: {
        semanticFocus: promptPolicy.semanticFocusDescription,
        travelStyle: 'string[]',
        mustHave: 'string[]',
        weatherSensitivity: 'string[]',
        nearestAlternativeOkay: 'boolean|null',
        budgetPriority: 'low|balanced|premium|null',
        refinementMode: 'new_search|refine_previous|broaden|replace_destination|null',
        confidence: '0-1',
      },
      items: [
        {
          tourId: '候选 id',
          score: '0-100 number',
          reason: `仅前 ${MAX_AI_PROMPT_REASON_ITEMS} 条需要。1 句中文，引用候选事实并解释软语义/天气取舍；其余条目省略`,
          matchedSignals: `仅前 ${MAX_AI_PROMPT_REASON_ITEMS} 条需要。2-3 个中文短语；其余条目省略`,
        },
      ],
      itemCountLimit: MAX_AI_RANKED_ITEMS,
    },
    rq: [
      '按用户原话和上下文理解需求，可返回 intent 修正你的理解。',
      'candidates 里 pc/pricePct 是价格上下文，atoms/cats/seasonAtoms/conflicts 是候选事实摘要。',
      ...promptPolicy.requestRules,
      [
        `只给前 ${MAX_AI_PROMPT_REASON_ITEMS} 个 items 写 reason/matchedSignals；`,
        `第 ${MAX_AI_PROMPT_REASON_ITEMS + 1}-${MAX_AI_RANKED_ITEMS} 个只需要 tourId 和 score。`,
      ].join(''),
    ],
  };

  return [
    { role: 'system', content: systemPrompt },
    { role: 'system', content: JSON.stringify(stablePrefix) },
    { role: 'user', content: JSON.stringify(dynamicRequest) },
  ];
}

function buildLiteAiMessages(params: {
  userText: string;
  messages: AiRecommendationMessage[];
  candidates: ReturnType<typeof compactCandidates>;
  weatherContext: AiWeatherContext;
  searchQuery: string;
  intent: AiTravelIntent | null;
  preferenceMemory: AiPreferenceMemory | null;
  allowPublicInterest: boolean;
}) {
  // 经验：OpenRouter 免费模型能通，但大上下文下经常 200 返回后没有可用 JSON。
  // 这里给免费弱模型只做“排序和软语义取舍”，文案、天气补充和约束审计仍由本地完成。
  const promptPolicy = buildPublicInterestPromptPolicy(params.allowPublicInterest);
  const request = {
    t: 'rank_top24_lite',
    q: params.userText,
    sq: params.searchQuery,
    rc: compactRecentConversation(params.messages).slice(-2),
    pm: compactPreferenceMemoryForPrompt(params.preferenceMemory),
    it: compactIntentForPrompt(params.intent),
    wx: compactWeatherContextForPrompt(params.weatherContext),
    ck: [
      'id', 'title', 'destination', 'days', 'price', 'match', 'atoms', 'cats', 'weather', 'conflict',
      'pricePct', 'priceBand', 'termCoverage', 'termHits',
    ],
    candidates: compactCandidatesForLitePrompt(params.candidates),
    schema: {
      intentNotes: {
        w: '短句，如何用世界知识理解 q 的软语义',
        sc: 'string[]，最多4个软语义标准',
        ca: 'string[]，候选无证据时不能断言的事实',
        cv: '短句，近似替代或证据边界',
      },
      items: [{
        tourId: '候选 id',
        score: '0-100 number',
        sf: '仅前8条需要，24字内，贴近软语义或近似替代',
        ss: '仅前8条需要，最多3个短词',
        sb: '仅前8条需要，24字内，不能断言的边界',
      }],
      itemCountLimit: MAX_AI_RANKED_ITEMS,
    },
    rq: [
      '只输出 JSON，不要 Markdown。',
      '返回 intentNotes 和 items；不要 summary、reason、matchedSignals。',
      '只允许使用 candidates 中存在的 id。',
      '用紧凑 JSON；中文短句不超过24字。',
      `前8个 items 可写 sf/ss/sb；第9-${MAX_AI_RANKED_ITEMS}个 items 只写 tourId 和 score。`,
      '结合 q、it、wx、atoms/cats、pricePct/priceBand、termCoverage/termHits 和 conflict 理解软语义。',
      ...promptPolicy.liteRules,
    ],
  };

  return [
    {
      role: 'system' as const,
      content: '你是旅行团候选排序器。只基于给定候选排序，严格输出 JSON。不要编造 tourId。',
    },
    { role: 'user' as const, content: JSON.stringify(request) },
  ];
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, '');
}

function getChatCompletionsUrl(baseUrl: string) {
  const normalized = normalizeBaseUrl(baseUrl);
  if (normalized.endsWith('/chat/completions')) return normalized;
  if (/\/v\d+$/.test(normalized)) return `${normalized}/chat/completions`;
  return `${normalized}/v1/chat/completions`;
}

function parseAiJson(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const recovered = recoverPartialAiJson(content);
    if (recovered) return recovered;
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI response is not JSON');
    return JSON.parse(match[0]);
  }
}

function findMatchingJsonEnd(content: string, startIndex: number, openChar: '{' | '[') {
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < content.length; index += 1) {
    const char = content[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === openChar) {
      depth += 1;
    } else if (char === closeChar) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
}

function parseCompleteObjectAfterKey(content: string, key: string) {
  const keyIndex = content.indexOf(`"${key}"`);
  if (keyIndex < 0) return null;
  const objectStart = content.indexOf('{', keyIndex);
  if (objectStart < 0) return null;
  const objectEnd = findMatchingJsonEnd(content, objectStart, '{');
  if (objectEnd < 0) return null;

  try {
    return JSON.parse(content.slice(objectStart, objectEnd + 1));
  } catch {
    return null;
  }
}

function parseCompleteObjectsFromArrayAfterKey(content: string, key: string) {
  const keyIndex = content.indexOf(`"${key}"`);
  if (keyIndex < 0) return [];
  const arrayStart = content.indexOf('[', keyIndex);
  if (arrayStart < 0) return [];

  const objects: unknown[] = [];
  let inString = false;
  let escaped = false;
  let objectDepth = 0;
  let objectStart = -1;

  for (let index = arrayStart + 1; index < content.length; index += 1) {
    const char = content[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') {
      if (objectDepth === 0) objectStart = index;
      objectDepth += 1;
      continue;
    }
    if (char === '}') {
      objectDepth -= 1;
      if (objectDepth === 0 && objectStart >= 0) {
        try {
          objects.push(JSON.parse(content.slice(objectStart, index + 1)));
        } catch {
          // Skip malformed objects and keep earlier complete items.
        }
        objectStart = -1;
      }
    }
  }

  return objects;
}

function recoverPartialAiJson(content: string) {
  const items = parseCompleteObjectsFromArrayAfterKey(content, 'items');
  if (items.length === 0) return null;
  const intentNotes = parseCompleteObjectAfterKey(content, 'intentNotes');
  return {
    ...(intentNotes ? { intentNotes } : {}),
    items,
  };
}

function summarizeAiUsage(data: unknown) {
  const usage = (data as {
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
      completion_tokens_details?: { reasoning_tokens?: number };
    };
  })?.usage;
  const completionTokens = Number(usage?.completion_tokens ?? 0);
  const reasoningTokens = Number(usage?.completion_tokens_details?.reasoning_tokens ?? 0);
  const totalTokens = Number(usage?.total_tokens ?? 0);
  return {
    tokensSeen: completionTokens > 0 || reasoningTokens > 0 || totalTokens > 0,
    completionTokens,
    reasoningTokens,
    totalTokens,
  };
}

function getAiProviderParseErrorLabel(config: AiProviderConfig, stage: string, detail = '') {
  const suffix = detail ? `: ${detail}` : '';
  return `AI API unusable [${config.model}] ${stage}${suffix}`;
}

function parseAiProviderResponse(data: unknown, config: AiProviderConfig) {
  const usage = summarizeAiUsage(data);
  const choice = (data as {
    choices?: Array<{
      finish_reason?: unknown;
      error?: { message?: string; code?: string };
      message?: { content?: unknown; reasoning?: unknown };
    }>;
  })?.choices?.[0];
  if (choice?.error || choice?.finish_reason === 'error') {
    throw new Error(getAiProviderParseErrorLabel(
      config,
      'provider_error',
      choice.error?.message || choice.error?.code || 'finish_reason=error',
    ));
  }
  const message = choice?.message;
  const content = message?.content;

  if (typeof content !== 'string' || !content.trim()) {
    throw new Error(getAiProviderParseErrorLabel(
      config,
      usage.tokensSeen ? 'tokens_seen/content_missing' : 'content_missing',
      `completion=${usage.completionTokens}, reasoning=${usage.reasoningTokens}`,
    ));
  }

  let parsed: unknown;
  try {
    parsed = parseAiJson(content);
  } catch (error) {
    throw new Error(getAiProviderParseErrorLabel(
      config,
      'json_parse_failed',
      error instanceof Error ? error.message : '',
    ));
  }

  const items = (parsed as { items?: unknown })?.items;
  if (!Array.isArray(items)) {
    throw new Error(getAiProviderParseErrorLabel(config, 'schema_invalid', 'items missing'));
  }

  return parsed;
}

function emitProgress(
  callback: AiRecommendationRequest['onProgress'],
  progress: AiRecommendationProgress,
) {
  callback?.(progress);
}

/**
 * Yield to the browser's event loop so pending React state updates
 * (e.g., progress bar text) can paint before heavy synchronous work.
 */
function yieldToMain() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const upstreamSignal = init?.signal;
  const abortFromUpstream = () => controller.abort(upstreamSignal?.reason);
  if (upstreamSignal?.aborted) {
    controller.abort(upstreamSignal.reason);
  } else {
    upstreamSignal?.addEventListener('abort', abortFromUpstream, { once: true });
  }
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    globalThis.clearTimeout(timeoutId);
    upstreamSignal?.removeEventListener('abort', abortFromUpstream);
  }
}

export const __aiRecommendationTestHooks = {
  auditAiRecommendationsStrict,
  auditAiRecommendations,
  buildAiMessages,
  buildHardIntentFromText,
  buildLiteAiMessages,
  buildRecommendationAuditContext,
  buildRouteAtlas,
  buildTourPrimitive,
  collectAvoidHints,
  collectLiteralAvoidHints,
  compactCandidates,
  allowsPublicInterestForTurn,
  finalizeRecommendationSummary,
  getConcreteAiReason,
  getPrimitiveConflictReasons,
  matchesActiveDateFilters,
  matchesDateWindow,
  mergeAiAndLocalRecommendations,
  mergeIntentWithMemory,
  normalizeIntent,
  prioritizeRecommendationItems,
  rewriteRecommendationCopy,
  resolvePromptDateWindow,
  sanitizeAiBudgetBoundsForTurn,
  sanitizeAiIntentForTurn,
  validateAiItems,
};

function setUniqueLookupValue(map: Map<string, string>, key: string, value: string) {
  if (!key) return;
  const existing = map.get(key);
  if (!existing) {
    map.set(key, value);
    return;
  }
  if (existing !== value) {
    map.set(key, '');
  }
}

function buildAiCandidateLookup(candidateTours: AiRecommendationCandidate[]) {
  const byNormalizedId = new Map<string, string>();
  const byNumericSuffix = new Map<string, string>();
  const byTitle = new Map<string, string>();
  const byTitleDestination = new Map<string, string>();

  for (const tour of candidateTours) {
    const normalizedId = normalizeLooseKey(tour.id);
    setUniqueLookupValue(byNormalizedId, normalizedId, tour.id);

    const numericSuffix = String(tour.id).match(/\d+/g)?.join('') || '';
    setUniqueLookupValue(byNumericSuffix, numericSuffix, tour.id);

    const normalizedTitle = normalizeLooseKey(tour.title);
    setUniqueLookupValue(byTitle, normalizedTitle, tour.id);
    setUniqueLookupValue(
      byTitleDestination,
      `${normalizedTitle}::${normalizeLooseKey(tour.destination)}`,
      tour.id,
    );
  }

  return {
    byNormalizedId,
    byNumericSuffix,
    byTitle,
    byTitleDestination,
  };
}

function resolveAiCandidateTourId(
  item: Partial<AiRecommendationItem> & {
    id?: unknown;
    title?: unknown;
    destination?: unknown;
  },
  candidateTours: AiRecommendationCandidate[],
  lookup = buildAiCandidateLookup(candidateTours),
) {
  const directTourId = typeof item.tourId === 'string' ? item.tourId : typeof item.id === 'string' ? item.id : '';
  if (directTourId && candidateTours.some((tour) => tour.id === directTourId)) {
    return directTourId;
  }

  const normalizedId = normalizeLooseKey(directTourId);
  const normalizedIdHit = lookup.byNormalizedId.get(normalizedId);
  if (normalizedIdHit) return normalizedIdHit;

  const numericSuffix = directTourId.match(/\d+/g)?.join('') || normalizedId.match(/\d+/g)?.join('') || '';
  const numericSuffixHit = lookup.byNumericSuffix.get(numericSuffix);
  if (numericSuffixHit) return numericSuffixHit;

  const title = typeof item.title === 'string' ? item.title : '';
  const destination = typeof item.destination === 'string' ? item.destination : '';
  const titleDestinationHit = lookup.byTitleDestination.get(
    `${normalizeLooseKey(title)}::${normalizeLooseKey(destination)}`,
  );
  if (titleDestinationHit) return titleDestinationHit;

  const titleHit = lookup.byTitle.get(normalizeLooseKey(title));
  if (titleHit) return titleHit;

  return '';
}

function validateAiItems(
  value: unknown,
  candidateTours: AiRecommendationCandidate[],
): AiRecommendationItem[] {
  const primitiveByTourId = new Map(candidateTours.map((tour) => [tour.id, buildTourPrimitive(tour)]));
  const candidateLookup = buildAiCandidateLookup(candidateTours);
  const rawItems = Array.isArray((value as { items?: unknown[] })?.items)
    ? (value as { items: unknown[] }).items
    : [];
  const seenTourIds = new Set<string>();
  const validatedItems: AiRecommendationItem[] = [];

  for (const [index, rawItem] of rawItems.entries()) {
    const item = rawItem as Partial<AiRecommendationItem> & {
      id?: unknown;
      title?: unknown;
      destination?: unknown;
      sf?: unknown;
      ss?: unknown;
      sb?: unknown;
    };
    const resolvedTourId = resolveAiCandidateTourId(item, candidateTours, candidateLookup);
    if (!resolvedTourId || seenTourIds.has(resolvedTourId)) continue;
    seenTourIds.add(resolvedTourId);

    const validatedIndex = validatedItems.length;
    const primitive = primitiveByTourId.get(resolvedTourId);
    const semanticFit = normalizeAiText(item.semanticFit ?? item.sf, 140);
    const semanticSignals = normalizeAiTextList(item.semanticSignals ?? item.ss, 4, 40);
    const semanticBoundary = normalizeAiText(item.semanticBoundary ?? item.sb, 120);
    const matchedSignals = validatedIndex < MAX_AI_COMMENTARY_ITEMS
      ? getConcreteMatchedSignals(item.matchedSignals, primitive)
      : [];
    validatedItems.push({
      tourId: resolvedTourId,
      score: Number.isFinite(Number(item.score)) ? Number(item.score) : 80 - index,
      reason: validatedIndex < MAX_AI_COMMENTARY_ITEMS
        ? getConcreteAiReason(item.reason || semanticFit, primitive)
        : undefined,
      matchedSignals: uniqueStrings([...semanticSignals, ...matchedSignals]).slice(0, 5),
      semanticFit: semanticFit || undefined,
      semanticSignals,
      semanticBoundary: semanticBoundary || undefined,
    });
  }

  return validatedItems;
}

function getAuditNote(reasons: string[]) {
  if (reasons.length === 0) return null;
  const visibleReasons = reasons.slice(0, 2).join('；');
  return `审计提示：${visibleReasons}`;
}

function buildHardConflictReason(reasons: string[]) {
  if (reasons.length === 0) return '';
  return `需放宽条件：${reasons.slice(0, 3).join('；')}`;
}

function markAsAlternativeRecommendation(
  item: AiRecommendationItem,
  reasons: string[],
): AiRecommendationItem {
  const conflictReason = buildHardConflictReason(reasons);
  const originalReason = stripTerminalPunctuation(item.reason || '');
  return {
    ...item,
    reason: conflictReason
      ? `${conflictReason}。${originalReason || '这是当前候选池里最接近的替代线路。'}`
      : item.reason,
    matchedSignals: uniqueStrings([
      conflictReason,
      ...item.matchedSignals.filter((signal) => !signal.startsWith('需放宽条件')),
    ]).slice(0, 5),
  };
}

function auditAiRecommendations(
  aiItems: AiRecommendationItem[],
  localItems: AiRecommendationItem[],
  candidateTours: AiRecommendationCandidate[],
  intent: AiTravelIntent | null,
): AiRecommendationItem[] {
  const primitiveByTourId = new Map(candidateTours.map((tour) => [tour.id, buildTourPrimitive(tour)]));
  const auditedAiItems: AiRecommendationItem[] = [];
  const alternativeItems: AiRecommendationItem[] = [];

  for (const item of aiItems) {
    const primitive = primitiveByTourId.get(item.tourId);
    if (!primitive) continue;

    const conflictReasons = getPrimitiveConflictReasons(intent, primitive);
    const auditNote = getAuditNote(conflictReasons);
    if (conflictReasons.length > 0) {
      alternativeItems.push(markAsAlternativeRecommendation(
        {
          ...item,
          score: Math.min(Math.max(1, item.score), 28),
        },
        conflictReasons,
      ));
      continue;
    }

    auditedAiItems.push({
      ...item,
      reason: auditNote && item.reason
        ? `${item.reason}（${auditNote.replace('审计提示：', '')}）`
        : item.reason,
      matchedSignals: auditNote
        ? [auditNote, ...item.matchedSignals.filter((signal) => !signal.startsWith('审计提示'))].slice(0, 5)
        : item.matchedSignals,
    });
  }

  const auditedIds = new Set([
    ...auditedAiItems.map((item) => item.tourId),
    ...alternativeItems.map((item) => item.tourId),
  ]);
  const supplementalItems = localItems
    .filter((item) => !auditedIds.has(item.tourId))
    .slice(0, MAX_AI_RANKED_ITEMS);

  return [...auditedAiItems, ...alternativeItems, ...supplementalItems]
    .slice(0, MAX_AI_RANKED_ITEMS);
}

function auditAiRecommendationsStrict(
  aiItems: AiRecommendationItem[],
  localItems: AiRecommendationItem[],
  candidateTours: AiRecommendationCandidate[],
  intent: AiTravelIntent | null,
): AiRecommendationItem[] {
  const primitiveByTourId = new Map(candidateTours.map((tour) => [tour.id, buildTourPrimitive(tour)]));
  const seenTourIds = new Set<string>();
  const auditedItems: AiRecommendationItem[] = [];

  const pushAudited = (item: AiRecommendationItem) => {
    if (seenTourIds.has(item.tourId)) return;
    const primitive = primitiveByTourId.get(item.tourId);
    if (!primitive) return;
    seenTourIds.add(item.tourId);

    const conflictReasons = getPrimitiveConflictReasons(intent, primitive);
    auditedItems.push(
      conflictReasons.length > 0
        ? markAsAlternativeRecommendation(item, conflictReasons)
        : item,
    );
  };

  aiItems.forEach((item) => pushAudited(item));
  localItems.forEach((item) => pushAudited(item));

  return auditedItems.slice(0, MAX_AI_RANKED_ITEMS);
}

function normalizeIntent(value: unknown): AiTravelIntent | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as AiTravelIntent;
  return {
    tripDays: raw.tripDays ? Number(raw.tripDays) : null,
    tripDaysMin: raw.tripDaysMin ? Number(raw.tripDaysMin) : null,
    tripDaysMax: raw.tripDaysMax ? Number(raw.tripDaysMax) : null,
    departureWithinDays: raw.departureWithinDays ? Number(raw.departureWithinDays) : null,
    departureWeekdays: Array.isArray(raw.departureWeekdays)
      ? raw.departureWeekdays.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
      : [],
    departureTimeOfDay: raw.departureTimeOfDay || null,
    destinationHints: Array.isArray(raw.destinationHints) ? raw.destinationHints.map(String).filter(Boolean) : [],
    budgetMin: raw.budgetMin ? Number(raw.budgetMin) : null,
    budgetMax: raw.budgetMax ? Number(raw.budgetMax) : null,
    travelStyle: Array.isArray(raw.travelStyle) ? raw.travelStyle.map(String).filter(Boolean) : [],
    mustHave: Array.isArray(raw.mustHave) ? raw.mustHave.map(String).filter(Boolean) : [],
    avoid: Array.isArray(raw.avoid) ? raw.avoid.map(String).filter(Boolean) : [],
    weatherSensitivity: Array.isArray(raw.weatherSensitivity)
      ? raw.weatherSensitivity.map(String).filter(Boolean)
      : [],
    semanticFocus: Array.isArray(raw.semanticFocus) ? raw.semanticFocus.map(String).filter(Boolean) : [],
    nearestAlternativeOkay: typeof raw.nearestAlternativeOkay === 'boolean' ? raw.nearestAlternativeOkay : null,
    budgetPriority: ['low', 'balanced', 'premium'].includes(String(raw.budgetPriority))
      ? raw.budgetPriority as AiTravelIntent['budgetPriority']
      : null,
    refinementMode: ['new_search', 'refine_previous', 'broaden', 'replace_destination'].includes(String(raw.refinementMode))
      ? raw.refinementMode as AiTravelIntent['refinementMode']
      : null,
    confidence: Number.isFinite(Number(raw.confidence)) ? Number(raw.confidence) : undefined,
  };
}

function normalizeDepartureTimeOfDay(value: unknown): AiTravelIntent['departureTimeOfDay'] {
  return ['morning', 'afternoon', 'evening', 'night', 'any'].includes(String(value))
    ? value as AiTravelIntent['departureTimeOfDay']
    : null;
}

function mergeIntentWithMemory(
  intent: AiTravelIntent | null,
  memory: AiPreferenceMemory | null | undefined,
): AiTravelIntent | null {
  if (!intent && !memory) return null;
  const positivePreferences = uniqueStrings([
    ...(intent?.travelStyle || []),
    ...(intent?.mustHave || []),
  ]);
  const currentAvoid = intent?.avoid || [];
  const inheritedAvoid = memory?.avoid || [];
  const avoid = currentAvoid.length > 0
    ? currentAvoid
    : inheritedAvoid.filter((term) =>
        !positivePreferences.some((preference) => preferenceMentionsTerm(preference, term)),
      );

  return {
    ...(intent || {}),
    destinationHints: intent?.destinationHints?.length ? intent.destinationHints : memory?.destinationHints || [],
    travelStyle: intent?.travelStyle?.length ? intent.travelStyle : memory?.travelStyle || [],
    mustHave: intent?.mustHave?.length ? intent.mustHave : memory?.mustHave || [],
    semanticFocus: intent?.semanticFocus?.length ? intent.semanticFocus : memory?.semanticFocus || [],
    avoid,
    weatherSensitivity: intent?.weatherSensitivity?.length
      ? intent.weatherSensitivity
      : memory?.weatherSensitivity || [],
    nearestAlternativeOkay: intent?.nearestAlternativeOkay ?? memory?.nearestAlternativeOkay ?? null,
    budgetMin: intent?.budgetMin ?? memory?.budgetMin ?? null,
    budgetMax: intent?.budgetMax ?? memory?.budgetMax ?? null,
    budgetPriority: intent?.budgetPriority ?? memory?.budgetPriority ?? null,
    tripDays: intent?.tripDays ?? memory?.tripDays ?? null,
    tripDaysMin: intent?.tripDaysMin ?? memory?.tripDaysMin ?? null,
    tripDaysMax: intent?.tripDaysMax ?? memory?.tripDaysMax ?? null,
    departureWithinDays: intent?.departureWithinDays ?? memory?.departureWithinDays ?? null,
    departureWeekdays: intent?.departureWeekdays?.length
      ? intent.departureWeekdays
      : memory?.departureWeekdays || [],
    departureTimeOfDay: normalizeDepartureTimeOfDay(intent?.departureTimeOfDay ?? memory?.departureTimeOfDay),
    refinementMode: intent?.refinementMode ?? memory?.refinementMode ?? null,
  };
}

function normalizeBudgetPriorityByUserText(
  intent: AiTravelIntent | null,
  userText: string,
): AiTravelIntent | null {
  if (!intent?.budgetPriority) return intent;
  if (hasExplicitBudgetPriorityText(userText)) return intent;
  return {
    ...intent,
    budgetPriority: null,
  };
}

function hasExplicitBudgetBoundsText(userText: string) {
  return Boolean(parseBudget(normalizeText(userText)));
}

function hasExplicitBudgetPriorityText(userText: string) {
  const normalizedText = userText.replace(/\s+/g, '');
  return /便宜|低价|性价比|省钱|穷游|划算|实惠|不贵|越低越好|能省则省|高端|奢华|豪华|贵一点|品质|不差钱|预算不限/.test(normalizedText);
}

function sanitizeAiBudgetBoundsForTurn(
  intent: AiTravelIntent | null,
  userText: string,
): AiTravelIntent | null {
  const hasBudgetBounds = hasExplicitBudgetBoundsText(userText);
  const hasBudgetPriority = hasExplicitBudgetPriorityText(userText);
  if (!intent?.budgetMax && !intent?.budgetMin && (!intent || !intent.budgetPriority || hasBudgetPriority)) {
    return intent;
  }
  if (hasBudgetBounds) {
    return hasBudgetPriority
      ? intent
      : {
          ...intent,
          budgetPriority: null,
        };
  }
  return {
    ...intent,
    budgetMin: null,
    budgetMax: null,
    budgetPriority: null,
  };
}

function normalizeMessagesForProvider(messages: ReturnType<typeof buildAiMessages>) {
  const systemMessages = messages.filter((message) => message.role === 'system');
  const nonSystemMessages = messages.filter((message) => message.role !== 'system');
  if (systemMessages.length <= 1) return messages;

  return [
    {
      role: 'system' as const,
      content: systemMessages.map((message) => message.content).join('\n\n'),
    },
    ...nonSystemMessages,
  ];
}

function getProviderTimeoutMs(config: AiProviderConfig) {
  const providerKey = `${config.baseUrl} ${config.model}`.toLowerCase();
  // Experience note: free models often spend the first visible tokens on hidden
  // reasoning or sit behind a cold router. Keep the free tier patient enough to
  // survive CoT/network jitter; keep DeepSeek short because it is the paid fallback.
  if (providerKey.includes('deepseek')) return AI_FAST_FALLBACK_TIMEOUT_MS;
  if (
    providerKey.includes('siliconflow') ||
    providerKey.includes('openrouter') ||
    providerKey.includes('qwen') ||
    providerKey.includes('z.ai') ||
    providerKey.includes('glm')
  ) {
    return AI_FREE_PROVIDER_TIMEOUT_MS;
  }
  return AI_DEFAULT_PROVIDER_TIMEOUT_MS;
}

function getProviderRequestHeaders(config: AiProviderConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apiKey}`,
  };
  if (`${config.baseUrl} ${config.model}`.toLowerCase().includes('openrouter')) {
    headers['HTTP-Referer'] = 'https://nuctori.github.io/EverywhereWeGoGz/';
    headers['X-OpenRouter-Title'] = 'EverywhereWeGoGz';
  }
  return headers;
}

function shouldUseLiteAiPrompt(config: AiProviderConfig) {
  const providerKey = `${config.baseUrl} ${config.model}`.toLowerCase();
  return (
    providerKey.includes('openrouter') ||
    providerKey.includes('siliconflow') ||
    providerKey.includes('qwen')
  );
}

function buildAiRequestBody(
  config: AiProviderConfig,
  messages: ReturnType<typeof buildAiMessages>,
  maxTokens?: number,
) {
  const providerKey = `${config.baseUrl} ${config.model}`.toLowerCase();
  const body: Record<string, unknown> = {
    model: config.model,
    messages: normalizeMessagesForProvider(messages),
    temperature: 0.25,
    max_tokens: maxTokens ?? 2048,
    response_format: { type: 'json_object' },
    thinking: { type: 'disabled' },
  };

  if (providerKey.includes('openrouter')) {
    body.reasoning = { effort: 'none', exclude: true };
    body.include_reasoning = false;
  }

  return JSON.stringify(body);
}

function normalizeAiProviderError(error: unknown, config: AiProviderConfig) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new Error(`AI API timeout [${config.model}] after ${getProviderTimeoutMs(config)}ms`);
  }
  if (error instanceof Error) return error;
  return new Error(`AI API failed [${config.model}]`);
}

function isPaidFallbackProvider(config: AiProviderConfig) {
  return `${config.baseUrl} ${config.model}`.toLowerCase().includes('deepseek');
}

async function callSingleAiProvider(params: {
  config: AiProviderConfig;
  messages: ReturnType<typeof buildAiMessages>;
  liteMessages?: ReturnType<typeof buildLiteAiMessages>;
  maxTokens?: number;
  liteMaxTokens?: number;
  signal?: AbortSignal;
}) {
  const { config } = params;
  const url = getChatCompletionsUrl(config.baseUrl);
  const useLitePrompt = shouldUseLiteAiPrompt(config) && Boolean(params.liteMessages);
  const messages = useLitePrompt && params.liteMessages ? params.liteMessages : params.messages;
  const maxTokens = useLitePrompt
    ? params.liteMaxTokens ?? Math.min(params.maxTokens ?? 1600, 640)
    : params.maxTokens;
  const requestBody = buildAiRequestBody(config, messages, maxTokens);
  let providerLastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let shouldRetry = attempt === 0;
    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: getProviderRequestHeaders(config),
          body: requestBody,
          signal: params.signal,
        },
        getProviderTimeoutMs(config),
      );

      if (!response.ok) {
        const errorBody = await response.text();
        let providerMessage = response.statusText || '';
        shouldRetry = response.status === 429 || response.status >= 500;
        if (errorBody) {
          try {
            const parsed = JSON.parse(errorBody) as {
              error?: { message?: string; code?: string; type?: string };
              message?: string;
            };
            providerMessage =
              parsed.error?.message ||
              parsed.message ||
              parsed.error?.code ||
              parsed.error?.type ||
              providerMessage;
          } catch {
            providerMessage = errorBody.slice(0, 180) || providerMessage;
          }
        }
        throw new Error(
          providerMessage
            ? `AI API failed [${config.model}]: ${response.status} ${providerMessage}`
            : `AI API failed [${config.model}]: ${response.status}`,
        );
      }

      const data = await response.json();
      shouldRetry = false;
      return parseAiProviderResponse(data, config);
    } catch (error) {
      providerLastError = normalizeAiProviderError(error, config);
      if (providerLastError.message.includes('tokens_seen')) {
        shouldRetry = attempt === 0;
      }
      if (providerLastError.message.includes('timeout')) {
        shouldRetry = false;
      }
      if (shouldRetry && attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, AI_PROVIDER_RETRY_DELAY_MS));
      } else {
        break;
      }
    }
  }

  throw providerLastError || new Error(`AI API failed [${config.model}]`);
}

async function callAiApi(params: {
  configs: AiProviderConfig[];
  messages: ReturnType<typeof buildAiMessages>;
  liteMessages?: ReturnType<typeof buildLiteAiMessages>;
  maxTokens?: number;
  liteMaxTokens?: number;
}) {
  const providerErrors: string[] = [];
  const foregroundConfigs = params.configs.filter((config) => !isPaidFallbackProvider(config));
  const fallbackConfigs = params.configs.filter(isPaidFallbackProvider);

  if (foregroundConfigs.length > 0) {
    const controllers = foregroundConfigs.map(() => new AbortController());
    const foregroundErrors: string[] = [];
    let foregroundTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const foregroundProviderPromise = Promise.any(
      foregroundConfigs.map((config, index) =>
        callSingleAiProvider({ ...params, config, signal: controllers[index].signal })
          .catch((error) => {
            const message = error instanceof Error
              ? error.message.replace(/\s+/g, ' ').trim()
              : `AI API failed [${config.model}]`;
            foregroundErrors.push(message);
            throw error;
          }),
      ),
    );
    const foregroundTimeoutPromise = new Promise<never>((_, reject) => {
      const timeoutAt = (timeoutMs: number) => {
        foregroundTimeoutId = setTimeout(() => {
          const hasActiveTokenSignal = foregroundErrors.some((message) => message.includes('tokens_seen'));
          if (timeoutMs < AI_FREE_PROVIDER_ACTIVE_FOREGROUND_TIMEOUT_MS && hasActiveTokenSignal) {
            if (foregroundTimeoutId) clearTimeout(foregroundTimeoutId);
            timeoutAt(AI_FREE_PROVIDER_ACTIVE_FOREGROUND_TIMEOUT_MS);
            return;
          }

          controllers.forEach((controller) => controller.abort());
          const detail = foregroundErrors.length > 0 ? `; ${foregroundErrors.join(' | ')}` : '';
          reject(new Error(`AI free provider foreground timeout after ${timeoutMs}ms${detail}`));
        }, timeoutMs);
      };

      timeoutAt(AI_FREE_PROVIDER_FOREGROUND_TIMEOUT_MS);
    });
    try {
      const result = await Promise.race([foregroundProviderPromise, foregroundTimeoutPromise]);
      controllers.forEach((controller) => controller.abort());
      return result;
    } catch (error) {
      const errors = error instanceof AggregateError ? error.errors : [error];
      providerErrors.push(...errors.map((item) =>
        item instanceof Error ? item.message.replace(/\s+/g, ' ').trim() : 'AI API failed',
      ));
    } finally {
      if (foregroundTimeoutId) clearTimeout(foregroundTimeoutId);
      foregroundProviderPromise.catch(() => undefined);
      controllers.forEach((controller) => controller.abort());
    }
  }

  for (const config of fallbackConfigs) {
    try {
      return await callSingleAiProvider({ ...params, config });
    } catch (error) {
      providerErrors.push(
        error instanceof Error
          ? error.message.replace(/\s+/g, ' ').trim()
          : `AI API failed [${config.model}]`,
      );
    }
  }

  if (providerErrors.length > 1) {
    throw new Error(providerErrors.join(' | '));
  }
  throw new Error(providerErrors[0] || 'AI API failed');
}

function getAiFailureDetail(error: unknown) {
  if (!(error instanceof Error)) return 'AI service unavailable';
  const message = error.message.replace(/\s+/g, ' ').trim();
  if (message === 'AI returned no valid tour ids') {
    return 'AI 排序结果未能稳定映射到当前候选，已自动切回本地排序';
  }
  return message || 'AI service unavailable';
}

export async function requestAiRecommendations({
  conversationId,
  messages,
  candidateTours,
  activeFilters,
  searchQuery,
  aiConfig,
  preferenceMemory,
  previousResult,
  onProgress,
}: AiRecommendationRequest): Promise<AiRecommendationResult> {
  emitProgress(onProgress, {
    stage: 'queued',
    label: '已收到需求',
    detail: '正在整理你的出发时间、预算、天数和偏好。',
    progress: 12,
    substeps: withActiveSubstep(
      [
        { id: 'capture', label: '接收本次条件' },
        { id: 'normalize', label: '整理预算和天数' },
        { id: 'prepare', label: '准备进入需求理解' },
      ],
      'normalize',
    ),
  });

  await yieldToMain();

  const text = getLatestUserText(messages);
  const basePreferenceMemory = preferenceMemory ?? null;
  const baseEffectiveUserText = buildEffectiveUserText(text, basePreferenceMemory);
  const normalizedCandidateTours = candidateTours.map(normalizeCandidateTour);
  const candidatePool = filterPastOnlyCandidatesWhenFutureExists(normalizedCandidateTours);
  const memoryBackedIntent = mergeIntentWithMemory(null, basePreferenceMemory);
  let cachedMemoryBackedLocalItems: AiRecommendationItem[] | null = null;
  let cachedFallbackLocalItems: AiRecommendationItem[] | null = null;
  const getFallbackLocalItems = () => {
    if (!cachedFallbackLocalItems) {
      cachedFallbackLocalItems = padRecommendationItems(
        localRecommendations(candidatePool, baseEffectiveUserText),
        fallbackRecommendations(candidatePool),
      );
    }
    return cachedFallbackLocalItems;
  };
  const getMemoryBackedLocalItems = () => {
    if (!cachedMemoryBackedLocalItems) {
      const memoryIntentItems = buildIntentLocalRecommendations(candidatePool, memoryBackedIntent);
      cachedMemoryBackedLocalItems = padRecommendationItems(
        memoryIntentItems.length > 0
          ? memoryIntentItems
          : localRecommendations(candidatePool, baseEffectiveUserText),
        fallbackRecommendations(candidatePool),
      );
    }
    return cachedMemoryBackedLocalItems;
  };
  let runtimeFallbackItems: AiRecommendationItem[] = [];
  let runtimePreferenceMemory = basePreferenceMemory;
  const configs = getResolvedAiConfigs(aiConfig);
  const config = configs[0] || null;

  emitProgress(onProgress, {
    stage: config ? 'intent' : 'fallback',
    label: config ? '准备调用 AI' : '未配置 AI，改用本地候选补位',
    detail: config
      ? `将从 ${candidatePool.length} 条候选线路中理解需求并生成推荐。`
      : `正在按当前条件从 ${candidatePool.length} 条候选线路中做候选补位。`,
    progress: config ? 20 : 100,
    substeps: config
      ? withActiveSubstep(
          [
            { id: 'scope', label: '圈定候选范围' },
            { id: 'intent', label: '整理约束和偏好' },
            { id: 'handoff', label: '准备上下文补充' },
          ],
          'intent',
        )
      : withActiveSubstep(
          [
            { id: 'scope', label: '圈定候选范围' },
            { id: 'backup', label: '准备本地候选补位' },
            { id: 'fallback', label: '生成备用结果' },
          ],
          'backup',
        ),
  });

  if (candidatePool.length === 0) {
    return {
      conversationId,
      summary: '当前没有可交给 AI 判断的候选线路；请稍后刷新数据或换个说法再试。',
      items: [],
      generatedAt: new Date().toISOString(),
      source: 'local-preview',
      status: {
        mode: 'local-only',
        label: '没有完全匹配的候选',
        detail: '已停止 AI 调用，避免在无候选时继续产生调研成本。',
      },
      preferenceMemory: basePreferenceMemory ?? undefined,
    };
  }

  if (!config) {
    return {
      conversationId,
      summary: '当前未配置 AI 接口，已先返回本地候选补位结果。',
      items: getMemoryBackedLocalItems(),
      generatedAt: new Date().toISOString(),
      source: 'local-preview',
      status: {
        mode: 'local-only',
        label: '本次使用本地候选补位',
        detail: `因为没有可用的 AI 配置，已直接筛出 ${getFallbackLocalItems().length} 条候选线路。`,
      },
      preferenceMemory: basePreferenceMemory ?? undefined,
    };
  }

  try {
    const intent = buildHardIntentFromText(text);
    const memoryForThisTurn = shouldInheritPreferenceMemoryForTurn(text, intent, basePreferenceMemory)
      ? basePreferenceMemory
      : null;
    const allowPublicInterestForTurn = allowsPublicInterestForTurn(text, memoryForThisTurn);
    const nextPreferenceMemory = mergePreferenceMemory(memoryForThisTurn, intent);
    const effectiveIntent = mergeIntentWithMemory(intent, nextPreferenceMemory);
    const effectiveUserText = buildEffectiveUserText(text, nextPreferenceMemory);
    const availableCandidates = candidatePool;
    const localItems = buildIntentLocalRecommendations(availableCandidates, effectiveIntent);
    const strictLocalItems = localItems.length > 0
      ? localItems
      : localRecommendations(availableCandidates, effectiveUserText);
    const localItemsForMerge = padRecommendationItems(
      strictLocalItems,
      fallbackRecommendations(availableCandidates),
    );
    runtimeFallbackItems = localItemsForMerge;
    runtimePreferenceMemory = nextPreferenceMemory;
    const auditContext = buildRecommendationAuditContext(availableCandidates, previousResult, effectiveIntent);
    emitProgress(onProgress, {
      stage: 'context',
      label: '正在补充行程上下文',
      detail: `正在结合天气、季节和候选池信息，范围约 ${availableCandidates.length} 条线路。`,
      progress: 56,
      substeps: withActiveSubstep(
        [
          { id: 'weather', label: '补充天气信息' },
          { id: 'season', label: '结合季节与时令' },
          { id: 'candidate', label: '汇总候选池特征' },
        ],
        'season',
      ),
    });
    const useWeatherResearch = shouldUseWeatherResearch(effectiveUserText, effectiveIntent);
    const weatherContextForRanking = useWeatherResearch
      ? buildFastWeatherContext({
          text: effectiveUserText,
          messages,
          searchQuery,
          activeFilters,
          preferenceMemory: nextPreferenceMemory,
          tours: availableCandidates,
        })
      : buildNoWeatherContext();
    const weatherContextPromise = useWeatherResearch
      ? fetchWeatherContext({
          text: effectiveUserText,
          messages,
          searchQuery,
          activeFilters,
          preferenceMemory: nextPreferenceMemory,
          tours: availableCandidates,
        })
      : Promise.resolve(weatherContextForRanking);
    const routeAtlasPromise = Promise.resolve(buildRouteAtlas(availableCandidates));

    const aiCandidatePool = compactCandidates(
      availableCandidates,
      localItemsForMerge,
      effectiveIntent,
      {
        budgetPriority: effectiveIntent?.budgetPriority,
        intent: effectiveIntent,
        userText: effectiveUserText,
        weatherSensitivity: effectiveIntent?.weatherSensitivity,
        weatherContext: weatherContextForRanking,
      },
    );
    if (aiCandidatePool.length === 0) {
      return {
        conversationId,
        summary: '当前没有可交给 AI 排序的候选线路；建议先放宽页面筛选条件。',
        items: localItemsForMerge,
        generatedAt: new Date().toISOString(),
        source: 'local-preview',
        status: {
          mode: 'local-only',
          label: '没有可用候选',
          detail: '本次没有可交给 AI 排序的候选，已返回本地候选补位结果。',
        },
        preferenceMemory: nextPreferenceMemory,
      };
    }
    emitProgress(onProgress, {
      stage: 'ranking',
      label: '正在生成推荐结果',
      detail: `AI 正在对 ${aiCandidatePool.length} 条候选线路做排序和取舍。`,
      progress: 82,
      substeps: withActiveSubstep(
        [
          { id: 'compact', label: '筛出高相关候选' },
          { id: 'rank', label: '结合偏好做排序' },
          { id: 'summary', label: '准备推荐摘要' },
        ],
        'rank',
      ),
    });
    const aiResponse = await callAiApi({
      configs,
      messages: buildAiMessages({
        userText: effectiveUserText,
        messages,
        candidates: aiCandidatePool,
        routeAtlas: await routeAtlasPromise,
        auditContext,
        weatherContext: weatherContextForRanking,
        destinationWeatherInsights: [],
        searchQuery,
        intent: effectiveIntent,
        preferenceMemory: nextPreferenceMemory,
        allowPublicInterest: allowPublicInterestForTurn,
      }),
      liteMessages: buildLiteAiMessages({
        userText: effectiveUserText,
        messages,
        candidates: aiCandidatePool,
        weatherContext: weatherContextForRanking,
        searchQuery,
        intent: effectiveIntent,
        preferenceMemory: nextPreferenceMemory,
        allowPublicInterest: allowPublicInterestForTurn,
      }),
      maxTokens: 1600,
      liteMaxTokens: 1000,
    }) as { intent?: unknown; intentNotes?: unknown; summary?: unknown; items?: unknown };
    const semanticNotes = normalizeAiSemanticNotes(aiResponse.intentNotes);
    const normalizedAiIntent = sanitizeAiBudgetBoundsForTurn(
      normalizeIntent(aiResponse.intent),
      text,
    );
    const rankingIntent = normalizeBudgetPriorityByUserText(
      sanitizeAiIntentForTurn(normalizedAiIntent, {
        allowPublicInterest: allowPublicInterestForTurn,
      }),
      text,
    );
    const finalIntent = mergeIntentWithMemory(
      mergeAiRankingIntent(intent, rankingIntent),
      nextPreferenceMemory,
    );
    const finalPreferenceMemory = mergePreferenceMemory(memoryForThisTurn, finalIntent);
    const finalEffectiveUserText = buildEffectiveUserText(text, finalPreferenceMemory);
    const compactedCandidateIds = new Set(aiCandidatePool.map((candidate) => candidate.id));
    const compactedCandidateTours = availableCandidates.filter((candidate) => compactedCandidateIds.has(candidate.id));
    const compactedLocalItems = localItemsForMerge.filter((item) => compactedCandidateIds.has(item.tourId));
    const validatedAiItems = validateAiItems(aiResponse, compactedCandidateTours);
    if (validatedAiItems.length === 0 && Array.isArray(aiResponse.items)) {
      throw new Error('AI API unusable items_unmapped: returned tourIds did not match current candidates');
    }
    const aiItems = auditAiRecommendationsStrict(
      validatedAiItems,
      compactedLocalItems,
      compactedCandidateTours,
      finalIntent,
    );

    const rankedAiItems = aiItems.length > 0
      ? aiItems
      : compactedLocalItems.slice(0, MAX_AI_RANKED_ITEMS);

    const baseMergedItems = padRecommendationItems(
      mergeAiAndLocalRecommendations(rankedAiItems, compactedLocalItems),
      localItemsForMerge,
    );
    const mergedTourIds = new Set(baseMergedItems.map((item) => item.tourId));
    const mergedCandidateTours = availableCandidates.filter((candidate) => mergedTourIds.has(candidate.id));
    const topWeatherTourIds = new Set(baseMergedItems.slice(0, 8).map((item) => item.tourId));
    const destinationWeatherCandidates = useWeatherResearch
      ? buildDestinationWeatherCandidates(
          aiCandidatePool.filter((candidate) => topWeatherTourIds.has(candidate.id)),
          searchQuery,
          finalIntent,
        )
      : [];
    const [weatherContext, destinationWeatherInsights] = await Promise.all([
      weatherContextPromise,
      useWeatherResearch
        ? Promise.all(
            destinationWeatherCandidates.map((candidate) =>
              fetchDestinationWeatherInsight({
                destination: candidate.destination,
                travelDate: candidate.travelDate || weatherContextForRanking.travelDate,
                inferredFrom: ['候选目的地补充查询'],
                role: 'destination',
                queryReason: `该目的地天气和观赏期可能显著影响体验：${candidate.evidence.join(' / ')}`,
                corpus: candidate.corpus,
              }),
            ),
          )
        : Promise.resolve([] as DestinationWeatherInsight[]),
    ]);
    const mergedItems = prioritizeRecommendationItems(
      rewriteRecommendationCopy({
        items: attachWeatherGuidanceToItems(
          baseMergedItems,
          mergedCandidateTours,
          destinationWeatherInsights,
        ),
        candidateTours: mergedCandidateTours,
        destinationWeatherInsights,
        intent: finalIntent,
        weatherContext,
        userText: text,
        allowPublicInterest: allowPublicInterestForTurn,
      }),
    );
    emitProgress(onProgress, {
      stage: 'completed',
      label: '推荐结果已生成',
      detail: `已完成排序，给出 ${countCommentaryItems(mergedItems)} 条建议，并展示 ${mergedItems.length} 条匹配线路。`,
      progress: 100,
      substeps: withActiveSubstep(
        [
          { id: 'ranked', label: '排序结果已完成' },
          { id: 'top', label: '置顶建议线路' },
          { id: 'ready', label: '返回推荐摘要' },
        ],
        'ready',
      ),
    });

    return {
      conversationId,
      summary: finalizeRecommendationSummary({
        aiSummary: typeof aiResponse.summary === 'string' ? aiResponse.summary : '',
        items: mergedItems,
        candidateTours: mergedCandidateTours,
        weatherContext,
        destinationWeatherInsights,
        intent: finalIntent,
        semanticNotes,
        userText: finalEffectiveUserText,
        allowPublicInterest: allowPublicInterestForTurn,
      }),
      items: mergedItems,
      generatedAt: new Date().toISOString(),
      source: 'ai-api',
      status: {
        mode: 'ai',
        label: 'AI 已完成推荐',
        detail: aiItems.length > 0
          ? `已结合需求理解、天气和候选排序，给出 ${countCommentaryItems(mergedItems)} 条建议，并展示 ${mergedItems.length} 条匹配结果。`
          : `AI 已完成需求理解，但排序结果未稳定映射到候选，已自动改用本地排序并展示 ${mergedItems.length} 条匹配结果。`,
      },
      preferenceMemory: finalPreferenceMemory,
      ...(semanticNotes ? { semanticNotes } : {}),
    };
  } catch (error) {
    const failureDetail = getAiFailureDetail(error);
    const fallbackItems = runtimeFallbackItems.length > 0 ? runtimeFallbackItems : getMemoryBackedLocalItems();
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('[ai-recommendation] fallback to local recommendations:', failureDetail);
    }
    emitProgress(onProgress, {
      stage: 'fallback',
      label: 'AI 暂不可用，已切换备用方案',
      detail: `正在从 ${candidatePool.length} 条候选线路里给出本地补位结果。`,
      progress: 100,
      substeps: withActiveSubstep(
        [
          { id: 'detect', label: '检测 AI 不可用' },
          { id: 'rules', label: '切换本地补位' },
          { id: 'return', label: '返回备用推荐' },
        ],
        'return',
      ),
    });

    return {
      conversationId,
      summary: 'AI 接口暂时不可用，已先返回本地候选补位结果。',
      items: fallbackItems,
      generatedAt: new Date().toISOString(),
      source: 'local-preview',
      status: {
        mode: 'fallback',
        label: 'AI 未完成，本次已降级到本地推荐',
        detail: `为了不中断结果展示，已先返回 ${fallbackItems.length} 条本地候选补位结果。${failureDetail ? ` (${failureDetail})` : ''}`,
      },
      preferenceMemory: runtimePreferenceMemory ?? undefined,
    };
  }
}
