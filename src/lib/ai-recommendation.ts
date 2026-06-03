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
  AiWeatherContext,
  FilterState,
} from '@/types/tour';

const AI_CONFIG_STORAGE_KEY = 'travel-ai-provider-config';
const MAX_AI_CANDIDATES = 18;
const MAX_AI_COMMENTARY_ITEMS = 8;
const MAX_AI_OUTPUT_ITEMS = 12;
const MAX_DESTINATION_WEATHER_INSIGHTS = 8;
const ROUTE_ATLAS_MAX_GROUPS = 8;
const ROUTE_ATLAS_MAX_EXAMPLES = 2;
const MAX_RECENT_CONVERSATION_MESSAGES = 4;
const AVOID_EXPRESSION_PATTERN = /(不要|不想|不喜欢|不爱|别|避开|排除|不推荐|不要推荐|不考虑|拒绝|讨厌|受不了|不接受)/;
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
  departureWeekdays?: number[];
  departureTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night' | 'any' | null;
  destinationHints?: string[];
  budgetMax?: number | null;
  budgetMin?: number | null;
  travelStyle?: string[];
  mustHave?: string[];
  avoid?: string[];
  weatherSensitivity?: string[];
  budgetPriority?: 'low' | 'balanced' | 'premium' | null;
  refinementMode?: 'new_search' | 'refine_previous' | 'broaden' | 'replace_destination' | null;
  confidence?: number;
}

interface RecommendationContext {
  budgetPriority?: AiTravelIntent['budgetPriority'];
  weatherSensitivity?: string[];
  weatherContext?: AiWeatherContext;
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
  priceContext: {
    poolPercentile: number | null;
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
const routeAtlasCache = new WeakMap<AiRecommendationCandidate[], Map<string, RouteAtlas>>();
const weatherSnapshotCache = new Map<string, Promise<{
  forecastSummary: string;
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

function getLatestUserText(messages: AiRecommendationMessage[]) {
  return messages
    .filter((message) => message.role === 'user')
    .at(-1)?.content ?? '';
}

function parseBudget(text: string) {
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

function scoreTour(tour: AiRecommendationCandidate, text: string): AiRecommendationItem | null {
  const corpus = getSearchCorpus(tour);
  const destinationHints = collectDestinationHints(text);
  const avoidHints = collectAvoidHints(text);
  if (avoidHints.some((hint) => corpus.includes(normalizeText(hint)))) {
    return null;
  }

  const themeHints = collectThemeHints(text).filter((hint) => !avoidHints.includes(hint));
  const budget = parseBudget(text);
  const duration = parseDuration(text);
  const signals: string[] = [];
  let score = 0;

  for (const hint of destinationHints) {
    if (destinationHintsMatchCorpus([hint], `${tour.destination} ${tour.title} ${corpus}`)) {
      score += 18;
      signals.push(`目的地匹配：${hint}`);
      break;
    }
  }

  for (const hint of themeHints) {
    if (corpus.includes(normalizeText(hint))) {
      score += 10;
      signals.push(`偏好匹配：${hint}`);
    }
  }

  if (budget) {
    if (tour.price >= budget.min && tour.price <= budget.max) {
      score += 12;
      signals.push(`预算接近：￥${tour.price.toLocaleString()}`);
    } else if (Number.isFinite(budget.max) && tour.price <= budget.max * 1.25) {
      score += 5;
      signals.push('价格略高但仍可比较');
    }
  }

  if (duration && tour.duration >= duration.min && tour.duration <= duration.max) {
    score += 10;
    signals.push(`天数合适：${tour.duration}天`);
  }

  if (text.includes('轻松') || text.includes('休闲') || text.includes('老人')) {
    if (tour.leisureLevel === 'easy') {
      score += 10;
      signals.push('行程强度较轻');
    } else if (tour.leisureLevel === 'hard') {
      score -= 8;
    }
  }

  if (text.includes('近期') || text.includes('马上') || text.includes('本周')) {
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
            tour.isHot ? ['热门线路'] : ['价格和热度表现较稳'],
            tour.isHot ? '热门线路，适合作为推荐备选' : '综合热度和价格表现较稳',
          )
        : undefined,
      matchedSignals: tour.isHot ? ['热门线路'] : ['综合排序靠前'],
    }));
}

function localRecommendations(tours: AiRecommendationCandidate[], text: string) {
  const normalizedText = normalizeText(text);
  const items = tours
    .map((tour) => scoreTour(tour, normalizedText))
    .filter((item): item is AiRecommendationItem => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({
      ...item,
      reason: index < MAX_AI_COMMENTARY_ITEMS ? item.reason : undefined,
    }));

  return items.length > 0 ? items : fallbackRecommendations(tours);
}

function inferLocalIntent(text: string): AiTravelIntent | null {
  const budget = parseBudget(text);
  const duration = parseDuration(text);
  const destinationHints = collectDestinationHints(text);
  const avoid = collectAvoidHints(text);
  const travelStyle = collectThemeHints(text).filter((hint) => !avoid.includes(hint));
  const mustHave = ['游泳', '泳池', '浮潜', '潜水', '浆板', '桨板', 'sup', 'SUP']
    .filter((keyword) => text.includes(keyword));
  const weatherSensitivity = [
    text.includes('怕热') || text.includes('太热') || text.includes('闷热') || text.includes('大夏天') ? '怕热' : '',
    text.includes('下雨') || text.includes('暴雨') || text.includes('台风') ? '避雨' : '',
    /(天气|气温|温度|预报|未来天气)/.test(text) ? '关注天气' : '',
  ].filter(Boolean);
  const budgetPriority: AiTravelIntent['budgetPriority'] =
    /(便宜|低价|性价比|省钱|更低|预算有限)/.test(text) || Boolean(budget?.max)
      ? 'low'
      : /(贵一点|舒服|舒适|高端|品质)/.test(text)
        ? 'premium'
        : null;
  const refinementMode: AiTravelIntent['refinementMode'] =
    /(不要|不想|别|避开|排除|不推荐|不考虑|便宜点|再便宜|更多|换)/.test(text)
      ? 'refine_previous'
      : null;

  if (
    !budget &&
    !duration &&
    destinationHints.length === 0 &&
    travelStyle.length === 0 &&
    mustHave.length === 0 &&
    avoid.length === 0 &&
    weatherSensitivity.length === 0 &&
    !budgetPriority &&
    !refinementMode
  ) {
    return null;
  }

  return {
    budgetMin: budget?.min ?? null,
    budgetMax: budget?.max ?? null,
    tripDaysMin: duration?.min ?? null,
    tripDaysMax: duration?.max ?? null,
    destinationHints,
    travelStyle,
    mustHave,
    avoid,
    weatherSensitivity,
    budgetPriority,
    refinementMode,
  };
}

function buildLocalRecommendationText(
  userText: string,
  preferenceMemory: AiPreferenceMemory | null | undefined,
) {
  const memoryTerms = [
    ...(preferenceMemory?.destinationHints || []),
    ...(preferenceMemory?.travelStyle || []),
    ...(preferenceMemory?.mustHave || []),
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
  const seenTourIds = new Set<string>();
  const merged: AiRecommendationItem[] = [];

  for (const item of [...aiItems, ...localItems]) {
    if (seenTourIds.has(item.tourId)) continue;
    seenTourIds.add(item.tourId);
    merged.push(item);
  }

  return limitRecommendationCommentary(merged).slice(0, MAX_AI_OUTPUT_ITEMS);
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
    avoid: mergedAvoid.slice(-16),
    weatherSensitivity: uniqueStrings([
      ...(previous?.weatherSensitivity || []),
      ...(intent?.weatherSensitivity || []),
    ]).slice(-12),
    budgetMin: intent?.budgetMin ?? previous?.budgetMin ?? null,
    budgetMax: intent?.budgetMax ?? previous?.budgetMax ?? null,
    budgetPriority: intent?.budgetPriority ?? previous?.budgetPriority ?? null,
    tripDays: intent?.tripDays ?? previous?.tripDays ?? null,
    tripDaysMin: intent?.tripDaysMin ?? previous?.tripDaysMin ?? null,
    tripDaysMax: intent?.tripDaysMax ?? previous?.tripDaysMax ?? null,
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

  if (lodgingOnly) return ['非跟团产品'];

  if (/温泉|泡汤|汤泉|热泉|铁泉|御泉|颐和|银盏|聚龙湾|云天海|雅泡|带池|私汤|依泉楼|spa/i.test(corpus)) categories.push('温泉泡汤');
  if (/漂流|溯溪|桨板|浆板|sup|水上乐园|水世界|冲浪|游泳|泳池|嬉水|亲水|山泉水泳道/.test(corpus)) {
    categories.push('玩水清凉');
  }
  if (/海边|海滩|沙滩|海景|海岛|双月湾|巽寮湾|沙扒湾|盐洲岛|南澳岛|海陵岛|上下川|放鸡岛|湾区|游艇/.test(corpus)) {
    categories.push('海边沙滩');
  }
  if (/森林|氧吧|瀑布|峡谷|溶洞|山水|山泉|湿地|绿道|星湖|丹霞|九瀑|云门山|白水寨|古龙峡|黄腾峡|三百山|天露山|紫云谷|姑婆山/.test(corpus)) {
    categories.push('森林山水');
  }
  if (/博物馆|古城|古镇|水乡|碉楼|祠|寺|学村|文化|非遗|骑楼|南风古灶|潮州|开平/.test(corpus)) {
    categories.push('文化逛城');
  }
  if (/美食|早茶|牛肉|海鲜|火锅|顺德|潮汕|乳鸽|烧鹅|茶点|寻味/.test(corpus)) {
    categories.push('美食体验');
  }
  if (/冰世界|冰雪世界|室内|度假村|别墅|庄园|亲子|乐园|泳池/.test(corpus)) {
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

function isDominantHotSpringCandidate(primitive: RecommendationPrimitive) {
  if (!primitive.experienceCategories.includes('温泉泡汤')) return false;
  return !primitive.experienceCategories.some((category) =>
    ['玩水清凉', '森林山水', '文化逛城', '海边沙滩'].includes(category),
  );
}

function isWeatherSensitiveHotSpringCandidate(primitive: RecommendationPrimitive) {
  return primitive.experienceCategories.includes('温泉泡汤');
}

function extractSeasonalComfortAtoms(tour: AiRecommendationCandidate) {
  const corpus = [
    tour.title,
    ...(tour.highlights || []).filter((highlight) => !SEMANTIC_ATOM_STOPWORDS.has(highlight)),
  ].filter(Boolean).join(' ').toLowerCase();
  const atoms: string[] = [];

  if (/冰|水上|水世界|漂流|嬉水|亲水|沙滩|海边|游泳|泳池/.test(corpus)) {
    atoms.push('夏季友好：玩水或清凉体验');
  }
  if (/森林|氧吧|山泉|瀑布|溶洞|峡谷|湿地|绿道|星湖|丹霞|九瀑|云门山|白水寨|古龙峡|黄腾峡|三百山|天露山|紫云谷|姑婆山/.test(corpus)) {
    atoms.push('夏季友好：森林山水遮阴');
  }
  if (/博物馆|室内|冰世界|冰雪世界/.test(corpus)) {
    atoms.push('夏季友好：室内或避暑点');
  }
  if (/温泉|泡汤|汤泉|热泉|铁泉|御泉|颐和|银盏|聚龙湾|云天海|雅泡|带池|私汤|依泉楼|spa/i.test(corpus)) {
    atoms.push('高温天气需取舍：温泉泡汤');
  }
  if (/徒步|爬山|登山|暴走/.test(corpus)) {
    atoms.push('高温天气需取舍：户外强度');
  }
  if (/徒步|登山|爬山|穿越|峡谷|瀑布|溯溪|漂流|山峰|古龙峡|黄腾峡|白水寨|紫云谷|天露山|云门山|姑婆山|三百山/.test(corpus)) {
    atoms.push('雨天需取舍：山水户外或涉水风险');
  }
  if (/海边|海滩|沙滩|海景|海岛|双月湾|巽寮湾|沙扒湾|盐洲岛|南澳岛|海陵岛/.test(corpus)) {
    atoms.push('天气敏感：海边晴雨和风浪');
  }

  return uniqueStrings(atoms).slice(0, 3);
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
  const dates = getDepartureDates(tour);
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

function buildRouteAtlas(tours: AiRecommendationCandidate[], intent: AiTravelIntent | null): RouteAtlas {
  const intentCacheKey = JSON.stringify({
    destinationHints: intent?.destinationHints || [],
    travelStyle: intent?.travelStyle || [],
    mustHave: intent?.mustHave || [],
  });
  const atlasCacheByIntent = routeAtlasCache.get(tours);
  const cached = atlasCacheByIntent?.get(intentCacheKey);
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
    relevance: number;
  }>();
  const intentText = [
    ...(intent?.destinationHints || []),
    ...(intent?.travelStyle || []),
    ...(intent?.mustHave || []),
  ].join(' ').toLowerCase();

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
      relevance: 0,
    };
    const corpus = getSearchCorpus(tour);

    group.count += 1;
    group.prices.push(tour.price);
    group.days.push(tour.duration);
    group.relevance +=
      (intent?.destinationHints?.length && destinationHintsMatchCorpus(intent.destinationHints, `${tour.destination} ${tour.title}`) ? 30 : 0) +
      (intentText && corpus.includes(intentText) ? 10 : 0) +
      (tour.isHot ? 3 : 0) +
      Math.max(0, 8 - Math.min(tour.price / 1000, 8));

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
    .sort((a, b) => b.relevance - a.relevance || b.count - a.count)
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
  nextCache.set(intentCacheKey, atlas);
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
      '用户明确说不要或避开某主题时，该主题是硬排除条件。',
      '低价、班期多和热门只能排序加权，不能覆盖预算、时间、目的地和避开条件。',
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
    const destinationCorpus = `${primitive.destination} ${primitive.title}`;
    if (!destinationHintsMatchCorpus(intent.destinationHints, destinationCorpus)) {
      reasons.push(`目的地不匹配：${intent.destinationHints.join('/')}`);
    }
  }

  const avoidMatches = primitiveMatchesAvoid(primitive, intent.avoid);
  if (avoidMatches.length > 0) {
    reasons.push(`命中需避开条件：${avoidMatches.join('/')}`);
  }

  return reasons;
}

function primitiveMatchesDestination(intent: AiTravelIntent | null, primitive: RecommendationPrimitive) {
  if (!intent?.destinationHints?.length) return true;
  return destinationHintsMatchCorpus(intent.destinationHints, `${primitive.destination} ${primitive.title}`);
}

function isHotRainyRecommendationContext(context?: RecommendationContext) {
  const weatherText = [
    ...(context?.weatherSensitivity || []),
    context?.weatherContext?.forecastSummary,
    context?.weatherContext?.seasonAdvice,
  ].filter(Boolean).join(' ');
  const travelMonth = context?.weatherContext?.travelDate
    ? new Date(context.weatherContext.travelDate).getMonth() + 1
    : new Date().getMonth() + 1;

  return (
    /(怕热|避雨|关注天气|天气|高温|闷热|暴雨|降雨|多雨|台风|夏季|华南)/.test(weatherText) ||
    [6, 7, 8, 9].includes(travelMonth)
  );
}

function isRainyRecommendationContext(context?: RecommendationContext) {
  const weatherText = [
    ...(context?.weatherSensitivity || []),
    context?.weatherContext?.forecastSummary,
    context?.weatherContext?.seasonAdvice,
  ].filter(Boolean).join(' ');

  return /(避雨|下雨|阵雨|降雨|多雨|暴雨|雷暴|台风|风浪|涨水)/.test(weatherText);
}

function isRainRiskPrimitive(primitive: RecommendationPrimitive) {
  const corpus = [
    primitive.title,
    ...primitive.semanticAtoms,
    ...primitive.experienceCategories,
    ...primitive.seasonalComfortAtoms,
  ].join(' ');

  return /(徒步|登山|爬山|穿越|峡谷|瀑布|溯溪|漂流|山峰|古龙峡|黄腾峡|白水寨|紫云谷|天露山|云门山|姑婆山|三百山)/.test(corpus);
}

function getWeatherSuitabilityScore(primitive: RecommendationPrimitive, context?: RecommendationContext) {
  if (!isHotRainyRecommendationContext(context)) return 0;

  const categories = new Set(primitive.experienceCategories);
  const rainyContext = isRainyRecommendationContext(context);
  let score = 0;

  if (categories.has('非跟团产品')) score -= 160;
  if (categories.has('玩水清凉')) score += 82;
  if (categories.has('森林山水')) score += 58;
  if (categories.has('室内度假') || categories.has('文化逛城')) score += 44;
  if (categories.has('海边沙滩')) score += 36;
  if (categories.has('美食体验')) score += 8;
  if (categories.has('温泉泡汤')) {
    score -= isDominantHotSpringCandidate(primitive) ? 96 : 62;
  }
  if (categories.has('户外强度')) score -= 36;
  if (rainyContext) {
    if (categories.has('室内度假') || categories.has('文化逛城')) score += 42;
    if (categories.has('美食体验')) score += 24;
    if (categories.has('海边沙滩')) score -= 24;
    if (categories.has('森林山水') && !categories.has('室内度假') && !categories.has('文化逛城')) score -= 28;
    if (isRainRiskPrimitive(primitive)) score -= 140;
  }

  return score;
}

function rankPrimitive(
  primitive: RecommendationPrimitive,
  localItems: AiRecommendationItem[],
  context?: RecommendationContext,
) {
  const localRank = localItems.findIndex((item) => item.tourId === primitive.id);
  const localRankBoost = localRank >= 0
    ? Math.max(0, (isHotRainyRecommendationContext(context) ? 120 : 200) - localRank * 6)
    : 0;
  const pricePenalty = context?.budgetPriority === 'low'
    ? Math.min(primitive.price / 250, 80)
    : context?.budgetPriority === 'premium'
      ? Math.max(0, 12 - Math.min(primitive.price / 1000, 12))
      : Math.min(primitive.price / 1000, 12);

  return (
    localRankBoost +
    (primitive.isHot ? 16 : 0) +
    Math.min(primitive.schedule.departureDates.length, 6) * 3 +
    (primitive.schedule.hasRecurringScheduleText ? 5 : 0) +
    getWeatherSuitabilityScore(primitive, context) +
    (isLikelyAiNonTour(primitive) ? -180 : 0) +
    (primitive.rating || 0) * 2 -
    pricePenalty
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

function hasEnoughReasonSpecificity(reason: string) {
  const hasPrice = /(?:￥\s*)?\d{2,5}\s*元|预算|价格/.test(reason);
  const hasWeatherTradeoff = /(天气|高温|闷热|下雨|阵雨|多雨|避雨|避暑|清凉|风浪|夏季|取舍|室内|暴晒|雷暴)/.test(reason);
  const hasExperienceAction = /(看点|亮点|体验|入住|含|玩|游|逛|吃|赏|泳池|海景房|博物馆|美食|沙滩|浮潜|桨板)/.test(reason);

  return [hasPrice, hasWeatherTradeoff, hasExperienceAction].filter(Boolean).length >= 2;
}

function getPrimitiveTitleFact(primitive: RecommendationPrimitive) {
  return normalizeSemanticAtom(primitive.title)
    .replace(/^\d+/, '')
    .slice(0, 14) || primitive.destination || primitive.theme || '这条线路';
}

function getPrimitiveWeatherAppeal(primitive: RecommendationPrimitive) {
  const categories = new Set(primitive.experienceCategories);
  if (categories.has('温泉泡汤') && categories.has('玩水清凉')) return '有玩水清凉点，但高温泡汤要取舍';
  if (categories.has('玩水清凉') && categories.has('海边沙滩')) return '有玩水和海边夏天感，但要看晴雨和风浪';
  if (categories.has('玩水清凉')) return '有玩水清凉点，夏季体感更对题';
  if (categories.has('森林山水')) return '有森林山水遮阴，比纯室外暴晒稳';
  if (categories.has('文化逛城') || categories.has('室内度假')) return '室内外搭配更适合闷热或阵雨天';
  if (categories.has('海边沙滩')) return '海边玩法更有夏天感，但要看晴雨和风浪';
  if (categories.has('温泉泡汤')) return '高温天气泡汤要取舍，适合作低价酒店型备选';
  if (categories.has('美食体验')) return '美食和短途节奏轻，受天气影响相对小';
  return primitive.seasonalComfortAtoms[0] || '按预算和班期可作为备选';
}

function getPrimitiveComfortNote(primitive: RecommendationPrimitive) {
  return primitive.seasonalComfortAtoms.find((atom) => /雨天需取舍|高温天气需取舍|天气敏感/.test(atom)) ||
    primitive.seasonalComfortAtoms[0] ||
    '';
}

function buildPrimitiveConcreteReason(primitive: RecommendationPrimitive) {
  const atoms = getPrimitiveExperienceAtoms(primitive, 2)
    .filter((atom) => atom !== '综合')
    .filter((atom) => !primitive.experienceCategories.includes(atom));
  const titleFact = getPrimitiveTitleFact(primitive);
  const categoryText = primitive.experienceCategories.slice(0, 2).join('、');
  const priceText = Number.isFinite(primitive.price) && primitive.price > 0
    ? `，${primitive.price.toLocaleString()}元`
    : '';
  const factText = atoms.length > 0
    ? `${atoms.join('、')}${priceText}`
    : categoryText
      ? `${titleFact}${priceText}，偏${categoryText}`
      : `${titleFact}${priceText}，${primitive.theme || '短途线路'}`;
  const comfortText = getPrimitiveComfortNote(primitive);

  return `${factText}；${getPrimitiveWeatherAppeal(primitive)}${comfortText ? `（${comfortText}）` : ''}`;
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

function getConcreteAiReason(reason: unknown, primitive: RecommendationPrimitive | undefined) {
  const trimmed = typeof reason === 'string' ? reason.trim() : '';
  if (!primitive) return trimmed || '综合用户需求、天气和线路特点后较为合适';
  if (
    trimmed &&
    reasonMentionsCandidateFact(trimmed, primitive) &&
    !isGenericReason(trimmed) &&
    hasEnoughReasonSpecificity(trimmed)
  ) {
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

function annotateCandidatePrimitive(
  primitive: RecommendationPrimitive,
  intent: AiTravelIntent | null,
  sortedPrices: number[],
  matchStatus: CandidateAuditPrimitive['matchStatus'],
) {
  return {
    ...primitive,
    matchStatus,
    routeGroup: getDiversityGroupKey(primitive),
    conflictReasons: getPrimitiveConflictReasons(intent, primitive),
    priceContext: {
      poolPercentile: getPricePercentile(primitive.price, sortedPrices),
      pricePerDay: primitive.tripDays > 0 ? Math.round(primitive.price / primitive.tripDays) : null,
    },
  } satisfies CandidateAuditPrimitive;
}

function limitWeatherSensitiveCandidateMix(
  candidates: CandidateAuditPrimitive[],
  context?: RecommendationContext,
) {
  if (!isHotRainyRecommendationContext(context)) return candidates;

  const maxHotSpringItems = Math.max(1, Math.min(2, Math.ceil(candidates.length * 0.12)));
  let hotSpringCount = 0;
  const maxRainRiskItems = isRainyRecommendationContext(context) ? 0 : Number.POSITIVE_INFINITY;
  const hasNonHotSpring = candidates.some((candidate) => !isWeatherSensitiveHotSpringCandidate(candidate));
  const hasNonRainRisk = candidates.some((candidate) => !isRainRiskPrimitive(candidate));
  let rainRiskCount = 0;

  return candidates.filter((candidate) => {
    if (hasNonRainRisk && isRainRiskPrimitive(candidate)) {
      rainRiskCount += 1;
      if (rainRiskCount > maxRainRiskItems) return false;
    }
    if (!hasNonHotSpring || !isWeatherSensitiveHotSpringCandidate(candidate)) return true;
    hotSpringCount += 1;
    return hotSpringCount <= maxHotSpringItems;
  });
}

function readStoredAiConfig(): StoredAiProviderConfig {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(window.localStorage.getItem(AI_CONFIG_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function decodeDefaultApiKey(encoded: string | undefined) {
  if (!encoded) return '';

  try {
    return typeof window !== 'undefined' && typeof window.atob === 'function'
      ? window.atob(encoded)
      : '';
  } catch {
    return '';
  }
}

function getDefaultApiKey() {
  return decodeDefaultApiKey(import.meta.env.VITE_AI_DEFAULT_API_KEY_B64) || import.meta.env.VITE_AI_DEFAULT_API_KEY || '';
}

export function getAiProviderConfig(): StoredAiProviderConfig {
  const stored = readStoredAiConfig();
  return {
    apiKey: stored.apiKey || getDefaultApiKey(),
    baseUrl: stored.baseUrl || import.meta.env.VITE_AI_DEFAULT_BASE_URL || '',
    model: stored.model || import.meta.env.VITE_AI_DEFAULT_MODEL || '',
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

  window.localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(cleaned));
}

export function clearAiProviderConfig() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AI_CONFIG_STORAGE_KEY);
}

function getResolvedAiConfig(override?: Partial<AiProviderConfig>): AiProviderConfig | null {
  const stored = readStoredAiConfig();
  const config = {
    apiKey:
      override?.apiKey ||
      stored.apiKey ||
      getDefaultApiKey() ||
      '',
    baseUrl:
      override?.baseUrl ||
      stored.baseUrl ||
      import.meta.env.VITE_AI_DEFAULT_BASE_URL ||
      '',
    model:
      override?.model ||
      stored.model ||
      import.meta.env.VITE_AI_DEFAULT_MODEL ||
      '',
  };

  if (!config.apiKey || !config.baseUrl || !config.model) return null;
  return config;
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
  const primitives = intent?.avoid?.length
    ? eligiblePrimitives.filter((primitive) => primitiveMatchesAvoid(primitive, intent.avoid).length === 0)
    : eligiblePrimitives;
  const sortedPrices = primitives
    .map((primitive) => primitive.price)
    .filter((price) => Number.isFinite(price) && price > 0)
    .sort((a, b) => a - b);
  const hasDestinationIntent = Boolean(intent?.destinationHints?.length);
  const destinationMatches = hasDestinationIntent
    ? primitives.filter((primitive) => primitiveMatchesDestination(intent, primitive))
    : primitives;
  const strictMatches = destinationMatches.filter((primitive) => intentMatchesPrimitive(intent, primitive));
  const strictLimit = strictMatches.length > 0
    ? Math.max(18, MAX_AI_CANDIDATES - 12)
    : 0;
  const diverseStrictMatches = selectDiversePrimitives(
    strictMatches,
    Math.min(strictLimit, MAX_AI_CANDIDATES),
    localItems,
    context,
  );
  const softConflicts = (hasDestinationIntent && destinationMatches.length > 0
    ? destinationMatches.filter((primitive) => !strictMatches.some((match) => match.id === primitive.id))
    : primitives.filter((primitive) => !strictMatches.some((match) => match.id === primitive.id)))
    .sort((a, b) => rankPrimitive(b, localItems, context) - rankPrimitive(a, localItems, context));
  const softLimit = Math.max(6, Math.floor(MAX_AI_CANDIDATES * 0.18));
  const diverseSoftConflicts = selectDiversePrimitives(
    softConflicts,
    softLimit,
    localItems,
    context,
  );
  const fallbackPool = primitives
    .filter((primitive) =>
      !strictMatches.some((match) => match.id === primitive.id) &&
      !diverseSoftConflicts.some((match) => match.id === primitive.id),
    )
    .sort((a, b) => rankPrimitive(b, localItems, context) - rankPrimitive(a, localItems, context));
  const fallbackLimit = Math.max(4, MAX_AI_CANDIDATES - diverseStrictMatches.length - diverseSoftConflicts.length);
  const diverseFallbackPool = selectDiversePrimitives(
    fallbackPool,
    fallbackLimit,
    localItems,
    context,
  );

  const annotatedCandidates = [
    ...diverseStrictMatches
      .map((primitive) => annotateCandidatePrimitive(primitive, intent, sortedPrices, 'match')),
    ...diverseSoftConflicts.map((primitive) => annotateCandidatePrimitive(primitive, intent, sortedPrices, 'soft_conflict')),
    ...diverseFallbackPool.map((primitive) => annotateCandidatePrimitive(primitive, intent, sortedPrices, 'fallback')),
  ]
    .slice(0, MAX_AI_CANDIDATES);

  return limitWeatherSensitiveCandidateMix(annotatedCandidates, context);
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

function isThinRecommendationSummary(summary: string) {
  const normalized = summary.replace(/\s+/g, '');
  if (!normalized) return true;
  if (normalized.length < 36) return true;

  return /(综合.*推荐|按.*条件.*筛|结合.*需求.*天气.*排序|输出\d+条结果|优先推荐.*线路|生成推荐)/.test(normalized)
    && normalized.length < 90;
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

  const lines = topPrimitives.map((primitive) => {
    const atoms = getPrimitiveExperienceAtoms(primitive, 1).filter((atom) => atom !== '综合');
    const feature = atoms[0] || primitive.theme || primitive.experienceCategories[0] || '';
    return feature && !primitive.destination.includes(feature)
      ? `${primitive.destination}的${feature}`
      : primitive.destination || feature;
  });

  return uniqueStrings(lines).slice(0, 3).join('、');
}

function buildRecommendationSummary(params: {
  items: AiRecommendationItem[];
  candidateTours: AiRecommendationCandidate[];
  weatherContext: AiWeatherContext;
  destinationWeatherInsights: DestinationWeatherInsight[];
  intent: AiTravelIntent | null;
}) {
  const topDestinations = buildSummaryTopDestinations(params.items, params.candidateTours);
  const topLine = topDestinations
    ? `这次更适合优先看${topDestinations}这类线路。`
    : '这次会优先保留更稳妥、适配当前条件的线路。';
  const weatherLead = params.weatherContext.forecastSummary
    ? `天气上看，${params.weatherContext.forecastSummary.replace(/[。；]+$/u, '')}。`
    : '';
  const cautionPool = uniqueStrings([
    ...(params.weatherContext.seasonAdvice || []),
    ...params.destinationWeatherInsights.flatMap((insight) => [
      insight.bestSeasonNote || '',
      ...(insight.seasonAdvice || []),
    ]),
  ]);
  const cautionLine = cautionPool.find((text) => /(台风|暴雨|强降雨|高温|闷热|风浪|花期|雨季|观赏期|取舍)/.test(text))
    || cautionPool[0]
    || '';
  const preferenceBits = uniqueStrings([
    params.intent?.budgetMax ? `${params.intent.budgetMax}元以内预算` : '',
    params.intent?.weatherSensitivity?.includes('怕热') ? '怕热' : '',
    params.intent?.weatherSensitivity?.includes('避雨') ? '避雨' : '',
    params.intent?.travelStyle?.slice(0, 1)[0] || '',
  ]).slice(0, 3);
  const tradeoffLine = preferenceBits.length > 0
    ? `排序时我会优先照顾${preferenceBits.join('、')}，把天气更敏感或体验波动更大的线路往后放。`
    : '';

  return [topLine, weatherLead, cautionLine, tradeoffLine]
    .filter(Boolean)
    .join('');
}

function finalizeRecommendationSummary(params: {
  aiSummary: string;
  items: AiRecommendationItem[];
  candidateTours: AiRecommendationCandidate[];
  weatherContext: AiWeatherContext;
  destinationWeatherInsights: DestinationWeatherInsight[];
  intent: AiTravelIntent | null;
}) {
  const aiSummary = params.aiSummary.trim();
  const fallbackSummary = buildRecommendationSummary(params);
  if (!aiSummary) return fallbackSummary;
  if (isThinRecommendationSummary(aiSummary)) return fallbackSummary;

  const hasRiskContext = /(天气|高温|闷热|下雨|暴雨|台风|风浪|雨季|花期|观赏期|注意|风险)/.test(aiSummary);
  if (hasRiskContext || !fallbackSummary) return aiSummary;

  const fallbackTail = fallbackSummary.replace(/^.*?。/u, '');
  return fallbackTail ? `${aiSummary}${fallbackTail}` : aiSummary;
}

function parseDateString(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
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
  return getDepartureDates(tour).filter(Boolean).sort();
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
  if (/(未来7天|未来七天|近7天|近七天|最近|这周|本周|这几天)/.test(text)) {
    return new Date().toISOString().slice(0, 10);
  }

  return tours.find((tour) => tour.departureDate)?.departureDate;
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
      getEarliestDate(params.tours.flatMap((tour) => [
        tour.departureDate,
        ...(tour.departureDates || []),
        ...(tour.hotDepartureDates || []),
      ])) ||
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
    const destination = candidate.routeGroup || candidate.destination;
    if (!destination) continue;

    const relevance = (
      (candidate.matchStatus === 'match' ? 24 : candidate.matchStatus === 'soft_conflict' ? 12 : 4) +
      (candidate.isHot ? 6 : 0) +
      (shouldInspectDestinationWeather(corpus) ? 10 : 0) +
      (intent?.destinationHints?.length && destinationHintsMatchCorpus(intent.destinationHints, `${candidate.destination} ${candidate.title}`) ? 16 : 0) +
      (searchQuery && corpus.includes(searchQuery.toLowerCase()) ? 8 : 0)
    );
    const existing = grouped.get(destination) || {
      destination,
      score: 0,
      evidence: [],
      corpus,
    };

    existing.score = Math.max(existing.score, relevance);
    existing.corpus = `${existing.corpus} ${corpus}`.slice(0, 300);
    existing.evidence = uniqueStrings([
      ...existing.evidence,
      candidate.theme,
      ...candidate.tags.slice(0, 2),
      ...candidate.highlights.slice(0, 2),
    ]).slice(0, 6);
    grouped.set(destination, existing);
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
    advice.push('广东、海南和沿海线路要额外关注强降雨、雷暴和台风预警，海边、玩水和长时间暴晒项目不宜盲目优先。');
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
    forecastSummary: '本次未请求天气调研，推荐主要依据预算、时间、目的地和线路约束。',
    seasonAdvice: [],
    inferredFrom: [],
    role: 'departure',
    source: 'none',
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
      forecastSummary: '未匹配到可查询天气的目的地，使用季节和世界知识辅助判断。',
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
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query.toString()}`);
        if (!response.ok) throw new Error(`Weather API failed: ${response.status}`);

        const data = await response.json();
        const daily = data.daily;
        const maxTemps: number[] = daily?.temperature_2m_max ?? [];
        const minTemps: number[] = daily?.temperature_2m_min ?? [];
        const rainProbs: number[] = daily?.precipitation_probability_max ?? [];
        const maxTemp = Math.round(Math.max(...maxTemps));
        const minTemp = Math.round(Math.min(...minTemps));
        const maxRain = Math.round(Math.max(...rainProbs));

        return {
          forecastSummary: `${params.destination}未来7天约 ${minTemp}-${maxTemp}℃，最高降水概率约 ${maxRain}%。`,
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
      forecastSummary: '天气接口暂时不可用，使用季节和世界知识辅助判断。',
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
}) {
  const systemPrompt = [
    '你是旅行团推荐顾问，需要根据用户需求、天气、季节、目的地常识和给定旅行团候选列表推荐线路。',
    '只能推荐候选列表中真实存在的 tourId，不允许编造线路、价格、班期或服务。',
    'candidateTours 是压缩后的 API 推荐原语：schedule、tripDays、price、destination、theme、tags、highlights、semanticAtoms、experienceCategories、seasonalComfortAtoms、leisureLevel、routeGroup、matchStatus、conflictReasons 和 priceContext 都是判断依据。',
    '本地只负责提供原语、候选边界和硬约束审计；语义取舍由你结合用户需求、天气和线路原语完成。',
    'candidateTours 里的 matchStatus=match 表示完全匹配；soft_conflict/fallback 带有 conflictReasons，只能在没有足够 match 或需要说明取舍时靠后使用。',
    'routeAtlas 是全站线路地图，用来理解哪些区域/主题通常有哪些天数和价格；但最终 items 仍只能来自 candidateTours。',
    'auditContext 提供上一轮推荐摘要、有效候选池价格分布和业务知识；处理“便宜点、轻松点、再近点”等短句时，必须结合 auditContext 和 preferenceMemory 继承上下文。',
    '如果用户需求与全站线路地图明显冲突，例如预算或天数不现实，请在 summary 里说明取舍，并推荐最接近的真实候选。',
    '例如用户说“周五晚上出发的3日游”，应理解为 departureWeekdays 包含 5、hasEveningOrNightDeparture 为 true、tripDays 为 3。',
    '天气和世界知识只用于判断舒适度、风险和适配理由；线路事实必须来自候选列表和推荐原语，尤其要结合 experienceCategories 与 seasonalComfortAtoms 判断夏季闷热、暴雨或高温下的取舍。',
    '如果用户提到老人、儿童、轻松、怕累，应降低高强度、长途奔波和极端天气目的地优先级。',
    '如果天气或季节不适合，要在理由中说明风险，并优先推荐更稳妥的候选。',
    '每条 reason 必须引用 1-2 个 candidateTours 中存在的具体 semanticAtoms、highlights 或 title 事实，再说明它为什么适合本次需求；不要只写“价格低、班期多、性价比高、行程轻松”。',
    'summary 不要只给结论，至少要交代推荐方向、当前天气/季节判断，以及用户下单前最该注意的一件事。',
    '如果两个目的地玩法相近，但天气、花期、雨季、台风或风浪风险明显不同，可以明确说明“为什么这次推 A、不推 B”。',
    '当用户明确否定某类体验时，summary 和 reason 都不要把该体验包装成推荐点；如果候选池缺少替代品，应直接说明候选受限，而不是继续正向推荐被否定主题。',
    'summary 必须优先反映 weatherContext 的真实结论；如果已出现高温、闷热、暴雨或台风风险，不要再写成“春季踏青”这类泛化判断。',
    'weatherContext.destination、travelDate 和 inferredFrom 是从当前提问、近几轮对话、搜索词、筛选器、偏好记忆和候选线路池综合推断出的上下文；回答天气和季节时优先依赖这些上下文，不要只看最后一句字面。',
    '如果 inferredFrom 包含“默认出发地”，就把 weatherContext 当作广州出发天气和出行风险提示，不要把这份天气表述成所有候选目的地的实时天气。',
    'destinationWeatherInsights 是针对少数高相关、明显受天气或最佳观赏期影响的目的地补充查询结果。你应自行决定哪些结果值得引用，并利用世界知识判断是否处于更合适的观赏窗口。',
    '严格输出 JSON，不要 Markdown，不要额外解释。',
  ].join('\n');

  const userPayload = {
    task: `从 candidateTours 中选出所有适合的旅行团，按适合程度排序；只给前 ${MAX_AI_COMMENTARY_ITEMS} 条写 reason 和 matchedSignals，其余条目只需要 tourId 和 score。summary 要像顾问式总建议，至少覆盖推荐方向、天气/季节判断和注意事项。reason 要像直接回复用户的推荐理由，必须包含具体玩法/地点原子和本次需求取舍。`,
    outputSchema: {
      summary: '2到4句中文总建议：先说推荐方向，再说天气/季节判断，再补一条注意事项或替代逻辑',
      items: [
        {
          tourId: '候选列表里的 id',
          score: '0-100 的数字',
          reason: `仅前 ${MAX_AI_COMMENTARY_ITEMS} 条需要，2到3句中文推荐理由；必须点名 1-2 个 semanticAtoms/highlights/title 事实，并说明为什么适合本次需求、天气/季节取舍，以及用户要注意的风险；禁止只写低价、班期多、性价比高`,
          matchedSignals: `仅前 ${MAX_AI_COMMENTARY_ITEMS} 条需要，3到5个中文匹配信号，优先使用具体玩法/地点原子`,
        },
      ],
    },
    userNeed: params.userText,
    searchQuery: params.searchQuery,
    recentConversation: compactRecentConversation(params.messages),
    preferenceMemory: params.preferenceMemory,
    interpretedIntent: params.intent,
    weatherContext: params.weatherContext,
    destinationWeatherInsights: params.destinationWeatherInsights,
    routeAtlas: params.routeAtlas,
    auditContext: compactRecommendationAuditContext(params.auditContext),
    reasonQualityRules: [
      '必须具体：引用玩法/地点原子，例如沙扒湾、双月湾、森林氧吧、水上乐园、博物馆、冰世界。',
      '必须解释适配：把原子与预算、未来7天班期、天气、怕热/避雨/轻松等用户需求连起来。',
      '必须有取舍：温泉泡汤、高强度户外、海边风浪等天气敏感项要明确说风险，不要包装成无条件优点。',
      '能比较时就比较：如果用户本来想去海边，但某目的地近期风浪、强降雨或台风风险更高，可以直接说这次为什么改推另一个更稳的海边目的地。',
      '禁止空话：不要只写低价、热门、班期多、性价比高、自然风光生态、综合匹配。',
    ],
    candidateTours: params.candidates,
  };

  userPayload.task = `只从 candidateTours 中选出最适合的前 ${MAX_AI_OUTPUT_ITEMS} 个旅行团，按适合程度排序返回；不要返回更多 items。summary 必须写成顾问式总建议，交代推荐方向、天气/季节判断、注意事项，必要时说明为什么改推更稳妥的替代目的地。仅前 ${MAX_AI_COMMENTARY_ITEMS} 条写 reason 和 matchedSignals，其余条目只返回 tourId 和 score。reason 必须具体引用候选原语里的玩法/地点事实，并说明本次需求取舍。`;
  (userPayload.outputSchema as { itemCountLimit?: number }).itemCountLimit = MAX_AI_OUTPUT_ITEMS;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: JSON.stringify(userPayload) },
  ];
}

function buildIntentMessages(params: {
  userText: string;
  messages: AiRecommendationMessage[];
  searchQuery: string;
  preferenceMemory: AiPreferenceMemory | null;
  auditContext: RecommendationAuditContext;
}) {
  return [
    {
      role: 'system',
      content: [
        '你负责把旅行团自然语言需求理解成结构化意图。',
        '不要推荐线路，只抽取约束和偏好。',
        '如果用户这轮明确提出新的目的地或区域，优先把它视为覆盖旧目的地；预算、天数、出行风格等可从 existingPreferenceMemory 继承。',
        '如果用户本轮是“便宜点、再便宜、贵一点、轻松点、更多选择”等相对表达，不要丢弃上一轮上下文；用 refinementMode 表达它是在上一轮基础上收窄、放宽或换方向。',
        'budgetPriority 表示相对价格偏好：low=更便宜/性价比优先，balanced=均衡，premium=更舒适或高预算；不要用关键词硬猜，要结合 recentConversation 和 auditContext 判断。',
        'avoid 是用户明确不要、避开、排除或不考虑的语义对象；应抽成可和候选 title/theme/tags/highlights 对照的短词，不限于固定主题词。',
        'weekday 使用 0-6 表示周日到周六；周五是 5。',
        '如果用户说晚上、晚、夜发、夜间、周五晚，departureTimeOfDay 应为 evening 或 night。',
        '如果不确定就留 null 或空数组，不要硬猜。',
        '严格输出 JSON，不要 Markdown。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: JSON.stringify({
        outputSchema: {
          tripDays: '精确行程天数，数字或 null',
          tripDaysMin: '最少天数，数字或 null',
          tripDaysMax: '最多天数，数字或 null',
          departureWeekdays: '出发星期数组，0=周日，5=周五',
          departureTimeOfDay: 'morning|afternoon|evening|night|any|null',
          destinationHints: ['目的地词'],
          budgetMin: '最低预算或 null',
          budgetMax: '最高预算或 null',
          travelStyle: ['亲子、老人、轻松、徒步、海边等偏好'],
          mustHave: ['必须满足的条件'],
          avoid: ['需要避开的语义对象，例如温泉、漂流、爬山、购物、暴晒等短词'],
          weatherSensitivity: ['怕热、避雨、台风风险、避寒等'],
          budgetPriority: 'low|balanced|premium|null',
          refinementMode: 'new_search|refine_previous|broaden|replace_destination|null',
          confidence: '0-1',
        },
        userNeed: params.userText,
        searchQuery: params.searchQuery,
        existingPreferenceMemory: params.preferenceMemory,
        auditContext: compactRecommendationAuditContext(params.auditContext),
        recentConversation: compactRecentConversation(params.messages),
      }),
    },
  ];
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, '');
}

function getChatCompletionsUrl(baseUrl: string) {
  const normalized = normalizeBaseUrl(baseUrl);
  if (normalized.endsWith('/chat/completions')) return normalized;
  if (normalized.endsWith('/v1')) return `${normalized}/chat/completions`;
  return `${normalized}/v1/chat/completions`;
}

function parseAiJson(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI response is not JSON');
    return JSON.parse(match[0]);
  }
}

function emitProgress(
  callback: AiRecommendationRequest['onProgress'],
  progress: AiRecommendationProgress,
) {
  callback?.(progress);
}

export const __aiRecommendationTestHooks = {
  auditAiRecommendations,
  buildTourPrimitive,
  collectAvoidHints,
  compactCandidates,
  getPrimitiveConflictReasons,
  matchesActiveDateFilters,
  matchesDateWindow,
  mergeAiAndLocalRecommendations,
  mergeIntentWithMemory,
  normalizeIntent,
  resolvePromptDateWindow,
  shouldUseAiIntentExtraction,
  validateAiItems,
};

function validateAiItems(
  value: unknown,
  candidateTours: AiRecommendationCandidate[],
): AiRecommendationItem[] {
  const candidateIds = new Set(candidateTours.map((tour) => tour.id));
  const primitiveByTourId = new Map(candidateTours.map((tour) => [tour.id, buildTourPrimitive(tour)]));
  const rawItems = Array.isArray((value as { items?: unknown[] })?.items)
    ? (value as { items: unknown[] }).items
    : [];

  return rawItems
    .map((item) => item as Partial<AiRecommendationItem>)
    .filter((item) => item.tourId && candidateIds.has(item.tourId))
    .map((item, index) => ({
      tourId: String(item.tourId),
      score: Number.isFinite(Number(item.score)) ? Number(item.score) : 80 - index,
      reason: index < MAX_AI_COMMENTARY_ITEMS
        ? getConcreteAiReason(item.reason, primitiveByTourId.get(String(item.tourId)))
        : undefined,
      matchedSignals: index < MAX_AI_COMMENTARY_ITEMS
        ? getConcreteMatchedSignals(item.matchedSignals, primitiveByTourId.get(String(item.tourId)))
        : [],
    }));
}

function getConflictSeverity(reasons: string[]) {
  return reasons.reduce((severity, reason) => {
    if (reason.startsWith('命中需避开条件')) return severity + 120;
    if (reason.startsWith('目的地不匹配')) return severity + 60;
    if (reason.startsWith('价格高于') || reason.startsWith('价格低于')) return severity + 18;
    if (reason.startsWith('天数')) return severity + 14;
    if (reason.startsWith('缺少') || reason.startsWith('未识别')) return severity + 10;
    return severity + 8;
  }, 0);
}

function getAuditNote(reasons: string[]) {
  if (reasons.length === 0) return null;
  const visibleReasons = reasons.slice(0, 2).join('；');
  return `审计提示：${visibleReasons}`;
}

function auditAiRecommendations(
  aiItems: AiRecommendationItem[],
  localItems: AiRecommendationItem[],
  candidateTours: AiRecommendationCandidate[],
  intent: AiTravelIntent | null,
): AiRecommendationItem[] {
  const primitiveByTourId = new Map(candidateTours.map((tour) => [tour.id, buildTourPrimitive(tour)]));
  const auditedAiItems: AiRecommendationItem[] = [];

  for (const item of aiItems) {
    const primitive = primitiveByTourId.get(item.tourId);
    if (!primitive) continue;

    const conflictReasons = getPrimitiveConflictReasons(intent, primitive);
    const conflictSeverity = getConflictSeverity(conflictReasons);
    const auditNote = getAuditNote(conflictReasons);
    const score = Math.max(0, item.score - conflictSeverity);
    if (score <= 0) continue;

    auditedAiItems.push({
      ...item,
      score,
      reason: auditNote && item.reason
        ? `${item.reason}（${auditNote.replace('审计提示：', '')}）`
        : item.reason,
      matchedSignals: auditNote
        ? [auditNote, ...item.matchedSignals.filter((signal) => !signal.startsWith('审计提示'))].slice(0, 5)
        : item.matchedSignals,
    });
  }

  const auditedIds = new Set(auditedAiItems.map((item) => item.tourId));
  const supplementalItems = localItems
    .filter((item) => !auditedIds.has(item.tourId))
    .map((item) => {
      const primitive = primitiveByTourId.get(item.tourId);
      const conflictReasons = primitive ? getPrimitiveConflictReasons(intent, primitive) : [];
      const conflictSeverity = getConflictSeverity(conflictReasons);
      return {
        ...item,
        score: Math.max(0, item.score - conflictSeverity),
      };
    })
    .filter((item) => item.score > 0)
    .slice(0, MAX_AI_OUTPUT_ITEMS);

  return [...auditedAiItems, ...supplementalItems]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_AI_OUTPUT_ITEMS);
}

function normalizeIntent(value: unknown): AiTravelIntent | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as AiTravelIntent;
  return {
    tripDays: raw.tripDays ? Number(raw.tripDays) : null,
    tripDaysMin: raw.tripDaysMin ? Number(raw.tripDaysMin) : null,
    tripDaysMax: raw.tripDaysMax ? Number(raw.tripDaysMax) : null,
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
    avoid,
    weatherSensitivity: intent?.weatherSensitivity?.length
      ? intent.weatherSensitivity
      : memory?.weatherSensitivity || [],
    budgetMin: intent?.budgetMin ?? memory?.budgetMin ?? null,
    budgetMax: intent?.budgetMax ?? memory?.budgetMax ?? null,
    budgetPriority: intent?.budgetPriority ?? memory?.budgetPriority ?? null,
    tripDays: intent?.tripDays ?? memory?.tripDays ?? null,
    tripDaysMin: intent?.tripDaysMin ?? memory?.tripDaysMin ?? null,
    tripDaysMax: intent?.tripDaysMax ?? memory?.tripDaysMax ?? null,
    departureWeekdays: intent?.departureWeekdays?.length
      ? intent.departureWeekdays
      : memory?.departureWeekdays || [],
    departureTimeOfDay: normalizeDepartureTimeOfDay(intent?.departureTimeOfDay ?? memory?.departureTimeOfDay),
    refinementMode: intent?.refinementMode ?? memory?.refinementMode ?? null,
  };
}

function hasConcreteLocalIntent(intent: AiTravelIntent | null) {
  if (!intent) return false;
  return Boolean(
    intent.tripDays ||
    intent.tripDaysMin ||
    intent.tripDaysMax ||
    intent.departureWeekdays?.length ||
    intent.destinationHints?.length ||
    intent.budgetMax ||
    intent.budgetMin ||
    intent.travelStyle?.length ||
    intent.mustHave?.length ||
    intent.avoid?.length ||
    intent.weatherSensitivity?.length ||
    intent.budgetPriority,
  );
}

function shouldUseAiIntentExtraction(text: string, localIntent: AiTravelIntent | null) {
  const normalized = text.replace(/\s+/g, '');
  if (!normalized) return false;
  if (AVOID_EXPRESSION_PATTERN.test(normalized)) {
    return true;
  }
  if (hasConcreteLocalIntent(localIntent)) return false;
  return normalized.length > 18;
}

async function callAiApi(params: {
  config: AiProviderConfig;
  messages: ReturnType<typeof buildAiMessages> | ReturnType<typeof buildIntentMessages>;
  maxTokens?: number;
}) {
  const response = await fetch(getChatCompletionsUrl(params.config.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.config.apiKey}`,
    },
    body: JSON.stringify({
      model: params.config.model,
      messages: params.messages,
      temperature: 0.25,
      max_tokens: params.maxTokens ?? 2048,
      response_format: { type: 'json_object' },
      thinking: { type: 'disabled' },
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('AI API response missing message content');
  }

  return parseAiJson(content);
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

  const text = getLatestUserText(messages);
  const localIntent = inferLocalIntent(text);
  const inheritedPreferenceMemory = mergePreferenceMemory(preferenceMemory, localIntent);
  const localEffectiveIntent = mergeIntentWithMemory(localIntent, inheritedPreferenceMemory);
  const promptDateWindow = resolvePromptDateWindow(text);
  const localRecommendationText = buildEffectiveUserText(text, inheritedPreferenceMemory);
  const hasPromptDestination = Boolean(localIntent?.destinationHints?.length);
  const promptMatchesActiveDestination = hasPromptDestination && activeFilters.destination
    ? destinationHintsMatchCorpus(localIntent?.destinationHints, activeFilters.destination)
    : true;
  const filteredCandidates = candidateTours.filter((tour) => {
    const primitive = buildTourPrimitive(tour);
    if (primitiveMatchesAvoid(primitive, localEffectiveIntent?.avoid).length > 0) {
      return false;
    }
    if (
      activeFilters.destination &&
      promptMatchesActiveDestination &&
      !tour.destination.includes(activeFilters.destination)
    ) {
      return false;
    }
    if (activeFilters.source && tour.source !== activeFilters.source) return false;
    if (activeFilters.theme && tour.theme !== activeFilters.theme) return false;
    if (activeFilters.duration && activeFilters.duration !== 11 && tour.duration !== activeFilters.duration) return false;
    if (activeFilters.duration === 11 && tour.duration < 11) return false;
    if (activeFilters.minPrice !== null && tour.price < activeFilters.minPrice) return false;
    if (activeFilters.maxPrice !== null && tour.price > activeFilters.maxPrice) return false;
    if (!matchesActiveDateFilters(tour, activeFilters)) return false;
    if (!matchesDateWindow(tour, promptDateWindow)) return false;
    return true;
  });
  const hasActiveCandidateConstraint = Boolean(
    activeFilters.destination ||
    activeFilters.source ||
    activeFilters.theme ||
    activeFilters.duration ||
    activeFilters.minPrice !== null ||
    activeFilters.maxPrice !== null ||
    activeFilters.departureDate ||
    activeFilters.departureDateStart ||
    activeFilters.departureDateEnd ||
    promptDateWindow ||
    localEffectiveIntent?.avoid?.length,
  );
  const availableCandidates = filteredCandidates.length > 0 || hasActiveCandidateConstraint
    ? filteredCandidates
    : candidateTours;
  const localItems = localRecommendations(availableCandidates, localRecommendationText);
  const config = getResolvedAiConfig(aiConfig);
  const initialAuditContext = buildRecommendationAuditContext(
    availableCandidates,
    previousResult,
    localEffectiveIntent,
  );

  emitProgress(onProgress, {
    stage: config ? 'intent' : 'fallback',
    label: config ? '准备调用 AI' : '未配置 AI，改用本地推荐',
    detail: config
      ? `将从 ${availableCandidates.length} 条候选线路中理解需求并生成推荐。`
      : `正在按当前条件从 ${availableCandidates.length} 条候选线路中做规则匹配。`,
    progress: config ? 20 : 100,
    substeps: config
      ? withActiveSubstep(
          [
            { id: 'scope', label: '圈定候选范围' },
            { id: 'intent', label: '提取偏好和约束' },
            { id: 'handoff', label: '准备上下文补充' },
          ],
          'intent',
        )
      : withActiveSubstep(
          [
            { id: 'scope', label: '圈定候选范围' },
            { id: 'rules', label: '按规则筛选线路' },
            { id: 'fallback', label: '生成备用结果' },
          ],
          'rules',
        ),
  });

  if (availableCandidates.length === 0) {
    return {
      conversationId,
      summary: '按当前预算、时间和避开条件没有找到完全匹配的旅行团；建议放宽预算、出发时间或更换玩法方向。',
      items: [],
      generatedAt: new Date().toISOString(),
      source: 'local-preview',
      status: {
        mode: 'local-only',
        label: '没有完全匹配的候选',
        detail: '已停止 AI 调用，避免在无候选时继续产生调研成本。',
      },
      preferenceMemory: inheritedPreferenceMemory,
    };
  }

  if (!config) {
    return {
      conversationId,
      summary: '当前未配置 AI 接口，已先按目的地、预算、天数和行程强度做本地预匹配。',
      items: localItems,
      generatedAt: new Date().toISOString(),
      source: 'local-preview',
      status: {
        mode: 'local-only',
        label: '本次使用本地规则推荐',
        detail: `因为没有可用的 AI 配置，已直接筛出 ${localItems.length} 条候选线路。`,
      },
      preferenceMemory: inheritedPreferenceMemory,
    };
  }

  try {
    const shouldExtractIntentWithAi = shouldUseAiIntentExtraction(text, localIntent);
    const intentResponse = shouldExtractIntentWithAi
      ? await callAiApi({
          config,
          messages: buildIntentMessages({
            userText: text,
            messages,
            searchQuery,
            preferenceMemory: inheritedPreferenceMemory,
            auditContext: initialAuditContext,
          }),
          maxTokens: 768,
        })
      : localIntent;
    const intent = normalizeIntent(intentResponse);
    const nextPreferenceMemory = mergePreferenceMemory(inheritedPreferenceMemory, intent);
    const effectiveIntent = mergeIntentWithMemory(intent, nextPreferenceMemory);
    const effectiveUserText = buildEffectiveUserText(text, nextPreferenceMemory);
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
    const weatherContextPromise = useWeatherResearch
      ? fetchWeatherContext({
          text: effectiveUserText,
          messages,
          searchQuery,
          activeFilters,
          preferenceMemory: nextPreferenceMemory,
          tours: availableCandidates,
        })
      : Promise.resolve(buildNoWeatherContext());
    const routeAtlasPromise = Promise.resolve(buildRouteAtlas(availableCandidates, effectiveIntent));

    const weatherContext = await weatherContextPromise;
    const compactedCandidates = compactCandidates(
      availableCandidates,
      localItems,
      effectiveIntent,
      {
        budgetPriority: effectiveIntent?.budgetPriority,
        weatherSensitivity: effectiveIntent?.weatherSensitivity,
        weatherContext,
      },
    );
    const destinationWeatherCandidates = useWeatherResearch
      ? buildDestinationWeatherCandidates(
          compactedCandidates,
          searchQuery,
          effectiveIntent,
        )
      : [];
    const [destinationWeatherInsights, routeAtlas] = await Promise.all([
      Promise.all(
        destinationWeatherCandidates.map((candidate) =>
          fetchDestinationWeatherInsight({
            destination: candidate.destination,
            travelDate: weatherContext.travelDate,
            inferredFrom: ['候选目的地补充查询'],
            role: 'destination',
            queryReason: `该目的地天气和观赏期可能显著影响体验：${candidate.evidence.join(' / ')}`,
            corpus: candidate.corpus,
          }),
        ),
      ),
      routeAtlasPromise,
    ]);
    if (compactedCandidates.length === 0) {
      return {
        conversationId,
        summary: '按当前避开条件没有可推荐的候选线路；已避免继续调用 AI 生成不合适结果。',
        items: localItems,
        generatedAt: new Date().toISOString(),
        source: 'local-preview',
        status: {
          mode: 'local-only',
          label: '候选已被硬约束排除',
          detail: '本次没有可交给 AI 排序的合规候选，已返回本地筛选结果。',
        },
        preferenceMemory: nextPreferenceMemory,
      };
    }
    emitProgress(onProgress, {
      stage: 'ranking',
      label: '正在生成推荐结果',
      detail: `AI 正在对 ${compactedCandidates.length} 条高相关候选线路做排序和取舍。`,
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
      config,
      messages: buildAiMessages({
        userText: effectiveUserText,
        messages,
        candidates: compactedCandidates,
        routeAtlas,
        auditContext,
        weatherContext,
        destinationWeatherInsights,
        searchQuery,
        intent: effectiveIntent,
        preferenceMemory: nextPreferenceMemory,
      }),
      maxTokens: 3000,
    });
    const compactedCandidateIds = new Set(compactedCandidates.map((candidate) => candidate.id));
    const compactedCandidateTours = availableCandidates.filter((candidate) => compactedCandidateIds.has(candidate.id));
    const compactedLocalItems = localItems.filter((item) => compactedCandidateIds.has(item.tourId));
    const aiItems = auditAiRecommendations(
      validateAiItems(aiResponse, compactedCandidateTours),
      compactedLocalItems,
      compactedCandidateTours,
      effectiveIntent,
    );

    if (aiItems.length === 0) {
      throw new Error('AI returned no valid tour ids');
    }

    const mergedItems = mergeAiAndLocalRecommendations(aiItems, compactedLocalItems);
    emitProgress(onProgress, {
      stage: 'completed',
      label: '推荐结果已生成',
      detail: `已完成排序，并置顶 ${mergedItems.length} 条候选线路。`,
      progress: 100,
      substeps: withActiveSubstep(
        [
          { id: 'ranked', label: '排序结果已完成' },
          { id: 'top', label: '置顶匹配线路' },
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
        candidateTours: compactedCandidateTours,
        weatherContext,
        destinationWeatherInsights,
        intent: effectiveIntent,
      }),
      items: mergedItems,
      generatedAt: new Date().toISOString(),
      source: 'ai-api',
      status: {
        mode: 'ai',
        label: 'AI 已完成推荐',
        detail: `已结合需求理解、天气和候选线路排序，输出 ${mergedItems.length} 条结果。`,
      },
      preferenceMemory: nextPreferenceMemory,
    };
  } catch {
    emitProgress(onProgress, {
      stage: 'fallback',
      label: 'AI 暂不可用，已切换备用方案',
      detail: `正在按本地规则从 ${availableCandidates.length} 条候选线路里给出可用结果。`,
      progress: 100,
      substeps: withActiveSubstep(
        [
          { id: 'detect', label: '检测 AI 不可用' },
          { id: 'rules', label: '切换本地规则' },
          { id: 'return', label: '返回备用推荐' },
        ],
        'return',
      ),
    });

    return {
      conversationId,
      summary: 'AI 接口暂时不可用，已先使用本地规则按需求做预匹配。',
      items: localItems,
      generatedAt: new Date().toISOString(),
      source: 'local-preview',
      status: {
        mode: 'fallback',
        label: 'AI 未完成，本次已降级到本地推荐',
        detail: `为了不中断结果展示，已先返回 ${localItems.length} 条本地规则筛选结果。`,
      },
      preferenceMemory: inheritedPreferenceMemory,
    };
  }
}
